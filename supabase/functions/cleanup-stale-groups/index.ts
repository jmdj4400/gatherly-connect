import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STALE_THRESHOLD_MINUTES = 5;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[cleanup-stale-groups] Starting cleanup job');

    // Find stale forming groups (status = 'forming' and created > 5 minutes ago)
    const staleThreshold = new Date(Date.now() - STALE_THRESHOLD_MINUTES * 60 * 1000).toISOString();

    const { data: staleGroups, error: fetchError } = await supabaseAdmin
      .from('micro_groups')
      .select('id, event_id, created_at, status')
      .eq('status', 'forming')
      .eq('frozen', false)
      .lt('created_at', staleThreshold);

    if (fetchError) {
      console.error('[cleanup-stale-groups] Error fetching stale groups:', fetchError);
      return new Response(JSON.stringify({ success: false, error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!staleGroups || staleGroups.length === 0) {
      console.log('[cleanup-stale-groups] No stale groups found');
      return new Response(JSON.stringify({ success: true, finalized: 0, cleaned: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[cleanup-stale-groups] Found ${staleGroups.length} stale groups`);

    let finalized = 0;
    let cleaned = 0;

    for (const group of staleGroups) {
      // Check how many members the group has
      const { count: memberCount } = await supabaseAdmin
        .from('micro_group_members')
        .select('id', { count: 'exact', head: true })
        .eq('group_id', group.id);

      if (memberCount && memberCount >= 2) {
        // Finalize groups with 2+ members
        const { error: updateError } = await supabaseAdmin
          .from('micro_groups')
          .update({ status: 'locked' })
          .eq('id', group.id);

        if (!updateError) {
          finalized++;
          console.log(`[matching] stale_group_finalized: group_id=${group.id}, members=${memberCount}`);
        }
      } else {
        // Clean up groups with < 2 members
        // First, delete members
        await supabaseAdmin
          .from('micro_group_members')
          .delete()
          .eq('group_id', group.id);

        // Then delete the group
        const { error: deleteError } = await supabaseAdmin
          .from('micro_groups')
          .delete()
          .eq('id', group.id);

        if (!deleteError) {
          cleaned++;
          console.log(`[matching] stale_group_cleaned: group_id=${group.id}`);
        }
      }
    }

    console.log(`[analytics] stale_group_cleanup: finalized=${finalized}, cleaned=${cleaned}`);

    return new Response(JSON.stringify({ 
      success: true, 
      finalized, 
      cleaned,
      total_processed: staleGroups.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[cleanup-stale-groups] Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
