/** Limite pratique Vercel (~4.5 Mo) — marge pour les métadonnées FormData. */
export const SERVER_ACTION_UPLOAD_LIMIT_BYTES = 4 * 1024 * 1024;

export function getFormDataUploadSize(formData: FormData): number {
  let total = 0;
  for (const value of formData.values()) {
    if (value instanceof File && value.size > 0) {
      total += value.size;
    }
  }
  return total;
}

export function isFormDataUploadTooLarge(formData: FormData): boolean {
  return getFormDataUploadSize(formData) > SERVER_ACTION_UPLOAD_LIMIT_BYTES;
}
