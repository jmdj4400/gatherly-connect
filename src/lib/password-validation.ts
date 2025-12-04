// Common weak passwords list (subset of most common)
const WEAK_PASSWORDS = new Set([
  'password', 'password1', 'password123', '123456', '12345678', '123456789',
  'qwerty', 'qwerty123', 'abc123', 'letmein', 'welcome', 'monkey', 'dragon',
  'master', 'login', 'admin', 'princess', 'sunshine', 'football', 'baseball',
  'iloveyou', 'trustno1', 'shadow', 'ashley', 'passw0rd', 'pass123', 'hello',
  'charlie', 'donald', '111111', '1234567', '654321', 'superman', 'michael',
  'gatherly', 'gatherly123', 'event', 'events123', 'welcome1', 'password!',
]);

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'fair' | 'strong';
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  
  // Minimum length (8 characters)
  if (password.length < 8) {
    errors.push('Mindst 8 tegn');
  }
  
  // Maximum length (128 characters)
  if (password.length > 128) {
    errors.push('Maksimalt 128 tegn');
  }
  
  // Check for lowercase
  if (!/[a-z]/.test(password)) {
    errors.push('Mindst ét lille bogstav');
  }
  
  // Check for uppercase
  if (!/[A-Z]/.test(password)) {
    errors.push('Mindst ét stort bogstav');
  }
  
  // Check for number
  if (!/\d/.test(password)) {
    errors.push('Mindst ét tal');
  }
  
  // Check against common weak passwords
  if (WEAK_PASSWORDS.has(password.toLowerCase())) {
    errors.push('Denne adgangskode er for almindelig');
  }
  
  // Calculate strength
  let strength: 'weak' | 'fair' | 'strong' = 'weak';
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (errors.length === 0) {
    if (password.length >= 12 && hasSpecialChar) {
      strength = 'strong';
    } else if (password.length >= 10 || hasSpecialChar) {
      strength = 'fair';
    } else {
      strength = 'fair';
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
}

export function getStrengthColor(strength: 'weak' | 'fair' | 'strong'): string {
  switch (strength) {
    case 'strong':
      return 'bg-green-500';
    case 'fair':
      return 'bg-yellow-500';
    case 'weak':
    default:
      return 'bg-destructive';
  }
}

export function getStrengthLabel(strength: 'weak' | 'fair' | 'strong'): string {
  switch (strength) {
    case 'strong':
      return 'Stærk';
    case 'fair':
      return 'Middel';
    case 'weak':
    default:
      return 'Svag';
  }
}
