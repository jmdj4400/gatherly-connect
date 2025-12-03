// Centralized permissions utilities

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export type AppRole = 'admin' | 'org_owner' | 'org_admin' | 'org_helper' | 'user';

export const RoleHierarchy: Record<AppRole, number> = {
  admin: 100,
  org_owner: 80,
  org_admin: 60,
  org_helper: 40,
  user: 20,
};

export async function getUserRole(
  supabase: SupabaseClient,
  userId: string,
  orgId?: string
): Promise<AppRole | null> {
  const query = supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if (orgId) {
    query.eq('org_id', orgId);
  }

  const { data, error } = await query.maybeSingle();
  
  if (error || !data) {
    return null;
  }
  
  return data.role as AppRole;
}

export async function hasRole(
  supabase: SupabaseClient,
  userId: string,
  requiredRole: AppRole,
  orgId?: string
): Promise<boolean> {
  const userRole = await getUserRole(supabase, userId, orgId);
  
  if (!userRole) {
    return false;
  }
  
  return RoleHierarchy[userRole] >= RoleHierarchy[requiredRole];
}

export async function isOrgMember(
  supabase: SupabaseClient,
  userId: string,
  orgId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('id')
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .in('role', ['org_owner', 'org_admin', 'org_helper'])
    .maybeSingle();

  return !error && !!data;
}

export async function isOrgAdmin(
  supabase: SupabaseClient,
  userId: string,
  orgId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('id')
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .in('role', ['org_owner', 'org_admin'])
    .maybeSingle();

  return !error && !!data;
}

export async function isPlatformAdmin(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('id')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .is('org_id', null)
    .maybeSingle();

  return !error && !!data;
}

export async function canManageEvent(
  supabase: SupabaseClient,
  userId: string,
  eventId: string
): Promise<boolean> {
  // First check if user is platform admin
  if (await isPlatformAdmin(supabase, userId)) {
    return true;
  }

  // Get event's org
  const { data: event, error } = await supabase
    .from('events')
    .select('host_org_id')
    .eq('id', eventId)
    .single();

  if (error || !event?.host_org_id) {
    return false;
  }

  return isOrgAdmin(supabase, userId, event.host_org_id);
}

export function logPermissionCheck(
  action: string,
  userId: string,
  result: boolean,
  context?: Record<string, unknown>
): void {
  console.log(`[permissions] ${action}`, {
    userId,
    result: result ? 'allowed' : 'denied',
    ...context,
  });
}
