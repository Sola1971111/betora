import type { LucideIcon } from 'lucide-react';
import Button from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  heading: string;
  message: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export default function EmptyState({ icon: Icon, heading, message, ctaLabel, onCta }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center mb-4">
        <Icon size={28} className="text-primary" strokeWidth={1.75} />
      </div>
      <h3 className="text-card-heading mb-1">{heading}</h3>
      <p className="text-secondary-text text-text-secondary mb-5 max-w-[260px]">{message}</p>
      {ctaLabel && onCta && (
        <Button variant="primary" onClick={onCta}>
          {ctaLabel}
        </Button>
      )}
    </div>
  );
}
