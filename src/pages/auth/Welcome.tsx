import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-between px-6 py-10">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <span className="text-primary text-3xl font-bold tracking-tight mb-6">BETORA</span>
        <h1 className="text-page-title mb-2">Welcome to Betora</h1>
        <p className="text-body text-text-secondary max-w-[280px]">Simple sports betting, made easy.</p>
      </div>

      <div className="space-y-3">
        <Button variant="primary" fullWidth onClick={() => navigate('/login')}>
          Log In
        </Button>
        <Button variant="secondary" fullWidth onClick={() => navigate('/signup')}>
          Create Account
        </Button>
        <p className="text-small-text text-text-secondary text-center pt-3">
          Must be 18+ to bet. Bet responsibly.
        </p>
      </div>
    </div>
  );
}
