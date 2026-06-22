'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { disconnectEmail, saveEmailSettings } from '@/actions/settings';
import { Button } from '@/components/ui/Button';
import { Field, Input, Label } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useLocale } from '@/i18n/client';
import type { EmailConnectionStatus } from '@/lib/email/server';

export function EmailSettingsForm({ status }: { status: EmailConnectionStatus }) {
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    try {
      const result = await saveEmailSettings(formData);
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
    if (!window.confirm(t('settings.emailDisconnectConfirm'))) return;
    setDisconnecting(true);
    try {
      const result = await disconnectEmail();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(t('settings.emailDisconnected'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone={status.connected ? 'success' : 'muted'}>
          {status.connected ? t('settings.emailConnected') : t('settings.emailNotConnected')}
        </Badge>
        {status.fromEmail ? (
          <code className="rounded-lg bg-surface-muted px-3 py-1 text-sm text-secondary">
            {status.fromName ? `${status.fromName} <${status.fromEmail}>` : status.fromEmail}
          </code>
        ) : null}
      </div>

      <form action={onSubmit} className="space-y-4">
        <Field>
          <Label htmlFor="resend_api_key">{t('settings.resendApiKey')}</Label>
          <Input
            id="resend_api_key"
            name="resend_api_key"
            type="password"
            autoComplete="off"
            placeholder="re_…"
            required={!status.hasApiKey}
          />
        </Field>
        <Field>
          <Label htmlFor="newsletter_from_email">{t('settings.newsletterFromEmail')}</Label>
          <Input
            id="newsletter_from_email"
            name="newsletter_from_email"
            type="email"
            autoComplete="email"
            placeholder="contact@amplitude.app"
            defaultValue={status.fromEmail ?? ''}
            required
          />
        </Field>
        <Field>
          <Label htmlFor="newsletter_from_name">{t('settings.newsletterFromName')}</Label>
          <Input
            id="newsletter_from_name"
            name="newsletter_from_name"
            type="text"
            autoComplete="name"
            placeholder="Amplitude"
            defaultValue={status.fromName ?? ''}
          />
        </Field>
        <p className="text-sm text-muted">{t('settings.emailKeyHint')}</p>
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? t('common.saving') : t('common.save')}
          </Button>
          {status.hasApiKey || status.fromEmail ? (
            <Button type="button" variant="danger" size="sm" disabled={disconnecting} onClick={onDisconnect}>
              {disconnecting ? t('common.deleting') : t('settings.emailDisconnect')}
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
