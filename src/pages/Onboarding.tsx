import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { InterestsStep } from '@/components/onboarding/InterestsStep';
import { SocialEnergyStep } from '@/components/onboarding/SocialEnergyStep';
import { LocationStep } from '@/components/onboarding/LocationStep';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const STEPS = ['interests', 'energy', 'location'] as const;
type Step = typeof STEPS[number];

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, refreshProfile } = useAuth();
  
  const [currentStep, setCurrentStep] = useState<Step>('interests');
  const [interests, setInterests] = useState<string[]>([]);
  const [socialEnergy, setSocialEnergy] = useState(3);
  const [city, setCity] = useState('');
  const [radiusKm, setRadiusKm] = useState(25);
  const [saving, setSaving] = useState(false);

  const stepIndex = STEPS.indexOf(currentStep);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const canProceed = () => {
    switch (currentStep) {
      case 'interests':
        return interests.length >= 2;
      case 'energy':
        return socialEnergy >= 1;
      case 'location':
        return city.trim().length > 0;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (currentStep === 'location') {
      // Save and finish
      if (!user?.id) {
        toast({
          title: "Not signed in",
          description: "Please sign in to complete setup",
          variant: "destructive"
        });
        navigate('/auth');
        return;
      }
      
      setSaving(true);
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            interests,
            social_energy: socialEnergy,
            city,
            radius_km: radiusKm,
            onboarding_completed: true
          })
          .eq('id', user.id);

        if (error) throw error;

        await refreshProfile();
        
        toast({
          title: "You're all set!",
          description: "Your profile is ready. Start exploring events!"
        });
        
        navigate('/');
      } catch (error: any) {
        toast({
          title: "Error saving profile",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setSaving(false);
      }
    } else {
      const nextIndex = stepIndex + 1;
      setCurrentStep(STEPS[nextIndex]);
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      setCurrentStep(STEPS[stepIndex - 1]);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center gap-4">
        {stepIndex > 0 && (
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="flex-1">
          <Progress value={progress} className="h-2" />
        </div>
        <span className="text-sm text-muted-foreground font-medium">
          {stepIndex + 1}/{STEPS.length}
        </span>
      </header>

      {/* Content */}
      <div className="flex-1 px-6 py-4 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep === 'interests' && (
              <InterestsStep selected={interests} onChange={setInterests} />
            )}
            {currentStep === 'energy' && (
              <SocialEnergyStep value={socialEnergy} onChange={setSocialEnergy} />
            )}
            {currentStep === 'location' && (
              <LocationStep
                city={city}
                radiusKm={radiusKm}
                onCityChange={setCity}
                onRadiusChange={setRadiusKm}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="p-6 border-t bg-card">
        <Button
          className="w-full h-14 text-lg font-semibold"
          onClick={handleNext}
          disabled={!canProceed() || saving}
        >
          {saving ? (
            'Saving...'
          ) : currentStep === 'location' ? (
            <>
              <Check className="mr-2 h-5 w-5" />
              Complete Setup
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
