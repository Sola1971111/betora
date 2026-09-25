import { useEffect, useRef, useState } from 'react';
import { Ticket } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface BetSlipBarProps {
  onOpen: () => void;
}

export default function BetSlipBar({ onOpen }: BetSlipBarProps) {
  const { slip } = useApp();
  const [bump, setBump] = useState(false);
  const prevCountRef = useRef(slip.length);

  useEffect(() => {
    if (slip.length > prevCountRef.current) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 250);
      prevCountRef.current = slip.length;
      return () => clearTimeout(t);
    }
    prevCountRef.current = slip.length;
  }, [slip.length]);

  if (slip.length === 0) return null;

  const combinedOdds = slip.reduce((acc, s) => acc * s.odds, 1);

  return (
    <button
      onClick={onOpen}
      className="fixed left-0 right-0 bottom-16 z-20 flex items-center justify-between px-4 h-[52px] bg-navy text-white shadow-elevated transition-transform duration-200"
    >
      <div className="max-w-app w-full mx-auto flex items-center justify-between py-2.5">
        <div className="flex items-center gap-2.5">
          <span
            className={`relative flex items-center justify-center w-7 h-7 rounded-full bg-primary transition-transform duration-200 ${
              bump ? 'animate-[bumpIn_250ms_ease-out]' : ''
            }`}
          >
            <Ticket size={13} />
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-white text-navy text-[10px] font-bold flex items-center justify-center">
              {slip.length}
            </span>
          </span>
          <div className="text-left">
            <p className="text-secondary-text font-semibold leading-tight">Bet Slip</p>
            <p className="text-micro-text text-white/60 leading-tight">
              {slip.length} selection{slip.length > 1 ? 's' : ''} · {combinedOdds.toFixed(2)} odds
            </p>
          </div>
        </div>
        <span className="text-button-text font-bold text-primary">View Bet Slip</span>
      </div>
    </button>
  );
}
