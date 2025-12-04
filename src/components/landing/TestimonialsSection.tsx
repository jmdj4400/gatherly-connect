import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTranslation } from '@/lib/i18n';

export function TestimonialsSection() {
  const { t, language } = useTranslation();

  const testimonials = language === 'da' ? [
    {
      name: 'Sarah K.',
      role: 'Marketing Manager',
      avatar: null,
      quote: "Jeg flyttede til en ny by og var bange for at gå til events alene. Gatherly matchede mig med fantastiske mennesker til en wine tasting—nu er vi en fast vennegruppe!",
      rating: 5,
    },
    {
      name: 'Marcus T.',
      role: 'Softwareudvikler',
      avatar: null,
      quote: "Som introvert elsker jeg, at jeg ikke skal networke med et rum fuld af fremmede. At have en lille gruppe at mødes med gør hele forskellen.",
      rating: 5,
    },
    {
      name: 'Elena R.',
      role: 'Løbeklub-arrangør',
      avatar: null,
      quote: "Vores klub er vokset 40% siden vi begyndte at bruge Gatherly. Matching-funktionen hjælper nye med at føle sig velkomne fra dag ét. Game changer for fællesskaber.",
      rating: 5,
    },
  ] : [
    {
      name: 'Sarah K.',
      role: 'Marketing Manager',
      avatar: null,
      quote: "I moved to a new city and was terrified of going to events alone. Gatherly matched me with amazing people at a wine tasting—we're now a regular friend group!",
      rating: 5,
    },
    {
      name: 'Marcus T.',
      role: 'Software Engineer',
      avatar: null,
      quote: "As an introvert, I love that I don't have to network a room full of strangers. Having a small group to meet up with makes all the difference.",
      rating: 5,
    },
    {
      name: 'Elena R.',
      role: 'Running Club Organizer',
      avatar: null,
      quote: "Our club grew 40% since we started using Gatherly. The matching feature helps newcomers feel welcome from day one. Game changer for communities.",
      rating: 5,
    },
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-[1220px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            {t('landing.testimonials.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('landing.testimonials.subtitle')}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
            >
              <GlassCard variant="elevated" className="p-6 h-full">
                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="text-foreground leading-relaxed mb-6">
                  "{testimonial.quote}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={testimonial.avatar || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
