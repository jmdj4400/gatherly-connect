import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

interface Badge {
  name: string;
  description: string;
  icon: string;
  slug: string;
  awarded_at: string;
}

interface Streak {
  current_streak: number;
  longest_streak: number;
  category: string | null;
  org_id: string;
  orgs: { name: string } | null;
}

interface EngagementStats {
  attendance_count: number;
  streaks: Streak[];
  badges: Badge[];
}

export function useEngagement() {
  const { user } = useAuth();
  const [stats, setStats] = useState<EngagementStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('track-engagement', {
        body: { action: 'get_user_stats' }
      });

      if (error) {
        console.error('Error fetching engagement stats:', error);
        return;
      }

      setStats(data);
    } catch (error) {
      console.error('Error fetching engagement stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkIn = async (eventId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('track-engagement', {
        body: { action: 'check_in', event_id: eventId }
      });

      if (error) {
        console.error('Error checking in:', error);
        return { success: false, new_badges: [] };
      }

      // Refresh stats after check-in
      await fetchStats();

      return data;
    } catch (error) {
      console.error('Error checking in:', error);
      return { success: false, new_badges: [] };
    }
  };

  return {
    stats,
    loading,
    checkIn,
    refetch: fetchStats
  };
}