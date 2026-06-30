/**
 * Teste les combinaisons SMTP OVH courantes.
 * Usage: node scripts/probe-ovh-smtp.mjs
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
  console.error('Missing OVH_SMTP_USER or OVH_SMTP_PASSWORD');
  process.exit(1);
}

const attempts = [
  { host: 'ssl0.ovh.net', port: 465, secure: true, label: 'ssl0.ovh.net:465 SSL' },
  { host: 'ssl0.ovh.net', port: 587, secure: false, requireTLS: true, label: 'ssl0.ovh.net:587 STARTTLS' },
  { host: 'smtp.mail.ovh.net', port: 465, secure: true, label: 'smtp.mail.ovh.net:465 SSL' },
  { host: 'smtp.mail.ovh.net', port: 587, secure: false, requireTLS: true, label: 'smtp.mail.ovh.net:587 STARTTLS' },
  { host: 'pro1.mail.ovh.net', port: 587, secure: false, requireTLS: true, label: 'pro1.mail.ovh.net:587' },
];

for (const attempt of attempts) {
  const transporter = nodemailer.createTransport({
    host: attempt.host,
    port: attempt.port,
    secure: attempt.secure,
    requireTLS: attempt.requireTLS,
    auth: { user, pass },
    connectionTimeout: 10000,
  });

  try {
    await transporter.verify();
    console.log('OK:', attempt.label);
    process.exit(0);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log('FAIL:', attempt.label, '→', msg.split('\n')[0]);
  }
}

console.error('\nAucune combinaison SMTP OVH n’a fonctionné. Vérifiez le mot de passe dans OVH Manager → Emails → contact@.');
process.exit(1);
