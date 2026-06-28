'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { disconnectEmail, saveEmailSettings, sendEmailTest, sendSubscriptionNotifyTestAction } from '@/actions/settings';
import { isUnexpectedServerActionError } from '@/lib/action-error';
import { isFormDataUploadTooLarge } from '@/lib/form-upload';
import { Button } from '@/components/ui/Button';
import { Field, Input, Label } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ImageUploadField } from '@/components/ui/ImageUploadField';
import { IMAGE_CROP_ASPECT } from '@/lib/crop-image';
import { useLocale } from '@/i18n/client';
import type { EmailConnectionStatus } from '@/lib/email/server';

function issueMessage(t: (key: string, vars?: Record<string, string | number>) => string, status: EmailConnectionStatus): string | null {
  switch (status.issue) {
    case 'missing_key':
      return t('settings.emailIssueMissingKey');
    case 'decrypt_failed':
      return t('settings.emailIssueDecryptFailed');
    case 'missing_from':
      return t('settings.emailIssueMissingFrom');
    case 'domain_not_verified':
      return t('settings.emailIssueDomain', {
        domain: status.domainName ?? '—',
        detail: status.issueDetail ?? '',
      });
    case 'resend_api_error':
      return t('settings.emailIssueResendApi', { detail: status.issueDetail ?? '' });
    default:
      return null;
  }
}

export function EmailSettingsForm({ status }: { status: EmailConnectionStatus }) {
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testingNotify, setTestingNotify] = useState(false);
  const [testEmail, setTestEmail] = useState(
    status.notifyRecipients[0] ?? status.notifyEmail ?? status.fromEmail ?? ''
  );

  const issue = issueMessage(t, status);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    try {
      if (isFormDataUploadTooLarge(formData)) {
        toast.error(t('upload.payloadTooLarge'));
        return;
      }
      const result = await saveEmailSettings(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(t('toast.saved'));
    } catch (e) {
      if (isUnexpectedServerActionError(e)) {
        toast.error(t('upload.payloadTooLarge'));
        return;
      }
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

  async function onSendTest() {
    setTesting(true);
    try {
      const formData = new FormData();
      formData.set('test_email', testEmail);
      const result = await sendEmailTest(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(t('settings.emailTestSent', { email: testEmail }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setTesting(false);
    }
  }

  async function onSendSubscriptionNotifyTest() {
    setTestingNotify(true);
    try {
      const result = await sendSubscriptionNotifyTestAction();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        t('settings.subscriptionNotifyTestSent', {
          recipients: result.recipients?.join(', ') ?? status.notifyRecipients.join(', '),
        })
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setTestingNotify(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone={status.connected ? 'success' : 'warning'}>
          {status.connected ? t('settings.emailConnected') : t('settings.emailNotConnected')}
        </Badge>
        {status.fromEmail ? (
          <code className="rounded-lg bg-surface-muted px-3 py-1 text-sm text-secondary">
            {status.fromName ? `${status.fromName} <${status.fromEmail}>` : status.fromEmail}
          </code>
        ) : null}
      </div>

      {issue ? (
        <div className="rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          <p>{issue}</p>
          {status.resendDomains.length > 0 ? (
            <p className="mt-2 text-secondary">
              {t('settings.emailVerifiedDomains')}{' '}
              {status.resendDomains
                .filter((domain) => domain.status === 'verified')
                .map((domain) => domain.name)
                .join(', ') || t('common.dash')}
            </p>
          ) : null}
        </div>
      ) : null}

      <form action={onSubmit} encType="multipart/form-data" className="space-y-4">
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
        <Field>
          <Label htmlFor="subscription_notify_email">{t('settings.subscriptionNotifyEmail')}</Label>
          <Input
            id="subscription_notify_email"
            name="subscription_notify_email"
            type="text"
            autoComplete="email"
            placeholder="votre@email.com"
            defaultValue={status.notifyEmail ?? ''}
          />
          <p className="mt-1.5 text-xs text-muted">{t('settings.subscriptionNotifyEmailHint')}</p>
          {status.notifyRecipients.length > 0 ? (
            <p className="mt-1 text-xs text-secondary">
              {t('settings.subscriptionNotifyRecipients', {
                recipients: status.notifyRecipients.join(', '),
              })}
            </p>
          ) : null}
        </Field>
        <ImageUploadField
          label={t('settings.newsletterFooterLogo')}
          urlFieldName="newsletter_footer_logo_url"
          fileFieldName="newsletter_footer_logo_file"
          defaultUrl={status.footerLogoUrl}
          cropAspect={IMAGE_CROP_ASPECT.brandLogo}
        />
        <p className="text-sm text-muted">{t('settings.newsletterFooterLogoHint')}</p>
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

      <div className="rounded-2xl border border-border-subtle bg-surface-muted/40 p-4">
        <h3 className="text-sm font-medium">{t('settings.emailTestTitle')}</h3>
        <p className="mt-1 text-sm text-secondary">{t('settings.emailTestHint')}</p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <Field className="min-w-[240px] flex-1">
            <Label htmlFor="test_email">{t('settings.emailTestRecipient')}</Label>
            <Input
              id="test_email"
              name="test_email"
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="vous@example.com"
            />
          </Field>
          <Button type="button" variant="secondary" disabled={testing || !testEmail.trim()} onClick={onSendTest}>
            {testing ? t('settings.emailTestSending') : t('settings.emailTestSend')}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border-subtle bg-surface-muted/40 p-4">
        <h3 className="text-sm font-medium">{t('settings.subscriptionNotifyTestTitle')}</h3>
        <p className="mt-1 text-sm text-secondary">{t('settings.subscriptionNotifyTestHint')}</p>
        <div className="mt-4">
          <Button
            type="button"
            variant="secondary"
            disabled={testingNotify || !status.connected}
            onClick={onSendSubscriptionNotifyTest}
          >
            {testingNotify ? t('settings.emailTestSending') : t('settings.subscriptionNotifyTestSend')}
          </Button>
        </div>
      </div>
    </div>
  );
}
