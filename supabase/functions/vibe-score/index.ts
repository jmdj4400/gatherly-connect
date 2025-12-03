import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Interest categories with semantic weights
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

const INTEREST_KEYS = Object.keys(INTEREST_WEIGHTS);

// Convert interests array to embedding vector
function createEmbedding(interests: string[], socialEnergy: number): number[] {
  const embedding = new Array(14).fill(0);
  
  // Interest components (12 dimensions)
  interests.forEach(interest => {
    const weights = INTEREST_WEIGHTS[interest.toLowerCase()];
    if (weights) {
      weights.forEach((w, i) => {
        embedding[i] += w;
      });
    }
  });
  
  // Normalize interest components
  const maxVal = Math.max(...embedding.slice(0, 12), 1);
  for (let i = 0; i < 12; i++) {
    embedding[i] /= maxVal;
  }
  
  // Social energy components (2 dimensions)
  embedding[12] = (socialEnergy || 3) / 5;
  embedding[13] = socialEnergy >= 3 ? 1 : 0;
  
  return embedding;
}

// Create event embedding from category and description
function createEventEmbedding(category: string | null, description: string | null): number[] {
  const embedding = new Array(14).fill(0.5);
  
  if (category) {
    const catLower = category.toLowerCase();
    const weights = INTEREST_WEIGHTS[catLower];
    if (weights) {
      weights.forEach((w, i) => {
        embedding[i] = w;
      });
    }
    
    // Map categories to social energy expectations
    const highEnergyCats = ['nightlife', 'music', 'sports', 'fitness'];
    const lowEnergyCats = ['reading', 'art', 'movies'];
    
    if (highEnergyCats.includes(catLower)) {
      embedding[12] = 0.8;
      embedding[13] = 1;
    } else if (lowEnergyCats.includes(catLower)) {
      embedding[12] = 0.4;
      embedding[13] = 0;
    }
  }
  
  return embedding;
}

// Cosine similarity between two vectors
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

