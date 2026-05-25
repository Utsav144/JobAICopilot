import { chromium } from 'playwright';
import { env } from '../../config/env.js';
import { logger } from '../logging/logger.js';

function randomDelay(minMs = 3_000, maxMs = 12_000) {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

async function detectCaptcha(page) {
  const content = await page.content();
  return /captcha|verify you are human|security check|unusual traffic/i.test(content);
}

export async function assistApplication({ job, resumePath, recruiterMessage }) {
  const browser = await chromium.launch({ headless: env.PLAYWRIGHT_HEADLESS });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 900 },
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36'
  });
  const page = await context.newPage();

  try {
    logger.info({ jobId: job.id, url: job.source_url }, 'Opening application page');
    await page.goto(job.source_url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await randomDelay();

    if (await detectCaptcha(page)) {
      return {
        status: 'needs_human',
        reason: 'Captcha or human verification detected. Automation paused safely.'
      };
    }

    const loginVisible = await page
      .locator('input[type="password"], text=/sign in|log in/i')
      .first()
      .isVisible()
      .catch(() => false);
    if (loginVisible) {
      return {
        status: 'needs_human',
        reason: 'Login is required. Complete login manually, then rerun this application.'
      };
    }

    const applyEntry = await openApplyEntryPoint(page);
    if (applyEntry?.status) return applyEntry;

    if (await detectCaptcha(page)) {
      return {
        status: 'needs_human',
        reason: 'Captcha or human verification detected after opening apply page. Automation paused safely.'
      };
    }

    await fillKnownFields(page, { resumePath, recruiterMessage });

    if (env.HUMAN_APPROVAL_REQUIRED) {
      return {
        status: 'ready_for_review',
        reason: 'Form filling completed where possible. Human approval is required before final submit.'
      };
    }

    const submitButton = page
      .getByRole('button', { name: /submit|apply|send application/i })
      .first();
    if (await submitButton.isVisible().catch(() => false)) {
      await randomDelay(4_000, 15_000);
      await submitButton.click();
      return { status: 'submitted', reason: 'Application submitted by automation.' };
    }

    return { status: 'needs_human', reason: 'Could not identify final submit button.' };
  } finally {
    await browser.close();
  }
}

async function openApplyEntryPoint(page) {
  const currentUrl = page.url();
  const href = await page
    .locator('a[href]')
    .evaluateAll((nodes) => {
      const candidate = nodes.find((node) => /apply/i.test((node.innerText || node.textContent || '') + ' ' + node.href));
      return candidate?.href || '';
    })
    .catch(() => '');

  if (href) {
    if (href.startsWith('mailto:')) {
      return { status: 'needs_human', reason: 'Apply link opens an email client. Manual email application is required.' };
    }
    if (href !== currentUrl) {
      await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 60_000 }).catch(async () => {
        await page.goto(currentUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      });
      await randomDelay(2_000, 6_000);
    }
    return null;
  }

  const applyButton = page.getByRole('button', { name: /apply|start application|continue/i }).first();
  if (await applyButton.isVisible().catch(() => false)) {
    await applyButton.click().catch(() => undefined);
    await randomDelay(2_000, 6_000);
  }
  return null;
}

async function fillKnownFields(page, { resumePath, recruiterMessage }) {
  const fileInputs = await page.locator('input[type="file"]').all();
  for (const input of fileInputs) {
    await input.setInputFiles(resumePath).catch(() => undefined);
  }

  const fieldValues = [
    { pattern: /full.?name|name/i, value: env.APPLICANT_NAME },
    { pattern: /email|e-mail/i, value: env.APPLICANT_EMAIL },
    { pattern: /phone|mobile|contact/i, value: env.APPLICANT_PHONE },
    { pattern: /location|city|address/i, value: env.APPLICANT_LOCATION },
    { pattern: /linkedin/i, value: env.APPLICANT_LINKEDIN },
    { pattern: /github/i, value: env.APPLICANT_GITHUB },
    { pattern: /portfolio|website/i, value: env.APPLICANT_PORTFOLIO }
  ].filter((field) => field.value);

  const inputs = await page.locator('input:not([type="file"]):not([type="hidden"]), textarea').all();
  for (const input of inputs) {
    const currentValue = await input.inputValue().catch(() => '');
    if (currentValue) continue;

    const label = (await input.getAttribute('aria-label').catch(() => '')) || '';
    const placeholder = (await input.getAttribute('placeholder').catch(() => '')) || '';
    const name = (await input.getAttribute('name').catch(() => '')) || '';
    const id = (await input.getAttribute('id').catch(() => '')) || '';
    const type = (await input.getAttribute('type').catch(() => '')) || '';
    const metadata = `${label} ${placeholder} ${name} ${id} ${type}`;

    const match = fieldValues.find((field) => field.pattern.test(metadata));
    if (match) {
      await input.fill(match.value).catch(() => undefined);
      continue;
    }

    if (/cover|message|note|summary/i.test(metadata)) {
      await input.fill(recruiterMessage).catch(() => undefined);
    }
  }
}
