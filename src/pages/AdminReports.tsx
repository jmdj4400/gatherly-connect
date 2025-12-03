import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Shield, AlertTriangle, Check, X, Ban, MessageSquareOff, 
  Snowflake, ArrowLeft, Filter, RefreshCw, User, MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';

interface Report {
  id: string;
  reporter_id: string | null;
  reported_user_id: string;
  message_id: string | null;
  group_id: string | null;
  reason: string;
  moderation_flags: any;
  status: string;
  created_at: string;
  reported_profile: { id: string; display_name: string; avatar_url: string | null } | null;
  reporter_profile: { id: string; display_name: string } | null;
  message: { id: string; content: string; created_at: string } | null;
  group: { id: string; event_id: string; events: { title: string } } | null;
}

export default function AdminReports() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [actionDialog, setActionDialog] = useState<'resolve' | 'ban' | 'freeze' | null>(null);

  const getAccessToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user, statusFilter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = await getAccessToken();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-safety?action=reports&status=${statusFilter}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setReports(data.reports || []);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (status: 'resolved' | 'dismissed') => {
    if (!selectedReport) return;
    try {
      const token = await getAccessToken();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-safety?action=resolve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            report_id: selectedReport.id,
            resolution_notes: resolutionNotes,
            status
          })
        }
      );
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      toast({ title: 'Report resolved' });
      setActionDialog(null);
      setSelectedReport(null);
      setResolutionNotes('');
      fetchReports();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleBan = async () => {
    if (!selectedReport) return;
    try {
      const token = await getAccessToken();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-safety?action=ban`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            user_id: selectedReport.reported_user_id,
            reason: resolutionNotes || 'Violation of community guidelines',
            permanent: false,
            duration_days: 7
          })
        }
      );
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      toast({ title: 'User banned for 7 days' });
      setActionDialog(null);
      handleResolve('resolved');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleFreeze = async () => {
    if (!selectedReport?.group_id) return;
    try {
      const token = await getAccessToken();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-safety?action=freeze`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            group_id: selectedReport.group_id,
            freeze: true
          })
        }
      );
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      toast({ title: 'Group frozen' });
      setActionDialog(null);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleUnmute = async (userId: string, groupId?: string) => {
    try {
      const token = await getAccessToken();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-safety?action=unmute`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ user_id: userId, group_id: groupId })
        }
      );
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      toast({ title: 'User unmuted' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Admin Access Required</h2>
            <p className="text-muted-foreground mb-4">Sign in to access the report center.</p>
            <Button onClick={() => navigate('/auth')}>Sign In</Button>
          </CardContent>
        </Card>
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
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Report Center
            </h1>
            <p className="text-sm text-muted-foreground">{reports.length} reports</p>
          </div>
          <Button variant="outline" size="icon" onClick={fetchReports}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Filters */}
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reports List */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading reports...</div>
        ) : reports.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Check className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-semibold">No {statusFilter} reports</h3>
              <p className="text-muted-foreground">All clear!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={report.reported_profile?.avatar_url || ''} />
                          <AvatarFallback>
                            {report.reported_profile?.display_name?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{report.reported_profile?.display_name || 'Unknown User'}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(report.created_at), 'MMM d, yyyy HH:mm')}
                          </p>
                        </div>
                      </div>
                      <Badge variant={
                        report.status === 'pending' ? 'default' : 
                        report.status === 'resolved' ? 'secondary' : 'outline'
                      }>
                        {report.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Reason */}
                    <div className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium">
                        {report.reason === 'auto_moderation' ? 'Auto-Moderated' : report.reason}
                      </span>
                    </div>

                    {/* Moderation flags */}
                    {report.moderation_flags && (
                      <div className="bg-muted p-3 rounded-lg text-sm">
                        <p className="font-medium mb-1">Flagged Categories:</p>
                        <div className="flex flex-wrap gap-1">
                          {report.moderation_flags.categories?.map((cat: string) => (
                            <Badge key={cat} variant="destructive" className="text-xs">
                              {cat}
                            </Badge>
                          ))}
                        </div>
                        {report.moderation_flags.reason && (
                          <p className="mt-2 text-muted-foreground">{report.moderation_flags.reason}</p>
                        )}
                      </div>
                    )}

                    {/* Message content */}
                    {report.message && (
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageCircle className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Flagged message</span>
                        </div>
                        <p className="text-sm">{report.message.content}</p>
                      </div>
                    )}

                    {/* Group info */}
                    {report.group && (
                      <div className="text-sm text-muted-foreground">
                        Event: {report.group.events?.title || 'Unknown'}
                      </div>
                    )}

                    {/* Actions */}
                    {report.status === 'pending' && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedReport(report);
                            setActionDialog('resolve');
                          }}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Resolve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedReport(report);
                            handleUnmute(report.reported_user_id, report.group_id || undefined);
                          }}
                        >
                          <MessageSquareOff className="h-4 w-4 mr-1" />
                          Unmute
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedReport(report);
                            setActionDialog('ban');
                          }}
                        >
                          <Ban className="h-4 w-4 mr-1" />
                          Ban
                        </Button>
                        {report.group_id && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedReport(report);
                              setActionDialog('freeze');
                            }}
                          >
                            <Snowflake className="h-4 w-4 mr-1" />
                            Freeze Group
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Resolve Dialog */}
      <Dialog open={actionDialog === 'resolve'} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Resolution notes (optional)"
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
            />
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => handleResolve('dismissed')}>
              <X className="h-4 w-4 mr-1" />
              Dismiss
            </Button>
            <Button onClick={() => handleResolve('resolved')}>
              <Check className="h-4 w-4 mr-1" />
              Resolve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban Dialog */}
      <Dialog open={actionDialog === 'ban'} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Ban <strong>{selectedReport?.reported_profile?.display_name}</strong> for 7 days?
            </p>
            <Textarea
              placeholder="Ban reason"
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleBan}>
              <Ban className="h-4 w-4 mr-1" />
              Confirm Ban
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Freeze Dialog */}
      <Dialog open={actionDialog === 'freeze'} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Freeze Group</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            This will prevent any new messages or attendance changes in this group.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleFreeze}>
              <Snowflake className="h-4 w-4 mr-1" />
              Freeze Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
