import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

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
            // Using a free reverse geocoding API
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
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Where are you?</h2>
        <p className="text-muted-foreground">
          We'll show you events happening nearby
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Enter your city"
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            className="pl-10 h-12"
          />
        </div>

        <Button
          variant="outline"
          className="w-full h-12"
          onClick={detectLocation}
          disabled={detectingLocation}
        >
          <Navigation className="mr-2 h-5 w-5" />
          {detectingLocation ? 'Detecting...' : 'Use my current location'}
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4 pt-4"
      >
        <div className="flex items-center justify-between">
          <span className="font-medium">Search radius</span>
          <span className="text-primary font-semibold">{radiusKm} km</span>
        </div>
        
        <Slider
          value={[radiusKm]}
          onValueChange={([val]) => onRadiusChange(val)}
          min={5}
          max={100}
          step={5}
          className="py-4"
        />
        
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>5 km</span>
          <span>100 km</span>
        </div>
      </motion.div>
    </div>
  );
}
