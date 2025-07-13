// Secure Logging Utility
// Provides production-safe logging with sensitive data sanitization

interface LogData {
  [key: string]: any;
}

interface SanitizedError {
  message: string;
  code?: string;
  stack?: string;
}

/**
 * Sanitize log data by removing sensitive information
 */
function sanitizeLogData(data: LogData | any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (data instanceof Error) {
    return sanitizeError(data);
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeLogData(item));
  }

  const sanitized = { ...data };
  
  // Remove sensitive fields
  const sensitiveFields = [
    'password',
    'token',
    'api_key',
    'apiKey',
    'secret',
    'auth',
    'authorization',
    'x-api-key',
    'claude_api_key',
    'supabase_key',
    'jwt',
    'session_token',
    'refresh_token',
    'access_token'
  ];

  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  // Mask user IDs and email addresses in production
  if (import.meta.env.PROD) {
    if (sanitized.user_id && typeof sanitized.user_id === 'string') {
      sanitized.user_id = sanitized.user_id.substring(0, 8) + '...';
    }
    
    if (sanitized.email && typeof sanitized.email === 'string') {
      const [localPart, domain] = sanitized.email.split('@');
      if (domain) {
        sanitized.email = localPart.substring(0, 2) + '***@' + domain;
      }
    }

    if (sanitized.user && typeof sanitized.user === 'object') {
      sanitized.user = sanitizeLogData(sanitized.user);
    }
  }

  // Recursively sanitize nested objects
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key] && typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeLogData(sanitized[key]);
    }
  });

  return sanitized;
}

/**
 * Sanitize error objects for safe logging
 */
function sanitizeError(error: Error): SanitizedError {
  const sanitized: SanitizedError = {
    message: error.message,
    code: (error as any).code,
  };

  // Only include stack trace in development
  if (import.meta.env.DEV) {
    sanitized.stack = error.stack;
  }

  // Sanitize error message for common sensitive patterns
  if (sanitized.message) {
    sanitized.message = sanitized.message
      .replace(/sk-ant-api03-[a-zA-Z0-9_-]+/g, '[REDACTED_API_KEY]')
      .replace(/Bearer [a-zA-Z0-9._-]+/g, 'Bearer [REDACTED]')
      .replace(/password.*?['"]\s*:\s*['"][^'"]+['"]/gi, 'password": "[REDACTED]"');
  }

  return sanitized;
}

/**
 * Format log message with timestamp and level
 */
function formatLogMessage(level: string, message: string, data?: any): string {
  const timestamp = new Date().toISOString();
  const sanitizedData = data ? sanitizeLogData(data) : undefined;
  
  let logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  if (sanitizedData) {
    logEntry += ` ${JSON.stringify(sanitizedData)}`;
  }
  
  return logEntry;
}

/**
 * Secure logger with different log levels
 */
export const secureLogger = {
  /**
   * Debug level logging (development only)
   */
  debug: (message: string, data?: LogData) => {
    if (import.meta.env.DEV) {
      console.log(formatLogMessage('debug', message, data));
    }
  },

  /**
   * Info level logging
   */
  info: (message: string, data?: LogData) => {
    console.info(formatLogMessage('info', message, data));
  },

  /**
   * Warning level logging
   */
  warn: (message: string, data?: LogData) => {
    console.warn(formatLogMessage('warn', message, data));
  },

  /**
   * Error level logging
   */
  error: (message: string, error?: Error | LogData) => {
    const sanitizedError = error instanceof Error 
      ? sanitizeError(error)
      : sanitizeLogData(error);
    
    console.error(formatLogMessage('error', message, sanitizedError));
  },

  /**
   * Security event logging (always logged)
   */
  security: (event: string, data?: LogData) => {
    const securityData = {
      event,
      timestamp: new Date().toISOString(),
      ...sanitizeLogData(data)
    };
    
    console.warn(formatLogMessage('security', `Security Event: ${event}`, securityData));
  },

  /**
   * Performance logging
   */
  performance: (metric: string, value: number, unit: string = 'ms', data?: LogData) => {
    const perfData = {
      metric,
      value,
      unit,
      ...sanitizeLogData(data)
    };
    
    console.info(formatLogMessage('performance', `Performance: ${metric}`, perfData));
  }
};

/**
 * Create production-safe error response
 */
export function createSafeErrorResponse(error: Error | string, statusCode: number = 500): {
  error: string;
  message: string;
  code?: string;
  timestamp: string;
} {
  const timestamp = new Date().toISOString();
  
  if (typeof error === 'string') {
    return {
      error: import.meta.env.PROD ? 'Internal Server Error' : error,
      message: import.meta.env.PROD ? 'An error occurred. Please try again.' : error,
      timestamp
    };
  }

  // For Error objects
  const sanitizedError = sanitizeError(error);
  
  return {
    error: import.meta.env.PROD ? 'Internal Server Error' : sanitizedError.message,
    message: import.meta.env.PROD 
      ? 'An error occurred. Please try again.' 
      : sanitizedError.message,
    code: sanitizedError.code,
    timestamp
  };
}

/**
 * Middleware wrapper for secure error handling
 */
export function withSecureErrorHandling<T extends (...args: any[]) => any>(
  fn: T,
  context: string = 'Unknown'
): T {
  return ((...args: Parameters<T>) => {
    try {
      const result = fn(...args);
      
      // Handle async functions
      if (result instanceof Promise) {
        return result.catch((error: Error) => {
          secureLogger.error(`Error in ${context}`, error);
          throw createSafeErrorResponse(error);
        });
      }
      
      return result;
    } catch (error) {
      secureLogger.error(`Error in ${context}`, error as Error);
      throw createSafeErrorResponse(error as Error);
    }
  }) as T;
}

/**
 * Log user action for audit trail
 */
export function logUserAction(
  action: string,
  userId?: string,
  details?: LogData
): void {
  secureLogger.info(`User Action: ${action}`, {
    action,
    userId: userId ? (import.meta.env.PROD ? userId.substring(0, 8) + '...' : userId) : undefined,
    timestamp: new Date().toISOString(),
    ...sanitizeLogData(details)
  });
}