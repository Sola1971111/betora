import { useEffect, useState } from 'react';
import { X, Ticket as TicketIcon, ArrowRight, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { formatUsd } from '../data/mockData';
import { fetchEventById } from '../services/oddsApi';
import Button from './Button';
import TeamCrest from './TeamCrest';
import BookingCodeShare from './BookingCodeShare';

const quickStakes = [5, 10, 25, 50];
const ODDS_RECHECK_INTERVAL_MS = 20000;

interface BetSlipContentProps {
  onPlaced: (betId: string, stake: number, potentialWin: number) => void;
  onBrowse: () => void;
}

export default function BetSlipContent({ onPlaced, onBrowse }: BetSlipContentProps) {
  const { slip, removeFromSlip, updateSlipOdds, placeBet, balance, generateBookingCode, loadBookingCode, isAuthenticated } =
    useApp();
  const [tab, setTab] = useState<'single' | 'multiple'>('multiple');
  const [stake, setStake] = useState<number | ''>(10);
  const [bookingInput, setBookingInput] = useState('');
  const [bookingError, setBookingError] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const navigate = useNavigate();

  // Re-validate odds for whatever's currently in the slip on an interval, so a
  // stale price is never silently carried into a placed bet (spec item 15).
  // This is a demo/MVP check — a real-money backend must re-validate odds
  // again server-side before accepting the bet.
  useEffect(() => {
    if (slip.length === 0) return;

    let cancelled = false;

    const recheck = async () => {
      const uniqueMatches = Array.from(new Map(slip.map((s) => [s.matchId, s])).values());
      const results = await Promise.allSettled(
        uniqueMatches.map((s) => (s.sport ? fetchEventById(s.sport, s.matchId) : Promise.reject()))
      );
      if (cancelled) return;

      for (const result of results) {
        if (result.status !== 'fulfilled') continue;
        const freshMatch = result.value;
        for (const market of freshMatch.markets) {
          for (const outcome of market.selections) {
            if (outcome.odds === null) continue;
            updateSlipOdds(freshMatch.id, market.name, outcome.label, outcome.odds);
          }
        }
      }
    };

    const interval = setInterval(recheck, ODDS_RECHECK_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [slip, updateSlipOdds]);

  const handleLoadBookingCode = () => {
    if (!bookingInput.trim()) return;
    const ok = loadBookingCode(bookingInput);
    setBookingError(!ok);
    if (ok) setBookingInput('');
  };

  if (generatedCode) {
    return (
      <BookingCodeShare
        code={generatedCode}
        selectionsCount={slip.length}
        onClose={() => setGeneratedCode(null)}
      />
    );
  }

  if (slip.length === 0) {
    return (
      <div className="px-4 pt-2 pb-6 flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-full bg-bg flex items-center justify-center mb-3">
          <TicketIcon size={24} className="text-text-secondary" />
        </div>
        <p className="text-card-heading mb-1">Your bet slip is empty</p>
        <p className="text-secondary-text text-text-secondary mb-5">Select an odd to add it to your bet slip.</p>

        <div className="w-full mb-5">
          <label className="block text-secondary-text font-semibold text-text-secondary mb-1.5 text-left">
            Have a Booking Code?
          </label>
          <div className="flex gap-2">
            <input
              value={bookingInput}
              onChange={(e) => {
                setBookingInput(e.target.value);
                setBookingError(false);
              }}
              placeholder="e.g. AB12CD"
              className="flex-1 min-w-0 h-11 px-3.5 rounded border border-border bg-white text-body font-semibold uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors duration-150"
            />
            <button
              onClick={handleLoadBookingCode}
              className="px-4 h-11 rounded bg-navy text-white text-button-text font-semibold flex-shrink-0 transition-transform duration-150 active:scale-[0.97]"
            >
              Load
            </button>
          </div>
          {bookingError && <p className="text-small-text text-error mt-1.5 text-left">That code isn't valid.</p>}
        </div>

        <Button variant="primary" fullWidth onClick={onBrowse}>
          <span className="flex items-center justify-center gap-1.5">
            Browse Matches
            <ArrowRight size={16} />
          </span>
        </Button>
      </div>
    );
  }

  const effectiveTab = slip.length > 1 ? tab : 'single';
  const combinedOdds =
    effectiveTab === 'multiple' ? slip.reduce((acc, s) => acc * s.odds, 1) : slip[0].odds;
  const numericStake = typeof stake === 'number' ? stake : 0;
  const potentialWin = Math.round(numericStake * combinedOdds * 100) / 100;
  const insufficientBalance = isAuthenticated && numericStake > balance;
  const hasChangedOdds = slip.some((s) => s.oddsChanged);
  const canPlace = numericStake > 0 && !insufficientBalance;

  const handlePlaceBet = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!canPlace) return;
    const bet = placeBet(numericStake, effectiveTab);
    onPlaced(bet.id, bet.stake, bet.potentialWin);
    navigate('/bet-confirmation', { state: { bet } });
  };

  const handleGetBookingCode = () => {
    const code = generateBookingCode();
    setGeneratedCode(code);
  };

  return (
    <div className="flex flex-col">
      {slip.length > 1 && (
        <div className="flex border-b border-border px-4">
          {(['single', 'multiple'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-1 py-2.5 mr-5 text-secondary-text font-bold border-b-2 transition-colors duration-150 capitalize ${
                tab === t ? 'border-primary text-primary' : 'border-transparent text-text-secondary'
              }`}
            >
              {t === 'single' ? 'Singles' : 'Multiple'}
            </button>
          ))}
        </div>
      )}

      {hasChangedOdds && (
        <div className="flex items-center gap-2 mx-4 mt-3 px-3 py-2 rounded bg-amber-light border border-amber/30">
          <AlertTriangle size={15} className="text-amber flex-shrink-0" />
          <p className="text-small-text text-navy">One or more odds have changed. Review before placing your bet.</p>
        </div>
      )}

      <div className="px-4 pt-2.5 divide-y divide-border max-h-[28vh] overflow-y-auto">
        {slip.map((s) => {
          const [homeTeam, awayTeam] = s.matchLabel.split(' vs ');
          return (
            <div key={s.id} className="py-2.5 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1 mb-0.5">
                  <TeamCrest name={homeTeam} size={14} />
                  <span className="text-secondary-text font-semibold truncate">{homeTeam}</span>
                  <span className="text-micro-text text-text-secondary">vs</span>
                  <TeamCrest name={awayTeam || ''} size={14} />
                  <span className="text-secondary-text font-semibold truncate">{awayTeam}</span>
                </div>
                <p className="text-small-text text-text-secondary">
                  {s.marketName} · <span className="font-semibold text-text">{s.selectionLabel}</span>
                </p>
                {s.oddsChanged && <p className="text-micro-text font-semibold text-amber mt-0.5">Odds changed</p>}
              </div>
              <div className="flex items-center gap-2.5 flex-shrink-0">
                <span className={`text-odds ${s.oddsChanged ? 'text-amber' : 'text-navy'}`}>{s.odds.toFixed(2)}</span>
                <button
                  onClick={() => removeFromSlip(s.id)}
                  aria-label={`Remove ${s.matchLabel} selection`}
                  className="p-1 rounded hover:bg-bg transition-colors duration-150"
                >
                  <X size={15} className="text-text-secondary" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-4 pt-2.5">
        <label className="block text-secondary-text font-semibold text-text-secondary mb-1.5">Stake</label>
        <input
          type="number"
          inputMode="numeric"
          value={stake}
          min={0}
          onChange={(e) => setStake(e.target.value === '' ? '' : Number(e.target.value))}
          className="w-full h-11 px-3.5 rounded border border-border bg-white text-body font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors duration-150"
          placeholder="$0"
        />
        <div className="flex gap-2 mt-2">
          {quickStakes.map((q) => (
            <button
              key={q}
              onClick={() => setStake(q)}
              className={`flex-1 h-8 rounded text-secondary-text font-bold border transition-colors duration-150 ${
                stake === q ? 'bg-primary-light border-primary text-primary' : 'border-border text-text-secondary hover:border-primary/50'
              }`}
            >
              {formatUsd(q)}
            </button>
          ))}
        </div>
        {insufficientBalance && (
          <p className="mt-2 text-small-text text-error">Insufficient balance. Your balance is {formatUsd(balance)}.</p>
        )}
      </div>

      <div className="px-4 pt-3 pb-4">
        <div className="flex items-center justify-between py-1.5">
          <span className="text-secondary-text text-text-secondary">Combined Odds</span>
          <span className="text-body font-bold">{combinedOdds.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between mb-3 py-1.5 border-t border-border">
          <span className="text-secondary-text text-text-secondary">Potential Win</span>
          <span className="text-balance text-primary">{formatUsd(potentialWin)}</span>
        </div>
        <Button
          variant="primary"
          fullWidth
          onClick={handlePlaceBet}
          disabled={isAuthenticated && !canPlace}
          className="text-[15px] tracking-wide shadow-elevated mb-2"
        >
          {isAuthenticated ? 'PLACE BET' : 'LOGIN TO PLACE BET'}
        </Button>
        <Button variant="secondary" fullWidth onClick={handleGetBookingCode}>
          Get Booking Code
        </Button>
      </div>
    </div>
  );
}
