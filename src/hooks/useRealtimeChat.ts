import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Message {
  id: string;
  content: string;
  created_at: string;
  moderated: boolean;
  user_id: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface TypingUser {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

export interface ReadReceipt {
  message_id: string;
  user_id: string;
  read_at: string;
}

interface UseRealtimeChatOptions {
  groupId: string;
  userId: string;
  userDisplayName: string;
  userAvatarUrl?: string | null;
}

export function useRealtimeChat({ groupId, userId, userDisplayName, userAvatarUrl }: UseRealtimeChatOptions) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [readReceipts, setReadReceipts] = useState<Map<string, string[]>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const presenceChannelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingRef = useRef<number>(0);

  // Fetch initial messages
  const fetchMessages = useCallback(async () => {
    console.log('[RealtimeChat] Fetching messages for group:', groupId);
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        created_at,
        moderated,
        user_id,
        profiles (
          display_name,
          avatar_url
        )
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[RealtimeChat] Error fetching messages:', error);
      return;
    }

    if (data) {
      console.log('[RealtimeChat] Fetched', data.length, 'messages');
      setMessages(data as unknown as Message[]);
    }
  }, [groupId]);

  // Fetch read receipts
  const fetchReadReceipts = useCallback(async () => {
    const { data } = await supabase
      .from('message_read_receipts')
      .select('message_id, user_id, read_at')
      .in('message_id', messages.map(m => m.id));

    if (data) {
      const receiptsMap = new Map<string, string[]>();
      data.forEach((receipt: ReadReceipt) => {
        const existing = receiptsMap.get(receipt.message_id) || [];
        existing.push(receipt.user_id);
        receiptsMap.set(receipt.message_id, existing);
      });
      setReadReceipts(receiptsMap);
    }
  }, [messages]);

  // Check if group is frozen
  const checkGroupStatus = useCallback(async () => {
    const { data } = await supabase
      .from('micro_groups')
      .select('frozen')
      .eq('id', groupId)
      .single();

    if (data) {
      setIsFrozen(data.frozen || false);
    }
  }, [groupId]);

  // Mark messages as read
  const markAsRead = useCallback(async (messageIds: string[]) => {
    if (messageIds.length === 0) return;

    const receipts = messageIds.map(id => ({
      message_id: id,
      user_id: userId,
    }));

    await supabase
      .from('message_read_receipts')
      .upsert(receipts, { onConflict: 'message_id,user_id' });
  }, [userId]);

  // Send typing indicator
  const sendTypingIndicator = useCallback(() => {
    const now = Date.now();
    // Throttle typing events to once per second
    if (now - lastTypingRef.current < 1000) return;
    lastTypingRef.current = now;

    if (presenceChannelRef.current) {
      presenceChannelRef.current.track({
        id: userId,
        display_name: userDisplayName,
        avatar_url: userAvatarUrl,
        typing: true,
        typing_at: now,
      });
    }

    // Clear typing after 3 seconds of inactivity
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      if (presenceChannelRef.current) {
        presenceChannelRef.current.track({
          id: userId,
          display_name: userDisplayName,
          avatar_url: userAvatarUrl,
          typing: false,
        });
      }
    }, 3000);
  }, [userId, userDisplayName, userAvatarUrl]);

  // Send message with moderation
  const sendMessage = useCallback(async (content: string): Promise<{ success: boolean; error?: string }> => {
    if (isFrozen) {
      return { success: false, error: 'This group has been frozen by an administrator.' };
    }

    console.log('[RealtimeChat] Sending message:', content.substring(0, 50));

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Check moderation first
      const moderationResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/moderation?action=check`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content, group_id: groupId }),
        }
      );

      const moderationResult = await moderationResponse.json();

      if (!moderationResult.allowed) {
        console.log('[RealtimeChat] Message blocked:', moderationResult.reason);
        return { success: false, error: moderationResult.message };
      }

      // Insert message directly (moderation passed)
      const { error } = await supabase
        .from('messages')
        .insert({
          group_id: groupId,
          user_id: userId,
          content,
          moderated: false,
        });

      if (error) {
        console.error('[RealtimeChat] Error inserting message:', error);
        return { success: false, error: 'Failed to send message' };
      }

      // Clear typing indicator
      if (presenceChannelRef.current) {
        presenceChannelRef.current.track({
          id: userId,
          display_name: userDisplayName,
          avatar_url: userAvatarUrl,
          typing: false,
        });
      }

      return { success: true };
    } catch (error) {
      console.error('[RealtimeChat] Send error:', error);
      return { success: false, error: 'Network error' };
    }
  }, [groupId, userId, userDisplayName, userAvatarUrl, isFrozen]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!groupId || !userId) return;

    console.log('[RealtimeChat] Setting up realtime subscriptions');
    
    fetchMessages();
    checkGroupStatus();

    // Message channel for postgres changes
    const messageChannel = supabase
      .channel(`messages-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          console.log('[RealtimeChat] New message received:', payload.new.id);
          
          // Fetch complete message with profile
          const { data } = await supabase
            .from('messages')
            .select(`
              id,
              content,
              created_at,
              moderated,
              user_id,
              profiles (
                display_name,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (data && !data.moderated) {
            setMessages((prev) => {
              // Avoid duplicates
              if (prev.some(m => m.id === data.id)) return prev;
              return [...prev, data as unknown as Message];
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('[RealtimeChat] Message channel status:', status);
        setIsConnected(status === 'SUBSCRIBED');
        setIsOffline(status === 'CHANNEL_ERROR' || status === 'TIMED_OUT');
      });

    channelRef.current = messageChannel;

    // Presence channel for typing indicators
    const presenceChannel = supabase.channel(`presence-${groupId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        console.log('[RealtimeChat] Presence sync:', state);
        
        const typing: TypingUser[] = [];
        Object.entries(state).forEach(([key, presences]) => {
          if (key !== userId) {
            const presence = presences[0] as any;
            if (presence?.typing) {
              typing.push({
                id: presence.id,
                display_name: presence.display_name,
                avatar_url: presence.avatar_url,
              });
            }
          }
        });
        setTypingUsers(typing);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('[RealtimeChat] User joined:', key);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('[RealtimeChat] User left:', key);
        setTypingUsers((prev) => prev.filter(u => u.id !== key));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track our own presence
          await presenceChannel.track({
            id: userId,
            display_name: userDisplayName,
            avatar_url: userAvatarUrl,
            typing: false,
            online_at: new Date().toISOString(),
          });
        }
      });

    presenceChannelRef.current = presenceChannel;

    return () => {
      console.log('[RealtimeChat] Cleaning up subscriptions');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [groupId, userId, userDisplayName, userAvatarUrl, fetchMessages, checkGroupStatus]);

  // Offline fallback polling
  useEffect(() => {
    if (isOffline) {
      console.log('[RealtimeChat] Offline - starting fallback polling');
      toast({
        title: 'Connection lost',
        description: 'Falling back to polling mode',
        variant: 'destructive',
      });

      pollIntervalRef.current = setInterval(() => {
        fetchMessages();
      }, 5000);

      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      };
    }
  }, [isOffline, fetchMessages, toast]);

  // Fetch read receipts when messages change
  useEffect(() => {
    if (messages.length > 0) {
      fetchReadReceipts();
    }
  }, [messages, fetchReadReceipts]);

  return {
    messages,
    typingUsers,
    readReceipts,
    isConnected,
    isOffline,
    isFrozen,
    sendMessage,
    sendTypingIndicator,
    markAsRead,
    refetch: fetchMessages,
  };
}
