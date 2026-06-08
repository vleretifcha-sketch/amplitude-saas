import { InputHTMLAttributes } from 'react';

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-[var(--radius-input)] border border-border bg-surface-elevated px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent/60 ${className}`}
      {...props}
    />
  );
}

export function Textarea({
  className = '',
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full rounded-[var(--radius-input)] border border-border bg-surface-elevated px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent/60 ${className}`}
      {...props}
    />
  );
}

export function Select({
  className = '',
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full rounded-[var(--radius-input)] border border-border bg-surface-elevated px-4 py-2.5 text-sm text-foreground outline-none focus:border-accent/60 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm text-secondary">
      {children}
    </label>
  );
}

export function Field({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}
