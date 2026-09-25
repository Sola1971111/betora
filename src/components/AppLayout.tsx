import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-bg pb-16">
      <Header />
      <main className="max-w-app mx-auto">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
