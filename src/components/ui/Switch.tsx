'use client';

type SwitchProps = {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  'aria-label'?: string;
};

export function Switch({
  id,
  checked,
  onCheckedChange,
  disabled = false,
  'aria-label': ariaLabel,
}: SwitchProps) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'bg-accent' : 'bg-surface-muted'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
