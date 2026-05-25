import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { env } from '../config/env.js';
import { logger } from '../modules/logging/logger.js';
import { Job } from '../models/Job.js';

export const NAUKRI_BLOCKED_MESSAGE =
  'Naukri blocks automated access. Please connect job-alert email or import Naukri job URLs manually.';

const NAUKRI_HOST_RE = /(^|\.)naukri\.com$/i;
const NAUKRI_URL_RE = /https?:\/\/(?:www\.)?naukri\.com\/[^\s<>"')]+/gi;
const SEARCH_TIMEOUT_MS = 12_000;

export function buildNaukriSearchUrl({ keyword = '.net aws developer', location = 'noida', experience = '' } = {}) {
  const query = [keyword, experience ? experience + ' years' : '', 'jobs in', location]
    .filter(Boolean)
    .join(' ')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.+#]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `https://www.naukri.com/${query || 'jobs'}`;
}

export function isNaukriUrl(value) {
  try {
    const url = new URL(value);
    return NAUKRI_HOST_RE.test(url.hostname);
  } catch {
    return false;
  }
}

function normalizeUrl(rawUrl) {
  const url = new URL(rawUrl);
  url.hash = '';
  for (const key of [...url.searchParams.keys()]) {
    if (/^(utm_|src|sid|xp|px|othersrcp|f|k|l)$/i.test(key)) url.searchParams.delete(key);
  }
  return url.toString();
}

function sourceJobId(url) {
  return createHash('sha1').update(url).digest('hex').slice(0, 16);
}

function titleFromUrl(url) {
  const pathname = new URL(url).pathname;
  const last = pathname.split('/').filter(Boolean).find((part) => /job|developer|engineer|architect|manager/i.test(part)) || pathname;
  return decodeURIComponent(last)
    .replace(/[-_]+/g, ' ')
    .replace(/\bjob\b|\bnaukri\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) || 'Naukri Job';
}

function extractField(text, label) {
  const match = text.match(new RegExp(`${label}\\s*[:\\-]\\s*([^\\n\\r|]+)`, 'i'));
  return match?.[1]?.trim() || '';
}

function extractExperience(text) {
  const match = text.match(/(\d+)\s*[-–]\s*(\d+)\s*(?:years|yrs|yr|y)/i);
  if (!match) return { min: null, max: null };
  return { min: Number(match[1]), max: Number(match[2]) };
}

function extractSalary(text) {
  const match = text.match(/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)\s*(?:lpa|lakhs?|lacs?)/i);
  if (!match) return { min: null, max: null };
  return { min: Number(match[1]), max: Number(match[2]) };
}

function extractPostedAt(text) {
  const dateMatch = text.match(/(?:posted|date)\s*[:\-]\s*([A-Z][a-z]{2,8}\s+\d{1,2},?\s+\d{4}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i);
  if (!dateMatch) return null;
  const parsed = new Date(dateMatch[1]);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function buildJobFromUrl(url, overrides = {}) {
  const normalizedUrl = normalizeUrl(url);
  const context = overrides.context || '';
  const experience = extractExperience(context);
  const salary = extractSalary(context);
  return {
    source_name: 'Naukri',
    source_job_id: sourceJobId(normalizedUrl),
    source_url: normalizedUrl,
    company: overrides.company || extractField(context, 'Company') || 'Unknown',
    title: overrides.title || extractField(context, 'Title') || titleFromUrl(normalizedUrl),
    location: overrides.location || extractField(context, 'Location') || '',
    work_mode: /remote/i.test(context) ? 'Remote' : /hybrid/i.test(context) ? 'Hybrid' : '',
    salary_min_lpa: salary.min,
    salary_max_lpa: salary.max,
    experience_min: overrides.experience_min ?? experience.min,
    experience_max: overrides.experience_max ?? experience.max,
    description: context || 'Imported from a Naukri URL. Full job details may require opening Naukri manually.',
    tech_stack: [],
    is_mnc: false,
    employee_count: null,
    posted_at: overrides.posted_at || extractPostedAt(context),
    source_fetch_status: overrides.source_fetch_status || 'manual_required',
    source_notes:
      overrides.source_notes ||
      'Imported safely without bypassing Naukri access controls. Open the job URL manually to confirm details.'
  };
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeout || SEARCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'user-agent': 'JobApplicationAgent/1.0 compliance check; no bypass',
        ...(options.headers || {})
      }
    });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchWithRetry(url, options = {}, retries = 1) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fetchWithTimeout(url, options);
    } catch (error) {
      lastError = error;
      logger.warn({ url, attempt: attempt + 1, error: error.message }, 'Naukri-safe fetch attempt failed');
      if (attempt < retries) await new Promise((resolve) => setTimeout(resolve, 750));
    }
  }
  throw lastError;
}

