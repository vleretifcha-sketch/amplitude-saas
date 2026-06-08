import type { SupabaseClient } from '@supabase/supabase-js';

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function uniqueId(
  db: SupabaseClient,
  table: 'programs' | 'videos' | 'video_exercises' | 'exercises',
  prefix: string,
  base: string
): Promise<string> {
  const slug = slugify(base) || 'item';
  let candidate = `${prefix}${slug}`;
  let suffix = 2;

  while (true) {
    const { data } = await db.from(table).select('id').eq('id', candidate).maybeSingle();
    if (!data) return candidate;
    candidate = `${prefix}${slug}-${suffix}`;
    suffix += 1;
  }
}
