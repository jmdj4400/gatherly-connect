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
  return 0.6 * jaccard + 0.2 * social + 0.2 * proximity;
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

// Optimal group assignment using greedy approach
function assignGroups(candidates: Candidate[], groupSize: number): Candidate[][] {
  const groups: Candidate[][] = [];
  const remaining = [...candidates];
  
  while (remaining.length >= 2) {
    // Start new group with random seed for diversity
    const seedIdx = Math.floor(Math.random() * remaining.length);
    const group: Candidate[] = [remaining.splice(seedIdx, 1)[0]];
    
    // Fill group with best matches
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
      // Put back if can't form valid group
      remaining.push(...group);
      break;
    }
  }
  
  // Handle remaining users - add to smallest groups
  while (remaining.length > 0) {
    const smallestGroup = groups.reduce((min, g) => 
      g.length < min.length ? g : min, groups[0]);
    if (smallestGroup && smallestGroup.length < groupSize + 1) {
      smallestGroup.push(remaining.pop()!);
    } else {
      break;
    }
  }
  
  return groups;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { event_id, action } = await req.json();
    
    if (!event_id) {
      return new Response(JSON.stringify({ error: 'event_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get event and verify org admin
    const { data: event } = await supabaseAdmin
      .from('events')
      .select('id, host_org_id, max_group_size, starts_at, auto_match, freeze_hours_before')
      .eq('id', event_id)
      .single();

    if (!event) {
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check org admin
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('org_id', event.host_org_id)
      .eq('role', 'org_admin')
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Not authorized for this event' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if event is frozen
    const eventStart = new Date(event.starts_at);
    const now = new Date();
    const hoursUntil = (eventStart.getTime() - now.getTime()) / (1000 * 60 * 60);
    const isFrozen = hoursUntil <= (event.freeze_hours_before || 2);

    // Handle freeze action
    if (action === 'freeze') {
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
            frozen_by: user.id
          })
          .eq('id', group.id);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: `Frozen ${groups?.length || 0} groups`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle unfreeze action
    if (action === 'unfreeze') {
      await supabaseAdmin
        .from('micro_groups')
        .update({ frozen: false, frozen_at: null, frozen_by: null })
        .eq('event_id', event_id);

      return new Response(JSON.stringify({ success: true, message: 'Groups unfrozen' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Regenerate groups (only if not frozen)
    if (isFrozen && action !== 'force_regenerate') {
      return new Response(JSON.stringify({ 
        error: 'Event is frozen. Use force_regenerate to override.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[regenerate-groups] Regenerating groups for event ${event_id}`);

    // Delete existing non-frozen groups and their members
    const { data: existingGroups } = await supabaseAdmin
      .from('micro_groups')
      .select('id')
      .eq('event_id', event_id)
      .eq('frozen', false);

    for (const group of existingGroups || []) {
      await supabaseAdmin
        .from('micro_group_members')
        .delete()
        .eq('group_id', group.id);
      
      await supabaseAdmin
        .from('micro_groups')
        .delete()
        .eq('id', group.id);
    }

    // Get all participants
    const { data: participants } = await supabaseAdmin
      .from('event_participants')
      .select('user_id')
      .eq('event_id', event_id)
      .eq('status', 'joined');

    if (!participants || participants.length < 2) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Not enough participants to form groups',
        groups_created: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get users already in frozen groups
    const { data: frozenMembers } = await supabaseAdmin
      .from('micro_group_members')
      .select('user_id, micro_groups!inner(event_id, frozen)')
      .eq('micro_groups.event_id', event_id)
      .eq('micro_groups.frozen', true);

    const usersInFrozenGroups = new Set((frozenMembers || []).map(m => m.user_id));

    // Build candidates list
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
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'All participants are in frozen groups',
        groups_created: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const groupSize = Math.min(Math.max(event.max_group_size || 3, 2), 5);
    const newGroups = assignGroups(candidates, groupSize);

    console.log(`[regenerate-groups] Creating ${newGroups.length} groups`);

    // Create groups in database
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
      // Simple prediction based on past attendance
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

    return new Response(JSON.stringify({ 
      success: true, 
      groups_created: groupsCreated,
      participants_assigned: candidates.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[regenerate-groups] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});