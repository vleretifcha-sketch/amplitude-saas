import type Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { mapStripeSubscriptionStatus } from '@/lib/stripe/users';

export async function syncStripeSubscriptionToProfile(
  subscription: Stripe.Subscription
): Promise<void> {
  const db = createAdminClient();
  const userId = subscription.metadata?.supabase_user_id;
  if (!userId) return;

  const firstItem = subscription.items.data[0];
  const expiresAt = firstItem?.current_period_end
    ? new Date(firstItem.current_period_end * 1000).toISOString()
    : null;
  const subscriptionStatus = mapStripeSubscriptionStatus(subscription.status);
  const stripeProductId = subscription.metadata?.stripe_product_id ?? null;

  await db
    .from('profiles')
    .update({
      stripe_subscription_id: subscription.id,
      stripe_customer_id:
        typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id,
      subscription_status: subscriptionStatus,
      subscription_expires_at: expiresAt,
      subscription_plan: firstItem?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly',
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  const recordStatus =
    subscription.status === 'canceled' || subscription.status === 'incomplete_expired'
      ? 'cancelled'
      : subscription.status === 'past_due' || subscription.status === 'unpaid'
        ? 'expired'
        : subscription.status === 'trialing'
          ? 'grace_period'
          : 'active';

  await db.from('subscriptions').upsert(
    {
      user_id: userId,
      product_id: firstItem?.price?.product?.toString() ?? 'stripe_subscription',
      platform: 'web',
      status: recordStatus,
      price_monthly: firstItem?.price?.unit_amount ? firstItem.price.unit_amount / 100 : 0,
      currency: (firstItem?.price?.currency ?? 'eur').toUpperCase(),
      stripe_subscription_id: subscription.id,
      stripe_price_id: firstItem?.price?.id ?? null,
      stripe_product_id: stripeProductId,
      started_at: new Date(subscription.start_date * 1000).toISOString(),
      expires_at: expiresAt,
      cancelled_at:
        subscription.status === 'canceled' ? new Date().toISOString() : null,
    },
    { onConflict: 'user_id,product_id' }
  );
}

export async function handleStripeWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      await syncStripeSubscriptionToProfile(event.data.object as Stripe.Subscription);
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.supabase_user_id;
      if (!userId) break;

      const db = createAdminClient();
      await db
        .from('profiles')
        .update({
          subscription_status: 'none',
          subscription_expires_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      await db
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id);
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId =
        typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
      if (!customerId) break;

      const db = createAdminClient();
      await db
        .from('profiles')
        .update({
          subscription_status: 'expired',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_customer_id', customerId);
      break;
    }
    default:
      break;
  }
}
