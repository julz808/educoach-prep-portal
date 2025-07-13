// Input Validation Utilities
// Provides comprehensive validation and sanitization for user inputs

import { z } from 'zod';

// ============================================================================
// Base Validation Schemas
// ============================================================================

/**
 * User Profile Validation
 */
export const userProfileSchema = z.object({
  display_name: z.string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Display name can only contain letters and spaces'),
  
  student_first_name: z.string()
    .min(1, 'First name is required')
    .max(30, 'First name must be less than 30 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name contains invalid characters'),
  
  student_last_name: z.string()
    .min(1, 'Last name is required')
    .max(30, 'Last name must be less than 30 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name contains invalid characters'),
  
  parent_first_name: z.string()
    .min(1, 'Parent first name is required')
    .max(30, 'Parent first name must be less than 30 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Parent first name contains invalid characters'),
  
  parent_last_name: z.string()
    .min(1, 'Parent last name is required')
    .max(30, 'Parent last name must be less than 30 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Parent last name contains invalid characters'),
  
  school_name: z.string()
    .min(2, 'School name must be at least 2 characters')
    .max(100, 'School name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-'.,()&]+$/, 'School name contains invalid characters'),
  
  year_level: z.number()
    .int('Year level must be a whole number')
    .min(5, 'Year level must be between 5 and 10')
    .max(10, 'Year level must be between 5 and 10')
});

/**
 * Question Generation Validation
 */
export const questionGenerationSchema = z.object({
  testType: z.string()
    .min(3, 'Test type is required')
    .max(100, 'Test type is too long')
    .regex(/^[a-zA-Z0-9\s\-()]+$/, 'Test type contains invalid characters'),
  
  yearLevel: z.string()
    .regex(/^[5-9]|10$/, 'Year level must be between 5 and 10'),
  
  sectionName: z.string()
    .min(2, 'Section name is required')
    .max(50, 'Section name is too long')
    .regex(/^[a-zA-Z\s&-]+$/, 'Section name contains invalid characters'),
  
  subSkill: z.string()
    .min(2, 'Sub-skill is required')
    .max(100, 'Sub-skill is too long')
    .regex(/^[a-zA-Z\s&()-,]+$/, 'Sub-skill contains invalid characters'),
  
  difficulty: z.number()
    .int('Difficulty must be a whole number')
    .min(1, 'Difficulty must be between 1 and 3')
    .max(3, 'Difficulty must be between 1 and 3'),
  
  questionCount: z.number()
    .int('Question count must be a whole number')
    .min(1, 'Must generate at least 1 question')
    .max(50, 'Cannot generate more than 50 questions at once'),
  
  visualRequired: z.boolean().optional(),
  australianContext: z.boolean().optional(),
  testMode: z.string().max(20).optional()
});

/**
 * Writing Assessment Validation
 */
export const writingAssessmentSchema = z.object({
  userResponse: z.string()
    .min(10, 'Response must be at least 10 characters')
    .max(10000, 'Response must be less than 10,000 characters'),
  
  writingPrompt: z.string()
    .min(5, 'Writing prompt is required')
    .max(5000, 'Writing prompt is too long'),
  
  rubric: z.object({
    totalMarks: z.number().int().min(1).max(100),
    criteria: z.array(z.object({
      name: z.string().min(1).max(50),
      maxMarks: z.number().int().min(1).max(50),
      description: z.string().min(1).max(200)
    })).min(1).max(10)
  }),
  
  yearLevel: z.string()
    .regex(/^[5-9]|10$/, 'Year level must be between 5 and 10')
});

/**
 * Test Session Validation
 */
export const testSessionSchema = z.object({
  product_type: z.string()
    .min(5, 'Product type is required')
    .max(100, 'Product type is too long'),
  
  test_mode: z.enum(['diagnostic', 'practice', 'drill']),
  
  test_number: z.number()
    .int()
    .min(1)
    .max(5)
    .nullable(),
  
  answers_data: z.record(z.string(), z.any()).optional(),
  
  flagged_questions: z.array(z.number().int().min(0)).optional(),
  
  time_remaining_seconds: z.number()
    .int()
    .min(0)
    .max(18000) // 5 hours max
    .optional()
});

// ============================================================================
// Sanitization Functions
// ============================================================================

/**
 * Sanitize string input to prevent XSS and injection attacks
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .replace(/[<>\"']/g, '') // Remove potential XSS characters
    .replace(/\0/g, '') // Remove null bytes
    .replace(/\n\r?/g, ' ') // Replace newlines with spaces
    .substring(0, 10000); // Limit length
}

/**
 * Sanitize and validate email
 */
export function sanitizeEmail(email: string): string {
  const emailSchema = z.string()
    .email('Invalid email format')
    .max(254, 'Email is too long')
    .toLowerCase();
  
  try {
    return emailSchema.parse(email.trim());
  } catch {
    throw new Error('Invalid email format');
  }
}

/**
 * Sanitize numeric input
 */
