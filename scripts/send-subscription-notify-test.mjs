/**
 * Test: envoi depuis notifications@ vers contact@ (évite le conflit même adresse).
 * Usage: node scripts/send-subscription-notify-test.mjs [from-email]
 */
import { createClient } from '@supabase/supabase-js';
import { createDecipheriv, createHash } from 'crypto';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
config({ path: resolve(root, '.env.local') });

const encKey = process.env.SETTINGS_ENCRYPTION_KEY?.trim();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!encKey || !url || !serviceKey) {
  console.error('Missing env in .env.local');
  process.exit(1);
}

function decrypt(payload, secret) {
  const [ivB64, tagB64, dataB64] = payload.split(':');
  const keyMat = createHash('sha256').update(secret).digest();
  const decipher = createDecipheriv('aes-256-gcm', keyMat, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8');
}

const EMAIL_SPLIT = /[,;\n]\s*/;
function parseEmailList(raw) {
  if (!raw?.trim()) return [];
  return [...new Set(raw.split(EMAIL_SPLIT).map((e) => e.trim().toLowerCase()).filter(Boolean))];
}

const fromOverride = process.argv[2]?.trim();

const db = createClient(url, serviceKey);
const { data: rows } = await db
  .from('app_settings')
  .select('key, value')
  .in('key', ['resend_api_key', 'newsletter_from_email', 'newsletter_from_name', 'subscription_notify_email']);

const map = new Map((rows ?? []).map((row) => [row.key, row.value]));
const apiKey = decrypt(map.get('resend_api_key'), encKey);
const fromEmail = fromOverride || 'notifications@amplitudeapp.fr';
const fromName = map.get('newsletter_from_name') || 'Amplitude';
const recipients = parseEmailList(map.get('subscription_notify_email'));
if (recipients.length === 0) recipients.push('contact@amplitudeapp.fr');

const from = `${fromName} <${fromEmail}>`;
const subject = 'TEST 2 — Nouvel abonnement Amplitude — Amplitude Pro';
const text =
  `Test depuis ${fromEmail} vers ${recipients.join(', ')}.\n\nSi vous recevez cet email, les alertes Stripe fonctionnent.`;

const response = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from,
    to: recipients,
    reply_to: 'contact@amplitudeapp.fr',
    subject,
    text,
    html: text.replace(/\n/g, '<br>'),
  }),
});

const body = await response.text();
if (!response.ok) {
  console.error('FAIL:', response.status, body.slice(0, 400));
  process.exit(1);
}

const payload = JSON.parse(body);
console.log('OK: from', fromEmail, '→', recipients.join(', '), '| Resend id:', payload.id ?? '(none)');
