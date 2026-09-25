import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Plus, ArrowUpRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatUsd } from '../data/mockData';

export default function BalanceCard() {
  const navigate = useNavigate();
  const { balance, balanceHidden, toggleBalanceHidden } = useApp();

  return (
    <div className="relative rounded-card overflow-hidden bg-navy p-5 mb-5">
      {/* subtle green radial glow */}
      <div
        className="pointer-events-none absolute -top-16 -right-10 w-56 h-56 rounded-full opacity-30 blur-3xl"
        style={{ background: 'radial-gradient(circle, #16A34A 0%, transparent 70%)' }}
      />
      <div className="relative">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-secondary-text text-white/60 tracking-wide">Available Balance</span>
          <button
            onClick={toggleBalanceHidden}
            aria-label={balanceHidden ? 'Show balance' : 'Hide balance'}
            className="p-0.5 text-white/60 hover:text-white transition-colors duration-150"
          >
            {balanceHidden ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        <p className="text-page-title text-white mb-4 tabular-nums">
          {balanceHidden ? '$••••••' : formatUsd(balance)}
        </p>

        <div className="h-px bg-white/10 mb-4" />

        <div className="flex gap-2.5">
          <button
            onClick={() => navigate('/deposit')}
            className="flex-1 flex items-center justify-center gap-1.5 h-11 rounded bg-primary text-white text-button-text font-semibold transition-transform duration-150 active:scale-[0.98]"
          >
            <Plus size={16} />
            Deposit
          </button>
          <button
            onClick={() => navigate('/withdraw')}
            className="flex-1 flex items-center justify-center gap-1.5 h-11 rounded bg-white/10 border border-white/20 text-white text-button-text font-semibold transition-transform duration-150 active:scale-[0.98]"
          >
            <ArrowUpRight size={16} />
            Withdraw
          </button>
        </div>
      </div>
    </div>
  );
}
