import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import OddsButton from './OddsButton';
import OddsChip from './OddsChip';
import type { Market, MarketSelection } from '../types';

interface MarketSectionProps {
  market: Market;
  matchId: string;
  defaultExpanded: boolean;
  isSelected: (marketName: string, label: string) => boolean;
  onSelect: (sel: MarketSelection) => void;
}

interface OutcomeTable {
  columns: string[]; // e.g. ["Over", "Under"] or ["Home", "Draw", "Away"]
  rows: { rowLabel: string | null; cells: (MarketSelection | undefined)[] }[];
}

/**
 * Detects markets that fit a "label shown once, odds in a grid" table
 * layout: a small, consistent set of outcome types (2-3, e.g. Over/Under
 * or Home/Draw/Away) repeating across one or more lines (e.g. Over/Under
 * at 2.5, 3.5, 4.5...). This is far more scannable than a button per line
 * repeating "Over"/"Under" every time — matches how real sportsbooks lay
 * out multi-line markets. Markets that don't fit this shape (many
 * genuinely distinct outcomes, like Exact Goals: 0/1/2/3/4/5+) fall back
 * to the outcome grid instead.
 */
function buildOutcomeTable(selections: MarketSelection[]): OutcomeTable | null {
  if (selections.length < 2) return null;
  const columns = [...new Set(selections.map((s) => s.label))];
  if (columns.length < 2 || columns.length > 3) return null;

  const hasPoints = selections.every((s) => s.point !== null && s.point !== undefined);

  if (!hasPoints) {
    // No line value — a single row, e.g. Match Result or a plain Yes/No market.
    return { columns, rows: [{ rowLabel: null, cells: columns.map((c) => selections.find((s) => s.label === c)) }] };
  }

  const points = [...new Set(selections.map((s) => s.point))].sort((a, b) => (a as number) - (b as number));
  return {
    columns,
    rows: points.map((point) => ({
      rowLabel: String(point),
      cells: columns.map((c) => selections.find((s) => s.point === point && s.label === c)),
    })),
  };
}

export default function MarketSection({ market, defaultExpanded, isSelected, onSelect }: MarketSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const isCorrectScore = market.category === 'Correct Score';
  const table = !isCorrectScore ? buildOutcomeTable(market.selections) : null;

  return (
    <div className="bg-card border border-border rounded-card overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between px-3.5 py-3"
      >
        <span className="text-card-heading">{market.name}</span>
        {expanded ? (
          <ChevronUp size={16} className="text-text-secondary flex-shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-text-secondary flex-shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-3.5 pb-3.5">
          {isCorrectScore ? (
            // Correct Score: a proper responsive grid, never tiny overflowing cards.
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
              {market.selections.map((sel) => (
                <OddsButton
                  key={sel.id}
                  label={sel.label}
                  odds={sel.odds}
                  previousOdds={sel.previousOdds}
                  selected={isSelected(market.name, sel.label)}
                  onClick={() => onSelect(sel)}
                  wrap
                />
              ))}
            </div>
          ) : table ? (
            // Table layout: outcome labels shown once as column headers
            // (with a line/point column when the market has multiple
            // lines), odds-only chips underneath — no repeated labels.
            <div>
              <div className="flex gap-1.5 mb-1">
                {table.rows.some((r) => r.rowLabel !== null) && <div className="w-12 flex-shrink-0" />}
                {table.columns.map((col) => (
                  <span key={col} className="flex-1 text-center text-micro-text font-semibold text-text-secondary truncate">
                    {col}
                  </span>
                ))}
              </div>
              <div className="space-y-1.5">
                {table.rows.map((row, i) => (
                  <div key={row.rowLabel ?? i} className="flex gap-1.5 items-center">
                    {row.rowLabel !== null && (
                      <span className="w-12 flex-shrink-0 text-small-text font-semibold text-text text-center">
                        {row.rowLabel}
                      </span>
                    )}
                    {row.cells.map((sel, ci) =>
                      sel ? (
                        <OddsChip
                          key={sel.id}
                          odds={sel.odds}
                          previousOdds={sel.previousOdds}
                          selected={isSelected(market.name, sel.label)}
                          onClick={() => onSelect(sel)}
                        />
                      ) : (
                        <div key={ci} className="flex-1 h-10 rounded border border-border bg-slate-100" />
                      )
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Doesn't fit the table shape (too many genuinely distinct
            // outcomes, e.g. Exact Goals: 0/1/2/3/4/5+) — a responsive
            // grid so long labels wrap instead of getting squeezed.
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {market.selections.map((sel) => (
                <OddsButton
                  key={sel.id}
                  label={sel.point !== null && sel.point !== undefined ? `${sel.label} ${sel.point}` : sel.label}
                  odds={sel.odds}
                  previousOdds={sel.previousOdds}
                  selected={isSelected(market.name, sel.label)}
                  onClick={() => onSelect(sel)}
                  wrap
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
