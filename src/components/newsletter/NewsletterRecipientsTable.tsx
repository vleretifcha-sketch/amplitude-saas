'use client';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { useLocale } from '@/i18n/client';
import { translateStatus } from '@/i18n/translator';
import type { NewsletterRecipient, SubscriptionStatus } from '@/lib/types';

const subTone: Record<SubscriptionStatus, 'success' | 'accent' | 'warning' | 'muted'> = {
  active: 'success',
  trial: 'accent',
  expired: 'warning',
  none: 'muted',
};

export function NewsletterRecipientsTable({
  recipients,
  dateLocale,
}: {
  recipients: NewsletterRecipient[];
  dateLocale: string;
}) {
  const { t } = useLocale();

  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border-subtle text-secondary">
          <tr>
            <th className="px-6 py-3">{t('newsletter.colName')}</th>
            <th className="px-6 py-3">{t('newsletter.colEmail')}</th>
            <th className="px-6 py-3">{t('newsletter.colStatus')}</th>
            <th className="px-6 py-3">{t('newsletter.colRegisteredAt')}</th>
          </tr>
        </thead>
        <tbody>
          {recipients.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-10 text-center text-sm text-muted">
                {t('newsletter.emptySubscribers')}
              </td>
            </tr>
          ) : (
            recipients.map((recipient) => {
              const name = [recipient.first_name, recipient.last_name].filter(Boolean).join(' ') || '—';
              return (
                <tr key={recipient.id} className="border-b border-border-subtle last:border-0">
                  <td className="px-6 py-4">{name}</td>
                  <td className="px-6 py-4 text-secondary">{recipient.email}</td>
                  <td className="px-6 py-4">
                    <Badge tone={subTone[recipient.subscription_status]}>
                      {translateStatus(t, recipient.subscription_status)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-secondary">
                    {new Date(recipient.created_at).toLocaleDateString(dateLocale)}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </Card>
  );
}
