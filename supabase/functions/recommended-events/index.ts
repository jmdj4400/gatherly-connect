import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Interest weights for semantic similarity
const INTEREST_WEIGHTS: Record<string, number[]> = {
  music: [1, 0.5, 0, 0.3, 0.2, 0, 0.2, 0.3, 0.1, 0.4, 0.3, 0.6],
  food: [0.5, 1, 0.1, 0.3, 0.1, 0.4, 0.2, 0.1, 0.1, 0.3, 0.5, 0.4],
  sports: [0, 0.1, 1, 0.1, 0.1, 0.6, 0.8, 0.2, 0.1, 0.2, 0.3, 0.2],
  art: [0.3, 0.3, 0.1, 1, 0.2, 0.2, 0.1, 0.2, 0.4, 0.5, 0.4, 0.3],
  tech: [0.2, 0.1, 0.1, 0.2, 1, 0.1, 0.2, 0.6, 0.3, 0.3, 0.2, 0.2],
  outdoors: [0, 0.4, 0.6, 0.2, 0.1, 1, 0.5, 0.1, 0.2, 0.2, 0.6, 0.2],
  fitness: [0.2, 0.2, 0.8, 0.1, 0.2, 0.5, 1, 0.2, 0.1, 0.2, 0.3, 0.3],
  gaming: [0.3, 0.1, 0.2, 0.2, 0.6, 0.1, 0.2, 1, 0.3, 0.4, 0.1, 0.3],
  reading: [0.1, 0.1, 0.1, 0.4, 0.3, 0.2, 0.1, 0.3, 1, 0.3, 0.3, 0.1],
  movies: [0.4, 0.3, 0.2, 0.5, 0.3, 0.2, 0.2, 0.4, 0.3, 1, 0.3, 0.4],
  travel: [0.3, 0.5, 0.3, 0.4, 0.2, 0.6, 0.3, 0.1, 0.3, 0.3, 1, 0.4],
  nightlife: [0.6, 0.4, 0.2, 0.3, 0.2, 0.2, 0.3, 0.3, 0.1, 0.4, 0.4, 1],
};

// Social energy expectations by category
const CATEGORY_ENERGY: Record<string, number> = {
  nightlife: 5,
  music: 4,
  sports: 4,
  fitness: 4,
  food: 3,
  tech: 3,
  gaming: 2,
  movies: 2,
  art: 2,
  reading: 1,
  outdoors: 3,
  travel: 3,
};

function createEmbedding(interests: string[], socialEnergy: number): number[] {
  const embedding = new Array(14).fill(0);
  
  interests.forEach(interest => {
    const weights = INTEREST_WEIGHTS[interest.toLowerCase()];
    if (weights) {
      weights.forEach((w, i) => {
        embedding[i] += w;
      });
    }
  });
  
  const maxVal = Math.max(...embedding.slice(0, 12), 1);
  for (let i = 0; i < 12; i++) {
    embedding[i] /= maxVal;
  }
  
  embedding[12] = (socialEnergy || 3) / 5;
  embedding[13] = socialEnergy >= 3 ? 1 : 0;
  
  return embedding;
}

function createEventEmbedding(category: string | null): number[] {
  const embedding = new Array(14).fill(0.5);
  
  if (category) {
    const catLower = category.toLowerCase();
    const weights = INTEREST_WEIGHTS[catLower];
    if (weights) {
      weights.forEach((w, i) => {
        embedding[i] = w;
      });
    }
    
    const energy = CATEGORY_ENERGY[catLower] || 3;
    embedding[12] = energy / 5;
    embedding[13] = energy >= 3 ? 1 : 0;
  }
  
  return embedding;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;
  
  return dotProduct / denominator;
}

interface RecommendationScore {
  event_id: string;
  total_score: number;
  embedding_score: number;
  interest_score: number;
  energy_score: number;
  attendance_score: number;
  proximity_score: number;
  reasons: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user's past attendance
    const { data: pastAttendance } = await supabase
      .from('event_participants')
      .select('event_id, events(category)')
      .eq('user_id', user.id);

    const attendedCategories: Record<string, number> = {};
    pastAttendance?.forEach((p: any) => {
      const cat = p.events?.category;
      if (cat) {
        attendedCategories[cat.toLowerCase()] = (attendedCategories[cat.toLowerCase()] || 0) + 1;
      }
    });

