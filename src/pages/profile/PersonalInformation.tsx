import Header from '../../components/Header';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { currentUser } from '../../data/mockData';
import { useApp } from '../../context/AppContext';

export default function PersonalInformation() {
  const { user } = useApp();

  return (
    <div className="min-h-screen bg-bg">
      <Header title="Personal Information" showBack showBalance={false} showNotifications={false} />
      <div className="max-w-app mx-auto px-4 py-5 space-y-4">
        <Input label="Full Name" defaultValue={user?.fullName ?? currentUser.fullName} />
        <Input label="Email" type="email" defaultValue={user?.email ?? currentUser.email} />
        <Button variant="primary" fullWidth className="mt-2">
          Save Changes
        </Button>
      </div>
    </div>
  );
}
