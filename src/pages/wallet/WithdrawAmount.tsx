import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, Plus, Wallet as WalletIcon } from 'lucide-react';
import Header from '../../components/Header';
import Button from '../../components/Button';
import { useApp } from '../../context/AppContext';
import { formatUsd } from '../../data/mockData';
import { cryptoMethodMeta } from '../../data/cryptoMethods';

const quickAmounts = [25, 50, 100, 250, 500];

export default function WithdrawAmount() {
  const { method } = useParams<{ method: string }>();
  const navigate = useNavigate();
  const { balance, savedAddresses, addSavedAddress } = useApp();
  const [amount, setAmount] = useState<number | ''>(100);

  const meta = cryptoMethodMeta(method);
  const Icon = meta.icon;

  const addressesForMethod = useMemo(
    () => savedAddresses.filter((a) => a.method === meta.id),
    [savedAddresses, meta.id]
  );

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(addressesForMethod[0]?.id ?? null);
  const [addingNew, setAddingNew] = useState(addressesForMethod.length === 0);
  const [newAddress, setNewAddress] = useState('');
  const [newLabel, setNewLabel] = useState('');

  const numericAmount = typeof amount === 'number' ? amount : 0;
  const insufficientBalance = numericAmount > balance;

  const activeAddress = addingNew
    ? newAddress.trim()
    : addressesForMethod.find((a) => a.id === selectedAddressId)?.address ?? '';

  const canContinue = numericAmount > 0 && !insufficientBalance && activeAddress.length > 6;

  const handleContinue = () => {
    if (!canContinue) return;
    let addressToUse = activeAddress;
    if (addingNew) {
      const saved = addSavedAddress(meta.id, newAddress, newLabel);
      addressToUse = saved.address;
    }
    navigate(`/withdraw/${meta.id}/payment`, { state: { amount: numericAmount, address: addressToUse } });
  };

  return (
    <div className="min-h-screen bg-bg">
      <Header title={`Withdraw ${meta.shortLabel}`} showBack showBalance={false} showNotifications={false} />
      <div className="max-w-app mx-auto px-4 py-4">
        <div className="flex items-center gap-2 mb-4">
          <Icon size={18} color={meta.iconColor} />
          <span className="text-secondary-text text-text-secondary">
            Available Balance: <span className="font-semibold text-text">{formatUsd(balance)}</span>
          </span>
        </div>

        <label className="block text-secondary-text font-semibold text-text-secondary mb-1.5">Amount (USD)</label>
        <input
          type="number"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
          className="w-full h-14 px-4 rounded border border-border bg-white text-page-title-mobile font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors duration-150 mb-3"
          placeholder="$0"
        />
        {insufficientBalance && <p className="text-small-text text-error -mt-2 mb-3">Insufficient balance.</p>}

        <div className="grid grid-cols-5 gap-2 mb-5">
          {quickAmounts.map((q) => (
            <button
              key={q}
              onClick={() => setAmount(q)}
              className={`h-11 rounded border font-semibold text-secondary-text transition-colors duration-150 ${
                amount === q ? 'bg-primary-light border-primary text-primary' : 'border-border text-text-secondary'
              }`}
            >
              {`$${q}`}
            </button>
          ))}
        </div>

        <label className="block text-secondary-text font-semibold text-text-secondary mb-1.5">
          {meta.shortLabel} Wallet Address
        </label>

        {addressesForMethod.length > 0 && (
          <div className="space-y-2 mb-3">
            {addressesForMethod.map((a) => {
              const isSelected = !addingNew && selectedAddressId === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => {
                    setAddingNew(false);
                    setSelectedAddressId(a.id);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-card border text-left transition-colors duration-150 ${
                    isSelected ? 'border-primary bg-primary-light' : 'border-border bg-card'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 border border-border">
                    <WalletIcon size={14} className="text-text-secondary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-body font-medium">{a.label}</p>
                    <p className="text-small-text text-text-secondary font-mono truncate">{a.address}</p>
                  </div>
                  {isSelected && <Check size={18} className="text-primary flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

        {!addingNew && addressesForMethod.length > 0 ? (
          <button
            onClick={() => setAddingNew(true)}
            className="w-full flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-card border border-dashed border-border text-text-secondary mb-1"
          >
            <Plus size={16} />
            <span className="text-body font-medium">Use a different address</span>
          </button>
        ) : (
          <div className="mb-1">
            <input
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              placeholder={meta.addressPlaceholder}
              className="w-full h-12 px-3.5 rounded border border-border bg-white text-body font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors duration-150 mb-2"
            />
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Label (optional) — e.g. My Wallet"
              className="w-full h-11 px-3.5 rounded border border-border bg-white text-body focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors duration-150"
            />
          </div>
        )}

        <p className="text-small-text text-text-secondary mb-6 mt-1.5">
          Double-check this address. Withdrawals sent to the wrong address cannot be recovered. This address will be
          saved for future withdrawals.
        </p>

        <Button variant="primary" fullWidth onClick={handleContinue} disabled={!canContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}
