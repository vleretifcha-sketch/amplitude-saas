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

const to = process.env.SUBSCRIPTION_NOTIFY_EMAIL?.trim() || 'contact@amplitudeapp.fr';

const customHost = process.env.OVH_SMTP_HOST?.trim();
const customPort = process.env.OVH_SMTP_PORT ? Number(process.env.OVH_SMTP_PORT) : null;

const allAttempts = [
  { host: 'pro1.mail.ovh.net', port: 587, label: 'pro1.mail.ovh.net:587 (Email Pro)' },
  { host: 'pro2.mail.ovh.net', port: 587, label: 'pro2.mail.ovh.net:587 (Email Pro)' },
  { host: 'ssl0.ovh.net', port: 465, label: 'ssl0.ovh.net:465' },
  { host: 'smtp.mail.ovh.net', port: 587, label: 'smtp.mail.ovh.net:587' },
  { host: 'smtp.mail.ovh.net', port: 465, label: 'smtp.mail.ovh.net:465' },
];

const attempts =
  customHost && customPort
    ? [{ host: customHost, port: customPort, label: `${customHost}:${customPort}` }, ...allAttempts.filter((a) => a.host !== customHost || a.port !== customPort)]
    : allAttempts;

console.log('Testing OVH SMTP as', user, '→', to);

for (const attempt of attempts) {
  const transporter = nodemailer.createTransport({
    host: attempt.host,
    port: attempt.port,
    secure: attempt.port === 465,
    requireTLS: attempt.port === 587,
    auth: { user, pass },
    tls: { minVersion: 'TLSv1.2' },
  });

  try {
    await transporter.verify();
    const info = await transporter.sendMail({
      from: user,
      to,
      subject: 'TEST OVH SMTP — Nouvel abonnement Amplitude',
      text: 'Test via SMTP OVH direct.\n\nSi vous recevez cet email, les alertes abonnement fonctionneront.',
      html: '<p>Test via SMTP OVH direct.</p><p>Si vous recevez cet email, les alertes abonnement fonctionneront.</p>',
    });
    console.log('OK:', attempt.label, '| messageId:', info.messageId);
    console.log('→ Ajoutez dans .env.local et Vercel :');
    console.log(`   OVH_SMTP_HOST=${attempt.host}`);
    console.log(`   OVH_SMTP_PORT=${attempt.port}`);
    process.exit(0);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log('FAIL:', attempt.label, '→', msg.split('\n')[0]);
  }
}

console.error(`
Aucune connexion SMTP OVH réussie.

Checklist :
1. OVH Manager → Emails → contact@amplitudeapp.fr → réinitialiser le mot de passe
2. Tester la connexion sur https://www.mail.ovh.net avec le MÊME mot de passe
3. Dans .env.local :
   OVH_SMTP_USER=contact@amplitudeapp.fr
   OVH_SMTP_PASSWORD="votre-mot-de-passe"
   (guillemets si le mot de passe contient # @ ou espaces)
4. Mettre à jour la même valeur sur Vercel
`);
process.exit(1);
