import { useEffect, useRef, useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface OddsButtonProps {
  label: string;
  odds: number | null;
  previousOdds?: number;
  selected?: boolean;
  disabled?: boolean;
  oddsChanged?: boolean; // shows an "Odds changed" indicator (spec item 15) rather than the up/down flash
  onClick?: () => void;
}

export default function OddsButton({
  label,
  odds,
  previousOdds,
  selected = false,
  disabled = false,
  oddsChanged = false,
  onClick,
}: OddsButtonProps) {
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const prevOddsRef = useRef(odds);

  useEffect(() => {
    if (odds !== null && prevOddsRef.current !== null && prevOddsRef.current !== odds) {
      setFlash(odds > prevOddsRef.current ? 'up' : 'down');
      const t = setTimeout(() => setFlash(null), 900);
      prevOddsRef.current = odds;
      return () => clearTimeout(t);
    }
    prevOddsRef.current = odds;
  }, [odds]);

  const suspended = odds === null;
  const changed = !suspended && previousOdds !== undefined && previousOdds !== odds;
  const isUp = changed && odds > (previousOdds as number);
  const isDisabled = disabled || suspended;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`relative flex-1 min-w-[60px] flex flex-col items-center justify-center gap-0.5 h-11 rounded border overflow-hidden transition-all duration-150 active:scale-[0.96] ${
        isDisabled
          ? 'bg-slate-100 border-border opacity-60 pointer-events-none'
          : selected
          ? 'bg-primary border-primary text-white'
          : oddsChanged
          ? 'bg-amber-light border-amber text-navy'
          : 'bg-white border-border text-text hover:border-primary/50'
      } ${flash === 'up' ? 'animate-[oddsFlashUp_900ms_ease-out]' : ''} ${
        flash === 'down' ? 'animate-[oddsFlashDown_900ms_ease-out]' : ''
      }`}
    >
      <span className={`text-odds-label ${selected ? 'text-white/85' : 'text-text-secondary'}`}>{label}</span>
      {suspended ? (
        <span className="text-small-text font-semibold text-text-secondary leading-none">Suspended</span>
      ) : (
        <span className="flex items-center gap-0.5 text-odds leading-none">
          {odds.toFixed(2)}
          {changed &&
            (isUp ? (
              <ChevronUp size={11} className={selected ? 'text-white' : 'text-primary'} strokeWidth={3} />
            ) : (
              <ChevronDown size={11} className={selected ? 'text-white' : 'text-error'} strokeWidth={3} />
            ))}
        </span>
      )}
      {oddsChanged && !suspended && (
        <span className="text-[9px] font-semibold text-amber leading-none">Odds changed</span>
      )}
    </button>
  );
}
