import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket } from 'lucide-react';
import { useApp } from '../context/AppContext';
import BottomSheet from './BottomSheet';
import BetSlipContent from './BetSlipContent';

export default function FloatingBetSlip() {
  const { slip } = useApp();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open bet slip"
        className="fixed bottom-20 right-4 z-30 w-14 h-14 rounded-full bg-navy shadow-elevated flex items-center justify-center transition-transform duration-150 active:scale-95"
      >
        <Ticket size={22} className="text-white" />
        {slip.length > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center border-2 border-bg">
            {slip.length}
          </span>
        )}
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Bet Slip">
        <BetSlipContent
          onPlaced={() => setOpen(false)}
          onBrowse={() => {
            setOpen(false);
            navigate('/sports');
          }}
        />
      </BottomSheet>
    </>
  );
}
