export type CropArea = {
  width: number;
  height: number;
  x: number;
  y: number;
};

export const IMAGE_CROP_ASPECT = {
  /** Cartes méthodes dans l'app (~3:2, pleine largeur × 240px). */
  programCover: 3 / 2,
  sessionThumbnail: 1,
  /** Écran onboarding mobile (portrait plein écran). */
  onboardingPortrait: 9 / 16,
  /** Logo Amplitude (~1024×422). */
  brandLogo: 1024 / 422,
} as const;

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', reject);
    image.crossOrigin = 'anonymous';
    image.src = url;
  });
}

export async function getCroppedImageBlob(
  imageSrc: string,
  pixelCrop: CropArea,
  outputType: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality = 0.82,
  maxWidth = 1400
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  let { width, height } = pixelCrop;
  if (maxWidth > 0 && width > maxWidth) {
    const scale = maxWidth / width;
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  canvas.width = width;
  canvas.height = height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    width,
    height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Crop failed'))),
      outputType,
      quality
    );
  });
}

export function croppedFileName(originalName: string, mimeType: string): string {
  const base = originalName.replace(/\.[^.]+$/, '') || 'image';
  const ext = mimeType === 'image/png' ? 'png' : 'jpg';
  return `${base}-cropped.${ext}`;
}

export function assignFileToInput(input: HTMLInputElement, file: File) {
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  input.files = dataTransfer.files;
}
