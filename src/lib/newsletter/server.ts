import { createAdminClient } from '@/lib/supabase/admin';
import type { NewsletterCampaign, NewsletterRecipient } from '@/lib/types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isPremiumStatus(status: string) {
  return status === 'active' || status === 'trial';
}

export async function fetchNonPremiumRecipients(): Promise<NewsletterRecipient[]> {
  try {
    const db = createAdminClient();
    const { data, error } = await db
      .from('profiles')
      .select('id, email, first_name, last_name, subscription_status, created_at')
      .in('subscription_status', ['none', 'expired'])
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    const seen = new Set<string>();

    return (data ?? []).filter((profile) => {
      const email = profile.email?.trim().toLowerCase();
      if (!email || !EMAIL_PATTERN.test(email) || seen.has(email)) return false;
      if (isPremiumStatus(profile.subscription_status)) return false;
      seen.add(email);
      return true;
    }) as NewsletterRecipient[];
  } catch (error) {
    console.error('Failed to fetch newsletter recipients:', error);
    return [];
  }
}

export async function fetchNewsletterCampaigns(): Promise<NewsletterCampaign[]> {
  try {
    const db = createAdminClient();
    const { data, error } = await db
      .from('newsletter_campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === '42P01') return [];
      throw new Error(error.message);
    }

    return (data ?? []) as NewsletterCampaign[];
  } catch (error) {
    console.error('Failed to fetch newsletter campaigns:', error);
    return [];
  }
}
