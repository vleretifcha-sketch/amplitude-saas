import { createAdminClient } from '@/lib/supabase/admin';

export const ONBOARDING_IMAGE_KEYS = [
  'onboarding_image_1',
  'onboarding_image_2',
  'onboarding_image_3',
] as const;

export type OnboardingImageKey = (typeof ONBOARDING_IMAGE_KEYS)[number];

export const DEFAULT_ONBOARDING_IMAGES: Record<OnboardingImageKey, string> = {
  onboarding_image_1: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&q=80',
  onboarding_image_2: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&q=80',
  onboarding_image_3: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50e?w=1200&q=80',
};

export type OnboardingImagesSettings = {
  image1: string;
  image2: string;
  image3: string;
};

export async function getOnboardingImagesSettings(): Promise<OnboardingImagesSettings> {
  try {
    const db = createAdminClient();
    const { data, error } = await db
      .from('app_settings')
      .select('key, value')
      .in('key', [...ONBOARDING_IMAGE_KEYS]);

    if (error) throw error;

    const map = new Map((data ?? []).map((row) => [row.key, row.value]));

    return {
      image1: map.get('onboarding_image_1') || DEFAULT_ONBOARDING_IMAGES.onboarding_image_1,
      image2: map.get('onboarding_image_2') || DEFAULT_ONBOARDING_IMAGES.onboarding_image_2,
      image3: map.get('onboarding_image_3') || DEFAULT_ONBOARDING_IMAGES.onboarding_image_3,
    };
  } catch (error) {
    console.error('Failed to load onboarding images:', error);
    return {
      image1: DEFAULT_ONBOARDING_IMAGES.onboarding_image_1,
      image2: DEFAULT_ONBOARDING_IMAGES.onboarding_image_2,
      image3: DEFAULT_ONBOARDING_IMAGES.onboarding_image_3,
    };
  }
}
