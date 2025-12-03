import { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'elevated' | 'outlined' | 'subtle';
  interactive?: boolean;
}

const hoverVariants = {
  initial: { scale: 1, y: 0 },
  hover: {
    scale: 1.02,
    y: -4,
    transition: {
      duration: 0.2,
      ease: 'easeOut' as const,
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
    },
  },
};

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = 'default', interactive = false, children, ...props }, ref) => {
    const baseStyles = 'rounded-xl backdrop-blur-sm transition-colors';
    
    const variantStyles = {
      default: 'bg-card/95 border border-border/50 shadow-md',
      elevated: 'bg-card border border-border/30 shadow-lg',
      outlined: 'bg-transparent border-2 border-border',
      subtle: 'bg-card/60 border border-border/20 shadow-sm',
    };

    if (interactive) {
      return (
        <motion.div
          ref={ref}
          className={cn(baseStyles, variantStyles[variant], 'cursor-pointer', className)}
          variants={hoverVariants}
          initial="initial"
          whileHover="hover"
          whileTap="tap"
          {...props}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <motion.div
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], className)}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

export { GlassCard };
