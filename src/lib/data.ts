import { createAdminClient } from '@/lib/supabase/admin';
import { isServerConfigured } from '@/lib/env';
import type {
  DashboardStats,
  Profile,
  RecentSubscriptionRow,
  SubscriptionChartRow,
} from '@/lib/types';

const emptyStats: DashboardStats = {
  users: 0,
  activeSubscriptions: 0,
  programs: 0,
  publishedVideos: 0,
  sessionsThisMonth: 0,
  communityPosts: 0,
};

export async function getDashboardStats(): Promise<DashboardStats> {
  if (!isServerConfigured()) return emptyStats;

  try {
    const db = createAdminClient();
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [users, activeSubs, programs, videos, sessions, posts] = await Promise.all([
      db.from('profiles').select('*', { count: 'exact', head: true }),
      db.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active'),
      db.from('methods').select('*', { count: 'exact', head: true }),
      db.from('videos').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      db
        .from('session_logs')
        .select('*', { count: 'exact', head: true })
        .gte('completed_at', monthStart.toISOString()),
      db.from('community_posts').select('*', { count: 'exact', head: true }),
    ]);

    return {
      users: users.count ?? 0,
      activeSubscriptions: activeSubs.count ?? 0,
      programs: programs.count ?? 0,
      publishedVideos: videos.count ?? 0,
      sessionsThisMonth: sessions.count ?? 0,
      communityPosts: posts.count ?? 0,
    };
  } catch {
    return emptyStats;
  }
}

export async function getRecentSubscriptions(limit = 8): Promise<RecentSubscriptionRow[]> {
  if (!isServerConfigured()) return [];

  try {
    const db = createAdminClient();
    const { data } = await db
      .from('subscriptions')
      .select('id, user_id, product_id, status, platform, started_at, expires_at, profiles(email, first_name, last_name)')
      .order('started_at', { ascending: false })
      .limit(limit);

    return (data ?? []).map((row) => {
      const rawProfile = row.profiles as
        | Pick<Profile, 'email' | 'first_name' | 'last_name'>
        | Pick<Profile, 'email' | 'first_name' | 'last_name'>[]
        | null;
      const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;
      const userName =
        [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || profile?.email || row.user_id;
      return {
        id: row.id,
        user_id: row.user_id,
        userName,
        userEmail: profile?.email ?? '',
        product_id: row.product_id,
        status: row.status,
        platform: row.platform,
        started_at: row.started_at,
        expires_at: row.expires_at,
      };
    });
  } catch {
    return [];
  }
}

export async function getSubscriptionChartRows(): Promise<SubscriptionChartRow[]> {
  if (!isServerConfigured()) return [];

  try {
    const db = createAdminClient();
    const since = new Date();
    since.setFullYear(since.getFullYear() - 5);

    const { data } = await db
      .from('subscriptions')
      .select('started_at, status')
      .gte('started_at', since.toISOString())
      .order('started_at', { ascending: true });

    return (data ?? []) as SubscriptionChartRow[];
  } catch {
    return [];
  }
}
