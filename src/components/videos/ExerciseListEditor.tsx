'use client';

import Link from 'next/link';
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
import { Field, Input, Label, Select } from '@/components/ui/Input';
import { useLocale } from '@/i18n/client';
import type { Exercise, ExerciseDraft, VideoExercise } from '@/lib/types';

type ExerciseRow = ExerciseDraft & { rowKey: string };

function makeRowKey() {
  return `row-${crypto.randomUUID()}`;
}

function toRow(exercise: VideoExercise, library: Exercise[]): ExerciseRow {
  const libraryExerciseId =
    exercise.library_exercise_id ??
    library.find((entry) => entry.name === exercise.name)?.id ??
    '';

  return {
    rowKey: exercise.id || makeRowKey(),
    id: exercise.id,
    library_exercise_id: libraryExerciseId,
    name: exercise.name,
    target_sets: exercise.target_sets,
    target_reps: exercise.target_reps,
    sort_order: exercise.sort_order,
    muscle_groups: exercise.muscle_groups ?? '',
  };
}

function emptyRow(order: number): ExerciseRow {
  return {
    rowKey: makeRowKey(),
    library_exercise_id: '',
    name: '',
    target_sets: 2,
    target_reps: 8,
    sort_order: order,
    muscle_groups: '',
  };
}

function withOrder(items: ExerciseRow[]): ExerciseRow[] {
  return items.map((ex, i) => ({ ...ex, sort_order: i + 1 }));
}

function toPayload(items: ExerciseRow[]): ExerciseDraft[] {
  return items.map(({ rowKey: _rowKey, ...exercise }) => exercise);
}

function SortableExerciseRow({
  exercise,
  index,
  library,
  canRemove,
  onUpdate,
  onRemove,
}: {
  exercise: ExerciseRow;
  index: number;
  library: Exercise[];
  canRemove: boolean;
  onUpdate: (patch: Partial<ExerciseDraft>) => void;
  onRemove: () => void;
}) {
  const { t } = useLocale();
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: exercise.rowKey });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  function selectFromLibrary(libraryId: string) {
    const item = library.find((entry) => entry.id === libraryId);
    if (!item) return;
    onUpdate({
      library_exercise_id: item.id,
      name: item.name,
      muscle_groups: item.muscle_groups ?? '',
    });
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`grid gap-3 rounded-[var(--radius-input)] border bg-surface-elevated p-4 md:grid-cols-12 ${
        isDragging ? 'z-10 border-border shadow-lg' : 'border-border'
      }`}
    >
      <div className="flex items-end gap-2 md:col-span-1">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          className="flex h-10 w-8 touch-none cursor-grab items-center justify-center rounded-lg text-muted hover:bg-surface-muted hover:text-foreground active:cursor-grabbing"
          aria-label={t('videos.moveExercise', { n: index + 1 })}
        >
          <GripVertical size={16} />
        </button>
        <span className="mb-2.5 text-sm font-medium text-secondary">{index + 1}</span>
      </div>
      <Field className="md:col-span-4">
        <Label htmlFor={`exercise-library-${exercise.rowKey}`}>{t('videos.exerciseField')}</Label>
        <Select
          id={`exercise-library-${exercise.rowKey}`}
          value={exercise.library_exercise_id}
          onChange={(e) => selectFromLibrary(e.target.value)}
          required={index === 0}
        >
          <option value="">{t('videos.chooseFromLibrary')}</option>
          {library.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field className="md:col-span-2">
        <Label htmlFor={`exercise-sets-${exercise.rowKey}`}>{t('videos.setsField')}</Label>
        <Input
          id={`exercise-sets-${exercise.rowKey}`}
          type="number"
          min={1}
          value={exercise.target_sets}
          onChange={(e) => onUpdate({ target_sets: Number(e.target.value) || 1 })}
        />
      </Field>
      <Field className="md:col-span-2">
        <Label htmlFor={`exercise-reps-${exercise.rowKey}`}>{t('videos.repsField')}</Label>
        <Input
          id={`exercise-reps-${exercise.rowKey}`}
          type="number"
          min={1}
          value={exercise.target_reps}
          onChange={(e) => onUpdate({ target_reps: Number(e.target.value) || 1 })}
        />
      </Field>
      <Field className="md:col-span-2">
        <Label>{t('videos.zoneField')}</Label>
        <p className="flex h-10 items-center text-sm text-secondary">
          {exercise.muscle_groups || t('common.dash')}
        </p>
      </Field>
      <div className="flex items-end md:col-span-1">
        <Button type="button" variant="ghost" size="sm" onClick={onRemove} disabled={!canRemove}>
          {t('common.remove')}
        </Button>
      </div>
    </div>
  );
}

export function ExerciseListEditor({
  library,
  initialExercises = [],
}: {
  library: Exercise[];
  initialExercises?: VideoExercise[];
}) {
  const { t } = useLocale();
  const [exercises, setExercises] = useState<ExerciseRow[]>(() =>
    initialExercises.length > 0
      ? withOrder(
          [...initialExercises]
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((exercise) => toRow(exercise, library))
        )
      : library.length > 0
        ? [emptyRow(1)]
        : []
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function update(index: number, patch: Partial<ExerciseDraft>) {
    setExercises((prev) => prev.map((ex, i) => (i === index ? { ...ex, ...patch } : ex)));
  }

  function addExercise() {
    setExercises((prev) => withOrder([...prev, emptyRow(prev.length + 1)]));
  }

  function removeExercise(index: number) {
    setExercises((prev) => withOrder(prev.filter((_, i) => i !== index)));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setExercises((prev) => {
      const oldIndex = prev.findIndex((ex) => ex.rowKey === active.id);
      const newIndex = prev.findIndex((ex) => ex.rowKey === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return withOrder(arrayMove(prev, oldIndex, newIndex));
    });
  }

  const payload = toPayload(exercises).filter((exercise) => exercise.library_exercise_id);

  return (
    <div className="space-y-4 md:col-span-2">
      <input type="hidden" name="exercises_payload" value={JSON.stringify(payload)} />
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-medium">{t('videos.prescriptionTitle')}</h3>
          <p className="mt-1 text-sm text-muted">{t('videos.prescriptionHint')}</p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={addExercise}>
          {t('common.add')}
        </Button>
      </div>

      {library.length === 0 ? (
        <p className="rounded-[var(--radius-input)] border border-border bg-surface-elevated p-4 text-sm text-muted">
          {t('videos.libraryEmpty')}{' '}
          <Link href="/exercises" className="text-accent underline">
            {t('videos.libraryEmptyLink')}
          </Link>{' '}
          {t('videos.libraryEmptySuffix')}
        </p>
      ) : exercises.length === 0 ? (
        <Button type="button" variant="secondary" size="sm" onClick={addExercise}>
          {t('videos.addFirstExercise')}
        </Button>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={exercises.map((ex) => ex.rowKey)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {exercises.map((exercise, index) => (
                <SortableExerciseRow
                  key={exercise.rowKey}
                  exercise={exercise}
                  index={index}
                  library={library}
                  canRemove={exercises.length > 1}
                  onUpdate={(patch) => update(index, patch)}
                  onRemove={() => removeExercise(index)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <p className="text-sm text-muted">
        <Link href="/exercises" className="text-accent underline">
          {t('videos.manageLibrary')}
        </Link>
      </p>
    </div>
  );
}
