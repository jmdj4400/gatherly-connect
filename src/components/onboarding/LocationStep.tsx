import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { GlassCard } from '@/components/ui/glass-card';

interface LocationStepProps {
  city: string;
  radiusKm: number;
  onCityChange: (city: string) => void;
  onRadiusChange: (radius: number) => void;
}

export function LocationStep({ city, radiusKm, onCityChange, onRadiusChange }: LocationStepProps) {
  const [detectingLocation, setDetectingLocation] = useState(false);

  const detectLocation = async () => {
    setDetectingLocation(true);
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json`
            );
            const data = await response.json();
            const detectedCity = data.address?.city || data.address?.town || data.address?.village || 'Unknown';
            onCityChange(detectedCity);
          } catch (error) {
            console.error('Failed to detect city:', error);
          }
          setDetectingLocation(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setDetectingLocation(false);
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Enter your city"
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            className="pl-12 h-14 text-base"
          />
        </div>

        <Button
          variant="outline"
          className="w-full h-14 text-base font-medium"
          onClick={detectLocation}
          disabled={detectingLocation}
        >
          {detectingLocation ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Detecting location...
            </>
          ) : (
            <>
              <Navigation className="mr-2 h-5 w-5" />
              Use my current location
            </>
          )}
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <GlassCard variant="elevated" className="p-5">
          <div className="flex items-center justify-between mb-6">
            <span className="font-semibold">Search radius</span>
            <span className="text-primary font-bold text-lg tabular-nums">{radiusKm} km</span>
          </div>
          
          <Slider
            value={[radiusKm]}
            onValueChange={([val]) => onRadiusChange(val)}
            min={5}
            max={100}
            step={5}
            className="py-2"
          />
          
          <div className="flex justify-between text-sm text-muted-foreground mt-4">
            <span>5 km</span>
            <span className="text-muted-foreground/60">•</span>
            <span>50 km</span>
            <span className="text-muted-foreground/60">•</span>
            <span>100 km</span>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
