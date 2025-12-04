import { validatePassword, getStrengthColor, getStrengthLabel } from '@/lib/password-validation';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
}

export function PasswordStrengthIndicator({ password, showRequirements = true }: PasswordStrengthIndicatorProps) {
  const validation = validatePassword(password);
  
  if (!password) return null;
  
  const requirements = [
    { label: 'Mindst 8 tegn', met: password.length >= 8 },
    { label: 'Stort bogstav', met: /[A-Z]/.test(password) },
    { label: 'Lille bogstav', met: /[a-z]/.test(password) },
    { label: 'Tal', met: /\d/.test(password) },
  ];
  
  return (
    <div className="space-y-2 mt-2">
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-300",
              getStrengthColor(validation.strength)
            )}
            style={{ 
              width: validation.strength === 'strong' ? '100%' : 
                     validation.strength === 'fair' ? '66%' : '33%' 
            }}
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {getStrengthLabel(validation.strength)}
        </span>
      </div>
      
      {/* Requirements checklist */}
      {showRequirements && (
        <div className="grid grid-cols-2 gap-1">
          {requirements.map((req) => (
            <div key={req.label} className="flex items-center gap-1.5 text-xs">
              {req.met ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <X className="h-3 w-3 text-muted-foreground" />
              )}
              <span className={req.met ? 'text-muted-foreground' : 'text-muted-foreground/60'}>
                {req.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
