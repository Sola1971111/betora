import { Gift } from 'lucide-react';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import { promotions } from '../../data/mockData';

export default function Promotions() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-app mx-auto px-4 py-5">
        <h1 className="text-page-title-mobile sm:text-page-title mb-4">Promotions</h1>
        {promotions.length === 0 ? (
          <EmptyState icon={Gift} heading="No promotions right now" message="Check back soon for new offers." />
        ) : (
          <div className="space-y-3">
            {promotions.map((p) => (
              <div key={p.id} className="bg-card border border-border rounded-card p-4">
                <div className="flex items-start justify-between mb-1.5">
                  <p className="text-card-heading">{p.title}</p>
                  <span className="text-small-text text-amber font-medium flex-shrink-0 ml-2">{p.expiry}</span>
                </div>
                <p className="text-secondary-text text-text-secondary mb-3">{p.description}</p>
                <Button variant="secondary">{p.cta}</Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
