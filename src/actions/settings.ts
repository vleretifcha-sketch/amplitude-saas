'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { encryptSetting } from '@/lib/settings-crypto';
import { createTranslator, getLocale } from '@/i18n';
import {
  getStripeSecretKey,
  STRIPE_SECRET_SETTING_KEY,
} from '@/lib/stripe/server';
import {
  getDefaultNewsletterFooterLogoUrl,
  getResendApiKey,
  NEWSLETTER_FROM_EMAIL_SETTING,
  NEWSLETTER_FROM_NAME_SETTING,
  NEWSLETTER_FOOTER_LOGO_URL_SETTING,
  RESEND_API_KEY_SETTING,
  SUBSCRIPTION_NOTIFY_EMAIL_SETTING,
  sendTestEmail as sendTestEmailViaResend,
} from '@/lib/email/server';
import { parseEmailList } from '@/lib/email/subscription-notify-shared';
import { sendSubscriptionNotifyTest } from '@/lib/email/subscription-notify';
import { ONBOARDING_IMAGE_KEYS } from '@/lib/onboarding/server';
import { resolveImageUrlFromForm } from '@/lib/upload-image';

export type SettingsActionResult = { ok: true } | { ok: false; error: string };

function settingsError(error: unknown, fallback: string): SettingsActionResult {
  if (error instanceof Error) {
    if (error.message.includes('SETTINGS_ENCRYPTION_KEY')) {
      return { ok: false, error: fallback };
    }
    if (error.message.includes('app_settings') || error.message.includes('42P01')) {
      return { ok: false, error: fallback };
    }
    return { ok: false, error: error.message };
  }
  return { ok: false, error: fallback };
}

export async function saveStripeSecretKey(formData: FormData): Promise<SettingsActionResult> {
  const t = createTranslator(await getLocale());
  const rawKey = String(formData.get('stripe_secret_key') || '').trim();

  if (!rawKey.startsWith('sk_test_') && !rawKey.startsWith('sk_live_')) {
    return { ok: false, error: t('settings.stripeInvalidKey') };
  }

  try {
    const db = createAdminClient();
    const encrypted = encryptSetting(rawKey);

    const { error } = await db.from('app_settings').upsert(
      {
        key: STRIPE_SECRET_SETTING_KEY,
        value: encrypted,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    );

    if (error) {
      if (error.message.includes('app_settings') || error.code === '42P01') {
        return { ok: false, error: t('settings.appSettingsMigrationError') };
      }
      return { ok: false, error: error.message };
    }

    revalidatePath('/settings');
    revalidatePath('/users');
    return { ok: true };
  } catch (error) {
    return settingsError(error, t('settings.encryptionKeyMissing'));
  }
}

export async function disconnectStripe(): Promise<SettingsActionResult> {
  const t = createTranslator(await getLocale());

  try {
    const db = createAdminClient();
    const { error } = await db.from('app_settings').delete().eq('key', STRIPE_SECRET_SETTING_KEY);
    if (error) return { ok: false, error: error.message };

    revalidatePath('/settings');
    revalidatePath('/users');
    return { ok: true };
  } catch (error) {
    return settingsError(error, t('common.error'));
  }
}

export async function saveEmailSettings(formData: FormData): Promise<SettingsActionResult> {
  const t = createTranslator(await getLocale());
  const rawKey = String(formData.get('resend_api_key') || '').trim();
  const fromEmail = String(formData.get('newsletter_from_email') || '').trim();
  const fromName = String(formData.get('newsletter_from_name') || '').trim();
  const notifyEmail = String(formData.get('subscription_notify_email') || '').trim();

  if (!fromEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromEmail)) {
    return { ok: false, error: t('settings.emailInvalidAddress') };
  }

  if (notifyEmail) {
    const parsed = parseEmailList(notifyEmail);
    if (parsed.length === 0) {
      return { ok: false, error: t('settings.emailInvalidNotifyAddress') };
    }
  }

  try {
    const db = createAdminClient();
    const rows: { key: string; value: string; updated_at: string }[] = [
      {
        key: NEWSLETTER_FROM_EMAIL_SETTING,
        value: fromEmail,
        updated_at: new Date().toISOString(),
      },
      {
        key: NEWSLETTER_FROM_NAME_SETTING,
        value: fromName,
        updated_at: new Date().toISOString(),
      },
      {
        key: SUBSCRIPTION_NOTIFY_EMAIL_SETTING,
        value: notifyEmail,
        updated_at: new Date().toISOString(),
      },
    ];

    const footerLogoUrl = await resolveImageUrlFromForm(formData, {
      folder: 'newsletter',
      urlField: 'newsletter_footer_logo_url',
      fileField: 'newsletter_footer_logo_file',
    });
    rows.push({
      key: NEWSLETTER_FOOTER_LOGO_URL_SETTING,
      value: footerLogoUrl || getDefaultNewsletterFooterLogoUrl(),
      updated_at: new Date().toISOString(),
    });

    if (rawKey) {
      if (!rawKey.startsWith('re_')) {
        return { ok: false, error: t('settings.emailInvalidKey') };
      }
      rows.push({
        key: RESEND_API_KEY_SETTING,
        value: encryptSetting(rawKey),
        updated_at: new Date().toISOString(),
      });
    } else {
      const existingKey = await getResendApiKey();
      if (!existingKey) {
        return { ok: false, error: t('settings.emailKeyRequired') };
      }
    }

    const { error } = await db.from('app_settings').upsert(rows, { onConflict: 'key' });
    if (error) {
      if (error.message.includes('app_settings') || error.code === '42P01') {
        return { ok: false, error: t('settings.appSettingsMigrationError') };
      }
      return { ok: false, error: error.message };
    }

    revalidatePath('/settings');
    revalidatePath('/newsletter');
    return { ok: true };
  } catch (error) {
    return settingsError(error, t('settings.encryptionKeyMissing'));
  }
}

