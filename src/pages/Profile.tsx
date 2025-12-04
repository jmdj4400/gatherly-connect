import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Settings, LogOut, Edit2, MapPin, Zap, Heart, Building2, Shield, ChevronRight, Bell, Calendar, Users, Cog, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { GlassCard } from '@/components/ui/glass-card';
import { PageHeader } from '@/components/ui/page-header';
import { StaggerContainer, StaggerItem, FadeIn } from '@/components/ui/page-transition';
import { PageLoader } from '@/components/ui/loading-spinner';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { subscribeToPush, requestNotificationPermission, showLocalNotification } from '@/lib/notifications';
import { useEngagement } from '@/hooks/useEngagement';
import { StreakDisplay } from '@/components/engagement/StreakDisplay';
import { BadgeGrid } from '@/components/engagement/BadgeGrid';
import { UpgradeCTA } from '@/components/profile/UpgradeCTA';
import { GDPRSettings } from '@/components/profile/GDPRSettings';

const INTEREST_EMOJIS: Record<string, string> = {
  music: '🎵',
  food: '🍕',
  sports: '⚽',
  art: '🎨',
  tech: '💻',
  outdoors: '🏕️',
  fitness: '💪',
  gaming: '🎮',
  reading: '📚',
  movies: '🎬',
  travel: '✈️',
  nightlife: '🍹',
};

