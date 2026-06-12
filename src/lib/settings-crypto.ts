import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function getKeyMaterial(): Buffer {
  const secret = process.env.SETTINGS_ENCRYPTION_KEY?.trim();
  if (!secret || secret.length < 16) {
    throw new Error('SETTINGS_ENCRYPTION_KEY is missing or too short.');
  }
  return createHash('sha256').update(secret).digest();
}

export function encryptSetting(plainText: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getKeyMaterial(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decryptSetting(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(':');
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error('Invalid encrypted setting payload.');
  }

  const decipher = createDecipheriv(ALGORITHM, getKeyMaterial(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

export function maskSecretKey(secretKey: string): string {
  if (secretKey.length <= 12) return '••••••••••••';
  return `${secretKey.slice(0, 7)}••••••••••••${secretKey.slice(-4)}`;
}
