import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import type { IconType } from 'react-icons';

interface ProfileListItemProps {
  icon: LucideIcon | IconType;
  label: string;
  subtitle?: string;
  onClick?: () => void;
  tone?: 'default' | 'danger';
}

export function ProfileListItem({ icon: Icon, label, subtitle, onClick, tone = 'default' }: ProfileListItemProps) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
      <Icon size={18} className={tone === 'danger' ? 'text-error' : 'text-text-secondary'} />
      <div className="flex-1 min-w-0">
        <p className={`text-body font-medium truncate ${tone === 'danger' ? 'text-error' : ''}`}>{label}</p>
        {subtitle && <p className="text-small-text text-text-secondary truncate">{subtitle}</p>}
      </div>
      {tone !== 'danger' && <ChevronRight size={18} className="text-text-secondary flex-shrink-0" />}
    </button>
  );
}

interface ProfileSectionProps {
  title: string;
  children: React.ReactNode;
}

export function ProfileSection({ title, children }: ProfileSectionProps) {
  return (
    <div className="mb-5">
      <h2 className="text-small-text font-semibold text-text-secondary tracking-wide uppercase px-1 mb-2">{title}</h2>
      <div className="bg-card border border-border rounded-card divide-y divide-border overflow-hidden">{children}</div>
    </div>
  );
}
