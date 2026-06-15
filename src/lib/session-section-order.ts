import type { VideoType } from '@/lib/types';

export type SessionSectionType = Extract<VideoType, 'signature' | 'mobility' | 'complementary'>;

/** Ordre fixe dans l'app : échauffement → cours guidé → trainings. */
export const FIXED_SESSION_SECTION_ORDER: SessionSectionType[] = [
  'mobility',
  'signature',
  'complementary',
];

export function getSessionSectionOrder(): SessionSectionType[] {
  return [...FIXED_SESSION_SECTION_ORDER];
}
