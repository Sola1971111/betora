import TeamCrest from './TeamCrest';
import OddsButton from './OddsButton';
import type { VirtualFixture, VirtualMarket } from '../types/virtual';

interface SelectedPick {
  fixtureId: string;
  marketKey: string;
  outcomeId: string;
}

interface VirtualFixtureDetailProps {
  fixture: VirtualFixture;
  selections: SelectedPick[];
  disabled: boolean;
  onToggle: (market: VirtualMarket, outcomeId: string, outcomeLabel: string, odds: number) => void;
}

export default function VirtualFixtureDetail({ fixture, selections, disabled, onToggle }: VirtualFixtureDetailProps) {
  const isSelected = (marketKey: string, outcomeId: string) =>
    selections.some((s) => s.fixtureId === fixture.id && s.marketKey === marketKey && s.outcomeId === outcomeId);

  return (
    <div className="px-4 pt-2 pb-5 max-h-[70vh] overflow-y-auto">
      <div className="flex items-center justify-center gap-4 mb-4 pb-3 border-b border-border">
        <div className="flex items-center gap-1.5">
          <TeamCrest name={fixture.homeTeam.name} logoUrl={fixture.homeTeam.logoUrl} size={20} />
          <span className="text-card-heading">{fixture.homeTeam.name}</span>
        </div>
        <span className="text-secondary-text text-text-secondary">vs</span>
        <div className="flex items-center gap-1.5">
          <span className="text-card-heading">{fixture.awayTeam.name}</span>
          <TeamCrest name={fixture.awayTeam.name} logoUrl={fixture.awayTeam.logoUrl} size={20} />
        </div>
      </div>

      <div className="space-y-4">
        {fixture.markets.map((market) => (
          <div key={market.key}>
            <h3 className="text-card-heading mb-2">{market.title}</h3>
            <div className="flex gap-1.5 flex-wrap">
              {market.outcomes.map((outcome) => (
                <OddsButton
                  key={outcome.id}
                  label={outcome.label}
                  odds={outcome.odds}
                  selected={isSelected(market.key, outcome.id)}
                  disabled={disabled}
                  onClick={() => onToggle(market, outcome.id, outcome.label, outcome.odds)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
