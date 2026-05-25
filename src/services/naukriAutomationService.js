import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { env } from '../config/env.js';
import { logger } from '../modules/logging/logger.js';
import { JobApplication } from '../models/JobApplication.js';
import { defaultNaukriFilters, scoreNaukriJob } from './jobScoringService.js';
import { emailNaukriSessionReport } from './reportService.js';

const MANUAL_MESSAGE = 'Manual login/action required.';
const DEFAULT_SESSION_TARGETS = {
  minScanned: 25,
  minSkipped: 30,
  minApplied: 10,
  maxApplied: 25,
  maxPages: 8
};
const NAUKRI_USER_PROFILE = {
  noticePeriod: '3 Months',
  currentLocation: 'Noida / Delhi NCR',
  preferredLocations: ['Noida', 'Remote', 'Hybrid'],
  experience: '8 years',
  expectedCtc: '22 LPA to 24 LPA'
};
const active = {
  running: false,
  sessionId: null,
  status: 'idle',
  message: 'Idle',
  continueResolver: null,
  context: null,
  stopRequested: false,
  report: null
};
const activeSessions = new Map();

function stateFor(sessionId) {
  return activeSessions.get(String(sessionId)) || active;
}

function isNaukriHost(rawUrl) {
  try {
    const url = new URL(rawUrl);
    return /(^|\.)naukri\.com$/i.test(url.hostname);
  } catch {
    return false;
  }
}

function buildSearchUrl(filters) {
  const keyword = encodeURIComponent((filters.titles || []).join(' OR '));
  const location = encodeURIComponent((filters.locations || []).join(', '));
  return `https://www.naukri.com/jobs-in-india?k=${keyword}&l=${location}&experience=${filters.experienceMin}`;
}

function titleFromUrl(rawUrl) {
  try {
    const pathPart = new URL(rawUrl).pathname.split('/').filter(Boolean)[0] || '';
    return decodeURIComponent(pathPart)
      .replace(/^job-listings-?/i, '')
      .replace(/-\d{6,}.*/i, '')
      .replace(/-/g, ' ')
      .replace(/\bdot\s+net\b/gi, '.NET')
      .replace(/\baws\b/gi, 'AWS')
      .replace(/\bapi\b/gi, 'API')
      .replace(/\bsql\b/gi, 'SQL')
      .replace(/\s+/g, ' ')
      .trim();
  } catch {
    return '';
  }
}

function detailsFromUrl(rawUrl) {
  const decoded = decodeURIComponent(rawUrl).replace(/-/g, ' ');
  const experience = decoded.match(/\b\d+\s*to\s*\d+\s*years\b/i)?.[0]?.replace(/\bto\b/i, '-') || '';
  const locationMatches = [...decoded.matchAll(/\b(noida|delhi ncr|new delhi|gurugram|gurgaon|remote|hybrid|pune|bengaluru|hyderabad|chennai|mumbai)\b/gi)]
    .map((match) => match[0]);
  return {
    title: titleFromUrl(rawUrl),
    location: [...new Set(locationMatches)].join(', '),
    experience
  };
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function pidIsAlive(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error.code === 'ESRCH') return false;
    return true;
  }
}

async function removeProfileSingletonFiles(profilePath) {
  const names = ['SingletonLock', 'SingletonCookie', 'SingletonSocket', 'RunningChromeVersion'];
  await Promise.all(names.map((name) => fs.unlink(path.join(profilePath, name)).catch(() => null)));
}

async function ensureProfileAvailable(profilePath) {
  const lockPath = path.join(profilePath, 'SingletonLock');
  const lockTarget = await fs.readlink(lockPath).catch(() => '');
  const pid = Number(lockTarget.match(/-(\d+)$/)?.[1] || 0);

  if (!lockTarget) return;

  if (pidIsAlive(pid)) {
    throw new Error(
      `Chrome profile is already in use by process ${pid}. Close the Naukri Chrome window for this user, then click Start Automation again. Profile: ${profilePath}`
    );
  }

  logger.warn({ profilePath, lockTarget }, 'Removing stale Chrome profile singleton lock');
  await removeProfileSingletonFiles(profilePath);
}

function cleanLaunchError(error) {
  const message = String(error?.message || error);
  if (/ProcessSingleton|SingletonLock|profile directory/i.test(message)) {
    return 'Chrome profile is already in use. Close the existing Naukri Chrome window for this user, then start automation again.';
  }
  return message;
}

