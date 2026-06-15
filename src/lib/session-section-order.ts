import type { VideoType } from '@/lib/types';

export type SessionSectionType = Extract<VideoType, 'signature' | 'mobility' | 'complementary'>;

export const DEFAULT_SESSION_SECTION_ORDER: SessionSectionType[] = [
  'signature',
  'mobility',
  'complementary',
];

const VALID = new Set<SessionSectionType>(DEFAULT_SESSION_SECTION_ORDER);

export function normalizeSessionSectionOrder(
  order: string[] | null | undefined
): SessionSectionType[] {
  const seen = new Set<SessionSectionType>();
  const normalized: SessionSectionType[] = [];

  for (const value of order ?? []) {
    if (!VALID.has(value as SessionSectionType) || seen.has(value as SessionSectionType)) continue;
    const section = value as SessionSectionType;
    seen.add(section);
    normalized.push(section);
  }

  for (const section of DEFAULT_SESSION_SECTION_ORDER) {
    if (!seen.has(section)) normalized.push(section);
  }

  return normalized;
}

export function parseSessionSectionOrder(raw: FormDataEntryValue | null): SessionSectionType[] {
  if (!raw) return DEFAULT_SESSION_SECTION_ORDER;
  try {
    const parsed = JSON.parse(String(raw));
    if (!Array.isArray(parsed)) return DEFAULT_SESSION_SECTION_ORDER;
    return normalizeSessionSectionOrder(parsed.map(String));
  } catch {
    return DEFAULT_SESSION_SECTION_ORDER;
  }
}
