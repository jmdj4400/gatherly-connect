import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, ExternalLink, X, Plus } from 'lucide-react';

interface Org {
  id: string;
  name: string;
  org_handle: string | null;
  cover_image_url: string | null;
  short_bio: string | null;
  community_tags: string[] | null;
  contact_email: string | null;
}

export default function OrganizerSettings() {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Org | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [orgHandle, setOrgHandle] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [shortBio, setShortBio] = useState('');
  const [communityTags, setCommunityTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (session) {
      fetchOrgs();
    }
  }, [session]);

  useEffect(() => {
    if (selectedOrg) {
      setOrgHandle(selectedOrg.org_handle || '');
      setCoverImageUrl(selectedOrg.cover_image_url || '');
      setShortBio(selectedOrg.short_bio || '');
      setCommunityTags(selectedOrg.community_tags || []);
    }
  }, [selectedOrg]);

  const fetchOrgs = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('org-management', {
        body: { action: 'get_user_orgs' },
      });
      if (error) throw error;
      
      const orgsList = data.orgs?.map((item: { orgs: Org }) => item.orgs).filter(Boolean) || [];
      setOrgs(orgsList);
      
      if (orgsList.length > 0) {
        // Fetch full org data
        const { data: fullOrg } = await supabase
          .from('orgs')
          .select('*')
          .eq('id', orgsList[0].id)
          .single();
        setSelectedOrg(fullOrg as Org);
      }
    } catch (error) {
      console.error('Failed to fetch orgs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedOrg) return;

    // Validate handle
    if (orgHandle && !/^[a-z0-9-_]+$/.test(orgHandle)) {
      toast.error('Handle can only contain lowercase letters, numbers, hyphens, and underscores');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('orgs')
        .update({
          org_handle: orgHandle || null,
          cover_image_url: coverImageUrl || null,
          short_bio: shortBio || null,
          community_tags: communityTags.length > 0 ? communityTags : null,
        })
        .eq('id', selectedOrg.id);

      if (error) {
        if (error.code === '23505') {
          toast.error('This handle is already taken');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Settings saved!');
      
      // Update local state
      setSelectedOrg({
        ...selectedOrg,
        org_handle: orgHandle || null,
        cover_image_url: coverImageUrl || null,
        short_bio: shortBio || null,
        community_tags: communityTags.length > 0 ? communityTags : null,
      });
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !communityTags.includes(tag)) {
      setCommunityTags([...communityTags, tag]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setCommunityTags(communityTags.filter((t) => t !== tag));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (orgs.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <h1 className="text-2xl font-bold mb-2">No Organizations</h1>
        <p className="text-muted-foreground mb-6">You need to create or join an organization first.</p>
        <Button onClick={() => navigate('/organizer/team')}>Go to Team Management</Button>
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
          <h1 className="text-xl font-bold text-foreground">Community Settings</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Landing Page Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="handle">Community Handle</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">/c/</span>
                <Input
                  id="handle"
                  value={orgHandle}
                  onChange={(e) => setOrgHandle(e.target.value.toLowerCase())}
                  placeholder="my-community"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Only lowercase letters, numbers, hyphens, and underscores
              </p>
            </div>

            <div>
              <Label htmlFor="coverImage">Cover Image URL</Label>
              <Input
                id="coverImage"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div>
              <Label htmlFor="bio">Short Bio</Label>
              <Textarea
                id="bio"
                value={shortBio}
                onChange={(e) => setShortBio(e.target.value)}
                placeholder="Tell people about your community..."
                rows={3}
                maxLength={300}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {shortBio.length}/300 characters
              </p>
            </div>

            <div>
              <Label>Community Tags</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag..."
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button variant="outline" onClick={addTag} type="button">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {communityTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </CardContent>
        </Card>

        {/* Preview Link */}
        {orgHandle && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-2">Your community page:</p>
              <a
                href={`/c/${orgHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                {window.location.origin}/c/{orgHandle}
                <ExternalLink className="h-4 w-4" />
              </a>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
