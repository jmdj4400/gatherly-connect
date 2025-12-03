import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Building2, Upload, Calendar, Users, Download, 
  ArrowLeft, Plus, FileSpreadsheet, Check, X, 
  AlertCircle, Trash2, Eye, QrCode, TrendingDown, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';

interface Org {
  id: string;
  name: string;
  contact_email: string | null;
  created_at: string;
}

interface OrgEvent {
  id: string;
  title: string;
  starts_at: string;
  category: string | null;
  ticket_price: number;
  event_participants: { count: number }[];
}

interface ImportBatch {
  id: string;
  filename: string;
  row_count: number;
  success_count: number;
  error_count: number;
  status: string;
  created_at: string;
}

interface CSVPreviewResult {
  row: number;
  status: 'ok' | 'error' | 'duplicate';
  error_reason?: string;
}

export default function VenuePanel() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [orgs, setOrgs] = useState<Org[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Org | null>(null);
  const [events, setEvents] = useState<OrgEvent[]>([]);
  const [imports, setImports] = useState<ImportBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);

  // Create org dialog
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgEmail, setNewOrgEmail] = useState('');
  const [creating, setCreating] = useState(false);

  // CSV Import
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<CSVPreviewResult[] | null>(null);
  const [csvSummary, setCsvSummary] = useState<any>(null);
  const [importing, setImporting] = useState(false);

  // Venue Stats
  const [stats, setStats] = useState<{
    totalEvents: number;
    totalAttendees: number;
    totalJoined: number;
    noShowRate: number;
  } | null>(null);

  useEffect(() => {
    if (user) {
      fetchOrgs();
    }
  }, [user]);

  useEffect(() => {
    if (selectedOrg) {
      fetchOrgEvents();
      fetchStats();
      fetchImports();
    }
  }, [selectedOrg]);

  const getAccessToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  const fetchOrgs = async () => {
    setLoading(true);
    try {
      const token = await getAccessToken();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/org-management?action=list`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const data = await response.json();
      setOrgs(data.orgs || []);
      if (data.orgs?.length > 0 && !selectedOrg) {
        setSelectedOrg(data.orgs[0]);
      }
    } catch (error) {
      console.error('Error fetching orgs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrgEvents = async () => {
    if (!selectedOrg) return;
    setEventsLoading(true);
    try {
      const token = await getAccessToken();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/org-management?action=events&org_id=${selectedOrg.id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setEventsLoading(false);
    }
  };

  const fetchImports = async () => {
    if (!selectedOrg) return;
    try {
      const token = await getAccessToken();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/org-management?action=imports&org_id=${selectedOrg.id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const data = await response.json();
      setImports(data.imports || []);
    } catch (error) {
      console.error('Error fetching imports:', error);
    }
  };

  const fetchStats = async () => {
    if (!selectedOrg) return;
    try {
      const token = await getAccessToken();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/attendance?action=export&org_id=${selectedOrg.id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const data = await response.json();
      if (data.summary) {
        setStats({
          totalEvents: data.summary.total_events || 0,
          totalAttendees: data.summary.total_attended || 0,
          totalJoined: data.summary.total_joined || 0,
          noShowRate: data.summary.overall_no_show_rate || 0
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreateOrg = async () => {
    if (!newOrgName.trim()) return;
    setCreating(true);
    try {
      const token = await getAccessToken();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/org-management?action=create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: newOrgName,
            contact_email: newOrgEmail || undefined
          })
        }
      );
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Organization created!', description: `${newOrgName} is ready.` });
        setShowCreateOrg(false);
        setNewOrgName('');
        setNewOrgEmail('');
        await fetchOrgs();
        if (data.org) setSelectedOrg(data.org);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    
    // Run dry run
    setImporting(true);
    try {
      const token = await getAccessToken();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('filename', file.name);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/csv-import?org_id=${selectedOrg?.id}&dry_run=true`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        }
      );
      const data = await response.json();
      setCsvPreview(data.results || []);
      setCsvSummary(data.summary);
    } catch (error: any) {
      toast({ title: 'Error parsing CSV', description: error.message, variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  const handleCommitImport = async () => {
    if (!csvFile || !selectedOrg) return;
    setImporting(true);
    try {
      const token = await getAccessToken();
      const formData = new FormData();
      formData.append('file', csvFile);
      formData.append('filename', csvFile.name);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/csv-import?org_id=${selectedOrg.id}&dry_run=false`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        }
      );
      const data = await response.json();
      if (data.success) {
        toast({ 
          title: 'Import successful!', 
          description: `${data.summary.valid} events imported.` 
        });
        setShowImportDialog(false);
        setCsvFile(null);
        setCsvPreview(null);
        setCsvSummary(null);
        await fetchOrgEvents();
        await fetchImports();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({ title: 'Import failed', description: error.message, variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  const handleRollback = async (batchId: string) => {
    try {
      const token = await getAccessToken();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/org-management?action=rollback`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ batch_id: batchId })
        }
      );
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Rollback complete', description: 'Events have been removed.' });
        await fetchOrgEvents();
        await fetchImports();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({ title: 'Rollback failed', description: error.message, variant: 'destructive' });
    }
  };

  const handleExportAttendance = async () => {
    if (!selectedOrg) return;
    try {
      const token = await getAccessToken();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/attendance?action=export&org_id=${selectedOrg.id}&format=csv`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_${selectedOrg.id}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast({ title: 'Export complete', description: 'Attendance CSV downloaded.' });
    } catch (error: any) {
      toast({ title: 'Export failed', description: error.message, variant: 'destructive' });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Venue Panel</h2>
            <p className="text-muted-foreground mb-4">Sign in to manage your venue and events.</p>
            <Button onClick={() => navigate('/auth')}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
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
            <h1 className="text-xl font-bold">Venue Panel</h1>
            {selectedOrg && (
              <p className="text-sm text-muted-foreground">{selectedOrg.name}</p>
            )}
          </div>
          <Dialog open={showCreateOrg} onOpenChange={setShowCreateOrg}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Venue
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Venue</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Venue Name</Label>
                  <Input
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    placeholder="My Venue"
                  />
                </div>
                <div>
                  <Label>Contact Email (optional)</Label>
                  <Input
                    type="email"
                    value={newOrgEmail}
                    onChange={(e) => setNewOrgEmail(e.target.value)}
                    placeholder="contact@venue.com"
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleCreateOrg}
                  disabled={creating || !newOrgName.trim()}
                >
                  {creating ? 'Creating...' : 'Create Venue'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {orgs.length === 0 ? (
        <div className="p-6 text-center">
          <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">No Venues Yet</h2>
          <p className="text-muted-foreground mb-4">Create your first venue to start managing events.</p>
          <Button onClick={() => setShowCreateOrg(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Venue
          </Button>
        </div>
      ) : (
        <div className="p-6 space-y-6">
          {/* Venue Stats */}
          {stats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-4 gap-4"
            >
              <Card>
                <CardContent className="pt-4 text-center">
                  <Calendar className="h-6 w-6 mx-auto text-primary mb-1" />
                  <p className="text-2xl font-bold">{stats.totalEvents}</p>
                  <p className="text-xs text-muted-foreground">Total Events</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <Users className="h-6 w-6 mx-auto text-primary mb-1" />
                  <p className="text-2xl font-bold">{stats.totalJoined}</p>
                  <p className="text-xs text-muted-foreground">Registered</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <Check className="h-6 w-6 mx-auto text-green-500 mb-1" />
                  <p className="text-2xl font-bold">{stats.totalAttendees}</p>
                  <p className="text-xs text-muted-foreground">Attended</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <TrendingDown className="h-6 w-6 mx-auto text-red-500 mb-1" />
                  <p className="text-2xl font-bold">{Math.round(stats.noShowRate * 100)}%</p>
                  <p className="text-xs text-muted-foreground">No-Show Rate</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
              <DialogTrigger asChild>
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardContent className="pt-6 text-center">
                    <Upload className="h-8 w-8 mx-auto text-primary mb-2" />
                    <p className="font-medium">Import CSV</p>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle>Import Events from CSV</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <FileSpreadsheet className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Required columns: title, start_time, venue_name
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Optional: end_time, address, city, category, description, lat, lng, price, image_url
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={importing}
                    >
                      {importing ? 'Processing...' : 'Select CSV File'}
                    </Button>
                  </div>

                  {csvSummary && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Preview Results</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-4 gap-2 text-sm">
                          <div className="text-center p-2 bg-muted rounded">
                            <p className="font-bold">{csvSummary.total_rows}</p>
                            <p className="text-xs text-muted-foreground">Total</p>
                          </div>
                          <div className="text-center p-2 bg-green-500/10 rounded">
                            <p className="font-bold text-green-600">{csvSummary.valid}</p>
                            <p className="text-xs text-muted-foreground">Valid</p>
                          </div>
                          <div className="text-center p-2 bg-red-500/10 rounded">
                            <p className="font-bold text-red-600">{csvSummary.errors}</p>
                            <p className="text-xs text-muted-foreground">Errors</p>
                          </div>
                          <div className="text-center p-2 bg-yellow-500/10 rounded">
                            <p className="font-bold text-yellow-600">{csvSummary.duplicates}</p>
                            <p className="text-xs text-muted-foreground">Duplicates</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {csvPreview && csvPreview.length > 0 && (
                    <div className="max-h-48 overflow-auto border rounded">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Row</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Details</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {csvPreview.slice(0, 20).map((result, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{result.row}</TableCell>
                              <TableCell>
                                {result.status === 'ok' && <Check className="h-4 w-4 text-green-500" />}
                                {result.status === 'error' && <X className="h-4 w-4 text-red-500" />}
                                {result.status === 'duplicate' && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {result.error_reason || 'OK'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {csvSummary && csvSummary.valid > 0 && (
                    <Button 
                      className="w-full" 
                      onClick={handleCommitImport}
                      disabled={importing}
                    >
                      {importing ? 'Importing...' : `Import ${csvSummary.valid} Events`}
                    </Button>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Card 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={handleExportAttendance}
            >
              <CardContent className="pt-6 text-center">
                <Download className="h-8 w-8 mx-auto text-primary mb-2" />
                <p className="font-medium">Export Attendance</p>
              </CardContent>
            </Card>
          </div>

          {/* Events Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Events ({events.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {eventsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : events.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No events yet. Import a CSV to get started.
                </div>
              ) : (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Participants</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {events.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell className="font-medium">{event.title}</TableCell>
                          <TableCell>{format(new Date(event.starts_at), 'MMM d, yyyy')}</TableCell>
                          <TableCell>
                            {event.category && <Badge variant="secondary">{event.category}</Badge>}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              {event.event_participants?.[0]?.count || 0}
                            </div>
                          </TableCell>
                          <TableCell>${event.ticket_price || 0}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => navigate(`/events/${event.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <QrCode className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Import History */}
          {imports.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  Import History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Results</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {imports.map((batch) => (
                      <TableRow key={batch.id}>
                        <TableCell>{batch.filename}</TableCell>
                        <TableCell>{format(new Date(batch.created_at), 'MMM d, yyyy HH:mm')}</TableCell>
                        <TableCell>
                          <span className="text-green-600">{batch.success_count} ok</span>
                          {batch.error_count > 0 && (
                            <span className="text-red-600 ml-2">{batch.error_count} errors</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={batch.status === 'committed' ? 'default' : 'secondary'}>
                            {batch.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {batch.status === 'committed' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleRollback(batch.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Rollback
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
