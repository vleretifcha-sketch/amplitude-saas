'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { uniqueId } from '@/lib/slug';
import { resolveImageUrlFromForm } from '@/lib/upload-image';
import type { ExerciseDraft } from '@/lib/types';
import { removeVideoIdsFromPrograms } from '@/lib/program-cleanup';
import { isComplementarySessionType } from '@/lib/video-session';

async function syncProgramSessions(
  db: ReturnType<typeof createAdminClient>,
  programId: string,
  videoId: string,
  type: string
) {
  if (type === 'signature') {
    const { data: program } = await db
      .from('programs')
      .select('signature_session_ids')
      .eq('id', programId)
      .single();

    const ids = program?.signature_session_ids ?? [];
    if (!ids.includes(videoId)) {
      await db
        .from('programs')
        .update({
          signature_session_ids: [...ids, videoId],
          signature_session_id: ids.length === 0 ? videoId : ids[0],
        })
        .eq('id', programId);
    }
    return;
  }

  if (type === 'complementary') {
    const { data: program } = await db
      .from('programs')
      .select('complementary_session_ids')
      .eq('id', programId)
      .single();

    const ids = program?.complementary_session_ids ?? [];
    if (!ids.includes(videoId)) {
      await db
        .from('programs')
        .update({ complementary_session_ids: [...ids, videoId] })
        .eq('id', programId);
    }
    return;
  }

  if (type === 'mobility') {
    const { data: program } = await db
      .from('programs')
      .select('mobility_session_ids')
      .eq('id', programId)
      .single();

    const ids = program?.mobility_session_ids ?? [];
    if (!ids.includes(videoId)) {
      await db
        .from('programs')
        .update({ mobility_session_ids: [...ids, videoId] })
        .eq('id', programId);
    }
  }
}

function parseExercises(formData: FormData): ExerciseDraft[] {
  const raw = formData.get('exercises_payload');
  if (!raw) return [];

  try {
    const parsed = JSON.parse(String(raw)) as ExerciseDraft[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function syncVideoExercises(
  db: ReturnType<typeof createAdminClient>,
  videoId: string,
  type: string,
  exercises: ExerciseDraft[]
) {
  if (!isComplementarySessionType(type)) {
    await db.from('video_exercises').delete().eq('video_id', videoId);
    return;
  }

  const keptIds: string[] = [];

  for (const [index, exercise] of exercises.entries()) {
    const libraryExerciseId = exercise.library_exercise_id.trim();
    if (!libraryExerciseId) continue;

    const { data: libraryExercise } = await db
      .from('exercises')
      .select('name, muscle_groups')
      .eq('id', libraryExerciseId)
      .single();

    if (!libraryExercise) continue;

    const name = libraryExercise.name.trim();
    const id = exercise.id?.trim() || (await uniqueId(db, 'video_exercises', 'ex-', name));
    keptIds.push(id);

    const { error } = await db.from('video_exercises').upsert({
      id,
      video_id: videoId,
      library_exercise_id: libraryExerciseId,
      name,
      target_sets: Number(exercise.target_sets) || 1,
      target_reps: Number(exercise.target_reps) || 1,
      sort_order: Number(exercise.sort_order) || index + 1,
      muscle_groups: libraryExercise.muscle_groups?.trim() || null,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
  }

  const { data: existing } = await db.from('video_exercises').select('id').eq('video_id', videoId);
  const toDelete = (existing ?? []).map((row) => row.id).filter((id) => !keptIds.includes(id));
  if (toDelete.length > 0) {
    const { error } = await db.from('video_exercises').delete().in('id', toDelete);
    if (error) throw new Error(error.message);
  }
}

export async function upsertVideo(formData: FormData): Promise<string> {
  const db = createAdminClient();
  const existingId = String(formData.get('id') || '').trim();
  const title = String(formData.get('title')).trim();
  const status = String(formData.get('status'));
  const publishedAt = formData.get('published_at');
  const type = String(formData.get('type'));
  const programId = String(formData.get('program_id'));

  const id = existingId || (await uniqueId(db, 'videos', 'vid-', title));
  const thumbnailUrl = await resolveImageUrlFromForm(formData, {
    folder: `videos/${id}`,
    urlField: 'thumbnail_url',
    fileField: 'thumbnail_file',
  });

  const row = {
    id,
    program_id: programId,
    title,
    description: String(formData.get('description') || '') || null,
    duration_seconds: isComplementarySessionType(type)
      ? 0
      : Number(formData.get('duration_seconds') || 0),
    thumbnail_url: thumbnailUrl,
    vimeo_video_id: isComplementarySessionType(type)
      ? String(formData.get('vimeo_video_id') || '').trim() || 'none'
      : String(formData.get('vimeo_video_id')).trim(),
    vimeo_hash: isComplementarySessionType(type)
      ? null
      : String(formData.get('vimeo_hash') || '') || null,
    type,
    week_number: Number(formData.get('week_number') || 1),
    order_in_week: Number(formData.get('order_in_week') || 1),
    status,
    published_at:
      status === 'published'
        ? publishedAt
          ? String(publishedAt)
          : new Date().toISOString()
        : null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await db.from('videos').upsert(row);
  if (error) throw new Error(error.message);

  await syncProgramSessions(db, programId, id, type);
  await syncVideoExercises(db, id, type, parseExercises(formData));

  revalidatePath('/videos');
  revalidatePath(`/videos/${row.id}`);
  revalidatePath('/programs');
  revalidatePath(`/programs/${programId}`);
  revalidatePath('/exercises');
  return row.id;
}

export async function deleteVideo(id: string) {
  const db = createAdminClient();
  await removeVideoIdsFromPrograms(db, [id]);

  const { error } = await db.from('videos').delete().eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath('/videos');
  revalidatePath('/programs');
  revalidatePath('/exercises');
  revalidatePath('/');
}
