import { useState } from 'react';
import { Copy, Check, Ticket } from 'lucide-react';
import Button from './Button';

interface BookingCodeShareProps {
  code: string;
  selectionsCount: number;
  onClose: () => void;
}

export default function BookingCodeShare({ code, selectionsCount, onClose }: BookingCodeShareProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — no-op for MVP
    }
  };

  return (
    <div className="px-4 pt-2 pb-5 flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-full bg-primary-light flex items-center justify-center mb-3">
        <Ticket size={26} className="text-primary" />
      </div>
      <p className="text-card-heading mb-1">Booking Code Generated</p>
      <p className="text-secondary-text text-text-secondary mb-4">
        Share this code — anyone can load your {selectionsCount} selection{selectionsCount > 1 ? 's' : ''} into their
        own bet slip.
      </p>

      <div className="w-full bg-bg border border-border rounded-card py-4 mb-4">
        <p className="text-page-title-mobile tracking-[0.2em] text-navy font-extrabold">{code}</p>
      </div>

      <Button variant="secondary" fullWidth onClick={handleCopy} className="mb-2.5">
        {copied ? (
          <span className="flex items-center justify-center gap-1.5">
            <Check size={16} /> Copied
          </span>
        ) : (
          <span className="flex items-center justify-center gap-1.5">
            <Copy size={16} /> Copy Code
          </span>
        )}
      </Button>
      <Button variant="primary" fullWidth onClick={onClose}>
        Done
      </Button>
    </div>
  );
}
