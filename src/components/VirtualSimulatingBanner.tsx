import VirtualGoalTicker from './VirtualGoalTicker';
import type { VirtualFixture } from '../types/virtual';

interface VirtualSimulatingBannerProps {
  fixtures: VirtualFixture[];
  virtualMinute: number;
}

export default function VirtualSimulatingBanner({ fixtures, virtualMinute }: VirtualSimulatingBannerProps) {
  return (
    <div className="relative rounded-card overflow-hidden bg-navy px-4 py-4 mb-3">
      <div
        className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #16A34A 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 23px, #fff 23px, #fff 24px)',
        }}
      />

      <div className="relative">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-3 h-3 rounded-full bg-white animate-[ballBounce_0.9s_ease-in-out_infinite]" />
          <p className="text-card-heading text-white">Simulating — {Math.min(90, Math.round(virtualMinute))}'</p>
        </div>
        <VirtualGoalTicker fixtures={fixtures} virtualMinute={virtualMinute} />
      </div>
    </div>
  );
}
