import { Suspense } from 'react';
import { CommunityPageContent } from '@/components/community/CommunityPageContent';
import { PageLoadingSkeleton } from '@/components/ui/PageLoadingSkeleton';
import { getLocale } from '@/i18n';

export const revalidate = 30;

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const locale = await getLocale();
  const { q, page: pageParam } = await searchParams;
  const query = q?.trim() ?? '';
  const page = Math.max(1, Number(pageParam) || 1);

  return (
    <Suspense fallback={<PageLoadingSkeleton />}>
      <CommunityPageContent locale={locale} query={query} page={page} />
    </Suspense>
  );
}
