import { getEmailConnectionStatus, type EmailConnectionStatus } from '@/lib/email/server';
import { maskSecretKey } from '@/lib/settings-crypto';
import { getStripeSecretKey, isStripeConnected } from '@/lib/stripe/server';

export type StripeConnectionStatus = {
  connected: boolean;
  maskedKey: string | null;
};

export async function getStripeConnectionStatus(): Promise<StripeConnectionStatus> {
  try {
    const secretKey = await getStripeSecretKey();
    if (!secretKey) {
      return { connected: false, maskedKey: null };
    }

    const connected = await isStripeConnected();
    return {
      connected,
      maskedKey: maskSecretKey(secretKey),
    };
  } catch (error) {
    console.error('Failed to get Stripe connection status:', error);
    return { connected: false, maskedKey: null };
  }
}

export async function getEmailSettingsStatus(): Promise<EmailConnectionStatus> {
  try {
    return await getEmailConnectionStatus();
  } catch (error) {
    console.error('Failed to get email settings status:', error);
    return {
      connected: false,
      fromEmail: null,
      fromName: null,
      hasApiKey: false,
    };
  }
}
