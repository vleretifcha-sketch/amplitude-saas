'use client';

import { useRef, useState } from 'react';
import { Field, Label } from '@/components/ui/Input';
import { useLocale } from '@/i18n/client';

type ImageUploadFieldProps = {
  label: string;
  urlFieldName: string;
  fileFieldName: string;
  defaultUrl?: string | null;
  className?: string;
};

export function ImageUploadField({
  label,
  urlFieldName,
  fileFieldName,
  defaultUrl,
  className = '',
}: ImageUploadFieldProps) {
  const { t } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(defaultUrl ?? null);
  const [fileName, setFileName] = useState('');

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function clearSelection() {
    setPreviewUrl(defaultUrl ?? null);
    setFileName('');
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <Field className={className}>
      <Label htmlFor={fileFieldName}>{label}</Label>
      <input type="hidden" name={urlFieldName} value={defaultUrl ?? ''} />

      {previewUrl ? (
        <div className="mb-3 overflow-hidden rounded-[var(--radius-input)] border border-border bg-surface-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="" className="max-h-48 w-full object-cover" />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <label
          htmlFor={fileFieldName}
          className="inline-flex cursor-pointer items-center rounded-[var(--radius-input)] border border-border bg-surface-elevated px-4 py-2.5 text-sm font-medium hover:bg-surface-muted"
        >
          {t('upload.choose')}
        </label>
        <input
          ref={inputRef}
          id={fileFieldName}
          name={fileFieldName}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={onFileChange}
        />
        {fileName ? (
          <>
            <span className="text-sm text-secondary">{fileName}</span>
            <button
              type="button"
              onClick={clearSelection}
              className="text-sm text-muted underline hover:text-foreground"
            >
              {t('upload.cancel')}
            </button>
          </>
        ) : (
          <span className="text-sm text-muted">{t('upload.hint')}</span>
        )}
      </div>
    </Field>
  );
}
