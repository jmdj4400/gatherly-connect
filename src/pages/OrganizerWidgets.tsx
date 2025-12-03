import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Copy, Check, Code, Instagram, QrCode, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageLoader } from '@/components/ui/loading-spinner';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { QRCodeSVG } from 'qrcode.react';

interface Event {
  id: string;
  title: string;
  starts_at: string;
  image_url: string | null;
}

interface Org {
  id: string;
  name: string;
  org_handle: string | null;
}

export default function OrganizerWidgets() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [events, setEvents] = useState<Event[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [generatingSticker, setGeneratingSticker] = useState(false);

  const baseUrl = window.location.origin;

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    }
  }, [user, authLoading]);

  const fetchData = async () => {
    if (!user) return;
    
    setLoading(true);

    // Fetch user's orgs
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('org_id')
      .eq('user_id', user.id)
      .eq('role', 'org_admin');

    const orgIds = userRoles?.map(r => r.org_id).filter(Boolean) || [];

    if (orgIds.length > 0) {
      const { data: orgsData } = await supabase
        .from('orgs')
        .select('id, name, org_handle')
        .in('id', orgIds);
      
      setOrgs(orgsData || []);
      if (orgsData?.[0]) {
        setSelectedOrgId(orgsData[0].id);
      }

      // Fetch events
      const { data: eventsData } = await supabase
        .from('events')
        .select('id, title, starts_at, image_url')
        .in('host_org_id', orgIds)
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true });

      setEvents(eventsData || []);
      if (eventsData?.[0]) {
        setSelectedEventId(eventsData[0].id);
      }
    }

    setLoading(false);
  };

  const copyToClipboard = async (code: string, type: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(type);
    toast({ title: 'Kopieret!', description: 'Koden er kopieret til udklipsholderen' });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const selectedEvent = events.find(e => e.id === selectedEventId);
  const selectedOrg = orgs.find(o => o.id === selectedOrgId);

  const joinWidgetCode = selectedEventId ? 
    `<script src="${baseUrl}/embed.js"></script>\n<gatherly-join event-id="${selectedEventId}"></gatherly-join>` : '';
  
  const countdownWidgetCode = selectedEventId ?
    `<script src="${baseUrl}/embed.js"></script>\n<gatherly-countdown event-id="${selectedEventId}"></gatherly-countdown>` : '';
  
  const eventsStripCode = selectedOrg?.org_handle ?
    `<script src="${baseUrl}/embed.js"></script>\n<gatherly-events org-handle="${selectedOrg.org_handle}" limit="5"></gatherly-events>` : '';

  const deepLink = selectedEventId ? `${baseUrl}/event/${selectedEventId}?autojoin=true` : '';

  const downloadQRSticker = async () => {
    if (!selectedEvent) return;
    
    setGeneratingSticker(true);
    
    try {
      // Create a canvas for the story sticker
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Instagram story dimensions (9:16 aspect ratio)
      canvas.width = 1080;
      canvas.height = 1920;

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#f97316');
      gradient.addColorStop(1, '#fed7aa');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // White card background
      const cardY = 500;
      const cardHeight = 900;
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.roundRect(80, cardY, canvas.width - 160, cardHeight, 40);
      ctx.fill();

      // Event title
      ctx.fillStyle = '#1a1a1a';
      ctx.font = 'bold 56px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      
      // Word wrap title
      const maxWidth = canvas.width - 240;
      const words = selectedEvent.title.split(' ');
      let line = '';
      let y = cardY + 100;
      
      for (const word of words) {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && line !== '') {
          ctx.fillText(line.trim(), canvas.width / 2, y);
          line = word + ' ';
          y += 70;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line.trim(), canvas.width / 2, y);

      // Date
      ctx.font = '36px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = '#6b7280';
      const dateStr = new Date(selectedEvent.starts_at).toLocaleDateString('da-DK', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
      });
      ctx.fillText(dateStr, canvas.width / 2, y + 80);

      // QR Code
      const qrCanvas = document.createElement('canvas');
      const qrSize = 300;
      
      // Use the QRCodeSVG to create a temp element and get data URL
      const tempDiv = document.createElement('div');
      document.body.appendChild(tempDiv);
      
      // Create QR code image
      const qrImg = new Image();
      qrImg.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve) => {
        // Generate QR as data URL using canvas
        const qrTempCanvas = document.createElement('canvas');
        qrTempCanvas.width = qrSize;
        qrTempCanvas.height = qrSize;
        const qrCtx = qrTempCanvas.getContext('2d');
        if (qrCtx) {
          qrCtx.fillStyle = 'white';
          qrCtx.fillRect(0, 0, qrSize, qrSize);
          
          // Simple QR placeholder - in production use a proper QR library
          qrCtx.fillStyle = '#1a1a1a';
          qrCtx.font = '24px monospace';
          qrCtx.textAlign = 'center';
          qrCtx.fillText('SCAN ME', qrSize/2, qrSize/2);
        }
        
        qrImg.onload = () => resolve();
        qrImg.src = qrTempCanvas.toDataURL();
      });

      // Draw QR code placeholder area
      const qrX = (canvas.width - qrSize) / 2;
      const qrY = y + 150;
      ctx.fillStyle = '#f3f4f6';
      ctx.beginPath();
      ctx.roundRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40, 20);
      ctx.fill();
      
      // Draw actual QR code using SVG conversion
      const qrSvgElement = document.getElementById('qr-code-svg');
      if (qrSvgElement) {
        const svgData = new XMLSerializer().serializeToString(qrSvgElement);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        
        const img = new Image();
        await new Promise<void>((resolve) => {
          img.onload = () => {
            ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
            URL.revokeObjectURL(svgUrl);
            resolve();
          };
          img.src = svgUrl;
        });
      }

      // CTA text
      ctx.fillStyle = '#1a1a1a';
      ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('Scan to Join Alone', canvas.width / 2, qrY + qrSize + 70);

      // Gatherly branding
      ctx.font = '28px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = '#f97316';
      ctx.fillText('gatherly.app', canvas.width / 2, cardY + cardHeight - 60);

      // Swipe up text at bottom
      ctx.fillStyle = 'white';
      ctx.font = 'bold 40px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('Swipe Up to Join!', canvas.width / 2, canvas.height - 150);

      // Download
      const link = document.createElement('a');
      link.download = `gatherly-story-${selectedEvent.title.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast({ title: 'Story sticker downloaded!', description: 'Upload it to your Instagram story' });
    } catch (error) {
      console.error('Error generating sticker:', error);
      toast({ title: 'Error', description: 'Could not generate sticker', variant: 'destructive' });
    } finally {
      setGeneratingSticker(false);
    }
  };

  if (authLoading || loading) {
    return <PageLoader message="Loading widgets..." />;
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-semibold text-lg">Embed Widgets</h1>
            <p className="text-xs text-muted-foreground">
              Share on Instagram, websites & more
            </p>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Event Selector */}
        <GlassCard variant="subtle" className="p-4">
          <label className="text-sm font-medium mb-2 block">Select Event</label>
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose an event" />
            </SelectTrigger>
            <SelectContent>
              {events.map(event => (
                <SelectItem key={event.id} value={event.id}>
                  {event.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </GlassCard>

        <Tabs defaultValue="widgets" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="widgets">
              <Code className="h-4 w-4 mr-1" />
              Widgets
            </TabsTrigger>
            <TabsTrigger value="instagram">
              <Instagram className="h-4 w-4 mr-1" />
              Instagram
            </TabsTrigger>
            <TabsTrigger value="deeplink">
              <ExternalLink className="h-4 w-4 mr-1" />
              Deep Link
            </TabsTrigger>
          </TabsList>

          {/* Widgets Tab */}
          <TabsContent value="widgets" className="space-y-4 mt-4">
            {/* Join Button Widget */}
            <GlassCard variant="elevated" className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Badge>Join Button</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                A simple "Join Alone" button for your website
              </p>
              <div className="bg-muted/50 rounded-lg p-3 font-mono text-xs overflow-x-auto mb-3">
                <code>{joinWidgetCode}</code>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(joinWidgetCode, 'join')}
                disabled={!selectedEventId}
              >
                {copiedCode === 'join' ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                Copy Code
              </Button>
            </GlassCard>

            {/* Countdown Widget */}
            <GlassCard variant="elevated" className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Badge>Countdown</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Live countdown timer with event details
              </p>
              <div className="bg-muted/50 rounded-lg p-3 font-mono text-xs overflow-x-auto mb-3">
                <code>{countdownWidgetCode}</code>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(countdownWidgetCode, 'countdown')}
                disabled={!selectedEventId}
              >
                {copiedCode === 'countdown' ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                Copy Code
              </Button>
            </GlassCard>

            {/* Events Strip Widget */}
            <GlassCard variant="elevated" className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Badge>Events Strip</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Horizontal scrollable list of upcoming events
              </p>
              <div className="bg-muted/50 rounded-lg p-3 font-mono text-xs overflow-x-auto mb-3">
                <code>{eventsStripCode || 'Set org handle in settings first'}</code>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(eventsStripCode, 'events')}
                disabled={!selectedOrg?.org_handle}
              >
                {copiedCode === 'events' ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                Copy Code
              </Button>
            </GlassCard>
          </TabsContent>

          {/* Instagram Tab */}
          <TabsContent value="instagram" className="space-y-4 mt-4">
            <GlassCard variant="elevated" className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
                  <Instagram className="h-3 w-3 mr-1" />
                  Story Sticker
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Download a story sticker with QR code for Instagram
              </p>

              {selectedEvent && (
                <div className="space-y-4">
                  {/* Preview */}
                  <div className="bg-gradient-to-br from-primary to-orange-200 rounded-2xl p-6 text-center">
                    <div className="bg-card rounded-xl p-4 mx-auto max-w-[200px]">
                      <h3 className="font-bold text-sm mb-2">{selectedEvent.title}</h3>
                      <div className="bg-muted rounded-lg p-2 mb-2">
                        <QRCodeSVG
                          id="qr-code-svg"
                          value={deepLink}
                          size={120}
                          level="M"
                          includeMargin={false}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Scan to Join</p>
                    </div>
                    <p className="text-card text-xs mt-3 font-medium">Swipe Up!</p>
                  </div>

                  <Button
                    className="w-full"
                    onClick={downloadQRSticker}
                    disabled={generatingSticker}
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    {generatingSticker ? 'Generating...' : 'Download Story Sticker'}
                  </Button>
                </div>
              )}
            </GlassCard>

            <GlassCard variant="subtle" className="p-4">
              <h3 className="font-medium mb-2">How to use:</h3>
              <ol className="text-sm text-muted-foreground space-y-2">
                <li>1. Download the story sticker above</li>
                <li>2. Upload to your Instagram story</li>
                <li>3. Add a "Link" sticker with your deep link</li>
                <li>4. Followers can scan QR or swipe up to join!</li>
              </ol>
            </GlassCard>
          </TabsContent>

          {/* Deep Link Tab */}
          <TabsContent value="deeplink" className="space-y-4 mt-4">
            <GlassCard variant="elevated" className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Badge>Auto-Join Link</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                One-click join link - opens event page and auto-joins
              </p>
              
              <div className="bg-muted/50 rounded-lg p-3 mb-3">
                <code className="text-sm break-all">{deepLink}</code>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(deepLink, 'deeplink')}
                  disabled={!selectedEventId}
                >
                  {copiedCode === 'deeplink' ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  Copy Link
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(deepLink, '_blank')}
                  disabled={!selectedEventId}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Test Link
                </Button>
              </div>
            </GlassCard>

            <GlassCard variant="subtle" className="p-4">
              <h3 className="font-medium mb-2">Use this link in:</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Instagram bio link</li>
                <li>• Instagram story "Link" sticker</li>
                <li>• Email newsletters</li>
                <li>• SMS campaigns</li>
                <li>• QR codes on posters</li>
              </ul>
            </GlassCard>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
