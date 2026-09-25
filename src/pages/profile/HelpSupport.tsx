import { MessageCircle, Mail, Phone, ChevronRight } from 'lucide-react';
import Header from '../../components/Header';

const items = [
  { label: 'Live Chat', icon: MessageCircle },
  { label: 'Email Support', icon: Mail },
  { label: 'Call Us', icon: Phone },
];

const faqs = [
  { q: 'How do I place a bet?', a: 'Select an odd on any match, review your selection in the bet slip, enter a stake, and tap Place Bet.' },
  { q: 'How long do withdrawals take?', a: 'Withdrawals are typically processed within 24 hours.' },
  { q: 'How do I deposit funds?', a: 'Go to Profile, tap Deposit on your balance card, then choose Bitcoin or USDT.' },
];

export default function HelpSupport() {
  return (
    <div className="min-h-screen bg-bg">
      <Header title="Help & Support" showBack showBalance={false} showNotifications={false} />
      <div className="max-w-app mx-auto px-4 py-5">
        <div className="bg-card border border-border rounded-card divide-y divide-border overflow-hidden mb-6">
          {items.map(({ label, icon: Icon }) => (
            <button key={label} className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
              <Icon size={18} className="text-text-secondary" />
              <span className="text-body font-medium flex-1">{label}</span>
              <ChevronRight size={18} className="text-text-secondary" />
            </button>
          ))}
        </div>

        <h2 className="text-card-heading mb-2.5">Frequently Asked Questions</h2>
        <div className="space-y-2.5">
          {faqs.map((f) => (
            <div key={f.q} className="bg-card border border-border rounded-card p-3.5">
              <p className="text-body font-medium mb-1">{f.q}</p>
              <p className="text-secondary-text text-text-secondary">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
