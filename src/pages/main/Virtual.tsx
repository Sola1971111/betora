import { useEffect, useMemo, useRef, useState } from 'react';
import { Gamepad2, Clock, Ticket, X, ChevronRight } from 'lucide-react';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import BottomSheet from '../../components/BottomSheet';
import TeamCrest from '../../components/TeamCrest';
import VirtualOddsCell from '../../components/VirtualOddsCell';
import VirtualSimulatingBanner from '../../components/VirtualSimulatingBanner';
import VirtualFixtureDetail from '../../components/VirtualFixtureDetail';
import GuestGate from '../../components/GuestGate';
import { useApp } from '../../context/AppContext';
import { useVirtualMatchday } from '../../hooks/useVirtualMatchday';
import { placeVirtualBet, fetchVirtualBetHistory } from '../../services/virtualApi';
import { formatUsd } from '../../data/mockData';
import type { VirtualBet, VirtualFixture, VirtualMarket, VirtualMarketKey } from '../../types/virtual';

const quickStakes = [5, 10, 25, 50];

const MARKET_TABS: { key: VirtualMarketKey; label: string; columns: { outcomeId: string; header: string }[] }[] = [
  {
    key: 'h2h',
    label: '1X2',
    columns: [
      { outcomeId: 'home', header: '1' },
      { outcomeId: 'draw', header: 'X' },
      { outcomeId: 'away', header: '2' },
    ],
  },
  {
    key: 'totals',
    label: 'O/U',
    columns: [
      { outcomeId: 'over-2.5', header: 'Over 2.5' },
      { outcomeId: 'under-2.5', header: 'Under 2.5' },
    ],
  },
  {
    key: 'double_chance',
    label: 'Double Chance',
    columns: [
      { outcomeId: '1x', header: '1X' },
      { outcomeId: '12', header: '12' },
      { outcomeId: 'x2', header: 'X2' },
    ],
  },
  {
    key: 'btts',
    label: 'GG/NG',
    columns: [
      { outcomeId: 'gg', header: 'GG' },
      { outcomeId: 'ng', header: 'NG' },
    ],
  },
];

