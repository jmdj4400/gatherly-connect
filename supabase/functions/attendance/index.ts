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

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // Mark attendance for a group
    if (req.method === 'POST' && action === 'mark') {
      const { group_id, user_id, status } = await req.json();
      
      if (!group_id || !user_id) {
        return new Response(JSON.stringify({ error: 'group_id and user_id required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verify caller is org_admin or group host
      const { data: group } = await supabaseAdmin
        .from('micro_groups')
        .select('id, event_id, events!inner(host_org_id)')
        .eq('id', group_id)
        .single();

      if (!group) {
        return new Response(JSON.stringify({ error: 'Group not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if user is host of the group or org_admin
      const { data: memberRole } = await supabaseAdmin
        .from('micro_group_members')
        .select('role')
        .eq('group_id', group_id)
        .eq('user_id', user.id)
        .maybeSingle();

      const { data: orgRole } = await supabaseAdmin
        .from('user_roles')
        .select('id')
        .eq('user_id', user.id)
        .eq('role', 'org_admin')
        .eq('org_id', (group as any).events.host_org_id)
        .maybeSingle();

      if (memberRole?.role !== 'host' && !orgRole) {
        return new Response(JSON.stringify({ error: 'Only host or org admin can mark attendance' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get the event_id from the group
      const eventId = group.event_id;

      // Update participant status
      const newStatus = status === 'attended' ? 'attended' : 'no_show';
      const { error: updateError } = await supabaseAdmin
        .from('event_participants')
        .update({ status: newStatus })
        .eq('event_id', eventId)
        .eq('user_id', user_id);

      if (updateError) {
        console.error('[attendance] Update error:', updateError);
        return new Response(JSON.stringify({ error: 'Failed to update attendance' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`[analytics] attendance_marked: group_id=${group_id}, user_id=${user_id}, status=${newStatus}`);

      return new Response(JSON.stringify({ success: true, status: newStatus }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Export attendance report for org
    if (req.method === 'GET' && action === 'export') {
      const orgId = url.searchParams.get('org_id');
      const from = url.searchParams.get('from');
      const to = url.searchParams.get('to');

      if (!orgId) {
        return new Response(JSON.stringify({ error: 'org_id required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verify org_admin role
      const { data: roleData } = await supabaseAdmin
        .from('user_roles')
        .select('id')
        .eq('user_id', user.id)
        .eq('role', 'org_admin')
        .eq('org_id', orgId)
        .maybeSingle();

      if (!roleData) {
        return new Response(JSON.stringify({ error: 'Not authorized' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Build query for events
      let eventsQuery = supabaseAdmin
        .from('events')
        .select('id, title, starts_at, ticket_price')
        .eq('host_org_id', orgId);

      if (from) {
        eventsQuery = eventsQuery.gte('starts_at', from);
      }
      if (to) {
        eventsQuery = eventsQuery.lte('starts_at', to);
      }

      const { data: events } = await eventsQuery;

      if (!events || events.length === 0) {
        return new Response(JSON.stringify({ data: [], summary: { total_events: 0 } }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get attendance data for each event
      const reportData = [];
      let totalJoined = 0;
      let totalAttended = 0;
      let totalRevenue = 0;

      for (const event of events) {
        const { data: participants } = await supabaseAdmin
          .from('event_participants')
          .select('status')
          .eq('event_id', event.id);

        const joined = participants?.length || 0;
        const attended = participants?.filter(p => p.status === 'attended').length || 0;
        const noShowRate = joined > 0 ? (1 - attended / joined) : 0;
        const eventRevenue = attended * (event.ticket_price || 0);

        totalJoined += joined;
        totalAttended += attended;
        totalRevenue += eventRevenue;

        reportData.push({
          event_id: event.id,
          event_title: event.title,
          date: event.starts_at,
          joined,
          attended,
          no_show_rate: Math.round(noShowRate * 100) / 100,
          ticket_price: event.ticket_price || 0,
          revenue: eventRevenue
        });
      }

      console.log(`[analytics] attendance_report_generated: org_id=${orgId}, events=${events.length}`);

      // Return as JSON or CSV based on format param
      const format = url.searchParams.get('format');
      
      if (format === 'csv') {
        const csvHeader = 'event_id,event_title,date,joined,attended,no_show_rate,ticket_price,revenue\n';
        const csvRows = reportData.map(r => 
          `${r.event_id},"${r.event_title}",${r.date},${r.joined},${r.attended},${r.no_show_rate},${r.ticket_price},${r.revenue}`
        ).join('\n');
        
        return new Response(csvHeader + csvRows, {
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="attendance_${orgId}_${new Date().toISOString().split('T')[0]}.csv"`
          },
        });
      }

      return new Response(JSON.stringify({
        data: reportData,
        summary: {
          total_events: events.length,
          total_joined: totalJoined,
          total_attended: totalAttended,
          overall_no_show_rate: totalJoined > 0 ? Math.round((1 - totalAttended / totalJoined) * 100) / 100 : 0,
          total_revenue: totalRevenue
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate QR code data for group check-in
    if (req.method === 'GET' && action === 'qr') {
      const groupId = url.searchParams.get('group_id');
      
      if (!groupId) {
        return new Response(JSON.stringify({ error: 'group_id required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get group and verify access
      const { data: group } = await supabaseAdmin
        .from('micro_groups')
        .select('id, event_id, events!inner(host_org_id, title)')
        .eq('id', groupId)
        .single();

      if (!group) {
        return new Response(JSON.stringify({ error: 'Group not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Generate QR data (would be scanned to mark attendance)
      const qrData = {
        type: 'gatherly_checkin',
        group_id: groupId,
        event_id: group.event_id,
        event_title: (group as any).events.title,
        generated_at: new Date().toISOString()
      };

      return new Response(JSON.stringify({
        qr_data: btoa(JSON.stringify(qrData)),
        raw: qrData
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[attendance] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
