import https from 'node:https';
import { env } from '../config/env.js';
import { logger } from '../modules/logging/logger.js';

function allowedIps() {
  return String(env.BREVO_ALLOWED_OUTBOUND_IPS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function readPublicIp() {
  return new Promise((resolve, reject) => {
    const request = https.get('https://api.ipify.org?format=json', { timeout: 10_000 }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        body += chunk;
      });
      response.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (!parsed.ip) throw new Error('Public IP response did not include an IP address.');
          resolve(parsed.ip);
        } catch (error) {
          reject(error);
        }
      });
    });

    request.on('timeout', () => request.destroy(new Error('Timed out while checking outbound public IP.')));
    request.on('error', reject);
  });
}

export async function assertBrevoOutboundIpAllowed() {
  if (!env.BREVO_CHECK_OUTBOUND_IP) return { checked: false, reason: 'Outbound IP check disabled.' };

  const ips = allowedIps();
  if (!ips.length) {
    throw new Error('Brevo email blocked before send. BREVO_ALLOWED_OUTBOUND_IPS is not configured.');
  }

  const publicIp = await readPublicIp();
  if (ips.includes(publicIp)) {
    return { checked: true, publicIp };
  }

  const message = `Brevo email blocked before send. Current outbound IP ${publicIp} is not in BREVO_ALLOWED_OUTBOUND_IPS.`;
  logger.warn({ publicIp, allowedIps: ips }, message);
  throw new Error(message);
}
