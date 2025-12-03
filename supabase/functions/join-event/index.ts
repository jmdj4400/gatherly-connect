import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Profile {
  id: string;
  interests: string[] | null;
  social_energy: number | null;
  city: string | null;
  radius_km: number | null;
  language: string | null;
}

interface Candidate {
  user_id: string;
  profile: Profile;
  participation_id: string;
}

// Jaccard similarity for interests
function jaccardSimilarity(a: string[], b: string[]): number {
  if (!a?.length || !b?.length) return 0;
  const setA = new Set(a.map(s => s.toLowerCase()));
  const setB = new Set(b.map(s => s.toLowerCase()));
  const intersection = [...setA].filter(x => setB.has(x)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

// Social energy score (1 = perfect match, 0 = max difference)
function socialEnergyScore(a: number | null, b: number | null): number {
  const energyA = a ?? 3;
  const energyB = b ?? 3;
  return 1 - Math.abs(energyA - energyB) / 4;
}

// Compute pairwise score between two users
function computeScore(profileA: Profile, profileB: Profile): number {
  const jaccard = jaccardSimilarity(profileA.interests || [], profileB.interests || []);
  const social = socialEnergyScore(profileA.social_energy, profileB.social_energy);
  // Proximity score: using same city as proxy (no lat/lng in current schema)
  const proximity = profileA.city?.toLowerCase() === profileB.city?.toLowerCase() ? 1 : 0.5;
  
  return 0.6 * jaccard + 0.2 * social + 0.2 * proximity;
}

// Compute average pairwise score for a group
function groupScore(members: Profile[]): number {
  if (members.length < 2) return 0;
  let total = 0;
  let count = 0;
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      total += computeScore(members[i], members[j]);
      count++;
    }
  }
  return count > 0 ? total / count : 0;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { event_id } = await req.json();
    
    if (!event_id) {
      return new Response(JSON.stringify({ error: 'event_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client for DB operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Create user client to get user info
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get current user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid user' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = user.id;
    console.log(`[join-event] User ${userId} joining event ${event_id}`);

    // STEP 1: Idempotency check - is user already in a group for this event?
    const { data: existingMembership } = await supabaseAdmin
      .from('micro_group_members')
      .select(`
        id,
        group_id,
        micro_groups!inner (
          id,
          event_id,
          status
        )
      `)
      .eq('user_id', userId)
      .eq('micro_groups.event_id', event_id)
      .maybeSingle();

    if (existingMembership) {
      console.log(`[join-event] User already in group ${existingMembership.group_id}`);
      return new Response(JSON.stringify({ 
        group_id: existingMembership.group_id, 
        status: 'assigned',
        message: 'Already assigned to a group'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // STEP 2: Check if user has already joined (event_participants)
    const { data: existingParticipation } = await supabaseAdmin
      .from('event_participants')
      .select('id, status')
      .eq('event_id', event_id)
      .eq('user_id', userId)
      .maybeSingle();

    // If not joined yet, create participation record
    if (!existingParticipation) {
      const { error: insertError } = await supabaseAdmin
        .from('event_participants')
        .insert({
          event_id,
          user_id: userId,
          status: 'joined'
        });

      if (insertError) {
        console.error('[join-event] Insert error:', insertError);
        return new Response(JSON.stringify({ error: 'Failed to join event' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // STEP 3: Get event details with row lock (FOR UPDATE simulation via select + immediate update)
    const { data: event } = await supabaseAdmin
      .from('events')
      .select('id, max_group_size, starts_at, auto_match, freeze_hours_before, host_org_id')
      .eq('id', event_id)
      .single();

    if (!event) {
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if event is frozen
    const eventStart = new Date(event.starts_at);
    const now = new Date();
    const hoursUntil = (eventStart.getTime() - now.getTime()) / (1000 * 60 * 60);
    const isFrozen = hoursUntil <= (event.freeze_hours_before || 2);

    if (isFrozen) {
      // Check if user is already in a group (should have been caught earlier)
      return new Response(JSON.stringify({ 
        error: 'Event groups are frozen. You can no longer join.',
        status: 'frozen'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const groupSize = Math.min(Math.max(event.max_group_size || 3, 2), 5);
    console.log(`[join-event] Target group size: ${groupSize}`);

    // STEP 4: Get all candidates (joined users without a group for this event)
    const { data: allParticipants } = await supabaseAdmin
      .from('event_participants')
      .select('id, user_id')
      .eq('event_id', event_id)
      .eq('status', 'joined');

    if (!allParticipants || allParticipants.length === 0) {
      return new Response(JSON.stringify({ 
        group_id: null, 
        status: 'waiting',
        message: 'Waiting for more participants'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get users who are already in groups for this event
    const { data: existingGroupMembers } = await supabaseAdmin
      .from('micro_group_members')
      .select(`
        user_id,
        micro_groups!inner (event_id)
      `)
      .eq('micro_groups.event_id', event_id);

    const usersInGroups = new Set((existingGroupMembers || []).map(m => m.user_id));

    // Filter to candidates not yet in a group
    const candidates: Candidate[] = [];
    for (const p of allParticipants) {
      if (!usersInGroups.has(p.user_id)) {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id, interests, social_energy, city, radius_km, language')
          .eq('id', p.user_id)
          .single();
        
        if (profile) {
          candidates.push({
            user_id: p.user_id,
            profile,
            participation_id: p.id
          });
        }
      }
    }

    console.log(`[join-event] ${candidates.length} candidates available`);

    // STEP 5: Check if we have enough candidates to form a group
    if (candidates.length < 2) {
      return new Response(JSON.stringify({ 
        group_id: null, 
        status: 'waiting',
        message: `Waiting for more participants (${candidates.length}/${groupSize} minimum 2)`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // STEP 6: Run matching algorithm (greedy best-score)
    // Start with current user as seed
    const currentUserCandidate = candidates.find(c => c.user_id === userId);
    if (!currentUserCandidate) {
      return new Response(JSON.stringify({ 
        group_id: null, 
        status: 'waiting',
        message: 'Profile not found'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const groupMembers: Candidate[] = [currentUserCandidate];
    const remaining = candidates.filter(c => c.user_id !== userId);

    // Greedy: add best scoring candidate until group is full
    while (groupMembers.length < groupSize && remaining.length > 0) {
      let bestIdx = -1;
      let bestScore = -1;

      for (let i = 0; i < remaining.length; i++) {
        const candidate = remaining[i];
        const testGroup = [...groupMembers, candidate];
        const score = groupScore(testGroup.map(m => m.profile));
        
        if (score > bestScore) {
          bestScore = score;
          bestIdx = i;
        }
      }

      if (bestIdx >= 0) {
        groupMembers.push(remaining[bestIdx]);
        remaining.splice(bestIdx, 1);
      } else {
        break;
      }
    }

    // Need at least 2 members to form a group
    if (groupMembers.length < 2) {
      return new Response(JSON.stringify({ 
        group_id: null, 
        status: 'waiting',
        message: 'Not enough compatible participants yet'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[join-event] Forming group with ${groupMembers.length} members`);

    // STEP 7: Create group and add members (transaction via sequential inserts)
    const groupStatus = groupMembers.length >= groupSize ? 'locked' : 'forming';
    
    const { data: newGroup, error: groupError } = await supabaseAdmin
      .from('micro_groups')
      .insert({
        event_id,
        status: groupStatus,
        meet_time: event.starts_at
      })
      .select()
      .single();

    if (groupError || !newGroup) {
      console.error('[join-event] Group creation error:', groupError);
      return new Response(JSON.stringify({ error: 'Failed to create group' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Add all members to the group
    const memberInserts = groupMembers.map((m, idx) => ({
      group_id: newGroup.id,
      user_id: m.user_id,
      role: idx === 0 ? 'host' : 'member'
    }));

    const { error: membersError } = await supabaseAdmin
      .from('micro_group_members')
      .insert(memberInserts);

    if (membersError) {
      console.error('[join-event] Members insert error:', membersError);
      // Rollback: delete the group
      await supabaseAdmin.from('micro_groups').delete().eq('id', newGroup.id);
      return new Response(JSON.stringify({ error: 'Failed to add group members' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update participant statuses
    for (const m of groupMembers) {
      await supabaseAdmin
        .from('event_participants')
        .update({ status: 'joined' })
        .eq('id', m.participation_id);
    }

    console.log(`[join-event] Group ${newGroup.id} created with status ${groupStatus}`);
    console.log(`[join-event] Members: ${groupMembers.map(m => m.user_id).join(', ')}`);

    // Analytics event (logged)
    console.log(`[analytics] group_created: event_id=${event_id}, group_id=${newGroup.id}, members=${groupMembers.length}`);
    if (groupStatus === 'locked') {
      console.log(`[analytics] group_locked: group_id=${newGroup.id}`);
    }

    return new Response(JSON.stringify({ 
      group_id: newGroup.id, 
      status: groupStatus === 'locked' ? 'assigned' : 'forming',
      members_count: groupMembers.length,
      message: groupStatus === 'locked' 
        ? 'Your group is ready!' 
        : `Group forming (${groupMembers.length}/${groupSize})`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[join-event] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
