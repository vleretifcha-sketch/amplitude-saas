'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { deletePost } from '@/actions/community';
import { Button } from '@/components/ui/Button';
import { useLocale } from '@/i18n/client';

export function DeleteCommunityPostButton({ postId }: { postId: string }) {
  const { t } = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!window.confirm(t('community.deleteConfirm'))) return;
    setLoading(true);
    try {
      await deletePost(postId);
      toast.success(t('toast.deleted'));
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant="danger" size="sm" disabled={loading} onClick={handleDelete}>
      {loading ? t('common.deleting') : t('common.delete')}
    </Button>
  );
}
