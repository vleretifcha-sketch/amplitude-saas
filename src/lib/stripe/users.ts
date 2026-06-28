import type Stripe from 'stripe';
import type { createAdminClient } from '@/lib/supabase/admin';
import type { SubscriptionStatus } from '@/lib/types';
import { planForBillingType, resolveCheckoutPriceId } from '@/lib/stripe/product';

type Db = ReturnType<typeof createAdminClient>;

export function mapStripeSubscriptionStatus(
  status: Stripe.Subscription.Status
): SubscriptionStatus {
  if (status === 'trialing') return 'trial';
  if (status === 'active') return 'active';
  if (status === 'past_due' || status === 'unpaid') return 'expired';
  return 'none';
}

export async function attachStripeSubscription(
  db: Db,
  stripe: Stripe,
  params: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    stripeProductId: string;
    plan: 'monthly' | 'annual';
  }
) {
  const { data: product } = await db
    .from('stripe_products')
    .select('*')
    .eq('id', params.stripeProductId)
    .eq('active', true)
    .single();

  if (!product) throw new Error('Stripe product not found.');

  if (product.billing_type === 'lifetime') {
    throw new Error('Lifetime offers cannot be attached as a recurring subscription. Use manual premium access.');
  }

  const plan = params.plan ?? planForBillingType(product.billing_type ?? 'monthly');
  const priceId = resolveCheckoutPriceId(product);
  if (!priceId) throw new Error(`No checkout price configured for this offer.`);

  const customer = await stripe.customers.create({
    email: params.email,
    name: [params.firstName, params.lastName].filter(Boolean).join(' ') || undefined,
    metadata: { supabase_user_id: params.userId },
  });

  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: priceId }],
    ...(product.trial_days ? { trial_period_days: product.trial_days } : {}),
    metadata: {
      supabase_user_id: params.userId,
      stripe_product_id: product.id,
    },
  });

  const firstItem = subscription.items.data[0];
  const expiresAt = firstItem?.current_period_end
    ? new Date(firstItem.current_period_end * 1000).toISOString()
    : null;
  const subscriptionStatus = mapStripeSubscriptionStatus(subscription.status);
  const priceMonthly =
    plan === 'monthly'
      ? Number(product.monthly_price ?? 0)
      : Number(product.annual_price ?? 0) / 12;

  await db
    .from('profiles')
    .update({
      stripe_customer_id: customer.id,
      stripe_subscription_id: subscription.id,
      subscription_plan: plan,
      subscription_status: subscriptionStatus,
      subscription_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.userId);

  await db.from('subscriptions').upsert(
    {
      user_id: params.userId,
      product_id: product.stripe_product_id,
      platform: 'web',
      status: subscriptionStatus === 'trial' ? 'grace_period' : 'active',
      price_monthly: priceMonthly,
      currency: 'EUR',
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      stripe_product_id: product.id,
      started_at: new Date(subscription.start_date * 1000).toISOString(),
      expires_at: expiresAt,
      cancelled_at: null,
    },
    { onConflict: 'user_id,product_id' }
  );
}

export async function createStripeCustomerOnly(
  db: Db,
  stripe: Stripe,
  params: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
  }
) {
  const customer = await stripe.customers.create({
    email: params.email,
    name: [params.firstName, params.lastName].filter(Boolean).join(' ') || undefined,
    metadata: { supabase_user_id: params.userId },
  });

  await db
    .from('profiles')
    .update({
      stripe_customer_id: customer.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.userId);
}
