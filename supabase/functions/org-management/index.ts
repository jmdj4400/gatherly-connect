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
    
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!, {
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

    // Create new organization
    if (req.method === 'POST' && action === 'create') {
      const { name, contact_email } = await req.json();
      
      if (!name?.trim()) {
        return new Response(JSON.stringify({ error: 'Organization name is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create organization
      const { data: org, error: orgError } = await supabaseAdmin
        .from('orgs')
        .insert({
          name: name.trim(),
          contact_email: contact_email?.trim() || user.email
        })
        .select()
        .single();

      if (orgError || !org) {
        console.error('[org-management] Create org error:', orgError);
        return new Response(JSON.stringify({ error: 'Failed to create organization' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Assign org_admin role to creator
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'org_admin',
          org_id: org.id
        });

      if (roleError) {
        console.error('[org-management] Role assignment error:', roleError);
        // Rollback org creation
        await supabaseAdmin.from('orgs').delete().eq('id', org.id);
        return new Response(JSON.stringify({ error: 'Failed to assign admin role' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(`[org-management] Created org ${org.id} for user ${user.id}`);

      return new Response(JSON.stringify({ success: true, org }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user's organizations
    if (req.method === 'GET' && action === 'list') {
      const { data: roles } = await supabaseAdmin
        .from('user_roles')
        .select('org_id')
        .eq('user_id', user.id)
        .eq('role', 'org_admin');

      if (!roles || roles.length === 0) {
        return new Response(JSON.stringify({ orgs: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const orgIds = roles.map(r => r.org_id).filter(Boolean);
      
      const { data: orgs } = await supabaseAdmin
        .from('orgs')
        .select('*')
        .in('id', orgIds);

      return new Response(JSON.stringify({ orgs: orgs || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get organization events (paginated)
    if (req.method === 'GET' && action === 'events') {
      const orgId = url.searchParams.get('org_id');
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      
      if (!orgId) {
        return new Response(JSON.stringify({ error: 'org_id required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verify access
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

      const offset = (page - 1) * limit;

      // Get events with participant count
      const { data: events, count } = await supabaseAdmin
        .from('events')
        .select('*, event_participants(count)', { count: 'exact' })
        .eq('host_org_id', orgId)
        .order('starts_at', { ascending: false })
        .range(offset, offset + limit - 1);

      return new Response(JSON.stringify({
        events: events || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit)
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update organization
    if (req.method === 'PUT' && action === 'update') {
      const { org_id, name, contact_email } = await req.json();
      
      if (!org_id) {
        return new Response(JSON.stringify({ error: 'org_id required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verify access
      const { data: roleData } = await supabaseAdmin
        .from('user_roles')
        .select('id')
        .eq('user_id', user.id)
        .eq('role', 'org_admin')
        .eq('org_id', org_id)
        .maybeSingle();

      if (!roleData) {
        return new Response(JSON.stringify({ error: 'Not authorized' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const updates: any = { updated_at: new Date().toISOString() };
      if (name?.trim()) updates.name = name.trim();
      if (contact_email?.trim()) updates.contact_email = contact_email.trim();

      const { data: org, error: updateError } = await supabaseAdmin
        .from('orgs')
        .update(updates)
        .eq('id', org_id)
        .select()
        .single();

      if (updateError) {
        return new Response(JSON.stringify({ error: 'Failed to update organization' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, org }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Rollback import batch
    if (req.method === 'POST' && action === 'rollback') {
      const { batch_id } = await req.json();
      
      if (!batch_id) {
        return new Response(JSON.stringify({ error: 'batch_id required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get batch and verify access
      const { data: batch } = await supabaseAdmin
        .from('import_batches')
        .select('id, org_id, status')
        .eq('id', batch_id)
        .single();

      if (!batch) {
        return new Response(JSON.stringify({ error: 'Batch not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (batch.status === 'rolled_back') {
        return new Response(JSON.stringify({ error: 'Batch already rolled back' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verify access
      const { data: roleData } = await supabaseAdmin
        .from('user_roles')
        .select('id')
        .eq('user_id', user.id)
        .eq('role', 'org_admin')
        .eq('org_id', batch.org_id)
        .maybeSingle();

      if (!roleData) {
        return new Response(JSON.stringify({ error: 'Not authorized' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Delete events from this batch
      const { error: deleteError } = await supabaseAdmin
        .from('events')
        .delete()
        .eq('import_batch_id', batch_id);

      if (deleteError) {
        console.error('[org-management] Rollback delete error:', deleteError);
        return new Response(JSON.stringify({ error: 'Failed to delete events' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update batch status
      await supabaseAdmin
        .from('import_batches')
        .update({ status: 'rolled_back' })
        .eq('id', batch_id);

      console.log(`[org-management] Rolled back batch ${batch_id}`);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get import history
    if (req.method === 'GET' && action === 'imports') {
      const orgId = url.searchParams.get('org_id');
      
      if (!orgId) {
        return new Response(JSON.stringify({ error: 'org_id required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verify access
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

      const { data: imports } = await supabaseAdmin
        .from('import_batches')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(50);

      return new Response(JSON.stringify({ imports: imports || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[org-management] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
