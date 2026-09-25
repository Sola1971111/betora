import { Bell } from 'lucide-react';
import Header from '../../components/Header';
import EmptyState from '../../components/EmptyState';
import { useApp } from '../../context/AppContext';

export default function Notifications() {
  const { notifications, markNotificationRead } = useApp();

  return (
    <div className="min-h-screen bg-bg">
      <Header title="Notifications" showBack showBalance={false} showNotifications={false} />
      <div className="max-w-app mx-auto px-4 py-5">
        {notifications.length === 0 ? (
          <EmptyState icon={Bell} heading="No notifications" message="You're all caught up." />
        ) : (
          <div className="space-y-2.5">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => markNotificationRead(n.id)}
                className={`w-full text-left bg-card border rounded-card p-3.5 relative ${
                  n.read ? 'border-border' : 'border-primary/40'
                }`}
              >
                {!n.read && <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary" />}
                <p className="text-body font-semibold mb-0.5 pr-4">{n.title}</p>
                <p className="text-secondary-text text-text-secondary mb-1.5 pr-4">{n.message}</p>
                <p className="text-small-text text-text-secondary">
                  {new Date(n.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
