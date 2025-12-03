// Standardized error codes and response wrapper

export const ErrorCodes = {
  PERM: 'E.PERM',
  FREEZE: 'E.FREEZE',
  MATCHING: 'E.MATCHING',
  MODERATION: 'E.MODERATION',
  ATTENDANCE: 'E.ATTENDANCE',
  RECURRENCE: 'E.RECURRENCE',
  ORG: 'E.ORG',
  AUTH: 'E.AUTH',
  VALIDATION: 'E.VALIDATION',
  NOT_FOUND: 'E.NOT_FOUND',
  DUPLICATE: 'E.DUPLICATE',
  UNKNOWN: 'E.UNKNOWN',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function success<T>(data: T): Response {
  const body: ApiResponse<T> = { success: true, data };
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function error(code: ErrorCode, message: string, status = 400, details?: unknown): Response {
  const body: ApiResponse = {
    success: false,
    error: { code, message, details },
  };
  console.error(`[error] ${code}: ${message}`, details || '');
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
}

export function unauthorized(message = 'Unauthorized'): Response {
  return error(ErrorCodes.AUTH, message, 401);
}

export function forbidden(message = 'Forbidden'): Response {
  return error(ErrorCodes.PERM, message, 403);
}

export function notFound(message = 'Not found'): Response {
  return error(ErrorCodes.NOT_FOUND, message, 404);
}

export function serverError(message = 'Internal server error', details?: unknown): Response {
  return error(ErrorCodes.UNKNOWN, message, 500, details);
}
