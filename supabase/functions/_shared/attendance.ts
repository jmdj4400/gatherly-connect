// Centralized attendance utilities

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface CheckInResult {
  success: boolean;
  error?: string;
  alreadyCheckedIn?: boolean;
  outsideWindow?: boolean;
  minutesBeforeStart?: number;
}

export interface AttendanceWindow {
  canCheckIn: boolean;
  reason?: string;
  minutesBeforeStart: number;
  windowStart: Date;
  windowEnd: Date;
}

const CHECK_IN_WINDOW_BEFORE_MINUTES = 30;
const CHECK_IN_WINDOW_AFTER_MINUTES = 60;

/**
 * Check if check-in is within valid time window
 */
export function getAttendanceWindow(eventStartsAt: string | Date): AttendanceWindow {
  const eventStart = new Date(eventStartsAt);
  const now = new Date();
  
  const windowStart = new Date(eventStart.getTime() - CHECK_IN_WINDOW_BEFORE_MINUTES * 60 * 1000);
  const windowEnd = new Date(eventStart.getTime() + CHECK_IN_WINDOW_AFTER_MINUTES * 60 * 1000);
  
  const minutesBeforeStart = Math.floor((eventStart.getTime() - now.getTime()) / (60 * 1000));
  
  if (now < windowStart) {
    return {
      canCheckIn: false,
      reason: `Check-in opens ${CHECK_IN_WINDOW_BEFORE_MINUTES} minutes before event`,
      minutesBeforeStart,
      windowStart,
      windowEnd,
    };
  }
  
  if (now > windowEnd) {
    return {
      canCheckIn: false,
      reason: 'Check-in window has closed',
      minutesBeforeStart,
      windowStart,
      windowEnd,
    };
  }
  
  return {
    canCheckIn: true,
    minutesBeforeStart,
    windowStart,
    windowEnd,
  };
}

/**
 * Check if user has already checked in
 */
export async function hasCheckedIn(
  supabase: SupabaseClient,
  userId: string,
  eventId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('attendance_records')
    .select('id')
    .eq('user_id', userId)
    .eq('event_id', eventId)
    .maybeSingle();

  return !error && !!data;
}

/**
 * Record attendance check-in with duplicate protection
 */
export async function recordCheckIn(
  supabase: SupabaseClient,
  userId: string,
  eventId: string,
  orgId?: string
): Promise<CheckInResult> {
  // Check for duplicate
  const alreadyCheckedIn = await hasCheckedIn(supabase, userId, eventId);
  if (alreadyCheckedIn) {
    console.log(`[attendance] Duplicate check-in attempt: user ${userId}, event ${eventId}`);
    return { success: false, error: 'Already checked in', alreadyCheckedIn: true };
  }

  // Get event to validate window
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('starts_at, host_org_id')
    .eq('id', eventId)
    .single();

  if (eventError || !event) {
    return { success: false, error: 'Event not found' };
  }

  const window = getAttendanceWindow(event.starts_at);
  if (!window.canCheckIn) {
    console.log(`[attendance] Outside window: user ${userId}, event ${eventId} - ${window.reason}`);
    return { success: false, error: window.reason, outsideWindow: true };
  }

  // Record check-in
  const { error: insertError } = await supabase
    .from('attendance_records')
    .insert({
      user_id: userId,
      event_id: eventId,
      org_id: orgId || event.host_org_id,
      checked_in_at: new Date().toISOString(),
      minutes_before_start: window.minutesBeforeStart,
    });

  if (insertError) {
    // Handle unique constraint violation (duplicate)
    if (insertError.code === '23505') {
      return { success: false, error: 'Already checked in', alreadyCheckedIn: true };
    }
    console.error('[attendance] Failed to record check-in:', insertError);
    return { success: false, error: insertError.message };
  }

  // Update event_participants attendance status
  await supabase
    .from('event_participants')
    .update({
      attendance_status: 'checked_in',
      attendance_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('event_id', eventId);

  console.log(`[analytics] check_in`, {
    userId,
    eventId,
    minutesBeforeStart: window.minutesBeforeStart,
  });

  return {
    success: true,
    minutesBeforeStart: window.minutesBeforeStart,
  };
}

/**
 * Get ISO week number for streak tracking
 */
export function getWeekNumber(date: Date): { week: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { week, year: d.getUTCFullYear() };
}

/**
 * Generate idempotency hash for streak updates
 */
export function generateStreakHash(userId: string, orgId: string, week: number, year: number): string {
  return `${userId}-${orgId}-${year}-${week}`;
}

/**
 * Update user streak with idempotency
 */
export async function updateStreak(
  supabase: SupabaseClient,
  userId: string,
  orgId: string,
  category?: string
): Promise<{ currentStreak: number; longestStreak: number }> {
  const { week, year } = getWeekNumber(new Date());
  const updateHash = generateStreakHash(userId, orgId, week, year);

  // Get existing streak
  const { data: existing } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .eq('category', category || null)
    .maybeSingle();

  // Check idempotency
  if (existing?.last_update_hash === updateHash) {
    console.log(`[attendance] Streak already updated for this week: ${updateHash}`);
    return {
      currentStreak: existing.current_streak,
      longestStreak: existing.longest_streak,
    };
  }

  let currentStreak = 1;
  let longestStreak = 1;

  if (existing) {
    // Check if consecutive week
    const lastWeek = existing.last_attendance_week;
    const lastYear = existing.last_attendance_year;
    
    const isConsecutive = 
      (lastYear === year && lastWeek === week - 1) ||
      (lastYear === year - 1 && lastWeek === 52 && week === 1);

    if (isConsecutive) {
      currentStreak = existing.current_streak + 1;
    }
    
    longestStreak = Math.max(existing.longest_streak, currentStreak);

    await supabase
      .from('user_streaks')
      .update({
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_attendance_week: week,
        last_attendance_year: year,
        last_update_hash: updateHash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('user_streaks')
      .insert({
        user_id: userId,
        org_id: orgId,
        category,
        current_streak: 1,
        longest_streak: 1,
        last_attendance_week: week,
        last_attendance_year: year,
        last_update_hash: updateHash,
      });
  }

  console.log(`[analytics] streak_updated`, {
    userId,
    orgId,
    currentStreak,
    longestStreak,
    week,
    year,
  });

  return { currentStreak, longestStreak };
}
