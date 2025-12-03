import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Users, Wifi, WifiOff, Check, CheckCheck, Snowflake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeChat, Message, TypingUser } from '@/hooks/useRealtimeChat';
import { useCompatibilityMatrix } from '@/hooks/useVibeScore';
import { BestMatchTag, VibeScoreBadge } from '@/components/ui/vibe-score-badge';
import { format } from 'date-fns';

interface GroupInfo {
  id: string;
  status: string;
  meet_spot: string | null;
  frozen: boolean;
  event: {
    title: string;
  };
  members: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  }[];
}

export default function GroupChat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [newMessage, setNewMessage] = useState('');
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [sending, setSending] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { bestMatch } = useCompatibilityMatrix(eventId || undefined);

  const {
    messages,
    typingUsers,
    readReceipts,
    isConnected,
    isOffline,
    isFrozen,
    sendMessage,
    sendTypingIndicator,
    markAsRead,
  } = useRealtimeChat({
    groupId: id || '',
    userId: user?.id || '',
    userDisplayName: profile?.display_name || 'Anonymous',
    userAvatarUrl: profile?.avatar_url,
  });

  useEffect(() => {
    if (id && user) {
      fetchGroupInfo();
    }
  }, [id, user]);

  useEffect(() => {
    scrollToBottom();
    
    // Mark new messages as read
    if (messages.length > 0) {
      const unreadMessageIds = messages
        .filter(m => m.user_id !== user?.id)
        .filter(m => !readReceipts.get(m.id)?.includes(user?.id || ''))
        .map(m => m.id);
      
      if (unreadMessageIds.length > 0) {
        markAsRead(unreadMessageIds);
      }
    }
  }, [messages, user?.id, readReceipts, markAsRead]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchGroupInfo = async () => {
    const { data: groupData } = await supabase
      .from('micro_groups')
      .select(`
        id,
        status,
        meet_spot,
        frozen,
        events (
          title
        )
      `)
      .eq('id', id)
      .single();

    if (groupData) {
      // Get event ID for compatibility matrix
      const { data: groupEventData } = await supabase
        .from('micro_groups')
        .select('event_id')
        .eq('id', id)
        .single();
      
      if (groupEventData?.event_id) {
        setEventId(groupEventData.event_id);
      }
      
      // Get members
      const { data: membersData } = await supabase
        .from('micro_group_members')
        .select(`
          profiles (
            id,
            display_name,
            avatar_url
          )
        `)
        .eq('group_id', id);

      const members = membersData?.map((m: any) => m.profiles).filter(Boolean) || [];

      setGroupInfo({
        id: groupData.id,
        status: groupData.status,
        meet_spot: groupData.meet_spot,
        frozen: groupData.frozen || false,
        event: groupData.events as any,
        members
      });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || sending) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage('');

    const result = await sendMessage(messageContent);
    
    if (!result.success) {
      setNewMessage(messageContent);
      toast({
        title: 'Message not sent',
        description: result.error,
        variant: 'destructive',
      });
    }
    
    setSending(false);
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    sendTypingIndicator();
  };

  const getReadStatus = (message: Message): 'sent' | 'delivered' | 'read' => {
    const readers = readReceipts.get(message.id) || [];
    const otherReaders = readers.filter(r => r !== message.user_id);
    
    if (otherReaders.length > 0) return 'read';
    if (readers.length > 0) return 'delivered';
    return 'sent';
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/groups')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-semibold line-clamp-1">
                {groupInfo?.event?.title || 'Group Chat'}
              </h1>
              {(isFrozen || groupInfo?.frozen) && (
                <Badge variant="secondary" className="gap-1">
                  <Snowflake className="h-3 w-3" />
                  Frozen
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{groupInfo?.members.length || 0} members</span>
              {isConnected ? (
                <Wifi className="h-3 w-3 text-green-500 ml-2" />
              ) : isOffline ? (
                <WifiOff className="h-3 w-3 text-destructive ml-2" />
              ) : null}
            </div>
          </div>

          <div className="flex -space-x-2">
            {groupInfo?.members.slice(0, 3).map((member) => (
              <div key={member.id} className="relative">
                <Avatar className="h-8 w-8 border-2 border-card">
                  <AvatarImage src={member.avatar_url || undefined} />
                  <AvatarFallback className="text-xs bg-primary/20 text-primary">
                    {member.display_name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                {bestMatch?.user_id === member.id && (
                  <div className="absolute -top-1 -right-1">
                    <BestMatchTag />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <span className="text-3xl">👋</span>
            </div>
            <h3 className="font-semibold mb-1">Start the conversation!</h3>
            <p className="text-sm text-muted-foreground">
              Say hi to your group members
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((message) => {
              const isOwn = message.user_id === user.id;
              const readStatus = isOwn ? getReadStatus(message) : null;
              
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2 max-w-[80%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                    {!isOwn && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={message.profiles?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs bg-primary/20 text-primary">
                          {message.profiles?.display_name?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div>
                      {!isOwn && (
                        <span className="text-xs text-muted-foreground ml-1 mb-1 block">
                          {message.profiles?.display_name || 'Unknown'}
                        </span>
                      )}
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          isOwn
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-card border rounded-bl-md'
                        } ${message.moderated ? 'opacity-50' : ''}`}
                      >
                        {message.moderated ? (
                          <span className="italic text-sm">Message hidden</span>
                        ) : (
                          <p className="text-sm">{message.content}</p>
                        )}
                      </div>
                      <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(message.created_at), 'h:mm a')}
                        </span>
                        {isOwn && readStatus && (
                          <span className="ml-1">
                            {readStatus === 'read' ? (
                              <CheckCheck className="h-3 w-3 text-blue-500" />
                            ) : readStatus === 'delivered' ? (
                              <CheckCheck className="h-3 w-3 text-muted-foreground" />
                            ) : (
                              <Check className="h-3 w-3 text-muted-foreground" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        
        {/* Typing Indicator */}
        <AnimatePresence>
          {typingUsers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2"
            >
              <div className="flex -space-x-1">
                {typingUsers.slice(0, 3).map((user) => (
                  <Avatar key={user.id} className="h-6 w-6 border-2 border-background">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {user.display_name?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <div className="bg-muted px-3 py-2 rounded-2xl rounded-bl-md">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                {typingUsers.length === 1
                  ? `${typingUsers[0].display_name} is typing...`
                  : `${typingUsers.length} people are typing...`}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-background border-t p-4">
        {(isFrozen || groupInfo?.frozen) ? (
          <div className="flex items-center justify-center gap-2 text-muted-foreground py-2">
            <Snowflake className="h-4 w-4" />
            <span className="text-sm">This group has been frozen by an administrator</span>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              ref={inputRef}
              placeholder="Type a message..."
              value={newMessage}
              onChange={handleInputChange}
              className="flex-1 h-12"
              disabled={sending}
            />
            <Button
              type="submit"
              size="icon"
              className="h-12 w-12"
              disabled={!newMessage.trim() || sending}
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
        )}
        
        {isOffline && (
          <div className="flex items-center justify-center gap-2 text-destructive mt-2">
            <WifiOff className="h-4 w-4" />
            <span className="text-xs">Offline - polling every 5s</span>
          </div>
        )}
      </div>
    </div>
  );
}
