import { cache } from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Exercise, Program, Profile } from '@/lib/types';

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

const PROFILE_LIST_COLUMNS =
  'id, email, first_name, last_name, subscription_status, subscription_expires_at, created_at';

const PROFILE_LIST_COLUMNS_STRIPE =
  'id, email, first_name, last_name, subscription_status, subscription_expires_at, subscription_plan, stripe_customer_id, created_at';

/** Liste profils — fallback si migration Stripe pas encore appliquée. */
export async function fetchProfilesForList(limit = 500): Promise<Profile[]> {
  const db = createAdminClient();

  const withStripe = await db
    .from('profiles')
    .select(PROFILE_LIST_COLUMNS_STRIPE)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (!withStripe.error && withStripe.data) {
    return withStripe.data as Profile[];
  }

  const fallback = await db
    .from('profiles')
    .select(PROFILE_LIST_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (fallback.error) throw new Error(fallback.error.message);
  return (fallback.data ?? []) as Profile[];
}
