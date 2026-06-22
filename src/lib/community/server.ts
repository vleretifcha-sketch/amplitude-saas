import { createAdminClient } from '@/lib/supabase/admin';
import type { CommunityCommentAdmin, CommunityPostAdmin, CommunityPostAuthor, CommunityStats } from '@/lib/types';

const PAGE_SIZE = 20;

type RawPost = {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  program_title: string | null;
  session_title: string | null;
  created_at: string;
};

type RawComment = {
  id: string;
  post_id: string;
  content: string;
  created_at: string;
  user_id: string;
};

function authorFromMap(userId: string, profiles: Map<string, CommunityPostAuthor>): CommunityPostAuthor {
  return (
    profiles.get(userId) ?? {
      id: userId,
      email: '',
      first_name: null,
      last_name: null,
      avatar_url: null,
    }
  );
}

function mapComment(raw: RawComment, profiles: Map<string, CommunityPostAuthor>): CommunityCommentAdmin {
  return {
    id: raw.id,
    post_id: raw.post_id,
    content: raw.content,
    created_at: raw.created_at,
    author: authorFromMap(raw.user_id, profiles),
  };
}

function mapPost(
  raw: RawPost,
  comments: CommunityCommentAdmin[],
  likes: number,
  profiles: Map<string, CommunityPostAuthor>
): CommunityPostAdmin {
  return {
    id: raw.id,
    user_id: raw.user_id,
    content: raw.content,
    image_url: raw.image_url,
    program_title: raw.program_title,
    session_title: raw.session_title,
    created_at: raw.created_at,
    likes,
    comments_count: comments.length,
    author: authorFromMap(raw.user_id, profiles),
    comments,
  };
}

async function fetchProfilesByIds(
  db: ReturnType<typeof createAdminClient>,
  userIds: string[]
): Promise<Map<string, CommunityPostAuthor>> {
  const profiles = new Map<string, CommunityPostAuthor>();
  if (userIds.length === 0) return profiles;

  const { data, error } = await db
    .from('profiles')
    .select('id, email, first_name, last_name, avatar_url')
    .in('id', userIds);

  if (error) throw new Error(error.message);

  for (const profile of data ?? []) {
    profiles.set(profile.id, {
      id: profile.id,
      email: profile.email,
      first_name: profile.first_name,
      last_name: profile.last_name,
      avatar_url: profile.avatar_url,
    });
  }

  return profiles;
}

function countByPostId(rows: { post_id: string }[] | null): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows ?? []) {
    counts.set(row.post_id, (counts.get(row.post_id) ?? 0) + 1);
  }
  return counts;
}

function escapeIlike(term: string): string {
  return term.replace(/[%_,]/g, ' ').trim();
}

export async function fetchCommunityStats(): Promise<CommunityStats> {
  try {
    const db = createAdminClient();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [posts, weekPosts, comments] = await Promise.all([
      db.from('community_posts').select('*', { count: 'exact', head: true }),
      db.from('community_posts').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
      db.from('community_comments').select('*', { count: 'exact', head: true }),
    ]);

    return {
      totalPosts: posts.count ?? 0,
      postsThisWeek: weekPosts.count ?? 0,
      totalComments: comments.count ?? 0,
    };
  } catch (error) {
    console.error('Failed to fetch community stats:', error);
    return { totalPosts: 0, postsThisWeek: 0, totalComments: 0 };
  }
}

export async function fetchCommunityPosts(options: {
  q?: string;
  page?: number;
}): Promise<{ posts: CommunityPostAdmin[]; total: number; page: number; pageSize: number; error?: string }> {
  try {
    const db = createAdminClient();
    const page = Math.max(1, options.page ?? 1);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const term = escapeIlike(options.q ?? '');

    let query = db
      .from('community_posts')
      .select('id, user_id, content, image_url, program_title, session_title, created_at', {
        count: 'exact',
      })
      .order('created_at', { ascending: false });

    if (term) {
      const { data: matchingProfiles } = await db
        .from('profiles')
        .select('id')
        .or(`email.ilike.%${term}%,first_name.ilike.%${term}%,last_name.ilike.%${term}%`);

      const profileIds = (matchingProfiles ?? []).map((profile) => profile.id);
      const contentFilter = `content.ilike.%${term}%,program_title.ilike.%${term}%,session_title.ilike.%${term}%`;

      if (profileIds.length > 0) {
        query = query.or(`${contentFilter},user_id.in.(${profileIds.join(',')})`);
      } else {
        query = query.or(contentFilter);
      }
    }

    const { data, count, error } = await query.range(from, to);
    if (error) throw new Error(error.message);

    const rawPosts = (data ?? []) as RawPost[];
    const postIds = rawPosts.map((post) => post.id);

    let commentsByPost = new Map<string, CommunityCommentAdmin[]>();
    let likeCounts = new Map<string, number>();
    let profiles = new Map<string, CommunityPostAuthor>();

    if (postIds.length > 0) {
      const [{ data: rawComments, error: commentsError }, { data: rawLikes, error: likesError }] =
        await Promise.all([
          db
            .from('community_comments')
            .select('id, post_id, content, created_at, user_id')
            .in('post_id', postIds)
            .order('created_at', { ascending: true }),
          db.from('community_likes').select('post_id').in('post_id', postIds),
        ]);

      if (commentsError) throw new Error(commentsError.message);
      if (likesError) throw new Error(likesError.message);

      likeCounts = countByPostId(rawLikes);

      const userIds = [
        ...new Set([
          ...rawPosts.map((post) => post.user_id),
          ...(rawComments ?? []).map((comment) => comment.user_id),
        ]),
      ];
      profiles = await fetchProfilesByIds(db, userIds);

      commentsByPost = (rawComments ?? []).reduce((map, raw) => {
        const comment = mapComment(raw as RawComment, profiles);
        const list = map.get(comment.post_id) ?? [];
        list.push(comment);
        map.set(comment.post_id, list);
        return map;
      }, new Map<string, CommunityCommentAdmin[]>());
    } else if (rawPosts.length > 0) {
      profiles = await fetchProfilesByIds(db, [...new Set(rawPosts.map((post) => post.user_id))]);
    }

    return {
      posts: rawPosts.map((post) =>
        mapPost(post, commentsByPost.get(post.id) ?? [], likeCounts.get(post.id) ?? 0, profiles)
      ),
      total: count ?? 0,
      page,
      pageSize: PAGE_SIZE,
    };
  } catch (error) {
    console.error('Failed to fetch community posts:', error);
    return {
      posts: [],
      total: 0,
      page: Math.max(1, options.page ?? 1),
      pageSize: PAGE_SIZE,
      error: error instanceof Error ? error.message : 'Failed to load community posts.',
    };
  }
}
