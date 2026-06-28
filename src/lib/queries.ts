import { cache } from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  resolveUserListRow,
  type UserListRow,
} from '@/lib/stripe/subscription-display';
import type { Exercise, Program, Profile, StripeProduct, Subscription } from '@/lib/types';

export const getProgramsList = cache(async (): Promise<Pick<Program, 'id' | 'title'>[]> => {
  const db = createAdminClient();
  const { data } = await db.from('programs').select('id, title').order('sort_order');
  return data ?? [];
});

export const getExerciseLibrary = cache(async (): Promise<Exercise[]> => fetchExercisesForList());

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

export async function fetchStripeProductsCatalog(): Promise<StripeProduct[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from('stripe_products')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as StripeProduct[];
}

export async function fetchUsersWithSubscriptions(limit = 500): Promise<UserListRow[]> {
  const db = createAdminClient();
  const [profiles, products] = await Promise.all([
    fetchProfilesForList(limit),
    fetchStripeProductsCatalog(),
  ]);

  if (profiles.length === 0) return [];

  const userIds = profiles.map((profile) => profile.id);
  const { data: subs, error } = await db
    .from('subscriptions')
    .select('*')
    .in('user_id', userIds);

  if (error) throw new Error(error.message);

  const subsByUser = new Map<string, Subscription[]>();
  for (const sub of (subs ?? []) as Subscription[]) {
    const list = subsByUser.get(sub.user_id) ?? [];
    list.push(sub);
    subsByUser.set(sub.user_id, list);
  }

  return profiles.map((profile) =>
    resolveUserListRow(profile, subsByUser.get(profile.id) ?? [], products)
  );
}

const EXERCISE_LIST_COLUMNS =
  'id, name, muscle_groups, vimeo_video_id, vimeo_hash, created_at, updated_at';

const EXERCISE_LIST_COLUMNS_FULL =
  'id, name, description, muscle_groups, vimeo_video_id, vimeo_hash, created_at, updated_at';

export async function fetchExercisesForList(): Promise<Exercise[]> {
  const db = createAdminClient();

  const withDescription = await db.from('exercises').select(EXERCISE_LIST_COLUMNS_FULL).order('name');
  if (!withDescription.error && withDescription.data) {
    return withDescription.data as Exercise[];
  }

  const fallback = await db.from('exercises').select(EXERCISE_LIST_COLUMNS).order('name');
  if (fallback.error) throw new Error(fallback.error.message);
  return (fallback.data ?? []) as Exercise[];
}
