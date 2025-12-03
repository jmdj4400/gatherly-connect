import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Instagram, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Event {
  id: string;
  title: string;
  starts_at: string;
  venue_name: string | null;
}

interface ShareAssetsModalProps {
  event: Event;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Assets {
  story?: string;
  post?: string;
}

export function ShareAssetsModal({ event, open, onOpenChange }: ShareAssetsModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [assets, setAssets] = useState<Assets>({});
  const [activeTab, setActiveTab] = useState<'story' | 'post'>('story');

  useEffect(() => {
    if (open && event.id) {
      fetchExistingAssets();
    }
  }, [open, event.id]);

  const fetchExistingAssets = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('event_assets')
      .select('asset_type, image_url')
      .eq('event_id', event.id);

    if (!error && data) {
      const assetsMap: Assets = {};
      data.forEach(asset => {
        assetsMap[asset.asset_type as 'story' | 'post'] = asset.image_url;
      });
      setAssets(assetsMap);
    }
    
    setLoading(false);
  };

  const generateAssets = async () => {
    setGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-event-assets', {
        body: { event_id: event.id, asset_type: 'both' }
      });

      if (error) throw error;

      if (data?.assets) {
        setAssets(prev => ({ ...prev, ...data.assets }));
        toast({
          title: 'Billeder genereret!',
          description: 'Dine Instagram-billeder er klar til download',
        });
      }
    } catch (error: any) {
      console.error('Error generating assets:', error);
      toast({
        title: 'Fejl',
        description: error.message || 'Kunne ikke generere billeder',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const downloadImage = async (imageUrl: string, filename: string) => {
    try {
      // For base64 images
      if (imageUrl.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // For URL images
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      
      toast({
        title: 'Downloaded!',
        description: `${filename} er gemt`,
      });
    } catch (error) {
      toast({
        title: 'Fejl',
        description: 'Kunne ikke downloade billede',
        variant: 'destructive',
      });
    }
  };

  const formatEventTitle = (title: string) => {
    return title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Instagram className="h-5 w-5 text-pink-500" />
            Del til Instagram
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Generer og download billeder optimeret til Instagram Story og Feed.
          </p>

          {/* Generate button */}
          {(!assets.story && !assets.post) && !loading && (
            <Button 
              onClick={generateAssets} 
              disabled={generating}
              className="w-full"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Genererer...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generer Billeder
                </>
              )}
            </Button>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Preview tabs */}
          {(assets.story || assets.post) && (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'story' | 'post')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="story" disabled={!assets.story}>
                  Story (9:16)
                </TabsTrigger>
                <TabsTrigger value="post" disabled={!assets.post}>
                  Post (1:1)
                </TabsTrigger>
              </TabsList>

              <TabsContent value="story" className="mt-4">
                {assets.story && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <div className="relative aspect-[9/16] max-h-[400px] mx-auto rounded-lg overflow-hidden bg-muted">
                      <img
                        src={assets.story}
                        alt="Instagram Story Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      onClick={() => downloadImage(
                        assets.story!,
                        `${formatEventTitle(event.title)}-story.png`
                      )}
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Story
                    </Button>
                  </motion.div>
                )}
              </TabsContent>

              <TabsContent value="post" className="mt-4">
                {assets.post && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <div className="relative aspect-square max-h-[300px] mx-auto rounded-lg overflow-hidden bg-muted">
                      <img
                        src={assets.post}
                        alt="Instagram Post Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      onClick={() => downloadImage(
                        assets.post!,
                        `${formatEventTitle(event.title)}-post.png`
                      )}
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Post
                    </Button>
                  </motion.div>
                )}
              </TabsContent>
            </Tabs>
          )}

          {/* Regenerate button */}
          {(assets.story || assets.post) && (
            <Button 
              variant="outline" 
              onClick={generateAssets} 
              disabled={generating}
              className="w-full"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Genererer...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generer Nye Billeder
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
