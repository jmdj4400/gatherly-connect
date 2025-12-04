import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/glass-card';
import { Calendar, Users, MessageCircle, LayoutDashboard, MapPin, Clock, Star, Send } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

const showcaseKeys = [
  { titleKey: 'landing.showcase.event_feed.title', descKey: 'landing.showcase.event_feed.desc', visual: 'event-feed' },
  { titleKey: 'landing.showcase.event_detail.title', descKey: 'landing.showcase.event_detail.desc', visual: 'event-detail' },
  { titleKey: 'landing.showcase.chat.title', descKey: 'landing.showcase.chat.desc', visual: 'chat' },
  { titleKey: 'landing.showcase.organizer.title', descKey: 'landing.showcase.organizer.desc', visual: 'organizer' },
];

function MockEventFeed() {
  return (
    <div className="p-4 space-y-3">
      {[
        { title: 'Friday Wine Tasting', time: 'Tonight, 7PM', attendees: 6 },
        { title: 'Morning Run Club', time: 'Tomorrow, 6AM', attendees: 4 },
      ].map((event, i) => (
        <div key={i} className="flex gap-3 p-3 bg-card rounded-xl border border-border/30">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{event.title}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <Clock className="h-3 w-3" />
              <span>{event.time}</span>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <div className="flex -space-x-1">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="w-5 h-5 rounded-full bg-primary/30 border-2 border-card" />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">+{event.attendees} going alone</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MockEventDetail() {
  return (
    <div className="p-4">
      <div className="w-full h-24 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 mb-3" />
      <h4 className="font-semibold">Rooftop Jazz Night</h4>
      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 mb-3">
        <MapPin className="h-3 w-3" />
        <span>The Blue Note, NYC</span>
      </div>
      <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg mb-3">
        <Users className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium">7 people joining alone</span>
      </div>
      <div className="w-full py-2.5 bg-gradient-to-r from-primary to-accent rounded-xl text-center text-xs font-semibold text-primary-foreground">
        Join Alone
      </div>
    </div>
  );
}

function MockChat() {
  return (
    <div className="p-4">
      <div className="flex items-center gap-2 pb-3 border-b border-border/30 mb-3">
        <Users className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">Jazz Night Group</span>
        <span className="text-xs text-muted-foreground ml-auto">4 members</span>
      </div>
      <div className="space-y-2 mb-3">
        <div className="flex gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/30 shrink-0" />
          <div className="bg-muted/50 rounded-2xl rounded-bl-md px-3 py-1.5 text-xs max-w-[70%]">
            Hey everyone! So excited for tonight! 🎷
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <div className="bg-primary/10 rounded-2xl rounded-br-md px-3 py-1.5 text-xs max-w-[70%]">
            Same here! Should we meet at 7:30?
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-6 h-6 rounded-full bg-accent/30 shrink-0" />
          <div className="bg-muted/50 rounded-2xl rounded-bl-md px-3 py-1.5 text-xs max-w-[70%]">
            Perfect! See you at the main entrance 👋
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1 px-3 py-2 bg-muted/30 rounded-xl text-xs text-muted-foreground">
          Type a message...
        </div>
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
          <Send className="h-4 w-4 text-primary-foreground" />
        </div>
      </div>
    </div>
  );
}

function MockOrganizer() {
  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <LayoutDashboard className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">Dashboard</span>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {[
          { label: 'Events', value: '24' },
          { label: 'Attendees', value: '312' },
          { label: 'Groups', value: '89' },
          { label: 'Rating', value: '4.9', icon: Star },
        ].map((stat, i) => (
          <div key={i} className="p-2 bg-muted/30 rounded-lg text-center">
            <p className="text-lg font-bold">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>
      <div className="p-2 bg-primary/10 rounded-lg">
        <p className="text-xs font-medium text-primary">↑ 23% attendance this month</p>
      </div>
    </div>
  );
}

export function ShowcaseSection() {
  const { t } = useTranslation();
  
  const visuals: Record<string, React.ReactNode> = {
    'event-feed': <MockEventFeed />,
    'event-detail': <MockEventDetail />,
    'chat': <MockChat />,
    'organizer': <MockOrganizer />,
  };

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="max-w-[1220px] mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            {t('landing.showcase.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('landing.showcase.subtitle')}
          </p>
        </motion.div>

        <div className="space-y-16 md:space-y-24">
          {showcaseKeys.map((item, index) => (
            <motion.div
              key={item.visual}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6 }}
              className={`grid md:grid-cols-2 gap-8 md:gap-16 items-center ${
                index % 2 === 1 ? 'md:grid-flow-dense' : ''
              }`}
            >
              <div className={index % 2 === 1 ? 'md:col-start-2' : ''}>
                <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
                  {t(item.titleKey)}
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {t(item.descKey)}
                </p>
              </div>
              
              <div className={index % 2 === 1 ? 'md:col-start-1' : ''}>
                <GlassCard variant="elevated" className="max-w-[320px] mx-auto rounded-[24px] overflow-hidden">
                  <div className="h-6 bg-muted/50 flex items-center justify-center border-b border-border/30">
                    <div className="w-16 h-1 bg-foreground/20 rounded-full" />
                  </div>
                  {visuals[item.visual]}
                </GlassCard>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
