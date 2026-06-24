'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { uniqueId } from '@/lib/slug';
import { createTranslator, getLocale } from '@/i18n';
import { getSessionSectionOrder } from '@/lib/session-section-order';
import { sanitizeSessionIdsByVideoType } from '@/lib/program-session-ids';

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

export type UpsertProgramResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

function stripDescription<T extends { description?: string | null }>(row: T): Omit<T, 'description'> {
  const { description: _description, ...rest } = row;
  return rest;
}

export async function upsertProgram(formData: FormData): Promise<UpsertProgramResult> {
  const db = createAdminClient();
  const existingId = String(formData.get('id') || '').trim();
  const methodId = String(formData.get('method_id') || '').trim();
  const title = String(formData.get('title')).trim();
  const description = String(formData.get('description') || '').trim() || null;
  const signatureSessionIds = parseIdList(formData.get('signature_session_ids'));
  const complementarySessionIds = parseIdList(formData.get('complementary_session_ids'));
  const mobilitySessionIds = parseIdList(formData.get('mobility_session_ids'));
  const sessionSectionOrder = getSessionSectionOrder();

  if (!methodId) return { ok: false, error: 'method_id is required' };

  const id = existingId || (await uniqueId(db, 'programs', 'prog-', title));

  const sanitized = await sanitizeSessionIdsByVideoType(
    db,
    signatureSessionIds,
    mobilitySessionIds,
    complementarySessionIds
  );
  const {
    signatureSessionIds: cleanSignatureIds,
    mobilitySessionIds: cleanMobilityIds,
    complementarySessionIds: cleanComplementaryIds,
  } = sanitized;

  const baseRow = {
    id,
    method_id: methodId,
    title,
    description,
    duration_weeks: Number(formData.get('duration_weeks') || 4),
    signature_session_id: cleanSignatureIds[0] ?? null,
    complementary_session_ids: cleanComplementaryIds,
    sort_order: Number(formData.get('sort_order') || 0),
    updated_at: new Date().toISOString(),
  };

  const rowWithSignatures = { ...baseRow, signature_session_ids: cleanSignatureIds };
  const rowWithMobility = {
    ...rowWithSignatures,
    mobility_session_ids: cleanMobilityIds,
    session_section_order: sessionSectionOrder,
  };
  let { error } = await db.from('programs').upsert(rowWithMobility);

  if (error?.message.includes('session_section_order')) {
    ({ error } = await db.from('programs').upsert(rowWithSignatures));
  }

  if (error?.message.includes('mobility_session_ids')) {
    ({ error } = await db.from('programs').upsert(rowWithSignatures));
  }

  if (error?.message.includes('signature_session_ids')) {
    ({ error } = await db.from('programs').upsert(baseRow));
    if (!error && cleanSignatureIds.length > 1) {
      const t = createTranslator(await getLocale());
      return { ok: false, error: t('programs.migrationError') };
    }
  }

  if (error?.message.includes('description')) {
    for (const candidate of [
      stripDescription(rowWithMobility),
      stripDescription(rowWithSignatures),
      stripDescription(baseRow),
    ]) {
      const attempt = await db.from('programs').upsert(candidate);
      if (!attempt.error) {
        error = null;
        break;
      }
      error = attempt.error;
    }

    if (!error) {
      const t = createTranslator(await getLocale());
      return { ok: false, error: t('programs.descriptionMigrationError') };
    }
  }

  if (error?.message.includes('method_id')) {
    return {
      ok: false,
      error: 'Migration Supabase manquante : exécute 017_methods_hierarchy.sql',
    };
  }

  if (error) return { ok: false, error: error.message };

  const selectedVideoIds = [...cleanSignatureIds, ...cleanMobilityIds, ...cleanComplementaryIds];
  if (selectedVideoIds.length > 0) {
    const { error: videoError } = await db
      .from('videos')
      .update({ program_id: id, updated_at: new Date().toISOString() })
      .in('id', selectedVideoIds);
    if (videoError) return { ok: false, error: videoError.message };
  }

  revalidatePath('/methods');
  revalidatePath(`/methods/${methodId}`);
  revalidatePath(`/methods/${methodId}/programs/${id}`);
  revalidatePath('/videos');
  revalidatePath('/');
  return { ok: true, id };
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
