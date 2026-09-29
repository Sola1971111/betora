import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="mt-8 pt-5 border-t border-border">
      <div className="flex items-center gap-3 mb-3">
        <span className="flex items-center justify-center w-9 h-9 rounded-full border-2 border-navy text-navy font-extrabold text-small-text flex-shrink-0">
          18+
        </span>
        <button
          onClick={() => navigate('/responsible-gambling')}
          className="flex items-center gap-1.5 text-secondary-text font-semibold text-primary"
        >
          <ShieldCheck size={15} />
          Bet Responsibly
        </button>
      </div>

      <p className="text-micro-text text-text-secondary leading-relaxed">
        Betting should be fun, not a way to make money. Only bet what you can afford to lose, set limits, and never chase your losses. If gambling stops being enjoyable or starts affecting your finances or daily life, take a break and seek support. 18+ | Please gamble responsibly.
      </p>
    </footer>
  );
}
