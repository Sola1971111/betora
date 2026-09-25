import { useParams } from 'react-router-dom';
import Header from '../../components/Header';

const content: Record<string, { title: string; body: string }> = {
  terms: {
    title: 'Terms & Conditions',
    body: 'By using Betora, you agree to bet responsibly and confirm you are 18 years or older. Full terms will be provided at launch.',
  },
  privacy: {
    title: 'Privacy Policy',
    body: 'Betora respects your privacy and only collects information needed to operate your account. Full policy will be provided at launch.',
  },
};

export default function LegalPage() {
  const { type } = useParams();
  const page = content[type ?? 'terms'] ?? content.terms;

  return (
    <div className="min-h-screen bg-bg">
      <Header title={page.title} showBack showBalance={false} showNotifications={false} />
      <div className="max-w-app mx-auto px-4 py-5">
        <p className="text-body text-text-secondary leading-relaxed">{page.body}</p>
      </div>
    </div>
  );
}
