import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { CreateUserForm } from '@/components/users/CreateUserForm';
import { createAdminClient } from '@/lib/supabase/admin';
import { createTranslator, getLocale } from '@/i18n';
import type { StripeProduct } from '@/lib/types';

export default async function NewUserPage() {
  const t = createTranslator(await getLocale());
  const db = createAdminClient();
  const { data } = await db
    .from('stripe_products')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true })
    .order('name');

  return (
    <div>
      <PageHeader title={t('users.new')} backHref="/users" />
      <Card>
        <CreateUserForm stripeProducts={(data ?? []) as StripeProduct[]} />
      </Card>
    </div>
  );
}
