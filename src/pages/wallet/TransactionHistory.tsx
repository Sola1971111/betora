import { useState } from 'react';
import { Receipt } from 'lucide-react';
import { SiBitcoin, SiTether } from 'react-icons/si';
import Header from '../../components/Header';
import EmptyState from '../../components/EmptyState';
import { useApp } from '../../context/AppContext';
import { formatUsd } from '../../data/mockData';

const tabs = ['All', 'Deposits', 'Withdrawals', 'Bets', 'Winnings'] as const;
type Tab = (typeof tabs)[number];

const typeLabels: Record<string, string> = {
  deposit: 'Deposit',
  withdrawal: 'Withdrawal',
  bet: 'Bet Placed',
  winnings: 'Bet Winnings',
  bonus: 'Bonus',
};

const tabToType: Record<Tab, string | null> = {
  All: null,
  Deposits: 'deposit',
  Withdrawals: 'withdrawal',
  Bets: 'bet',
  Winnings: 'winnings',
};

export default function TransactionHistory() {
  const { transactions } = useApp();
  const [tab, setTab] = useState<Tab>('All');

  const filtered = transactions.filter((t) => {
    const target = tabToType[tab];
    return target === null || t.type === target;
  });

  return (
    <div className="min-h-screen bg-bg">
      <Header title="Transaction History" showBack showBalance={false} showNotifications={false} />
      <div className="max-w-app mx-auto px-4 py-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1 mb-4">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-shrink-0 px-3.5 h-9 rounded-full border text-secondary-text font-semibold transition-colors duration-150 ${
                tab === t ? 'bg-primary text-white border-primary' : 'border-border text-text-secondary bg-card'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={Receipt} heading="No transactions" message="Nothing to show in this category yet." />
        ) : (
          <div className="bg-card border border-border rounded-card divide-y divide-border overflow-hidden">
            {filtered.map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3.5">
                {t.method === 'bitcoin' && (
                  <div className="w-9 h-9 rounded-full bg-[#F7931A]/10 flex items-center justify-center flex-shrink-0">
                    <SiBitcoin size={16} color="#F7931A" />
                  </div>
                )}
                {t.method === 'usdt' && (
                  <div className="w-9 h-9 rounded-full bg-[#26A17B]/10 flex items-center justify-center flex-shrink-0">
                    <SiTether size={16} color="#26A17B" />
                  </div>
                )}
                {!t.method && (
                  <div className="w-9 h-9 rounded-full bg-bg flex items-center justify-center flex-shrink-0">
                    <Receipt size={15} className="text-text-secondary" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-body font-medium truncate">{t.description || typeLabels[t.type]}</p>
                  <p className="text-small-text text-text-secondary">
                    {new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    {t.status === 'pending' && ' · Pending'}
                    {t.status === 'failed' && ' · Failed'}
                  </p>
                </div>
                <span className={`text-body font-semibold flex-shrink-0 ${t.amount >= 0 ? 'text-primary' : 'text-navy'}`}>
                  {formatUsd(t.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
