import { useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  Wallet,
  Receipt,
  KeyRound,
  ShieldCheck,
  Bell,
  HeartHandshake,
  HelpCircle,
  FileText,
  Shield,
  LogOut,
  BadgeCheck,
} from 'lucide-react';
import { currentUser } from '../../data/mockData';
import { useApp } from '../../context/AppContext';
import BalanceCard from '../../components/BalanceCard';
import { ProfileSection, ProfileListItem } from '../../components/ProfileList';
import GuestGate from '../../components/GuestGate';

export default function Profile() {
  const navigate = useNavigate();
  const { logout, isAuthenticated, user } = useApp();

  const handleLogout = () => {
    logout();
    navigate('/home');
  };

  if (!isAuthenticated) {
    return (
      <div className="px-4 py-4">
        <GuestGate
          icon={UserIcon}
          heading="Log in to your account"
          message="Sign in to manage your balance, deposits, withdrawals, and account settings."
        />
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center flex-shrink-0">
          <span className="text-card-heading text-primary">{(user?.fullName ?? currentUser.fullName).charAt(0)}</span>
        </div>
        <div className="min-w-0 flex items-center gap-1.5">
          <p className="text-card-heading truncate">{(user?.fullName ?? currentUser.fullName).split(' ')[0]}</p>
          {currentUser.verified && <BadgeCheck size={16} className="text-primary flex-shrink-0" />}
        </div>
      </div>

      <BalanceCard />

      <ProfileSection title="Account">
        <ProfileListItem
          icon={UserIcon}
          label="Personal Information"
          subtitle="Name, email and account information"
          onClick={() => navigate('/profile/personal-information')}
        />
        <ProfileListItem
          icon={Wallet}
          label="Wallet Addresses"
          subtitle="Manage crypto withdrawal addresses"
          onClick={() => navigate('/profile/bank-accounts')}
        />
        <ProfileListItem
          icon={Receipt}
          label="Transaction History"
          subtitle="Deposits, withdrawals and bets"
          onClick={() => navigate('/profile/transactions')}
        />
      </ProfileSection>

      <ProfileSection title="Security">
        <ProfileListItem icon={KeyRound} label="Change Password" onClick={() => navigate('/profile/security')} />
        <ProfileListItem icon={ShieldCheck} label="Login & Security" onClick={() => navigate('/profile/security')} />
      </ProfileSection>

      <ProfileSection title="Preferences">
        <ProfileListItem icon={Bell} label="Notifications" onClick={() => navigate('/notifications')} />
        <ProfileListItem icon={HeartHandshake} label="Responsible Betting" onClick={() => navigate('/responsible-betting')} />
      </ProfileSection>

      <ProfileSection title="Support">
        <ProfileListItem icon={HelpCircle} label="Help & Support" onClick={() => navigate('/help-support')} />
        <ProfileListItem icon={FileText} label="Terms & Conditions" onClick={() => navigate('/terms')} />
        <ProfileListItem icon={Shield} label="Privacy Policy" onClick={() => navigate('/privacy')} />
      </ProfileSection>

      <ProfileSection title="Account">
        <ProfileListItem icon={LogOut} label="Log Out" tone="danger" onClick={handleLogout} />
      </ProfileSection>
    </div>
  );
}
