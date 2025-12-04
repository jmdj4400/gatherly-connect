// Shared input validation utilities for edge functions
// Using simple validation since Zod import can be problematic in Deno edge functions

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidUUID(value: unknown): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

export function isValidEmail(value: unknown): value is string {
  return typeof value === 'string' && EMAIL_REGEX.test(value);
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && value > 0 && !isNaN(value);
}

export function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}

// Schema definitions
export interface JoinEventInput {
  event_id: string;
}

export function validateJoinEventInput(input: unknown): ValidationResult<JoinEventInput> {
  const errors: ValidationError[] = [];
  
  if (typeof input !== 'object' || input === null) {
    return { success: false, errors: [{ field: 'body', message: 'Request body must be a JSON object' }] };
  }
  
  const data = input as Record<string, unknown>;
  
  if (!isValidUUID(data.event_id)) {
    errors.push({ field: 'event_id', message: 'event_id must be a valid UUID' });
  }
  
  if (errors.length > 0) {
    return { success: false, errors };
  }
  
  return { success: true, data: { event_id: data.event_id as string } };
}

export interface ModerationCheckInput {
  content: string;
  group_id: string;
}

export function validateModerationCheckInput(input: unknown): ValidationResult<ModerationCheckInput> {
  const errors: ValidationError[] = [];
  
  if (typeof input !== 'object' || input === null) {
    return { success: false, errors: [{ field: 'body', message: 'Request body must be a JSON object' }] };
  }
  
  const data = input as Record<string, unknown>;
  
  if (!isNonEmptyString(data.content)) {
    errors.push({ field: 'content', message: 'content must be a non-empty string' });
  } else if (typeof data.content === 'string' && data.content.length > 5000) {
    errors.push({ field: 'content', message: 'content must not exceed 5000 characters' });
  }
  
  if (!isValidUUID(data.group_id)) {
    errors.push({ field: 'group_id', message: 'group_id must be a valid UUID' });
  }
  
  if (errors.length > 0) {
    return { success: false, errors };
  }
  
  return { 
    success: true, 
    data: { 
      content: (data.content as string).trim(), 
      group_id: data.group_id as string 
    } 
  };
}

export interface OrgManagementInput {
  org_id?: string;
  user_id?: string;
  email?: string;
  role?: string;
  name?: string;
}

export function validateOrgManagementInput(input: unknown, action: string): ValidationResult<OrgManagementInput> {
  const errors: ValidationError[] = [];
  
  if (typeof input !== 'object' || input === null) {
    return { success: false, errors: [{ field: 'body', message: 'Request body must be a JSON object' }] };
  }
  
  const data = input as Record<string, unknown>;
  const result: OrgManagementInput = {};
  
  // Validate org_id if provided
  if (data.org_id !== undefined) {
    if (!isValidUUID(data.org_id)) {
      errors.push({ field: 'org_id', message: 'org_id must be a valid UUID' });
    } else {
      result.org_id = data.org_id as string;
    }
  }
  
  // Validate user_id if provided
  if (data.user_id !== undefined) {
    if (!isValidUUID(data.user_id)) {
      errors.push({ field: 'user_id', message: 'user_id must be a valid UUID' });
    } else {
      result.user_id = data.user_id as string;
    }
  }
  
  // Validate email if provided
  if (data.email !== undefined) {
    if (!isValidEmail(data.email)) {
      errors.push({ field: 'email', message: 'email must be a valid email address' });
    } else {
      result.email = (data.email as string).toLowerCase().trim();
    }
  }
  
  // Validate role if provided
  const validRoles = ['org_owner', 'org_admin', 'org_helper'];
  if (data.role !== undefined) {
    if (typeof data.role !== 'string' || !validRoles.includes(data.role)) {
      errors.push({ field: 'role', message: `role must be one of: ${validRoles.join(', ')}` });
    } else {
      result.role = data.role as string;
    }
  }
  
  // Validate name if provided
  if (data.name !== undefined) {
    if (!isNonEmptyString(data.name)) {
      errors.push({ field: 'name', message: 'name must be a non-empty string' });
    } else if ((data.name as string).length > 100) {
      errors.push({ field: 'name', message: 'name must not exceed 100 characters' });
    } else {
      result.name = (data.name as string).trim();
    }
  }
  
  if (errors.length > 0) {
    return { success: false, errors };
  }
  
  return { success: true, data: result };
}

// Sanitize string for safe logging (prevent log injection)
export function sanitizeForLog(value: string, maxLength = 100): string {
  return value
    .replace(/[\r\n]/g, ' ')
    .replace(/[<>]/g, '')
    .slice(0, maxLength);
}

// Format validation errors for response
export function formatValidationErrors(errors: ValidationError[]): string {
  return errors.map(e => `${e.field}: ${e.message}`).join('; ');
}
