import { BrevoClient } from '@getbrevo/brevo';
import https from 'node:https';
import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../modules/logging/logger.js';
import { assertBrevoOutboundIpAllowed } from './brevoOutboundGuard.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function row(item) {
  return `
    <tr>
      <td style="padding:12px;border-top:1px solid #e6edf5;">
        <div style="font-weight:800;color:#17202a;">${escapeHtml(item.company || 'Unknown')}</div>
        <a href="${escapeHtml(item.job_url)}" style="display:block;margin-top:4px;color:#0b6bcb;font-weight:800;text-decoration:none;">${escapeHtml(item.title || 'Untitled role')}</a>
        <div style="margin-top:5px;color:#667487;font-size:13px;">${escapeHtml(item.location || 'Location not listed')} · ${escapeHtml(item.experience || 'Experience not listed')} · Score ${escapeHtml(item.score)}</div>
        <div style="margin-top:6px;color:#667487;font-size:13px;">${escapeHtml(item.reason || '')}</div>
      </td>
    </tr>`;
}

function section(title, items, empty) {
  return `
    <tr>
      <td style="padding:10px 24px;">
        <div style="border:1px solid #dbe4ee;border-radius:12px;overflow:hidden;background:#fff;">
          <div style="padding:14px 16px;background:#f8fafc;border-bottom:1px solid #dbe4ee;font-weight:800;">${escapeHtml(title)}</div>
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            ${items.length ? items.slice(0, 30).map(row).join('') : `<tr><td style="padding:16px;color:#667487;">${escapeHtml(empty)}</td></tr>`}
          </table>
        </div>
      </td>
    </tr>`;
}

export function buildNaukriSessionReport(report) {
  const summary = report.summary || {};
  const text = [
    'Naukri automation session report',
    '',
    `Total scanned: ${summary.totalScanned || 0}`,
    `Applied: ${summary.totalApplied || 0}`,
    `Skipped: ${summary.totalSkipped || 0}`,
    `Failed: ${summary.totalFailed || 0}`,
    `Manual required: ${summary.totalManualRequired || 0}`,
    '',
    'Applied jobs:',
    ...(report.applied || []).map((item) => `${item.company || 'Unknown'} - ${item.title || 'Untitled'} - ${item.job_url}`),
    '',
    'Skipped jobs:',
    ...(report.skipped || []).map((item) => `${item.title || 'Untitled'} - ${item.reason || ''}`)
  ].join('\n');

  const html = `<!doctype html>
<html>
  <body style="margin:0;background:#f3f6f8;font-family:Inter,Segoe UI,Arial,sans-serif;color:#17202a;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding:24px 0;background:#f3f6f8;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:780px;background:#fff;border:1px solid #dbe4ee;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:28px;background:#102a43;color:#fff;">
                <div style="font-size:12px;text-transform:uppercase;font-weight:800;color:#b9d7f2;">JobPilot AI · Naukri</div>
                <h1 style="margin:8px 0 0;font-size:28px;line-height:1.2;">Browser-assisted application report</h1>
                <p style="margin:8px 0 0;color:#d8e8f5;">Manual login/session respected. CAPTCHA, OTP, and unknown forms require human action.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 18px 6px;">
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    ${stat('Scanned', summary.totalScanned || 0, '#0b6bcb')}
                    ${stat('Applied', summary.totalApplied || 0, '#13795b')}
                    ${stat('Skipped', summary.totalSkipped || 0, '#9a6700')}
                    ${stat('Manual', summary.totalManualRequired || 0, '#b42318')}
                  </tr>
                </table>
              </td>
            </tr>
            ${section('Applied jobs', report.applied || [], 'No jobs were applied in this session.')}
            ${section('Manual action required', report.manualRequired || [], 'No manual action items.')}
            ${section('Skipped jobs', report.skipped || [], 'No skipped jobs.')}
            ${section('Failed jobs', report.failed || [], 'No failed jobs.')}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { text, html };
}

function stat(label, value, color) {
  return `
    <td style="padding:6px;width:25%;">
      <div style="border:1px solid #dbe4ee;border-radius:12px;padding:14px;background:#fff;">
        <div style="font-size:26px;font-weight:800;color:${color};">${escapeHtml(value)}</div>
        <div style="margin-top:6px;color:#667487;font-size:12px;font-weight:800;text-transform:uppercase;">${escapeHtml(label)}</div>
      </div>
    </td>`;
}

async function sendWithBrevo(message) {
  await assertBrevoOutboundIpAllowed();
  const client = new BrevoClient({ apiKey: env.BREVO_API_KEY });
  const payload = {
    sender: { name: env.APPLICANT_NAME || 'JobPilot AI', email: env.SMTP_FROM || env.REPORT_EMAIL_TO },
    to: [{ email: env.REPORT_EMAIL_TO, name: env.APPLICANT_NAME || 'Utsav Dwivedi' }],
    subject: 'Naukri automation session report',
    textContent: message.text,
    htmlContent: message.html,
    tags: ['jobpilot-ai', 'naukri-report']
  };
  let result;
  try {
    result = await client.transactionalEmails.sendTransacEmail(payload);
  } catch (error) {
    if (
      !env.BREVO_DIRECT_IP_FALLBACK ||
      !/ENOTFOUND|getaddrinfo|fetch failed|Unknown Error/i.test(String(error.message || '') + String(error.cause?.message || ''))
    ) {
      throw error;
    }
    result = await sendBrevoDirect(payload);
  }
  return { sent: true, provider: 'brevo-api', messageId: result.messageId };
}

function sendBrevoDirect(payload) {
  const body = JSON.stringify(payload);
  const brevoIps = ['141.101.90.107', '141.101.90.105', '141.101.90.106', '141.101.90.104'];
  let attempt = 0;
  return new Promise((resolve, reject) => {
    function next(lastError) {
      const ip = brevoIps[attempt];
      attempt += 1;
      if (!ip) return reject(lastError || new Error('Brevo direct send failed'));
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
            reject(new Error(parsed.message || `Brevo API returned ${response.statusCode}`));
          });
        }
      );
      request.on('timeout', () => request.destroy(new Error('Brevo direct send timed out')));
      request.on('error', next);
      request.write(body);
      request.end();
    }
    next();
  });
}

async function sendWithSmtp(message) {
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    }
  });
  const result = await transporter.sendMail({
    from: env.SMTP_FROM || env.SMTP_USER,
    to: env.REPORT_EMAIL_TO,
    subject: 'Naukri automation session report',
    text: message.text,
    html: message.html
  });
  return { sent: true, provider: 'smtp', messageId: result.messageId };
}

export async function emailNaukriSessionReport(report) {
  if (!env.REPORT_EMAIL_TO) return { sent: false, reason: 'REPORT_EMAIL_TO is not configured.' };
  const message = buildNaukriSessionReport(report);
  try {
    if (env.EMAIL_PROVIDER === 'brevo-api' && env.BREVO_API_KEY) return await sendWithBrevo(message);
    if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) return await sendWithSmtp(message);
    return { sent: false, reason: 'No Brevo API or SMTP email credentials configured.' };
  } catch (error) {
    logger.warn({ error }, 'Naukri session report email failed');
    return { sent: false, reason: error.message };
  }
}