// Convert similarity to percentage score
function similarityToScore(similarity: number): number {
  // Map [-1, 1] to [0, 100] with bias towards higher scores
  const normalized = (similarity + 1) / 2;
  const score = Math.round(normalized * 100);
  return Math.min(100, Math.max(0, score));
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

    // Get current user
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
    const action = url.searchParams.get('action');
    const eventId = url.searchParams.get('event_id');
    const targetUserId = url.searchParams.get('target_user_id');

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

    // Ensure user has embedding
    let userEmbedding = profile.profile_embedding as number[] | null;
    if (!userEmbedding) {
      userEmbedding = createEmbedding(profile.interests || [], profile.social_energy || 3);
      await supabase
        .from('profiles')
        .update({ 
          profile_embedding: userEmbedding,
          embedding_updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
    }

    // Handle different actions
    if (action === 'event' && eventId) {
      // Get event vibe score
      const { data: event } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (!event) {
        return new Response(JSON.stringify({ error: 'Event not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Ensure event has embedding
      let eventEmbedding = event.event_embedding as number[] | null;
      if (!eventEmbedding) {
        eventEmbedding = createEventEmbedding(event.category, event.description);
        await supabase
          .from('events')
          .update({ 
            event_embedding: eventEmbedding,
            embedding_updated_at: new Date().toISOString()
          })
          .eq('id', eventId);
      }

      const similarity = cosineSimilarity(userEmbedding, eventEmbedding);
      const score = similarityToScore(similarity);

      // Cache the score
      await supabase
        .from('vibe_scores')
        .upsert({
          user_id: user.id,
          target_type: 'event',
          target_id: eventId,
          score,
          computed_at: new Date().toISOString()
        }, { onConflict: 'user_id,target_type,target_id' });

      return new Response(JSON.stringify({ 
        vibe_score: score,
        target_type: 'event',
        target_id: eventId
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'user' && targetUserId) {
      // Get user-to-user vibe score
      const { data: targetProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();

      if (!targetProfile) {
        return new Response(JSON.stringify({ error: 'Target user not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let targetEmbedding = targetProfile.profile_embedding as number[] | null;
      if (!targetEmbedding) {
        targetEmbedding = createEmbedding(targetProfile.interests || [], targetProfile.social_energy || 3);
        await supabase
          .from('profiles')
          .update({ 
            profile_embedding: targetEmbedding,
            embedding_updated_at: new Date().toISOString()
          })
          .eq('id', targetUserId);
      }

      const similarity = cosineSimilarity(userEmbedding, targetEmbedding);
      const score = similarityToScore(similarity);

      // Cache the score
      await supabase
        .from('vibe_scores')
        .upsert({
          user_id: user.id,
          target_type: 'user',
          target_id: targetUserId,
          score,
          computed_at: new Date().toISOString()
        }, { onConflict: 'user_id,target_type,target_id' });

      return new Response(JSON.stringify({ 
        vibe_score: score,
        target_type: 'user',
        target_id: targetUserId
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'matrix' && eventId) {
      // Get compatibility matrix for all users in an event
      const { data: participants } = await supabase
        .from('event_participants')
        .select(`
          user_id,
          profiles (
            id,
            display_name,
            profile_embedding,
            interests,
            social_energy
          )
        `)
        .eq('event_id', eventId)
        .eq('status', 'joined');

      if (!participants || participants.length === 0) {
        return new Response(JSON.stringify({ matrix: [], participants: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Ensure all participants have embeddings
      const embeddings: Record<string, number[]> = {};
      for (const p of participants) {
        const profile = p.profiles as any;
        if (!profile) continue;
        
        if (profile.profile_embedding) {
          embeddings[profile.id] = profile.profile_embedding;
        } else {
          embeddings[profile.id] = createEmbedding(profile.interests || [], profile.social_energy || 3);
          await supabase
            .from('profiles')
            .update({ 
              profile_embedding: embeddings[profile.id],
              embedding_updated_at: new Date().toISOString()
            })
            .eq('id', profile.id);
        }
      }

      // Compute pairwise compatibility
      const matrix: Array<{ user_a: string; user_b: string; score: number }> = [];
      const participantIds = Object.keys(embeddings);
      
      for (let i = 0; i < participantIds.length; i++) {
        for (let j = i + 1; j < participantIds.length; j++) {
          const similarity = cosineSimilarity(embeddings[participantIds[i]], embeddings[participantIds[j]]);
          matrix.push({
            user_a: participantIds[i],
            user_b: participantIds[j],
            score: similarityToScore(similarity)
          });
        }
      }

      // Find best match for current user
      let bestMatch: { user_id: string; score: number } | null = null;
      for (const entry of matrix) {
        if (entry.user_a === user.id || entry.user_b === user.id) {
          const matchedUserId = entry.user_a === user.id ? entry.user_b : entry.user_a;
          if (!bestMatch || entry.score > bestMatch.score) {
            bestMatch = { user_id: matchedUserId, score: entry.score };
          }
        }
      }

      return new Response(JSON.stringify({ 
        matrix,
        best_match: bestMatch,
        participants: participants.map(p => ({
          user_id: p.user_id,
          display_name: (p.profiles as any)?.display_name
        }))
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'recompute') {
      // Recompute user's embedding
      const newEmbedding = createEmbedding(profile.interests || [], profile.social_energy || 3);
      await supabase
        .from('profiles')
        .update({ 
          profile_embedding: newEmbedding,
          embedding_updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      // Clear cached vibe scores for this user
      await supabase
        .from('vibe_scores')
        .delete()
        .eq('user_id', user.id);

      return new Response(JSON.stringify({ 
        success: true,
        message: 'Embedding recomputed successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      error: 'Invalid action. Use: event, user, matrix, or recompute' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Vibe score error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
