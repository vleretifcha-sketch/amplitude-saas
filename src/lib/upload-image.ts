import { createAdminClient } from '@/lib/supabase/admin';
import { slugify } from '@/lib/slug';
import { createTranslator, getLocale } from '@/i18n';

const BUCKET = 'content-images';
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

async function ensureBucket(db: ReturnType<typeof createAdminClient>) {
  const t = createTranslator(await getLocale());
  const { data: buckets } = await db.storage.listBuckets();
  if (buckets?.some((bucket) => bucket.id === BUCKET)) return;

  const { error } = await db.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: MAX_BYTES,
    allowedMimeTypes: [...ALLOWED_TYPES],
  });

  if (error && !error.message.includes('already exists')) {
    throw new Error(t('upload.bucketMissing', { message: error.message }));
  }
}

function extensionFor(file: File): string {
  const fromName = file.name.split('.').pop()?.toLowerCase();
  if (fromName && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fromName)) {
    return fromName === 'jpeg' ? 'jpg' : fromName;
  }

  switch (file.type) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    default:
      return 'jpg';
  }
}

export async function uploadContentImage(file: File, folder: string): Promise<string> {
  const t = createTranslator(await getLocale());
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error(t('upload.unsupportedFormat'));
  }
  if (file.size > MAX_BYTES) {
    throw new Error(t('upload.tooLarge'));
  }

  const db = createAdminClient();
  await ensureBucket(db);

  const safeFolder = slugify(folder) || 'misc';
  const path = `${safeFolder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extensionFor(file)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await db.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);

  const { data } = db.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function resolveImageUrlFromForm(
  formData: FormData,
  options: { folder: string; urlField: string; fileField: string }
): Promise<string | null> {
  const file = formData.get(options.fileField);
  if (file instanceof File && file.size > 0) {
    return uploadContentImage(file, options.folder);
  }

  const existing = String(formData.get(options.urlField) || '').trim();
  return existing || null;
}