export async function disconnectEmail(): Promise<SettingsActionResult> {
  const t = createTranslator(await getLocale());

  try {
    const db = createAdminClient();
    const { error } = await db
      .from('app_settings')
      .delete()
      .in('key', [
        RESEND_API_KEY_SETTING,
        NEWSLETTER_FROM_EMAIL_SETTING,
        NEWSLETTER_FROM_NAME_SETTING,
        SUBSCRIPTION_NOTIFY_EMAIL_SETTING,
      ]);

    if (error) return { ok: false, error: error.message };

    revalidatePath('/settings');
    revalidatePath('/newsletter');
    return { ok: true };
  } catch (error) {
    return settingsError(error, t('common.error'));
  }
}

export async function sendEmailTest(formData: FormData): Promise<SettingsActionResult> {
  const t = createTranslator(await getLocale());
  const to = String(formData.get('test_email') || '').trim();

  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return { ok: false, error: t('settings.emailInvalidAddress') };
  }

  try {
    const result = await sendTestEmailViaResend(to);
    if (!result.ok) {
      return { ok: false, error: result.error };
    }
    return { ok: true };
  } catch (error) {
    return settingsError(error, t('settings.emailTestFailed'));
  }
}

export async function sendSubscriptionNotifyTestAction(): Promise<
  SettingsActionResult & { recipients?: string[] }
> {
  const t = createTranslator(await getLocale());

  try {
    const result = await sendSubscriptionNotifyTest();
    if (!result.ok) {
      return { ok: false, error: result.error, recipients: result.recipients };
    }
    return { ok: true, recipients: result.recipients };
  } catch (error) {
    return settingsError(error, t('settings.subscriptionNotifyTestFailed'));
  }
}

export async function saveOnboardingImage(
  step: 1 | 2 | 3,
  formData: FormData
): Promise<SettingsActionResult> {
  const t = createTranslator(await getLocale());
  const key = ONBOARDING_IMAGE_KEYS[step - 1];

  try {
    const url = await resolveImageUrlFromForm(formData, {
      folder: 'onboarding',
      urlField: 'image_url',
      fileField: 'image_file',
    });

    if (!url) {
      return { ok: false, error: t('settings.onboardingImageRequired', { step: String(step) }) };
    }

    const db = createAdminClient();
    const { error } = await db.from('app_settings').upsert(
      {
        key,
        value: url,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    );

    if (error) {
      if (error.message.includes('app_settings') || error.code === '42P01') {
        return { ok: false, error: t('settings.appSettingsMigrationError') };
      }
      return { ok: false, error: error.message };
    }

    revalidatePath('/settings');
    return { ok: true };
  } catch (error) {
    return settingsError(error, t('common.error'));
  }
}
