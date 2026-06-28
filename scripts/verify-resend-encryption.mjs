/**
 * Vérifie resend_api_key + domaine d'expédition Resend.
 * Usage: node scripts/verify-resend-encryption.mjs
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
  console.error('Missing env vars in .env.local');
  process.exit(1);
}

function decrypt(payload, secret) {
  const [ivB64, tagB64, dataB64] = payload.split(':');
  const keyMat = createHash('sha256').update(secret).digest();
  const decipher = createDecipheriv('aes-256-gcm', keyMat, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8');
}

const db = createClient(url, serviceKey);
const { data: rows } = await db
  .from('app_settings')
  .select('key, value, updated_at')
  .in('key', ['resend_api_key', 'newsletter_from_email', 'subscription_notify_email']);

const map = new Map((rows ?? []).map((row) => [row.key, row]));
const encrypted = map.get('resend_api_key')?.value;
const fromEmail = map.get('newsletter_from_email')?.value;
const notifyEmail = map.get('subscription_notify_email')?.value;

console.log('newsletter_from_email:', fromEmail ?? '(missing)');
console.log('subscription_notify_email:', notifyEmail ?? '(default contact@amplitudeapp.fr)');

if (!encrypted) {
  console.log('FAIL: no resend_api_key in app_settings');
  process.exit(1);
}

console.log('resend_api_key updated_at:', map.get('resend_api_key')?.updated_at);

let apiKey;
try {
  apiKey = decrypt(encrypted, encKey);
  console.log('OK: decrypt works with .env.local SETTINGS_ENCRYPTION_KEY');
} catch {
  console.log('FAIL: cannot decrypt — re-save Resend key in Settings');
  process.exit(1);
}

const domainsRes = await fetch('https://api.resend.com/domains', {
  headers: { Authorization: `Bearer ${apiKey}` },
});
const domainsBody = await domainsRes.text();
console.log('Resend /domains status:', domainsRes.status);

if (!domainsRes.ok) {
  console.log(domainsBody.slice(0, 400));
  process.exit(1);
}

const domains = JSON.parse(domainsBody).data ?? [];
const domainName = fromEmail?.split('@')[1]?.toLowerCase();
const match = domains.find((d) => d.name === domainName);
console.log('Verified domains:', domains.map((d) => `${d.name} (${d.status})`).join(', ') || '(none)');
console.log('From domain match:', domainName, '→', match?.status ?? 'NOT FOUND');

if (match?.status !== 'verified') {
  console.log('FAIL: sender domain not verified in Resend');
  process.exit(1);
}

console.log('OK: Resend ready to send from', fromEmail);
process.exit(0);
