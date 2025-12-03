import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Settings, LogOut, Edit2, MapPin, Zap, Heart, Building2, Shield, ChevronRight, Bell, Calendar, Users, Cog, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { GlassCard } from '@/components/ui/glass-card';
import { StaggerContainer, StaggerItem, buttonTapVariants } from '@/components/ui/page-transition';
import { PageLoader } from '@/components/ui/loading-spinner';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { subscribeToPush, requestNotificationPermission, showLocalNotification } from '@/lib/notifications';
import { useEngagement } from '@/hooks/useEngagement';
import { StreakDisplay } from '@/components/engagement/StreakDisplay';
import { BadgeGrid } from '@/components/engagement/BadgeGrid';
import { UpgradeCTA } from '@/components/profile/UpgradeCTA';

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

const ENERGY_LABELS: Record<number, { label: string; emoji: string; color: string }> = {
  1: { label: 'Quiet Observer', emoji: '🌙', color: 'from-blue-500/20 to-blue-500/5' },
  2: { label: 'Selective Socializer', emoji: '🌤️', color: 'from-cyan-500/20 to-cyan-500/5' },
  3: { label: 'Balanced', emoji: '☀️', color: 'from-yellow-500/20 to-yellow-500/5' },
  4: { label: 'Social Butterfly', emoji: '🦋', color: 'from-orange-500/20 to-orange-500/5' },
  5: { label: 'Life of the Party', emoji: '🎉', color: 'from-pink-500/20 to-pink-500/5' },
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
    
    // First request permission
    const permission = await requestNotificationPermission();
    console.log('[Profile] Notification permission:', permission);
    
    if (permission !== 'granted') {
      toast({
        title: "Notifikationer ikke tilladt",
        description: "Aktivér venligst notifikationer i din browser",
        variant: "destructive"
      });
      return;
    }
    
    // Try to subscribe
    const subscribed = await subscribeToPush(user.id);
    console.log('[Profile] Subscribe result:', subscribed);
    
    if (subscribed) {
      toast({
        title: "Abonnement aktiveret!",
        description: "Du modtager nu push notifikationer"
      });
      
      // Show a local test notification
      await showLocalNotification('Test Notifikation 🎉', {
        body: 'Hvis du ser dette, virker notifikationer!',
      });
    } else {
      // Try local notification anyway
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
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6"
          >
            <span className="text-5xl">👤</span>
          </motion.div>
          <h2 className="text-2xl font-bold mb-2">Sign in to view your profile</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Create an account or sign in to get started with Gatherly
          </p>
          <motion.div
            variants={buttonTapVariants}
            initial="initial"
            whileTap="tap"
          >
            <Button onClick={() => navigate('/auth')} size="lg" className="font-semibold">
              Sign In
            </Button>
          </motion.div>
        </div>
        <BottomNav />
      </div>
    );
  }

  const energyInfo = ENERGY_LABELS[profile.social_energy] || ENERGY_LABELS[3];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="relative h-36 bg-gradient-to-br from-primary/30 via-primary/10 to-accent/20">
        <motion.div
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,hsl(var(--primary)/0.2),transparent_50%)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 bg-card/50 backdrop-blur-sm rounded-full"
          onClick={() => navigate('/settings')}
        >
          <Settings className="h-5 w-5" />
        </Button>
      </header>

      {/* Profile Info */}
      <div className="px-6 -mt-16">
        <StaggerContainer>
          <StaggerItem className="flex flex-col items-center">
            <Avatar className="h-32 w-32 border-4 border-background shadow-xl ring-4 ring-primary/20">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-4xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                {profile.display_name?.[0] || user.email?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            
            <h1 className="text-2xl font-bold mt-4 tracking-tight">
              {profile.display_name || 'User'}
            </h1>
            
            {profile.city && (
              <div className="flex items-center gap-1.5 text-muted-foreground mt-1">
                <MapPin className="h-4 w-4" />
                <span>{profile.city}</span>
              </div>
            )}

            {profile.verified && (
              <Badge className="mt-3 bg-green-500/20 text-green-700 border-green-500/30">
                ✓ Verified
              </Badge>
            )}
          </StaggerItem>

          {/* Premium Upgrade CTA */}
          <StaggerItem>
            <div className="mt-4">
              <UpgradeCTA />
            </div>
          </StaggerItem>

          {/* Stats */}
          <StaggerItem>
            <div className="grid grid-cols-3 gap-3 mt-6">
              {[
                { value: String(engagementStats?.attendance_count || 0), label: 'Events' },
                { value: String(engagementStats?.badges?.length || 0), label: 'Badges' },
                { value: String(engagementStats?.streaks?.[0]?.current_streak || 0), label: 'Streak' },
              ].map((stat) => (
                <GlassCard key={stat.label} variant="subtle" className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
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
              <GlassCard variant="elevated" className="mt-4 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Badges</span>
                </div>
                <BadgeGrid badges={engagementStats.badges} showAll />
              </GlassCard>
            </StaggerItem>
          )}

          {/* Social Energy */}
          <StaggerItem>
            <GlassCard variant="elevated" className={`mt-4 p-4 bg-gradient-to-r ${energyInfo.color}`}>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-card/80 flex items-center justify-center text-2xl">
                  {energyInfo.emoji}
                </div>
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">
                    Social Energy
                  </div>
                  <div className="font-semibold text-lg">{energyInfo.label}</div>
                </div>
                <Zap className="h-5 w-5 text-primary" />
              </div>
            </GlassCard>
          </StaggerItem>

          {/* Interests */}
          <StaggerItem>
            <GlassCard variant="elevated" className="mt-4 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="h-5 w-5 text-primary" />
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
                  variants={buttonTapVariants}
                  initial="initial"
                  whileTap="tap"
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
              
              <motion.div
                variants={buttonTapVariants}
                initial="initial"
                whileTap="tap"
              >
                <GlassCard
                  interactive
                  variant="outlined"
                  className="p-4 border-destructive/30"
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
