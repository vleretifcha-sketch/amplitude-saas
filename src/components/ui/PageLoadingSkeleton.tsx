export function PageLoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-xl bg-surface-muted" />
        <div className="h-4 w-96 max-w-full rounded-lg bg-surface-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 rounded-[var(--radius-card)] bg-surface-muted" />
        ))}
      </div>
      <div className="h-80 rounded-[var(--radius-card)] bg-surface-muted" />
    </div>
  );
}

export function TableLoadingSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="animate-pulse overflow-hidden rounded-[var(--radius-card)] border border-border-subtle bg-surface">
      <div className="border-b border-border-subtle px-6 py-3">
        <div className="h-4 w-full max-w-md rounded bg-surface-muted" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 border-b border-border-subtle/60 px-6 py-4 last:border-0">
          <div className="h-4 flex-1 rounded bg-surface-muted" />
          <div className="h-4 w-24 rounded bg-surface-muted" />
          <div className="h-4 w-16 rounded bg-surface-muted" />
        </div>
      ))}
    </div>
  );
}
