import { NotificationPermission } from '@/components/pwa/NotificationPermission';

interface NotificationsStepProps {
  onComplete: () => void;
}

export function NotificationsStep({ onComplete }: NotificationsStepProps) {
  return (
    <div className="max-w-md mx-auto">
      <NotificationPermission onComplete={onComplete} showSkip />
    </div>
  );
}
