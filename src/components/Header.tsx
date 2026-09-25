import { Bell, Wallet, ChevronLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { formatUsd } from '../data/mockData';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showBalance?: boolean;
  showNotifications?: boolean;
  showSearch?: boolean;
}

export default function Header({
  title,
  showBack = false,
  showBalance = true,
  showNotifications = true,
  showSearch = true,
}: HeaderProps) {
  const navigate = useNavigate();
  const { balance, unreadCount, isAuthenticated } = useApp();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-border">
      <div className="max-w-app mx-auto flex items-center justify-between h-12 px-4">
        <div className="flex items-center gap-2 min-w-0">
          {showBack ? (
            <button
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className="p-1 -ml-1 rounded hover:bg-bg transition-colors duration-150"
            >
              <ChevronLeft size={20} className="text-navy" />
            </button>
          ) : (
            <span className="text-card-heading font-extrabold text-primary tracking-tight">BETORA</span>
          )}
          {title && <h1 className="text-card-heading truncate ml-1">{title}</h1>}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {showSearch && !showBack && (
            <button
              onClick={() => navigate('/search')}
              aria-label="Search"
              className="p-1.5 rounded hover:bg-bg transition-colors duration-150"
            >
              <Search size={18} className="text-navy" />
            </button>
          )}
          {isAuthenticated ? (
            <>
              {showBalance && (
                <button
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-1.5 bg-primary-light px-2.5 h-8 rounded-full"
                  aria-label={`Wallet balance ${formatUsd(balance)}`}
                >
                  <Wallet size={13} className="text-primary" />
                  <span className="text-secondary-text font-bold text-navy">{formatUsd(balance)}</span>
                </button>
              )}
              {showNotifications && (
                <button
                  onClick={() => navigate('/notifications')}
                  aria-label="Notifications"
                  className="relative p-1.5 rounded hover:bg-bg transition-colors duration-150"
                >
                  <Bell size={18} className="text-navy" />
                  {unreadCount > 0 && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-error" />}
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                className="px-3 h-8 rounded-full border border-border text-secondary-text font-semibold text-navy transition-colors duration-150 hover:border-primary/50"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="px-3 h-8 rounded-full bg-primary text-white text-secondary-text font-semibold transition-transform duration-150 active:scale-[0.97]"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
