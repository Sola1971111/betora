import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className = '', id, ...props }, ref) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-secondary-text font-medium text-text-secondary mb-1.5">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`w-full h-12 px-4 rounded border bg-white text-body text-text placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors duration-150 ${
          error ? 'border-error' : 'border-border focus:border-primary'
        } ${className}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-small-text text-error">
          {error}
        </p>
      )}
    </div>
  );
});
Input.displayName = 'Input';

export default Input;
