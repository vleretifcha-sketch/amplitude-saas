'use server';

import { revalidatePath } from 'next/cache';
import { runContentSync } from '@/lib/sync-content';

export async function syncContentGlobally() {
  const report = await runContentSync();
  revalidatePath('/');
  revalidatePath('/methods');
  revalidatePath('/videos');
  revalidatePath('/exercises');
  return report;
}
