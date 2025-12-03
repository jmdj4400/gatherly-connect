import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Users, UserPlus, Crown, Shield, Eye, Trash2, ArrowLeft, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface OrgMember {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profiles: {
    id: string;
    display_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
}

interface Org {
  role: string;
  org_id: string;
  orgs: {
    id: string;
    name: string;
    contact_email: string | null;
  };
}

interface ActivityLog {
  id: string;
  action: string;
  target_user_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  profiles: {
    display_name: string | null;
    email: string | null;
  };
}

const roleLabels: Record<string, { label: string; icon: typeof Crown }> = {
  org_owner: { label: 'Owner', icon: Crown },
  org_admin: { label: 'Admin', icon: Shield },
  org_helper: { label: 'Helper', icon: Eye },
};

export default function OrganizerTeam() {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [requesterRole, setRequesterRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('org_helper');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [createOrgOpen, setCreateOrgOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgEmail, setNewOrgEmail] = useState('');
  const [showActivityLog, setShowActivityLog] = useState(false);

  useEffect(() => {
    if (session) {
      fetchOrgs();
    }
  }, [session]);

  useEffect(() => {
    if (selectedOrg) {
      fetchMembers();
      fetchActivityLog();
    }
  }, [selectedOrg]);

  const fetchOrgs = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('org-management', {
        body: { action: 'get_user_orgs' },
      });
      if (error) throw error;
      setOrgs(data.orgs || []);
      if (data.orgs?.length > 0) {
        setSelectedOrg(data.orgs[0].org_id);
      }
    } catch (error) {
      console.error('Failed to fetch orgs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    if (!selectedOrg) return;
    try {
      const { data, error } = await supabase.functions.invoke('org-management', {
        body: { action: 'get_members', org_id: selectedOrg },
      });
      if (error) throw error;
      setMembers(data.members || []);
      setRequesterRole(data.requester_role);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  };

  const fetchActivityLog = async () => {
    if (!selectedOrg) return;
    try {
      const { data, error } = await supabase.functions.invoke('org-management', {
        body: { action: 'get_activity_log', org_id: selectedOrg },
      });
      if (error) throw error;
      setActivityLogs(data.logs || []);
    } catch (error) {
      console.error('Failed to fetch activity log:', error);
    }
  };

  const handleCreateOrg = async () => {
    if (!newOrgName.trim()) {
      toast.error('Organization name required');
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke('org-management', {
        body: { 
          action: 'create_org', 
          name: newOrgName.trim(),
          contact_email: newOrgEmail.trim() || null,
        },
      });
      if (error) throw error;
      toast.success('Organization created');
      setCreateOrgOpen(false);
      setNewOrgName('');
      setNewOrgEmail('');
      await fetchOrgs();
      setSelectedOrg(data.org.id);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to create organization');
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !selectedOrg) {
      toast.error('Email required');
      return;
    }
    try {
      const { error } = await supabase.functions.invoke('org-management', {
        body: { 
          action: 'invite_member', 
          org_id: selectedOrg,
          email: inviteEmail.trim(),
          role: inviteRole,
        },
      });
      if (error) throw error;
      toast.success('Member added');
      setInviteOpen(false);
      setInviteEmail('');
      setInviteRole('org_helper');
      fetchMembers();
      fetchActivityLog();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to add member');
    }
  };

  const handleChangeRole = async (targetUserId: string, newRole: string) => {
    if (!selectedOrg) return;
    try {
      const { error } = await supabase.functions.invoke('org-management', {
        body: { 
          action: 'change_role', 
          org_id: selectedOrg,
          target_user_id: targetUserId,
          new_role: newRole,
        },
      });
      if (error) throw error;
      toast.success('Role updated');
      fetchMembers();
      fetchActivityLog();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to update role');
    }
  };

  const handleRemoveMember = async (targetUserId: string) => {
    if (!selectedOrg) return;
    try {
      const { error } = await supabase.functions.invoke('org-management', {
        body: { 
          action: 'remove_member', 
          org_id: selectedOrg,
          target_user_id: targetUserId,
        },
      });
      if (error) throw error;
      toast.success('Member removed');
      fetchMembers();
      fetchActivityLog();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove member');
    }
  };

  const canManageMembers = requesterRole === 'org_owner' || requesterRole === 'org_admin';
  const canChangeRoles = requesterRole === 'org_owner';

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Team Management</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Org Selector */}
        <div className="flex items-center gap-4">
          {orgs.length > 0 ? (
            <Select value={selectedOrg || ''} onValueChange={setSelectedOrg}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select organization" />
              </SelectTrigger>
              <SelectContent>
                {orgs.map((org) => (
                  <SelectItem key={org.org_id} value={org.org_id}>
                    {org.orgs.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-muted-foreground">No organizations</p>
          )}
          
          <Dialog open={createOrgOpen} onOpenChange={setCreateOrgOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Create Organization
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Organization</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Organization Name</Label>
                  <Input
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    placeholder="My Community"
                  />
                </div>
                <div>
                  <Label>Contact Email (optional)</Label>
                  <Input
                    type="email"
                    value={newOrgEmail}
                    onChange={(e) => setNewOrgEmail(e.target.value)}
                    placeholder="contact@example.com"
                  />
                </div>
                <Button onClick={handleCreateOrg} className="w-full">
                  Create
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {selectedOrg && (
          <>
            {/* Actions */}
            <div className="flex gap-2">
              {canManageMembers && (
                <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Team Member</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div>
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="member@example.com"
                        />
                      </div>
                      <div>
                        <Label>Role</Label>
                        <Select value={inviteRole} onValueChange={setInviteRole}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="org_helper">Helper (Check-in only)</SelectItem>
                            {canChangeRoles && (
                              <>
                                <SelectItem value="org_admin">Admin (Manage events)</SelectItem>
                                <SelectItem value="org_owner">Owner (Full access)</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleInvite} className="w-full">
                        Add Member
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              
              <Button
                variant="outline"
                onClick={() => setShowActivityLog(!showActivityLog)}
              >
                <Activity className="h-4 w-4 mr-2" />
                {showActivityLog ? 'Show Members' : 'Activity Log'}
              </Button>
            </div>

            {/* Members List */}
            {!showActivityLog ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Team Members ({members.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {members.map((member) => {
                    const roleInfo = roleLabels[member.role] || { label: member.role, icon: Eye };
                    const RoleIcon = roleInfo.icon;
                    const isCurrentUser = member.user_id === user?.id;
                    
                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={member.profiles.avatar_url || undefined} />
                            <AvatarFallback>
                              {member.profiles.display_name?.[0] || member.profiles.email?.[0] || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">
                              {member.profiles.display_name || member.profiles.email}
                              {isCurrentUser && <span className="text-muted-foreground ml-2">(you)</span>}
                            </p>
                            <p className="text-sm text-muted-foreground">{member.profiles.email}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {canChangeRoles && !isCurrentUser ? (
                            <Select
                              value={member.role}
                              onValueChange={(value) => handleChangeRole(member.user_id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="org_helper">Helper</SelectItem>
                                <SelectItem value="org_admin">Admin</SelectItem>
                                <SelectItem value="org_owner">Owner</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <RoleIcon className="h-3 w-3" />
                              {roleInfo.label}
                            </Badge>
                          )}
                          
                          {canManageMembers && !isCurrentUser && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveMember(member.user_id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {members.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No team members yet
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : (
              /* Activity Log */
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Activity Log
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {activityLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex-1">
                        <p className="text-sm text-foreground">
                          <span className="font-medium">
                            {log.profiles?.display_name || log.profiles?.email || 'Unknown'}
                          </span>
                          {' '}
                          <span className="text-muted-foreground">
                            {log.action.replace(/_/g, ' ')}
                          </span>
                          {log.metadata && (
                            <span className="text-muted-foreground">
                              {log.metadata.role && ` as ${String(log.metadata.role).replace('org_', '')}`}
                              {log.metadata.email && ` (${log.metadata.email})`}
                              {log.metadata.new_role && ` to ${String(log.metadata.new_role).replace('org_', '')}`}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {activityLogs.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No activity yet
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Role Permissions Info */}
            <Card>
              <CardHeader>
                <CardTitle>Role Permissions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    Helper
                  </Badge>
                  <span className="text-muted-foreground">
                    Check-in attendance, freeze groups, view reports
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Admin
                  </Badge>
                  <span className="text-muted-foreground">
                    All Helper permissions + create/edit events, add helpers
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Crown className="h-3 w-3" />
                    Owner
                  </Badge>
                  <span className="text-muted-foreground">
                    Full access including billing, delete org, manage all roles
                  </span>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