async function screenshot(page, sessionId, label) {
  const dir = path.resolve('data/screenshots/naukri', String(sessionId));
  await ensureDir(dir);
  const file = path.join(dir, `${Date.now()}-${label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`);
  await page.screenshot({ path: file, fullPage: true }).catch(() => null);
  return file;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function pageSignals(page) {
  const title = await page.title().catch(() => '');
  const text = await page.locator('body').innerText({ timeout: 3000 }).catch(() => '');
  const signal = `${title}\n${text}`;
  if (/access denied|captcha|verify you are human|cloudflare|attention required|otp|one time password|google.*verify|2-step verification/i.test(signal)) {
    return signal.match(/access denied/i)
      ? 'Access Denied detected.'
      : 'CAPTCHA, OTP, login verification, or manual security step detected.';
  }
  return '';
}

async function waitForManualAction(page, sessionId, reason) {
  const state = stateFor(sessionId);
  if (state.stopRequested) throw new Error('Stopped by user.');
  state.status = 'manual_required';
  state.message = `${MANUAL_MESSAGE} ${reason}`;
  await JobApplication.updateSession(sessionId, {
    status: 'manual_required',
    current_message: state.message,
    manual_required_count: 1
  });
  await screenshot(page, sessionId, 'manual-required');
  logger.warn({ sessionId, reason }, 'Naukri automation paused for manual action');

  await new Promise((resolve) => {
    state.continueResolver = resolve;
  });

  state.continueResolver = null;
  if (state.stopRequested) throw new Error('Stopped by user.');
  state.status = 'running';
  state.message = 'Manual action confirmed. Resuming automation.';
  await JobApplication.updateSession(sessionId, {
    status: 'running',
    current_message: state.message
  });
}

async function ensureLoggedIn(page, sessionId) {
  await page.goto('https://www.naukri.com/', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(2000);

  const signal = await pageSignals(page);
  if (signal) await waitForManualAction(page, sessionId, signal);

  const body = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
  if (/login|register/i.test(body) && !/logout|my naukri|profile performance|recommended jobs/i.test(body)) {
    await page.goto('https://www.naukri.com/nlogin/login', { waitUntil: 'domcontentloaded', timeout: 60_000 }).catch(() => null);
    await waitForManualAction(page, sessionId, 'Please log in manually in the opened Chrome window, including Google/Gmail verification if Naukri asks.');
  }
}

async function extractJobCards(page) {
  return page.locator('a[href*="naukri.com"]').evaluateAll((nodes) => {
    const seen = new Set();
    function titleFromHref(href) {
      try {
        const pathPart = new URL(href).pathname.split('/').filter(Boolean)[0] || '';
        return decodeURIComponent(pathPart)
          .replace(/^job-listings-?/i, '')
          .replace(/-\d{6,}.*/i, '')
          .replace(/-/g, ' ')
          .replace(/\bdot\s+net\b/gi, '.NET')
          .replace(/\baws\b/gi, 'AWS')
          .replace(/\s+/g, ' ')
          .trim();
      } catch {
        return '';
      }
    }
    function detailsFromHref(href) {
      const decoded = decodeURIComponent(href).replace(/-/g, ' ');
      const experience = decoded.match(/\b\d+\s*to\s*\d+\s*years\b/i)?.[0]?.replace(/\bto\b/i, '-') || '';
      const location = [...new Set([...decoded.matchAll(/\b(noida|delhi ncr|new delhi|gurugram|gurgaon|remote|hybrid|pune|bengaluru|hyderabad|chennai|mumbai)\b/gi)].map((match) => match[0]))].join(', ');
      return { experience, location };
    }
    return nodes
      .map((node) => {
        const href = node.href || '';
        const card = node.closest('article, .srp-jobtuple-wrapper, .jobTuple, .cust-job-tuple, li, div') || node;
        const text = (card.innerText || node.innerText || node.textContent || '').replace(/\s+/g, ' ').trim();
        const title = (node.innerText || node.textContent || '').replace(/\s+/g, ' ').trim() || titleFromHref(href);
        const details = detailsFromHref(href);
        const experience = text.match(/\b\d+\s*[-–]\s*\d+\s*(?:Yrs|Years|Yr)\b/i)?.[0] || details.experience;
        const salary = text.match(/\b\d+(?:\.\d+)?\s*[-–]\s*\d+(?:\.\d+)?\s*(?:Lacs?|Lakhs?|LPA)\b/i)?.[0] || '';
        const location = text.match(/Noida|Delhi NCR|New Delhi|Remote|Hybrid|Gurgaon|Gurugram|Delhi|India/i)?.[0] || details.location;
        const posted = text.match(/(?:\d+\s+days?\s+ago|Just now|Today|Few hours ago)/i)?.[0] || '';
        const skills = [...new Set((text.match(/\.NET Core|ASP\.NET Core|Web API|SQL Server|AWS|Lambda|S3|JavaScript|Angular|Node\.js|C#|Microservices/gi) || []))];
        return {
          job_url: href,
          title,
          company: '',
          location,
          experience,
          salary,
          posted_date: posted,
          skills,
          rawText: text
        };
      })
      .filter((job) => {
        if (!job.job_url || seen.has(job.job_url)) return false;
        seen.add(job.job_url);
        return /\/job-listings-/i.test(job.job_url) && /developer|engineer|dot|\.net|aws|software|fullstack|backend|cloud/i.test(job.job_url + ' ' + job.title + ' ' + job.rawText);
      })
      .slice(0, 60);
  });
}

async function enrichJobDetails(page, sessionId, job) {
  await page.goto(job.job_url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(1500);
  const signal = await pageSignals(page);
  if (signal) {
    await waitForManualAction(page, sessionId, signal);
    const afterSignal = await pageSignals(page);
    if (afterSignal) return { ...job, manualReason: afterSignal };
  }
  const text = await page.locator('body').innerText({ timeout: 6000 }).catch(() => '');
  const urlDetails = detailsFromUrl(job.job_url);
  const h1 = await page.locator('h1').first().innerText({ timeout: 2000 }).catch(() => '');
  const experience = text.match(/\b\d+\s*[-–]\s*\d+\s*(?:Yrs|Years|Yr)\b/i)?.[0] || job.experience || urlDetails.experience;
  const salary = text.match(/\b\d+(?:\.\d+)?\s*[-–]\s*\d+(?:\.\d+)?\s*(?:Lacs?|Lakhs?|LPA)\b/i)?.[0] || job.salary;
  const location = text.match(/Noida|Delhi NCR|New Delhi|Remote|Hybrid|Gurgaon|Gurugram|Delhi/i)?.[0] || job.location || urlDetails.location;
  const skills = [...new Set((text.match(/\.NET Core|ASP\.NET Core|Web API|SQL Server|AWS|Lambda|S3|JavaScript|Angular|Node\.js|C#|Microservices|REST API|ASP\.NET|\.NET/gi) || job.skills || []))];
  const company = await page.locator('a[href*="company"], .styles_jd-header-comp-name__MvqAI, .jd-header-comp-name').first().innerText({ timeout: 2000 }).catch(() => job.company || '');
  return {
    ...job,
    title: h1 || job.title || urlDetails.title,
    company,
    location,
    experience,
    salary,
    skills,
    description: text.slice(0, 4000),
    rawText: `${job.rawText || ''} ${text}`
  };
}

async function applyToJob(page, sessionId, job) {
  if (!isNaukriHost(job.job_url)) {
    return { status: 'skipped', reason: 'Unsafe or unknown external site.' };
  }

  await page.goto(job.job_url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(1800);

  const signal = await pageSignals(page);
  if (signal) {
    await waitForManualAction(page, sessionId, signal);
    const afterSignal = await pageSignals(page);
    if (afterSignal) return { status: 'manual_required', reason: afterSignal };
  }

  const alreadyApplied = await page.getByText(/already applied|you have applied|application sent/i).count().catch(() => 0);
  if (alreadyApplied) return { status: 'skipped', reason: 'Already applied.' };

  const applyButton = page.getByRole('button', { name: /^apply$/i }).or(page.getByText(/^apply$/i));
  const applyCount = await applyButton.count().catch(() => 0);
  if (!applyCount) return { status: 'manual_required', reason: 'Apply button not found or page requires manual review.' };

  await applyButton.first().click({ timeout: 10_000 });
  await page.waitForTimeout(1500);

  const postClickSignal = await pageSignals(page);
  if (postClickSignal) {
    await waitForManualAction(page, sessionId, postClickSignal);
    return { status: 'manual_required', reason: postClickSignal };
  }

  const pageText = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
  if (/question|answer|required|expected ctc|notice period|custom/i.test(pageText) && !/applied|application sent/i.test(pageText)) {
    return handleNaukriApplyQuestions(page, job.userProfile || NAUKRI_USER_PROFILE, sessionId);
  }

  if (/applied|application sent|successfully applied/i.test(pageText)) {
    return { status: 'applied', reason: 'Easy Apply completed.' };
  }

  return { status: 'manual_required', reason: 'Unable to verify final submission; manual review required.' };
}

async function getApplyModal(page) {
  const modalSelectors = [
    '[role="dialog"]:visible',
    '.modal:visible',
    '.apply-popup:visible',
    '[class*="modal"]:visible',
    '[class*="popup"]:visible',
    '[class*="chatbot"]:visible',
    '[class*="question"]:visible'
  ];
  for (const selector of modalSelectors) {
    const locator = page.locator(selector).last();
    if (await locator.count().catch(() => 0)) return locator;
  }
  return page.locator('body');
}

async function readQuestionText(modal) {
  const text = await modal.innerText({ timeout: 3000 }).catch(() => '');
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  return lines.find((line) => /\?|notice|location|experience|ctc|salary|preferred|current/i.test(line)) || lines[0] || text.slice(0, 240);
}

function answerForQuestion(question, userProfile) {
  const normalized = question.toLowerCase();
  if (/notice|join|joining|available/i.test(normalized)) {
    return {
      value: userProfile.noticePeriod,
      alternatives: ['3 Months', '3 months', '90 days', 'More than 2 months', 'Serving notice period']
    };
  }
  if (/current.*location|where.*located|your location/i.test(normalized)) {
    return {
      value: userProfile.currentLocation,
      alternatives: ['Noida', 'Delhi NCR', 'New Delhi', 'Gurugram', 'Gurgaon']
    };
  }
  if (/preferred.*location|work location|location preference/i.test(normalized)) {
    return {
      value: userProfile.preferredLocations.join(' / '),
      alternatives: userProfile.preferredLocations
    };
  }
  if (/experience|years/i.test(normalized)) {
    return {
      value: userProfile.experience,
      alternatives: ['8 years', '8 Years', '8', '7-9 years', '6-9 years']
    };
  }
  if (/expected.*ctc|expected.*salary|salary expectation|ctc/i.test(normalized)) {
    return {
      value: userProfile.expectedCtc,
      alternatives: ['22 LPA', '23 LPA', '24 LPA', '22-24 LPA', '22 Lacs', '24 Lacs']
    };
  }
  return null;
}

async function clickAnswerOption(page, modal, answer) {
  const values = [answer.value, ...(answer.alternatives || [])].filter(Boolean);
  for (const value of values) {
    const exact = new RegExp(`^\\s*${escapeRegex(value)}\\s*$`, 'i');
    const label = modal.locator('label, span, div, li, p').filter({ hasText: exact }).first();
    if (await label.count().catch(() => 0)) {
      await label.click({ timeout: 5000 });
      await page.waitForTimeout(700);
      await dispatchCheckedRadioEvents(page);
      return value;
    }

    const partial = modal.getByText(new RegExp(escapeRegex(value), 'i')).first();
    if (await partial.count().catch(() => 0)) {
      await partial.click({ timeout: 5000 });
      await page.waitForTimeout(700);
      await dispatchCheckedRadioEvents(page);
      return value;
    }

    const radio = modal.getByRole('radio', { name: new RegExp(escapeRegex(value), 'i') }).first();
    if (await radio.count().catch(() => 0)) {
      await radio.click({ timeout: 5000 });
      await page.waitForTimeout(700);
      await dispatchCheckedRadioEvents(page);
      return value;
    }
  }
  return '';
}

async function dispatchCheckedRadioEvents(page) {
  await page.evaluate(() => {
    for (const radio of document.querySelectorAll('input[type="radio"]:checked, input[type="checkbox"]:checked')) {
      radio.dispatchEvent(new Event('input', { bubbles: true }));
      radio.dispatchEvent(new Event('change', { bubbles: true }));
      radio.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }
  }).catch(() => null);
}

async function clickNextApplyButton(page, modal) {
  const buttonNames = [
    /^submit$/i,
    /^save$/i,
    /^continue$/i,
    /^next$/i,
    /^apply$/i,
    /^done$/i,
    /submit application/i,
    /save and continue/i,
    /proceed/i,
    /confirm/i
  ];

  for (let waitAttempt = 0; waitAttempt < 12; waitAttempt += 1) {
    for (const name of buttonNames) {
      const scopes = [modal, page];
      for (const scope of scopes) {
        const button = scope.getByRole('button', { name }).last();
        if (!(await button.count().catch(() => 0))) continue;
        const visible = await button.isVisible().catch(() => false);
        const disabled = await button.isDisabled().catch(() => true);
        if (visible && !disabled) {
          await button.scrollIntoViewIfNeeded().catch(() => null);
          await button.click({ timeout: 8000 });
          await page.waitForTimeout(1000);
          return name.toString();
        }
      }
    }

    const domClicked = await page.evaluate(() => {
      const labels = /submit|save|continue|apply|done|next|proceed|confirm/i;
      const candidates = [...document.querySelectorAll('button, input[type="submit"], [role="button"], .btn, [class*="btn"], [class*="Button"], [class*="submit"], [class*="apply"], [class*="continue"], [class*="save"]')];
      const visible = (element) => {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
      };
      const enabled = (element) => !element.disabled && element.getAttribute('aria-disabled') !== 'true' && !/disabled/i.test(element.className || '');
      const candidate = candidates.find((element) => visible(element) && enabled(element) && labels.test(element.innerText || element.value || element.getAttribute('aria-label') || ''));
      if (!candidate) return false;
      candidate.scrollIntoView({ block: 'center', inline: 'center' });
      candidate.click();
      return true;
    }).catch(() => false);
    if (domClicked) {
      await page.waitForTimeout(1000);
      return 'custom button';
    }

    await page.waitForTimeout(500);
  }

  await page.keyboard.press('Enter').catch(() => null);
  await page.waitForTimeout(1000);
  return 'Enter key';
}

async function handleNaukriApplyQuestions(page, userProfile, sessionId) {
  for (let step = 1; step <= 8; step += 1) {
    const signal = await pageSignals(page);
    if (signal) {
      await waitForManualAction(page, sessionId, signal);
    }

    const bodyText = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
    if (/applied|application sent|successfully applied/i.test(bodyText)) {
      const shot = await screenshot(page, sessionId, `naukri-question-success-${step}`);
      logger.info({ sessionId, step, screenshot: shot }, 'Naukri apply question flow completed');
      return { status: 'applied', reason: 'Easy Apply completed after answering Naukri questions.' };
    }

    const modal = await getApplyModal(page);
    const question = await readQuestionText(modal);
    const shot = await screenshot(page, sessionId, `naukri-question-${step}`);
    logger.info({ sessionId, step, question, screenshot: shot }, 'Naukri apply question detected');

    const answer = answerForQuestion(question, userProfile);
    if (!answer) {
      await waitForManualAction(page, sessionId, `Unknown Naukri question: "${question}". Please answer manually, then click Continue After Manual Action.`);
      const clicked = await clickNextApplyButton(page, await getApplyModal(page));
      logger.info({ sessionId, step, question, clicked }, 'Naukri unknown question resumed after manual answer');
      continue;
    }

    const selected = await clickAnswerOption(page, modal, answer);
    if (!selected) {
      await waitForManualAction(page, sessionId, `Could not find a matching option for "${question}". Please answer manually, then click Continue After Manual Action.`);
      const clicked = await clickNextApplyButton(page, await getApplyModal(page));
      logger.info({ sessionId, step, question, clicked }, 'Naukri question resumed after manual option selection');
      continue;
    }

    logger.info({ sessionId, step, question, answer: selected }, 'Naukri question answer selected');
    await page.waitForTimeout(800);
    const clicked = await clickNextApplyButton(page, modal);
    const afterShot = await screenshot(page, sessionId, `naukri-question-${step}-clicked`);
    logger.info({ sessionId, step, question, answer: selected, clicked, screenshot: afterShot }, 'Naukri question submit/continue clicked');
  }

  return { status: 'manual_required', reason: 'Naukri question flow did not finish after multiple steps.' };
}

async function clickUserConfirmedSubmit(page) {
  const radioState = await page.evaluate(() => {
    const checked = [...document.querySelectorAll('input[type="radio"]')].filter((item) => item.checked);
    const radios = [...document.querySelectorAll('input[type="radio"]')];
    return { radioCount: radios.length, checkedCount: checked.length };
  }).catch(() => ({ radioCount: 0, checkedCount: 0 }));

  if (radioState.radioCount && !radioState.checkedCount) {
    return false;
  }

  await page.evaluate(() => {
    for (const radio of document.querySelectorAll('input[type="radio"]:checked')) {
      radio.dispatchEvent(new Event('input', { bubbles: true }));
      radio.dispatchEvent(new Event('change', { bubbles: true }));
      radio.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }
  }).catch(() => null);
  await page.waitForTimeout(500);

  const buttonNames = [
    /^submit$/i,
    /^save$/i,
    /^continue$/i,
    /^apply$/i,
    /^done$/i,
    /^next$/i,
    /submit application/i,
    /save and continue/i,
    /proceed/i,
    /confirm/i
  ];

  for (const name of buttonNames) {
    const button = page.getByRole('button', { name });
    const count = await button.count().catch(() => 0);
    if (!count) continue;

    for (let index = 0; index < Math.min(count, 3); index += 1) {
      const candidate = button.nth(index);
      const disabled = await candidate.isDisabled().catch(() => true);
      const visible = await candidate.isVisible().catch(() => false);
      if (visible && !disabled) {
        await candidate.click({ timeout: 10_000 });
        await page.waitForTimeout(1800);
        return true;
      }
    }
  }

  const textButtons = page.locator('button, input[type="submit"], [role="button"]').filter({
    hasText: /submit|save|continue|apply|done|next|proceed|confirm/i
  });
  const count = await textButtons.count().catch(() => 0);
  for (let index = 0; index < Math.min(count, 5); index += 1) {
    const candidate = textButtons.nth(index);
    const disabled = await candidate.isDisabled().catch(() => true);
    const visible = await candidate.isVisible().catch(() => false);
    if (visible && !disabled) {
      await candidate.click({ timeout: 10_000 });
      await page.waitForTimeout(1800);
      return true;
    }
  }

  const domClicked = await page.evaluate(() => {
    const labels = /submit|save|continue|apply|done|next|proceed|confirm/i;
    const candidates = [...document.querySelectorAll('button, input[type="submit"], [role="button"], .btn, [class*="btn"], [class*="Button"], [class*="submit"], [class*="apply"], [class*="continue"], [class*="save"]')];
    const visible = (element) => {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
    };
    const enabled = (element) => !element.disabled && element.getAttribute('aria-disabled') !== 'true' && !/disabled/i.test(element.className || '');
    const preferred = candidates.find((element) => visible(element) && enabled(element) && labels.test(element.innerText || element.value || element.getAttribute('aria-label') || ''));
    if (preferred) {
      preferred.scrollIntoView({ block: 'center', inline: 'center' });
      preferred.click();
      return true;
    }
    const footerCandidate = candidates
      .filter((element) => visible(element) && enabled(element))
      .sort((a, b) => b.getBoundingClientRect().bottom - a.getBoundingClientRect().bottom)[0];
    if (footerCandidate) {
      footerCandidate.scrollIntoView({ block: 'center', inline: 'center' });
      footerCandidate.click();
      return true;
    }
    return false;
  }).catch(() => false);
  if (domClicked) {
    await page.waitForTimeout(1800);
    return true;
  }

  await page.keyboard.press('Enter').catch(() => null);
  await page.waitForTimeout(1800);
  const text = await page.locator('body').innerText({ timeout: 3000 }).catch(() => '');
  return /applied|application sent|successfully applied|submitted/i.test(text);
}

function resolveTargets(options = {}) {
  return {
    minScanned: Number(options.minScanned || DEFAULT_SESSION_TARGETS.minScanned),
    minSkipped: Number(options.minSkipped || DEFAULT_SESSION_TARGETS.minSkipped),
    minApplied: Number(options.minApplied || options.targetMin || DEFAULT_SESSION_TARGETS.minApplied),
    maxApplied: Number(options.maxApplied || options.targetMax || DEFAULT_SESSION_TARGETS.maxApplied),
    maxPages: Number(options.maxPages || DEFAULT_SESSION_TARGETS.maxPages)
  };
}

function targetsMet(report, targets) {
  const summary = report.summary || {};
  return (
    summary.totalScanned >= targets.minScanned &&
    summary.totalSkipped >= targets.minSkipped &&
    summary.totalApplied >= targets.minApplied
  );
}

function naukriBrowserLaunchOptions() {
  return {
    ...(env.NAUKRI_BROWSER_CHANNEL ? { channel: env.NAUKRI_BROWSER_CHANNEL } : {}),
    headless: env.PLAYWRIGHT_HEADLESS,
    viewport: { width: 1365, height: 900 },
    slowMo: 120
  };
}

async function goToNextResultsPage(page) {
  const next = page
    .locator('a, button')
    .filter({ hasText: /next/i })
    .last();
  const count = await next.count().catch(() => 0);
  if (!count) return false;

  const disabled = await next.getAttribute('aria-disabled').catch(() => null);
  const className = await next.getAttribute('class').catch(() => '');
  if (disabled === 'true' || /disabled/i.test(className || '')) return false;

  await next.click({ timeout: 10_000 });
  await page.waitForLoadState('domcontentloaded', { timeout: 30_000 }).catch(() => null);
  await page.waitForTimeout(1800);
  return true;
}

function assertNotStopped(state) {
  if (state.stopRequested) throw new Error('Stopped by user.');
}

async function updateCounts(sessionId) {
  const report = await JobApplication.buildReport(sessionId);
  await JobApplication.updateSession(sessionId, {
    scanned_count: report.summary.totalScanned,
    applied_count: report.summary.totalApplied,
    skipped_count: report.summary.totalSkipped,
    failed_count: report.summary.totalFailed,
    manual_required_count: report.summary.totalManualRequired,
    report
  });
  active.report = report;
  return report;
}

export async function runNaukriAutomationSession(session, options = {}) {
  const filters = defaultNaukriFilters(options.filters || {});
  const browserProfilePath = options.browserProfilePath || env.NAUKRI_BROWSER_PROFILE_PATH;
  const userProfile = options.userProfile || NAUKRI_USER_PROFILE;
  const targets = resolveTargets(options);
  const state = options.state || active;
  let context;

  activeSessions.set(String(session.id), state);
  state.running = true;
  state.status = 'running';
  state.sessionId = session.id;
  state.stopRequested = false;
  state.context = null;
  state.message = 'Opening browser with persistent Naukri profile.';

  try {
    await ensureDir(browserProfilePath);
    await ensureProfileAvailable(browserProfilePath);
    await JobApplication.updateSession(session.id, { status: 'running', current_message: state.message });
    try {
      context = await chromium.launchPersistentContext(browserProfilePath, naukriBrowserLaunchOptions());
    } catch (error) {
      if (/ProcessSingleton|SingletonLock|profile directory/i.test(String(error.message || ''))) {
        await ensureProfileAvailable(browserProfilePath);
      }
      context = await chromium.launchPersistentContext(browserProfilePath, naukriBrowserLaunchOptions());
    }
    state.context = context;
    const page = context.pages()[0] || (await context.newPage());

    assertNotStopped(state);
    await ensureLoggedIn(page, session.id);
    assertNotStopped(state);
    state.message = 'Searching Naukri jobs with selected filters.';
    await JobApplication.updateSession(session.id, { current_message: state.message });
    await page.goto(buildSearchUrl(filters), { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(2500);

    const seenUrls = new Set();
    for (let pageNumber = 1; pageNumber <= targets.maxPages; pageNumber += 1) {
      assertNotStopped(state);
      state.message = `Scanning Naukri result page ${pageNumber}. Targets: scan ${targets.minScanned}+, skip ${targets.minSkipped}+, apply ${targets.minApplied}+.`;
      await JobApplication.updateSession(session.id, { current_message: state.message });

      const signal = await pageSignals(page);
      if (signal) await waitForManualAction(page, session.id, signal);

      const cards = (await extractJobCards(page)).filter((job) => {
        if (seenUrls.has(job.job_url)) return false;
        seenUrls.add(job.job_url);
        return true;
      });
      logger.info({ sessionId: session.id, pageNumber, count: cards.length }, 'Naukri job cards scanned');

      for (const job of cards) {
        assertNotStopped(state);
        const progress = await updateCounts(session.id);
        if (targetsMet(progress, targets)) break;

        const enrichedJob = await enrichJobDetails(page, session.id, job);
        if (enrichedJob.manualReason) {
          await JobApplication.recordAction(session.id, {
            ...enrichedJob,
            score: 0,
            status: 'manual_required',
            reason: enrichedJob.manualReason
          });
          continue;
        }
        const score = scoreNaukriJob(enrichedJob, filters);
        const baseAction = {
          ...enrichedJob,
          userProfile,
          score: score.score,
          skills: score.matchedSkills
        };

        if (!score.accepted) {
          await JobApplication.recordAction(session.id, {
            ...baseAction,
            status: 'skipped',
            reason: score.reasons.join('; ') || 'Score below 60%.'
          });
          continue;
        }

        const latest = await updateCounts(session.id);
        if (latest.summary.totalApplied >= targets.maxApplied) {
          await JobApplication.recordAction(session.id, {
            ...baseAction,
            status: 'skipped',
            reason: `Session application safety cap reached (${targets.maxApplied}).`
          });
          continue;
        }

        try {
          const result = await applyToJob(page, session.id, { ...enrichedJob, userProfile });
          await JobApplication.recordAction(session.id, {
            ...baseAction,
            status: result.status,
            reason: result.reason,
            screenshot_path: result.status === 'failed' ? await screenshot(page, session.id, 'failed') : null
          });
        } catch (error) {
          const shot = await screenshot(page, session.id, 'apply-failed');
          await JobApplication.recordAction(session.id, {
            ...baseAction,
            status: 'failed',
            reason: error.message,
            screenshot_path: shot
          });
        }
      }

      const pageReport = await updateCounts(session.id);
      if (targetsMet(pageReport, targets)) break;

      assertNotStopped(state);
      await page.goto(buildSearchUrl(filters), { waitUntil: 'domcontentloaded', timeout: 60_000 }).catch(() => null);
      for (let step = 1; step < pageNumber; step += 1) {
        const advanced = await goToNextResultsPage(page);
        if (!advanced) break;
      }
      const advanced = await goToNextResultsPage(page);
      if (!advanced) break;
    }

    const report = await updateCounts(session.id);
    const finalStatus = targetsMet(report, targets) ? 'completed' : 'completed_below_target';
    const emailReport = await emailNaukriSessionReport(report);
    await JobApplication.updateSession(session.id, {
      status: finalStatus,
      current_message:
        finalStatus === 'completed'
          ? `Completed. Scanned ${report.summary.totalScanned}, skipped ${report.summary.totalSkipped}, applied ${report.summary.totalApplied}.`
          : `Completed below target. Scanned ${report.summary.totalScanned}, skipped ${report.summary.totalSkipped}, applied ${report.summary.totalApplied}. Not enough safe matching Easy Apply jobs found.`,
      finished_at: new Date(),
      report: { ...report, emailReport }
    });
    state.status = finalStatus;
    state.message = finalStatus === 'completed' ? 'Naukri automation completed.' : 'Naukri automation completed below target.';
    state.report = { ...report, emailReport };
  } catch (error) {
    if (state.stopRequested || /Stopped by user/i.test(String(error?.message || error))) {
      const report = await JobApplication.buildReport(session.id).catch(() => null);
      await JobApplication.updateSession(session.id, {
        status: 'stopped',
        current_message: 'Naukri automation stopped by user.',
        finished_at: new Date(),
        ...(report ? { report } : {})
      });
      state.status = 'stopped';
      state.message = 'Naukri automation stopped by user.';
      state.report = report;
      logger.info({ sessionId: session.id }, 'Naukri automation stopped by user');
      return;
    }
    const cleanMessage = cleanLaunchError(error);
    logger.error({ error, sessionId: session.id }, 'Naukri automation failed');
    await JobApplication.updateSession(session.id, {
      status: 'failed',
      current_message: cleanMessage,
      finished_at: new Date()
    });
    state.status = 'failed';
    state.message = cleanMessage;
  } finally {
    state.running = false;
    state.context = null;
    state.continueResolver = null;
    activeSessions.delete(String(session.id));
    if (context) await context.close().catch(() => null);
  }
}

export async function startNaukriAutomation(options = {}) {
  if (active.running) {
    return {
      accepted: false,
      sessionId: active.sessionId,
      status: active.status,
      message: 'Naukri automation is already running.'
    };
  }

  const session = await JobApplication.createSession({
    filters: defaultNaukriFilters(options.filters || {}),
    targetMin: options.minApplied || options.targetMin || DEFAULT_SESSION_TARGETS.minApplied,
    targetMax: options.maxApplied || options.targetMax || DEFAULT_SESSION_TARGETS.maxApplied
  });
  runNaukriAutomationSession(session, options).catch((error) => logger.error({ error }, 'Naukri automation background run crashed'));
  return { accepted: true, sessionId: session.id, status: 'starting', message: 'Naukri automation started. Chrome will open for manual login if needed.' };
}

export async function stopNaukriAutomation() {
  const latest = await JobApplication.latestSession();
  const sessionId = active.sessionId || latest?.id;
  const wasRunning = active.running;

  active.stopRequested = true;
  active.status = 'stopping';
  active.message = 'Stopping Naukri automation...';

  if (active.continueResolver) {
    active.continueResolver();
    active.continueResolver = null;
  }

  if (active.context) {
    await active.context.close().catch(() => null);
  }

  if (sessionId) {
    await JobApplication.updateSession(sessionId, {
      status: 'stopped',
      current_message: 'Naukri automation stopped by user.',
      finished_at: new Date()
    }).catch(() => null);
  }

  active.status = 'stopped';
  active.message = 'Naukri automation stopped by user.';

  if (!wasRunning) {
    active.running = false;
    active.sessionId = null;
    active.context = null;
    active.stopRequested = false;
  }

  return {
    stopped: true,
    wasRunning,
    sessionId,
    message: wasRunning
      ? 'Naukri automation stopped. Refreshing status.'
      : 'No active Naukri automation was running. Latest session marked stopped.'
  };
}

export async function continueAfterManualAction() {
  if (!active.continueResolver) {
    return { continued: false, message: 'No manual action is currently waiting.' };
  }
  active.continueResolver();
  return { continued: true, message: 'Manual action confirmed. Automation will resume.' };
}

export async function getNaukriAutomationStatus() {
  const latest = await JobApplication.latestSession();
  return {
    running: active.running,
    status: active.status,
    message: active.message,
    session: latest,
    report: latest ? await JobApplication.buildReport(latest.id) : null
  };
}

export async function getNaukriAutomationReport() {
  const latest = await JobApplication.latestSession();
  if (!latest) return null;
  return JobApplication.buildReport(latest.id);
}