    // Get upcoming events
    const { data: events } = await supabase
      .from('events')
      .select('*')
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true })
      .limit(50);

    if (!events || events.length === 0) {
      return new Response(JSON.stringify({ 
        recommendations: [],
        total: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate user embedding
    const userEmbedding = profile.profile_embedding as number[] || 
      createEmbedding(profile.interests || [], profile.social_energy || 3);

    const userInterests = (profile.interests || []).map((i: string) => i.toLowerCase());
    const userEnergy = profile.social_energy || 3;
    const userCity = profile.city?.toLowerCase();

    // Score each event
    const scoredEvents: RecommendationScore[] = events.map(event => {
      const reasons: string[] = [];
      
      // 1. Embedding similarity (0-40 points)
      const eventEmbedding = event.event_embedding as number[] || 
        createEventEmbedding(event.category);
      const similarity = cosineSimilarity(userEmbedding, eventEmbedding);
      const embeddingScore = ((similarity + 1) / 2) * 40;
      
      // 2. Interest overlap (0-25 points)
      let interestScore = 0;
      const eventCategory = event.category?.toLowerCase();
      if (eventCategory && userInterests.includes(eventCategory)) {
        interestScore = 25;
        reasons.push(`Matches your interest in ${event.category}`);
      } else if (eventCategory) {
        // Check related interests
        const weights = INTEREST_WEIGHTS[eventCategory];
        if (weights) {
          userInterests.forEach((interest: string) => {
            const idx = Object.keys(INTEREST_WEIGHTS).indexOf(interest);
            if (idx >= 0 && weights[idx] > 0.5) {
              interestScore = Math.max(interestScore, 15);
              reasons.push(`Related to your interest in ${interest}`);
            }
          });
        }
      }
      
      // 3. Social energy fit (0-15 points)
      const categoryEnergy = CATEGORY_ENERGY[eventCategory || ''] || 3;
      const energyDiff = Math.abs(userEnergy - categoryEnergy);
      const energyScore = Math.max(0, 15 - (energyDiff * 5));
      if (energyDiff <= 1) {
        reasons.push('Perfect for your social energy level');
      }
      
      // 4. Past attendance patterns (0-10 points)
      let attendanceScore = 0;
      if (eventCategory && attendedCategories[eventCategory]) {
        attendanceScore = Math.min(10, attendedCategories[eventCategory] * 3);
        if (attendedCategories[eventCategory] >= 2) {
          reasons.push(`You've enjoyed ${event.category} events before`);
        }
      }
      
      // 5. Proximity (0-10 points)
      let proximityScore = 5; // Default middle score
      if (userCity && event.city) {
        if (event.city.toLowerCase() === userCity) {
          proximityScore = 10;
          reasons.push('In your city');
        } else {
          proximityScore = 2;
        }
      }
      
      // Ensure at least one reason
      if (reasons.length === 0) {
        if (embeddingScore > 30) {
          reasons.push('Matches your overall vibe');
        } else {
          reasons.push('Discover something new');
        }
      }
      
      const totalScore = embeddingScore + interestScore + energyScore + attendanceScore + proximityScore;
      
      return {
        event_id: event.id,
        total_score: Math.round(totalScore),
        embedding_score: Math.round(embeddingScore),
        interest_score: Math.round(interestScore),
        energy_score: Math.round(energyScore),
        attendance_score: Math.round(attendanceScore),
        proximity_score: Math.round(proximityScore),
        reasons: reasons.slice(0, 2), // Max 2 reasons
      };
    });

    // Sort by total score
    scoredEvents.sort((a, b) => b.total_score - a.total_score);

    // Get top recommendations
    const topRecommendations = scoredEvents.slice(0, limit);
    const recommendedEventIds = topRecommendations.map(r => r.event_id);

    // Fetch full event data
    const { data: recommendedEvents } = await supabase
      .from('events')
      .select('*')
      .in('id', recommendedEventIds);

    // Merge scores with events
    const recommendations = topRecommendations.map(score => {
      const event = recommendedEvents?.find(e => e.id === score.event_id);
      return {
        ...event,
        recommendation_score: score.total_score,
        recommendation_reasons: score.reasons,
        score_breakdown: {
          embedding: score.embedding_score,
          interest: score.interest_score,
          energy: score.energy_score,
          attendance: score.attendance_score,
          proximity: score.proximity_score,
        },
      };
    });

    // Log recommendation served
    console.log(`[recommended_event_served] user=${user.id} count=${recommendations.length}`);

    return new Response(JSON.stringify({ 
      recommendations,
      total: recommendations.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Recommendation error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
