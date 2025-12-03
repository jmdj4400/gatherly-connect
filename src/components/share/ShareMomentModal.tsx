import { useState, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { Download, Share2, X, Loader2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { StoryCard } from './StoryCard';
import { format } from 'date-fns';

interface Member {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface ShareMomentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventTitle: string;
  eventImageUrl: string | null;
  eventDate: string;
  eventId: string;
  members: Member[];
}

export function ShareMomentModal({
  open,
  onOpenChange,
  eventTitle,
  eventImageUrl,
  eventDate,
  eventId,
  members,
}: ShareMomentModalProps) {
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/event/${eventId}`;
  const formattedDate = format(new Date(eventDate), 'EEEE, MMMM d, yyyy');

  const generateImage = useCallback(async () => {
    if (!cardRef.current) return null;

    setGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
      });

      const dataUrl = canvas.toDataURL('image/png', 1.0);
      setGeneratedImage(dataUrl);
      return dataUrl;
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: 'Error generating image',
        description: 'Please try again',
        variant: 'destructive',
      });
      return null;
    } finally {
      setGenerating(false);
    }
  }, [toast]);

  const handleDownload = async () => {
    const imageUrl = generatedImage || (await generateImage());
    if (!imageUrl) return;

    const link = document.createElement('a');
    link.download = `gatherly-moment-${eventId.slice(0, 8)}.png`;
    link.href = imageUrl;
    link.click();

    toast({
      title: 'Downloaded!',
      description: 'Your story card has been saved',
    });
  };

  const handleShare = async () => {
    const imageUrl = generatedImage || (await generateImage());
    if (!imageUrl) return;

    // Convert data URL to blob
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const file = new File([blob], 'gatherly-moment.png', { type: 'image/png' });

    if (navigator.share && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: `I met ${members.length - 1} new friends at ${eventTitle}!`,
          text: 'Join me on Gatherly to meet new people at events!',
          files: [file],
        });
        toast({
          title: 'Shared!',
          description: 'Your story has been shared',
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: 'Link copied!',
        description: 'Share link has been copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Could not copy',
        description: 'Please copy the link manually',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-card">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <span className="text-xl">📸</span>
            Share Your Moment
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* Card Preview */}
          <div className="relative flex justify-center overflow-hidden rounded-xl bg-muted/50 p-4">
            <div className="transform scale-[0.85] origin-center">
              <StoryCard
                ref={cardRef}
                eventTitle={eventTitle}
                eventImageUrl={eventImageUrl}
                members={members}
                eventDate={formattedDate}
                shareUrl={shareUrl}
              />
            </div>

            {/* Generating overlay */}
            <AnimatePresence>
              {generating && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Generating...</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-12"
              onClick={handleDownload}
              disabled={generating}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              className="h-12"
              onClick={handleShare}
              disabled={generating}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </>
              )}
            </Button>
          </div>

          {/* Share message */}
          <p className="text-xs text-center text-muted-foreground">
            Share your experience and invite friends to join Gatherly!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
