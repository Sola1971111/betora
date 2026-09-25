import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'dark' | 'danger';
  fullWidth?: boolean;
  children: ReactNode;
}

const variantClasses: Record<string, string> = {
  primary: 'bg-primary text-white hover:bg-primary-dark active:scale-[0.98]',
  secondary: 'bg-white text-primary border border-primary hover:bg-primary-light active:scale-[0.98]',
  dark: 'bg-navy text-white hover:bg-navy/90 active:scale-[0.98]',
  danger: 'bg-error text-white hover:bg-error/90 active:scale-[0.98]',
};

export default function Button({
  variant = 'primary',
  fullWidth = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`h-12 px-5 rounded text-button-text font-semibold transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none ${
        variantClasses[variant]
      } ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
