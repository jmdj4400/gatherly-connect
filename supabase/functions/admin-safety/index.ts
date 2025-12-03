import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
      return new Response(JSON.stringify({ error: 'Invalid user' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin
    const { data: adminRole } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    const isAdmin = !!adminRole;

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // List reports
    if (req.method === 'GET' && action === 'reports') {
      const status = url.searchParams.get('status') || 'pending';
      const limit = parseInt(url.searchParams.get('limit') || '50');

      let query = supabaseAdmin
        .from('reports')
        .select(`
          *,
          reported_profile:profiles!reported_user_id(id, display_name, avatar_url),
          reporter_profile:profiles!reporter_id(id, display_name),
          message:messages(id, content, created_at),
          group:micro_groups(id, event_id, events!inner(title))
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (status !== 'all') {
        query = query.eq('status', status);
      }

      // If not admin, filter by org
      if (!isAdmin) {
        const { data: orgRoles } = await supabaseAdmin
          .from('user_roles')
          .select('org_id')
          .eq('user_id', user.id)
          .eq('role', 'org_admin');

        if (!orgRoles || orgRoles.length === 0) {
          return new Response(JSON.stringify({ error: 'Not authorized' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      const { data: reports, error } = await query;

      if (error) {
        console.error('[admin-safety] Error fetching reports:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch reports' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ reports }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Resolve report
    if (req.method === 'POST' && action === 'resolve') {
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: 'Admin access required' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { report_id, resolution_notes, status } = await req.json();

      const { error } = await supabaseAdmin
        .from('reports')
        .update({
          status: status || 'resolved',
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
          resolution_notes
        })
        .eq('id', report_id);

      if (error) {
        console.error('[admin-safety] Error resolving report:', error);
        return new Response(JSON.stringify({ error: 'Failed to resolve report' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`[analytics] report_resolved: report_id=${report_id}, by=${user.id}`);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Freeze/unfreeze group
    if (req.method === 'POST' && action === 'freeze') {
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: 'Admin access required' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { group_id, freeze } = await req.json();

      const { error } = await supabaseAdmin
        .from('micro_groups')
        .update({
          frozen: freeze,
          frozen_at: freeze ? new Date().toISOString() : null,
          frozen_by: freeze ? user.id : null
        })
        .eq('id', group_id);

      if (error) {
        console.error('[admin-safety] Error freezing group:', error);
        return new Response(JSON.stringify({ error: 'Failed to freeze group' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`[analytics] group_${freeze ? 'frozen' : 'unfrozen'}: group_id=${group_id}, by=${user.id}`);

      return new Response(JSON.stringify({ success: true, frozen: freeze }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Ban user
    if (req.method === 'POST' && action === 'ban') {
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: 'Admin access required' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { user_id, reason, permanent, duration_days } = await req.json();

      const bannedUntil = permanent ? null : new Date(Date.now() + (duration_days || 7) * 24 * 60 * 60 * 1000);

      const { error } = await supabaseAdmin
        .from('user_bans')
        .insert({
          user_id,
          banned_by: user.id,
          reason,
          permanent: permanent || false,
          banned_until: bannedUntil?.toISOString()
        });

      if (error) {
        console.error('[admin-safety] Error banning user:', error);
        return new Response(JSON.stringify({ error: 'Failed to ban user' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`[analytics] user_banned: user_id=${user_id}, permanent=${permanent}, by=${user.id}`);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Unban user
    if (req.method === 'POST' && action === 'unban') {
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: 'Admin access required' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { user_id } = await req.json();

      const { error } = await supabaseAdmin
        .from('user_bans')
        .delete()
        .eq('user_id', user_id);

      if (error) {
        console.error('[admin-safety] Error unbanning user:', error);
        return new Response(JSON.stringify({ error: 'Failed to unban user' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`[analytics] user_unbanned: user_id=${user_id}, by=${user.id}`);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Unmute user
    if (req.method === 'POST' && action === 'unmute') {
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: 'Admin access required' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { user_id, group_id } = await req.json();

      let query = supabaseAdmin
        .from('user_mutes')
        .delete()
        .eq('user_id', user_id);

      if (group_id) {
        query = query.eq('group_id', group_id);
      }

      const { error } = await query;

      if (error) {
        console.error('[admin-safety] Error unmuting user:', error);
        return new Response(JSON.stringify({ error: 'Failed to unmute user' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`[analytics] user_unmuted: user_id=${user_id}, group_id=${group_id || 'all'}, by=${user.id}`);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get mutes for a user
    if (req.method === 'GET' && action === 'mutes') {
      const targetUserId = url.searchParams.get('user_id');

      const { data: mutes, error } = await supabaseAdmin
        .from('user_mutes')
        .select('*, group:micro_groups(id, event_id)')
        .eq('user_id', targetUserId || user.id)
        .gt('muted_until', new Date().toISOString());

      if (error) {
        console.error('[admin-safety] Error fetching mutes:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch mutes' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ mutes }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[admin-safety] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
