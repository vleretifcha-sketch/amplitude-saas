/**
 * Vérifie que stripe_secret_key en base se déchiffre avec SETTINGS_ENCRYPTION_KEY locale.
 * Usage: node scripts/verify-stripe-encryption.mjs
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
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or SETTINGS_ENCRYPTION_KEY in .env.local');
  process.exit(1);
}

function decrypt(payload, secret) {
  const [ivB64, tagB64, dataB64] = payload.split(':');
  const keyMat = createHash('sha256').update(secret).digest();
  const decipher = createDecipheriv('aes-256-gcm', keyMat, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]);
}

const db = createClient(url, serviceKey);
const { data, error } = await db
  .from('app_settings')
  .select('updated_at, value')
  .eq('key', 'stripe_secret_key')
  .maybeSingle();

if (error) {
  console.error('DB error:', error.message);
  process.exit(1);
}

if (!data?.value) {
  console.log('FAIL: no stripe_secret_key in app_settings');
  process.exit(1);
}

console.log('stripe_secret_key updated_at:', data.updated_at);

try {
  decrypt(data.value, encKey);
  console.log('OK: decrypt works with .env.local SETTINGS_ENCRYPTION_KEY');
  console.log('Supabase webhook should be able to read the Stripe key.');
  process.exit(0);
} catch {
  console.log('FAIL: cannot decrypt with .env.local SETTINGS_ENCRYPTION_KEY');
  console.log('Run: STRIPE_SECRET_KEY=sk_live_... node scripts/repair-stripe-encryption.mjs');
  process.exit(1);
}
