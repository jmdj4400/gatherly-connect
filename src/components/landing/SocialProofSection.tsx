import { motion } from 'framer-motion';
import { Users, MapPin, Star } from 'lucide-react';

const stats = [
  { icon: Star, value: '98%', label: 'would attend again' },
  { icon: Users, value: '12,000+', label: 'microgroups formed' },
  { icon: MapPin, value: '7', label: 'cities launching' },
];

const logos = [
  'Running Club NYC',
  'Tech Meetups',
  'Wine & Social',
  'Board Game Nights',
  'Creative Professionals',
  'Adventure Squad',
];

export function SocialProofSection() {
  return (
    <section className="py-16 md:py-24 bg-muted/30 border-y border-border/50">
      <div className="max-w-[1220px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Trusted by communities, bars, runners, and thousands of socially curious people.
          </p>
        </motion.div>

        {/* Logo Row */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-8 mb-16"
        >
          {logos.map((logo, index) => (
            <motion.div
              key={logo}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.1 * index }}
              className="px-6 py-3 bg-card/50 rounded-xl border border-border/30"
            >
              <span className="text-sm font-medium text-muted-foreground">{logo}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
                <stat.icon className="h-7 w-7 text-primary" />
              </div>
              <div className="text-4xl md:text-5xl font-bold gradient-brand-text mb-2">
                {stat.value}
              </div>
              <p className="text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
