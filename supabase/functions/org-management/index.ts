import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ORG_ROLES = ['org_owner', 'org_admin', 'org_helper'];

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

    // Helper to get user's org role
    const getUserOrgRole = async (userId: string, orgId: string) => {
      const { data } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('org_id', orgId)
        .in('role', ORG_ROLES)
        .maybeSingle();
      return data?.role || null;
    };

    // Helper to log activity
    const logActivity = async (orgId: string, action: string, targetUserId?: string, metadata?: Record<string, unknown>) => {
      await supabaseAdmin.from('org_activity_log').insert({
        org_id: orgId,
        user_id: user.id,
        action,
        target_user_id: targetUserId || null,
        metadata: metadata || null,
      });
    };

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // Handle POST with JSON body for new team management actions
    if (req.method === 'POST' && !action) {
      const body = await req.json();
      const bodyAction = body.action;

      switch (bodyAction) {
        case 'create_org': {
          const { name, contact_email } = body;
          
          if (!name?.trim()) {
            return new Response(JSON.stringify({ error: 'Organization name is required' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          const { data: org, error: orgError } = await supabaseAdmin
            .from('orgs')
            .insert({ name: name.trim(), contact_email: contact_email?.trim() || user.email })
            .select()
            .single();

          if (orgError || !org) {
            console.error('[org-management] Create org error:', orgError);
            return new Response(JSON.stringify({ error: 'Failed to create organization' }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          // Assign org_owner role to creator
          const { error: roleError } = await supabaseAdmin
            .from('user_roles')
            .insert({ user_id: user.id, role: 'org_owner', org_id: org.id });

          if (roleError) {
            console.error('[org-management] Role assignment error:', roleError);
            await supabaseAdmin.from('orgs').delete().eq('id', org.id);
            return new Response(JSON.stringify({ error: 'Failed to assign owner role' }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          await logActivity(org.id, 'org_created', undefined, { name: name.trim() });

          return new Response(JSON.stringify({ org }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        case 'invite_member': {
          const { org_id, email, role } = body;
          
          const requesterRole = await getUserOrgRole(user.id, org_id);
          if (!requesterRole || !['org_owner', 'org_admin'].includes(requesterRole)) {
            return new Response(JSON.stringify({ error: 'Permission denied' }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          // Only org_owner can add org_admin or org_owner
          if (['org_owner', 'org_admin'].includes(role) && requesterRole !== 'org_owner') {
            return new Response(JSON.stringify({ error: 'Only owners can add admins' }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          // Find user by email
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('email', email)
            .maybeSingle();

          if (!profile) {
            return new Response(JSON.stringify({ error: 'User not found' }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          // Check if already a member
          const existingRole = await getUserOrgRole(profile.id, org_id);
          if (existingRole) {
            return new Response(JSON.stringify({ error: 'User is already a member' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          const { error: insertError } = await supabaseAdmin
            .from('user_roles')
            .insert({ user_id: profile.id, org_id, role });

          if (insertError) throw insertError;

          await logActivity(org_id, 'member_added', profile.id, { role, email });

          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        case 'change_role': {
          const { org_id, target_user_id, new_role } = body;
          
          const requesterRole = await getUserOrgRole(user.id, org_id);
          if (requesterRole !== 'org_owner') {
            return new Response(JSON.stringify({ error: 'Only owners can change roles' }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          if (target_user_id === user.id) {
            return new Response(JSON.stringify({ error: 'Cannot change own role' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          const { error: updateError } = await supabaseAdmin
            .from('user_roles')
            .update({ role: new_role })
            .eq('user_id', target_user_id)
            .eq('org_id', org_id)
            .in('role', ORG_ROLES);

          if (updateError) throw updateError;

          await logActivity(org_id, 'role_changed', target_user_id, { new_role });

          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        case 'remove_member': {
          const { org_id, target_user_id } = body;
          
          const requesterRole = await getUserOrgRole(user.id, org_id);
          if (!requesterRole || !['org_owner', 'org_admin'].includes(requesterRole)) {
            return new Response(JSON.stringify({ error: 'Permission denied' }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          if (target_user_id === user.id) {
            return new Response(JSON.stringify({ error: 'Cannot remove yourself' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          const targetRole = await getUserOrgRole(target_user_id, org_id);
          if (['org_owner', 'org_admin'].includes(targetRole || '') && requesterRole !== 'org_owner') {
            return new Response(JSON.stringify({ error: 'Only owners can remove admins' }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          const { error: deleteError } = await supabaseAdmin
            .from('user_roles')
            .delete()
            .eq('user_id', target_user_id)
            .eq('org_id', org_id)
            .in('role', ORG_ROLES);

          if (deleteError) throw deleteError;

          await logActivity(org_id, 'member_removed', target_user_id);

          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        case 'get_members': {
          const { org_id } = body;
          
          const requesterRole = await getUserOrgRole(user.id, org_id);
          if (!requesterRole) {
            return new Response(JSON.stringify({ error: 'Not a member' }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          const { data: members, error } = await supabaseAdmin
            .from('user_roles')
            .select(`
              id,
              user_id,
              role,
              created_at,
              profiles:user_id (
                id,
                display_name,
                email,
                avatar_url
              )
            `)
            .eq('org_id', org_id)
            .in('role', ORG_ROLES);

          if (error) throw error;

          return new Response(JSON.stringify({ members, requester_role: requesterRole }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        case 'get_activity_log': {
          const { org_id, limit = 50 } = body;
          
          const requesterRole = await getUserOrgRole(user.id, org_id);
          if (!requesterRole) {
            return new Response(JSON.stringify({ error: 'Not a member' }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          const { data: logs, error } = await supabaseAdmin
            .from('org_activity_log')
            .select(`
              id,
              action,
              target_user_id,
              metadata,
              created_at,
              profiles:user_id (
                display_name,
                email
              )
            `)
            .eq('org_id', org_id)
            .order('created_at', { ascending: false })
            .limit(limit);

          if (error) throw error;

          return new Response(JSON.stringify({ logs }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        case 'get_user_orgs': {
          const { data: orgs, error } = await supabaseAdmin
            .from('user_roles')
            .select(`
              role,
              org_id,
              orgs:org_id (
                id,
                name,
                contact_email
              )
            `)
            .eq('user_id', user.id)
            .in('role', ORG_ROLES);

          if (error) throw error;

          return new Response(JSON.stringify({ orgs }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        default:
          break;
      }
    }

    // Legacy query param based actions
    // Create new organization
    if (req.method === 'POST' && action === 'create') {
      const { name, contact_email } = await req.json();
      
      if (!name?.trim()) {
        return new Response(JSON.stringify({ error: 'Organization name is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

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

      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: user.id, role: 'org_admin', org_id: org.id });

      if (roleError) {
        console.error('[org-management] Role assignment error:', roleError);
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
        .select('org_id, role')
        .eq('user_id', user.id)
        .in('role', ORG_ROLES);

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

      const requesterRole = await getUserOrgRole(user.id, orgId);
      if (!requesterRole) {
        return new Response(JSON.stringify({ error: 'Not authorized' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const offset = (page - 1) * limit;

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

      const requesterRole = await getUserOrgRole(user.id, org_id);
      if (!requesterRole || !['org_owner', 'org_admin'].includes(requesterRole)) {
        return new Response(JSON.stringify({ error: 'Not authorized' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
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

      const requesterRole = await getUserOrgRole(user.id, batch.org_id!);
      if (!requesterRole || !['org_owner', 'org_admin'].includes(requesterRole)) {
        return new Response(JSON.stringify({ error: 'Not authorized' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

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

      const requesterRole = await getUserOrgRole(user.id, orgId);
      if (!requesterRole) {
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
