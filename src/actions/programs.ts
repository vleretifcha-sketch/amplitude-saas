'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { uniqueId } from '@/lib/slug';
import { createTranslator, getLocale } from '@/i18n';

function parseIdList(raw: FormDataEntryValue | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(String(raw));
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.map((v) => String(v).trim()).filter(Boolean))];
  } catch {
    return [];
  }
}

export async function upsertProgram(formData: FormData): Promise<string> {
  const db = createAdminClient();
  const existingId = String(formData.get('id') || '').trim();
  const methodId = String(formData.get('method_id') || '').trim();
  const title = String(formData.get('title')).trim();
  const signatureSessionIds = parseIdList(formData.get('signature_session_ids'));
  const complementarySessionIds = parseIdList(formData.get('complementary_session_ids'));
  const mobilitySessionIds = parseIdList(formData.get('mobility_session_ids'));

  if (!methodId) throw new Error('method_id is required');

  const id = existingId || (await uniqueId(db, 'programs', 'prog-', title));

  const baseRow = {
    id,
    method_id: methodId,
    title,
    duration_weeks: Number(formData.get('duration_weeks') || 4),
    signature_session_id: signatureSessionIds[0] ?? null,
    complementary_session_ids: complementarySessionIds,
    sort_order: Number(formData.get('sort_order') || 0),
    updated_at: new Date().toISOString(),
  };

  const rowWithSignatures = { ...baseRow, signature_session_ids: signatureSessionIds };
  const rowWithMobility = { ...rowWithSignatures, mobility_session_ids: mobilitySessionIds };
  let { error } = await db.from('programs').upsert(rowWithMobility);

  if (error?.message.includes('mobility_session_ids')) {
    ({ error } = await db.from('programs').upsert(rowWithSignatures));
  }

  if (error?.message.includes('signature_session_ids')) {
    ({ error } = await db.from('programs').upsert(baseRow));
    if (!error && signatureSessionIds.length > 1) {
      const t = createTranslator(await getLocale());
      throw new Error(t('programs.migrationError'));
    }
  }

  if (error?.message.includes('method_id')) {
    throw new Error('Migration Supabase manquante : exécute 017_methods_hierarchy.sql');
  }

  if (error) throw new Error(error.message);

  const selectedVideoIds = [...signatureSessionIds, ...mobilitySessionIds, ...complementarySessionIds];
  if (selectedVideoIds.length > 0) {
    const { error: videoError } = await db
      .from('videos')
      .update({ program_id: id, updated_at: new Date().toISOString() })
      .in('id', selectedVideoIds);
    if (videoError) throw new Error(videoError.message);
  }

  revalidatePath('/methods');
  revalidatePath(`/methods/${methodId}`);
  revalidatePath(`/methods/${methodId}/programs/${id}`);
  revalidatePath('/videos');
  revalidatePath('/');
  return id;
}

export async function deleteProgram(methodId: string, programId: string) {
  const db = createAdminClient();
  const { error } = await db.from('programs').delete().eq('id', programId);
  if (error) throw new Error(error.message);

  revalidatePath('/methods');
  revalidatePath(`/methods/${methodId}`);
  revalidatePath('/videos');
  revalidatePath('/');
}
