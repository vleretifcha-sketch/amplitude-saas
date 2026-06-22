'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { saveStripeSecretKey, disconnectStripe } from '@/actions/settings';
import { Button } from '@/components/ui/Button';
import { Field, Input, Label } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useLocale } from '@/i18n/client';
import type { StripeConnectionStatus } from '@/lib/settings/server';

export function StripeSettingsForm({ status }: { status: StripeConnectionStatus }) {
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    try {
      const result = await saveStripeSecretKey(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(t('toast.saved'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  async function onDisconnect() {
    if (!window.confirm(t('settings.stripeDisconnectConfirm'))) return;
    setDisconnecting(true);
    try {
      const result = await disconnectStripe();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(t('settings.stripeDisconnected'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Badge tone={status.connected ? 'success' : 'muted'}>
          {status.connected ? t('settings.stripeConnected') : t('settings.stripeNotConnected')}
        </Badge>
        {status.maskedKey ? (
          <code className="rounded-lg bg-surface-muted px-3 py-1 text-sm text-secondary">
            {status.maskedKey}
          </code>
        ) : null}
      </div>

      <form action={onSubmit} className="space-y-4">
        <Field>
          <Label htmlFor="stripe_secret_key">{t('settings.stripeSecretKey')}</Label>
          <Input
            id="stripe_secret_key"
            name="stripe_secret_key"
            type="password"
            autoComplete="off"
            placeholder="sk_live_… ou sk_test_…"
            required={!status.connected}
          />
        </Field>
        <p className="text-sm text-muted">{t('settings.stripeKeyHint')}</p>
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? t('common.saving') : t('common.save')}
          </Button>
          {status.connected ? (
            <Button type="button" variant="danger" size="sm" disabled={disconnecting} onClick={onDisconnect}>
              {disconnecting ? t('common.deleting') : t('settings.stripeDisconnect')}
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
