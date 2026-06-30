'use server';

import { after } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStripeClient } from '@/lib/stripe/server';
import { createStripeCustomerOnly, grantAdminPremiumAccess } from '@/lib/stripe/users';
import { sendSubscriptionAdminNotification } from '@/lib/email/subscription-notify';
import { formatStripeProductPrice } from '@/lib/stripe/product';
import { createTranslator, getLocale } from '@/i18n';
import { requireAdmin } from '@/lib/server-auth';
import type { SubscriptionStatus } from '@/lib/types';

export type CreateUserResult =
  | { ok: true; userId: string }
  | { ok: false; error: string };

function mapCreateUserAuthError(message: string, t: ReturnType<typeof createTranslator>): string {
  const lower = message.toLowerCase();
  if (lower.includes('already been registered') || lower.includes('already exists')) {
    return t('users.emailExists');
  }
  if (lower.includes('password')) {
    return t('users.passwordInvalid');
  }
  return message;
}

async function syncSubscriptionRecords(
  db: ReturnType<typeof createAdminClient>,
  userId: string,
  status: SubscriptionStatus,
  expiresAt: string | null
) {
  if (status === 'active' && expiresAt) {
    const { error: subError } = await db.from('subscriptions').upsert(
      {
        user_id: userId,
        product_id: 'amplitude_premium_monthly',
        status: 'active',
        price_monthly: 39,
        currency: 'EUR',
        expires_at: expiresAt,
        started_at: new Date().toISOString(),
        cancelled_at: null,
      },
      { onConflict: 'user_id,product_id' }
    );
    if (subError) throw new Error(subError.message);
    return;
  }

  if (status === 'trial' && expiresAt) {
    const { error: subError } = await db.from('subscriptions').upsert(
      {
        user_id: userId,
        product_id: 'amplitude_premium_monthly',
        status: 'grace_period',
        price_monthly: 39,
        currency: 'EUR',
        expires_at: expiresAt,
        started_at: new Date().toISOString(),
        cancelled_at: null,
      },
      { onConflict: 'user_id,product_id' }
    );
    if (subError) throw new Error(subError.message);
    return;
  }

  const now = new Date().toISOString();
  await db
    .from('subscriptions')
    .update({
      status: 'expired',
      expires_at: now,
      cancelled_at: now,
    })
    .eq('user_id', userId);
}

export async function updateUserSubscription(formData: FormData) {
  await requireAdmin();
  const db = createAdminClient();
  const userId = String(formData.get('user_id'));
  const status = String(formData.get('subscription_status')) as SubscriptionStatus;
  const expiresRaw = String(formData.get('subscription_expires_at') || '');
  const expiresAt = expiresRaw ? new Date(expiresRaw).toISOString() : null;

  const { error: profileError } = await db
    .from('profiles')
    .update({
      subscription_status: status,
      subscription_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (profileError) throw new Error(profileError.message);

  await syncSubscriptionRecords(db, userId, status, expiresAt);

  revalidatePath('/users');
  revalidatePath(`/users/${userId}`);
  revalidatePath('/');
}

export async function revokeUserSubscription(userId: string) {
  await requireAdmin();
  const db = createAdminClient();
  const now = new Date().toISOString();

  const { data: profile } = await db
    .from('profiles')
    .select('stripe_subscription_id')
    .eq('id', userId)
    .maybeSingle();

  if (profile?.stripe_subscription_id) {
    try {
      const stripe = await getStripeClient();
      await stripe.subscriptions.cancel(profile.stripe_subscription_id);
    } catch {
      /* Le profil sera quand même passé en gratuit côté app */
    }
  }

  const { error: profileError } = await db
    .from('profiles')
    .update({
      subscription_status: 'none',
      subscription_expires_at: null,
      stripe_subscription_id: null,
      updated_at: now,
    })
    .eq('id', userId);

  if (profileError) throw new Error(profileError.message);

  await db
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: now,
      expires_at: now,
    })
    .eq('user_id', userId);

  revalidatePath('/users');
  revalidatePath(`/users/${userId}`);
  revalidatePath('/');
}

