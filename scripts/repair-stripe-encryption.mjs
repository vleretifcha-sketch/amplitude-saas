/**
 * Re-chiffre stripe_secret_key avec SETTINGS_ENCRYPTION_KEY de .env.local
 * (doit être identique à Supabase Edge secrets).
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_live_... node scripts/repair-stripe-encryption.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { createCipheriv, createHash, randomBytes } from 'crypto';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
config({ path: resolve(root, '.env.local') });

const plainKey = process.env.STRIPE_SECRET_KEY?.trim();
const encKey = process.env.SETTINGS_ENCRYPTION_KEY?.trim();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!plainKey?.startsWith('sk_live_') && !plainKey?.startsWith('sk_test_')) {
  console.error('Set STRIPE_SECRET_KEY=sk_live_... or sk_test_... in the environment.');
  process.exit(1);
}

if (!encKey || encKey.length < 16) {
  console.error('SETTINGS_ENCRYPTION_KEY missing or too short in .env.local');
  process.exit(1);
}

function encrypt(plainText, secret) {
  const keyMat = createHash('sha256').update(secret).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', keyMat, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

const db = createClient(url, serviceKey);
const encrypted = encrypt(plainKey, encKey);

const { error } = await db.from('app_settings').upsert(
  {
    key: 'stripe_secret_key',
    value: encrypted,
    updated_at: new Date().toISOString(),
  },
  { onConflict: 'key' }
);

if (error) {
  console.error('Upsert failed:', error.message);
  process.exit(1);
}

console.log('OK: stripe_secret_key re-encrypted and saved.');
console.log('Next: resend failed Stripe webhook events (checkout.session.completed).');
