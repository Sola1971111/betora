import { useEffect, useState } from 'react';
import { ChevronUp, ChevronDown, Clock } from 'lucide-react';
import TeamCrest from './TeamCrest';
import VirtualOddsCell from './VirtualOddsCell';
import type { VirtualFixture, VirtualMarket, VirtualMarketKey, VirtualUpcomingPreview } from '../types/virtual';

interface MarketColumn {
  outcomeId: string;
  header: string;
}

interface SelectedPick {
  matchdayId: string;
  fixtureId: string;
  marketKey: string;
  outcomeId: string;
}

interface VirtualUpcomingAccordionProps {
  matchdays: VirtualUpcomingPreview[];
  activeTab: VirtualMarketKey;
  columns: MarketColumn[];
  selections: SelectedPick[];
  onToggle: (matchdayId: string, fixture: VirtualFixture, market: VirtualMarket, outcomeId: string, outcomeLabel: string, odds: number) => void;
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function VirtualUpcomingAccordion({
  matchdays,
  activeTab,
  columns,
  selections,
  onToggle,
}: VirtualUpcomingAccordionProps) {
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleCollapse = (round: number) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(round)) next.delete(round);
      else next.add(round);
      return next;
    });
  };

  if (matchdays.length === 0) return null;

  return (
    <div className="space-y-3">
      {matchdays.map((md) => {
        const isCollapsed = collapsed.has(md.round);
        const countdownMs = new Date(md.projectedStartAt).getTime() - now;
        return (
          <div key={md.round} className="bg-card border border-border rounded-card overflow-hidden">
            <button
              onClick={() => toggleCollapse(md.round)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 bg-bg"
            >
              <span className="text-secondary-text font-bold">Matchday #{md.round}</span>
              <span className="flex items-center gap-2">
                <span className="flex items-center gap-1 bg-amber-light px-2 py-0.5 rounded-full">
                  <Clock size={11} className="text-amber" />
                  <span className="text-micro-text font-bold text-amber">
                    starting in {formatCountdown(countdownMs)}
                  </span>
                </span>
                {isCollapsed ? (
                  <ChevronDown size={16} className="text-text-secondary" />
                ) : (
                  <ChevronUp size={16} className="text-text-secondary" />
                )}
              </span>
            </button>

            {!isCollapsed && (
              <div className="divide-y divide-border">
                {md.fixtures.map((fixture) => {
                  const market = fixture.markets.find((m) => m.key === activeTab);
                  return (
                    <div key={fixture.id} className="flex items-center gap-1.5 px-3 py-2.5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <TeamCrest name={fixture.homeTeam.name} logoUrl={fixture.homeTeam.logoUrl} size={14} />
                          <span className="text-small-text font-semibold truncate">{fixture.homeTeam.shortName}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <TeamCrest name={fixture.awayTeam.name} logoUrl={fixture.awayTeam.logoUrl} size={14} />
                          <span className="text-small-text font-semibold truncate">{fixture.awayTeam.shortName}</span>
                        </div>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0" style={{ width: columns.length * 68 }}>
                        {columns.map((col) => {
                          const outcome = market?.outcomes.find((o) => o.id === col.outcomeId);
                          const isSelected = selections.some(
                            (s) =>
                              s.matchdayId === md.matchdayId && s.fixtureId === fixture.id && s.marketKey === activeTab && s.outcomeId === col.outcomeId
                          );
                          return (
                            <VirtualOddsCell
                              key={col.outcomeId}
                              odds={outcome?.odds ?? null}
                              selected={isSelected}
                              onClick={() =>
                                market && outcome && onToggle(md.matchdayId, fixture, market, outcome.id, outcome.label, outcome.odds)
                              }
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
