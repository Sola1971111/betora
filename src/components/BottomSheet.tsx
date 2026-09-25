import { type ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export default function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
      <div
        className="absolute inset-0 bg-navy/40 animate-[fadeIn_200ms_ease-out]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full sm:max-w-md bg-white rounded-t-card sm:rounded-card max-h-[85vh] flex flex-col animate-[slideUp_250ms_ease-out]"
      >
        <div className="flex items-center justify-between px-4 h-14 border-b border-border flex-shrink-0">
          <h2 className="text-card-heading">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded hover:bg-bg transition-colors duration-150">
            <X size={20} className="text-navy" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}
