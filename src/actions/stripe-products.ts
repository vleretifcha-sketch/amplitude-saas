'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStripeClient } from '@/lib/stripe/server';
import { createStripePaymentLink } from '@/lib/stripe/payment-link';
import type { StripeProductRow, StripePromoCode } from '@/lib/types';

function parseEuro(value: FormDataEntryValue | null): number | null {
  const n = Number(String(value || '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function createStripeProduct(formData: FormData) {
  const name = String(formData.get('name') || '').trim();
  const description = String(formData.get('description') || '').trim() || null;
  const monthlyPrice = parseEuro(formData.get('monthly_price'));

  if (!name) throw new Error('Offer name is required.');
  if (!monthlyPrice) throw new Error('Monthly price is required.');

  const stripe = await getStripeClient();
  const product = await stripe.products.create({ name, description: description ?? undefined });

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: Math.round(monthlyPrice * 100),
    currency: 'eur',
    recurring: { interval: 'month' },
  });

  const db = createAdminClient();
  const { data: inserted, error } = await db
    .from('stripe_products')
    .insert({
      stripe_product_id: product.id,
      stripe_monthly_price_id: price.id,
      stripe_annual_price_id: null,
      name,
      description,
      monthly_price: monthlyPrice,
      annual_price: null,
      trial_days: null,
      active: true,
    })
    .select('id, stripe_monthly_price_id')
    .single();

  if (error) throw new Error(error.message);
  if (!inserted) throw new Error('Product insert failed.');

  await createStripePaymentLink(stripe, db, inserted);

  revalidatePath('/users');
}

export async function archiveStripeProduct(productId: string) {
  const db = createAdminClient();
  const { data: product } = await db
    .from('stripe_products')
    .select('stripe_product_id, stripe_payment_link_id')
    .eq('id', productId)
    .single();

  if (!product) throw new Error('Product not found.');

  const stripe = await getStripeClient();
  await stripe.products.update(product.stripe_product_id, { active: false });
  if (product.stripe_payment_link_id) {
    await stripe.paymentLinks.update(product.stripe_payment_link_id, { active: false });
  }

  const { error } = await db
    .from('stripe_products')
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq('id', productId);

  if (error) throw new Error(error.message);

  revalidatePath('/users');
}

export async function getStripeProductsWithStats(): Promise<StripeProductRow[]> {
  const db = createAdminClient();

  const { data: products, error: productsError } = await db
    .from('stripe_products')
    .select('*')
    .order('created_at', { ascending: false });

  if (productsError || !products?.length) {
    return [];
  }

  const [{ data: subs }, { data: promos }] = await Promise.all([
    db.from('subscriptions').select('stripe_product_id, status').eq('status', 'active'),
    db.from('stripe_promo_codes').select('*').order('created_at', { ascending: false }),
  ]);

  const countByProduct = (subs ?? []).reduce<Record<string, number>>((acc, row) => {
    if (!row.stripe_product_id) return acc;
    acc[row.stripe_product_id] = (acc[row.stripe_product_id] ?? 0) + 1;
    return acc;
  }, {});

  const promosByProduct = (promos ?? []).reduce<Record<string, StripePromoCode[]>>((acc, row) => {
    const productId = row.stripe_product_id;
    if (!productId) return acc;
    if (!acc[productId]) acc[productId] = [];
    acc[productId].push(row as StripePromoCode);
    return acc;
  }, {});

  return products.map((product) => ({
    ...(product as StripeProductRow),
    activeSubscribers: countByProduct[product.id] ?? 0,
    promoCodes: promosByProduct[product.id] ?? [],
  }));
}

export async function createStripePromoCode(formData: FormData) {
  const productId = String(formData.get('stripe_product_id') || '').trim();
  let code = String(formData.get('code') || '').trim().toUpperCase();
  const discountType = String(formData.get('discount_type') || 'percent');
  const discountValue = Number(String(formData.get('discount_value') || '').replace(',', '.'));
  const duration = String(formData.get('duration') || 'once') as 'once' | 'forever' | 'repeating';
  const durationInMonthsRaw = String(formData.get('duration_in_months') || '').trim();
  const maxRedemptionsRaw = String(formData.get('max_redemptions') || '').trim();
  const redeemByRaw = String(formData.get('redeem_by') || '').trim();

  if (!productId) throw new Error('Product is required.');
  if (!code) code = `AMP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    throw new Error('Discount value is required.');
  }
  if (discountType === 'percent' && discountValue > 100) {
    throw new Error('Percentage cannot exceed 100.');
  }

  const stripe = await getStripeClient();
  const coupon = await stripe.coupons.create({
    ...(discountType === 'percent'
      ? { percent_off: discountValue }
      : { amount_off: Math.round(discountValue * 100), currency: 'eur' }),
    duration,
    ...(duration === 'repeating'
      ? { duration_in_months: Number(durationInMonthsRaw) || 3 }
      : {}),
    ...(maxRedemptionsRaw ? { max_redemptions: Number(maxRedemptionsRaw) } : {}),
    ...(redeemByRaw ? { redeem_by: Math.floor(new Date(redeemByRaw).getTime() / 1000) } : {}),
  });

  const promoCode = await stripe.promotionCodes.create({
    promotion: {
      type: 'coupon',
      coupon: coupon.id,
    },
    code,
  });

  const db = createAdminClient();
  const { error } = await db.from('stripe_promo_codes').insert({
    stripe_product_id: productId,
    stripe_coupon_id: coupon.id,
    stripe_promotion_code_id: promoCode.id,
    code,
    percent_off: discountType === 'percent' ? discountValue : null,
    amount_off: discountType === 'fixed' ? discountValue : null,
    currency: 'eur',
    duration,
    duration_in_months: duration === 'repeating' ? Number(durationInMonthsRaw) || 3 : null,
    max_redemptions: maxRedemptionsRaw ? Number(maxRedemptionsRaw) : null,
    redeem_by: redeemByRaw ? new Date(redeemByRaw).toISOString() : null,
    times_redeemed: promoCode.times_redeemed ?? 0,
    active: promoCode.active,
  });

  if (error) throw new Error(error.message);

  revalidatePath('/users');
}

export async function ensureStripePaymentLink(productId: string): Promise<string> {
  const db = createAdminClient();
  const { data: product } = await db
    .from('stripe_products')
    .select('id, stripe_monthly_price_id, stripe_payment_link_url')
    .eq('id', productId)
    .eq('active', true)
    .single();

  if (!product) throw new Error('Product not found.');

  if (product.stripe_payment_link_url) {
    return product.stripe_payment_link_url;
  }

  const stripe = await getStripeClient();
  const link = await createStripePaymentLink(stripe, db, product);
  revalidatePath('/users');
  return link;
}

export async function deactivateStripePromoCode(promoId: string) {
  const db = createAdminClient();
  const { data: promo } = await db
    .from('stripe_promo_codes')
    .select('stripe_promotion_code_id')
    .eq('id', promoId)
    .single();

  if (!promo) throw new Error('Promo code not found.');

  const stripe = await getStripeClient();
  await stripe.promotionCodes.update(promo.stripe_promotion_code_id, { active: false });

  const { error } = await db.from('stripe_promo_codes').update({ active: false }).eq('id', promoId);
  if (error) throw new Error(error.message);

  revalidatePath('/users');
}
