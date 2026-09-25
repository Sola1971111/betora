import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import type { BetSelection, PlacedBet, Transaction, AppNotification, SavedWithdrawalAddress, CryptoMethod } from '../types';
import { placedBets as initialBets, transactions as initialTransactions } from '../data/mockData';
import { login as apiLogin, signup as apiSignup, type AuthUser } from '../services/authApi';
import { fetchWalletBalance, requestDeposit as apiRequestDeposit, requestWithdrawal as apiRequestWithdrawal } from '../services/walletApi';
import { fetchNotifications, markNotificationRead as apiMarkNotificationRead } from '../services/notificationsApi';

interface AppContextValue {
  // Auth (real backend accounts)
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (fullName: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;

  // Balance — backend-authoritative (server/src/users/store.ts is the single
  // source of truth). Every mutation goes through the server so nothing here
  // can ever double-apply a change locally.
  balance: number;
  balanceHidden: boolean;
  toggleBalanceHidden: () => void;
  refreshBalance: () => Promise<void>;
  // Deposits/withdrawals are now approval-gated requests, not instant
  // actions — see server/src/wallet/store.ts. requestDeposit never changes
  // balance itself; requestWithdrawal debits immediately (funds held) but
  // the request still needs admin approval to be finalized.
  requestDeposit: (amount: number, method: CryptoMethod) => Promise<{ success: boolean; error?: string }>;
  withdraw: (amount: number, method: CryptoMethod, address: string) => Promise<{ success: boolean; error?: string }>;

  // Saved withdrawal addresses
  savedAddresses: SavedWithdrawalAddress[];
  addSavedAddress: (method: CryptoMethod, address: string, label?: string) => SavedWithdrawalAddress;
  removeSavedAddress: (id: string) => void;

  // Bet slip
  slip: BetSelection[];
  addToSlip: (selection: BetSelection) => void;
  removeFromSlip: (id: string) => void;
  clearSlip: () => void;
  isInSlip: (matchId: string, marketName: string, selectionLabel: string) => boolean;
  updateSlipOdds: (matchId: string, marketName: string, selectionLabel: string, freshOdds: number) => void;
  generateBookingCode: () => string;
  loadBookingCode: (code: string) => boolean;

  // Bets
  bets: PlacedBet[];
  placeBet: (stake: number, type: 'single' | 'multiple') => PlacedBet;

  // Transactions
  transactions: Transaction[];

  // Notifications — real, backend-driven per account (server/src/notifications)
  notifications: AppNotification[];
  markNotificationRead: (id: string) => void;
  unreadCount: number;

  // Promo code
  appliedPromoCode: string | null;
  applyPromoCode: (code: string) => boolean;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

const VALID_PROMO_CODES = ['BETORA100', 'WELCOME50'];
const NOTIFICATIONS_POLL_MS = 5000;

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [balance, setBalance] = useState(0);
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedWithdrawalAddress[]>([]);
  const [slip, setSlip] = useState<BetSelection[]>([]);
  const [bets, setBets] = useState<PlacedBet[]>(initialBets);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [bookingCodes, setBookingCodes] = useState<Record<string, BetSelection[]>>({});
  const seenNotificationIds = useRef<Set<string>>(new Set());

  const login = useCallback(async (email: string, password: string) => {
    try {
      const loggedInUser = await apiLogin(email, password);
      setUser(loggedInUser);
      setBalance(loggedInUser.balance);
      setIsAuthenticated(true);
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unable to log in' };
    }
  }, []);

  const signup = useCallback(async (fullName: string, email: string, password: string) => {
    try {
      const newUser = await apiSignup(fullName, email, password);
      setUser(newUser);
      setBalance(newUser.balance);
      setIsAuthenticated(true);
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unable to create account' };
    }
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setUser(null);
    setBalance(0);
    setNotifications([]);
    seenNotificationIds.current = new Set();
  }, []);

  const toggleBalanceHidden = useCallback(() => setBalanceHidden((h) => !h), []);

  const refreshBalance = useCallback(async () => {
    if (!user) return;
    try {
      const fresh = await fetchWalletBalance(user.id);
      setBalance(fresh);
    } catch {
      // best-effort — keep showing the last known balance if this fails
    }
  }, [user]);

  // Polls this account's real notifications. Any locally-added ones (promo
  // code confirmations, which have no backend counterpart) are preserved
  // across refreshes. Whenever a genuinely new notification shows up, the
  // balance is refreshed too — a new notification is exactly the signal
  // that something (a deposit approval, a withdrawal decision, an admin
  // adjustment, a virtual win) may have changed the balance server-side.
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    let cancelled = false;

    const load = async () => {
      try {
        const fetched = await fetchNotifications(user.id);
        if (cancelled) return;
        const hasNew = fetched.some((n) => !seenNotificationIds.current.has(n.id));
        fetched.forEach((n) => seenNotificationIds.current.add(n.id));

        setNotifications((prev) => {
          const localOnly = prev.filter((n) => n.id.startsWith('local-'));
          const merged = [...localOnly, ...fetched.map((n) => ({ id: n.id, title: n.title, message: n.message, date: n.date, read: n.read }))];
          return merged.sort((a, b) => (a.date < b.date ? 1 : -1));
        });

        if (hasNew) refreshBalance();
      } catch {
        // best-effort background polling
      }
    };

    load();
    const interval = setInterval(load, NOTIFICATIONS_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isAuthenticated, user, refreshBalance]);

