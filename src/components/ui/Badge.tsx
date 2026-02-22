'use client';
import { clsx } from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'danger' | 'warning' | 'caution' | 'info' | 'success';
  size?: 'sm' | 'md';
  pulse?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const variantStyles = {
  default: 'bg-white/10 text-white/80',
  danger: 'bg-[var(--danger)]/15 text-[var(--danger)] border border-[var(--danger)]/20',
  warning: 'bg-[var(--warning)]/15 text-[var(--warning)] border border-[var(--warning)]/20',
  caution: 'bg-[var(--caution)]/15 text-[var(--caution)] border border-[var(--caution)]/20',
  info: 'bg-[var(--info)]/15 text-[var(--info)] border border-[var(--info)]/20',
  success: 'bg-[var(--success)]/15 text-[var(--success)] border border-[var(--success)]/20',
};

export function Badge({ children, variant = 'default', size = 'sm', pulse = false, className, style }: BadgeProps) {
  return (
    <span
      style={style}
      className={clsx(
        'inline-flex items-center gap-1 rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        variantStyles[variant],
        pulse && variant === 'danger' && 'animate-pulse-danger',
        pulse && variant === 'warning' && 'animate-pulse-warning',
        className
      )}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className={clsx(
            'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
            variant === 'danger' ? 'bg-[var(--danger)]' : variant === 'warning' ? 'bg-[var(--warning)]' : 'bg-[var(--primary)]'
          )} />
          <span className={clsx(
            'relative inline-flex rounded-full h-2 w-2',
            variant === 'danger' ? 'bg-[var(--danger)]' : variant === 'warning' ? 'bg-[var(--warning)]' : 'bg-[var(--primary)]'
          )} />
        </span>
      )}
      {children}
    </span>
  );
}
