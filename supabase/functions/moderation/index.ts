import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_CONTENT_LENGTH = 5000;

function isValidUUID(value: unknown): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

interface ModerationInput {
  content: string;
  group_id: string;
}

function validateModerationInput(input: unknown): { success: boolean; data?: ModerationInput; error?: string } {
  if (typeof input !== 'object' || input === null) {
    return { success: false, error: 'Request body must be a JSON object' };
  }
  
  const data = input as Record<string, unknown>;
  
  if (!isNonEmptyString(data.content)) {
    return { success: false, error: 'content must be a non-empty string' };
  }
  
  if ((data.content as string).length > MAX_CONTENT_LENGTH) {
    return { success: false, error: `content must not exceed ${MAX_CONTENT_LENGTH} characters` };
  }
  
  if (!isValidUUID(data.group_id)) {
    return { success: false, error: 'group_id must be a valid UUID' };
  }
  
  return { 
    success: true, 
    data: { 
      content: (data.content as string).trim(), 
      group_id: data.group_id as string 
    } 
  };
}

// Fallback profanity wordlist when AI moderation fails
const PROFANITY_WORDLIST = [
  'fuck', 'shit', 'ass', 'bitch', 'damn', 'crap', 'piss', 'dick', 'cock', 
  'pussy', 'asshole', 'bastard', 'slut', 'whore', 'nigger', 'faggot', 
  'retard', 'kill yourself', 'kys', 'nazi', 'rape', 'molest'
];

