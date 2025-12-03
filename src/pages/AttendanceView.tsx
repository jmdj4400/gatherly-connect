import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, X, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { AttendanceQR } from '@/components/attendance/AttendanceQR';

interface GroupMember {
  id: string;
  user_id: string;
  role: string;
  profiles: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  attendance_status?: 'attended' | 'no_show' | 'pending';
}

interface GroupDetails {
  id: string;
  event_id: string;
  status: string;
  meet_spot: string | null;
  events: {
    id: string;
    title: string;
    starts_at: string;
    host_org_id: string | null;
  };
}

export default function AttendanceView() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isHost, setIsHost] = useState(false);
  const [isOrgAdmin, setIsOrgAdmin] = useState(false);

  useEffect(() => {
    if (groupId && user) {
      fetchGroupDetails();
    }
  }, [groupId, user]);

  const getAccessToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  const fetchGroupDetails = async () => {
    setLoading(true);
    try {
      // Fetch group with event details
      const { data: groupData } = await supabase
        .from('micro_groups')
        .select(`
          id,
          event_id,
          status,
          meet_spot,
          events (
            id,
            title,
            starts_at,
            host_org_id
          )
        `)
        .eq('id', groupId)
        .single();

      if (!groupData) {
        toast({ title: 'Group not found', variant: 'destructive' });
        navigate(-1);
        return;
      }

      setGroup(groupData as unknown as GroupDetails);

      // Fetch members with profiles
      const { data: membersData } = await supabase
        .from('micro_group_members')
        .select(`
          id,
          user_id,
          role,
          profiles (
            id,
            display_name,
            avatar_url
          )
        `)
        .eq('group_id', groupId);

      // Fetch attendance status for each member
      if (membersData) {
        const membersWithStatus = await Promise.all(
          membersData.map(async (member: any) => {
            const { data: participant } = await supabase
              .from('event_participants')
              .select('status')
              .eq('event_id', groupData.event_id)
              .eq('user_id', member.user_id)
              .maybeSingle();

            return {
              ...member,
              attendance_status: participant?.status === 'attended' ? 'attended' 
                : participant?.status === 'no_show' ? 'no_show' 
                : 'pending'
            };
          })
        );

        setMembers(membersWithStatus);
        
        // Check if current user is host
        const userMember = membersWithStatus.find(m => m.user_id === user?.id);
        setIsHost(userMember?.role === 'host');
      }

      // Check org_admin status
      if ((groupData as any).events?.host_org_id) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('id')
          .eq('user_id', user!.id)
          .eq('role', 'org_admin')
          .eq('org_id', (groupData as any).events.host_org_id)
          .maybeSingle();

        setIsOrgAdmin(!!roleData);
      }

    } catch (error) {
      console.error('Error fetching group:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async (memberId: string, userId: string, status: 'attended' | 'no_show') => {
    try {
      const token = await getAccessToken();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/attendance?action=mark`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            group_id: groupId,
            user_id: userId,
            status
          })
        }
      );

      const data = await response.json();
      if (data.success) {
        toast({ 
          title: status === 'attended' ? 'Marked as attended' : 'Marked as no-show'
        });
        // Update local state
        setMembers(prev => prev.map(m => 
          m.user_id === userId ? { ...m, attendance_status: status } : m
        ));
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const canManageAttendance = isHost || isOrgAdmin;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <p>Group not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card border-b px-6 py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Attendance</h1>
            <p className="text-sm text-muted-foreground">{group.events.title}</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* QR Code for check-in - hardened with event binding and expiry */}
        {canManageAttendance && group.events && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center"
          >
            <AttendanceQR
              eventId={group.events.id}
              eventTitle={group.events.title}
              startsAt={group.events.starts_at}
              orgId={group.events.host_org_id || undefined}
              size={200}
            />
          </motion.div>
        )}

        {/* Members List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Group Members ({members.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {members.map((member) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg"
              >
                <Avatar>
                  <AvatarImage src={member.profiles.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {member.profiles.display_name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{member.profiles.display_name || 'User'}</p>
                    {member.role === 'host' && (
                      <Badge variant="secondary" className="text-xs">Host</Badge>
                    )}
                  </div>
                  <Badge 
                    variant={
                      member.attendance_status === 'attended' ? 'default' :
                      member.attendance_status === 'no_show' ? 'destructive' : 
                      'secondary'
                    }
                    className="mt-1"
                  >
                    {member.attendance_status === 'attended' ? 'Attended' :
                     member.attendance_status === 'no_show' ? 'No Show' : 
                     'Pending'}
                  </Badge>
                </div>

                {canManageAttendance && member.attendance_status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkAttendance(member.id, member.user_id, 'attended')}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkAttendance(member.id, member.user_id, 'no_show')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </motion.div>
            ))}
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{members.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {members.filter(m => m.attendance_status === 'attended').length}
                </p>
                <p className="text-sm text-muted-foreground">Attended</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {members.filter(m => m.attendance_status === 'no_show').length}
                </p>
                <p className="text-sm text-muted-foreground">No Shows</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
