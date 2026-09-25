import { useState, type FormEvent } from 'react';
import { Ticket, PartyPopper } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function PromoCodeCard() {
  const { applyPromoCode } = useApp();
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    const ok = applyPromoCode(code);
    setStatus(ok ? 'success' : 'error');
    if (ok) setCode('');
  };

  if (status === 'success') {
    return (
      <div className="relative overflow-hidden rounded-card bg-navy px-4 py-3.5 animate-[fadeIn_250ms_ease-out]">
        <div
          className="pointer-events-none absolute -top-10 -left-6 w-40 h-40 rounded-full opacity-25 blur-2xl"
          style={{ background: 'radial-gradient(circle, #16A34A 0%, transparent 70%)' }}
        />
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <PartyPopper size={18} className="text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-card-heading text-white">Code Applied 🎉</p>
            <p className="text-secondary-text text-white/60">You've unlocked your promotion.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-card bg-navy px-4 py-3.5">
      <div
        className="pointer-events-none absolute -bottom-12 -right-8 w-44 h-44 rounded-full opacity-20 blur-2xl"
        style={{ background: 'radial-gradient(circle, #16A34A 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute -top-10 left-10 w-28 h-28 rounded-full opacity-10 blur-2xl"
        style={{ background: 'radial-gradient(circle, #F59E0B 0%, transparent 70%)' }}
      />
      <div className="relative">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Ticket size={15} className="text-amber" />
          <span className="text-small-text font-semibold text-white/70 tracking-wide uppercase">Promo Code</span>
        </div>
        <p className="text-card-heading text-white mb-0.5">Have a Promo Code?</p>
        <p className="text-secondary-text text-white/60 mb-3">Enter your code to unlock your offer.</p>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              if (status === 'error') setStatus('idle');
            }}
            placeholder="BETORA100"
            className="flex-1 min-w-0 h-11 px-3.5 rounded bg-white/10 border border-white/15 text-body text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors duration-150 uppercase"
          />
          <button
            type="submit"
            className="px-5 h-11 rounded bg-primary text-white text-button-text font-semibold flex-shrink-0 transition-all duration-150 active:scale-[0.97]"
          >
            Apply
          </button>
        </form>
        {status === 'error' && (
          <p className="text-small-text text-error mt-2">That code isn't valid. Try BETORA100.</p>
        )}
      </div>
    </div>
  );
}
