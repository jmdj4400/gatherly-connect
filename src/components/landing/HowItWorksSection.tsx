import { motion } from 'framer-motion';
import { Search, Users, PartyPopper, ArrowRight } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';

const steps = [
  {
    icon: Search,
    step: '01',
    title: 'Discover Events',
    description: 'Browse local events that match your interests. From wine tastings to running clubs, find activities you actually want to do.',
    visual: 'event-feed',
  },
  {
    icon: Users,
    step: '02',
    title: 'Join Alone, Get Matched',
    description: "Press 'Join Alone' and our smart algorithm matches you with 2-4 compatible people based on interests and social energy.",
    visual: 'matching',
  },
  {
    icon: PartyPopper,
    step: '03',
    title: 'Meet Up & Enjoy',
    description: 'Chat with your group before the event, coordinate meet-up spots, and arrive together. Making friends has never been easier.',
    visual: 'meetup',
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-16 md:py-24">
      <div className="max-w-[1220px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            How Gatherly Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to go from scrolling alone to socializing together
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="relative"
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-20 left-full w-8 z-10">
                  <ArrowRight className="h-6 w-6 text-border -translate-x-1/2" />
                </div>
              )}

              <GlassCard variant="elevated" className="p-6 h-full group hover:shadow-xl transition-shadow">
                {/* Step Number */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <step.icon className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-card border-2 border-primary text-xs font-bold flex items-center justify-center">
                      {step.step}
                    </span>
                  </div>
                </div>

                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>

                {/* Visual Mockup */}
                <div className="mt-6 p-4 bg-muted/30 rounded-xl border border-border/30">
                  {step.visual === 'event-feed' && (
                    <div className="space-y-2">
                      {[1, 2].map((i) => (
                        <div key={i} className="flex items-center gap-3 p-2 bg-card rounded-lg">
                          <div className="w-10 h-10 rounded-lg bg-primary/20" />
                          <div className="flex-1">
                            <div className="h-2.5 w-24 bg-foreground/20 rounded" />
                            <div className="h-2 w-16 bg-muted-foreground/20 rounded mt-1" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {step.visual === 'matching' && (
                    <div className="flex items-center justify-center gap-4 py-4">
                      <div className="flex -space-x-2">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent border-2 border-card" />
                        ))}
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-semibold text-primary">Matched!</p>
                        <p className="text-[10px] text-muted-foreground">4 people</p>
                      </div>
                    </div>
                  )}
                  {step.visual === 'meetup' && (
                    <div className="text-center py-4">
                      <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-2">
                        <PartyPopper className="h-6 w-6 text-success" />
                      </div>
                      <p className="text-xs font-semibold">Meet at 7:45 PM</p>
                      <p className="text-[10px] text-muted-foreground">Main entrance</p>
                    </div>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
