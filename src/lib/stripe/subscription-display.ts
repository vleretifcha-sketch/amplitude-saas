import type { Profile, StripeBillingType, StripeProduct, Subscription } from '@/lib/types';

export type SubscriptionProductInfo = {
  stripeProductId: string | null;
  stripeProductName: string | null;
  billingType: StripeBillingType | null;
  isManual: boolean;
};

export type UserListRow = Profile & SubscriptionProductInfo;

const ACTIVE_SUB_STATUSES = new Set<Subscription['status']>(['active', 'grace_period']);

export function isPremiumProfileStatus(status: Profile['subscription_status']): boolean {
  return status === 'active' || status === 'trial';
}

export function pickActiveSubscription(subs: Subscription[]): Subscription | null {
  const active = subs.filter((sub) => ACTIVE_SUB_STATUSES.has(sub.status));
  if (active.length === 0) return null;

  return [...active].sort(
    (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
  )[0];
}

function legacyProductName(productId: string, products: StripeProduct[]): string | null {
  if (productId === 'amplitude_premium_monthly') {
    const legacy =
      products.find((p) => p.name.toLowerCase().includes('premium') && p.billing_type === 'monthly') ??
      products.find((p) => !p.active && p.billing_type === 'monthly');
    return legacy?.name ?? 'Amplitude Premium (legacy)';
  }
  return null;
}

export function resolveSubscriptionProduct(
  sub: Subscription | null | undefined,
  products: StripeProduct[],
  profile?: Pick<Profile, 'subscription_status' | 'stripe_customer_id' | 'stripe_subscription_id'>
): SubscriptionProductInfo {
  const productById = new Map(products.map((p) => [p.id, p]));
  const productByStripeId = new Map(products.map((p) => [p.stripe_product_id, p]));

  if (sub && ACTIVE_SUB_STATUSES.has(sub.status)) {
    if (sub.stripe_product_id) {
      const product = productById.get(sub.stripe_product_id);
      if (product) {
        return {
          stripeProductId: product.id,
          stripeProductName: product.name,
          billingType: product.billing_type,
          isManual: false,
        };
      }
    }

    const byStripeRef = productByStripeId.get(sub.product_id);
    if (byStripeRef) {
      return {
        stripeProductId: byStripeRef.id,
        stripeProductName: byStripeRef.name,
        billingType: byStripeRef.billing_type,
        isManual: false,
      };
    }

    const legacyName = legacyProductName(sub.product_id, products);
    if (legacyName) {
      const legacyProduct =
        products.find((p) => p.name === legacyName) ??
        products.find((p) => p.billing_type === 'monthly' && !p.active);
      return {
        stripeProductId: legacyProduct?.id ?? null,
        stripeProductName: legacyName,
        billingType: legacyProduct?.billing_type ?? 'monthly',
        isManual: false,
      };
    }
  }

  if (profile && isPremiumProfileStatus(profile.subscription_status)) {
    const isManual = !profile.stripe_customer_id && !profile.stripe_subscription_id;
    return {
      stripeProductId: null,
      stripeProductName: null,
      billingType: null,
      isManual,
    };
  }

  return {
    stripeProductId: null,
    stripeProductName: null,
    billingType: null,
    isManual: false,
  };
}

export function resolveUserListRow(
  profile: Profile,
  subs: Subscription[],
  products: StripeProduct[]
): UserListRow {
  const activeSub = pickActiveSubscription(subs.filter((sub) => sub.user_id === profile.id));
  const productInfo = resolveSubscriptionProduct(activeSub, products, profile);
  return { ...profile, ...productInfo };
}

export type ProductFilterValue = 'all' | 'free' | 'manual' | 'unknown' | string;

export function matchesProductFilter(user: UserListRow, filter: ProductFilterValue): boolean {
  if (filter === 'all') return true;
  if (filter === 'free') return !isPremiumProfileStatus(user.subscription_status);
  if (filter === 'manual') return user.isManual && isPremiumProfileStatus(user.subscription_status);
  if (filter === 'unknown') {
    return (
      isPremiumProfileStatus(user.subscription_status) &&
      !user.stripeProductName &&
      !user.isManual
    );
  }
  return user.stripeProductId === filter;
}
