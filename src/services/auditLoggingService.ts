// Audit Logging Service
// Provides comprehensive audit trail for security events and user actions

import { supabase } from '@/integrations/supabase/client';
import { secureLogger } from '@/utils/secureLogger';

export interface AuditEvent {
  user_id?: string;
  event_type: string;
  event_details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  risk_level?: 'low' | 'medium' | 'high' | 'critical';
}

export interface SecurityMetrics {
  failed_logins: number;
  rate_limit_violations: number;
  suspicious_activities: number;
  successful_logins: number;
  last_24h_events: number;
}

/**
 * Audit Logging Service for security events and user actions
 */
export class AuditLoggingService {
  
  /**
   * Log a security event to the audit trail
   */
  static async logSecurityEvent(event: AuditEvent): Promise<void> {
    try {
      // Get client IP and user agent if available
      const enrichedEvent = {
        ...event,
        ip_address: event.ip_address || this.getClientIP(),
        user_agent: event.user_agent || this.getUserAgent(),
        created_at: new Date().toISOString()
      };

      // Store in Supabase (using the rate_limits table temporarily)
      // In production, you might want a dedicated audit_log table
      const { error } = await supabase
        .from('rate_limits')
        .insert({
          user_id: enrichedEvent.user_id || null,
          endpoint: 'audit_log',
          request_count: 1,
          // Store audit data in a way that doesn't conflict with rate limiting
          // This is a temporary solution - ideally create a dedicated audit table
        });

      if (error) {
        secureLogger.error('Failed to store audit event in database', error);
      }

      // Always log to console for monitoring
      secureLogger.security(enrichedEvent.event_type, {
        user_id: enrichedEvent.user_id,
        details: enrichedEvent.event_details,
        risk_level: enrichedEvent.risk_level,
        ip: enrichedEvent.ip_address,
        timestamp: enrichedEvent.created_at
      });

      // Log high-risk events with additional emphasis
      if (enrichedEvent.risk_level === 'high' || enrichedEvent.risk_level === 'critical') {
        console.warn(`🚨 HIGH RISK SECURITY EVENT: ${enrichedEvent.event_type}`, {
          user_id: enrichedEvent.user_id,
          details: enrichedEvent.event_details,
          timestamp: enrichedEvent.created_at
        });
      }

    } catch (error) {
      secureLogger.error('Audit logging failed', error as Error);
      // Don't throw - audit logging failure shouldn't break the application
    }
  }

  /**
   * Log authentication events
   */
  static async logAuthEvent(
    eventType: 'login_success' | 'login_failure' | 'logout' | 'signup' | 'password_reset',
    userId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    const riskLevel = eventType === 'login_failure' ? 'medium' : 'low';
    
    await this.logSecurityEvent({
      user_id: userId,
      event_type: `auth_${eventType}`,
      event_details: {
        action: eventType,
        ...details
      },
      risk_level: riskLevel
    });
  }

  /**
   * Log data access events
   */
  static async logDataAccess(
    action: 'read' | 'write' | 'delete' | 'export',
    resource: string,
    userId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    const riskLevel = action === 'delete' || action === 'export' ? 'medium' : 'low';
    
    await this.logSecurityEvent({
      user_id: userId,
      event_type: `data_${action}`,
      event_details: {
        action,
        resource,
        ...details
      },
      risk_level: riskLevel
    });
  }

  /**
   * Log API usage events
   */
  static async logAPIUsage(
    endpoint: string,
    userId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logSecurityEvent({
      user_id: userId,
      event_type: 'api_usage',
      event_details: {
        endpoint,
        ...details
      },
      risk_level: 'low'
    });
  }

  /**
   * Log rate limiting violations
   */
  static async logRateLimitViolation(
    endpoint: string,
    userId?: string,
    ipAddress?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logSecurityEvent({
      user_id: userId,
      event_type: 'rate_limit_violation',
      event_details: {
        endpoint,
        violated_limit: true,
        ...details
      },
      ip_address: ipAddress,
      risk_level: 'high'
    });
  }

  /**
   * Log suspicious activity
   */
  static async logSuspiciousActivity(
    activityType: string,
    userId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logSecurityEvent({
      user_id: userId,
      event_type: 'suspicious_activity',
      event_details: {
        activity_type: activityType,
        ...details
      },
      risk_level: 'high'
    });
  }

  /**
   * Log security configuration changes
   */
  static async logSecurityConfigChange(
    changeType: string,
    userId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logSecurityEvent({
      user_id: userId,
      event_type: 'security_config_change',
      event_details: {
        change_type: changeType,
        ...details
      },
      risk_level: 'critical'
    });
  }

