'use client';

import { deleteUser } from '@/actions/users';
import { DeleteResourceButton } from '@/components/ui/DeleteResourceButton';
import { useLocale } from '@/i18n/client';

export function DeleteUserButton({ userId, userName }: { userId: string; userName: string }) {
  const { t } = useLocale();

  return (
    <DeleteResourceButton
      label={t('users.deleteUser')}
      confirmMessage={t('users.deleteUserConfirm', { name: userName })}
      redirectTo="/users"
      onDelete={() => deleteUser(userId)}
    />
  );
}
