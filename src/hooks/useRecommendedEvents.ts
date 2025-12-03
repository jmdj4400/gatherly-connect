import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RecommendedEvent {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
  city: string | null;
  venue_name: string | null;
  address: string | null;
  starts_at: string;
  ends_at: string | null;
  recommendation_score: number;
  recommendation_reasons: string[];
  score_breakdown: {
    embedding: number;
    interest: number;
    energy: number;
    attendance: number;
    proximity: number;
  };
}

export function useRecommendedEvents(limit: number = 10) {
  const [recommendations, setRecommendations] = useState<RecommendedEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendations();
  }, [limit]);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);

    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/recommended-events?limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${session.data.session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const logClick = async (eventId: string) => {
    console.log(`[recommended_event_clicked] event=${eventId}`);
    // Could also send this to an analytics endpoint
  };

  return {
    recommendations,
    loading,
    error,
    refetch: fetchRecommendations,
    logClick,
  };
}
