import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import Input from '../../components/Input';
import PasswordInput from '../../components/PasswordInput';
import Button from '../../components/Button';
import { useApp } from '../../context/AppContext';

export default function SignUp() {
  const navigate = useNavigate();
  const { signup } = useApp();
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    const newErrors: Record<string, string> = {};

    const fullName = String(data.get('fullName') ?? '');
    const email = String(data.get('email') ?? '');
    const password = String(data.get('password') ?? '');

    if (!fullName) newErrors.fullName = 'Full name is required';
    if (!email) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';
    if (password !== data.get('confirmPassword')) newErrors.confirmPassword = 'Passwords do not match';
    if (!agreed) newErrors.terms = 'You must agree to the Terms & Conditions';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    const result = await signup(fullName, email, password);
    setSubmitting(false);

    if (result.success) {
      navigate('/home');
    } else {
      setErrors({ email: result.error ?? 'Unable to create account' });
    }
  };

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

      <h1 className="text-page-title-mobile sm:text-page-title mb-1">Create Account</h1>
      <p className="text-secondary-text text-text-secondary mb-6">Join Betora in a minute.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input name="fullName" label="Full Name" placeholder="John Doe" error={errors.fullName} />
        <Input name="email" type="email" label="Email" placeholder="you@example.com" error={errors.email} />
        <PasswordInput name="password" label="Password" placeholder="Create a password" error={errors.password} />
        <PasswordInput
          name="confirmPassword"
          label="Confirm Password"
          placeholder="Re-enter your password"
          error={errors.confirmPassword}
        />

        <label className="flex items-start gap-2.5 pt-1">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary/40"
          />
          <span className="text-secondary-text text-text-secondary">
            I agree to the Terms & Conditions and Privacy Policy.
          </span>
        </label>
        {errors.terms && <p className="text-small-text text-error">{errors.terms}</p>}

        <Button type="submit" variant="primary" fullWidth className="mt-2" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create Account'}
        </Button>
      </form>

      <p className="text-secondary-text text-text-secondary text-center mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-primary font-semibold">
          Log in
        </Link>
      </p>
    </div>
  );
}