function accessBlocked(status, text = '') {
  return [401, 403, 429, 503].includes(status) || /access denied|captcha|cloudflare|attention required|blocked/i.test(text);
}

export async function investigateNaukriAccess(search = {}) {
  const searchUrl = buildNaukriSearchUrl(search);
  const checks = {
    source: 'Naukri',
    searchUrl,
    blocked: false,
    status: 'unknown',
    reason: '',
    fallbackMessage: NAUKRI_BLOCKED_MESSAGE,
    findings: []
  };

  try {
    const robots = await fetchWithRetry('https://www.naukri.com/robots.txt', { timeout: 8_000 });
    checks.findings.push({
      check: 'robots.txt',
      statusCode: robots.status,
      note: robots.ok ? 'robots.txt is reachable; integration must still respect site access controls and terms.' : 'robots.txt not reachable from this environment.'
    });
  } catch (error) {
    checks.findings.push({ check: 'robots.txt', status: 'failed', note: error.message });
  }

  try {
    const response = await fetchWithRetry(searchUrl);
    const text = await response.text();
    checks.findings.push({
      check: 'public_search_page',
      statusCode: response.status,
      title: text.match(/<title[^>]*>(.*?)<\/title>/i)?.[1]?.replace(/\s+/g, ' ').trim() || ''
    });

    if (accessBlocked(response.status, text)) {
      checks.blocked = true;
      checks.status = 'blocked';
      checks.reason =
        'Naukri returned an access-control, bot-protection, or blocked page for automated search access. This can be caused by anti-bot protection, login/session requirements, IP reputation, or terms/robots restrictions.';
      return checks;
    }

    checks.status = 'manual_required';
    checks.reason =
      'The Naukri search URL returned an HTTP response, but automated browser access can still receive Access Denied and this app does not scrape or bypass Naukri protections. Use job-alert email text, manual URL import, or search-index links.';
    return checks;
  } catch (error) {
    checks.blocked = true;
    checks.status = 'blocked';
    checks.reason = `Naukri search access failed: ${error.message}.`;
    return checks;
  }
}

export function parseNaukriAlertText(text = '') {
  const urls = [...new Set((text.match(NAUKRI_URL_RE) || []).filter(isNaukriUrl).map(normalizeUrl))];
  return urls.map((url) => {
    const index = text.indexOf(url);
    const context = index >= 0 ? text.slice(Math.max(0, index - 500), Math.min(text.length, index + 700)) : text;
    return buildJobFromUrl(url, {
      context,
      source_fetch_status: 'fetched',
      source_notes: 'Parsed from a Naukri job-alert email/text supplied by the user.'
    });
  });
}

export async function importNaukriUrl(rawUrl, details = {}) {
  if (!isNaukriUrl(rawUrl)) {
    const error = new Error('Only Naukri job URLs can be imported here.');
    error.statusCode = 400;
    throw error;
  }

  const job = buildJobFromUrl(rawUrl, {
    ...details,
    source_fetch_status: 'manual_required',
    source_notes: NAUKRI_BLOCKED_MESSAGE
  });

  const saved = await Job.upsert(job);
  logger.info({ jobId: saved.id, url: saved.source_url }, 'Naukri URL imported manually');
  return { status: 'manual_required', message: NAUKRI_BLOCKED_MESSAGE, job: saved };
}

