'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { slugify, uniqueId } from '@/lib/slug';
import { resolveImageUrlFromForm } from '@/lib/upload-image';
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
  const title = String(formData.get('title')).trim();
  const signatureSessionIds = parseIdList(formData.get('signature_session_ids'));
  const complementarySessionIds = parseIdList(formData.get('complementary_session_ids'));

  const id = existingId || (await uniqueId(db, 'programs', 'prog-', title));
  const coverImageUrl = await resolveImageUrlFromForm(formData, {
    folder: `programs/${id}`,
    urlField: 'cover_image_url',
    fileField: 'cover_image_file',
  });

  const baseRow = {
    id,
    title,
    subtitle: String(formData.get('subtitle') || '') || null,
    goal: slugify(title),
    description: String(formData.get('description') || '') || null,
    duration_weeks: Number(formData.get('duration_weeks') || 4),
    cover_image_url: coverImageUrl,
    tagline: String(formData.get('tagline') || '') || null,
    signature_session_id: signatureSessionIds[0] ?? null,
    complementary_session_ids: complementarySessionIds,
    is_premium: formData.get('is_premium') === 'on',
    sort_order: Number(formData.get('sort_order') || 0),
    updated_at: new Date().toISOString(),
  };

  const rowWithSignatures = { ...baseRow, signature_session_ids: signatureSessionIds };
  let { error } = await db.from('programs').upsert(rowWithSignatures);

  if (error?.message.includes('signature_session_ids')) {
    ({ error } = await db.from('programs').upsert(baseRow));
    if (!error && signatureSessionIds.length > 1) {
      const t = createTranslator(await getLocale());
      throw new Error(t('programs.migrationError'));
    }
  }

  if (error) throw new Error(error.message);

  const selectedVideoIds = [...signatureSessionIds, ...complementarySessionIds];
  if (selectedVideoIds.length > 0) {
    const { error: videoError } = await db
      .from('videos')
      .update({ program_id: id, updated_at: new Date().toISOString() })
      .in('id', selectedVideoIds);
    if (videoError) throw new Error(videoError.message);
  }

  revalidatePath('/programs');
  revalidatePath('/videos');
  revalidatePath(`/programs/${id}`);
  revalidatePath('/');
  return id;
}

export async function deleteProgram(id: string) {
  const db = createAdminClient();
  const { error } = await db.from('programs').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/programs');
}
