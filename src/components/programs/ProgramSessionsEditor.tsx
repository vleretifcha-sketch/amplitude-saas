'use client';

import { useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field, Label, Select } from '@/components/ui/Input';
import { useLocale } from '@/i18n/client';
import {
  DEFAULT_SESSION_SECTION_ORDER,
  normalizeSessionSectionOrder,
  type SessionSectionType,
} from '@/lib/session-section-order';
import type { Video } from '@/lib/types';

export type ProgramVideoOption = {
  id: string;
  title: string;
  type: Video['type'];
  programId: string | null;
  programTitle: string;
};

function parseIds(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
}

function formatOption(video: ProgramVideoOption, programId: string) {
  if (video.programId === programId || !video.programId) return video.title;
  return `${video.programTitle} — ${video.title}`;
}

function SessionList({
  title,
  hint,
  fieldName,
  programId,
  initialIds,
  options,
  emptyMessage,
}: {
  title: string;
  hint: string;
  fieldName: 'signature_session_ids' | 'complementary_session_ids' | 'mobility_session_ids';
  programId: string;
  initialIds: string[];
  options: ProgramVideoOption[];
  emptyMessage: string;
}) {
  const { t } = useLocale();
  const [rows, setRows] = useState<string[]>(initialIds.length > 0 ? initialIds : ['']);

  function addRow() {
    setRows((prev) => [...prev, '']);
  }

  function removeRow(index: number) {
    setRows((prev) => (prev.length === 1 ? [''] : prev.filter((_, i) => i !== index)));
  }

  function updateRow(index: number, value: string) {
    setRows((prev) => prev.map((row, i) => (i === index ? value : row)));
  }

  const payload = parseIds(rows);
  const catalogCountLabel =
    options.length > 1
      ? t('programs.catalogCountPlural', { count: options.length })
      : t('programs.catalogCount', { count: options.length });

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-1 text-xs text-muted">{hint}</p>
        <p className="mt-1 text-xs text-muted">{catalogCountLabel}</p>
      </div>

      {options.length === 0 ? (
        <p className="text-sm text-muted">{emptyMessage}</p>
      ) : (
        <>
          {rows.map((selectedId, index) => (
            <div key={`${fieldName}-${index}`} className="flex items-end gap-2">
              <Field className="flex-1">
                <Label htmlFor={`${fieldName}-${index}`}>
                  {title} {index + 1}
                </Label>
                <Select
                  id={`${fieldName}-${index}`}
                  value={selectedId}
                  onChange={(e) => updateRow(index, e.target.value)}
                >
                  <option value="">{t('common.none')}</option>
                  {options.map((video) => (
                    <option key={video.id} value={video.id}>
                      {formatOption(video, programId)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeRow(index)}
                disabled={rows.length === 1 && !selectedId}
              >
                {t('common.remove')}
              </Button>
            </div>
          ))}
          <Button type="button" variant="secondary" size="sm" onClick={addRow}>
            {t('common.add')}
          </Button>
        </>
      )}

      <input type="hidden" name={fieldName} value={JSON.stringify(payload)} />
    </div>
  );
}

function SortableSection({
  id,
  children,
}: {
  id: SessionSectionType;
  children: React.ReactNode;
}) {
  const { t } = useLocale();
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-[var(--radius-input)] border bg-surface p-4 ${
        isDragging ? 'z-10 border-border shadow-lg' : 'border-border-subtle'
      }`}
    >
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          className="flex h-8 w-8 touch-none cursor-grab items-center justify-center rounded-lg text-muted hover:bg-surface-muted hover:text-foreground active:cursor-grabbing"
          aria-label={t('programs.moveSection')}
        >
          <GripVertical size={16} />
        </button>
        <span className="text-xs text-muted">{t('programs.sectionDragHint')}</span>
      </div>
      {children}
    </div>
  );
}

export function ProgramSessionsEditor({
  programId,
  signatureIds,
  complementaryIds,
  mobilityIds,
  sectionOrder,
  videos,
}: {
  programId: string;
  signatureIds: string[];
  complementaryIds: string[];
  mobilityIds: string[];
  sectionOrder?: string[];
  videos: ProgramVideoOption[];
}) {
  const { t } = useLocale();
  const [order, setOrder] = useState<SessionSectionType[]>(() =>
    normalizeSessionSectionOrder(sectionOrder ?? DEFAULT_SESSION_SECTION_ORDER)
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const signatureVideos = videos.filter((v) => v.type === 'signature');
  const mobilityVideos = videos.filter((v) => v.type === 'mobility');
  const complementaryVideos = videos.filter((v) => v.type === 'complementary');

  const sectionContent: Record<SessionSectionType, React.ReactNode> = {
    signature: (
      <SessionList
        title={t('programs.signatureTitle')}
        hint={t('programs.signatureHint')}
        fieldName="signature_session_ids"
        programId={programId}
        initialIds={signatureIds}
        options={signatureVideos}
        emptyMessage={t('programs.signatureEmpty')}
      />
    ),
    mobility: (
      <SessionList
        title={t('programs.mobilityTitle')}
        hint={t('programs.mobilityHint')}
        fieldName="mobility_session_ids"
        programId={programId}
        initialIds={mobilityIds}
        options={mobilityVideos}
        emptyMessage={t('programs.mobilityEmpty')}
      />
    ),
    complementary: (
      <SessionList
        title={t('programs.complementaryTitle')}
        hint={t('programs.complementaryHint')}
        fieldName="complementary_session_ids"
        programId={programId}
        initialIds={complementaryIds}
        options={complementaryVideos}
        emptyMessage={t('programs.complementaryEmpty')}
      />
    ),
  };

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setOrder((prev) => {
      const oldIndex = prev.indexOf(active.id as SessionSectionType);
      const newIndex = prev.indexOf(over.id as SessionSectionType);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  return (
    <div className="space-y-4 md:col-span-2 rounded-[var(--radius-input)] border border-border bg-surface-elevated p-4">
      <p className="text-sm text-muted">{t('programs.sectionOrderHint')}</p>
      <input type="hidden" name="session_section_order" value={JSON.stringify(order)} />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {order.map((sectionId) => (
              <SortableSection key={sectionId} id={sectionId}>
                {sectionContent[sectionId]}
              </SortableSection>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