export async function importNaukriAlertText(text) {
  const jobs = parseNaukriAlertText(text);
  const saved = [];
  for (const job of jobs) {
    saved.push(await Job.upsert(job));
  }
  logger.info({ count: saved.length }, 'Naukri alert text imported');
  return { status: saved.length ? 'fetched' : 'skipped', count: saved.length, jobs: saved };
}

export async function importNaukriAlertFile(path = env.NAUKRI_ALERT_TEXT_PATH) {
  try {
    const text = await fs.readFile(path, 'utf8');
    return importNaukriAlertText(text);
  } catch (error) {
    if (error.code === 'ENOENT') return { status: 'skipped', count: 0, jobs: [], reason: 'No Naukri alert text file found.' };
    throw error;
  }
}

function extractSearchEngineNaukriUrls(html) {
  const urls = new Set();
  for (const match of html.matchAll(/https?:\/\/(?:www\.)?naukri\.com\/[^"'&<\s)]+/gi)) {
    if (isNaukriUrl(match[0])) urls.add(normalizeUrl(match[0]));
  }
  return [...urls].filter((url) => /job|jobs/i.test(url)).slice(0, 20);
}

export async function discoverNaukriViaSearchEngine(search = {}) {
  const query = new URLSearchParams({
    q: `site:naukri.com ${search.keyword || '.net aws developer'} ${search.location || 'Noida'} ${search.experience || ''} job`
  });
  const url = `https://www.bing.com/search?${query.toString()}`;

  try {
    const response = await fetchWithRetry(url);
    const html = await response.text();
    if (!response.ok || accessBlocked(response.status, html)) {
      return { status: 'blocked', count: 0, jobs: [], reason: 'Search engine discovery was blocked or unavailable.' };
    }

    const jobs = extractSearchEngineNaukriUrls(html).map((jobUrl) =>
      buildJobFromUrl(jobUrl, {
        context: `Discovered from search-engine indexed Naukri result for ${search.keyword || '.net aws developer'} ${search.location || 'Noida'}.`,
        source_fetch_status: 'manual_required',
        source_notes: 'Discovered from search-engine index. Open manually to confirm details before applying.'
      })
    );
    const saved = [];
    for (const job of jobs) {
      saved.push(await Job.upsert(job));
    }
    return { status: saved.length ? 'manual_required' : 'skipped', count: saved.length, jobs: saved };
  } catch (error) {
    logger.warn({ error }, 'Naukri search-engine discovery failed');
    return { status: 'skipped', count: 0, jobs: [], reason: error.message };
  }
}

export async function searchNaukriJobs(search = {}) {
  const access = await investigateNaukriAccess(search);
  const results = [];

  if (access.status === 'manual_required') {
    results.push(await discoverNaukriViaSearchEngine(search));
  }

  if (access.blocked) {
    results.push(await importNaukriAlertFile());
    results.push(await discoverNaukriViaSearchEngine(search));
  }

  const jobs = results.flatMap((result) => result.jobs || []);
  return {
    source: 'Naukri',
    status: jobs.length ? 'manual_required' : 'manual_required',
    message: jobs.length ? 'Naukri jobs added through compliant fallback sources.' : NAUKRI_BLOCKED_MESSAGE,
    access,
    fallbacks: results.map(({ status, count, reason }) => ({ status, count, reason })),
    jobs
  };
}

export async function naukriConnectionStatus() {
  const [status, access] = await Promise.all([Job.sourceStatus('Naukri'), investigateNaukriAccess()]);
  return {
    source: 'Naukri',
    connectionStatus: access.blocked ? 'blocked' : access.status,
    message: access.blocked ? NAUKRI_BLOCKED_MESSAGE : access.reason,
    totals: status,
    access
  };
}
