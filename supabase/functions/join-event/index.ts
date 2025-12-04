import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Import shared utilities (inline since Deno edge functions can't import across folders)
const ErrorCodes = {
  PERM: 'E.PERM',
  FREEZE: 'E.FREEZE',
  MATCHING: 'E.MATCHING',
  AUTH: 'E.AUTH',
  VALIDATION: 'E.VALIDATION',
  NOT_FOUND: 'E.NOT_FOUND',
  DUPLICATE: 'E.DUPLICATE',
  UNKNOWN: 'E.UNKNOWN',
} as const;

// Input validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(value: unknown): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

interface JoinEventInput {
  event_id: string;
}

function validateJoinEventInput(input: unknown): { success: boolean; data?: JoinEventInput; error?: string } {
  if (typeof input !== 'object' || input === null) {
    return { success: false, error: 'Request body must be a JSON object' };
  }
  
  const data = input as Record<string, unknown>;
  
  if (!isValidUUID(data.event_id)) {
    return { success: false, error: 'event_id must be a valid UUID' };
  }
  
  return { success: true, data: { event_id: data.event_id as string } };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Profile {
  id: string;
  interests: string[] | null;
  social_energy: number | null;
  city: string | null;
}

interface Candidate {
  user_id: string;
  profile: Profile;
  participation_id: string;
}

// Scoring utilities
function jaccardSimilarity(a: string[], b: string[]): number {
  if (!a?.length || !b?.length) return 0;
  const setA = new Set(a.map(s => s.toLowerCase()));
  const setB = new Set(b.map(s => s.toLowerCase()));
  const intersection = [...setA].filter(x => setB.has(x)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

function socialEnergyScore(a: number | null, b: number | null): number {
  const energyA = a ?? 3;
  const energyB = b ?? 3;
  return 1 - Math.abs(energyA - energyB) / 4;
}

function computeScore(profileA: Profile, profileB: Profile): number {
  const jaccard = jaccardSimilarity(profileA.interests || [], profileB.interests || []);
  const social = socialEnergyScore(profileA.social_energy, profileB.social_energy);
  const proximity = profileA.city?.toLowerCase() === profileB.city?.toLowerCase() ? 1 : 0.5;
  return 0.5 * jaccard + 0.3 * social + 0.2 * proximity;
}

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

// Freeze utilities
async function isEventFrozen(supabase: any, eventId: string): Promise<{ frozen: boolean; reason?: string }> {
  const { data: event, error } = await supabase
    .from('events')
    .select('starts_at, freeze_hours_before, freeze_override_lock')
    .eq('id', eventId)
    .single();

  if (error || !event) {
    return { frozen: false };
  }

  const eventStart = new Date(event.starts_at);
  const freezeHours = event.freeze_hours_before ?? 2;
  const freezeTime = new Date(eventStart.getTime() - freezeHours * 60 * 60 * 1000);
  const now = new Date();

  if (now >= freezeTime) {
    return { frozen: true, reason: 'Groups are frozen. Event starts soon.' };
  }

  return { frozen: false };
}

// Response helpers
function successResponse<T>(data: T) {
  return new Response(JSON.stringify({ success: true, data }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function errorResponse(code: string, message: string, status = 400) {
  console.error(`[join-event] ${code}: ${message}`);
  return new Response(JSON.stringify({ success: false, error: { code, message } }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate input
    let rawInput: unknown;
    try {
      rawInput = await req.json();
    } catch {
      return errorResponse(ErrorCodes.VALIDATION, 'Invalid JSON in request body');
    }
    
    const validation = validateJoinEventInput(rawInput);
    if (!validation.success || !validation.data) {
      return errorResponse(ErrorCodes.VALIDATION, validation.error || 'Invalid input');
    }
    
    const { event_id } = validation.data;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse(ErrorCodes.AUTH, 'Authorization required', 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return errorResponse(ErrorCodes.AUTH, 'Invalid user', 401);
    }

    const userId = user.id;
    console.log(`[matching] join_request: user=${userId}, event=${event_id}`);

    // FREEZE GUARD - Check before any operations
    const freezeStatus = await isEventFrozen(supabaseAdmin, event_id);
    if (freezeStatus.frozen) {
      console.log(`[matching] freeze_block: user=${userId}, event=${event_id}`);
      return errorResponse(ErrorCodes.FREEZE, freezeStatus.reason || 'Event is frozen');
    }

    // IDEMPOTENCY CHECK - Is user already in a group for this event?
    const { data: existingMembership } = await supabaseAdmin
      .from('micro_group_members')
      .select(`id, group_id, micro_groups!inner (id, event_id, status)`)
      .eq('user_id', userId)
      .eq('micro_groups.event_id', event_id)
      .maybeSingle();

    if (existingMembership) {
      console.log(`[matching] idempotency_hit: user=${userId} already in group ${existingMembership.group_id}`);
      return successResponse({ 
        group_id: existingMembership.group_id, 
        status: 'assigned',
        message: 'Already assigned to a group'
      });
    }

    // Check/create event participation
    const { data: existingParticipation } = await supabaseAdmin
      .from('event_participants')
      .select('id, join_status')
      .eq('event_id', event_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (!existingParticipation) {
      const { error: insertError } = await supabaseAdmin
        .from('event_participants')
        .insert({ event_id, user_id: userId, status: 'joined', join_status: 'joined' });

      if (insertError) {
        // Handle unique constraint violation
        if (insertError.code === '23505') {
          return errorResponse(ErrorCodes.DUPLICATE, 'Already joined this event');
        }
        console.error('[join-event] Insert error:', insertError);
        return errorResponse(ErrorCodes.UNKNOWN, 'Failed to join event', 500);
      }
    } else if (existingParticipation.join_status === 'cancelled') {
      // Reactivate cancelled participation
      await supabaseAdmin
        .from('event_participants')
        .update({ join_status: 'joined', cancelled_at: null })
        .eq('id', existingParticipation.id);
    }

    // Get event details
    const { data: event } = await supabaseAdmin
      .from('events')
      .select('id, max_group_size, starts_at, auto_match, host_org_id')
      .eq('id', event_id)
      .single();

    if (!event) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Event not found', 404);
    }

    const groupSize = Math.min(Math.max(event.max_group_size || 3, 2), 5);

    // Get all candidates (joined users without a group)
    const { data: allParticipants } = await supabaseAdmin
      .from('event_participants')
      .select('id, user_id')
      .eq('event_id', event_id)
      .eq('join_status', 'joined');

    if (!allParticipants || allParticipants.length === 0) {
      return successResponse({ group_id: null, status: 'waiting', message: 'Waiting for more participants' });
    }

    // Get users already in groups
    const { data: existingGroupMembers } = await supabaseAdmin
      .from('micro_group_members')
      .select(`user_id, micro_groups!inner (event_id)`)
      .eq('micro_groups.event_id', event_id);

    const usersInGroups = new Set((existingGroupMembers || []).map(m => m.user_id));

    // Build candidates list
    const candidates: Candidate[] = [];
    for (const p of allParticipants) {
      if (!usersInGroups.has(p.user_id)) {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id, interests, social_energy, city')
          .eq('id', p.user_id)
          .single();
        
        if (profile) {
          candidates.push({ user_id: p.user_id, profile, participation_id: p.id });
        }
      }
    }

    console.log(`[matching] candidates_count: ${candidates.length}`);

    if (candidates.length < 2) {
      return successResponse({ 
        group_id: null, 
        status: 'waiting',
        message: `Waiting for more participants (${candidates.length}/${groupSize} minimum 2)`
      });
    }

    // MATCHING ALGORITHM - Greedy best-score
    const currentUserCandidate = candidates.find(c => c.user_id === userId);
    if (!currentUserCandidate) {
      return successResponse({ group_id: null, status: 'waiting', message: 'Profile not found' });
    }

    const groupMembers: Candidate[] = [currentUserCandidate];
    const remaining = candidates.filter(c => c.user_id !== userId);

    while (groupMembers.length < groupSize && remaining.length > 0) {
      let bestIdx = -1;
      let bestScore = -1;

      for (let i = 0; i < remaining.length; i++) {
        const testGroup = [...groupMembers, remaining[i]];
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

    if (groupMembers.length < 2) {
      return successResponse({ group_id: null, status: 'waiting', message: 'Not enough compatible participants yet' });
    }

    // Create group
    const groupStatus = groupMembers.length >= groupSize ? 'locked' : 'forming';
    const compatibilityScore = Math.round(groupScore(groupMembers.map(m => m.profile)) * 100);
    
    const { data: newGroup, error: groupError } = await supabaseAdmin
      .from('micro_groups')
      .insert({
        event_id,
        status: groupStatus,
        meet_time: event.starts_at,
        compatibility_score: compatibilityScore,
        auto_generated: true
      })
      .select()
      .single();

    if (groupError || !newGroup) {
      console.error('[join-event] Group creation error:', groupError);
      return errorResponse(ErrorCodes.MATCHING, 'Failed to create group', 500);
    }

    // Add members
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
      await supabaseAdmin.from('micro_groups').delete().eq('id', newGroup.id);
      return errorResponse(ErrorCodes.MATCHING, 'Failed to add group members', 500);
    }

    console.log(`[matching] grouping_created: group_id=${newGroup.id}, members=${groupMembers.length}, score=${compatibilityScore}`);
    console.log(`[analytics] group_created: event_id=${event_id}, group_id=${newGroup.id}, members=${groupMembers.length}`);

    return successResponse({ 
      group_id: newGroup.id, 
      status: groupStatus === 'locked' ? 'assigned' : 'forming',
      members_count: groupMembers.length,
      compatibility_score: compatibilityScore,
      message: groupStatus === 'locked' ? 'Your group is ready!' : `Group forming (${groupMembers.length}/${groupSize})`
    });

  } catch (error) {
    console.error('[join-event] Error:', error);
    return errorResponse(ErrorCodes.UNKNOWN, error instanceof Error ? error.message : 'Unknown error', 500);
  }
});
