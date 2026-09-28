import { ShieldCheck, Clock, Phone, UserX } from 'lucide-react';
import Header from '../../components/Header';

export default function ResponsibleGambling() {
  return (
    <div className="min-h-screen bg-bg">
      <Header title="Bet Responsibly" showBack showBalance={false} />

      <div className="max-w-app mx-auto px-4 py-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={22} className="text-primary" />
          </div>
          <p className="text-secondary-text text-text-secondary">
            Betting should be entertaining, not a way to make money or escape problems. A few things to keep in
            mind.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-border rounded-card p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Clock size={16} className="text-primary" />
              <h2 className="text-card-heading">Set limits before you start</h2>
            </div>
            <p className="text-secondary-text text-text-secondary">
              Decide how much time and money you're comfortable spending before you place a bet, and stick to it —
              not after a loss you want to chase.
            </p>
          </div>

          <div className="bg-card border border-border rounded-card p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <UserX size={16} className="text-primary" />
              <h2 className="text-card-heading">Account controls</h2>
            </div>
            <p className="text-secondary-text text-text-secondary">
              Deposit limits and self-exclusion options let you control your play or take a break. These will be
              available from your Profile.
            </p>
          </div>

          <div className="bg-card border border-border rounded-card p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Phone size={16} className="text-primary" />
              <h2 className="text-card-heading">Get support</h2>
            </div>
            <p className="text-secondary-text text-text-secondary mb-1">
              If gambling stops being fun or starts affecting your life, free, confidential help is available.
            </p>
            <p className="text-secondary-text text-text-secondary">
              National Council on Problem Gambling (US): <span className="font-semibold text-text">1-800-522-4700</span>
            </p>
            <p className="text-secondary-text text-text-secondary">
              GamCare (UK): <span className="font-semibold text-text">0808 8020 133</span>
            </p>
          </div>
        </div>

        <p className="text-micro-text text-text-secondary mt-6 leading-relaxed">
          You must be 18 or older to use Betora. Betora is a demonstration product and does not hold a real
          gambling license. In a live deployment, this space would display the operator's licensing authority and
          license number.
        </p>
      </div>
    </div>
  );
}
