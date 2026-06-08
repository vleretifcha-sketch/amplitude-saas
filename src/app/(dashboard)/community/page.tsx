import { createAdminClient } from '@/lib/supabase/admin';
import { deletePostForm } from '@/actions/community';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { createTranslator, getDateLocale, getLocale } from '@/i18n';

export default async function CommunityPage() {
  const locale = await getLocale();
  const t = createTranslator(locale);
  const dateLocale = getDateLocale(locale);
  const db = createAdminClient();
  const { data } = await db
    .from('community_posts')
    .select('*, profiles(email, first_name, last_name)')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div>
      <PageHeader title={t('community.title')} description={t('community.description')} />
      <div className="space-y-4">
        {(data ?? []).map((post) => {
          const author = post.profiles as {
            email: string;
            first_name: string | null;
            last_name: string | null;
          } | null;
          const name =
            [author?.first_name, author?.last_name].filter(Boolean).join(' ') ||
            author?.email ||
            t('common.user');
          return (
            <Card key={post.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{name}</p>
                  <p className="mt-1 text-xs text-muted">
                    {new Date(post.created_at).toLocaleString(dateLocale)}
                  </p>
                  <p className="mt-3 whitespace-pre-wrap text-sm">{post.content}</p>
                </div>
                <form action={deletePostForm}>
                  <input type="hidden" name="post_id" value={post.id} />
                  <Button type="submit" variant="danger" size="sm">
                    {t('common.delete')}
                  </Button>
                </form>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
