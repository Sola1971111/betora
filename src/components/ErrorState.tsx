import type { LucideIcon } from 'lucide-react';
import { WifiOff, AlertTriangle, AlertCircle, TrendingUp } from 'lucide-react';
import Button from './Button';

interface ErrorStateProps {
  variant: 'network' | 'deposit-failed' | 'withdrawal-failed' | 'bet-failed' | 'odds-changed' | 'insufficient-balance';
  onPrimary?: () => void;
  onSecondary?: () => void;
}

const config: Record<
  ErrorStateProps['variant'],
  { icon: LucideIcon; heading: string; message: string; primaryLabel: string; secondaryLabel?: string }
> = {
  network: {
    icon: WifiOff,
    heading: 'No internet connection',
    message: 'Check your connection and try again.',
    primaryLabel: 'Retry',
  },
  'deposit-failed': {
    icon: AlertCircle,
    heading: 'Deposit failed',
    message: 'We could not process your deposit. Please try again.',
    primaryLabel: 'Try Again',
    secondaryLabel: 'Cancel',
  },
  'withdrawal-failed': {
    icon: AlertCircle,
    heading: 'Withdrawal failed',
    message: 'We could not process your withdrawal. Please try again.',
    primaryLabel: 'Try Again',
    secondaryLabel: 'Cancel',
  },
  'bet-failed': {
    icon: AlertCircle,
    heading: 'Bet placement failed',
    message: 'Your bet could not be placed. Please review your bet slip and try again.',
    primaryLabel: 'Review Bet',
    secondaryLabel: 'Cancel',
  },
  'odds-changed': {
    icon: TrendingUp,
    heading: 'Odds have changed',
    message: 'The odds for this selection have changed. Please review your bet slip.',
    primaryLabel: 'Review Bet',
    secondaryLabel: 'Cancel',
  },
  'insufficient-balance': {
    icon: AlertTriangle,
    heading: 'Insufficient balance',
    message: 'Your wallet balance is too low for this stake. Please deposit funds to continue.',
    primaryLabel: 'Deposit',
    secondaryLabel: 'Cancel',
  },
};

export default function ErrorState({ variant, onPrimary, onSecondary }: ErrorStateProps) {
  const { icon: Icon, heading, message, primaryLabel, secondaryLabel } = config[variant];
  return (
    <div className="flex flex-col items-center text-center px-6 py-10">
      <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mb-4">
        <Icon size={28} className="text-error" strokeWidth={1.75} />
      </div>
      <h3 className="text-card-heading mb-1">{heading}</h3>
      <p className="text-secondary-text text-text-secondary mb-5 max-w-[280px]">{message}</p>
      <div className="w-full max-w-xs space-y-2.5">
        <Button variant="primary" fullWidth onClick={onPrimary}>
          {primaryLabel}
        </Button>
        {secondaryLabel && (
          <Button variant="secondary" fullWidth onClick={onSecondary}>
            {secondaryLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
