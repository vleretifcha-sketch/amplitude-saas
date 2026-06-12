import Link from 'next/link';
import { Suspense } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { TableLoadingSkeleton } from '@/components/ui/PageLoadingSkeleton';
import { VideosTableSection } from '@/components/videos/VideosTableSection';
import { createTranslator, getLocale } from '@/i18n';

export const revalidate = 30;

export default async function VideosPage() {
  const locale = await getLocale();
  const t = createTranslator(locale);

  return (
    <div>
      <PageHeader
        title={t('videos.title')}
        description={t('videos.description')}
        action={
          <Link href="/videos/new">
            <Button>{t('videos.new')}</Button>
          </Link>
        }
      />
      <Suspense fallback={<TableLoadingSkeleton rows={10} />}>
        <VideosTableSection locale={locale} />
      </Suspense>
    </div>
  );
}
