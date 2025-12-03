import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VibeScoreResult {
  vibe_score: number;
  target_type: 'event' | 'user';
  target_id: string;
}

interface MatrixResult {
  matrix: Array<{ user_a: string; user_b: string; score: number }>;
  best_match: { user_id: string; score: number } | null;
  participants: Array<{ user_id: string; display_name: string | null }>;
}

export function useVibeScore(eventId?: string, targetUserId?: string) {
  const [eventVibeScore, setEventVibeScore] = useState<number | null>(null);
  const [userVibeScore, setUserVibeScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (eventId) {
      fetchEventVibeScore(eventId);
    }
  }, [eventId]);

  useEffect(() => {
    if (targetUserId) {
      fetchUserVibeScore(targetUserId);
    }
  }, [targetUserId]);

  const fetchEventVibeScore = async (eventId: string) => {
    setLoading(true);
    setError(null);

    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vibe-score?action=event&event_id=${eventId}`,
        {
          headers: {
            'Authorization': `Bearer ${session.data.session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch vibe score');
      }

      const data: VibeScoreResult = await response.json();
      setEventVibeScore(data.vibe_score);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserVibeScore = async (userId: string) => {
    setLoading(true);
    setError(null);

    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vibe-score?action=user&target_user_id=${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${session.data.session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch vibe score');
      }

      const data: VibeScoreResult = await response.json();
      setUserVibeScore(data.vibe_score);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    eventVibeScore,
    userVibeScore,
    loading,
    error,
    refetchEvent: fetchEventVibeScore,
    refetchUser: fetchUserVibeScore,
  };
}

export function useCompatibilityMatrix(eventId?: string) {
  const [matrix, setMatrix] = useState<MatrixResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (eventId) {
      fetchMatrix(eventId);
    }
  }, [eventId]);

  const fetchMatrix = async (eventId: string) => {
    setLoading(true);
    setError(null);

    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vibe-score?action=matrix&event_id=${eventId}`,
        {
          headers: {
            'Authorization': `Bearer ${session.data.session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch compatibility matrix');
      }

      const data: MatrixResult = await response.json();
      setMatrix(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    matrix,
    bestMatch: matrix?.best_match,
    loading,
    error,
    refetch: fetchMatrix,
  };
}

export async function recomputeEmbedding(): Promise<boolean> {
  try {
    const session = await supabase.auth.getSession();
    if (!session.data.session) {
      return false;
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vibe-score?action=recompute`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.data.session.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.ok;
  } catch {
    return false;
  }
}
