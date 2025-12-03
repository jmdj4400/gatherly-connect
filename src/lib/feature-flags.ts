/**
 * Feature Flags System
 * Simple client-side feature flag management
 */

export interface FeatureFlags {
  VENUE_BOOST: boolean;
  PREMIUM_FEATURES: boolean;
  LLM_MATCHING: boolean;
  POSTHOG_ENABLED: boolean;
  SENTRY_ENABLED: boolean;
  PREMIUM_AB_TEST: boolean;
}

// Default flags (all premium features off by default)
const DEFAULT_FLAGS: FeatureFlags = {
  VENUE_BOOST: false,
  PREMIUM_FEATURES: false, // Enable this to show premium page
  LLM_MATCHING: false,
  POSTHOG_ENABLED: false,
  SENTRY_ENABLED: false,
  PREMIUM_AB_TEST: true, // A/B test is on by default
};

// Get flags from environment or localStorage override
export function getFeatureFlags(): FeatureFlags {
  const flags = { ...DEFAULT_FLAGS };
  
  // Check localStorage for overrides (dev/testing)
  if (typeof window !== 'undefined') {
    try {
      const overrides = localStorage.getItem('feature_flags');
      if (overrides) {
        Object.assign(flags, JSON.parse(overrides));
      }
    } catch {
      // Ignore parse errors
    }
  }
  
  return flags;
}

// Check single flag
export function isFeatureEnabled(flag: keyof FeatureFlags): boolean {
  return getFeatureFlags()[flag];
}

// Set flag override (for testing)
export function setFeatureFlag(flag: keyof FeatureFlags, enabled: boolean): void {
  if (typeof window !== 'undefined') {
    const current = getFeatureFlags();
    current[flag] = enabled;
    localStorage.setItem('feature_flags', JSON.stringify(current));
  }
}

// Clear all overrides
export function clearFeatureFlags(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('feature_flags');
  }
}

// Expose to window for console access
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).featureFlags = {
    get: getFeatureFlags,
    isEnabled: isFeatureEnabled,
    set: setFeatureFlag,
    clear: clearFeatureFlags,
  };
}
