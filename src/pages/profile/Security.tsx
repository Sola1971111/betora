import { ChevronRight, KeyRound, Fingerprint, ShieldCheck } from 'lucide-react';
import Header from '../../components/Header';

const items = [
  { label: 'Change Password', icon: KeyRound },
  { label: 'Two-Factor Authentication', icon: ShieldCheck },
  { label: 'Biometric Login', icon: Fingerprint },
];

export default function Security() {
  return (
    <div className="min-h-screen bg-bg">
      <Header title="Security" showBack showBalance={false} showNotifications={false} />
      <div className="max-w-app mx-auto px-4 py-5">
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
