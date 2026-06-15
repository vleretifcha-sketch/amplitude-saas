'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { slugify, uniqueId } from '@/lib/slug';
import { resolveImageUrlFromForm } from '@/lib/upload-image';
import type { ProgramStatus } from '@/lib/types';

async function resolvePublishedAt(
  db: ReturnType<typeof createAdminClient>,
  existingId: string,
  status: ProgramStatus
): Promise<string | null> {
  if (status !== 'published') return null;
  if (!existingId) return new Date().toISOString();

  const { data } = await db.from('methods').select('status, published_at').eq('id', existingId).single();
  if (data?.status === 'published' && data.published_at) return data.published_at;
  return new Date().toISOString();
}

export async function setMethodPublished(methodId: string, published: boolean) {
  const db = createAdminClient();
  const status: ProgramStatus = published ? 'published' : 'draft';
  const publishedAt = published ? await resolvePublishedAt(db, methodId, status) : null;

  const { error } = await db
    .from('methods')
    .update({ status, published_at: publishedAt, updated_at: new Date().toISOString() })
    .eq('id', methodId);

  if (error?.message.includes('methods')) {
    throw new Error('Migration Supabase manquante : exécute 017_methods_hierarchy.sql');
  }
  if (error) throw new Error(error.message);

  revalidatePath('/methods');
  revalidatePath(`/methods/${methodId}`);
  revalidatePath('/');
}

export async function setMethodPremium(methodId: string, isPremium: boolean) {
  const db = createAdminClient();
  const { error } = await db
    .from('methods')
    .update({ is_premium: isPremium, updated_at: new Date().toISOString() })
    .eq('id', methodId);

  if (error) throw new Error(error.message);

  revalidatePath('/methods');
  revalidatePath(`/methods/${methodId}`);
  revalidatePath('/');
}

export async function upsertMethod(formData: FormData): Promise<string> {
  const db = createAdminClient();
  const existingId = String(formData.get('id') || '').trim();
  const title = String(formData.get('title')).trim();
  const status = (String(formData.get('status') || 'draft') === 'published'
    ? 'published'
    : 'draft') as ProgramStatus;

  const id = existingId || (await uniqueId(db, 'methods', 'meth-', title));
  const coverImageUrl = await resolveImageUrlFromForm(formData, {
    folder: `methods/${id}`,
    urlField: 'cover_image_url',
    fileField: 'cover_image_file',
  });

  const publishedAt = await resolvePublishedAt(db, existingId, status);
  const row = {
    id,
    title,
    subtitle: String(formData.get('subtitle') || '') || null,
    goal: slugify(title),
    description: String(formData.get('description') || '') || null,
    cover_image_url: coverImageUrl,
    tagline: String(formData.get('tagline') || '') || null,
    is_premium: formData.get('is_premium') === 'on',
    status,
    published_at: publishedAt,
    sort_order: Number(formData.get('sort_order') || 0),
    updated_at: new Date().toISOString(),
  };

  const { error } = await db.from('methods').upsert(row);
  if (error) throw new Error(error.message);

  revalidatePath('/methods');
  revalidatePath(`/methods/${id}`);
  revalidatePath('/');
  return id;
}

export async function deleteMethod(id: string) {
  const db = createAdminClient();
  const { error } = await db.from('methods').delete().eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath('/methods');
  revalidatePath('/videos');
  revalidatePath('/');
}
