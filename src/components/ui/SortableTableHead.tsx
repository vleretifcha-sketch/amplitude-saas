'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { SortDirection } from '@/lib/sort';

type SortableTableHeadProps = {
  label: string;
  columnKey: string;
  sortKey: string;
  sortDirection: SortDirection;
  onSort: (columnKey: string) => void;
  className?: string;
};

export function SortableTableHead({
  label,
  columnKey,
  sortKey,
  sortDirection,
  onSort,
  className = '',
}: SortableTableHeadProps) {
  const active = sortKey === columnKey;

  return (
    <th className={`px-6 py-3 ${className}`}>
      <button
        type="button"
        onClick={() => onSort(columnKey)}
        className="inline-flex items-center gap-1.5 text-left font-normal text-secondary transition-colors hover:text-foreground"
      >
        <span>{label}</span>
        <span className="inline-flex flex-col text-muted">
          <ChevronUp
            size={12}
            strokeWidth={2.5}
            className={active && sortDirection === 'asc' ? 'text-foreground' : 'opacity-35'}
          />
          <ChevronDown
            size={12}
            strokeWidth={2.5}
            className={`-mt-1 ${active && sortDirection === 'desc' ? 'text-foreground' : 'opacity-35'}`}
          />
        </span>
      </button>
    </th>
  );
}

export function useTableSort(initialKey: string) {
  const [sortKey, setSortKey] = useState(initialKey);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  function toggleSort(columnKey: string) {
    if (sortKey === columnKey) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(columnKey);
    setSortDirection('asc');
  }

  return { sortKey, sortDirection, toggleSort };
}
