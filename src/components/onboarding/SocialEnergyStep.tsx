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
    <div className="space-y-3">
      {ENERGY_LEVELS.map((level, index) => {
        const isSelected = value === level.value;
        
        return (
          <motion.button
            key={level.value}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08, duration: 0.3 }}
            onClick={() => onChange(level.value)}
            className={cn(
              "w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left",
              isSelected
                ? "border-primary bg-primary/10 shadow-soft"
                : "border-border/60 hover:border-primary/40 bg-card"
            )}
          >
            <div className={cn(
              "h-14 w-14 rounded-xl flex items-center justify-center text-3xl transition-colors",
              isSelected ? "bg-primary/20" : "bg-muted/50"
            )}>
              {level.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-base">{level.label}</div>
              <div className="text-sm text-muted-foreground line-clamp-1">{level.description}</div>
            </div>
            <div className={cn(
              "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
              isSelected 
                ? "border-primary bg-primary" 
                : "border-muted-foreground/30"
            )}>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="h-2.5 w-2.5 rounded-full bg-primary-foreground"
                />
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
