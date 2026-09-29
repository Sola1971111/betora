import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';
import ErrorBoundary from './ErrorBoundary';

export default function AppLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-bg pb-16">
      <Header />
      <main className="max-w-app mx-auto">
        <ErrorBoundary label="This page" key={location.pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
      <BottomNav />
    </div>
  );
}