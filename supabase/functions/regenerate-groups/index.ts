import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ErrorCodes = {
  PERM: 'E.PERM',
  FREEZE: 'E.FREEZE',
  MATCHING: 'E.MATCHING',
  AUTH: 'E.AUTH',
  NOT_FOUND: 'E.NOT_FOUND',
  UNKNOWN: 'E.UNKNOWN',
} as const;

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
}

// Scoring functions
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

function assignGroups(candidates: Candidate[], groupSize: number): Candidate[][] {
  const groups: Candidate[][] = [];
  const remaining = [...candidates];
  
  while (remaining.length >= 2) {
    const seedIdx = Math.floor(Math.random() * remaining.length);
    const group: Candidate[] = [remaining.splice(seedIdx, 1)[0]];
    
    while (group.length < groupSize && remaining.length > 0) {
      let bestIdx = -1;
      let bestScore = -1;
      
      for (let i = 0; i < remaining.length; i++) {
        const testGroup = [...group, remaining[i]];
        const score = groupScore(testGroup.map(c => c.profile));
        if (score > bestScore) {
          bestScore = score;
          bestIdx = i;
        }
      }
      
      if (bestIdx >= 0) {
        group.push(remaining.splice(bestIdx, 1)[0]);
      } else {
        break;
      }
    }
    
    if (group.length >= 2) {
      groups.push(group);
    } else {
      remaining.push(...group);
      break;
    }
  }
  
  // Handle remaining users
  while (remaining.length > 0 && groups.length > 0) {
    const smallestGroup = groups.reduce((min, g) => g.length < min.length ? g : min, groups[0]);
    if (smallestGroup.length < groupSize + 1) {
      smallestGroup.push(remaining.pop()!);
    } else {
      break;
    }
  }
  
  return groups;
}

// Permission check
async function isOrgAdmin(supabase: any, userId: string, orgId: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_roles')
    .select('id')
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .in('role', ['org_owner', 'org_admin'])
    .maybeSingle();
  return !!data;
}

// Freeze check
async function isEventFrozen(supabase: any, eventId: string): Promise<boolean> {
  const { data: event } = await supabase
    .from('events')
    .select('starts_at, freeze_hours_before')
    .eq('id', eventId)
    .single();

  if (!event) return false;

  const eventStart = new Date(event.starts_at);
  const freezeHours = event.freeze_hours_before ?? 2;
  const freezeTime = new Date(eventStart.getTime() - freezeHours * 60 * 60 * 1000);
  return new Date() >= freezeTime;
}

