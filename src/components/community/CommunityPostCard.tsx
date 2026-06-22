'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Heart, MessageCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DeleteCommunityPostButton } from '@/components/community/DeleteCommunityPostButton';
import { DeleteCommunityCommentButton } from '@/components/community/DeleteCommunityCommentButton';
import { authorDisplayName } from '@/lib/community/display';
import { useLocale } from '@/i18n/client';
import type { CommunityPostAdmin } from '@/lib/types';

export function CommunityPostCard({
  post,
  dateLocale,
}: {
  post: CommunityPostAdmin;
  dateLocale: string;
}) {
  const { t } = useLocale();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const authorName = authorDisplayName(post.author, t('common.user'));

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/users/${post.author.id}`} className="text-sm font-medium hover:text-accent">
              {authorName}
            </Link>
            {post.author.email ? (
              <span className="text-xs text-muted">{post.author.email}</span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-muted">
            {new Date(post.created_at).toLocaleString(dateLocale)}
          </p>

          {(post.program_title || post.session_title) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {post.program_title ? (
                <Badge tone="muted">{t('community.contextProgram', { title: post.program_title })}</Badge>
              ) : null}
              {post.session_title ? (
                <Badge tone="muted">{t('community.contextSession', { title: post.session_title })}</Badge>
              ) : null}
            </div>
          )}

          <p className="mt-3 whitespace-pre-wrap text-sm">{post.content}</p>

          {post.image_url ? (
            <a
              href={post.image_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block overflow-hidden rounded-2xl border border-border-subtle"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.image_url}
                alt=""
                className="max-h-80 max-w-full object-cover"
              />
            </a>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-secondary">
            <span className="inline-flex items-center gap-1.5">
              <Heart className="h-4 w-4" aria-hidden />
              {post.likes === 1
                ? t('community.likes', { count: post.likes })
                : t('community.likesPlural', { count: post.likes })}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MessageCircle className="h-4 w-4" aria-hidden />
              {post.comments_count === 1
                ? t('community.comments', { count: post.comments_count })
                : t('community.commentsPlural', { count: post.comments_count })}
            </span>
            <Link href={`/users/${post.author.id}`} className="text-xs text-muted hover:text-accent">
              {t('community.viewProfile')}
            </Link>
          </div>

          {post.comments_count > 0 ? (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setCommentsOpen((open) => !open)}
                className="text-sm font-medium text-accent hover:underline"
              >
                {commentsOpen ? t('community.hideComments') : t('community.viewComments')}
              </button>
              {commentsOpen ? (
                <ul className="mt-3 space-y-3 border-l border-border-subtle pl-4">
                  {post.comments.length === 0 ? (
                    <li className="text-sm text-muted">{t('community.noComments')}</li>
                  ) : (
                    post.comments.map((comment) => {
                      const commentAuthor = authorDisplayName(comment.author, t('common.user'));
                      return (
                        <li key={comment.id} className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-medium">{commentAuthor}</p>
                            <p className="mt-1 text-xs text-muted">
                              {new Date(comment.created_at).toLocaleString(dateLocale)}
                            </p>
                            <p className="mt-2 whitespace-pre-wrap text-sm">{comment.content}</p>
                          </div>
                          <DeleteCommunityCommentButton commentId={comment.id} />
                        </li>
                      );
                    })
                  )}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
        <DeleteCommunityPostButton postId={post.id} />
      </div>
    </Card>
  );
}
