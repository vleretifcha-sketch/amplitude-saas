'use client';

import { useCallback, useState } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Button } from '@/components/ui/Button';
import { useLocale } from '@/i18n/client';

type ImageCropModalProps = {
  open: boolean;
  imageSrc: string;
  aspect: number;
  onConfirm: (croppedAreaPixels: Area) => void;
  onCancel: () => void;
};

export function ImageCropModal({
  open,
  imageSrc,
  aspect,
  onConfirm,
  onCancel,
}: ImageCropModalProps) {
  const { t } = useLocale();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_croppedArea: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface-elevated shadow-xl">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">{t('upload.cropTitle')}</h2>
          <p className="mt-1 text-sm text-secondary">{t('upload.cropHint')}</p>
        </div>

        <div className="relative h-72 bg-black sm:h-96">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <label htmlFor="crop-zoom" className="shrink-0 text-sm text-secondary">
            {t('upload.cropZoom')}
          </label>
          <input
            id="crop-zoom"
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="w-full accent-accent"
          />
        </div>

        <div className="flex justify-end gap-3 px-5 py-4">
          <Button type="button" variant="secondary" onClick={onCancel}>
            {t('upload.cancel')}
          </Button>
          <Button
            type="button"
            disabled={!croppedAreaPixels}
            onClick={() => croppedAreaPixels && onConfirm(croppedAreaPixels)}
          >
            {t('upload.cropConfirm')}
          </Button>
        </div>
      </div>
    </div>
  );
}
