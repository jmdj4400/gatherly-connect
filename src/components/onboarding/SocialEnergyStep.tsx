import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const ENERGY_LEVELS = [
  { value: 1, label: 'Quiet Observer', emoji: '🌙', description: 'I prefer small, intimate gatherings' },
  { value: 2, label: 'Selective Socializer', emoji: '🌤️', description: 'I enjoy meeting new people in small doses' },
  { value: 3, label: 'Balanced', emoji: '☀️', description: 'I adapt to both quiet and lively settings' },
  { value: 4, label: 'Social Butterfly', emoji: '🦋', description: 'I thrive in social settings' },
  { value: 5, label: 'Life of the Party', emoji: '🎉', description: 'The more people, the better!' },
];

interface SocialEnergyStepProps {
  value: number;
  onChange: (value: number) => void;
}

export function SocialEnergyStep({ value, onChange }: SocialEnergyStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">What's your social energy?</h2>
        <p className="text-muted-foreground">
          This helps us match you with people who have similar vibes
        </p>
      </div>

      <div className="space-y-3">
        {ENERGY_LEVELS.map((level, index) => {
          const isSelected = value === level.value;
          
          return (
            <motion.button
              key={level.value}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onChange(level.value)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                isSelected
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50 bg-card"
              )}
            >
              <span className="text-3xl">{level.emoji}</span>
              <div className="flex-1">
                <div className="font-semibold">{level.label}</div>
                <div className="text-sm text-muted-foreground">{level.description}</div>
              </div>
              <div className={cn(
                "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors",
                isSelected ? "border-primary bg-primary" : "border-muted"
              )}>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="h-3 w-3 rounded-full bg-primary-foreground"
                  />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
