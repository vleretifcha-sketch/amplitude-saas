'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { SortableTableHead, useTableSort } from '@/components/ui/SortableTableHead';
import { useLocale } from '@/i18n/client';
import { translateStatus } from '@/i18n/translator';
import { compareNumber, compareText, type SortDirection } from '@/lib/sort';
import type { Video } from '@/lib/types';

const statusTone = {
  draft: 'muted' as const,
  published: 'success' as const,
  archived: 'warning' as const,
};

export type VideoRow = Video & {
  programTitle: string;
  exerciseLabel: string;
  exerciseCount: number;
};

function sortVideos(
  rows: VideoRow[],
  sortKey: string,
  direction: SortDirection,
  typeLabel: Record<Video['type'], string>
): VideoRow[] {
  const sorted = [...rows];

  sorted.sort((a, b) => {
    switch (sortKey) {
      case 'program':
        return compareText(a.programTitle, b.programTitle, direction);
      case 'type':
        return compareText(typeLabel[a.type], typeLabel[b.type], direction);
      case 'status':
        return compareText(a.status, b.status, direction);
      case 'exercises':
        return compareNumber(a.exerciseCount, b.exerciseCount, direction);
      case 'week':
        return compareNumber(a.week_number, b.week_number, direction);
      case 'title':
      default:
        return compareText(a.title, b.title, direction);
    }
  });

  return sorted;
}

export function VideosTable({ videos }: { videos: VideoRow[] }) {
  const { t } = useLocale();
  const { sortKey, sortDirection, toggleSort } = useTableSort('title');

  const typeLabel: Record<Video['type'], string> = {
    signature: t('videos.typeSignature'),
    complementary: t('videos.typeComplementary'),
  };

  const sortedVideos = useMemo(
    () => sortVideos(videos, sortKey, sortDirection, typeLabel),
    [videos, sortKey, sortDirection, typeLabel]
  );

  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border-subtle text-secondary">
          <tr>
            <SortableTableHead
              label={t('videos.colTitle')}
              columnKey="title"
              sortKey={sortKey}
              sortDirection={sortDirection}
              onSort={toggleSort}
            />
            <SortableTableHead
              label={t('videos.colProgram')}
              columnKey="program"
              sortKey={sortKey}
              sortDirection={sortDirection}
              onSort={toggleSort}
            />
            <SortableTableHead
              label={t('videos.colType')}
              columnKey="type"
              sortKey={sortKey}
              sortDirection={sortDirection}
              onSort={toggleSort}
            />
            <SortableTableHead
              label={t('videos.colStatus')}
              columnKey="status"
              sortKey={sortKey}
              sortDirection={sortDirection}
              onSort={toggleSort}
            />
            <SortableTableHead
              label={t('videos.colExercises')}
              columnKey="exercises"
              sortKey={sortKey}
              sortDirection={sortDirection}
              onSort={toggleSort}
            />
            <SortableTableHead
              label={t('videos.colWeek')}
              columnKey="week"
              sortKey={sortKey}
              sortDirection={sortDirection}
              onSort={toggleSort}
            />
          </tr>
        </thead>
        <tbody>
          {sortedVideos.map((video) => (
            <tr key={video.id} className="border-b border-border-subtle/60 hover:bg-surface-muted/40">
              <td className="px-6 py-4">
                <Link href={`/videos/${video.id}`} className="font-medium hover:text-accent">
                  {video.title}
                </Link>
              </td>
              <td className="px-6 py-4 text-secondary">{video.programTitle}</td>
              <td className="px-6 py-4">{typeLabel[video.type]}</td>
              <td className="px-6 py-4">
                <Badge tone={statusTone[video.status]}>{translateStatus(t, video.status)}</Badge>
              </td>
              <td className="px-6 py-4 text-secondary">{video.exerciseLabel}</td>
              <td className="px-6 py-4">
                {t('common.weekShort')}
                {video.week_number}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
