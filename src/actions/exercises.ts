'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { uniqueId } from '@/lib/slug';
import { parseVimeoFields } from '@/lib/vimeo';

export async function upsertLibraryExercise(formData: FormData): Promise<string> {
  const db = createAdminClient();
  const existingId = String(formData.get('id') || '').trim();
  const name = String(formData.get('name')).trim();

  const id = existingId || (await uniqueId(db, 'exercises', 'ex-', name));

  const vimeo = parseVimeoFields(
    String(formData.get('vimeo_video_id') || ''),
    String(formData.get('vimeo_hash') || '') || null
  );

  const row = {
    id,
    name,
    description: String(formData.get('description') || '').trim() || null,
    muscle_groups: String(formData.get('muscle_groups') || '') || null,
    vimeo_video_id: vimeo.videoId,
    vimeo_hash: vimeo.hash,
    updated_at: new Date().toISOString(),
  };

  let { error } = await db.from('exercises').upsert(row);
  if (error?.message.includes('description')) {
    const { description: _d, ...rowWithoutDescription } = row;
    ({ error } = await db.from('exercises').upsert(rowWithoutDescription));
  }
  if (error) throw new Error(error.message);

  await db
    .from('video_exercises')
    .update({
      name: row.name,
      muscle_groups: row.muscle_groups,
      updated_at: new Date().toISOString(),
    })
    .eq('library_exercise_id', id);

  revalidatePath('/exercises');
  revalidatePath(`/exercises/${row.id}`);
  revalidatePath('/videos');
  return row.id;
}

export async function deleteLibraryExercise(id: string) {
  const db = createAdminClient();
  const { count } = await db
    .from('video_exercises')
    .select('*', { count: 'exact', head: true })
    .eq('library_exercise_id', id);

  if ((count ?? 0) > 0) {
    throw new Error('Cet exercice est utilisé dans au moins une séance.');
  }

  const { error } = await db.from('exercises').delete().eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath('/exercises');
  revalidatePath('/videos');
  revalidatePath('/');
}

export async function importLibraryFromPrescriptions(): Promise<number> {
  const db = createAdminClient();
  const { data: prescriptions } = await db
    .from('video_exercises')
    .select('name, muscle_groups')
    .order('name');

  if (!prescriptions?.length) return 0;

  const byName = new Map<string, string | null>();
  for (const row of prescriptions) {
    const name = row.name.trim();
    if (!name || byName.has(name)) continue;
    byName.set(name, row.muscle_groups?.trim() || null);
  }

  let imported = 0;
  for (const [name, muscle_groups] of byName) {
    const { data: existing } = await db.from('exercises').select('id').eq('name', name).maybeSingle();
    const id = existing?.id ?? (await uniqueId(db, 'exercises', 'ex-', name));

    const { error } = await db.from('exercises').upsert({
      id,
      name,
      muscle_groups,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);

    await db
      .from('video_exercises')
      .update({ library_exercise_id: id })
      .eq('name', name)
      .is('library_exercise_id', null);

    imported += 1;
  }

  revalidatePath('/exercises');
  revalidatePath('/videos');
  return imported;
}
