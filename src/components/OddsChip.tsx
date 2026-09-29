import { useEffect, useRef, useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface OddsChipProps {
  odds: number | null;
  previousOdds?: number;
  selected?: boolean;
  onClick?: () => void;
}

/** Same odds-change flash/arrow behavior as OddsButton, but renders just
 * the number — used in table layouts where the outcome label is already
 * shown once as a column header or row label, not repeated per cell. */
export default function OddsChip({ odds, previousOdds, selected = false, onClick }: OddsChipProps) {
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

  return (
    <button
      onClick={onClick}
      disabled={suspended}
      className={`relative flex-1 flex items-center justify-center h-10 rounded border overflow-hidden transition-all duration-150 active:scale-[0.96] ${
        suspended
          ? 'bg-slate-100 border-border opacity-60 pointer-events-none'
          : selected
          ? 'bg-primary border-primary text-white'
          : 'bg-white border-border text-text hover:border-primary/50'
      } ${flash === 'up' ? 'animate-[oddsFlashUp_900ms_ease-out]' : ''} ${
        flash === 'down' ? 'animate-[oddsFlashDown_900ms_ease-out]' : ''
      }`}
    >
      {suspended ? (
        <span className="text-small-text font-semibold text-text-secondary">—</span>
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
    </button>
  );
}
