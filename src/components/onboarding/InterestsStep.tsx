import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/ui/glass-card';

const INTERESTS = [
  { id: 'music', label: 'Music', emoji: '🎵' },
  { id: 'food', label: 'Food & Dining', emoji: '🍕' },
  { id: 'sports', label: 'Sports', emoji: '⚽' },
  { id: 'art', label: 'Art & Culture', emoji: '🎨' },
  { id: 'tech', label: 'Tech', emoji: '💻' },
  { id: 'outdoors', label: 'Outdoors', emoji: '🏕️' },
  { id: 'fitness', label: 'Fitness', emoji: '💪' },
  { id: 'gaming', label: 'Gaming', emoji: '🎮' },
  { id: 'reading', label: 'Books', emoji: '📚' },
  { id: 'movies', label: 'Movies', emoji: '🎬' },
  { id: 'travel', label: 'Travel', emoji: '✈️' },
  { id: 'nightlife', label: 'Nightlife', emoji: '🍹' },
];

interface InterestsStepProps {
  selected: string[];
  onChange: (interests: string[]) => void;
}

export function InterestsStep({ selected, onChange }: InterestsStepProps) {
  const toggleInterest = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(i => i !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        {INTERESTS.map((interest, index) => {
          const isSelected = selected.includes(interest.id);
          
          return (
            <motion.button
              key={interest.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, duration: 0.3 }}
              onClick={() => toggleInterest(interest.id)}
              className={cn(
                "relative flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left",
                isSelected
                  ? "border-primary bg-primary/10 shadow-soft"
                  : "border-border/60 hover:border-primary/40 bg-card"
              )}
            >
              <span className="text-2xl">{interest.emoji}</span>
              <span className="font-medium text-sm flex-1">{interest.label}</span>
              
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="h-6 w-6 rounded-full bg-primary flex items-center justify-center shadow-sm"
                >
                  <Check className="h-3.5 w-3.5 text-primary-foreground" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="flex items-center justify-center">
        <GlassCard variant="subtle" className="px-4 py-2">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{selected.length}</span>
            <span className="mx-1">/</span>
            <span>{INTERESTS.length} selected</span>
            {selected.length < 2 && (
              <span className="text-primary ml-2">· Select at least 2</span>
            )}
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
