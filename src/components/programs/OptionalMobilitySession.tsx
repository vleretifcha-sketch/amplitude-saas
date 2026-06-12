'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Label, Select } from '@/components/ui/Input';
import { useLocale } from '@/i18n/client';
import type { Video } from '@/lib/types';

type ProgramVideoOption = {
  id: string;
  title: string;
  type: Video['type'];
  programId: string;
  programTitle: string;
};

function formatOption(video: ProgramVideoOption, programId: string) {
  if (video.programId === programId) return video.title;
  return `${video.programTitle} — ${video.title}`;
}

export function OptionalMobilitySession({
  programId,
  initialIds,
  options,
}: {
  programId: string;
  initialIds: string[];
  options: ProgramVideoOption[];
}) {
  const { t } = useLocale();
  const [enabled, setEnabled] = useState(initialIds.length > 0);
  const [selectedId, setSelectedId] = useState(initialIds[0] ?? '');

  const payload = enabled && selectedId ? [selectedId] : [];

  return (
    <div className="space-y-3 rounded-[var(--radius-input)] border border-dashed border-border-subtle p-4">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => {
            setEnabled(e.target.checked);
            if (!e.target.checked) setSelectedId('');
          }}
          className="mt-0.5 h-4 w-4 rounded border-border"
        />
        <span>
          <span className="text-sm font-medium text-foreground">{t('programs.mobilityOptionalLabel')}</span>
          <span className="mt-1 block text-xs text-muted">{t('programs.mobilityOptionalHint')}</span>
        </span>
      </label>

      {enabled ? (
        options.length === 0 ? (
          <p className="text-sm text-muted">{t('programs.mobilityEmpty')}</p>
        ) : (
          <Field>
            <Label htmlFor="mobility_session_pick">{t('programs.mobilityTitle')}</Label>
            <Select
              id="mobility_session_pick"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              required={enabled}
            >
              <option value="">{t('programs.mobilityChoose')}</option>
              {options.map((video) => (
                <option key={video.id} value={video.id}>
                  {formatOption(video, programId)}
                </option>
              ))}
            </Select>
          </Field>
        )
      ) : null}

      <input type="hidden" name="mobility_session_ids" value={JSON.stringify(payload)} />
    </div>
  );
}
