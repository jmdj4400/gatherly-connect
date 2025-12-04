import { motion } from 'framer-motion';
import { Sparkles, MapPin, MessageCircle, Building2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { useTranslation } from '@/lib/i18n';

export function FeaturesSection() {
  const { t } = useTranslation();

  const features = [
    {
      icon: Sparkles,
      title: t('landing.features.smart_matching'),
      description: t('landing.features.smart_matching.desc'),
    },
    {
      icon: MapPin,
      title: t('landing.features.local_events'),
      description: t('landing.features.local_events.desc'),
    },
    {
      icon: MessageCircle,
      title: t('landing.features.group_chat'),
      description: t('landing.features.group_chat.desc'),
    },
    {
      icon: Building2,
      title: t('landing.features.community_tools'),
      description: t('landing.features.community_tools.desc'),
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
            {t('landing.features.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('landing.features.subtitle')}
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
            >
              <GlassCard 
                variant="elevated" 
                className="p-6 h-full hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-5">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