export async function updateUserProfile(formData: FormData) {
  await requireAdmin();
  const db = createAdminClient();
  const userId = String(formData.get('user_id'));
  const firstName = String(formData.get('first_name') || '').trim();
  const lastName = String(formData.get('last_name') || '').trim();

  const { error } = await db
    .from('profiles')
    .update({
      first_name: firstName || null,
      last_name: lastName || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) throw new Error(error.message);

  await db.auth.admin.updateUserById(userId, {
    user_metadata: { first_name: firstName, last_name: lastName },
  });

  revalidatePath('/users');
  revalidatePath(`/users/${userId}`);
}

async function notifyPremiumUserCreated(
  db: ReturnType<typeof createAdminClient>,
  params: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    stripeProductId?: string;
  }
) {
  const t = createTranslator(await getLocale());
  const name = [params.firstName, params.lastName].filter(Boolean).join(' ') || params.email;
  let planLabel = t('users.notifyManualPlan');
  let amountLabel: string | null = null;

  if (params.stripeProductId) {
    const { data: product } = await db
      .from('stripe_products')
      .select('name, billing_type, monthly_price, annual_price')
      .eq('id', params.stripeProductId)
      .maybeSingle();

    if (product) {
      planLabel = `${product.name} (${t('users.notifyAdminCreated')})`;
      amountLabel = formatStripeProductPrice(product, {
        monthShort: t('stripe.monthShort'),
        yearShort: t('stripe.yearShort'),
        lifetime: t('stripe.billingLifetime'),
      });
    }
  }

  const result = await sendSubscriptionAdminNotification({
    userId: params.userId,
    userEmail: params.email,
    userName: name,
    planLabel,
    amountLabel,
  });

  if (!result.ok) {
    console.error('[createUser] subscription notify failed:', result.error);
  }
}

export async function createUser(formData: FormData): Promise<CreateUserResult> {
  await requireAdmin();
  const t = createTranslator(await getLocale());
  const db = createAdminClient();
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');
  const firstName = String(formData.get('first_name') || '').trim();
  const lastName = String(formData.get('last_name') || '').trim();
  const accessType = String(formData.get('access_type') || 'free');
  const stripeProductId = String(formData.get('stripe_product_id') || '').trim();
  const subscriptionPlan = String(formData.get('subscription_plan') || 'monthly') as
    | 'monthly'
    | 'annual';
  const subscriptionStatus = String(formData.get('subscription_status') || 'none') as SubscriptionStatus;
  const expiresRaw = String(formData.get('subscription_expires_at') || '');
  const expiresAt = expiresRaw ? new Date(expiresRaw).toISOString() : null;

  if (!email || password.length < 8) {
    return { ok: false, error: t('users.passwordInvalid') };
  }

  const { data, error } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: firstName,
      last_name: lastName,
    },
  });

  if (error) return { ok: false, error: mapCreateUserAuthError(error.message, t) };
  if (!data.user) return { ok: false, error: t('users.createFailed') };

  const userId = data.user.id;

  try {
    if (accessType === 'premium' && stripeProductId) {
      let stripe = null;
      try {
        stripe = await getStripeClient();
      } catch {
        /* Customer Stripe optionnel pour un accès premium admin */
      }
      await grantAdminPremiumAccess(db, stripe, {
        userId,
        email,
        firstName,
        lastName,
        stripeProductId,
        plan: subscriptionPlan,
        subscriptionStatus: subscriptionStatus !== 'none' ? subscriptionStatus : 'active',
        expiresAt,
      });
    } else if (accessType === 'premium') {
      try {
        const stripe = await getStripeClient();
        await createStripeCustomerOnly(db, stripe, { userId, email, firstName, lastName });
      } catch {
        /* Stripe optional when no product selected */
      }
      if (subscriptionStatus !== 'none') {
        const { error: profileError } = await db
          .from('profiles')
          .update({
            subscription_status: subscriptionStatus,
            subscription_expires_at: expiresAt,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
        if (profileError) throw new Error(profileError.message);
        await syncSubscriptionRecords(db, userId, subscriptionStatus, expiresAt);
      }
    } else if (subscriptionStatus !== 'none') {
      const { error: profileError } = await db
        .from('profiles')
        .update({
          subscription_status: subscriptionStatus,
          subscription_expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
      if (profileError) throw new Error(profileError.message);
      await syncSubscriptionRecords(db, userId, subscriptionStatus, expiresAt);
    }
  } catch (setupError) {
    const message = setupError instanceof Error ? setupError.message : t('users.createFailed');
    return { ok: false, error: message };
  }

  if (accessType === 'premium') {
    after(async () => {
      try {
        await notifyPremiumUserCreated(db, {
          userId,
          email,
          firstName,
          lastName,
          stripeProductId: stripeProductId || undefined,
        });
      } catch (notifyError) {
        console.error('[createUser] subscription notify error:', notifyError);
      }
    });
  }

  revalidatePath('/users');
  revalidatePath('/');
  return { ok: true, userId };
}

export async function suspendUser(userId: string) {
  await requireAdmin();
  const db = createAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('stripe_subscription_id')
    .eq('id', userId)
    .single();

  if (profile?.stripe_subscription_id) {
    try {
      const stripe = await getStripeClient();
      await stripe.subscriptions.cancel(profile.stripe_subscription_id);
    } catch {
      /* profile will still be updated locally */
    }
  }

  await revokeUserSubscription(userId);
}

export async function deleteUser(userId: string) {
  await requireAdmin();
  const db = createAdminClient();
  const { error } = await db.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);

  revalidatePath('/users');
  revalidatePath('/');
}
