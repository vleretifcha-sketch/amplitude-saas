'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Field, Input, Label, Select } from '@/components/ui/Input';
import { paginate, Pagination } from '@/components/ui/Pagination';
import { SubscriptionProductLabel } from '@/components/users/SubscriptionProductLabel';
import { useLocale } from '@/i18n/client';
import { translateStatus } from '@/i18n/translator';
import {
  isPremiumProfileStatus,
  matchesProductFilter,
  type ProductFilterValue,
  type UserListRow,
} from '@/lib/stripe/subscription-display';
import type { StripeProduct, SubscriptionStatus } from '@/lib/types';

const subTone: Record<SubscriptionStatus, 'success' | 'accent' | 'warning' | 'muted'> = {
  active: 'success',
  trial: 'accent',
  expired: 'warning',
  none: 'muted',
};

export function UsersTable({
  users,
  dateLocale,
  stripeProducts,
}: {
  users: UserListRow[];
  dateLocale: string;
  stripeProducts: StripeProduct[];
}) {
  const { t } = useLocale();
  const [query, setQuery] = useState('');
  const [productFilter, setProductFilter] = useState<ProductFilterValue>('all');
  const [page, setPage] = useState(1);

  const productFilters = useMemo(() => {
    const options: { value: ProductFilterValue; label: string }[] = [
      { value: 'all', label: t('users.filterProductAll') },
      { value: 'free', label: t('users.filterProductFree') },
    ];

    for (const product of stripeProducts.filter((p) => p.active)) {
      options.push({ value: product.id, label: product.name });
    }

    options.push(
      { value: 'manual', label: t('users.filterProductManual') },
      { value: 'unknown', label: t('users.filterProductUnknown') }
    );

    return options;
  }, [stripeProducts, t]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((user) => {
      if (!matchesProductFilter(user, productFilter)) return false;
      if (!q) return true;
      const name = [user.first_name, user.last_name].filter(Boolean).join(' ').toLowerCase();
      const product = user.stripeProductName?.toLowerCase() ?? '';
      return name.includes(q) || user.email.toLowerCase().includes(q) || product.includes(q);
    });
  }, [productFilter, query, users]);

  const paged = paginate(filtered, page);
  const activePremiumCount = users.filter((user) => isPremiumProfileStatus(user.subscription_status)).length;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(220px,280px)]">
        <Input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder={t('users.searchPlaceholder')}
          aria-label={t('users.searchPlaceholder')}
        />
        <Field>
          <Label htmlFor="product-filter">{t('users.filterProductLabel')}</Label>
          <Select
            id="product-filter"
            value={productFilter}
            onChange={(e) => {
              setProductFilter(e.target.value as ProductFilterValue);
              setPage(1);
            }}
          >
            {productFilters.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <p className="text-sm text-secondary">
        {t('users.filteredCount', {
          shown: filtered.length,
          total: users.length,
          active: activePremiumCount,
        })}
      </p>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border-subtle text-secondary">
            <tr>
              <th className="px-6 py-3">{t('users.colName')}</th>
              <th className="px-6 py-3">{t('users.colEmail')}</th>
              <th className="px-6 py-3">{t('users.colProduct')}</th>
              <th className="px-6 py-3">{t('users.colSubscription')}</th>
              <th className="px-6 py-3">{t('users.colExpires')}</th>
              <th className="px-6 py-3">{t('users.colJoined')}</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-muted">
                  {query.trim() || productFilter !== 'all'
                    ? t('users.searchEmpty')
                    : t('users.empty')}
                </td>
              </tr>
            ) : (
              paged.map((u) => (
                <tr key={u.id} className="border-b border-border-subtle/60 hover:bg-surface-muted/40">
                  <td className="px-6 py-4">
                    <Link href={`/users/${u.id}`} className="font-medium hover:text-accent">
                      {[u.first_name, u.last_name].filter(Boolean).join(' ') || t('common.dash')}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-secondary">{u.email}</td>
                  <td className="px-6 py-4">
                    <SubscriptionProductLabel user={u} />
                  </td>
                  <td className="px-6 py-4">
                    <Badge tone={subTone[u.subscription_status]}>
                      {translateStatus(t, u.subscription_status)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-muted">
                    {u.subscription_expires_at
                      ? new Date(u.subscription_expires_at).toLocaleDateString(dateLocale)
                      : isPremiumProfileStatus(u.subscription_status) && u.billingType === 'lifetime'
                        ? t('users.noExpiry')
                        : t('common.dash')}
                  </td>
                  <td className="px-6 py-4 text-muted">
                    {new Date(u.created_at).toLocaleDateString(dateLocale)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
      <Pagination page={page} totalItems={filtered.length} onPageChange={setPage} />
    </div>
  );
}
