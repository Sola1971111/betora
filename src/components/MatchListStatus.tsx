import { RefreshCcw, SearchX } from 'lucide-react';
import { MatchCardSkeleton } from './Skeletons';

interface MatchListStatusProps {
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  onRetry?: () => void;
  emptyMessage?: string;
  skeletonCount?: number;
}

/**
 * Renders the right state for a list of matches: skeletons while loading,
 * a retry-able error message, or an empty state. Returns null when there's
 * real content to show, so the caller just does:
 *   <MatchListStatus ... /> ?? <actual list>
 * by checking `loading || error || isEmpty` before rendering matches.
 */
export default function MatchListStatus({
  loading,
  error,
  isEmpty,
  onRetry,
  emptyMessage = 'No matches available',
  skeletonCount = 3,
}: MatchListStatusProps) {
  if (loading) {
    return (
      <div className="space-y-2.5">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <MatchCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center text-center py-10 px-4">
        <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mb-3">
          <RefreshCcw size={20} className="text-error" />
        </div>
        <p className="text-card-heading mb-1">Unable to load matches</p>
        <p className="text-secondary-text text-text-secondary mb-4">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 h-9 rounded bg-navy text-white text-button-text font-semibold transition-transform duration-150 active:scale-[0.97]"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center text-center py-10 px-4">
        <div className="w-12 h-12 rounded-full bg-bg flex items-center justify-center mb-3">
          <SearchX size={20} className="text-text-secondary" />
        </div>
        <p className="text-secondary-text text-text-secondary">{emptyMessage}</p>
      </div>
    );
  }

  return null;
}
