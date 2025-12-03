import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const INTERESTS = [
  { id: 'music', label: '🎵 Music', emoji: '🎵' },
  { id: 'food', label: '🍕 Food & Dining', emoji: '🍕' },
  { id: 'sports', label: '⚽ Sports', emoji: '⚽' },
  { id: 'art', label: '🎨 Art & Culture', emoji: '🎨' },
  { id: 'tech', label: '💻 Tech', emoji: '💻' },
  { id: 'outdoors', label: '🏕️ Outdoors', emoji: '🏕️' },
  { id: 'fitness', label: '💪 Fitness', emoji: '💪' },
  { id: 'gaming', label: '🎮 Gaming', emoji: '🎮' },
  { id: 'reading', label: '📚 Books', emoji: '📚' },
  { id: 'movies', label: '🎬 Movies', emoji: '🎬' },
  { id: 'travel', label: '✈️ Travel', emoji: '✈️' },
  { id: 'nightlife', label: '🍹 Nightlife', emoji: '🍹' },
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
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">What are you into?</h2>
        <p className="text-muted-foreground">
          Select your interests to find events and people you'll vibe with
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {INTERESTS.map((interest, index) => {
          const isSelected = selected.includes(interest.id);
          
          return (
            <motion.button
              key={interest.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => toggleInterest(interest.id)}
              className={cn(
                "relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left",
                isSelected
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50 bg-card"
              )}
            >
              <span className="text-2xl">{interest.emoji}</span>
              <span className="font-medium text-sm">{interest.label.split(' ').slice(1).join(' ')}</span>
              
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center"
                >
                  <Check className="h-3 w-3 text-primary-foreground" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      <p className="text-sm text-center text-muted-foreground">
        Selected: {selected.length} / 12
      </p>
    </div>
  );
}
