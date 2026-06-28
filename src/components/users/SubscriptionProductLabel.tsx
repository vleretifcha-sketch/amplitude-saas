'use client';

import { billingTypeLabel } from '@/lib/stripe/product';
import {
  isPremiumProfileStatus,
  type UserListRow,
} from '@/lib/stripe/subscription-display';
import { useLocale } from '@/i18n/client';

export function SubscriptionProductLabel({ user }: { user: UserListRow }) {
  const { t } = useLocale();

  if (!isPremiumProfileStatus(user.subscription_status)) {
    return <span className="text-muted">{t('users.accessFree')}</span>;
  }

  if (user.isManual) {
    return <span className="text-secondary">{t('users.manualPremium')}</span>;
  }

  if (!user.stripeProductName) {
    return <span className="text-warning">{t('users.subscriptionUnknown')}</span>;
  }

  const billing =
    user.billingType != null
      ? billingTypeLabel(user.billingType, {
          monthly: t('users.planMonthly'),
          annual: t('users.planAnnual'),
          lifetime: t('stripe.billingLifetime'),
        })
      : null;

  return (
    <span className="text-foreground">
      {user.stripeProductName}
      {billing ? <span className="text-muted"> · {billing}</span> : null}
    </span>
  );
}
