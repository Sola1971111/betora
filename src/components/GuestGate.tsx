import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import Button from './Button';

interface GuestGateProps {
  icon: LucideIcon;
  heading: string;
  message: string;
}

export default function GuestGate({ icon: Icon, heading, message }: GuestGateProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center text-center px-6 py-14">
      <div className="w-14 h-14 rounded-full bg-primary-light flex items-center justify-center mb-4">
        <Icon size={26} className="text-primary" />
      </div>
      <p className="text-card-heading mb-1">{heading}</p>
      <p className="text-secondary-text text-text-secondary mb-6 max-w-[260px]">{message}</p>
      <div className="w-full max-w-xs space-y-2.5">
        <Button variant="primary" fullWidth onClick={() => navigate('/login')}>
          Login
        </Button>
        <Button variant="secondary" fullWidth onClick={() => navigate('/signup')}>
          Create Account
        </Button>
      </div>
    </div>
  );
}
