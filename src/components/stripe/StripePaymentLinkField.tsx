'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { ensureStripePaymentLink, saveStripeProductPaymentLink } from '@/actions/stripe-products';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Input';
import { useLocale } from '@/i18n/client';

export function StripePaymentLinkField({
  productId,
  initialUrl,
}: {
  productId: string;
  initialUrl: string | null;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [url, setUrl] = useState(initialUrl ?? '');
  const [draftUrl, setDraftUrl] = useState(initialUrl ?? '');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function resolveUrl(): Promise<string | null> {
    if (url) return url;
    setLoading(true);
    try {
      const next = await ensureStripePaymentLink(productId);
      setUrl(next);
      setDraftUrl(next);
      router.refresh();
      return next;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('common.error'));
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function onSaveUrl() {
    const trimmed = draftUrl.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await saveStripeProductPaymentLink(productId, trimmed);
      setUrl(trimmed);
      toast.success(t('toast.saved'));
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setSaving(false);
    }
  }

  async function onCopy() {
    const link = url || draftUrl || (await resolveUrl());
    if (!link) return;

    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success(t('stripe.paymentLinkCopied'));
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('common.error'));
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-widest text-muted">{t('stripe.paymentLinkLabel')}</p>
      <Field>
        <Input
          value={draftUrl}
          onChange={(e) => setDraftUrl(e.target.value)}
          placeholder="https://buy.stripe.com/…"
          className="font-mono text-xs"
        />
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" disabled={saving || !draftUrl.trim()} onClick={onSaveUrl}>
          {saving ? t('common.saving') : t('stripe.paymentLinkSave')}
        </Button>
        {!url ? (
          <Button type="button" variant="secondary" size="sm" disabled={loading} onClick={() => resolveUrl()}>
            {loading ? t('stripe.paymentLinkGenerating') : t('stripe.paymentLinkGenerate')}
          </Button>
        ) : (
          <Button type="button" variant="ghost" size="sm" onClick={onCopy}>
            {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
            <span className="ml-2">{t('stripe.copyPaymentLink')}</span>
          </Button>
        )}
      </div>
      <p className="text-xs text-muted">{t('stripe.paymentLinkHint')}</p>
    </div>
  );
}