export function sanitizeNumber(
  input: any, 
  min?: number, 
  max?: number
): number {
  const num = Number(input);
  
  if (isNaN(num) || !isFinite(num)) {
    throw new Error('Invalid number');
  }
  
  if (min !== undefined && num < min) {
    throw new Error(`Number must be at least ${min}`);
  }
  
  if (max !== undefined && num > max) {
    throw new Error(`Number must be at most ${max}`);
  }
  
  return num;
}

/**
 * Sanitize UUID
 */
export function sanitizeUUID(uuid: string): string {
  const uuidSchema = z.string()
    .uuid('Invalid UUID format');
  
  try {
    return uuidSchema.parse(uuid.trim());
  } catch {
    throw new Error('Invalid UUID format');
  }
}

// ============================================================================
// Validation Wrapper Functions
// ============================================================================

/**
 * Validate user profile data
 */
export function validateUserProfile(data: any): z.infer<typeof userProfileSchema> {
  try {
    // Pre-sanitize string fields
    const sanitized = {
      ...data,
      display_name: sanitizeString(data.display_name || ''),
      student_first_name: sanitizeString(data.student_first_name || ''),
      student_last_name: sanitizeString(data.student_last_name || ''),
      parent_first_name: sanitizeString(data.parent_first_name || ''),
      parent_last_name: sanitizeString(data.parent_last_name || ''),
      school_name: sanitizeString(data.school_name || ''),
      year_level: sanitizeNumber(data.year_level, 5, 10)
    };
    
    return userProfileSchema.parse(sanitized);
  } catch (error) {
    throw new Error(`Profile validation failed: ${error.message}`);
  }
}

/**
 * Validate question generation request
 */
export function validateQuestionGeneration(data: any): z.infer<typeof questionGenerationSchema> {
  try {
    const sanitized = {
      ...data,
      testType: sanitizeString(data.testType || ''),
      yearLevel: sanitizeString(data.yearLevel || ''),
      sectionName: sanitizeString(data.sectionName || ''),
      subSkill: sanitizeString(data.subSkill || ''),
      difficulty: sanitizeNumber(data.difficulty, 1, 3),
      questionCount: sanitizeNumber(data.questionCount, 1, 50),
      visualRequired: Boolean(data.visualRequired),
      australianContext: Boolean(data.australianContext),
      testMode: data.testMode ? sanitizeString(data.testMode) : undefined
    };
    
    return questionGenerationSchema.parse(sanitized);
  } catch (error) {
    throw new Error(`Question generation validation failed: ${error.message}`);
  }
}

/**
 * Validate writing assessment request
 */
export function validateWritingAssessment(data: any): z.infer<typeof writingAssessmentSchema> {
  try {
    const sanitized = {
      ...data,
      userResponse: sanitizeString(data.userResponse || ''),
      writingPrompt: sanitizeString(data.writingPrompt || ''),
      yearLevel: sanitizeString(data.yearLevel || ''),
      rubric: data.rubric // Keep rubric structure as-is for now
    };
    
    return writingAssessmentSchema.parse(sanitized);
  } catch (error) {
    throw new Error(`Writing assessment validation failed: ${error.message}`);
  }
}

/**
 * Validate test session data
 */
export function validateTestSession(data: any): z.infer<typeof testSessionSchema> {
  try {
    const sanitized = {
      ...data,
      product_type: sanitizeString(data.product_type || ''),
      test_mode: data.test_mode,
      test_number: data.test_number ? sanitizeNumber(data.test_number, 1, 5) : null,
      answers_data: data.answers_data || {},
      flagged_questions: Array.isArray(data.flagged_questions) 
        ? data.flagged_questions.map(n => sanitizeNumber(n, 0)) 
        : [],
      time_remaining_seconds: data.time_remaining_seconds 
        ? sanitizeNumber(data.time_remaining_seconds, 0, 18000) 
        : undefined
    };
    
    return testSessionSchema.parse(sanitized);
  } catch (error) {
    throw new Error(`Test session validation failed: ${error.message}`);
  }
}

// ============================================================================
// Security Headers and CSRF Protection
// ============================================================================

/**
 * Validate request origin for CSRF protection
 */
export function validateRequestOrigin(
  origin: string | null, 
  allowedOrigins: string[]
): boolean {
  if (!origin) {
    return false; // No origin header
  }
  
  return allowedOrigins.includes(origin);
}

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(
  providedToken: string, 
  sessionToken: string
): boolean {
  if (!providedToken || !sessionToken) {
    return false;
  }
  
  return providedToken === sessionToken;
}

// ============================================================================
// Rate Limiting Helpers
// ============================================================================

/**
 * Validate rate limiting parameters
 */
export function validateRateLimitRequest(data: any): {
  userId?: string;
  ipAddress?: string;
  endpoint: string;
} {
  return {
    userId: data.userId ? sanitizeUUID(data.userId) : undefined,
    ipAddress: data.ipAddress ? sanitizeString(data.ipAddress) : undefined,
    endpoint: sanitizeString(data.endpoint || 'unknown')
  };
}

export type { z };
export { z };