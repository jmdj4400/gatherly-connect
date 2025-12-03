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
      <GlassCard variant="elevated" className="p-6 text-center">
        <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
          <BellOff className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-2">Notifications Not Supported</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Your browser doesn't support push notifications.
        </p>
        {showSkip && (
          <Button variant="outline" onClick={onComplete} className="w-full h-12">
            Continue
          </Button>
        )}
      </GlassCard>
    );
  }

  if (permission === 'granted') {
    return (
      <GlassCard variant="elevated" className="p-6 text-center bg-success/5 border-success/20">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="h-16 w-16 rounded-2xl bg-success/20 flex items-center justify-center mx-auto mb-4 shadow-soft"
        >
          <Check className="h-8 w-8 text-success" />
        </motion.div>
        <h3 className="font-semibold text-lg mb-2 text-success">Notifications Enabled!</h3>
        <p className="text-sm text-muted-foreground mb-6">
          You'll receive updates about your groups and events.
        </p>
        <Button onClick={onComplete} variant="gradient" className="w-full h-12">
          Continue
        </Button>
      </GlassCard>
    );
  }

  if (permission === 'denied') {
    return (
      <GlassCard variant="elevated" className="p-6 text-center">
        <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
          <BellOff className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-2">Notifications Blocked</h3>
        <p className="text-sm text-muted-foreground mb-6">
          You can enable notifications later in your browser settings.
        </p>
        {showSkip && (
          <Button variant="outline" onClick={onComplete} className="w-full h-12">
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
          initial={{ y: -8 }}
          animate={{ y: 0 }}
          transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1.2, ease: 'easeInOut' }}
          className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 shadow-soft"
        >
          <Bell className="h-8 w-8 text-primary" />
        </motion.div>
        <h3 className="text-xl font-semibold mb-2">Stay in the Loop!</h3>
        <p className="text-muted-foreground">
          Get notified when your group is ready, new messages arrive, and events are starting soon.
        </p>
      </div>

      <div className="space-y-2 mb-6">
        {[
          { icon: '👥', text: 'Know when your group is formed' },
          { icon: '💬', text: 'Never miss a message' },
          { icon: '⏰', text: 'Event reminders so you\'re always on time' },
        ].map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-3 p-3.5 bg-muted/30 rounded-xl"
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-sm font-medium">{item.text}</span>
          </motion.div>
        ))}
      </div>

      <div className="space-y-3">
        <Button 
          className="w-full h-12" 
          variant="gradient"
          onClick={handleEnable}
          disabled={loading}
        >
          {loading ? 'Enabling...' : 'Enable Notifications'}
        </Button>
        {showSkip && (
          <Button 
            variant="ghost" 
            className="w-full h-11"
            onClick={onComplete}
          >
            Maybe Later
          </Button>
        )}
      </div>
    </GlassCard>
  );
}
