/**
 * Centralized Error Handler
 * Provides consistent error handling and user feedback
 */

import { toast } from 'sonner';
import { createLogger } from './logger';

const logger = createLogger('error-handler');

// Standard error codes matching backend
export const ErrorCode = {
  PERM: 'E.PERM',
  FREEZE: 'E.FREEZE',
  MATCHING: 'E.MATCHING',
  MODERATION: 'E.MODERATION',
  ATTENDANCE: 'E.ATTENDANCE',
  RECURRENCE: 'E.RECURRENCE',
  ORG: 'E.ORG',
  NOT_FOUND: 'E.NOT_FOUND',
  VALIDATION: 'E.VALIDATION',
  NETWORK: 'E.NETWORK',
  UNKNOWN: 'E.UNKNOWN',
} as const;

type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode];

// User-friendly error messages
const ERROR_MESSAGES: Record<string, string> = {
  [ErrorCode.PERM]: 'You do not have permission to perform this action.',
  [ErrorCode.FREEZE]: 'This event is frozen. Groups have been finalized.',
  [ErrorCode.MATCHING]: 'There was an issue with group matching. Please try again.',
  [ErrorCode.MODERATION]: 'Your message was blocked by moderation.',
  [ErrorCode.ATTENDANCE]: 'There was an issue with attendance tracking.',
  [ErrorCode.RECURRENCE]: 'There was an issue generating recurring events.',
  [ErrorCode.ORG]: 'Organization operation failed.',
  [ErrorCode.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorCode.VALIDATION]: 'Please check your input and try again.',
  [ErrorCode.NETWORK]: 'Network error. Please check your connection.',
  [ErrorCode.UNKNOWN]: 'An unexpected error occurred. Please try again.',
};

export interface ApiError {
  code?: ErrorCodeType | string;
  message?: string;
  details?: string;
}

// Parse error from API response
export function parseApiError(error: unknown): ApiError {
  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>;
    
    // Handle Supabase error format
    if (err.error && typeof err.error === 'object') {
      const supaError = err.error as Record<string, unknown>;
      return {
        code: (supaError.code as string) || ErrorCode.UNKNOWN,
        message: (supaError.message as string) || 'Unknown error',
      };
    }
    
    // Handle standard API error format
    if (err.code || err.message) {
      return {
        code: (err.code as string) || ErrorCode.UNKNOWN,
        message: (err.message as string) || 'Unknown error',
        details: err.details as string | undefined,
      };
    }
  }
  
  if (error instanceof Error) {
    return {
      code: ErrorCode.UNKNOWN,
      message: error.message,
    };
  }
  
  return {
    code: ErrorCode.UNKNOWN,
    message: 'An unexpected error occurred',
  };
}

// Get user-friendly message for error code
export function getErrorMessage(code: string): string {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES[ErrorCode.UNKNOWN];
}

// Show error toast with consistent styling
export function showErrorToast(error: ApiError | string, title = 'Error') {
  const errorObj = typeof error === 'string' ? { message: error } : error;
  const message = errorObj.message || getErrorMessage(errorObj.code || ErrorCode.UNKNOWN);
  
  logger.error('Showing error toast', undefined, { 
    code: errorObj.code, 
    message 
  });
  
  toast.error(title, {
    description: message,
    duration: 5000,
  });
}

// Show success toast
export function showSuccessToast(message: string, title = 'Success') {
  toast.success(title, {
    description: message,
    duration: 3000,
  });
}

// Handle API response with consistent error handling
export async function handleApiResponse<T>(
  response: Response,
  options?: { showToast?: boolean; errorTitle?: string }
): Promise<{ success: boolean; data?: T; error?: ApiError }> {
  const { showToast = true, errorTitle = 'Error' } = options || {};
  
  try {
    const json = await response.json();
    
    if (!response.ok || json.error) {
      const error = parseApiError(json);
      
      if (showToast) {
        showErrorToast(error, errorTitle);
      }
      
      return { success: false, error };
    }
    
    return { success: true, data: json.data || json };
  } catch (err) {
    const error = parseApiError(err);
    
    if (showToast) {
      showErrorToast(error, errorTitle);
    }
    
    return { success: false, error };
  }
}

// Wrapper for async operations with error handling
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  options?: { showToast?: boolean; errorTitle?: string; context?: Record<string, unknown> }
): Promise<{ success: boolean; data?: T; error?: ApiError }> {
  const { showToast = true, errorTitle = 'Error', context } = options || {};
  
  try {
    const data = await operation();
    return { success: true, data };
  } catch (err) {
    const error = parseApiError(err);
    
    logger.error('Operation failed', err, context);
    
    if (showToast) {
      showErrorToast(error, errorTitle);
    }
    
    return { success: false, error };
  }
}
