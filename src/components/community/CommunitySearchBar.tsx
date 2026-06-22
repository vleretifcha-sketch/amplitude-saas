'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useLocale } from '@/i18n/client';

export function CommunitySearchBar({ initialQuery }: { initialQuery: string }) {
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = query.trim();
    if (trimmed) params.set('q', trimmed);
    else params.delete('q');
    params.delete('page');
    router.push(`/community?${params.toString()}`);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-3">
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t('community.searchPlaceholder')}
        className="max-w-md flex-1"
      />
      <Button type="submit" variant="secondary">
        {t('community.search')}
      </Button>
      {initialQuery ? (
        <Link href="/community" className="text-sm text-muted hover:text-accent">
          {t('community.clearSearch')}
        </Link>
      ) : null}
    </form>
  );
}
