'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { ensureStripePaymentLink } from '@/actions/stripe-products';
import { Button } from '@/components/ui/Button';
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
  const [url, setUrl] = useState(initialUrl);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  async function resolveUrl(): Promise<string | null> {
    if (url) return url;
    setLoading(true);
    try {
      const next = await ensureStripePaymentLink(productId);
      setUrl(next);
      router.refresh();
      return next;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('common.error'));
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function onCopy() {
    const link = url ?? (await resolveUrl());
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

  if (!url) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-widest text-muted">{t('stripe.paymentLinkLabel')}</p>
        <Button type="button" variant="secondary" size="sm" disabled={loading} onClick={() => resolveUrl()}>
          {loading ? t('stripe.paymentLinkGenerating') : t('stripe.paymentLinkGenerate')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-widest text-muted">{t('stripe.paymentLinkLabel')}</p>
      <div className="flex items-center gap-2 rounded-[var(--radius-card)] border border-border-subtle bg-surface-elevated px-3 py-2">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="min-w-0 flex-1 truncate font-mono text-xs text-secondary hover:text-foreground hover:underline"
        >
          {url}
        </a>
        <button
          type="button"
          onClick={onCopy}
          disabled={loading}
          className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
          aria-label={t('stripe.copyPaymentLink')}
          title={t('stripe.copyPaymentLink')}
        >
          {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
        </button>
      </div>
      <p className="text-xs text-muted">{t('stripe.paymentLinkHint')}</p>
    </div>
  );
}
