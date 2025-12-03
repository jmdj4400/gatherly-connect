// Centralized freeze logic utilities

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface FreezeStatus {
  isFrozen: boolean;
  freezeTime: Date | null;
  hoursUntilFreeze: number | null;
  canOverride: boolean;
}

export async function getEventFreezeStatus(
  supabase: SupabaseClient,
  eventId: string
): Promise<FreezeStatus | null> {
  const { data: event, error } = await supabase
    .from('events')
    .select('starts_at, freeze_hours_before, freeze_override_lock')
    .eq('id', eventId)
    .single();

  if (error || !event) {
    console.error('[freeze] Failed to get event:', error);
    return null;
  }

  const eventStart = new Date(event.starts_at);
  const freezeHours = event.freeze_hours_before ?? 2;
  const freezeTime = new Date(eventStart.getTime() - freezeHours * 60 * 60 * 1000);
  const now = new Date();
  
  const isFrozen = now >= freezeTime;
  const hoursUntilFreeze = isFrozen ? null : (freezeTime.getTime() - now.getTime()) / (60 * 60 * 1000);

  return {
    isFrozen,
    freezeTime,
    hoursUntilFreeze,
    canOverride: !event.freeze_override_lock,
  };
}

export async function isEventFrozen(
  supabase: SupabaseClient,
  eventId: string
): Promise<boolean> {
  const status = await getEventFreezeStatus(supabase, eventId);
  return status?.isFrozen ?? false;
}

export async function checkFreezeGuard(
  supabase: SupabaseClient,
  eventId: string,
  action: string
): Promise<{ allowed: boolean; reason?: string }> {
  const status = await getEventFreezeStatus(supabase, eventId);
  
  if (!status) {
    return { allowed: false, reason: 'Event not found' };
  }

  if (status.isFrozen) {
    console.log(`[freeze] Blocked ${action} - event ${eventId} is frozen`);
    return { 
      allowed: false, 
      reason: `Groups are frozen. Event starts soon.` 
    };
  }

  return { allowed: true };
}

export async function freezeEventGroups(
  supabase: SupabaseClient,
  eventId: string,
  frozenBy: string
): Promise<{ success: boolean; count: number; error?: string }> {
  console.log(`[freeze] Freezing all groups for event ${eventId}`);

  // Check for override lock
  const { data: event } = await supabase
    .from('events')
    .select('freeze_override_lock')
    .eq('id', eventId)
    .single();

  if (event?.freeze_override_lock) {
    return { success: false, count: 0, error: 'Freeze override is locked' };
  }

  const { data, error } = await supabase
    .from('micro_groups')
    .update({
      frozen: true,
      frozen_at: new Date().toISOString(),
      frozen_by: frozenBy,
      status: 'locked',
    })
    .eq('event_id', eventId)
    .eq('frozen', false)
    .select('id');

  if (error) {
    console.error('[freeze] Failed to freeze groups:', error);
    return { success: false, count: 0, error: error.message };
  }

  console.log(`[freeze] Froze ${data?.length || 0} groups for event ${eventId}`);
  return { success: true, count: data?.length || 0 };
}

export async function unfreezeEventGroups(
  supabase: SupabaseClient,
  eventId: string
): Promise<{ success: boolean; count: number; error?: string }> {
  console.log(`[freeze] Unfreezing all groups for event ${eventId}`);

  const { data, error } = await supabase
    .from('micro_groups')
    .update({
      frozen: false,
      frozen_at: null,
      frozen_by: null,
      status: 'forming',
    })
    .eq('event_id', eventId)
    .eq('frozen', true)
    .select('id');

  if (error) {
    console.error('[freeze] Failed to unfreeze groups:', error);
    return { success: false, count: 0, error: error.message };
  }

  console.log(`[freeze] Unfroze ${data?.length || 0} groups for event ${eventId}`);
  return { success: true, count: data?.length || 0 };
}

export async function setFreezeOverrideLock(
  supabase: SupabaseClient,
  eventId: string,
  locked: boolean
): Promise<boolean> {
  const { error } = await supabase
    .from('events')
    .update({ freeze_override_lock: locked })
    .eq('id', eventId);

  if (error) {
    console.error('[freeze] Failed to set override lock:', error);
    return false;
  }

  console.log(`[freeze] Override lock ${locked ? 'enabled' : 'disabled'} for event ${eventId}`);
  return true;
}
