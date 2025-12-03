import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { InterestsStep } from '@/components/onboarding/InterestsStep';
import { SocialEnergyStep } from '@/components/onboarding/SocialEnergyStep';
import { LocationStep } from '@/components/onboarding/LocationStep';
import { GlassCard } from '@/components/ui/glass-card';
import { buttonTapVariants } from '@/components/ui/page-transition';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const STEPS = ['interests', 'energy', 'location'] as const;
type Step = typeof STEPS[number];

const stepInfo = {
  interests: {
    title: 'What are you into?',
    subtitle: 'Pick at least 2 interests so we can match you better',
    icon: '🎯',
  },
  energy: {
    title: 'Your social style',
    subtitle: 'This helps us find groups that match your vibe',
    icon: '⚡',
  },
  location: {
    title: 'Where are you?',
    subtitle: "We'll show you events happening nearby",
    icon: '📍',
  },
};

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 100 : -100,
    opacity: 0,
  }),
};

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, refreshProfile } = useAuth();
  
  const [currentStep, setCurrentStep] = useState<Step>('interests');
  const [direction, setDirection] = useState(0);
  const [interests, setInterests] = useState<string[]>([]);
  const [socialEnergy, setSocialEnergy] = useState(3);
  const [city, setCity] = useState('');
  const [radiusKm, setRadiusKm] = useState(25);
  const [saving, setSaving] = useState(false);

  const stepIndex = STEPS.indexOf(currentStep);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;
  const info = stepInfo[currentStep];

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
          title: "You're all set! 🎉",
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
      setDirection(1);
      const nextIndex = stepIndex + 1;
      setCurrentStep(STEPS[nextIndex]);
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      setDirection(-1);
      setCurrentStep(STEPS[stepIndex - 1]);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center gap-4">
        {stepIndex > 0 ? (
          <motion.div
            variants={buttonTapVariants}
            initial="initial"
            whileTap="tap"
          >
            <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </motion.div>
        ) : (
          <div className="w-10" />
        )}
        <div className="flex-1">
          <Progress value={progress} className="h-2" />
        </div>
        <span className="text-sm text-muted-foreground font-medium w-10 text-right">
          {stepIndex + 1}/{STEPS.length}
        </span>
      </header>

      {/* Step indicator dots */}
      <div className="flex justify-center gap-2 pb-4">
        {STEPS.map((step, index) => (
          <motion.div
            key={step}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === stepIndex
                ? 'w-8 bg-primary'
                : index < stepIndex
                ? 'w-2 bg-primary/60'
                : 'w-2 bg-muted'
            }`}
            animate={{ scale: index === stepIndex ? 1.1 : 1 }}
          />
        ))}
      </div>

      {/* Title Section */}
      <div className="px-6 pb-4">
        <motion.div
          key={currentStep + '-title'}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <span className="text-4xl mb-3 block">{info.icon}</span>
          <h1 className="text-2xl font-bold tracking-tight mb-2">{info.title}</h1>
          <p className="text-muted-foreground">{info.subtitle}</p>
        </motion.div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-4 overflow-y-auto">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
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
      <div className="p-6 border-t bg-card/50 backdrop-blur-sm">
        <motion.div
          variants={buttonTapVariants}
          initial="initial"
          whileTap="tap"
        >
          <Button
            className="w-full h-14 text-lg font-semibold shadow-lg shadow-primary/20"
            onClick={handleNext}
            disabled={!canProceed() || saving}
          >
            {saving ? (
              <div className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                <span>Saving...</span>
              </div>
            ) : currentStep === 'location' ? (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Complete Setup
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </motion.div>
        
        {/* Skip option for first steps */}
        {currentStep !== 'location' && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={handleNext}
            disabled={saving}
          >
            Skip for now
          </motion.button>
        )}
      </div>
    </div>
  );
}
