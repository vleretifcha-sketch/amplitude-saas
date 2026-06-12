import type Stripe from 'stripe';
import type { createAdminClient } from '@/lib/supabase/admin';

type Db = ReturnType<typeof createAdminClient>;

export async function createStripePaymentLink(
  stripe: Stripe,
  db: Db,
  product: { id: string; stripe_monthly_price_id: string | null }
): Promise<string> {
  if (!product.stripe_monthly_price_id) {
    throw new Error('No monthly price configured for this offer.');
  }

  const paymentLink = await stripe.paymentLinks.create({
    line_items: [{ price: product.stripe_monthly_price_id, quantity: 1 }],
    allow_promotion_codes: true,
    metadata: { stripe_product_id: product.id },
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
