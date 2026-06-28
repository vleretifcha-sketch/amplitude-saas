import type Stripe from 'stripe';
import type { createAdminClient } from '@/lib/supabase/admin';
import { resolveCheckoutPriceId } from '@/lib/stripe/product';
import type { StripeProduct } from '@/lib/types';

type Db = ReturnType<typeof createAdminClient>;

export async function createStripePaymentLink(
  stripe: Stripe,
  db: Db,
  product: Pick<
    StripeProduct,
    'id' | 'stripe_price_id' | 'stripe_monthly_price_id' | 'stripe_annual_price_id' | 'billing_type'
  >
): Promise<string> {
  const priceId = resolveCheckoutPriceId(product);
  if (!priceId) {
    throw new Error('No checkout price configured for this offer.');
  }

  const paymentLink = await stripe.paymentLinks.create({
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    metadata: { stripe_product_id: product.id },
    after_completion: {
      type: 'redirect',
      redirect: { url: 'https://www.amplitudeapp.fr/payment-success' },
    },
  });

  if (!paymentLink.url) throw new Error('Stripe did not return a payment link URL.');

  const { error } = await db
    .from('stripe_products')
    .update({
      stripe_payment_link_id: paymentLink.id,
      stripe_payment_link_url: paymentLink.url,
      updated_at: new Date().toISOString(),
    })
    .eq('id', product.id);

  if (error) throw new Error(error.message);

  return paymentLink.url;
}
