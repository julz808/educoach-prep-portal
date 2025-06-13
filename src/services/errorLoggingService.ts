import { supabase } from '@/integrations/supabase/client';

export interface ErrorLog {
  id?: string;
  userId?: string;
  errorType: 'client' | 'server' | 'network' | 'validation' | 'auth';
  errorMessage: string;
  errorStack?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
  timestamp: string;
  userAgent?: string;
  url?: string;
}

/**
 * Log an error to the console and optionally to Supabase
 */
export async function logError(error: ErrorLog): Promise<void> {
  // Always log to console for development
  console.error(`[${error.errorType.toUpperCase()}] ${error.errorMessage}`, {
    component: error.component,
    action: error.action,
    metadata: error.metadata,
    stack: error.errorStack
  });

  // In production, we could log to Supabase or external service
  if (process.env.NODE_ENV === 'production') {
    try {
      // For now, we'll just store in localStorage for debugging
      const errorLogs = JSON.parse(localStorage.getItem('error_logs') || '[]');
      errorLogs.push({
        ...error,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
      
      // Keep only last 50 errors
      if (errorLogs.length > 50) {
        errorLogs.splice(0, errorLogs.length - 50);
      }
      
      localStorage.setItem('error_logs', JSON.stringify(errorLogs));
    } catch (storageError) {
      console.error('Failed to store error log:', storageError);
    }
  }
}

/**
 * Create error logger for a specific component
 */
export function createComponentLogger(componentName: string) {
  return {
    error: (message: string, metadata?: Record<string, any>, stack?: string) => {
      logError({
        errorType: 'client',
        errorMessage: message,
        errorStack: stack,
        component: componentName,
        metadata,
        timestamp: new Date().toISOString()
      });
    },
    
    networkError: (message: string, action: string, metadata?: Record<string, any>) => {
      logError({
        errorType: 'network',
        errorMessage: message,
        component: componentName,
        action,
        metadata,
        timestamp: new Date().toISOString()
      });
    },
    
    validationError: (message: string, action: string, metadata?: Record<string, any>) => {
      logError({
        errorType: 'validation',
        errorMessage: message,
        component: componentName,
        action,
        metadata,
        timestamp: new Date().toISOString()
      });
    },
    
    authError: (message: string, action: string, metadata?: Record<string, any>) => {
      logError({
        errorType: 'auth',
        errorMessage: message,
        component: componentName,
        action,
        metadata,
        timestamp: new Date().toISOString()
      });
    }
  };
}

/**
 * Get error logs for debugging (development only)
 */
export function getErrorLogs(): ErrorLog[] {
  if (process.env.NODE_ENV !== 'production') {
    try {
      return JSON.parse(localStorage.getItem('error_logs') || '[]');
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Clear error logs
 */
export function clearErrorLogs(): void {
  localStorage.removeItem('error_logs');
}

/**
 * Handle Supabase errors consistently
 */
export function handleSupabaseError(error: any, context: {
  component: string;
  action: string;
  userId?: string;
}): void {
  let errorMessage = 'Unknown Supabase error';
  let errorType: ErrorLog['errorType'] = 'server';
  
  if (error?.message) {
    errorMessage = error.message;
  }
  
  if (error?.code === 'PGRST116') {
    errorMessage = 'No data found';
  } else if (error?.code?.startsWith('PGRST')) {
    errorType = 'server';
  } else if (error?.code === '23505') {
    errorMessage = 'Duplicate entry';
    errorType = 'validation';
  } else if (error?.code === '23503') {
    errorMessage = 'Referenced record not found';
    errorType = 'validation';
  }
  
  logError({
    errorType,
    errorMessage,
    component: context.component,
    action: context.action,
    userId: context.userId,
    metadata: {
      supabaseError: error,
      code: error?.code
    },
    timestamp: new Date().toISOString()
  });
}

/**
 * Wrap async functions with error handling
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context: { component: string; action: string }
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error && typeof error === 'object' && 'message' in error) {
        handleSupabaseError(error, context);
      } else {
        logError({
          errorType: 'client',
          errorMessage: String(error),
          component: context.component,
          action: context.action,
          timestamp: new Date().toISOString()
        });
      }
      throw error;
    }
  };
}

// Error Logging Service
export class ErrorLoggingService {
  static async logError(error: any, context?: string) {
    console.error('Error logged:', error, context);
    return true;
  }

  static async logWarning(message: string, context?: string) {
    console.warn('Warning logged:', message, context);
    return true;
  }
}

export default ErrorLoggingService; 