  // Creates a pending deposit request — balance only changes once an admin
  // approves it (see the "Deposit Successful" notification that triggers then).
  const requestDeposit = useCallback(
    async (amount: number, method: CryptoMethod) => {
      if (!user) return { success: false, error: 'Not logged in' };
      try {
        await apiRequestDeposit(user.id, user.fullName, amount, method);
        setTransactions((t) => [
          {
            id: `t-${Date.now()}`,
            type: 'deposit',
            method,
            description: `${method} Deposit — awaiting admin approval`,
            date: new Date().toISOString(),
            amount,
            status: 'pending',
          },
          ...t,
        ]);
        return { success: true };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Unable to submit deposit request' };
      }
    },
    [user]
  );

  // Creates a pending withdrawal request. The server debits the balance
  // immediately (funds held pending review) — rejecting the request later
  // returns those funds automatically, with a notification either way.
  const withdraw = useCallback(
    async (amount: number, method: CryptoMethod, address: string) => {
      if (!user) return { success: false, error: 'Not logged in' };
      try {
        const { balance: newBalance } = await apiRequestWithdrawal(user.id, user.fullName, amount, method, address);
        setBalance(newBalance);
        setTransactions((t) => [
          {
            id: `t-${Date.now()}`,
            type: 'withdrawal',
            method,
            description: `${method} Withdrawal — awaiting admin approval`,
            date: new Date().toISOString(),
            amount: -amount,
            status: 'pending',
          },
          ...t,
        ]);
        return { success: true };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Unable to submit withdrawal request' };
      }
    },
    [user]
  );

