export type ChartPeriod = 'week' | 'month' | 'year';

export type ChartPoint = {
  label: string;
  fullLabel: string;
  value: number;
  sortKey: string;
};

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekFull(date: Date, locale: string) {
  const end = new Date(date);
  end.setDate(end.getDate() + 6);
  const fmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' });
  return `${fmt.format(date)} – ${fmt.format(end)}`;
}

function formatWeekShort(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(date);
}

function formatMonthFull(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(date);
}

function formatMonthShort(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, { month: 'short' }).format(date);
}

function countRowsByKey(rows: { started_at: string }[], period: ChartPeriod): Map<string, number> {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const date = new Date(row.started_at);
    if (Number.isNaN(date.getTime())) continue;

    let sortKey: string;
    if (period === 'week') {
      sortKey = startOfWeek(date).toISOString().slice(0, 10);
    } else if (period === 'month') {
      sortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    } else {
      sortKey = String(date.getFullYear());
    }

    counts.set(sortKey, (counts.get(sortKey) ?? 0) + 1);
  }

  return counts;
}

function generateSlots(period: ChartPeriod, locale: string, slotCount: number): ChartPoint[] {
  const now = new Date();
  const slots: ChartPoint[] = [];

  if (period === 'week') {
    const current = startOfWeek(now);
    for (let i = slotCount - 1; i >= 0; i -= 1) {
      const date = new Date(current);
      date.setDate(date.getDate() - i * 7);
      const sortKey = date.toISOString().slice(0, 10);
      slots.push({
        sortKey,
        label: formatWeekShort(date, locale),
        fullLabel: formatWeekFull(date, locale),
        value: 0,
      });
    }
    return slots;
  }

  if (period === 'month') {
    for (let i = slotCount - 1; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const sortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      slots.push({
        sortKey,
        label: formatMonthShort(date, locale),
        fullLabel: formatMonthFull(date, locale),
        value: 0,
      });
    }
    return slots;
  }

  for (let i = slotCount - 1; i >= 0; i -= 1) {
    const year = now.getFullYear() - i;
    slots.push({
      sortKey: String(year),
      label: String(year),
      fullLabel: String(year),
      value: 0,
    });
  }

  return slots;
}

export function buildSubscriptionChartSeries(
  rows: { started_at: string }[],
  period: ChartPeriod,
  locale: string
): ChartPoint[] {
  const slotCount = period === 'year' ? 5 : 12;
  const counts = countRowsByKey(rows, period);

  return generateSlots(period, locale, slotCount).map((slot) => ({
    ...slot,
    value: counts.get(slot.sortKey) ?? 0,
  }));
}

export function chartYAxisTicks(maxValue: number): number[] {
  if (maxValue <= 0) return [0, 1];
  if (maxValue <= 4) return Array.from({ length: maxValue + 1 }, (_, i) => i);

  const step = Math.ceil(maxValue / 4);
  const top = step * 4;
  return [0, step, step * 2, step * 3, top];
}
