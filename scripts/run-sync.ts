import fs from 'node:fs';
import path from 'node:path';
import { runContentSync } from '../src/lib/sync-content';

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

runContentSync()
  .then((report) => {
    console.log('Sync terminée:', JSON.stringify(report, null, 2));
  })
  .catch((error) => {
    console.error('Sync échouée:', error);
    process.exit(1);
  });
