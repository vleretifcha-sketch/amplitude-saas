'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { SortableTableHead, useTableSort } from '@/components/ui/SortableTableHead';
import { useLocale } from '@/i18n/client';
import { compareText, type SortDirection } from '@/lib/sort';
import type { Exercise } from '@/lib/types';

function sortExercises(rows: Exercise[], sortKey: string, direction: SortDirection): Exercise[] {
  const sorted = [...rows];

  sorted.sort((a, b) => {
    switch (sortKey) {
      case 'muscle':
        return compareText(a.muscle_groups ?? '', b.muscle_groups ?? '', direction);
      case 'name':
      default:
        return compareText(a.name, b.name, direction);
    }
  });

  return sorted;
}

export function ExercisesTable({ exercises }: { exercises: Exercise[] }) {
  const { t } = useLocale();
  const { sortKey, sortDirection, toggleSort } = useTableSort('name');

  const sortedExercises = useMemo(
    () => sortExercises(exercises, sortKey, sortDirection),
    [exercises, sortKey, sortDirection]
  );

  if (exercises.length === 0) {
    return (
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border-subtle text-secondary">
            <tr>
              <th className="px-6 py-3">{t('exercises.colName')}</th>
              <th className="px-6 py-3">{t('exercises.colMuscle')}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={2} className="px-6 py-8 text-center text-muted">
                {t('exercises.empty')}
              </td>
            </tr>
          </tbody>
        </table>
      </Card>
    );
  }

  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border-subtle text-secondary">
          <tr>
            <SortableTableHead
              label={t('exercises.colName')}
              columnKey="name"
              sortKey={sortKey}
              sortDirection={sortDirection}
              onSort={toggleSort}
            />
            <SortableTableHead
              label={t('exercises.colMuscle')}
              columnKey="muscle"
              sortKey={sortKey}
              sortDirection={sortDirection}
              onSort={toggleSort}
            />
          </tr>
        </thead>
        <tbody>
          {sortedExercises.map((exercise) => (
            <tr
              key={exercise.id}
              className="border-b border-border-subtle/60 hover:bg-surface-muted/40"
            >
              <td className="px-6 py-4">
                <Link href={`/exercises/${exercise.id}`} className="font-medium hover:text-accent">
                  {exercise.name}
                </Link>
              </td>
              <td className="px-6 py-4 text-secondary">{exercise.muscle_groups ?? t('common.dash')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