// Check content against fallback wordlist
function checkFallbackProfanity(content: string): { flagged: boolean; reason?: string } {
  const lowerContent = content.toLowerCase();
  for (const word of PROFANITY_WORDLIST) {
    if (lowerContent.includes(word)) {
      return { flagged: true, reason: `Contains prohibited word: ${word}` };
    }
  }
  return { flagged: false };
}

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
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
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

    // Moderate a message before sending
    if (req.method === 'POST' && action === 'check') {
      let rawInput: unknown;
      try {
        rawInput = await req.json();
      } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const validation = validateModerationInput(rawInput);
      if (!validation.success || !validation.data) {
        return new Response(JSON.stringify({ error: validation.error || 'Invalid input' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const { content, group_id } = validation.data;

      // Check if group is frozen
      const { data: group } = await supabaseAdmin
        .from('micro_groups')
        .select('id, frozen')
        .eq('id', group_id)
        .single();

      if (group?.frozen) {
        return new Response(JSON.stringify({ 
          allowed: false, 
          reason: 'group_frozen',
          message: 'This group chat has been frozen by an administrator.'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if user is muted
      const { data: mute } = await supabaseAdmin
        .from('user_mutes')
        .select('id, muted_until')
        .eq('user_id', user.id)
        .eq('group_id', group_id)
        .gt('muted_until', new Date().toISOString())
        .maybeSingle();

      if (mute) {
        const muteEnds = new Date(mute.muted_until);
        const minutesLeft = Math.ceil((muteEnds.getTime() - Date.now()) / 60000);
        return new Response(JSON.stringify({ 
          allowed: false, 
          reason: 'user_muted',
          message: `You are muted for ${minutesLeft} more minutes.`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if user is banned
      const { data: ban } = await supabaseAdmin
        .from('user_bans')
        .select('id, permanent, banned_until')
        .eq('user_id', user.id)
        .maybeSingle();

      if (ban) {
        if (ban.permanent || (ban.banned_until && new Date(ban.banned_until) > new Date())) {
          return new Response(JSON.stringify({ 
            allowed: false, 
            reason: 'user_banned',
            message: 'Your account has been banned.'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // Use Lovable AI for content moderation
      let flagged = false;
      let moderationFlags: any = null;

      if (lovableApiKey) {
        try {
          const moderationResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${lovableApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash-lite',
              messages: [
                {
                  role: 'system',
                  content: `You are a content moderation system. Analyze the following message and determine if it violates community guidelines.
                  
                  Flag content that contains:
                  - Hate speech or discrimination
                  - Harassment or bullying
                  - Sexual content or solicitation
                  - Violence or threats
                  - Spam or scam content
                  - Personal information sharing
                  
                  Respond with ONLY valid JSON in this exact format:
                  {"flagged": true/false, "categories": ["category1", "category2"], "reason": "brief explanation"}`
                },
                { role: 'user', content: content }
              ],
            }),
          });

          if (moderationResponse.ok) {
            const aiResult = await moderationResponse.json();
            const aiContent = aiResult.choices?.[0]?.message?.content || '';
            
            try {
              // Try to parse JSON from response
              const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                moderationFlags = JSON.parse(jsonMatch[0]);
                flagged = moderationFlags.flagged === true;
              }
            } catch (parseError) {
              console.error('[moderation] Failed to parse AI response:', parseError);
              // Fall back to wordlist check
              const fallbackResult = checkFallbackProfanity(content);
              if (fallbackResult.flagged) {
                flagged = true;
                moderationFlags = { flagged: true, categories: ['profanity'], reason: fallbackResult.reason };
              }
            }
          } else {
            console.error('[moderation] AI API error, using fallback');
            const fallbackResult = checkFallbackProfanity(content);
            if (fallbackResult.flagged) {
              flagged = true;
              moderationFlags = { flagged: true, categories: ['profanity'], reason: fallbackResult.reason };
            }
          }
        } catch (aiError) {
          console.error('[moderation] AI moderation error:', aiError);
          // Use fallback wordlist
          const fallbackResult = checkFallbackProfanity(content);
          if (fallbackResult.flagged) {
            flagged = true;
            moderationFlags = { flagged: true, categories: ['profanity'], reason: fallbackResult.reason };
          }
        }
      } else {
        // No AI key, use fallback only
        console.log('[moderation] No AI key, using fallback wordlist');
        const fallbackResult = checkFallbackProfanity(content);
        if (fallbackResult.flagged) {
          flagged = true;
          moderationFlags = { flagged: true, categories: ['profanity'], reason: fallbackResult.reason };
        }
      }

      if (flagged && moderationFlags) {
        // Create report
        await supabaseAdmin
          .from('reports')
          .insert({
            reported_user_id: user.id,
            group_id: group_id,
            reason: 'auto_moderation',
            moderation_flags: moderationFlags,
            status: 'pending'
          });

        // Mute user for 10 minutes
        const muteUntil = new Date(Date.now() + 10 * 60 * 1000);
        await supabaseAdmin
          .from('user_mutes')
          .insert({
            user_id: user.id,
            group_id: group_id,
            muted_until: muteUntil.toISOString(),
            reason: `Auto-moderation: ${moderationFlags.reason || 'Content violation'}`
          });

        console.log(`[analytics] message_flagged: user=${user.id}, group=${group_id}, categories=${moderationFlags.categories?.join(',')}`);

        return new Response(JSON.stringify({ 
          allowed: false, 
          reason: 'content_flagged',
          message: 'Your message was flagged for violating community guidelines. You have been muted for 10 minutes.',
          moderated: true
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ allowed: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send message with moderation
    if (req.method === 'POST' && action === 'send') {
      let rawInput: unknown;
      try {
        rawInput = await req.json();
      } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const validation = validateModerationInput(rawInput);
      if (!validation.success || !validation.data) {
        return new Response(JSON.stringify({ error: validation.error || 'Invalid input' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const { content, group_id } = validation.data;

      // First check moderation
      const checkResult = await fetch(`${supabaseUrl}/functions/v1/moderation?action=check`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, group_id })
      });

      const checkData = await checkResult.json();
      
      if (!checkData.allowed) {
        return new Response(JSON.stringify(checkData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Insert message
      const { data: message, error: insertError } = await supabaseAdmin
        .from('messages')
        .insert({
          content,
          group_id,
          user_id: user.id,
          moderated: false
        })
        .select()
        .single();

      if (insertError) {
        console.error('[moderation] Insert error:', insertError);
        return new Response(JSON.stringify({ error: 'Failed to send message' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[moderation] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