interface Selection {
  fixtureId: string;
  homeTeam: string;
  awayTeam: string;
  marketKey: string;
  marketTitle: string;
  outcomeId: string;
  outcomeLabel: string;
  odds: number;
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function Virtual() {
  const { isAuthenticated, balance, refreshBalance, user } = useApp();
  const { matchday, loading, error, secondsToKickoff, secondsElapsedInPlay, matchLengthSeconds } = useVirtualMatchday();
  const [activeTab, setActiveTab] = useState<VirtualMarketKey>('h2h');
  const [selections, setSelections] = useState<Selection[]>([]);
  const [stake, setStake] = useState<number | ''>(10);
  const [betType, setBetType] = useState<'single' | 'multiple'>('multiple');
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [betslipOpen, setBetslipOpen] = useState(false);
  const [openBetsOpen, setOpenBetsOpen] = useState(false);
  const [detailFixture, setDetailFixture] = useState<VirtualFixture | null>(null);
  const [myBets, setMyBets] = useState<VirtualBet[]>([]);
  const seenSettledBetIds = useRef<Set<string>>(new Set());
  const lastMatchdayIdRef = useRef<string | null>(null);

  const userId = user?.id ?? '';

  useEffect(() => {
    if (matchday && lastMatchdayIdRef.current && lastMatchdayIdRef.current !== matchday.id) {
      setSelections([]);
      setPlaceError(null);
      setDetailFixture(null);
    }
    if (matchday) lastMatchdayIdRef.current = matchday.id;
  }, [matchday]);

  // Poll bet history purely for display, and refresh the (backend-authoritative)
  // balance whenever a bet is first seen as settled. Crediting itself always
  // happens exactly once, server-side, at the moment the matchday settles —
  // this effect never mutates balance directly, so there's no way a page
  // revisit or a duplicate poll tick can double-apply a win.
  useEffect(() => {
    if (!isAuthenticated || !userId) return;
    let cancelled = false;

    const load = async () => {
      try {
        const bets = await fetchVirtualBetHistory(userId);
        if (cancelled) return;
        setMyBets(bets);
        const newlySettled = bets.some((bet) => bet.status !== 'pending' && !seenSettledBetIds.current.has(bet.id));
        for (const bet of bets) {
          if (bet.status !== 'pending') seenSettledBetIds.current.add(bet.id);
        }
        if (newlySettled) refreshBalance();
      } catch {
        // best-effort background polling
      }
    };

    load();
    const interval = setInterval(load, 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isAuthenticated, userId, refreshBalance]);

  const isBetting = matchday?.phase === 'betting';
  const effectiveType = selections.length > 1 ? betType : 'single';
  const numericStake = typeof stake === 'number' ? stake : 0;
  const combinedOdds = useMemo(
    () =>
      effectiveType === 'multiple'
        ? selections.reduce((acc, s) => acc * s.odds, 1)
        : selections[0]?.odds ?? 1,
    [selections, effectiveType]
  );
  const potentialWin = Math.round(numericStake * combinedOdds * 100) / 100;
  const canPlace = isBetting && selections.length > 0 && numericStake > 0 && numericStake <= balance;

  /** Toggles a pick. Tapping the same outcome again removes it; picking a
   * different outcome on a fixture already in the slip replaces that pick
   * (one selection per fixture per ticket — the same rule the real bet slip
   * and the backend both enforce). */
  const handleToggle = (fixture: VirtualFixture, market: VirtualMarket, outcomeId: string, outcomeLabel: string, odds: number) => {
    if (!isBetting) return;
    setPlaceError(null);
    setSelections((prev) => {
      const existingForFixture = prev.find((s) => s.fixtureId === fixture.id);
      if (existingForFixture && existingForFixture.marketKey === market.key && existingForFixture.outcomeId === outcomeId) {
        return prev.filter((s) => s.fixtureId !== fixture.id);
      }
      const withoutFixture = prev.filter((s) => s.fixtureId !== fixture.id);
      return [
        ...withoutFixture,
        {
          fixtureId: fixture.id,
          homeTeam: fixture.homeTeam.name,
          awayTeam: fixture.awayTeam.name,
          marketKey: market.key,
          marketTitle: market.title,
          outcomeId,
          outcomeLabel,
          odds,
        },
      ];
    });
  };

  const handlePlaceBet = async () => {
    if (!matchday || selections.length === 0 || !canPlace || !user) return;
    setPlacing(true);
    setPlaceError(null);
    try {
      await placeVirtualBet({
        userId: user.id,
        userLabel: user.fullName,
        stake: numericStake,
        picks: selections.map((s) => ({ fixtureId: s.fixtureId, marketKey: s.marketKey, outcomeId: s.outcomeId })),
      });
      // The stake was already debited server-side as part of placing the
      // bet — just re-sync the displayed balance rather than guessing.
      await refreshBalance();
      setSelections([]);
      setBetslipOpen(false);
    } catch (err) {
      setPlaceError(err instanceof Error ? err.message : 'Unable to place bet');
    } finally {
      setPlacing(false);
    }
  };

  const activeMarketDef = useMemo(() => MARKET_TABS.find((m) => m.key === activeTab)!, [activeTab]);
  const pendingBetsCount = myBets.filter((b) => b.status === 'pending').length;
  const virtualMinute = Math.min(90, (secondsElapsedInPlay / matchLengthSeconds) * 90);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <GuestGate
          icon={Gamepad2}
          heading="Log in to play Virtual Football"
          message="Create an account or log in to place bets on simulated matchdays."
        />
      </div>
    );
  }

  if (loading && !matchday) {
    return (
      <div className="min-h-screen">
        <p className="p-6 text-body text-text-secondary text-center">Loading virtual matchday…</p>
      </div>
    );
  }

