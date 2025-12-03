import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Users, RefreshCw, Lock, Unlock, AlertTriangle, 
  Clock, CheckCircle, UserMinus, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { format, differenceInHours } from 'date-fns';
import { PageLoader } from '@/components/ui/loading-spinner';

interface GroupMember {
  id: string;
  user_id: string;
  role: string;
  profile: {
    display_name: string | null;
    avatar_url: string | null;
    interests: string[] | null;
    social_energy: number | null;
  };
  no_show_risk?: number;
}

interface Group {
  id: string;
  status: string;
  frozen: boolean;
  compatibility_score: number | null;
  meet_time: string | null;
  members: GroupMember[];
}

interface EventDetails {
  id: string;
  title: string;
  starts_at: string;
  max_group_size: number;
  auto_match: boolean;
  freeze_hours_before: number;
  host_org_id: string;
}

export default function OrganizerGroupsDashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [event, setEvent] = useState<EventDetails | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [unassignedCount, setUnassignedCount] = useState(0);

  useEffect(() => {
    if (id && user) {
      fetchEventData();
    }
  }, [id, user]);

  const fetchEventData = async () => {
    setLoading(true);
    
    // Fetch event
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('id, title, starts_at, max_group_size, auto_match, freeze_hours_before, host_org_id')
      .eq('id', id)
      .single();

    if (eventError || !eventData) {
      toast({ title: 'Event not found', variant: 'destructive' });
      navigate('/organizer/events');
      return;
    }

    setEvent(eventData);

    // Fetch groups with members
    const { data: groupsData } = await supabase
      .from('micro_groups')
      .select(`
        id,
        status,
        frozen,
        compatibility_score,
        meet_time
      `)
      .eq('event_id', id);

    const groupsWithMembers: Group[] = [];
    
    for (const group of groupsData || []) {
      const { data: membersData } = await supabase
        .from('micro_group_members')
        .select(`
          id,
          user_id,
          role,
          profiles(display_name, avatar_url, interests, social_energy)
        `)
        .eq('group_id', group.id);

      // Fetch no-show predictions for members
      const memberIds = membersData?.map(m => m.user_id) || [];
      const { data: predictions } = await supabase
        .from('no_show_predictions')
        .select('user_id, risk_score')
        .eq('event_id', id)
        .in('user_id', memberIds);

      const predictionMap = new Map(predictions?.map(p => [p.user_id, p.risk_score]));

      const members: GroupMember[] = (membersData || []).map(m => ({
        id: m.id,
        user_id: m.user_id,
        role: m.role || 'member',
        profile: m.profiles as any || { display_name: null, avatar_url: null, interests: null, social_energy: null },
        no_show_risk: predictionMap.get(m.user_id)
      }));

      groupsWithMembers.push({
        ...group,
        members
      });
    }

    setGroups(groupsWithMembers);

    // Count total and unassigned participants
    const { count: totalCount } = await supabase
      .from('event_participants')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', id)
      .eq('status', 'joined');

    setTotalParticipants(totalCount || 0);

    const assignedCount = groupsWithMembers.reduce((sum, g) => sum + g.members.length, 0);
    setUnassignedCount((totalCount || 0) - assignedCount);

    setLoading(false);
  };

  const handleRegenerateGroups = async () => {
    if (!id) return;
    
    setRegenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('regenerate-groups', {
        body: { event_id: id }
      });

      if (error) throw error;

      toast({
        title: 'Groups regenerated',
        description: `Created ${data.groups_created} groups with ${data.participants_assigned} participants`
      });

      await fetchEventData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setRegenerating(false);
    }
  };

  const handleFreezeAll = async () => {
    if (!id) return;
    
    try {
      const { error } = await supabase.functions.invoke('regenerate-groups', {
        body: { event_id: id, action: 'freeze' }
      });

      if (error) throw error;

      toast({ title: 'All groups frozen' });
      await fetchEventData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleUnfreezeAll = async () => {
    if (!id) return;
    
    try {
      const { error } = await supabase.functions.invoke('regenerate-groups', {
        body: { event_id: id, action: 'unfreeze' }
      });

      if (error) throw error;

      toast({ title: 'All groups unfrozen' });
      await fetchEventData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleToggleAutoMatch = async (enabled: boolean) => {
    if (!id || !event) return;

    const { error } = await supabase
      .from('events')
      .update({ auto_match: enabled })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    setEvent({ ...event, auto_match: enabled });
    toast({ title: enabled ? 'Auto-matching enabled' : 'Auto-matching disabled' });
  };

  const toggleGroupExpanded = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  if (loading) {
    return <PageLoader message="Loading groups..." />;
  }

  if (!event) {
    return null;
  }

  const hoursUntilEvent = differenceInHours(new Date(event.starts_at), new Date());
  const isAutoFrozen = hoursUntilEvent <= event.freeze_hours_before;
  const frozenCount = groups.filter(g => g.frozen).length;
  const avgCompatibility = groups.length > 0 
    ? Math.round(groups.reduce((sum, g) => sum + (g.compatibility_score || 0), 0) / groups.length)
    : 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/organizer/events')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-semibold">{event.title}</h1>
            <p className="text-xs text-muted-foreground">
              {format(new Date(event.starts_at), 'EEE, MMM d · HH:mm')}
            </p>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 mx-auto text-primary mb-1" />
              <p className="text-2xl font-bold">{totalParticipants}</p>
              <p className="text-xs text-muted-foreground">Participants</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="h-6 w-6 mx-auto text-primary mb-1 font-bold">{groups.length}</div>
              <p className="text-2xl font-bold">{groups.length}</p>
              <p className="text-xs text-muted-foreground">Groups</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <UserMinus className="h-6 w-6 mx-auto text-orange-500 mb-1" />
              <p className="text-2xl font-bold">{unassignedCount}</p>
              <p className="text-xs text-muted-foreground">Unassigned</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-6 w-6 mx-auto text-green-500 mb-1" />
              <p className="text-2xl font-bold">{avgCompatibility}%</p>
              <p className="text-xs text-muted-foreground">Avg Score</p>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id="auto-match"
                  checked={event.auto_match}
                  onCheckedChange={handleToggleAutoMatch}
                />
                <Label htmlFor="auto-match">Auto-Matching Mode</Label>
              </div>
              {isAutoFrozen && (
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-600">
                  <Lock className="h-3 w-3 mr-1" />
                  Auto-frozen ({event.freeze_hours_before}h before)
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleRegenerateGroups}
                disabled={regenerating || isAutoFrozen}
                variant="outline"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${regenerating ? 'animate-spin' : ''}`} />
                {regenerating ? 'Regenerating...' : 'Regenerate Groups'}
              </Button>
              
              {frozenCount < groups.length && (
                <Button onClick={handleFreezeAll} variant="outline">
                  <Lock className="h-4 w-4 mr-2" />
                  Freeze All
                </Button>
              )}
              
              {frozenCount > 0 && !isAutoFrozen && (
                <Button onClick={handleUnfreezeAll} variant="outline">
                  <Unlock className="h-4 w-4 mr-2" />
                  Unfreeze All
                </Button>
              )}
            </div>

            {hoursUntilEvent > 0 && hoursUntilEvent <= 24 && (
              <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-500/10 p-3 rounded-lg">
                <Clock className="h-4 w-4" />
                <span>Event starts in {hoursUntilEvent} hours</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Groups List */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Groups ({groups.length})</h2>
          
          {groups.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No groups formed yet</p>
                <Button onClick={handleRegenerateGroups} disabled={regenerating}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${regenerating ? 'animate-spin' : ''}`} />
                  Generate Groups
                </Button>
              </CardContent>
            </Card>
          ) : (
            groups.map((group, index) => {
              const isExpanded = expandedGroups.has(group.id);
              const highRiskMembers = group.members.filter(m => (m.no_show_risk || 0) > 50);

              return (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={group.frozen ? 'border-blue-500/50' : ''}>
                    <CardHeader className="p-4 pb-2">
                      <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleGroupExpanded(group.id)}
                      >
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-base">
                            Group {index + 1}
                          </CardTitle>
                          <Badge variant={group.frozen ? 'secondary' : 'outline'}>
                            {group.frozen ? (
                              <><Lock className="h-3 w-3 mr-1" /> Frozen</>
                            ) : (
                              group.status
                            )}
                          </Badge>
                          {group.compatibility_score !== null && (
                            <Badge variant="outline" className="bg-green-500/10 text-green-600">
                              {group.compatibility_score}% match
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {highRiskMembers.length > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {highRiskMembers.length} risk
                            </Badge>
                          )}
                          <span className="text-sm text-muted-foreground">
                            {group.members.length}/{event.max_group_size}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    {isExpanded && (
                      <CardContent className="p-4 pt-0 space-y-3">
                        <div className="flex -space-x-2 mb-3">
                          {group.members.map(member => (
                            <Avatar key={member.id} className="border-2 border-background h-10 w-10">
                              <AvatarImage src={member.profile.avatar_url || undefined} />
                              <AvatarFallback className="text-sm">
                                {member.profile.display_name?.[0] || '?'}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                        </div>

                        {group.members.map(member => (
                          <div 
                            key={member.id} 
                            className="flex items-center justify-between py-2 border-b last:border-0"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={member.profile.avatar_url || undefined} />
                                <AvatarFallback className="text-xs">
                                  {member.profile.display_name?.[0] || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">
                                  {member.profile.display_name || 'Anonymous'}
                                  {member.role === 'host' && (
                                    <Badge variant="secondary" className="ml-2 text-xs">Host</Badge>
                                  )}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Energy: {member.profile.social_energy || '?'}/5
                                  {member.profile.interests && ` · ${member.profile.interests.slice(0, 2).join(', ')}`}
                                </p>
                              </div>
                            </div>
                            
                            {member.no_show_risk !== undefined && (
                              <div className="text-right">
                                <p className={`text-xs font-medium ${
                                  member.no_show_risk > 50 ? 'text-red-500' :
                                  member.no_show_risk > 25 ? 'text-orange-500' : 'text-green-500'
                                }`}>
                                  {member.no_show_risk}% no-show risk
                                </p>
                                <Progress 
                                  value={100 - member.no_show_risk} 
                                  className="h-1 w-20"
                                />
                              </div>
                            )}
                          </div>
                        ))}

                        {group.members.length < event.max_group_size && (
                          <p className="text-xs text-muted-foreground text-center py-2">
                            {event.max_group_size - group.members.length} empty slots
                          </p>
                        )}
                      </CardContent>
                    )}
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}