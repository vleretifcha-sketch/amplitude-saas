'use client';

import { Toaster } from 'sonner';

export function AppToaster() {
  return (
    <Toaster
      position="bottom-right"
      closeButton
      richColors
      toastOptions={{
        classNames: {
          toast:
            'rounded-2xl border border-border-subtle bg-surface text-foreground shadow-lg font-sans',
          title: 'text-sm font-medium',
          description: 'text-sm text-secondary',
          closeButton: 'border-border-subtle bg-surface text-secondary hover:bg-surface-muted',
        },
      }}
    />
  );
}
