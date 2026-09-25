interface VirtualOddsCellProps {
  odds: number | null;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export default function VirtualOddsCell({ odds, selected = false, disabled = false, onClick }: VirtualOddsCellProps) {
  const suspended = odds === null;
  const isDisabled = disabled || suspended;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`flex-1 h-10 rounded flex items-center justify-center text-odds font-bold transition-all duration-150 active:scale-[0.95] ${
        isDisabled
          ? 'bg-slate-100 text-text-secondary/40 pointer-events-none'
          : selected
          ? 'bg-primary text-white'
          : 'bg-white border border-border text-navy hover:border-primary/50'
      }`}
    >
      {suspended ? '—' : odds.toFixed(2)}
    </button>
  );
}
