import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Users, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { format } from 'date-fns';

interface Message {
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

interface GroupInfo {
  id: string;
  status: string;
  meet_spot: string | null;
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
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id && user) {
      fetchGroupInfo();
      fetchMessages();
      subscribeToMessages();
    }
  }, [id, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        events (
          title
        )
      `)
      .eq('id', id)
      .single();

    if (groupData) {
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
        event: groupData.events as any,
        members
      });
    }
  };

  const fetchMessages = async () => {
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
      .eq('group_id', id)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data as unknown as Message[]);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`group-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${id}`
        },
        async (payload) => {
          // Fetch the complete message with profile
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

          if (data) {
            setMessages((prev) => [...prev, data as unknown as Message]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || sending) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage('');

    const { error } = await supabase
      .from('messages')
      .insert({
        group_id: id,
        user_id: user.id,
        content: messageContent
      });

    if (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageContent);
    }
    
    setSending(false);
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
            <h1 className="font-semibold line-clamp-1">
              {groupInfo?.event?.title || 'Group Chat'}
            </h1>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{groupInfo?.members.length || 0} members</span>
            </div>
          </div>

          <div className="flex -space-x-2">
            {groupInfo?.members.slice(0, 3).map((member) => (
              <Avatar key={member.id} className="h-8 w-8 border-2 border-card">
                <AvatarImage src={member.avatar_url || undefined} />
                <AvatarFallback className="text-xs bg-primary/20 text-primary">
                  {member.display_name?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
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
                      <span className={`text-xs text-muted-foreground mt-1 block ${isOwn ? 'text-right' : ''}`}>
                        {format(new Date(message.created_at), 'h:mm a')}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-background border-t p-4">
        <form onSubmit={sendMessage} className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 h-12"
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
      </div>
    </div>
  );
}
