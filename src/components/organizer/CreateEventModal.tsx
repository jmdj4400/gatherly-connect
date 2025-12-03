import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, MapPin, Repeat, Image, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

interface CreateEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

const DAY_OPTIONS = [
  { value: '0', label: 'Søndag' },
  { value: '1', label: 'Mandag' },
  { value: '2', label: 'Tirsdag' },
  { value: '3', label: 'Onsdag' },
  { value: '4', label: 'Torsdag' },
  { value: '5', label: 'Fredag' },
  { value: '6', label: 'Lørdag' },
];

export function CreateEventModal({ open, onOpenChange, onCreated }: CreateEventModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [venueName, setVenueName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  
  // Recurrence
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<'weekly' | 'monthly'>('weekly');
  const [recurrenceDay, setRecurrenceDay] = useState('1');

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDate('');
    setTime('');
    setVenueName('');
    setAddress('');
    setCity('');
    setCategory('');
    setImageUrl('');
    setIsRecurring(false);
    setRecurrenceType('weekly');
    setRecurrenceDay('1');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!title || !date || !time) {
      toast({
        title: 'Manglende felter',
        description: 'Udfyld venligst titel, dato og tid',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const startsAt = new Date(`${date}T${time}`).toISOString();

      const eventData: any = {
        title,
        description: description || null,
        starts_at: startsAt,
        venue_name: venueName || null,
        address: address || null,
        city: city || null,
        category: category || null,
        image_url: imageUrl || null,
        allow_come_alone: true,
        max_group_size: 5,
        recurrence_type: isRecurring ? recurrenceType : 'none',
        recurrence_day: isRecurring && recurrenceType === 'weekly' ? parseInt(recurrenceDay) : null,
        recurrence_time: isRecurring ? time : null,
      };

      const { data, error } = await supabase
        .from('events')
        .insert(eventData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Event oprettet!',
        description: isRecurring 
          ? 'Gentagne events vil blive genereret automatisk'
          : 'Dit event er nu live',
      });

      // If recurring, trigger generation of future events
      if (isRecurring) {
        await supabase.functions.invoke('generate-recurring-events');
      }

      resetForm();
      onOpenChange(false);
      onCreated();

    } catch (error: any) {
      console.error('Error creating event:', error);
      toast({
        title: 'Fejl',
        description: error.message || 'Kunne ikke oprette event',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Opret nyt event</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="F.eks. Fredagsbar"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Hvad handler eventet om?"
              rows={3}
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="date">Dato *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Tid *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="venue">Sted</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="venue"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                placeholder="Stedets navn"
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Gade og nr."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">By</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="København"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Kategori</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Vælg kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="music">🎵 Musik</SelectItem>
                <SelectItem value="food">🍕 Mad & Drikke</SelectItem>
                <SelectItem value="sports">⚽ Sport</SelectItem>
                <SelectItem value="art">🎨 Kunst & Kultur</SelectItem>
                <SelectItem value="tech">💻 Tech</SelectItem>
                <SelectItem value="outdoors">🏕️ Udendørs</SelectItem>
                <SelectItem value="fitness">💪 Fitness</SelectItem>
                <SelectItem value="gaming">🎮 Gaming</SelectItem>
                <SelectItem value="nightlife">🍹 Natteliv</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Image URL */}
          <div className="space-y-2">
            <Label htmlFor="imageUrl">Billede URL</Label>
            <div className="relative">
              <Image className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="imageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Recurrence */}
          <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-primary" />
                <Label htmlFor="recurring" className="cursor-pointer">
                  Gentag event
                </Label>
              </div>
              <Switch
                id="recurring"
                checked={isRecurring}
                onCheckedChange={setIsRecurring}
              />
            </div>

            <AnimatePresence>
              {isRecurring && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Gentagelse</Label>
                      <Select 
                        value={recurrenceType} 
                        onValueChange={(v) => setRecurrenceType(v as 'weekly' | 'monthly')}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Ugentligt</SelectItem>
                          <SelectItem value="monthly">Månedligt</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {recurrenceType === 'weekly' && (
                      <div className="space-y-2">
                        <Label>Dag</Label>
                        <Select value={recurrenceDay} onValueChange={setRecurrenceDay}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DAY_OPTIONS.map(day => (
                              <SelectItem key={day.value} value={day.value}>
                                {day.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    De næste 6 events vil automatisk blive oprettet
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Annuller
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Opretter...' : 'Opret Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
