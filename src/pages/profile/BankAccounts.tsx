import { Plus } from 'lucide-react';
import { SiBitcoin, SiTether } from 'react-icons/si';
import Header from '../../components/Header';
import { cryptoAddresses } from '../../data/mockData';

const savedWallets = [
  { method: 'bitcoin' as const, label: 'Bitcoin (BTC)', icon: SiBitcoin, iconColor: '#F7931A', iconBg: 'bg-[#F7931A]/10' },
  { method: 'usdt' as const, label: 'Tether (USDT)', icon: SiTether, iconColor: '#26A17B', iconBg: 'bg-[#26A17B]/10' },
];

export default function BankAccounts() {
  return (
    <div className="min-h-screen bg-bg">
      <Header title="Wallet Addresses" showBack showBalance={false} showNotifications={false} />
      <div className="max-w-app mx-auto px-4 py-4 space-y-2.5">
        <p className="text-secondary-text text-text-secondary mb-1">
          Addresses used for crypto withdrawals. You'll confirm the destination address each time you withdraw.
        </p>
        {savedWallets.map((w) => {
          const Icon = w.icon;
          const address = cryptoAddresses[w.method].address;
          return (
            <div key={w.method} className="flex items-center gap-3 bg-card border border-border rounded-card px-4 py-3.5">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${w.iconBg}`}>
                <Icon size={16} color={w.iconColor} />
              </div>
              <div className="min-w-0">
                <p className="text-body font-medium">{w.label}</p>
                <p className="text-small-text text-text-secondary font-mono truncate">{address}</p>
              </div>
            </div>
          );
        })}
        <button className="w-full flex items-center gap-2 px-4 py-3.5 rounded-card border border-dashed border-border text-text-secondary">
          <Plus size={17} />
          <span className="text-body font-medium">Add wallet address</span>
        </button>
      </div>
    </div>
  );
}
