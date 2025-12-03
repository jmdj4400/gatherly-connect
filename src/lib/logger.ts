/**
 * Structured Logging Utility
 * Provides consistent logging with context across the application
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  eventId?: string;
  groupId?: string;
  action?: string;
  [key: string]: unknown;
}

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, unknown>;
  timestamp?: string;
}

// Log levels for filtering
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Current log level (can be controlled via env)
const CURRENT_LEVEL: LogLevel = (import.meta.env.VITE_LOG_LEVEL as LogLevel) || 'info';

// Format log prefix with timestamp and category
function formatPrefix(category: string, level: LogLevel): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] [${category}]`;
}

// Serialize context for logging
function serializeContext(context?: LogContext): string {
  if (!context || Object.keys(context).length === 0) return '';
  const filtered = Object.entries(context)
    .filter(([_, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : v}`)
    .join(' ');
  return filtered ? ` | ${filtered}` : '';
}

// Create a logger for a specific category
export function createLogger(category: string) {
  const shouldLog = (level: LogLevel): boolean => {
    return LOG_LEVELS[level] >= LOG_LEVELS[CURRENT_LEVEL];
  };

  return {
    debug: (message: string, context?: LogContext) => {
      if (shouldLog('debug')) {
        console.debug(`${formatPrefix(category, 'debug')} ${message}${serializeContext(context)}`);
      }
    },
    info: (message: string, context?: LogContext) => {
      if (shouldLog('info')) {
        console.info(`${formatPrefix(category, 'info')} ${message}${serializeContext(context)}`);
      }
    },
    warn: (message: string, context?: LogContext) => {
      if (shouldLog('warn')) {
        console.warn(`${formatPrefix(category, 'warn')} ${message}${serializeContext(context)}`);
      }
    },
    error: (message: string, error?: Error | unknown, context?: LogContext) => {
      if (shouldLog('error')) {
        const errorInfo = error instanceof Error 
          ? ` | error=${error.message}` 
          : error ? ` | error=${JSON.stringify(error)}` : '';
        console.error(`${formatPrefix(category, 'error')} ${message}${errorInfo}${serializeContext(context)}`);
      }
    },
  };
}

// Analytics event tracking
const analyticsQueue: AnalyticsEvent[] = [];

export function trackAnalytics(event: string, properties?: Record<string, unknown>) {
  const analyticsEvent: AnalyticsEvent = {
    event,
    properties,
    timestamp: new Date().toISOString(),
  };
  
  analyticsQueue.push(analyticsEvent);
  console.info(`[analytics] ${event}`, properties);
  
  // Future: Send to PostHog or other analytics service
  // For now, just log it
}

// Pre-defined analytics events
export const AnalyticsEvents = {
  // Join flow
  EVENT_VIEWED: 'event_viewed',
  JOIN_STARTED: 'join_started',
  JOIN_COMPLETED: 'join_completed',
  JOIN_BLOCKED_FREEZE: 'join_blocked_freeze',
  
  // Matching
  GROUP_CREATED: 'group_created',
  GROUP_MATCHED: 'group_matched',
  
  // Attendance
  CHECK_IN_STARTED: 'check_in_started',
  CHECK_IN_COMPLETED: 'check_in_completed',
  CHECK_IN_FAILED: 'check_in_failed',
  
  // Chat
  MESSAGE_SENT: 'message_sent',
  MESSAGE_BLOCKED: 'message_blocked',
  
  // Engagement
  STREAK_UPDATED: 'streak_updated',
  BADGE_EARNED: 'badge_earned',
  
  // Moderation
  USER_MUTED: 'user_muted',
  REPORT_CREATED: 'report_created',
  
  // Auth
  SIGN_IN: 'sign_in',
  SIGN_OUT: 'sign_out',
  SIGN_UP: 'sign_up',
};

// Export analytics queue for debugging
export function getAnalyticsQueue(): AnalyticsEvent[] {
  return [...analyticsQueue];
}

export function clearAnalyticsQueue(): void {
  analyticsQueue.length = 0;
}
