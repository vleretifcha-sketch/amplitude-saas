import type { StripeProduct } from '@/lib/types';

export type StripeBillingType = 'monthly' | 'annual' | 'lifetime';

export function resolveCheckoutPriceId(
  product: Pick<
    StripeProduct,
    'stripe_price_id' | 'stripe_monthly_price_id' | 'stripe_annual_price_id' | 'billing_type'
  >
): string | null {
  if (product.stripe_price_id) return product.stripe_price_id;
  if (product.billing_type === 'annual' || product.billing_type === 'lifetime') {
    return product.stripe_annual_price_id ?? product.stripe_monthly_price_id;
  }
  return product.stripe_monthly_price_id ?? product.stripe_annual_price_id;
}

export function productPriceAmount(product: Pick<StripeProduct, 'billing_type' | 'monthly_price' | 'annual_price'>): number | null {
  if (product.billing_type === 'monthly') return product.monthly_price;
  return product.annual_price;
}

export function formatStripeProductPrice(
  product: Pick<StripeProduct, 'billing_type' | 'monthly_price' | 'annual_price'>,
  labels: { monthShort: string; yearShort: string; lifetime: string }
): string {
  const amount = productPriceAmount(product);
  if (amount == null) return '—';

  if (product.billing_type === 'monthly') {
    return `${amount} €/${labels.monthShort}`;
  }
  if (product.billing_type === 'annual') {
    return `${amount} €/${labels.yearShort}`;
  }
  return `${amount} € · ${labels.lifetime}`;
}

export function billingTypeLabel(
  billingType: StripeBillingType,
  labels: { monthly: string; annual: string; lifetime: string }
): string {
  switch (billingType) {
    case 'annual':
      return labels.annual;
    case 'lifetime':
      return labels.lifetime;
    default:
      return labels.monthly;
  }
}

export function planForBillingType(billingType: StripeBillingType): 'monthly' | 'annual' {
  return billingType === 'monthly' ? 'monthly' : 'annual';
}