function successResponse<T>(data: T) {
  return new Response(JSON.stringify({ success: true, data }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function errorResponse(code: string, message: string, status = 400) {
  console.error(`[regenerate-groups] ${code}: ${message}`);
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
    const { event_id, action } = await req.json();
    
    if (!event_id) {
      return errorResponse(ErrorCodes.UNKNOWN, 'event_id is required');
    }

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
      return errorResponse(ErrorCodes.AUTH, 'Unauthorized', 401);
    }

    // Get event and verify permissions
    const { data: event } = await supabaseAdmin
      .from('events')
      .select('id, host_org_id, max_group_size, starts_at, freeze_override_lock')
      .eq('id', event_id)
      .single();

    if (!event) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Event not found', 404);
    }

    // Permission check
    const hasPermission = await isOrgAdmin(supabaseAdmin, user.id, event.host_org_id);
    if (!hasPermission) {
      console.log(`[permissions] regenerate_groups denied: user=${user.id}, org=${event.host_org_id}`);
      return errorResponse(ErrorCodes.PERM, 'Not authorized for this event', 403);
    }

    const isFrozen = await isEventFrozen(supabaseAdmin, event_id);

    // Handle freeze action
    if (action === 'freeze') {
      console.log(`[freeze] Freezing groups for event ${event_id}`);
      const { data: groups } = await supabaseAdmin
        .from('micro_groups')
        .select('id')
        .eq('event_id', event_id)
        .eq('frozen', false);

      for (const group of groups || []) {
        await supabaseAdmin
          .from('micro_groups')
          .update({ 
            frozen: true, 
            frozen_at: new Date().toISOString(),
            frozen_by: user.id,
            status: 'locked'
          })
          .eq('id', group.id);
      }

      console.log(`[analytics] groups_frozen: event_id=${event_id}, count=${groups?.length || 0}`);
      return successResponse({ message: `Frozen ${groups?.length || 0} groups`, count: groups?.length || 0 });
    }

    // Handle unfreeze action
    if (action === 'unfreeze') {
      if (event.freeze_override_lock) {
        return errorResponse(ErrorCodes.FREEZE, 'Freeze override is locked');
      }

      console.log(`[freeze] Unfreezing groups for event ${event_id}`);
      await supabaseAdmin
        .from('micro_groups')
        .update({ frozen: false, frozen_at: null, frozen_by: null, status: 'forming' })
        .eq('event_id', event_id);

      console.log(`[analytics] groups_unfrozen: event_id=${event_id}`);
      return successResponse({ message: 'Groups unfrozen' });
    }

    // FREEZE GUARD for regeneration
    if (isFrozen && action !== 'force_regenerate') {
      console.log(`[matching] freeze_block: regenerate blocked for event ${event_id}`);
      return errorResponse(ErrorCodes.FREEZE, 'Event is frozen. Use force_regenerate to override.');
    }

    console.log(`[matching] regenerate_started: event_id=${event_id}`);

    // Delete existing non-frozen groups
    const { data: existingGroups } = await supabaseAdmin
      .from('micro_groups')
      .select('id')
      .eq('event_id', event_id)
      .eq('frozen', false);

    for (const group of existingGroups || []) {
      await supabaseAdmin.from('micro_group_members').delete().eq('group_id', group.id);
      await supabaseAdmin.from('micro_groups').delete().eq('id', group.id);
    }

    console.log(`[matching] stale_group_cleaned: count=${existingGroups?.length || 0}`);

    // Get all participants
    const { data: participants } = await supabaseAdmin
      .from('event_participants')
      .select('user_id')
      .eq('event_id', event_id)
      .eq('join_status', 'joined');

    if (!participants || participants.length < 2) {
      return successResponse({ message: 'Not enough participants to form groups', groups_created: 0 });
    }

    // Get users in frozen groups
    const { data: frozenMembers } = await supabaseAdmin
      .from('micro_group_members')
      .select('user_id, micro_groups!inner(event_id, frozen)')
      .eq('micro_groups.event_id', event_id)
      .eq('micro_groups.frozen', true);

    const usersInFrozenGroups = new Set((frozenMembers || []).map(m => m.user_id));

    // Build candidates
    const candidates: Candidate[] = [];
    for (const p of participants) {
      if (usersInFrozenGroups.has(p.user_id)) continue;

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, interests, social_energy, city')
        .eq('id', p.user_id)
        .single();

      if (profile) {
        candidates.push({ user_id: p.user_id, profile });
      }
    }

    if (candidates.length < 2) {
      return successResponse({ message: 'All participants are in frozen groups', groups_created: 0 });
    }

    const groupSize = Math.min(Math.max(event.max_group_size || 3, 2), 5);
    const newGroups = assignGroups(candidates, groupSize);

    console.log(`[matching] grouping_created: count=${newGroups.length}`);

    // Create groups
    let groupsCreated = 0;
    for (const groupMembers of newGroups) {
      const score = groupScore(groupMembers.map(m => m.profile));
      
      const { data: newGroup, error: groupError } = await supabaseAdmin
        .from('micro_groups')
        .insert({
          event_id,
          status: groupMembers.length >= groupSize ? 'locked' : 'forming',
          meet_time: event.starts_at,
          auto_generated: true,
          compatibility_score: Math.round(score * 100)
        })
        .select()
        .single();

      if (groupError || !newGroup) {
        console.error('[regenerate-groups] Group creation error:', groupError);
        continue;
      }

      const memberInserts = groupMembers.map((m, idx) => ({
        group_id: newGroup.id,
        user_id: m.user_id,
        role: idx === 0 ? 'host' : 'member'
      }));

      await supabaseAdmin.from('micro_group_members').insert(memberInserts);
      groupsCreated++;
    }

    // Compute no-show predictions
    for (const candidate of candidates) {
      const { count: pastEvents } = await supabaseAdmin
        .from('attendance_records')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', candidate.user_id);

      const { count: joinedEvents } = await supabaseAdmin
        .from('event_participants')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', candidate.user_id);

      const attendanceRate = joinedEvents ? (pastEvents || 0) / joinedEvents : 0.5;
      const riskScore = Math.round((1 - attendanceRate) * 100);

      await supabaseAdmin
        .from('no_show_predictions')
        .upsert({
          user_id: candidate.user_id,
          event_id,
          risk_score: riskScore,
          factors: { attendance_rate: attendanceRate, past_events: pastEvents }
        }, { onConflict: 'user_id,event_id' });
    }

    console.log(`[analytics] groups_regenerated: event_id=${event_id}, groups=${groupsCreated}, participants=${candidates.length}`);

    return successResponse({ 
      groups_created: groupsCreated,
      participants_assigned: candidates.length
    });

  } catch (error) {
    console.error('[regenerate-groups] Error:', error);
    return errorResponse(ErrorCodes.UNKNOWN, error instanceof Error ? error.message : 'Unknown error', 500);
  }
});