const ENERGY_LABELS: Record<number, { label: string; emoji: string }> = {
  1: { label: 'Quiet Observer', emoji: '🌙' },
  2: { label: 'Selective Socializer', emoji: '🌤️' },
  3: { label: 'Balanced', emoji: '☀️' },
  4: { label: 'Social Butterfly', emoji: '🦋' },
  5: { label: 'Life of the Party', emoji: '🎉' },
};

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, signOut, loading } = useAuth();
  const { toast } = useToast();
  const { stats: engagementStats, loading: engagementLoading } = useEngagement();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleTestNotification = async () => {
    if (!user) return;
    
    const permission = await requestNotificationPermission();
    
    if (permission !== 'granted') {
      toast({
        title: "Notifikationer ikke tilladt",
        description: "Aktivér venligst notifikationer i din browser",
        variant: "destructive"
      });
      return;
    }
    
    const subscribed = await subscribeToPush(user.id);
    
    if (subscribed) {
      toast({
        title: "Abonnement aktiveret!",
        description: "Du modtager nu push notifikationer"
      });
      
      await showLocalNotification('Test Notifikation 🎉', {
        body: 'Hvis du ser dette, virker notifikationer!',
      });
    } else {
      await showLocalNotification('Test Notifikation 🎉', {
        body: 'Lokal notifikation virker!',
      });
      
      toast({
        title: "Delvist aktiveret",
        description: "Lokale notifikationer virker, men push-abonnement fejlede"
      });
    }
  };

  if (loading) {
    return <PageLoader message="Loading profile..." />;
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="flex flex-col items-center justify-center h-[70vh] p-6 text-center">
          <FadeIn>
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 shadow-soft">
              <span className="text-5xl">👤</span>
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="text-2xl font-bold mb-2 tracking-tight">Sign in to view your profile</h2>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="text-muted-foreground mb-8 max-w-sm">
              Create an account or sign in to get started with Gatherly
            </p>
          </FadeIn>
          <FadeIn delay={0.3}>
            <Button onClick={() => navigate('/auth')} size="lg" variant="gradient">
              Sign In
            </Button>
          </FadeIn>
        </div>
        <BottomNav />
      </div>
    );
  }

  const energyInfo = ENERGY_LABELS[profile.social_energy] || ENERGY_LABELS[3];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="relative h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80" />
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 bg-card/60 backdrop-blur-sm rounded-xl shadow-soft"
          onClick={() => navigate('/settings')}
        >
          <Settings className="h-5 w-5" />
        </Button>
      </header>

      {/* Profile Info */}
      <div className="px-5 -mt-14">
        <StaggerContainer>
          <StaggerItem className="flex flex-col items-center">
            <Avatar size="2xl" ring className="border-4 border-background shadow-elevated">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-3xl gradient-brand text-primary-foreground">
                {profile.display_name?.[0] || user.email?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            
            <h1 className="text-2xl font-bold mt-4 tracking-tight">
              {profile.display_name || 'User'}
            </h1>
            
            {profile.city && (
              <div className="flex items-center gap-1.5 text-muted-foreground mt-1">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">{profile.city}</span>
              </div>
            )}

            {profile.verified && (
              <Badge className="mt-3 bg-success/10 text-success border-success/20">
                ✓ Verified
              </Badge>
            )}
          </StaggerItem>

          {/* Premium Upgrade CTA */}
          <StaggerItem>
            <div className="mt-5">
              <UpgradeCTA />
            </div>
          </StaggerItem>

          {/* Stats */}
          <StaggerItem>
            <div className="grid grid-cols-3 gap-3 mt-5">
              {[
                { value: String(engagementStats?.attendance_count || 0), label: 'Events' },
                { value: String(engagementStats?.badges?.length || 0), label: 'Badges' },
                { value: String(engagementStats?.streaks?.[0]?.current_streak || 0), label: 'Streak' },
              ].map((stat) => (
                <GlassCard key={stat.label} variant="subtle" className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 font-medium">{stat.label}</div>
                </GlassCard>
              ))}
            </div>
          </StaggerItem>

          {/* Streaks */}
          {engagementStats?.streaks && engagementStats.streaks.length > 0 && (
            <StaggerItem>
              <div className="mt-4 space-y-2">
                {engagementStats.streaks.slice(0, 3).map((streak, index) => (
                  <StreakDisplay
                    key={`${streak.org_id}-${index}`}
                    currentStreak={streak.current_streak}
                    longestStreak={streak.longest_streak}
                    category={streak.category}
                    orgName={streak.orgs?.name}
                  />
                ))}
              </div>
            </StaggerItem>
          )}

          {/* Badges */}
          {engagementStats?.badges && (
            <StaggerItem>
              <GlassCard variant="elevated" className="mt-4 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Award className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-semibold">Badges</span>
                </div>
                <BadgeGrid badges={engagementStats.badges} showAll />
              </GlassCard>
            </StaggerItem>
          )}

          {/* Social Energy */}
          <StaggerItem>
            <GlassCard variant="elevated" className="mt-4 p-5 bg-gradient-to-r from-primary/5 to-accent/5">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-card shadow-soft flex items-center justify-center text-2xl">
                  {energyInfo.emoji}
                </div>
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-0.5">
                    Social Energy
                  </div>
                  <div className="font-semibold text-lg">{energyInfo.label}</div>
                </div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
              </div>
            </GlassCard>
          </StaggerItem>

          {/* Interests */}
          <StaggerItem>
            <GlassCard variant="elevated" className="mt-4 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Heart className="h-4 w-4 text-primary" />
                </div>
                <span className="font-semibold">Interests</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.interests && profile.interests.length > 0 ? (
                  profile.interests.map((interest) => (
                    <Badge key={interest} variant="secondary" className="px-3 py-1.5 text-sm">
                      {INTEREST_EMOJIS[interest] || '✨'} {interest}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No interests added yet</span>
                )}
              </div>
            </GlassCard>
          </StaggerItem>

          {/* GDPR Settings */}
          <StaggerItem>
            <div className="mt-4">
              <GDPRSettings />
            </div>
          </StaggerItem>

          {/* Actions */}
          <StaggerItem>
            <div className="mt-6 space-y-2">
              {[
                { icon: Bell, label: 'Test Notifikation', onClick: handleTestNotification },
                { icon: Calendar, label: 'Organizer Events', onClick: () => navigate('/organizer/events') },
                { icon: Users, label: 'Team Management', onClick: () => navigate('/organizer/team') },
                { icon: Cog, label: 'Community Settings', onClick: () => navigate('/organizer/settings') },
                { icon: Edit2, label: 'Edit Profile', onClick: () => navigate('/onboarding') },
                { icon: Building2, label: 'Venue Panel', onClick: () => navigate('/venue') },
                { icon: Shield, label: 'Report Center', onClick: () => navigate('/admin/reports') },
              ].map((action) => (
                <motion.div
                  key={action.label}
                  whileTap={{ scale: 0.98 }}
                >
                  <GlassCard
                    interactive
                    variant="subtle"
                    className="p-4"
                    onClick={action.onClick}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <action.icon className="h-5 w-5 text-primary" />
                      </div>
                      <span className="flex-1 font-medium">{action.label}</span>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
              
              <motion.div whileTap={{ scale: 0.98 }}>
                <GlassCard
                  interactive
                  variant="outlined"
                  className="p-4 border-destructive/20 hover:border-destructive/40"
                  onClick={handleSignOut}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                      <LogOut className="h-5 w-5 text-destructive" />
                    </div>
                    <span className="flex-1 font-medium text-destructive">Sign Out</span>
                    <ChevronRight className="h-5 w-5 text-destructive/50" />
                  </div>
                </GlassCard>
              </motion.div>
            </div>
          </StaggerItem>
        </StaggerContainer>
      </div>

      <BottomNav />
    </div>
  );
}
