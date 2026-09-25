import { useEffect, useState } from 'react';
import { RefreshCcw, Users, Ticket, Gamepad2, CalendarClock, UserCheck, Plus, Minus, Wallet, Check, X } from 'lucide-react';
import Badge from '../../components/Badge';
import { formatUsd } from '../../data/mockData';
import { fetchAdminVirtualBets, fetchAdminVirtualMatchdays, fetchAdminVirtualUsers } from '../../services/virtualApi';
import { fetchAdminUsers, adjustUserBalance, type AuthUser } from '../../services/authApi';
import {
  fetchAdminWalletRequests,
  approveWalletRequest,
  rejectWalletRequest,
  type WalletRequest,
} from '../../services/walletApi';
import type { VirtualBet, VirtualMatchday, VirtualUserSummary } from '../../types/virtual';

const POLL_MS = 3000;

export default function AdminVirtual() {
  const [matchdays, setMatchdays] = useState<VirtualMatchday[]>([]);
  const [bets, setBets] = useState<VirtualBet[]>([]);
  const [bettingUsers, setBettingUsers] = useState<VirtualUserSummary[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<AuthUser[]>([]);
  const [walletRequests, setWalletRequests] = useState<WalletRequest[]>([]);
  const [resolving, setResolving] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [adjustAmounts, setAdjustAmounts] = useState<Record<string, string>>({});
  const [adjusting, setAdjusting] = useState<Record<string, boolean>>({});
  const [adjustError, setAdjustError] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [md, b, bu, ru, wr] = await Promise.all([
          fetchAdminVirtualMatchdays(),
          fetchAdminVirtualBets(),
          fetchAdminVirtualUsers(),
          fetchAdminUsers(),
          fetchAdminWalletRequests(),
        ]);
        if (cancelled) return;
        setMatchdays(md);
        setBets(b);
        setBettingUsers(bu);
        setRegisteredUsers(ru);
        setWalletRequests(wr);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Unable to load admin data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const handleAdjust = async (userId: string, sign: 1 | -1) => {
    const raw = adjustAmounts[userId];
    const amount = Number(raw);
    if (!raw || !Number.isFinite(amount) || amount <= 0) {
      setAdjustError((prev) => ({ ...prev, [userId]: 'Enter a valid amount' }));
      return;
    }
    setAdjusting((prev) => ({ ...prev, [userId]: true }));
    setAdjustError((prev) => ({ ...prev, [userId]: '' }));
    try {
      const updated = await adjustUserBalance(userId, amount * sign, sign > 0 ? 'Admin credit' : 'Admin deduction');
      setRegisteredUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
      setAdjustAmounts((prev) => ({ ...prev, [userId]: '' }));
    } catch (err) {
      setAdjustError((prev) => ({ ...prev, [userId]: err instanceof Error ? err.message : 'Adjustment failed' }));
    } finally {
      setAdjusting((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleResolveRequest = async (id: string, action: 'approve' | 'reject') => {
    setResolving((prev) => ({ ...prev, [id]: true }));
    try {
      const updated = action === 'approve' ? await approveWalletRequest(id) : await rejectWalletRequest(id);
      setWalletRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
      // The user's balance/notifications changed — refresh the registered
      // users table so the new balance is visible immediately here too.
      const refreshedUsers = await fetchAdminUsers();
      setRegisteredUsers(refreshedUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to resolve request');
    } finally {
      setResolving((prev) => ({ ...prev, [id]: false }));
    }
  };

  const current = matchdays[0];
  const upcoming = matchdays.slice(1);

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-10 bg-navy px-4 py-3.5 flex items-center gap-2">
        <Gamepad2 size={18} className="text-primary" />
        <h1 className="text-card-heading text-white">Virtual Football — Admin</h1>
        {loading && <RefreshCcw size={14} className="text-white/40 ml-auto animate-spin" />}
      </header>

      <div className="max-w-3xl mx-auto px-4 py-5 space-y-6">
        {error && <p className="text-secondary-text text-error">{error}</p>}

        {/* Wallet requests — deposits/withdrawals awaiting approval */}
        <section>
          <div className="flex items-center gap-1.5 mb-2">
            <Wallet size={15} className="text-text-secondary" />
            <h2 className="text-card-heading">
              Wallet Requests ({walletRequests.filter((r) => r.status === 'pending').length} pending)
            </h2>
          </div>
          {walletRequests.length === 0 ? (
            <p className="text-secondary-text text-text-secondary">No deposit or withdrawal requests yet.</p>
          ) : (
            <div className="bg-card border border-border rounded-card divide-y divide-border overflow-hidden">
              {walletRequests.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                  <div className="min-w-0">
                    <p className="text-secondary-text font-medium truncate">
                      {r.userLabel} · {r.type === 'deposit' ? 'Deposit' : 'Withdrawal'} · {formatUsd(r.amount)} ·{' '}
                      {r.method}
                    </p>
                    {r.address && (
                      <p className="text-micro-text text-text-secondary font-mono truncate">To: {r.address}</p>
                    )}
                    <p className="text-micro-text text-text-secondary">
                      {new Date(r.requestedAt).toLocaleString()}
                    </p>
                  </div>
                  {r.status === 'pending' ? (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleResolveRequest(r.id, 'approve')}
                        disabled={resolving[r.id]}
                        aria-label="Approve"
                        className="w-8 h-8 rounded bg-primary-light text-primary flex items-center justify-center disabled:opacity-50"
                      >
                        <Check size={15} />
                      </button>
                      <button
                        onClick={() => handleResolveRequest(r.id, 'reject')}
                        disabled={resolving[r.id]}
                        aria-label="Reject"
                        className="w-8 h-8 rounded bg-error/10 text-error flex items-center justify-center disabled:opacity-50"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ) : (
                    <Badge variant={r.status === 'approved' ? 'won' : 'lost'}>{r.status.toUpperCase()}</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Registered users */}
        <section>
          <div className="flex items-center gap-1.5 mb-2">
            <UserCheck size={15} className="text-text-secondary" />
            <h2 className="text-card-heading">Registered Users ({registeredUsers.length})</h2>
          </div>
          {registeredUsers.length === 0 ? (
            <p className="text-secondary-text text-text-secondary">No accounts have signed up yet.</p>
          ) : (
            <div className="bg-card border border-border rounded-card overflow-hidden">
              <table className="w-full text-secondary-text">
                <thead className="bg-bg">
                  <tr>
                    <th className="text-left font-semibold px-3.5 py-2">Name</th>
                    <th className="text-left font-semibold px-3.5 py-2">Email</th>
                    <th className="text-right font-semibold px-3.5 py-2">Balance</th>
                    <th className="text-left font-semibold px-3.5 py-2">Adjust Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {registeredUsers.map((u) => (
                    <tr key={u.id}>
                      <td className="px-3.5 py-2.5 font-medium align-top">
                        {u.fullName}
                        <p className="text-micro-text text-text-secondary font-normal">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-3.5 py-2.5 align-top">{u.email}</td>
                      <td className="text-right px-3.5 py-2.5 font-semibold text-primary align-top">
                        {formatUsd(u.balance)}
                      </td>
                      <td className="px-3.5 py-2.5 align-top">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            inputMode="numeric"
                            value={adjustAmounts[u.id] ?? ''}
                            onChange={(e) => setAdjustAmounts((prev) => ({ ...prev, [u.id]: e.target.value }))}
                            placeholder="$0"
                            className="w-20 h-8 px-2 rounded border border-border bg-white text-secondary-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors duration-150"
                          />
                          <button
                            onClick={() => handleAdjust(u.id, 1)}
                            disabled={adjusting[u.id]}
                            aria-label={`Add balance to ${u.fullName}`}
                            className="w-8 h-8 rounded bg-primary-light text-primary flex items-center justify-center disabled:opacity-50"
                          >
                            <Plus size={14} />
                          </button>
                          <button
                            onClick={() => handleAdjust(u.id, -1)}
                            disabled={adjusting[u.id]}
                            aria-label={`Deduct balance from ${u.fullName}`}
                            className="w-8 h-8 rounded bg-error/10 text-error flex items-center justify-center disabled:opacity-50"
                          >
                            <Minus size={14} />
                          </button>
                        </div>
                        {adjustError[u.id] && <p className="text-micro-text text-error mt-1">{adjustError[u.id]}</p>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Current matchday */}
        {current && (
          <section>
            <h2 className="text-card-heading mb-2">Current Matchday — Round {current.round}</h2>
            <div className="bg-card border border-border rounded-card p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-body font-semibold">{current.fixtures.length} fixtures</p>
                <Badge variant={current.phase === 'betting' ? 'open' : current.phase === 'in_play' ? 'live' : 'won'}>
                  {current.phase.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3 text-small-text text-text-secondary">
                <div>
                  <p className="font-semibold text-text">Betting opened</p>
                  <p>{new Date(current.cycleStartedAt).toLocaleTimeString()}</p>
                </div>
                <div>
                  <p className="font-semibold text-text">Kickoff</p>
                  <p>{new Date(current.kickoffAt).toLocaleTimeString()}</p>
                </div>
                <div>
                  <p className="font-semibold text-text">Settles</p>
                  <p>{new Date(current.settleAt).toLocaleTimeString()}</p>
                </div>
              </div>
              <div className="divide-y divide-border border-t border-border">
                {current.fixtures.map((f) => (
                  <div key={f.id} className="flex items-center justify-between py-2 text-secondary-text">
                    <span>
                      {f.homeTeam.shortName} vs {f.awayTeam.shortName}
                    </span>
                    <span className="font-mono font-semibold text-primary">
                      {f.result ? `${f.result.homeScore}-${f.result.awayScore}` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Next 5 matchdays — predetermined results, visible to admin only */}
        {upcoming.length > 0 && (
          <section>
            <div className="flex items-center gap-1.5 mb-2">
              <CalendarClock size={15} className="text-text-secondary" />
              <h2 className="text-card-heading">Next {upcoming.length} Matchdays — Predetermined Scores</h2>
            </div>
            <p className="text-small-text text-text-secondary mb-3">
              These results are already decided and hidden from users until each matchday settles.
            </p>
            <div className="space-y-3">
              {upcoming.map((md) => (
                <div key={md.id} className="bg-card border border-border rounded-card p-3.5">
                  <p className="text-secondary-text font-bold mb-2">Round {md.round}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                    {md.fixtures.map((f) => (
                      <div key={f.id} className="flex items-center justify-between text-secondary-text py-0.5">
                        <span className="truncate pr-2">
                          {f.homeTeam.shortName} vs {f.awayTeam.shortName}
                        </span>
                        <span className="font-mono font-semibold text-primary flex-shrink-0">
                          {f.result ? `${f.result.homeScore}-${f.result.awayScore}` : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Betting activity by user */}
        <section>
          <div className="flex items-center gap-1.5 mb-2">
            <Users size={15} className="text-text-secondary" />
            <h2 className="text-card-heading">Betting Activity ({bettingUsers.length} users)</h2>
          </div>
          {bettingUsers.length === 0 ? (
            <p className="text-secondary-text text-text-secondary">No virtual bets placed yet.</p>
          ) : (
            <div className="bg-card border border-border rounded-card overflow-hidden">
              <table className="w-full text-secondary-text">
                <thead className="bg-bg">
                  <tr>
                    <th className="text-left font-semibold px-3.5 py-2">User</th>
                    <th className="text-right font-semibold px-3.5 py-2">Bets</th>
                    <th className="text-right font-semibold px-3.5 py-2">Staked</th>
                    <th className="text-right font-semibold px-3.5 py-2">Won</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {bettingUsers.map((u) => (
                    <tr key={u.userId}>
                      <td className="px-3.5 py-2.5">
                        <p className="font-medium">{u.userLabel}</p>
                        <p className="text-micro-text text-text-secondary">{u.userId}</p>
                      </td>
                      <td className="text-right px-3.5 py-2.5">{u.betCount}</td>
                      <td className="text-right px-3.5 py-2.5">{formatUsd(u.totalStaked)}</td>
                      <td className="text-right px-3.5 py-2.5 text-primary font-semibold">{formatUsd(u.totalWon)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* All bets */}
        <section>
          <div className="flex items-center gap-1.5 mb-2">
            <Ticket size={15} className="text-text-secondary" />
            <h2 className="text-card-heading">All Bets ({bets.length})</h2>
          </div>
          {bets.length === 0 ? (
            <p className="text-secondary-text text-text-secondary">No bets placed yet.</p>
          ) : (
            <div className="bg-card border border-border rounded-card divide-y divide-border overflow-hidden">
              {bets.map((bet) => (
                <div key={bet.id} className="flex items-center justify-between px-3.5 py-2.5">
                  <div className="min-w-0">
                    <p className="text-secondary-text font-medium truncate">
                      {bet.userLabel} · MD#{bet.matchdayRound} ·{' '}
                      {bet.type === 'multiple' ? `${bet.selections.length}-Leg Multi` : 'Single'}
                    </p>
                    {bet.selections.map((sel) => (
                      <p key={`${sel.fixtureId}-${sel.marketKey}`} className="text-micro-text text-text-secondary truncate">
                        {sel.homeTeam} vs {sel.awayTeam} · {sel.marketTitle} · {sel.outcomeLabel} ({sel.odds.toFixed(2)})
                      </p>
                    ))}
                    <p className="text-micro-text text-text-secondary">
                      {formatUsd(bet.stake)} @ {bet.combinedOdds.toFixed(2)} · {new Date(bet.placedAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <Badge variant={bet.status === 'won' ? 'won' : bet.status === 'lost' ? 'lost' : 'open'}>
                    {bet.status.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