  const addSavedAddress = useCallback((method: CryptoMethod, address: string, label?: string) => {
    const trimmed = address.trim();
    const newAddress: SavedWithdrawalAddress = {
      id: `wa-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      method,
      address: trimmed,
      label: label?.trim() || `${trimmed.slice(0, 6)}...${trimmed.slice(-4)}`,
      addedAt: new Date().toISOString(),
    };
    setSavedAddresses((prev) => [...prev, newAddress]);
    return newAddress;
  }, []);

  const removeSavedAddress = useCallback((id: string) => {
    setSavedAddresses((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const isInSlip = useCallback(
    (matchId: string, marketName: string, selectionLabel: string) =>
      slip.some((s) => s.matchId === matchId && s.marketName === marketName && s.selectionLabel === selectionLabel),
    [slip]
  );

  const updateSlipOdds = useCallback(
    (matchId: string, marketName: string, selectionLabel: string, freshOdds: number) => {
      setSlip((prev) =>
        prev.map((s) => {
          if (s.matchId !== matchId || s.marketName !== marketName || s.selectionLabel !== selectionLabel) return s;
          if (s.odds === freshOdds) return s;
          return { ...s, odds: freshOdds, oddsChanged: true };
        })
      );
    },
    []
  );

  const addToSlip = useCallback((selection: BetSelection) => {
    setSlip((prev) => {
      const alreadySelected = prev.some((s) => s.id === selection.id);
      if (alreadySelected) {
        return prev.filter((s) => s.id !== selection.id);
      }
      const withoutSameMarket = prev.filter(
        (s) => !(s.matchId === selection.matchId && s.marketName === selection.marketName)
      );
      return [...withoutSameMarket, selection];
    });
  }, []);

  const removeFromSlip = useCallback((id: string) => {
    setSlip((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const clearSlip = useCallback(() => setSlip([]), []);

  const generateBookingCode = useCallback(() => {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    setBookingCodes((prev) => ({ ...prev, [code]: [...slip] }));
    return code;
  }, [slip]);

  const loadBookingCode = useCallback(
    (code: string) => {
      const normalized = code.trim().toUpperCase();
      const saved = bookingCodes[normalized];
      if (saved && saved.length > 0) {
        setSlip(saved);
        return true;
      }
      return false;
    },
    [bookingCodes]
  );

  // Real-sports bet placement remains a client-local demo simulation (per
  // the original scope: no real-money settlement engine exists for it) —
  // only Virtual Football and the wallet are backend-authoritative.
  const placeBet = useCallback(
    (stake: number, type: 'single' | 'multiple') => {
      const combinedOdds = type === 'multiple' ? slip.reduce((acc, s) => acc * s.odds, 1) : slip[0]?.odds ?? 1;
      const potentialWin = Math.round(stake * combinedOdds * 100) / 100;
      const newBet: PlacedBet = {
        id: `#BT${Math.floor(100000 + Math.random() * 900000)}`,
        type,
        selections: [...slip],
        stake,
        combinedOdds: Math.round(combinedOdds * 100) / 100,
        potentialWin,
        status: 'open',
        placedAt: new Date().toISOString(),
      };
      setBets((prev) => [newBet, ...prev]);
      setBalance((b) => b - stake);
      setTransactions((t) => [
        { id: `t-${Date.now()}`, type: 'bet', description: `Bet Placed ${newBet.id}`, date: new Date().toISOString(), amount: -stake, status: 'completed' },
        ...t,
      ]);
      setSlip([]);
      return newBet;
    },
    [slip]
  );

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    if (!id.startsWith('local-')) {
      apiMarkNotificationRead(id).catch(() => {
        // best-effort — local state is already updated
      });
    }
  }, []);

  const applyPromoCode = useCallback((code: string) => {
    const normalized = code.trim().toUpperCase();
    const isValid = VALID_PROMO_CODES.includes(normalized);
    if (isValid) {
      setAppliedPromoCode(normalized);
      setNotifications((prev) => [
        {
          id: `local-promo-${Date.now()}`,
          title: 'Promo Code Applied',
          message: `You've unlocked the ${normalized} promotion.`,
          date: new Date().toISOString(),
          read: false,
        },
        ...prev,
      ]);
    }
    return isValid;
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        signup,
        logout,
        balance,
        balanceHidden,
        toggleBalanceHidden,
        refreshBalance,
        requestDeposit,
        withdraw,
        savedAddresses,
        addSavedAddress,
        removeSavedAddress,
        slip,
        addToSlip,
        removeFromSlip,
        clearSlip,
        isInSlip,
        updateSlipOdds,
        generateBookingCode,
        loadBookingCode,
        bets,
        placeBet,
        transactions,
        notifications,
        markNotificationRead,
        unreadCount,
        appliedPromoCode,
        applyPromoCode,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
