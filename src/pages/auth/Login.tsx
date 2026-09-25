import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import Input from '../../components/Input';
import PasswordInput from '../../components/PasswordInput';
import Button from '../../components/Button';
import { useApp } from '../../context/AppContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useApp();
  const [remember, setRemember] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = String(data.get('email') ?? '');
    const password = String(data.get('password') ?? '');

    setSubmitting(true);
    setError(null);
    const result = await login(email, password);
    setSubmitting(false);

    if (result.success) {
      navigate('/home');
    } else {
      setError(result.error ?? 'Unable to log in');
    }
  };

  return (
    <div className="min-h-screen bg-bg px-6 py-8 flex flex-col">
      <button
        onClick={() => navigate(-1)}
        aria-label="Go back"
        className="flex items-center gap-1 -ml-2 mb-6 p-2 rounded hover:bg-slate-100 transition-colors duration-150 self-start"
      >
        <ChevronLeft size={20} className="text-navy" />
        <span className="text-body font-medium text-navy">Back</span>
      </button>

      <span className="text-card-heading font-extrabold text-primary tracking-tight mb-4">BETORA</span>

      <h1 className="text-page-title-mobile sm:text-page-title mb-1">Log In</h1>
      <p className="text-secondary-text text-text-secondary mb-6">Welcome back to Betora.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input name="email" type="email" label="Email" placeholder="you@example.com" required />
        <PasswordInput name="password" label="Password" placeholder="Enter your password" required />

        {error && <p className="text-small-text text-error">{error}</p>}

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary/40"
            />
            <span className="text-secondary-text text-text-secondary">Remember me</span>
          </label>
          <Link to="/forgot-password" className="text-secondary-text text-primary font-medium">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" variant="primary" fullWidth className="mt-2" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log In'}
        </Button>
      </form>

      <p className="text-secondary-text text-text-secondary text-center mt-6">
        Don't have an account?{' '}
        <Link to="/signup" className="text-primary font-semibold">
          Create one
        </Link>
      </p>
    </div>
  );
}
