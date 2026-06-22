import type Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendSubscriptionAdminNotification } from '@/lib/email/subscription-notify';
import { mapStripeSubscriptionStatus } from '@/lib/stripe/users';

function resolveUserId(
  metadata?: Stripe.Metadata | null,
  clientReferenceId?: string | null
): string | null {
  return metadata?.supabase_user_id ?? clientReferenceId ?? null;
}

async function resolveUserIdByCustomerId(
  db: ReturnType<typeof createAdminClient>,
  customerId: string
): Promise<string | null> {
  const { data } = await db.from('profiles').select('id').eq('stripe_customer_id', customerId).maybeSingle();
  return data?.id ?? null;
}

function formatAmount(subscription: Stripe.Subscription): string | null {
  const item = subscription.items.data[0];
  if (!item?.price?.unit_amount) return null;
  const currency = (item.price.currency ?? 'eur').toUpperCase();
  const amount = (item.price.unit_amount / 100).toFixed(2);
  const interval = item.price.recurring?.interval === 'year' ? '/an' : '/mois';
  return `${amount} ${currency}${interval}`;
}

export async function syncStripeSubscriptionToProfile(
  subscription: Stripe.Subscription,
  userIdOverride?: string | null
): Promise<string | null> {
  const db = createAdminClient();
  let userId: string | null = userIdOverride ?? subscription.metadata?.supabase_user_id ?? null;

  if (!userId && typeof subscription.customer === 'string') {
    userId = await resolveUserIdByCustomerId(db, subscription.customer);
  }

  if (!userId) return null;

  const firstItem = subscription.items.data[0];
  const periodEnd = firstItem?.current_period_end ?? null;
  const expiresAt = periodEnd ? new Date(periodEnd * 1000).toISOString() : null;
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
      cancelled_at: subscription.status === 'canceled' ? new Date().toISOString() : null,
    },
    { onConflict: 'user_id,product_id' }
  );

  return userId;
}

async function notifyIfActivated(userId: string, subscription: Stripe.Subscription) {
  if (subscription.status !== 'active' && subscription.status !== 'trialing') return;

  const planLabel =
    subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'Annuel' : 'Mensuel';

  await sendSubscriptionAdminNotification({
    userId,
    planLabel,
    amountLabel: formatAmount(subscription),
  });
}

export async function handleStripeWebhookEvent(event: Stripe.Event, stripe: Stripe) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = resolveUserId(session.metadata, session.client_reference_id);
      const subscriptionId =
        typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id;

      if (!userId || !subscriptionId) break;

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const syncedUserId = await syncStripeSubscriptionToProfile(subscription, userId);
      if (syncedUserId) await notifyIfActivated(syncedUserId, subscription);
      break;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = await syncStripeSubscriptionToProfile(subscription);
      if (userId) await notifyIfActivated(userId, subscription);
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      let userId = resolveUserId(subscription.metadata);
      if (!userId && typeof subscription.customer === 'string') {
        const db = createAdminClient();
        userId = await resolveUserIdByCustomerId(db, subscription.customer);
      }
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
