import dotenv from 'dotenv';
import { BrevoClient } from '@getbrevo/brevo';

dotenv.config();

if (!process.env.BREVO_API_KEY) {
  console.error('Missing BREVO_API_KEY in .env');
  process.exit(1);
}

const client = new BrevoClient({ apiKey: process.env.BREVO_API_KEY });

function compact(value) {
  return JSON.parse(JSON.stringify(value, (_key, item) => {
    if (typeof item === 'string' && item.length > 500) return item.slice(0, 500) + '...';
    return item;
  }));
}

async function safe(label, fn) {
  try {
    const data = await fn();
    console.log('\n## ' + label);
    console.log(JSON.stringify(compact(data), null, 2));
  } catch (error) {
    console.log('\n## ' + label);
    console.log(JSON.stringify({ error: error.message || String(error) }, null, 2));
  }
}

await safe('Account', () => client.account.getAccount());
await safe('Senders', () => client.senders.getSenders());
await safe('Dedicated IPs', () => client.senders.getIps());
await safe('SMTP Templates', () => client.transactionalEmails.getSmtpTemplates({ limit: 50, offset: 0 }));
