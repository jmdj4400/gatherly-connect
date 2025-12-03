import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, BellOff, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  subscribeToPush,
} from '@/lib/notifications';
import { useAuth } from '@/lib/auth';

interface NotificationPermissionProps {
  onComplete?: () => void;
  showSkip?: boolean;
}

export function NotificationPermission({ onComplete, showSkip = true }: NotificationPermissionProps) {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPermission(getNotificationPermission());
  }, []);

  const handleEnable = async () => {
    setLoading(true);
    
    const result = await requestNotificationPermission();
    setPermission(result);
    
    if (result === 'granted' && user) {
      await subscribeToPush(user.id);
    }
    
    setLoading(false);
    
    if (result === 'granted' || result === 'denied') {
      onComplete?.();
    }
  };

  if (!isNotificationSupported()) {
    return (
      <GlassCard variant="subtle" className="p-6 text-center">
        <BellOff className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-semibold mb-2">Notifications Not Supported</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Your browser doesn't support push notifications.
        </p>
        {showSkip && (
          <Button variant="outline" onClick={onComplete}>
            Continue
          </Button>
        )}
      </GlassCard>
    );
  }

  if (permission === 'granted') {
    return (
      <GlassCard variant="elevated" className="p-6 text-center bg-green-500/10">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4"
        >
          <Check className="h-8 w-8 text-green-500" />
        </motion.div>
        <h3 className="font-semibold mb-2 text-green-700">Notifications Enabled!</h3>
        <p className="text-sm text-muted-foreground mb-4">
          You'll receive updates about your groups and events.
        </p>
        <Button onClick={onComplete}>
          Continue
        </Button>
      </GlassCard>
    );
  }

  if (permission === 'denied') {
    return (
      <GlassCard variant="subtle" className="p-6 text-center">
        <BellOff className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-semibold mb-2">Notifications Blocked</h3>
        <p className="text-sm text-muted-foreground mb-4">
          You can enable notifications later in your browser settings.
        </p>
        {showSkip && (
          <Button variant="outline" onClick={onComplete}>
            Continue
          </Button>
        )}
      </GlassCard>
    );
  }

  return (
    <GlassCard variant="elevated" className="p-6">
      <div className="text-center mb-6">
        <motion.div
          initial={{ y: -10 }}
          animate={{ y: 0 }}
          transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1 }}
          className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4"
        >
          <Bell className="h-8 w-8 text-primary" />
        </motion.div>
        <h3 className="text-xl font-semibold mb-2">Stay in the Loop!</h3>
        <p className="text-muted-foreground">
          Get notified when your group is ready, new messages arrive, and events are starting soon.
        </p>
      </div>

      <div className="space-y-3 mb-6">
        {[
          { icon: '👥', text: 'Know when your group is formed' },
          { icon: '💬', text: 'Never miss a message' },
          { icon: '⏰', text: 'Event reminders so you\'re always on time' },
        ].map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-sm">{item.text}</span>
          </motion.div>
        ))}
      </div>

      <div className="space-y-3">
        <Button 
          className="w-full h-12" 
          onClick={handleEnable}
          disabled={loading}
        >
          {loading ? 'Enabling...' : 'Enable Notifications'}
        </Button>
        {showSkip && (
          <Button 
            variant="ghost" 
            className="w-full"
            onClick={onComplete}
          >
            Maybe Later
          </Button>
        )}
      </div>
    </GlassCard>
  );
}
