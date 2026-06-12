import { cache } from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Exercise, Program } from '@/lib/types';

export const getProgramsList = cache(async (): Promise<Pick<Program, 'id' | 'title'>[]> => {
  const db = createAdminClient();
  const { data } = await db.from('programs').select('id, title').order('sort_order');
  return data ?? [];
});

export const getExerciseLibrary = cache(async (): Promise<Exercise[]> => {
  const db = createAdminClient();
  const { data } = await db
    .from('exercises')
    .select('id, name, description, muscle_groups, vimeo_video_id, vimeo_hash, created_at, updated_at')
    .order('name');
  return (data ?? []) as Exercise[];
});
