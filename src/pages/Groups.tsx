import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Calendar, MapPin, MessageCircle, ChevronRight, Share2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BottomNav } from '@/components/layout/BottomNav';
import { ShareMomentModal } from '@/components/share/ShareMomentModal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { format } from 'date-fns';

interface GroupWithDetails {
  id: string;
  status: string;
  meet_spot: string | null;
  meet_time: string | null;
  event: {
    id: string;
    title: string;
    starts_at: string;
    venue_name: string | null;
    image_url: string | null;
  };
  members: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  }[];
}

export default function Groups() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [groups, setGroups] = useState<GroupWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupWithDetails | null>(null);

  useEffect(() => {
    if (user) {
      fetchGroups();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchGroups = async () => {
    const { data: membershipData } = await supabase
      .from('micro_group_members')
      .select(`
        group_id,
        micro_groups (
          id,
          status,
          meet_spot,
          meet_time,
          event_id
        )
      `)
      .eq('user_id', user?.id);

    if (!membershipData || membershipData.length === 0) {
      setGroups([]);
      setLoading(false);
      return;
    }

    const groupsWithDetails: GroupWithDetails[] = [];

    for (const membership of membershipData) {
      const group = membership.micro_groups as any;
      if (!group) continue;

      const { data: eventData } = await supabase
        .from('events')
        .select('id, title, starts_at, venue_name, image_url')
        .eq('id', group.event_id)
        .single();

      const { data: membersData } = await supabase
        .from('micro_group_members')
        .select(`
          profiles (
            id,
            display_name,
            avatar_url
          )
        `)
        .eq('group_id', group.id);

      const members = membersData?.map((m: any) => m.profiles).filter(Boolean) || [];

      groupsWithDetails.push({
        id: group.id,
        status: group.status,
        meet_spot: group.meet_spot,
        meet_time: group.meet_time,
        event: eventData || { id: '', title: 'Unknown Event', starts_at: '', venue_name: null, image_url: null },
        members
      });
    }

    setGroups(groupsWithDetails);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'forming':
        return 'bg-yellow-500/20 text-yellow-700';
      case 'locked':
        return 'bg-green-500/20 text-green-700';
      case 'done':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'forming':
        return t('groups.status.forming');
      case 'locked':
        return t('groups.status.ready');
      default:
        return status;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="flex flex-col items-center justify-center h-[60vh] p-6 text-center">
          <Users className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t('groups.sign_in')}</h2>
          <p className="text-muted-foreground mb-4">
            {t('groups.sign_in_desc')}
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center justify-center h-12 px-6 bg-primary text-primary-foreground rounded-lg font-semibold"
          >
            {t('profile.sign_in')}
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b p-4">
        <h1 className="text-2xl font-bold">{t('groups.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('groups.subtitle')}</p>
      </header>

      {/* Content */}
      <main className="p-4 space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-36 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('groups.no_groups')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('groups.no_groups_desc')}
            </p>
            <Link
              to="/explore"
              className="inline-flex items-center justify-center h-12 px-6 bg-primary text-primary-foreground rounded-lg font-semibold"
            >
              {t('groups.explore_events')}
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {groups.map((group, index) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/chat/${group.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <Badge className={getStatusColor(group.status)}>
                          {getStatusLabel(group.status)}
                        </Badge>
                        <h3 className="font-semibold mt-2 line-clamp-1">{group.event.title}</h3>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>

                    <div className="space-y-2 text-sm text-muted-foreground mb-3">
                      {group.event.starts_at && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(group.event.starts_at), 'EEE, MMM d · h:mm a')}</span>
                        </div>
                      )}
                      {group.meet_spot && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{group.meet_spot}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {group.members.slice(0, 4).map((member) => (
                          <Avatar key={member.id} className="h-8 w-8 border-2 border-card">
                            <AvatarImage src={member.avatar_url || undefined} />
                            <AvatarFallback className="text-xs bg-primary/20 text-primary">
                              {member.display_name?.[0] || '?'}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {new Date(group.event.starts_at) < new Date() && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedGroup(group);
                              setShareModalOpen(true);
                            }}
                          >
                            <Share2 className="h-4 w-4 mr-1" />
                            {t('groups.share')}
                          </Button>
                        )}
                        <div className="flex items-center gap-1 text-primary">
                          <MessageCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">{t('groups.chat')}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {selectedGroup && (
        <ShareMomentModal
          open={shareModalOpen}
          onOpenChange={setShareModalOpen}
          eventTitle={selectedGroup.event.title}
          eventImageUrl={selectedGroup.event.image_url}
          eventDate={selectedGroup.event.starts_at}
          eventId={selectedGroup.event.id}
          members={selectedGroup.members}
        />
      )}

      <BottomNav />
    </div>
  );
}
