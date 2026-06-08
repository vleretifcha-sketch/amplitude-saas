import { createAdminClient } from '@/lib/supabase/admin';
import type { DashboardStats } from '@/lib/types';

export async function getDashboardStats(): Promise<DashboardStats> {
  const db = createAdminClient();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [users, activeSubs, programs, videos, sessions, posts] = await Promise.all([
    db.from('profiles').select('*', { count: 'exact', head: true }),
    db.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active'),
    db.from('programs').select('*', { count: 'exact', head: true }),
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
}
