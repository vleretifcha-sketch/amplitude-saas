import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { createTranslator } from '@/i18n';

export function CommunityPagination({
  page,
  totalPages,
  query,
  locale,
}: {
  page: number;
  totalPages: number;
  query: string;
  locale: 'fr' | 'en';
}) {
  const t = createTranslator(locale);
  if (totalPages <= 1) return null;

  function hrefFor(nextPage: number) {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    params.set('page', String(nextPage));
    return `/community?${params.toString()}`;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
      <p className="text-sm text-muted">{t('community.page', { page, total: totalPages })}</p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={hrefFor(page - 1)}>
            <Button variant="secondary" size="sm">
              {t('community.previous')}
            </Button>
          </Link>
        ) : null}
        {page < totalPages ? (
          <Link href={hrefFor(page + 1)}>
            <Button variant="secondary" size="sm">
              {t('community.next')}
            </Button>
          </Link>
        ) : null}
      </div>
    </div>
  );
}
