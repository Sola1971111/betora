import { useState } from 'react';
import Header from '../../components/Header';

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
        checked ? 'bg-primary' : 'bg-border'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export default function Settings() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const rows = [
    { label: 'Push Notifications', checked: pushEnabled, onChange: setPushEnabled },
    { label: 'Email Notifications', checked: emailEnabled, onChange: setEmailEnabled },
    { label: 'SMS Notifications', checked: smsEnabled, onChange: setSmsEnabled },
    { label: 'Dark Mode', checked: darkMode, onChange: setDarkMode },
  ];

  return (
    <div className="min-h-screen bg-bg">
      <Header title="Settings" showBack showBalance={false} showNotifications={false} />
      <div className="max-w-app mx-auto px-4 py-5">
        <div className="bg-card border border-border rounded-card divide-y divide-border overflow-hidden">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between px-4 py-3.5">
              <span className="text-body font-medium">{r.label}</span>
              <Toggle checked={r.checked} onChange={r.onChange} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
