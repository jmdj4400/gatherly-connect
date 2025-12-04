import { useState } from 'react';
import { Download, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GlassCard } from '@/components/ui/glass-card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';

export function GDPRSettings() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleExportData = async () => {
    if (!user) return;
    
    setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('gdpr-export');
      
      if (error) throw error;
      
      if (data?.success && data?.data) {
        // Create downloadable JSON file
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { 
          type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gatherly-data-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Data eksporteret",
          description: "Dine data er blevet downloadet som en JSON-fil.",
        });
      } else {
        throw new Error(data?.error || 'Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Eksport fejlede",
        description: "Der opstod en fejl under eksport af dine data.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || confirmEmail !== user.email) {
      toast({
        title: "Bekræftelse krævet",
        description: "Indtast din e-mail korrekt for at bekræfte sletning.",
        variant: "destructive",
      });
      return;
    }
    
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('gdpr-delete', {
        body: { confirmEmail }
      });
      
      if (error) throw error;
      
      if (data?.success) {
        toast({
          title: "Konto slettet",
          description: "Din konto og alle tilknyttede data er blevet slettet.",
        });
        
        // Sign out and redirect
        await signOut();
        window.location.href = '/';
      } else {
        throw new Error(data?.error || 'Deletion failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Sletning fejlede",
        description: "Der opstod en fejl under sletning af din konto.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setConfirmEmail('');
    }
  };

  if (!user) return null;

  return (
    <GlassCard variant="elevated" className="p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <AlertTriangle className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Privatlivsindstillinger</h3>
          <p className="text-sm text-muted-foreground">GDPR data kontrol</p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Export Data */}
        <Button
          variant="outline"
          className="w-full justify-start gap-3"
          onClick={handleExportData}
          disabled={exporting}
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          <span className="flex-1 text-left">
            {exporting ? 'Eksporterer...' : 'Download mine data'}
          </span>
        </Button>
        <p className="text-xs text-muted-foreground ml-1">
          Download en kopi af alle dine data i JSON-format.
        </p>

        {/* Delete Account */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              <span className="flex-1 text-left">Slet min konto</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Slet konto permanent
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>
                  Denne handling kan ikke fortrydes. Alle dine data vil blive permanent slettet, 
                  inklusiv:
                </p>
                <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                  <li>Din profil og indstillinger</li>
                  <li>Event-tilmeldinger og deltagelser</li>
                  <li>Beskeder og gruppedeltagelser</li>
                  <li>Badges og streaks</li>
                  <li>Abonnementsdata</li>
                </ul>
                <div className="pt-2">
                  <p className="text-sm font-medium mb-2">
                    Indtast din e-mail for at bekræfte: <strong>{user.email}</strong>
                  </p>
                  <Input
                    type="email"
                    placeholder="Indtast din e-mail"
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmEmail('')}>
                Annuller
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={deleting || confirmEmail !== user.email}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Sletter...
                  </>
                ) : (
                  'Slet permanent'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <p className="text-xs text-muted-foreground ml-1">
          Slet din konto og alle tilknyttede data permanent.
        </p>
      </div>
    </GlassCard>
  );
}
