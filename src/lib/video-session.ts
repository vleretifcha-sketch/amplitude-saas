import type { VideoType } from '@/lib/types';

export function isVideoOnlySessionType(type: VideoType | string): boolean {
  return type === 'signature' || type === 'mobility';
}

export function isComplementarySessionType(type: VideoType | string): boolean {
  return type === 'complementary';
}