  if (error || !matchday) {
    return (
      <div className="min-h-screen">
        <p className="p-6 text-body text-text-secondary text-center">{error ?? 'Unable to load the virtual matchday'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28">
      <div className="px-4 py-3.5">
        <h1 className="text-page-title-mobile sm:text-page-title mb-3">Virtual Football</h1>
        {/* Matchday banner */}
        <div className="relative rounded-card overflow-hidden bg-navy px-4 py-3 mb-3 flex items-center justify-between">
          <div>
            <p className="text-card-heading text-white">Matchday #{matchday.round}</p>
            <p className="text-micro-text text-white/50">England · EPL</p>
          </div>
          {isBetting ? (
            <span className="flex items-center gap-1 bg-primary/15 px-2.5 py-1 rounded-full">
              <Clock size={12} className="text-primary" />
              <span className="text-secondary-text font-bold text-primary">{formatCountdown(secondsToKickoff)}</span>
            </span>
          ) : matchday.phase === 'in_play' ? (
            <Badge variant="live">SIMULATING</Badge>
          ) : (
            <Badge variant="won">FULL TIME</Badge>
          )}
        </div>

        {matchday.phase === 'in_play' && (
          <VirtualSimulatingBanner fixtures={matchday.fixtures} virtualMinute={virtualMinute} />
        )}

        {isBetting && (
          <>
            {/* Market tabs */}
            <div className="flex gap-4 border-b border-border mb-1 overflow-x-auto no-scrollbar">
              {MARKET_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-shrink-0 pb-2.5 pt-1 text-secondary-text font-bold border-b-2 transition-colors duration-150 whitespace-nowrap ${
                    activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-text-secondary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Column headers */}
            <div className="flex items-center gap-1.5 py-2">
              <div className="flex-1" />
              <div className="flex gap-1.5" style={{ width: activeMarketDef.columns.length * 68 }}>
                {activeMarketDef.columns.map((col) => (
                  <span key={col.outcomeId} className="flex-1 text-center text-micro-text font-semibold text-text-secondary">
                    {col.header}
                  </span>
                ))}
              </div>
            </div>

            {/* Fixture rows */}
            <div className="divide-y divide-border bg-card border border-border rounded-card overflow-hidden">
              {matchday.fixtures.map((fixture) => {
                const market = fixture.markets.find((m) => m.key === activeTab);
                const pickedForFixture = selections.find((s) => s.fixtureId === fixture.id);
                return (
                  <div key={fixture.id} className="flex items-center gap-1.5 px-3 py-2.5">
                    <button
                      onClick={() => setDetailFixture(fixture)}
                      className="flex-1 min-w-0 text-left flex items-center gap-1"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <TeamCrest name={fixture.homeTeam.name} logoUrl={fixture.homeTeam.logoUrl} size={16} />
                          <span className="text-secondary-text font-semibold truncate">{fixture.homeTeam.shortName}</span>
                          {pickedForFixture && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <TeamCrest name={fixture.awayTeam.name} logoUrl={fixture.awayTeam.logoUrl} size={16} />
                          <span className="text-secondary-text font-semibold truncate">{fixture.awayTeam.shortName}</span>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-text-secondary flex-shrink-0" />
                    </button>
                    <div className="flex gap-1.5 flex-shrink-0" style={{ width: activeMarketDef.columns.length * 68 }}>
                      {activeMarketDef.columns.map((col) => {
                        const outcome = market?.outcomes.find((o) => o.id === col.outcomeId);
                        const isSelected =
                          selections.some(
                            (s) => s.fixtureId === fixture.id && s.marketKey === activeTab && s.outcomeId === col.outcomeId
                          );
                        return (
                          <VirtualOddsCell
                            key={col.outcomeId}
                            odds={outcome?.odds ?? null}
                            selected={isSelected}
                            disabled={!isBetting}
                            onClick={() =>
                              market && outcome && handleToggle(fixture, market, outcome.id, outcome.label, outcome.odds)
                            }
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Local bottom bar: Open Bets / Betslip */}
      <div className="fixed bottom-16 left-0 right-0 z-20 grid grid-cols-2 h-12 border-t border-border">
        <button
          onClick={() => setOpenBetsOpen(true)}
          className="flex items-center justify-center gap-1.5 bg-navy text-white text-button-text font-semibold"
        >
          <Ticket size={15} />
          Open Bets{pendingBetsCount > 0 ? ` (${pendingBetsCount})` : ''}
        </button>
        <button
          onClick={() => setBetslipOpen(true)}
          className="flex items-center justify-center gap-1.5 bg-primary text-white text-button-text font-semibold relative"
        >
          Betslip{selections.length > 0 ? ` (${selections.length})` : ''}
        </button>
      </div>

      {/* Fixture detail sheet — every market including Correct Score */}
      <BottomSheet
        open={!!detailFixture}
        onClose={() => setDetailFixture(null)}
        title={detailFixture ? `${detailFixture.homeTeam.shortName} vs ${detailFixture.awayTeam.shortName}` : undefined}
      >
        {detailFixture && (
          <VirtualFixtureDetail
            fixture={detailFixture}
            selections={selections}
            disabled={!isBetting}
            onToggle={(market, outcomeId, outcomeLabel, odds) => handleToggle(detailFixture, market, outcomeId, outcomeLabel, odds)}
          />
        )}
      </BottomSheet>

      {/* Betslip sheet */}
      <BottomSheet open={betslipOpen} onClose={() => setBetslipOpen(false)} title="Betslip">
        {selections.length === 0 ? (
          <div className="px-4 pt-2 pb-6 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-bg flex items-center justify-center mb-3">
              <Ticket size={24} className="text-text-secondary" />
            </div>
            <p className="text-card-heading mb-1">No selections yet</p>
            <p className="text-secondary-text text-text-secondary">Tap an odd on the matchday board to add it here.</p>
          </div>
        ) : (
          <div className="px-4 pt-2 pb-5">
            {selections.length > 1 && (
              <div className="flex border-b border-border mb-3">
                {(['multiple', 'single'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setBetType(t)}
                    className={`px-1 py-2 mr-5 text-secondary-text font-bold border-b-2 transition-colors duration-150 capitalize ${
                      betType === t ? 'border-primary text-primary' : 'border-transparent text-text-secondary'
                    }`}
                  >
                    {t === 'multiple' ? 'Multiple' : 'Singles'}
                  </button>
                ))}
              </div>
            )}

            <div className="divide-y divide-border max-h-[26vh] overflow-y-auto mb-3">
              {selections.map((s) => (
                <div key={`${s.fixtureId}-${s.marketKey}`} className="py-2.5 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-secondary-text font-semibold truncate">
                      {s.homeTeam} vs {s.awayTeam}
                    </p>
                    <p className="text-small-text text-text-secondary">
                      {s.marketTitle} · <span className="font-semibold text-text">{s.outcomeLabel}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-odds text-navy">{s.odds.toFixed(2)}</span>
                    <button
                      onClick={() => setSelections((prev) => prev.filter((x) => x.fixtureId !== s.fixtureId))}
                      aria-label="Remove selection"
                      className="p-1 rounded hover:bg-bg transition-colors duration-150"
                    >
                      <X size={15} className="text-text-secondary" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <label className="block text-secondary-text font-semibold text-text-secondary mb-1.5">Stake</label>
            <input
              type="number"
              inputMode="numeric"
              value={stake}
              onChange={(e) => setStake(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full h-11 px-3.5 rounded border border-border bg-white text-body font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors duration-150 mb-2"
              placeholder="$0"
            />
            <div className="flex gap-2 mb-3">
              {quickStakes.map((q) => (
                <button
                  key={q}
                  onClick={() => setStake(q)}
                  className={`flex-1 h-9 rounded text-secondary-text font-bold border transition-colors duration-150 ${
                    stake === q ? 'bg-primary-light border-primary text-primary' : 'border-border text-text-secondary'
                  }`}
                >
                  {`$${q}`}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between py-1.5">
              <span className="text-secondary-text text-text-secondary">Combined Odds</span>
              <span className="text-body font-bold">{combinedOdds.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 mb-1 border-t border-border">
              <span className="text-secondary-text text-text-secondary">Potential Win</span>
              <span className="text-balance text-primary">{formatUsd(potentialWin)}</span>
            </div>

            {numericStake > balance && <p className="text-small-text text-error mb-2">Insufficient balance.</p>}
            {!isBetting && <p className="text-small-text text-error mb-2">Betting is closed for this matchday.</p>}
            {placeError && <p className="text-small-text text-error mb-2">{placeError}</p>}

            <Button variant="primary" fullWidth onClick={handlePlaceBet} disabled={!canPlace || placing}>
              {placing ? 'Placing…' : 'PLACE BET'}
            </Button>
          </div>
        )}
      </BottomSheet>

      {/* Open Bets sheet */}
      <BottomSheet open={openBetsOpen} onClose={() => setOpenBetsOpen(false)} title="Open Bets">
        {myBets.length === 0 ? (
          <p className="px-4 pt-2 pb-6 text-secondary-text text-text-secondary text-center">
            You haven't placed any virtual bets yet.
          </p>
        ) : (
          <div className="px-4 pt-2 pb-5 divide-y divide-border max-h-[50vh] overflow-y-auto">
            {myBets.map((bet) => (
              <div key={bet.id} className="py-2.5">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-secondary-text font-bold">
                    MD#{bet.matchdayRound} · {bet.type === 'multiple' ? `${bet.selections.length}-Leg Multi` : 'Single'}
                  </p>
                  <Badge variant={bet.status === 'won' ? 'won' : bet.status === 'lost' ? 'lost' : 'open'}>
                    {bet.status.toUpperCase()}
                  </Badge>
                </div>
                {bet.selections.map((sel) => (
                  <p key={`${sel.fixtureId}-${sel.marketKey}`} className="text-micro-text text-text-secondary">
                    {sel.homeTeam} vs {sel.awayTeam} · {sel.marketTitle} · {sel.outcomeLabel} ({sel.odds.toFixed(2)})
                  </p>
                ))}
                <p className="text-small-text text-text-secondary mt-1">
                  {formatUsd(bet.stake)} @ {bet.combinedOdds.toFixed(2)} → win {formatUsd(bet.potentialWin)}
                </p>
              </div>
            ))}
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
