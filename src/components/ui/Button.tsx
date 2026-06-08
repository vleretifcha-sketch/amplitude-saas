import { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const variants: Record<Variant, string> = {
  primary: 'bg-button text-inverse hover:bg-button-hover',
  secondary: 'bg-surface-elevated text-foreground border border-border hover:bg-surface-muted',
  ghost: 'text-secondary hover:text-foreground hover:bg-surface-muted',
  danger: 'bg-error/15 text-error hover:bg-error/25',
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: 'sm' | 'md';
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: Props) {
  const sizes = size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-5 py-2.5 text-sm font-medium';
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full transition-colors disabled:opacity-50 ${variants[variant]} ${sizes} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
