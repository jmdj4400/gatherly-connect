import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { validatePassword } from '@/lib/password-validation';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';

type AuthMode = 'login' | 'signup';

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signUp } = useAuth();
  const { t } = useTranslation();
  
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password on signup
    if (mode === 'signup') {
      const validation = validatePassword(password);
      if (!validation.isValid) {
        toast({
          title: 'Adgangskoden opfylder ikke kravene',
          description: validation.errors[0],
          variant: "destructive"
        });
        return;
      }
    }
    
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await signUp(email, password, displayName);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: t('auth.account_exists'),
              description: t('auth.account_exists_desc'),
              variant: "destructive"
            });
          } else {
            throw error;
          }
        } else {
          toast({
            title: t('auth.welcome_gatherly'),
            description: t('auth.account_created')
          });
          navigate('/onboarding');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: t('auth.login_failed'),
            description: t('auth.invalid_credentials'),
            variant: "destructive"
          });
        } else {
          toast({
            title: t('auth.welcome_back'),
            description: ""
          });
          navigate('/');
        }
      }
    } catch (error: any) {
      const errorMessage = error.message || "Something went wrong";
      
      if (errorMessage.includes('Load failed') || errorMessage.includes('fetch') || errorMessage.includes('network')) {
        toast({
          title: t('auth.network_error'),
          description: t('auth.network_error_desc'),
          variant: "destructive"
        });
      } else {
        toast({
          title: "Fejl",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </header>

      <div className="flex-1 flex flex-col justify-center px-6 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Logo & Title */}
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4"
            >
              <span className="text-3xl">🎉</span>
            </motion.div>
            <h1 className="text-3xl font-bold">
              {mode === 'login' ? t('auth.welcome_back') : t('auth.join')}
            </h1>
            <p className="text-muted-foreground mt-2">
              {mode === 'login' 
                ? t('auth.sign_in_subtitle')
                : t('auth.sign_up_subtitle')}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div
                  key="displayName"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <Label htmlFor="displayName">{t('auth.display_name')}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="displayName"
                      type="text"
                      placeholder={t('auth.your_name')}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="pl-10 h-12"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {mode === 'signup' && <PasswordStrengthIndicator password={password} />}
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg font-semibold"
              disabled={loading}
            >
              {loading ? t('auth.please_wait') : mode === 'login' ? t('auth.sign_in') : t('auth.sign_up')}
            </Button>
          </form>

          {/* Toggle Mode */}
          <div className="text-center">
            <p className="text-muted-foreground">
              {mode === 'login' ? t('auth.no_account') + ' ' : t('auth.have_account') + ' '}
              <button
                type="button"
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="text-primary font-semibold hover:underline"
              >
                {mode === 'login' ? t('auth.sign_up') : t('auth.sign_in')}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
