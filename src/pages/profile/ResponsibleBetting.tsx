import { ChevronRight, Wallet2, Timer, ShieldOff, LifeBuoy } from 'lucide-react';
import Header from '../../components/Header';

const items = [
  { label: 'Deposit Limits', icon: Wallet2 },
  { label: 'Betting Limits', icon: Timer },
  { label: 'Self-Exclusion', icon: ShieldOff },
  { label: 'Support', icon: LifeBuoy },
];

export default function ResponsibleBetting() {
  return (
    <div className="min-h-screen bg-bg">
      <Header title="Responsible Betting" showBack showBalance={false} showNotifications={false} />
      <div className="max-w-app mx-auto px-4 py-5">
        <div className="bg-primary-light rounded-card p-4 mb-5">
          <p className="text-card-heading text-primary mb-1">Bet responsibly</p>
          <p className="text-secondary-text text-text-secondary">
            Sports betting should be entertainment, not a way to make money. Only bet what you can afford to lose.
          </p>
        </div>

        <div className="bg-card border border-border rounded-card divide-y divide-border overflow-hidden">
          {items.map(({ label, icon: Icon }) => (
            <button key={label} className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
              <Icon size={18} className="text-text-secondary" />
              <span className="text-body font-medium flex-1">{label}</span>
              <ChevronRight size={18} className="text-text-secondary" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
