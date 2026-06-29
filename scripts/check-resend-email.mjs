/**
 * Usage: node scripts/check-resend-email.mjs [email-id]
 */
import { createClient } from '@supabase/supabase-js';
import { createDecipheriv, createHash } from 'crypto';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
config({ path: resolve(root, '.env.local') });

function decrypt(payload, secret) {
  const [ivB64, tagB64, dataB64] = payload.split(':');
  const keyMat = createHash('sha256').update(secret).digest();
  const decipher = createDecipheriv('aes-256-gcm', keyMat, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8');
}

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data } = await db.from('app_settings').select('value').eq('key', 'resend_api_key').maybeSingle();
const apiKey = decrypt(data.value, process.env.SETTINGS_ENCRYPTION_KEY);

const emailId = process.argv[2] ?? '9d88149c-aa65-4f2e-8cf3-dca7fe5624a7';

const headers = { Authorization: `Bearer ${apiKey}` };

const detailRes = await fetch(`https://api.resend.com/emails/${emailId}`, { headers });
console.log('--- Email detail ---');
console.log(JSON.stringify(await detailRes.json(), null, 2));

const listRes = await fetch('https://api.resend.com/emails?limit=5', { headers });
console.log('\n--- Last 5 emails ---');
const list = await listRes.json();
for (const email of list.data ?? []) {
  console.log(`${email.created_at} | ${email.to?.join(', ')} | ${email.last_event ?? email.status ?? '?'} | ${email.subject}`);
}
