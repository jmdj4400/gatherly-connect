import { motion } from 'framer-motion';
import { ArrowRight, Play, Users, Calendar, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GlassCard } from '@/components/ui/glass-card';
import { useTranslation } from '@/lib/i18n';

interface HeroSectionProps {
  onGetStarted: () => void;
  onHowItWorks: () => void;
}

export function HeroSection({ onGetStarted, onHowItWorks }: HeroSectionProps) {
  const { t, language } = useTranslation();

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-accent/10 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
      
      <div className="relative z-10 w-full max-w-[1220px] mx-auto px-6 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge variant="soft" className="mb-6 px-4 py-2 text-sm font-medium">
                ✨ {language === 'da' ? 'Den første platform designet til folk der møder op alene' : 'The first platform designed for people who show up alone'}
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6"
            >
              {language === 'da' ? (
                <>
                  Mød mennesker gennem{' '}
                  <span className="gradient-brand-text">ægte events</span>.{' '}
                  <span className="text-muted-foreground">Ikke apps.</span>
                </>
              ) : (
                <>
                  Meet people through{' '}
                  <span className="gradient-brand-text">real events</span>.{' '}
                  <span className="text-muted-foreground">Not apps.</span>
                </>
              )}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg sm:text-xl text-muted-foreground mb-8 leading-relaxed"
            >
              {language === 'da' 
                ? 'Tilmeld dig et event → Bliv matchet i en lille gruppe → Mød op sammen. Gatherly gør det naturligt at være social igen.'
                : 'Join local events → Get matched in a small group → Show up together. Gatherly makes socializing feel natural again.'
              }
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button size="xl" variant="gradient" onClick={onGetStarted} className="group">
                {t('landing.hero.cta')}
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button size="xl" variant="outline" onClick={onHowItWorks} className="group">
                <Play className="mr-2 h-4 w-4" />
                {t('landing.hero.secondary_cta')}
              </Button>
            </motion.div>
          </div>

          {/* Right Visual - App Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="relative">
              {/* Main Phone Frame */}
              <div className="relative bg-card rounded-[32px] shadow-2xl border border-border/50 p-3 mx-auto max-w-[320px]">
                <div className="bg-background rounded-[24px] overflow-hidden">
                  {/* Status Bar */}
                  <div className="h-6 bg-muted/30 flex items-center justify-center">
                    <div className="w-20 h-1.5 bg-foreground/20 rounded-full" />
                  </div>
                  
                  {/* App Content */}
                  <div className="p-4 space-y-3">
                    {/* Event Card Preview */}
                    <GlassCard variant="elevated" className="p-3">
                      <div className="flex gap-3">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center">
                          <Calendar className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{language === 'da' ? 'Fredag Aften Jazz' : 'Friday Night Jazz'}</p>
                          <p className="text-xs text-muted-foreground">{language === 'da' ? 'I aften kl. 20' : 'Tonight at 8PM'}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <div className="flex -space-x-1.5">
                              {[1, 2, 3].map((i) => (
                                <div key={i} className="w-5 h-5 rounded-full bg-primary/20 border-2 border-card" />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground">{language === 'da' ? '+4 kommer alene' : '+4 going alone'}</span>
                          </div>
                        </div>
                      </div>
                    </GlassCard>

                    {/* Group Match Card */}
                    <GlassCard variant="elevated" className="p-3 border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="text-xs font-semibold text-primary">{language === 'da' ? 'Din Gruppe' : 'Your Group'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {['S', 'M', 'J'].map((initial, i) => (
                          <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-medium text-primary-foreground">
                            {initial}
                          </div>
                        ))}
                        <span className="text-xs text-muted-foreground ml-1">{language === 'da' ? '3 personer matchet!' : '3 people matched!'}</span>
                      </div>
                    </GlassCard>

                    {/* Chat Preview */}
                    <GlassCard variant="elevated" className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageCircle className="h-4 w-4 text-primary" />
                        <span className="text-xs font-semibold">{language === 'da' ? 'Gruppechat' : 'Group Chat'}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="bg-muted/50 rounded-xl rounded-bl-md px-3 py-1.5 text-xs max-w-[80%]">
                          {language === 'da' ? 'Hej! Glæder mig til i aften! 🎷' : 'Hey! Excited for tonight! 🎷'}
                        </div>
                        <div className="bg-primary/10 rounded-xl rounded-br-md px-3 py-1.5 text-xs max-w-[80%] ml-auto">
                          {language === 'da' ? 'Det samme! Ses kl 19:45?' : 'Me too! See you at 7:45?'}
                        </div>
                      </div>
                    </GlassCard>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="absolute -right-8 top-1/4 bg-card shadow-lg rounded-2xl p-3 border border-border/50"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                    <Users className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">{language === 'da' ? 'Gruppe dannet!' : 'Group Formed!'}</p>
                    <p className="text-[10px] text-muted-foreground">{language === 'da' ? '3 personer matchet' : '3 people matched'}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="absolute -left-8 bottom-1/3 bg-card shadow-lg rounded-2xl p-3 border border-border/50"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">12 Events</p>
                    <p className="text-[10px] text-muted-foreground">{language === 'da' ? 'Nær dig denne uge' : 'Near you this week'}</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
