import { BrevoClient } from '@getbrevo/brevo';
import https from 'node:https';
import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';
import { query } from '../../db/pool.js';
import { logger } from '../logging/logger.js';
import { assertBrevoOutboundIpAllowed } from '../../services/brevoOutboundGuard.js';

function hasBrevoApiConfig(force = false) {
  return Boolean(
    (force || env.SEND_DAILY_EMAIL_REPORT) &&
      env.EMAIL_PROVIDER === 'brevo-api' &&
      env.BREVO_API_KEY &&
      env.REPORT_EMAIL_TO &&
      env.SMTP_FROM
  );
}

function hasSmtpConfig(force = false) {
  return Boolean(
    (force || env.SEND_DAILY_EMAIL_REPORT) &&
      env.REPORT_EMAIL_TO &&
      env.SMTP_HOST &&
      env.SMTP_USER &&
      env.SMTP_PASS
  );
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function reportDate() {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: env.USER_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${lookup.year}-${lookup.month}-${lookup.day}`;
}

function displayDate() {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: env.USER_TIMEZONE,
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date());
}

function countStatuses(results = []) {
  return results.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});
}

async function todaySubmittedApplications(date) {
  const result = await query(
    `SELECT a.id AS application_id, a.status, a.submitted_at, a.notes,
            j.company, j.title, j.location, j.source_name, j.source_url
     FROM applications a
     JOIN jobs j ON j.id = a.job_id
     WHERE a.status = 'submitted'
       AND (a.submitted_at AT TIME ZONE $1)::date = $2::date
     ORDER BY a.submitted_at DESC NULLS LAST, a.updated_at DESC`,
    [env.USER_TIMEZONE, date]
  );
  return result.rows;
}

async function alreadySent(date) {
  const result = await query('SELECT report_date, submitted_count, message_id FROM email_report_sends WHERE report_date = $1', [date]);
  return result.rows[0] || null;
}

async function recordSent(date, submittedCount, delivery) {
  await query(
    `INSERT INTO email_report_sends (report_date, submitted_count, provider, message_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (report_date) DO NOTHING`,
    [date, submittedCount, delivery.provider, delivery.messageId || null]
  );
}

function summarizeText({ results, counts, submittedToday, date }) {
  const needsHuman = results.filter((item) => item.status === 'needs_human');
  const rejected = results.filter((item) => item.status === 'rejected');
  const queued = results.filter((item) => item.status === 'queued');
  const lines = [
    'Daily job automation report',
    `Date: ${date}`,
    '',
    `Submitted today: ${submittedToday.length}`,
    `Processed this run: ${results.length}`,
    `Queued: ${counts.queued || 0}`,
    `Submitted: ${counts.submitted || 0}`,
    `Needs human: ${counts.needs_human || 0}`,
    `Rejected: ${counts.rejected || 0}`,
    ''
  ];

  if (submittedToday.length) {
    lines.push('Submitted jobs:');
  }
  for (const app of submittedToday.slice(0, 25)) {
    lines.push(`${app.company || 'Unknown'} - ${app.title || 'Untitled role'} (${app.location || 'Location not listed'})`);
  }

  if (needsHuman.length) {
    lines.push('', 'Needs human attention:');
    for (const item of needsHuman.slice(0, 10)) {
      lines.push(`Application ${item.applicationId || '-'} / Job ${item.jobId || '-'}: ${item.reason || 'Manual action required'}`);
    }
  }

  if (queued.length) {
    lines.push('', `Queued for later: ${queued.length}`);
  }

  if (rejected.length) {
    lines.push('', 'Rejected examples:');
    for (const item of rejected.slice(0, 10)) {
      lines.push(`Job ${item.jobId || '-'}: ${(item.reasons || [item.reason || 'Filter rejected']).join('; ')}`);
    }
  }

  return lines.join('\n');
}

function statCard(label, value, color = '#0b6bcb', note = '') {
  return `
    <td style="padding:7px;width:25%;vertical-align:top;">
      <div style="border:1px solid #dbe4ee;border-radius:14px;padding:16px;background:#ffffff;min-height:86px;">
        <div style="font-size:28px;line-height:1;font-weight:800;color:${color};">${escapeHtml(value)}</div>
        <div style="margin-top:8px;font-size:12px;font-weight:800;text-transform:uppercase;color:#667487;">${escapeHtml(label)}</div>
        ${note ? `<div style="margin-top:6px;font-size:12px;line-height:1.35;color:#667487;">${escapeHtml(note)}</div>` : ''}
      </div>
    </td>`;
}

function sectionTitle(title, subtitle = '') {
  return `
    <div style="padding:15px 18px;background:#f8fafc;border-bottom:1px solid #dbe4ee;">
      <div style="font-size:17px;font-weight:800;color:#17202a;">${escapeHtml(title)}</div>
      ${subtitle ? `<div style="margin-top:4px;color:#667487;font-size:13px;line-height:1.45;">${escapeHtml(subtitle)}</div>` : ''}
    </div>`;
}

function sectionBox(title, subtitle, body) {
  return `
    <tr>
      <td style="padding:10px 28px;">
        <div style="border:1px solid #dbe4ee;border-radius:14px;overflow:hidden;background:#ffffff;">
          ${sectionTitle(title, subtitle)}
          ${body}
        </div>
      </td>
    </tr>`;
}

function submittedJobRows(applications) {
  if (!applications.length) {
    return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:18px;color:#667487;">No submitted jobs recorded for today yet.</td></tr></table>';
  }

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    ${applications.slice(0, 25).map((app, index) => `
    <tr>
      <td style="width:42px;padding:16px 0 16px 18px;border-top:${index === 0 ? '0' : '1px solid #edf1f5'};vertical-align:top;">
        <div style="width:26px;height:26px;border-radius:999px;background:#e7f6ef;color:#13795b;text-align:center;line-height:26px;font-size:12px;font-weight:800;">${index + 1}</div>
      </td>
      <td style="padding:15px 16px 15px 8px;border-top:${index === 0 ? '0' : '1px solid #edf1f5'};">
        <div style="font-size:15px;font-weight:800;color:#17202a;">${escapeHtml(app.company || 'Unknown company')}</div>
        <div style="margin-top:4px;">
          <a href="${escapeHtml(app.source_url)}" style="color:#0b6bcb;font-weight:800;text-decoration:none;">${escapeHtml(app.title || 'Untitled role')}</a>
        </div>
        <div style="margin-top:7px;color:#667487;font-size:13px;line-height:1.4;">${escapeHtml(app.source_name || 'Unknown source')} · ${escapeHtml(app.location || 'Location not listed')}</div>
      </td>
    </tr>`).join('')}
  </table>`;
}

function resultReason(item) {
  if (item.reason) return item.reason;
  if (Array.isArray(item.reasons) && item.reasons.length) return item.reasons.join('; ');
  return 'No reason recorded';
}

function statusLabel(status) {
  return String(status || 'unknown').replaceAll('_', ' ');
}

function statusPill(status) {
  const colors = {
    submitted: ['#e7f6ef', '#13795b'],
    queued: ['#fff4d8', '#9a6700'],
    ready_for_review: ['#fff4d8', '#9a6700'],
    needs_human: ['#ffebe9', '#b42318'],
    rejected: ['#ffebe9', '#b42318']
  };
  const [bg, fg] = colors[status] || ['#e8f2ff', '#084f99'];
  return `<span style="display:inline-block;border-radius:999px;background:${bg};color:${fg};padding:5px 10px;font-size:12px;font-weight:800;text-transform:capitalize;">${escapeHtml(statusLabel(status))}</span>`;
}

function resultRows(items, emptyMessage, showScore = false) {
  if (!items.length) {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:18px;color:#667487;">${escapeHtml(emptyMessage)}</td></tr></table>`;
  }

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    ${items.slice(0, 12).map((item, index) => `
      <tr>
        <td style="padding:14px 16px;border-top:${index === 0 ? '0' : '1px solid #edf1f5'};vertical-align:top;">
          <div style="margin-bottom:8px;">${statusPill(item.status)}</div>
          <div style="font-size:14px;font-weight:800;color:#17202a;">
            ${escapeHtml(item.applicationId ? `Application #${item.applicationId}` : `Job #${item.jobId || '-'}`)}
            ${showScore && item.score ? `<span style="font-weight:700;color:#667487;"> · ATS ${escapeHtml(item.score)}</span>` : ''}
          </div>
          <div style="margin-top:6px;color:#667487;font-size:13px;line-height:1.45;">${escapeHtml(resultReason(item))}</div>
        </td>
      </tr>`).join('')}
  </table>`;
}

function topRejectionReasons(results) {
  const counts = new Map();
  for (const item of results.filter((result) => result.status === 'rejected')) {
    const reason = resultReason(item);
    counts.set(reason, (counts.get(reason) || 0) + 1);
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
}

function rejectionReasonRows(reasons) {
  if (!reasons.length) {
    return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:18px;color:#667487;">No rejection reasons in this run.</td></tr></table>';
  }

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    ${reasons.map(([reason, count], index) => `
      <tr>
        <td style="width:54px;padding:13px 0 13px 16px;border-top:${index === 0 ? '0' : '1px solid #edf1f5'};vertical-align:top;">
          <div style="border-radius:999px;background:#ffebe9;color:#b42318;text-align:center;font-size:12px;font-weight:800;line-height:26px;width:34px;height:26px;">${count}</div>
        </td>
        <td style="padding:13px 16px 13px 0;border-top:${index === 0 ? '0' : '1px solid #edf1f5'};color:#667487;font-size:13px;line-height:1.45;">${escapeHtml(reason)}</td>
      </tr>`).join('')}
  </table>`;
}

function progressBar(value, total) {
  const percent = Math.min(100, Math.round((value / Math.max(total, 1)) * 100));
  return `
    <div style="margin-top:12px;height:10px;border-radius:999px;background:#dbe4ee;overflow:hidden;">
      <div style="height:10px;width:${percent}%;background:#13795b;border-radius:999px;"></div>
    </div>
    <div style="margin-top:7px;font-size:12px;color:#d8e8f5;">${escapeHtml(value)} of ${escapeHtml(total)} submitted jobs needed for the daily email rule.</div>`;
}

function toHtml(model) {
  const { results, counts, submittedToday, date } = model;
  const needsHuman = results.filter((item) => item.status === 'needs_human');
  const queued = results.filter((item) => item.status === 'queued');
  const rejected = results.filter((item) => item.status === 'rejected');
  const rejectionReasons = topRejectionReasons(results);
  const decisionText = submittedToday.length >= env.EMAIL_REPORT_MIN_SUBMITTED
    ? 'Daily threshold reached. This is the one automatic summary for today.'
    : 'Preview report. Automatic daily email will wait for the submitted threshold.';
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f3f6f8;font-family:Inter,Segoe UI,Arial,sans-serif;color:#17202a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f6f8;padding:24px 0;">
      <tr>
        <td align="center" style="padding:0 12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:780px;background:#ffffff;border:1px solid #dbe4ee;border-radius:18px;overflow:hidden;">
            <tr>
              <td style="padding:30px 30px 26px;background:#102a43;color:#ffffff;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:top;">
                      <div style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0;color:#b9d7f2;">Job Application Agent</div>
                      <h1 style="margin:8px 0 0;font-size:30px;line-height:1.16;">Daily apply report</h1>
                      <p style="margin:10px 0 0;color:#d8e8f5;font-size:14px;line-height:1.45;">${escapeHtml(env.APPLICANT_NAME)} · ${escapeHtml(displayDate())}</p>
                    </td>
                    <td align="right" style="vertical-align:top;width:112px;">
                      <div style="display:inline-block;border:1px solid rgba(255,255,255,0.25);border-radius:999px;padding:8px 12px;color:#ffffff;font-size:12px;font-weight:800;">${escapeHtml(date)}</div>
                    </td>
                  </tr>
                </table>
                <div style="margin-top:18px;padding:14px 16px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.16);border-radius:14px;">
                  <div style="font-size:15px;font-weight:800;color:#ffffff;">${escapeHtml(decisionText)}</div>
                  ${progressBar(submittedToday.length, env.EMAIL_REPORT_MIN_SUBMITTED)}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 20px 6px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    ${statCard('Submitted Today', submittedToday.length, '#13795b', 'Confirmed sent applications')}
                    ${statCard('Processed', results.length, '#0b6bcb', 'Jobs checked this run')}
                    ${statCard('Needs Human', counts.needs_human || 0, '#b42318', 'Captcha/login/manual steps')}
                    ${statCard('Queued', counts.queued || 0, '#9a6700', 'Ready for automation')}
                  </tr>
                </table>
              </td>
            </tr>
            ${sectionBox(
              `Submitted jobs for ${date}`,
              'Applications successfully submitted today. Open links to review the original job post.',
              submittedJobRows(submittedToday)
            )}
            ${sectionBox(
              'Needs human attention',
              'These items were stopped safely because the site required captcha, login, or a manual final step.',
              resultRows(needsHuman, 'No manual attention items in this run.')
            )}
            ${sectionBox(
              'Queued for next automation pass',
              'Qualified jobs prepared with resume/message and waiting for auto-apply.',
              resultRows(queued, 'No queued jobs in this run.', true)
            )}
            ${sectionBox(
              'Top rejection reasons',
              `${rejected.length} jobs were rejected by your filters in this run. This helps explain why not every discovered job was applied.`,
              rejectionReasonRows(rejectionReasons)
            )}
            <tr>
              <td style="padding:0 28px 28px;">
                <div style="padding:15px 16px;background:#e8f2ff;border:1px solid #c8ddf5;border-radius:14px;color:#084f99;font-size:13px;line-height:1.5;">
                  <strong>Daily email rule:</strong> the automatic report sends once per day only after submitted jobs reach ${env.EMAIL_REPORT_MIN_SUBMITTED}. Manual preview emails can still be sent with <span style="font-family:Consolas,Menlo,monospace;">npm run email:test</span>.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function sendWithBrevoApi({ text, html }) {
  await assertBrevoOutboundIpAllowed();
  const client = new BrevoClient({ apiKey: env.BREVO_API_KEY });
  const payload = {
    sender: { name: env.APPLICANT_NAME || 'Job Application Agent', email: env.SMTP_FROM },
    to: [{ email: env.REPORT_EMAIL_TO, name: env.APPLICANT_NAME || 'Utsav Dwivedi' }],
    subject: `Daily job automation report - ${new Date().toLocaleDateString('en-IN')}`,
    textContent: text,
    htmlContent: html,
    tags: ['job-application-agent', 'daily-report']
  };
  let result;

  try {
    result = await client.transactionalEmails.sendTransacEmail(payload);
  } catch (error) {
    if (!env.BREVO_DIRECT_IP_FALLBACK || !isDnsFailure(error)) throw error;
    logger.warn({ error: error.message }, 'Brevo SDK DNS lookup failed; retrying with direct resolver fallback');
    result = await sendWithBrevoApiDirect(payload);
  }

  logger.info({ messageId: result.messageId }, 'Daily email report sent through Brevo API');
  return { sent: true, provider: 'brevo-api', messageId: result.messageId };
}

function isDnsFailure(error) {
  const message = [
    error?.message,
    error?.cause?.message,
    error?.cause?.cause?.message,
    error?.rawResponse?.statusText
  ].filter(Boolean).join(' ');
  return /ENOTFOUND|getaddrinfo|fetch failed|Unknown Error/i.test(message);
}

function sendWithBrevoApiDirect(payload) {
  const body = JSON.stringify(payload);
  const brevoIps = ['141.101.90.107', '141.101.90.105', '141.101.90.106', '141.101.90.104'];
  let attempts = 0;

  return new Promise((resolve, reject) => {
    function tryNext(lastError) {
      const ip = brevoIps[attempts];
      attempts += 1;
      if (!ip) {
        reject(lastError || new Error('Brevo direct resolver fallback failed'));
        return;
      }

      const request = https.request(
        {
          hostname: 'api.brevo.com',
          servername: 'api.brevo.com',
          path: '/v3/smtp/email',
          method: 'POST',
          headers: {
            accept: 'application/json',
            'api-key': env.BREVO_API_KEY,
            'content-type': 'application/json',
            'content-length': Buffer.byteLength(body)
          },
          lookup: (_hostname, _options, callback) => callback(null, ip, 4),
          timeout: 20_000
        },
        (response) => {
          let responseBody = '';
          response.setEncoding('utf8');
          response.on('data', (chunk) => {
            responseBody += chunk;
          });
          response.on('end', () => {
            let parsed = {};
            try {
              parsed = responseBody ? JSON.parse(responseBody) : {};
            } catch {
              parsed = { raw: responseBody };
            }

            if (response.statusCode >= 200 && response.statusCode < 300) {
              resolve({ messageId: parsed.messageId || parsed.message_id || null });
              return;
            }

            const error = new Error(parsed.message || `Brevo API returned ${response.statusCode}`);
            error.statusCode = response.statusCode;
            error.body = parsed;
            reject(error);
          });
        }
      );

      request.on('timeout', () => {
        request.destroy(new Error('Brevo direct API request timed out'));
      });
      request.on('error', tryNext);
      request.write(body);
      request.end();
    }

    tryNext();
  });
}

async function sendWithSmtp({ text, html }) {
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    }
  });

  const info = await transporter.sendMail({
    from: env.SMTP_FROM || env.SMTP_USER,
    to: env.REPORT_EMAIL_TO,
    subject: `Daily job automation report - ${new Date().toLocaleDateString('en-IN')}`,
    text,
    html
  });

  logger.info({ messageId: info.messageId }, 'Daily email report sent through SMTP');
  return { sent: true, provider: 'smtp', messageId: info.messageId };
}

export async function sendDailyEmailReport(results = [], options = {}) {
  const force = Boolean(options.force);
  const date = reportDate();
  const submittedToday = options.submittedToday || (await todaySubmittedApplications(date));
  const submittedCount = submittedToday.length;

  if (!force) {
    if (!env.SEND_DAILY_EMAIL_REPORT) {
      return { sent: false, reason: 'Daily email reports are disabled.' };
    }

    if (submittedCount < env.EMAIL_REPORT_MIN_SUBMITTED) {
      return {
        sent: false,
        reason: `Only ${submittedCount} submitted jobs today. Email will send after ${env.EMAIL_REPORT_MIN_SUBMITTED}.`
      };
    }

    const sent = await alreadySent(date);
    if (sent) {
      return { sent: false, reason: `Report already sent for ${date}.`, messageId: sent.message_id };
    }
  }

  const counts = countStatuses(results);
  const model = { results, counts, submittedToday, date };
  const message = {
    text: summarizeText(model),
    html: toHtml(model)
  };

  let delivery;
  if (hasBrevoApiConfig(force)) {
    delivery = await sendWithBrevoApi(message);
  } else if (hasSmtpConfig(force)) {
    delivery = await sendWithSmtp(message);
  } else {
    logger.info('Daily email report skipped because email settings are incomplete');
    return {
      sent: false,
      reason:
        env.EMAIL_PROVIDER === 'brevo-api'
          ? 'Brevo API settings are incomplete. Set SEND_DAILY_EMAIL_REPORT, BREVO_API_KEY, REPORT_EMAIL_TO, and SMTP_FROM.'
          : 'SMTP settings are incomplete.'
    };
  }

  if (!force) {
    await recordSent(date, submittedCount, delivery);
  }

  return delivery;
}
