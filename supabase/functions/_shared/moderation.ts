// Centralized moderation utilities

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Fallback profanity wordlist when AI is unavailable
export const PROFANITY_WORDLIST = [
  'fuck', 'shit', 'ass', 'bitch', 'damn', 'crap', 'bastard',
  'dick', 'cock', 'pussy', 'cunt', 'whore', 'slut',
  'nigger', 'nigga', 'faggot', 'fag', 'retard',
  'kill', 'murder', 'rape', 'suicide',
  'nazi', 'hitler',
];

export interface ModerationResult {
  allowed: boolean;
  flagged: boolean;
  reason?: string;
  categories?: string[];
}

/**
 * Check content against fallback profanity wordlist
 */
export function checkFallbackProfanity(content: string): ModerationResult {
  const lowerContent = content.toLowerCase();
  const words = lowerContent.split(/\s+/);
  
  const flaggedWords = words.filter(word => 
    PROFANITY_WORDLIST.some(profanity => 
      word.includes(profanity)
    )
  );
  
  if (flaggedWords.length > 0) {
    return {
      allowed: false,
      flagged: true,
      reason: 'Content contains prohibited words',
      categories: ['profanity'],
    };
  }
  
  return { allowed: true, flagged: false };
}

/**
 * Check if user is currently muted in a group
 */
export async function checkUserMuted(
  supabase: SupabaseClient,
  userId: string,
  groupId: string
): Promise<{ muted: boolean; expiresAt?: string; reason?: string }> {
  const { data, error } = await supabase
    .from('user_mutes')
    .select('muted_until, reason')
    .eq('user_id', userId)
    .eq('group_id', groupId)
    .gt('muted_until', new Date().toISOString())
    .maybeSingle();

  if (error || !data) {
    return { muted: false };
  }

  return {
    muted: true,
    expiresAt: data.muted_until,
    reason: data.reason || undefined,
  };
}

/**
 * Check if user is banned
 */
export async function checkUserBanned(
  supabase: SupabaseClient,
  userId: string
): Promise<{ banned: boolean; permanent?: boolean; reason?: string }> {
  const { data, error } = await supabase
    .from('user_bans')
    .select('permanent, banned_until, reason')
    .eq('user_id', userId)
    .or(`permanent.eq.true,banned_until.gt.${new Date().toISOString()}`)
    .maybeSingle();

  if (error || !data) {
    return { banned: false };
  }

  return {
    banned: true,
    permanent: data.permanent || false,
    reason: data.reason || undefined,
  };
}

/**
 * Mute a user in a group
 */
export async function muteUser(
  supabase: SupabaseClient,
  userId: string,
  groupId: string,
  durationMinutes: number,
  reason: string,
  mutedBy?: string
): Promise<boolean> {
  const mutedUntil = new Date(Date.now() + durationMinutes * 60 * 1000);
  
  const { error } = await supabase
    .from('user_mutes')
    .upsert({
      user_id: userId,
      group_id: groupId,
      muted_until: mutedUntil.toISOString(),
      reason,
      muted_by: mutedBy,
    }, {
      onConflict: 'user_id,group_id',
    });

  if (error) {
    console.error('[moderation] Failed to mute user:', error);
    return false;
  }

  console.log(`[moderation] Muted user ${userId} in group ${groupId} until ${mutedUntil.toISOString()}`);
  return true;
}

/**
 * Create a moderation report
 */
export async function createReport(
  supabase: SupabaseClient,
  reportedUserId: string,
  reason: string,
  options: {
    reporterId?: string;
    groupId?: string;
    messageId?: string;
    moderationFlags?: Record<string, unknown>;
  }
): Promise<string | null> {
  const { data, error } = await supabase
    .from('reports')
    .insert({
      reported_user_id: reportedUserId,
      reporter_id: options.reporterId,
      group_id: options.groupId,
      message_id: options.messageId,
      reason,
      moderation_flags: options.moderationFlags,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) {
    console.error('[moderation] Failed to create report:', error);
    return null;
  }

  console.log(`[moderation] Created report ${data.id} for user ${reportedUserId}`);
  return data.id;
}

/**
 * Log moderation action for analytics
 */
export function logModerationAction(
  action: string,
  userId: string,
  result: ModerationResult,
  context?: Record<string, unknown>
): void {
  console.log(`[analytics] moderation_${action}`, {
    userId,
    flagged: result.flagged,
    categories: result.categories,
    ...context,
  });
}
