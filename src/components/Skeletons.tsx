export function MatchCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-card p-3.5 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 w-24 bg-border rounded" />
        <div className="h-3 w-16 bg-border rounded" />
      </div>
      <div className="h-4 w-32 bg-border rounded mb-2" />
      <div className="h-4 w-28 bg-border rounded mb-3" />
      <div className="flex gap-2">
        <div className="flex-1 h-14 bg-border rounded" />
        <div className="flex-1 h-14 bg-border rounded" />
        <div className="flex-1 h-14 bg-border rounded" />
      </div>
    </div>
  );
}

export function TransactionSkeleton() {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 animate-pulse">
      <div>
        <div className="h-3.5 w-28 bg-border rounded mb-2" />
        <div className="h-3 w-20 bg-border rounded" />
      </div>
      <div className="h-4 w-16 bg-border rounded" />
    </div>
  );
}

export function WalletSkeleton() {
  return (
    <div className="bg-border/40 rounded-card p-5 animate-pulse">
      <div className="h-3 w-28 bg-border rounded mx-auto mb-2" />
      <div className="h-7 w-40 bg-border rounded mx-auto mb-4" />
      <div className="flex gap-2">
        <div className="flex-1 h-12 bg-border rounded" />
        <div className="flex-1 h-12 bg-border rounded" />
      </div>
    </div>
  );
}

export function BetCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-card p-3.5 animate-pulse">
      <div className="flex items-center justify-between mb-2">
        <div className="h-3.5 w-24 bg-border rounded" />
        <div className="h-4 w-14 bg-border rounded-full" />
      </div>
      <div className="h-3 w-20 bg-border rounded mb-2" />
      <div className="flex items-center justify-between">
        <div className="h-3 w-24 bg-border rounded" />
        <div className="h-3.5 w-28 bg-border rounded" />
      </div>
    </div>
  );
}
