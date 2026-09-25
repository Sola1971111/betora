import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate('/home'), 1400);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-6">
      <span className="text-white text-3xl font-bold tracking-tight mb-2">BETORA</span>
      <p className="text-white/70 text-secondary-text mb-10">Bet smarter. Play responsibly.</p>
      <div className="w-6 h-6 border-2 border-white/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
}
