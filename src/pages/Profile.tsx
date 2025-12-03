import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Settings, LogOut, Edit2, MapPin, Zap, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuth } from '@/lib/auth';

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

const ENERGY_LABELS: Record<number, string> = {
  1: 'Quiet Observer 🌙',
  2: 'Selective Socializer 🌤️',
  3: 'Balanced ☀️',
  4: 'Social Butterfly 🦋',
  5: 'Life of the Party 🎉',
};

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, signOut, loading } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="flex flex-col items-center justify-center h-[60vh] p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <span className="text-4xl">👤</span>
          </div>
          <h2 className="text-xl font-semibold mb-2">Sign in to view your profile</h2>
          <p className="text-muted-foreground mb-4">
            Create an account or sign in to get started
          </p>
          <Button onClick={() => navigate('/auth')} size="lg">
            Sign In
          </Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="relative h-32 bg-gradient-to-br from-primary/20 to-accent">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 bg-card/50 backdrop-blur"
          onClick={() => navigate('/settings')}
        >
          <Settings className="h-5 w-5" />
        </Button>
      </header>

      {/* Profile Info */}
      <div className="px-6 -mt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center"
        >
          <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="text-4xl bg-primary text-primary-foreground">
              {profile.display_name?.[0] || user.email?.[0] || '?'}
            </AvatarFallback>
          </Avatar>
          
          <h1 className="text-2xl font-bold mt-4">{profile.display_name || 'User'}</h1>
          
          {profile.city && (
            <div className="flex items-center gap-1 text-muted-foreground mt-1">
              <MapPin className="h-4 w-4" />
              <span>{profile.city}</span>
            </div>
          )}

          {profile.verified && (
            <Badge className="mt-2 bg-green-500/20 text-green-700">
              ✓ Verified
            </Badge>
          )}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mt-6"
        >
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">0</div>
              <div className="text-xs text-muted-foreground">Events</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">0</div>
              <div className="text-xs text-muted-foreground">Groups</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">0</div>
              <div className="text-xs text-muted-foreground">Friends</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Social Energy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Social Energy</div>
                  <div className="font-semibold">
                    {ENERGY_LABELS[profile.social_energy] || 'Not set'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Interests */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4"
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="h-5 w-5 text-primary" />
                <span className="font-semibold">Interests</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.interests && profile.interests.length > 0 ? (
                  profile.interests.map((interest) => (
                    <Badge key={interest} variant="secondary" className="px-3 py-1">
                      {INTEREST_EMOJIS[interest] || '✨'} {interest}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No interests added yet</span>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 space-y-3"
        >
          <Button
            variant="outline"
            className="w-full justify-start h-12"
            onClick={() => navigate('/onboarding')}
          >
            <Edit2 className="mr-3 h-5 w-5" />
            Edit Profile
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start h-12 text-destructive hover:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </Button>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
}
