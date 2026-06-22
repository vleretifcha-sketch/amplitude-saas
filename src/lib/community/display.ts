import type { CommunityPostAuthor } from '@/lib/types';

export function authorDisplayName(author: CommunityPostAuthor, fallback: string): string {
  const name = [author.first_name, author.last_name].filter(Boolean).join(' ');
  return name || author.email || fallback;
}
