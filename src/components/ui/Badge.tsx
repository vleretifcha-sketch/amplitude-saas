type Tone = 'default' | 'accent' | 'success' | 'warning' | 'error' | 'muted';

const tones: Record<Tone, string> = {
  default: 'bg-surface-muted text-secondary',
  accent: 'bg-accent-subtle text-accent',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  error: 'bg-error/15 text-error',
  muted: 'bg-surface-muted text-muted',
};

export function Badge({
  children,
  tone = 'default',
}: {
  children: React.ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
