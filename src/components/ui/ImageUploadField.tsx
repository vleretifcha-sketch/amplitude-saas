'use client';

import { useEffect, useRef, useState } from 'react';
import type { Area } from 'react-easy-crop';
import { Field, Label } from '@/components/ui/Input';
import { ImageCropModal } from '@/components/ui/ImageCropModal';
import {
  assignFileToInput,
  croppedFileName,
  getCroppedImageBlob,
} from '@/lib/crop-image';
import { useLocale } from '@/i18n/client';

type ImageUploadFieldProps = {
  label: string;
  urlFieldName: string;
  fileFieldName: string;
  defaultUrl?: string | null;
  className?: string;
  /** When set, opens a crop step before applying the image. */
  cropAspect?: number;
};

export function ImageUploadField({
  label,
  urlFieldName,
  fileFieldName,
  defaultUrl,
  className = '',
  cropAspect,
}: ImageUploadFieldProps) {
  const { t } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const previewObjectUrlRef = useRef<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(defaultUrl ?? null);
  const [fileName, setFileName] = useState('');
  const [hasPendingFile, setHasPendingFile] = useState(false);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [pendingOriginalName, setPendingOriginalName] = useState('image.jpg');
  const [pendingMimeType, setPendingMimeType] = useState('image/jpeg');

  useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
      }
    };
  }, []);

  function setPreviewFromObjectUrl(url: string) {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
    }
    previewObjectUrlRef.current = url;
    setPreviewUrl(url);
  }

  function resetPreviewToDefault() {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }
    setPreviewUrl(defaultUrl ?? null);
    setFileName('');
    setHasPendingFile(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (cropAspect) {
      setPendingOriginalName(file.name);
      setPendingMimeType(file.type || 'image/jpeg');
      setCropSource(URL.createObjectURL(file));
      return;
    }

    setFileName(file.name);
    setPreviewFromObjectUrl(URL.createObjectURL(file));
    setHasPendingFile(true);
  }

  function openRecrop() {
    if (!previewUrl || !cropAspect) return;
    setCropSource(previewUrl);
    if (!hasPendingFile) {
      setPendingOriginalName('image.jpg');
      setPendingMimeType('image/jpeg');
    }
  }

  function cancelCrop() {
    if (cropSource && cropSource !== previewUrl && cropSource !== defaultUrl) {
      URL.revokeObjectURL(cropSource);
    }
    setCropSource(null);
    if (inputRef.current && !hasPendingFile) {
      inputRef.current.value = '';
    }
  }

  async function confirmCrop(croppedAreaPixels: Area) {
    if (!cropSource || !inputRef.current) return;

    const outputType = pendingMimeType === 'image/png' ? 'image/png' : 'image/jpeg';
    const maxWidth = cropAspect && cropAspect < 1 ? 1080 : 1400;
    const blob = await getCroppedImageBlob(cropSource, croppedAreaPixels, outputType, 0.82, maxWidth);
    const croppedFile = new File(
      [blob],
      croppedFileName(pendingOriginalName, outputType),
      { type: outputType }
    );

    assignFileToInput(inputRef.current, croppedFile);
    setFileName(croppedFile.name);
    setPreviewFromObjectUrl(URL.createObjectURL(croppedFile));
    setHasPendingFile(true);

    if (cropSource !== previewUrl && cropSource !== defaultUrl) {
      URL.revokeObjectURL(cropSource);
    }
    setCropSource(null);
  }

  const showRecrop = Boolean(cropAspect && previewUrl);

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
        {showRecrop ? (
          <button
            type="button"
            onClick={openRecrop}
            className="inline-flex items-center rounded-[var(--radius-input)] border border-border bg-surface-elevated px-4 py-2.5 text-sm font-medium hover:bg-surface-muted"
          >
            {t('upload.recrop')}
          </button>
        ) : null}
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
              onClick={resetPreviewToDefault}
              className="text-sm text-muted underline hover:text-foreground"
            >
              {t('upload.cancel')}
            </button>
          </>
        ) : (
          <span className="text-sm text-muted">{t('upload.hint')}</span>
        )}
      </div>

      {cropAspect && cropSource ? (
        <ImageCropModal
          open
          imageSrc={cropSource}
          aspect={cropAspect}
          onConfirm={confirmCrop}
          onCancel={cancelCrop}
        />
      ) : null}
    </Field>
  );
}
