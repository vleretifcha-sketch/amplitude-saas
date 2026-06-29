/**
 * Test envoi SMTP OVH vers contact@amplitudeapp.fr
 * Usage: node scripts/send-ovh-smtp-test.mjs
 */
import { config } from 'dotenv';
import nodemailer from 'nodemailer';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
config({ path: resolve(root, '.env.local') });

const user = process.env.OVH_SMTP_USER?.trim();
const pass = process.env.OVH_SMTP_PASSWORD?.trim();

if (!user || !pass) {
  console.error('Missing OVH_SMTP_USER or OVH_SMTP_PASSWORD in .env.local');
  process.exit(1);
}

const host = process.env.OVH_SMTP_HOST?.trim() || 'ssl0.ovh.net';
const port = Number(process.env.OVH_SMTP_PORT || 465);
const to = process.env.SUBSCRIPTION_NOTIFY_EMAIL?.trim() || 'contact@amplitudeapp.fr';

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: { user, pass },
});

try {
  const info = await transporter.sendMail({
    from: user,
    to,
    subject: 'TEST OVH SMTP — Nouvel abonnement Amplitude',
    text: 'Test via SMTP OVH direct.\n\nSi vous recevez cet email, les alertes abonnement fonctionneront.',
    html: '<p>Test via SMTP OVH direct.</p><p>Si vous recevez cet email, les alertes abonnement fonctionneront.</p>',
  });
  console.log('OK: sent via OVH SMTP to', to, '| messageId:', info.messageId);
} catch (error) {
  console.error('FAIL:', error instanceof Error ? error.message : error);
  process.exit(1);
}
