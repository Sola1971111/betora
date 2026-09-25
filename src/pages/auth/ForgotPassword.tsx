import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { MailCheck, ChevronLeft } from 'lucide-react';
import Input from '../../components/Input';
import Button from '../../components/Button';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center mb-4">
          <MailCheck size={28} className="text-primary" strokeWidth={1.75} />
        </div>
        <h1 className="text-section-heading mb-1">Check your email</h1>
        <p className="text-secondary-text text-text-secondary mb-6 max-w-[280px]">
          Check your email for instructions to reset your password.
        </p>
        <Button variant="primary" onClick={() => navigate('/login')}>
          Back to Log In
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg px-6 py-8">
      <button
        onClick={() => navigate(-1)}
        aria-label="Go back"
        className="flex items-center gap-1 -ml-2 mb-6 p-2 rounded hover:bg-slate-100 transition-colors duration-150"
      >
        <ChevronLeft size={20} className="text-navy" />
        <span className="text-body font-medium text-navy">Back</span>
      </button>

      <span className="text-card-heading font-extrabold text-primary tracking-tight mb-4 block">BETORA</span>

      <h1 className="text-page-title-mobile sm:text-page-title mb-1">Forgot Password</h1>
      <p className="text-secondary-text text-text-secondary mb-6">
        Enter your email and we'll send you a reset link.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input name="email" type="email" label="Email" placeholder="you@example.com" required />
        <Button type="submit" variant="primary" fullWidth>
          Send Reset Link
        </Button>
      </form>
    </div>
  );
}
