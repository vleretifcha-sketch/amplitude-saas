import { Suspense } from 'react';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { CommunityPostCard } from '@/components/community/CommunityPostCard';
import { CommunitySearchBar } from '@/components/community/CommunitySearchBar';
import { CommunityPagination } from '@/components/community/CommunityPagination';
import { fetchCommunityPosts, fetchCommunityStats } from '@/lib/community/server';
import { createTranslator, getDateLocale } from '@/i18n';

export async function CommunityPageContent({
  locale,
  query,
  page,
}: {
  locale: 'fr' | 'en';
  query: string;
  page: number;
}) {
  const t = createTranslator(locale);
  const dateLocale = getDateLocale(locale);
  const [stats, postsResult] = await Promise.all([
    fetchCommunityStats(),
    fetchCommunityPosts({ q: query, page }),
  ]);
  const { posts, total, pageSize, error: loadError } = postsResult;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <PageHeader title={t('community.title')} description={t('community.description')} />

      {loadError ? (
        <div className="mb-6 rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {loadError}
        </div>
      ) : null}

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-secondary">{t('community.statsPosts')}</p>
          <p className="mt-2 text-3xl font-semibold text-accent">{stats.totalPosts}</p>
        </Card>
        <Card>
          <p className="text-sm text-secondary">{t('community.statsWeek')}</p>
          <p className="mt-2 text-3xl font-semibold text-accent">{stats.postsThisWeek}</p>
        </Card>
        <Card>
          <p className="text-sm text-secondary">{t('community.statsComments')}</p>
          <p className="mt-2 text-3xl font-semibold text-accent">{stats.totalComments}</p>
        </Card>
      </div>

      <div className="mb-6">
        <Suspense fallback={null}>
          <CommunitySearchBar initialQuery={query} />
        </Suspense>
      </div>

      <div className="space-y-4">
        {posts.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted">
            {query ? t('community.emptySearch') : t('community.empty')}
          </Card>
        ) : (
          posts.map((post) => (
            <CommunityPostCard key={post.id} post={post} dateLocale={dateLocale} />
          ))
        )}
      </div>

      <CommunityPagination page={page} totalPages={totalPages} query={query} locale={locale} />
    </div>
  );
}
