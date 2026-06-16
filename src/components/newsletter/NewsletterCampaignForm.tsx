'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { saveNewsletterDraft, sendNewsletterCampaign } from '@/actions/newsletter';
import { Button } from '@/components/ui/Button';
import { Field, Input, Label, Textarea } from '@/components/ui/Input';
import { useLocale } from '@/i18n/client';
import type { EmailConnectionStatus } from '@/lib/email/server';

export function NewsletterCampaignForm({
  emailStatus,
  recipientCount,
}: {
  emailStatus: EmailConnectionStatus;
  recipientCount: number;
}) {
  const { t } = useLocale();
  const [savingDraft, setSavingDraft] = useState(false);
  const [sending, setSending] = useState(false);

  async function onSaveDraft(formData: FormData) {
    setSavingDraft(true);
    try {
      await saveNewsletterDraft(formData);
      toast.success(t('newsletter.draftSaved'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setSavingDraft(false);
    }
  }

  async function onSend(formData: FormData) {
    if (
      !window.confirm(
        t('newsletter.sendConfirm', {
          count: recipientCount,
        })
      )
    ) {
      return;
    }

    setSending(true);
    try {
      const result = await sendNewsletterCampaign(formData);
      toast.success(
        t('newsletter.sentToast', {
          sent: result.sentCount,
          total: result.recipientCount,
        })
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="space-y-4">
      <div className="rounded-2xl bg-surface-muted px-4 py-3 text-sm text-secondary">
        <p>{t('newsletter.recipientsHint', { count: recipientCount })}</p>
        {!emailStatus.connected ? (
          <p className="mt-2 text-warning">
            {t('newsletter.emailNotConfigured')}{' '}
            <Link href="/settings" className="font-medium underline">
              {t('newsletter.openSettings')}
            </Link>
          </p>
        ) : null}
      </div>

      <Field>
        <Label htmlFor="subject">{t('newsletter.formSubject')}</Label>
        <Input id="subject" name="subject" placeholder={t('newsletter.formSubjectPlaceholder')} required />
      </Field>
      <Field>
        <Label htmlFor="preview">{t('newsletter.formPreview')}</Label>
        <Input id="preview" name="preview" placeholder={t('newsletter.formPreviewPlaceholder')} />
      </Field>
      <Field>
        <Label htmlFor="body">{t('newsletter.formBody')}</Label>
        <Textarea id="body" name="body" rows={10} placeholder={t('newsletter.formBodyPlaceholder')} required />
      </Field>
      <div className="flex flex-wrap gap-3">
        <Button
          type="submit"
          variant="secondary"
          disabled={savingDraft || sending}
          formAction={onSaveDraft}
        >
          {savingDraft ? t('common.saving') : t('newsletter.saveDraft')}
        </Button>
        <Button
          type="submit"
          disabled={sending || !emailStatus.connected || recipientCount === 0}
          formAction={onSend}
        >
          {sending ? t('newsletter.sending') : t('newsletter.sendCampaign')}
        </Button>
      </div>
      <p className="text-xs text-muted">{t('newsletter.sendHint')}</p>
    </form>
  );
}