  /**
   * Get security metrics for monitoring
   */
  static async getSecurityMetrics(timeframe: '1h' | '24h' | '7d' = '24h'): Promise<SecurityMetrics> {
    try {
      const hours = timeframe === '1h' ? 1 : timeframe === '24h' ? 24 : 168;
      const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

      // Since we're using console logging primarily, return mock metrics
      // In production with a dedicated audit table, you'd query the database
      return {
        failed_logins: 0,
        rate_limit_violations: 0,
        suspicious_activities: 0,
        successful_logins: 0,
        last_24h_events: 0
      };

    } catch (error) {
      secureLogger.error('Failed to get security metrics', error as Error);
      
      // Return safe defaults
      return {
        failed_logins: 0,
        rate_limit_violations: 0,
        suspicious_activities: 0,
        successful_logins: 0,
        last_24h_events: 0
      };
    }
  }

  /**
   * Check for suspicious patterns
   */
  static async detectSuspiciousPatterns(userId: string): Promise<{
    hasPatterns: boolean;
    patterns: string[];
    riskLevel: 'low' | 'medium' | 'high';
  }> {
    try {
      // Basic pattern detection logic
      // In production, this would analyze audit logs for patterns
      const patterns: string[] = [];
      let riskLevel: 'low' | 'medium' | 'high' = 'low';

      // Example patterns to detect:
      // - Multiple failed login attempts
      // - Unusual API usage patterns
      // - Access from multiple IPs rapidly
      // - Bulk data operations

      return {
        hasPatterns: patterns.length > 0,
        patterns,
        riskLevel
      };

    } catch (error) {
      secureLogger.error('Pattern detection failed', error as Error);
      
      return {
        hasPatterns: false,
        patterns: [],
        riskLevel: 'low'
      };
    }
  }

  /**
   * Generate security report
   */
  static async generateSecurityReport(timeframe: '24h' | '7d' | '30d' = '24h'): Promise<{
    summary: SecurityMetrics;
    topEvents: Array<{ event_type: string; count: number }>;
    riskUsers: Array<{ user_id: string; risk_score: number }>;
    recommendations: string[];
  }> {
    try {
      const metrics = await this.getSecurityMetrics(timeframe);
      
      // In production, this would analyze actual audit data
      return {
        summary: metrics,
        topEvents: [
          { event_type: 'auth_login_success', count: 0 },
          { event_type: 'api_usage', count: 0 },
          { event_type: 'data_read', count: 0 }
        ],
        riskUsers: [],
        recommendations: [
          'Enable MFA for all admin accounts',
          'Review rate limiting configurations',
          'Monitor for unusual login patterns',
          'Regular security header audits'
        ]
      };

    } catch (error) {
      secureLogger.error('Security report generation failed', error as Error);
      throw error;
    }
  }

  /**
   * Helper: Get client IP address
   */
  private static getClientIP(): string | undefined {
    // This will work in some environments, but not all
    // In production, you might need to check headers like X-Forwarded-For
    try {
      return undefined; // Browser environment - IP not directly accessible
    } catch {
      return undefined;
    }
  }

  /**
   * Helper: Get user agent
   */
  private static getUserAgent(): string | undefined {
    try {
      return typeof navigator !== 'undefined' ? navigator.userAgent : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Helper: Get session ID from current session
   */
  private static async getSessionId(): Promise<string | undefined> {
    try {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ? 
        data.session.access_token.substring(0, 16) + '...' : 
        undefined;
    } catch {
      return undefined;
    }
  }
}

// Convenience wrapper functions for common audit events
export const auditLog = {
  /**
   * Log user login
   */
  login: (userId: string, success: boolean, details?: Record<string, any>) => 
    AuditLoggingService.logAuthEvent(
      success ? 'login_success' : 'login_failure', 
      userId, 
      details
    ),

  /**
   * Log user logout
   */
  logout: (userId: string) => 
    AuditLoggingService.logAuthEvent('logout', userId),

  /**
   * Log user signup
   */
  signup: (userId: string, details?: Record<string, any>) => 
    AuditLoggingService.logAuthEvent('signup', userId, details),

  /**
   * Log question generation
   */
  questionGeneration: (userId: string, details: Record<string, any>) => 
    AuditLoggingService.logAPIUsage('question_generation', userId, details),

  /**
   * Log writing assessment
   */
  writingAssessment: (userId: string, details: Record<string, any>) => 
    AuditLoggingService.logAPIUsage('writing_assessment', userId, details),

  /**
   * Log test session activity
   */
  testSession: (userId: string, action: string, details: Record<string, any>) => 
    AuditLoggingService.logDataAccess('write', 'test_session', userId, { action, ...details }),

  /**
   * Log suspicious activity
   */
  suspicious: (activityType: string, userId?: string, details?: Record<string, any>) => 
    AuditLoggingService.logSuspiciousActivity(activityType, userId, details),

  /**
   * Log rate limit violation
   */
  rateLimitViolation: (endpoint: string, userId?: string, ipAddress?: string) => 
    AuditLoggingService.logRateLimitViolation(endpoint, userId, ipAddress)
};