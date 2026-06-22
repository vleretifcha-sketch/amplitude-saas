'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { deleteComment } from '@/actions/community';
import { Button } from '@/components/ui/Button';
import { useLocale } from '@/i18n/client';

export function DeleteCommunityCommentButton({ commentId }: { commentId: string }) {
  const { t } = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!window.confirm(t('community.deleteCommentConfirm'))) return;
    setLoading(true);
    try {
      await deleteComment(commentId);
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
