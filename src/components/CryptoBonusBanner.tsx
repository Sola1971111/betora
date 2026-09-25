import { useNavigate } from 'react-router-dom';
import { SiBitcoin, SiTether, SiEthereum } from 'react-icons/si';

export default function CryptoBonusBanner() {
  const navigate = useNavigate();

  return (
    <div className="relative rounded-card overflow-hidden bg-gradient-to-br from-navy via-navy to-[#0a2e1f] px-4 py-4">
      {/* glow dots */}
      <div
        className="pointer-events-none absolute top-3 right-24 w-2 h-2 rounded-full bg-primary/70 shadow-[0_0_12px_4px_rgba(22,163,74,0.5)]"
      />
      <div
        className="pointer-events-none absolute top-16 right-40 w-1.5 h-1.5 rounded-full bg-primary/60 shadow-[0_0_10px_3px_rgba(22,163,74,0.4)]"
      />
      <div
        className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-25 blur-3xl"
        style={{ background: 'radial-gradient(circle, #16A34A 0%, transparent 70%)' }}
      />

      {/* coin decorations */}
      <div className="pointer-events-none absolute -right-3 -bottom-3 w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center shadow-glow-green">
        <SiBitcoin size={30} className="text-navy/80" />
      </div>
      <div className="pointer-events-none absolute right-14 bottom-1 w-11 h-11 rounded-full bg-amber flex items-center justify-center opacity-95">
        <SiTether size={16} className="text-navy/70" />
      </div>
      <div className="pointer-events-none absolute right-1 top-2 w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center opacity-90">
        <SiEthereum size={13} className="text-navy/70" />
      </div>

      <div className="relative max-w-[70%]">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="text-micro-text font-bold text-primary tracking-wide uppercase">Crypto Deposit Bonus</span>
        </div>
        <p className="text-card-heading text-white leading-snug mb-3">
          Deposit with USDT, BTC or ETH — get an extra{' '}
          <span className="text-amber font-extrabold">50%</span> instantly
        </p>
        <button
          onClick={() => navigate('/deposit')}
          className="bg-primary text-white text-button-text font-semibold px-4 py-2.5 rounded-full transition-transform duration-150 active:scale-[0.97]"
        >
          Deposit Crypto
        </button>
      </div>
    </div>
  );
}
