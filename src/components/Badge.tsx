import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'live' | 'open' | 'won' | 'lost' | 'success' | 'warning' | 'neutral';
}

const variantClasses: Record<string, string> = {
  live: 'bg-error text-white',
  open: 'bg-amber-light text-amber',
  won: 'bg-primary-light text-primary',
  lost: 'bg-slate-100 text-text-secondary',
  success: 'bg-primary-light text-primary',
  warning: 'bg-amber-light text-amber',
  neutral: 'bg-slate-100 text-text-secondary',
};

export default function Badge({ children, variant = 'neutral' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-small-text font-semibold ${variantClasses[variant]}`}>
      {variant === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-[pulseSoft_1.6s_ease-in-out_infinite]" />}
      {children}
    </span>
  );
}
