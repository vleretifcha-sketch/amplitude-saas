'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Erreur serveur</h1>
        <p className="mt-2 text-sm text-secondary">
          Vérifiez les variables d&apos;environnement Supabase sur Vercel, puis rechargez.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-2xl bg-button px-6 py-2.5 text-sm font-medium text-inverse"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
