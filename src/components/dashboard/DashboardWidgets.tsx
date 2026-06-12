'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { useLocale } from '@/i18n/client';
import { translateStatus } from '@/i18n/translator';
import { buildSubscriptionChartSeries, chartYAxisTicks, type ChartPeriod } from '@/lib/chart';
import type { SubscriptionChartRow } from '@/lib/types';

const CHART = {
  width: 640,
  height: 260,
  padLeft: 44,
  padRight: 16,
  padTop: 16,
  padBottom: 52,
};

function SubscriptionBarChart({ points }: { points: { label: string; fullLabel: string; value: number }[] }) {
  const { t } = useLocale();
  const maxData = Math.max(...points.map((p) => p.value), 0);
  const yTicks = chartYAxisTicks(maxData);
  const yMax = yTicks[yTicks.length - 1] || 1;
  const plotW = CHART.width - CHART.padLeft - CHART.padRight;
  const plotH = CHART.height - CHART.padTop - CHART.padBottom;
  const barGap = 8;
  const barWidth = Math.max((plotW - barGap * (points.length - 1)) / points.length, 8);
  const total = points.reduce((sum, p) => sum + p.value, 0);

  return (
    <div>
      <p className="mb-4 text-sm text-secondary">
        {t('dashboard.chartTotal', { count: total })}
      </p>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${CHART.width} ${CHART.height}`}
          className="min-w-full"
          role="img"
          aria-label={t('dashboard.chartTitle')}
        >
          {yTicks.map((tick) => {
            const y = CHART.padTop + plotH - (tick / yMax) * plotH;
            return (
              <g key={tick}>
                <line
                  x1={CHART.padLeft}
                  y1={y}
                  x2={CHART.width - CHART.padRight}
                  y2={y}
                  stroke="var(--border-subtle)"
                  strokeDasharray={tick === 0 ? undefined : '4 4'}
                />
                <text
                  x={CHART.padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-[var(--text-muted)] text-[11px]"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {points.map((point, index) => {
            const barH = yMax > 0 ? (point.value / yMax) * plotH : 0;
            const x = CHART.padLeft + index * (barWidth + barGap);
            const y = CHART.padTop + plotH - barH;
            const showEvery = points.length > 8 ? 2 : 1;

            return (
              <g key={`${point.fullLabel}-${index}`}>
                <title>
                  {point.fullLabel}: {point.value}
                </title>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(barH, point.value > 0 ? 4 : 0)}
                  rx={6}
                  fill={point.value > 0 ? 'var(--accent)' : 'var(--border-subtle)'}
                  opacity={point.value > 0 ? 1 : 0.35}
                />
                {point.value > 0 ? (
                  <text
                    x={x + barWidth / 2}
                    y={y - 6}
                    textAnchor="middle"
                    className="fill-[var(--text)] text-[11px] font-medium"
                  >
                    {point.value}
                  </text>
                ) : null}
                {index % showEvery === 0 ? (
                  <text
                    x={x + barWidth / 2}
                    y={CHART.height - 18}
                    textAnchor="middle"
                    className="fill-[var(--text-secondary)] text-[11px]"
                  >
                    {point.label}
                  </text>
                ) : null}
              </g>
            );
          })}

          <line
            x1={CHART.padLeft}
            y1={CHART.padTop + plotH}
            x2={CHART.width - CHART.padRight}
            y2={CHART.padTop + plotH}
            stroke="var(--border)"
          />
        </svg>
      </div>
      <p className="mt-2 text-xs text-muted">{t('dashboard.chartLegend')}</p>
    </div>
  );
}

export function SubscriptionChart({ rows }: { rows: SubscriptionChartRow[] }) {
  const { t, locale } = useLocale();
  const [period, setPeriod] = useState<ChartPeriod>('month');
  const dateLocale = locale === 'fr' ? 'fr-FR' : 'en-US';

  const points = useMemo(
    () => buildSubscriptionChartSeries(rows, period, dateLocale),
    [rows, period, dateLocale]
  );

  const hasAnyData = points.some((p) => p.value > 0);

  return (
    <Card>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium">{t('dashboard.chartTitle')}</h2>
          <p className="mt-1 text-sm text-secondary">{t('dashboard.chartHint')}</p>
        </div>
        <div className="flex gap-1 rounded-2xl bg-surface-muted p-1">
          {(['week', 'month', 'year'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setPeriod(value)}
              className={`rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${
                period === value
                  ? 'bg-button text-inverse'
                  : 'text-secondary hover:text-foreground'
              }`}
            >
              {t(`dashboard.period.${value}`)}
            </button>
          ))}
        </div>
      </div>

      {!hasAnyData ? (
        <p className="py-12 text-center text-sm text-muted">{t('dashboard.chartEmpty')}</p>
      ) : (
        <SubscriptionBarChart points={points} />
      )}
    </Card>
  );
}

export function RecentSubscriptionsList({
  subscriptions,
}: {
  subscriptions: {
    id: string;
    user_id: string;
    userName: string;
    userEmail: string;
    product_id: string;
    status: string;
    platform: string | null;
    started_at: string;
  }[];
}) {
  const { t, locale } = useLocale();
  const dateLocale = locale === 'fr' ? 'fr-FR' : 'en-US';

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-lg font-medium">{t('dashboard.recentSubscriptions')}</h2>
        <Link href="/users" className="text-sm text-accent hover:underline">
          {t('dashboard.viewAllSubscriptions')}
        </Link>
      </div>
      {subscriptions.length === 0 ? (
        <p className="text-sm text-muted">{t('dashboard.noRecentSubscriptions')}</p>
      ) : (
        <ul className="divide-y divide-border-subtle">
          {subscriptions.map((sub) => (
            <li key={sub.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <Link href={`/users/${sub.user_id}`} className="font-medium hover:text-accent">
                  {sub.userName}
                </Link>
                <p className="truncate text-sm text-secondary">{sub.userEmail || sub.product_id}</p>
              </div>
              <div className="shrink-0 text-right text-sm">
                <p>{translateStatus(t, sub.status)}</p>
                <p className="text-muted">
                  {new Date(sub.started_at).toLocaleDateString(dateLocale)}
                  {sub.platform ? ` · ${sub.platform}` : ''}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
