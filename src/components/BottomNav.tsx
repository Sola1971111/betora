import { NavLink } from 'react-router-dom';
import { Home, Trophy, Gamepad2, Ticket, User } from 'lucide-react';

const navItems = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/sports', label: 'Sports', icon: Trophy },
  { to: '/virtual', label: 'Virtual', icon: Gamepad2 },
  { to: '/my-bets', label: 'My Bets', icon: Ticket },
  { to: '/profile', label: 'Profile', icon: User },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-border">
      <div className="max-w-app mx-auto grid grid-cols-5 h-16">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 transition-colors duration-150 ${
                isActive ? 'text-primary' : 'text-text-secondary'
              }`
            }
          >
            <Icon size={17} />
            <span className="text-[10px] font-medium leading-none">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
