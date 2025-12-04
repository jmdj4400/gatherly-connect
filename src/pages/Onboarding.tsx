import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { InterestsStep } from '@/components/onboarding/InterestsStep';
import { SocialEnergyStep } from '@/components/onboarding/SocialEnergyStep';
import { LocationStep } from '@/components/onboarding/LocationStep';
import { NotificationsStep } from '@/components/onboarding/NotificationsStep';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { recomputeEmbedding } from '@/hooks/useVibeScore';
import { useTranslation } from '@/lib/i18n';

const STEPS = ['interests', 'energy', 'location', 'notifications'] as const;
type Step = typeof STEPS[number];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 80 : -80,
    opacity: 0,
  }),
};

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, refreshProfile } = useAuth();
  const { t } = useTranslation();
  
  const [currentStep, setCurrentStep] = useState<Step>('interests');
  const [direction, setDirection] = useState(0);
  const [interests, setInterests] = useState<string[]>([]);
  const [socialEnergy, setSocialEnergy] = useState(3);
  const [city, setCity] = useState('');
  const [radiusKm, setRadiusKm] = useState(25);
  const [saving, setSaving] = useState(false);

  const stepIndex = STEPS.indexOf(currentStep);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const stepInfo = {
    interests: {
      title: t('onboarding.interests.title'),
      subtitle: t('onboarding.interests.subtitle'),
      icon: '🎯',
    },
    energy: {
      title: t('onboarding.energy.title'),
      subtitle: t('onboarding.energy.subtitle'),
      icon: '⚡',
    },
    location: {
      title: t('onboarding.location.title'),
      subtitle: t('onboarding.location.subtitle'),
      icon: '📍',
    },
    notifications: {
      title: t('onboarding.notifications.title'),
      subtitle: t('onboarding.notifications.subtitle'),
      icon: '🔔',
    },
  };

  const info = stepInfo[currentStep];

  const canProceed = () => {
    switch (currentStep) {
      case 'interests':
        return interests.length >= 2;
      case 'energy':
        return socialEnergy >= 1;
      case 'location':
        return city.trim().length > 0;
      case 'notifications':
        return true;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (currentStep === 'location') {
      if (!user?.id) {
        toast({
          title: t('onboarding.not_signed_in'),
          description: t('onboarding.sign_in_to_complete'),
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

        await recomputeEmbedding();
        await refreshProfile();
        
        setDirection(1);
        setCurrentStep('notifications');
      } catch (error: any) {
        toast({
          title: t('onboarding.error_saving'),
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setSaving(false);
      }
    } else if (currentStep === 'notifications') {
      toast({
        title: t('onboarding.all_set'),
        description: t('onboarding.profile_ready')
      });
      navigate('/');
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
      <header className="p-5 flex items-center gap-4">
        {stepIndex > 0 ? (
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleBack} 
              className="rounded-xl h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </motion.div>
        ) : (
          <div className="w-10" />
        )}
        <div className="flex-1">
          <Progress value={progress} className="h-1.5" />
        </div>
        <span className="text-sm text-muted-foreground font-medium w-10 text-right tabular-nums">
          {stepIndex + 1}/{STEPS.length}
        </span>
      </header>

      {/* Step indicator dots */}
      <div className="flex justify-center gap-2 pb-6">
        {STEPS.map((step, index) => (
          <motion.div
            key={step}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === stepIndex
                ? 'w-8 bg-primary'
                : index < stepIndex
                ? 'w-1.5 bg-primary/60'
                : 'w-1.5 bg-muted'
            }`}
            animate={{ scale: index === stepIndex ? 1.1 : 1 }}
          />
        ))}
      </div>

      {/* Title Section */}
      <div className="px-6 pb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep + '-title'}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="text-center"
          >
            <motion.div 
              className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4 shadow-soft"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <span className="text-3xl">{info.icon}</span>
            </motion.div>
            <h1 className="text-2xl font-bold tracking-tight mb-2">{info.title}</h1>
            <p className="text-muted-foreground">{info.subtitle}</p>
          </motion.div>
        </AnimatePresence>
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
            transition={{ duration: 0.25, ease: 'easeInOut' }}
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
            {currentStep === 'notifications' && (
              <NotificationsStep onComplete={handleNext} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      {currentStep !== 'notifications' && (
        <div className="p-6 border-t border-border/50 bg-card/50 backdrop-blur-xl">
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              className="w-full h-14 text-base font-semibold shadow-primary"
              variant="gradient"
              onClick={handleNext}
              disabled={!canProceed() || saving}
            >
              {saving ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  <span>{t('onboarding.saving')}</span>
                </div>
              ) : currentStep === 'location' ? (
                <>
                  <Bell className="mr-2 h-5 w-5" />
                  {t('onboarding.continue_notifications')}
                </>
              ) : (
                <>
                  {t('onboarding.continue')}
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
              className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
              onClick={handleNext}
              disabled={saving}
            >
              {t('onboarding.skip')}
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
}