export type SortDirection = 'asc' | 'desc';

export function compareText(a: string, b: string, direction: SortDirection): number {
  const result = a.localeCompare(b, 'fr', { sensitivity: 'base' });
  return direction === 'asc' ? result : -result;
}

export function compareNumber(a: number, b: number, direction: SortDirection): number {
  return direction === 'asc' ? a - b : b - a;
}

export function compareDate(
  a: string | null | undefined,
  b: string | null | undefined,
  direction: SortDirection
): number {
  const timeA = a ? new Date(a).getTime() : 0;
  const timeB = b ? new Date(b).getTime() : 0;
  return compareNumber(timeA, timeB, direction);
}
