'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { useLocale } from '@/i18n/client';

export function PageHeader({
  title,
  description,
  action,
  backHref,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  backHref?: string;
}) {
  const { t } = useLocale();

  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        {backHref ? (
          <Link href={backHref} className="mb-2 inline-block text-sm text-muted hover:text-accent">
            {t('common.back')}
          </Link>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="mt-1 text-sm text-secondary">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
