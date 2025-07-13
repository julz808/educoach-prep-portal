// Rate Limiting Service for Supabase Edge Functions
// Provides rate limiting functionality with database-backed tracking

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface RateLimitRequest {
  userId?: string;
  ipAddress?: string;
  endpoint: string;
  windowMinutes?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  userCount?: number;
  userLimit?: number;
  ipCount?: number;
  ipLimit?: number;
  retryAfterMinutes?: number;
  remainingUserRequests?: number;
  remainingIpRequests?: number;
}

export class RateLimiter {
  private supabase: any;

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  /**
   * Check if a request should be rate limited
   */
  async checkRateLimit(request: RateLimitRequest): Promise<RateLimitResult> {
    try {
      const { data, error } = await this.supabase.rpc('check_rate_limit', {
        p_user_id: request.userId || null,
        p_ip_address: request.ipAddress || null,
        p_endpoint: request.endpoint,
        p_window_minutes: request.windowMinutes || 60
      });

      if (error) {
        console.error('Rate limit check error:', error);
        // On error, allow the request but log the issue
        return {
          allowed: true,
          reason: `Rate limit check failed: ${error.message}`
        };
      }

      return data as RateLimitResult;
    } catch (error) {
      console.error('Rate limit check exception:', error);
      // On exception, allow the request but log the issue
      return {
        allowed: true,
        reason: `Rate limit check exception: ${error.message}`
      };
    }
  }

  /**
   * Record usage for rate limiting tracking
   */
  async recordUsage(request: RateLimitRequest, requestCount: number = 1): Promise<void> {
    try {
      const { error } = await this.supabase.rpc('record_rate_limit_usage', {
        p_user_id: request.userId || null,
        p_ip_address: request.ipAddress || null,
        p_endpoint: request.endpoint,
        p_request_count: requestCount
      });

      if (error) {
        console.error('Rate limit record error:', error);
        // Don't throw - just log the error
      }
    } catch (error) {
      console.error('Rate limit record exception:', error);
      // Don't throw - just log the error
    }
  }

  /**
   * Check rate limit and record usage in one call
   */
  async checkAndRecord(request: RateLimitRequest): Promise<RateLimitResult> {
    const result = await this.checkRateLimit(request);
    
    if (result.allowed) {
      // Only record usage if the request is allowed
      await this.recordUsage(request);
    }
    
    return result;
  }

  /**
   * Get rate limit statistics for monitoring
   */
  async getStats(): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('rate_limit_stats')
        .select('*');

      if (error) {
        console.error('Rate limit stats error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Rate limit stats exception:', error);
      return [];
    }
  }
}

/**
 * Extract IP address from request headers
 */
export function getClientIP(request: Request): string | null {
  // Try various headers that might contain the real client IP
  const headers = request.headers;
  
  // Vercel/Edge runtime headers
  const xForwardedFor = headers.get('x-forwarded-for');
  if (xForwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return xForwardedFor.split(',')[0].trim();
  }
  
  // Cloudflare
  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }
  
  // Other common headers
  const xRealIp = headers.get('x-real-ip');
  if (xRealIp) {
    return xRealIp;
  }
  
  // Fallback to x-forwarded-for without processing
  const forwardedFor = headers.get('forwarded');
  if (forwardedFor) {
    const match = forwardedFor.match(/for=([^;,\s]+)/);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Create rate limit response
 */
export function createRateLimitResponse(
  result: RateLimitResult,
  corsHeaders: Record<string, string>
): Response {
  const headers = {
    ...corsHeaders,
    'Content-Type': 'application/json',
    'X-RateLimit-Limit-User': result.userLimit?.toString() || '0',
    'X-RateLimit-Remaining-User': result.remainingUserRequests?.toString() || '0',
    'X-RateLimit-Limit-IP': result.ipLimit?.toString() || '0',
    'X-RateLimit-Remaining-IP': result.remainingIpRequests?.toString() || '0'
  };

  if (result.retryAfterMinutes) {
    headers['Retry-After'] = (result.retryAfterMinutes * 60).toString(); // Convert to seconds
  }

  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: `Too many requests. ${result.reason || 'Please try again later.'}`,
      retryAfter: result.retryAfterMinutes ? `${result.retryAfterMinutes} minutes` : undefined
    }),
    {
      status: 429,
      headers
    }
  );
}

/**
 * Middleware function to add rate limiting to Edge Functions
 */
export async function withRateLimit<T>(
  request: Request,
  endpoint: string,
  handler: () => Promise<Response>,
  corsHeaders: Record<string, string> = {}
): Promise<Response> {
  try {
    // Initialize rate limiter
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('Rate limiting not configured - missing Supabase credentials');
      return await handler(); // Proceed without rate limiting
    }

    const rateLimiter = new RateLimiter(supabaseUrl, supabaseServiceKey);

    // Extract user ID from authorization header
    let userId: string | undefined;
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      try {
        // Create temporary client to verify user
        const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') || '');
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id;
      } catch (error) {
        console.warn('Could not extract user ID for rate limiting:', error);
      }
    }

    // Extract IP address
    const ipAddress = getClientIP(request);

    // Check rate limit
    const rateLimitRequest: RateLimitRequest = {
      userId,
      ipAddress,
      endpoint
    };

    const result = await rateLimiter.checkAndRecord(rateLimitRequest);

    if (!result.allowed) {
      console.log(`Rate limit exceeded for endpoint ${endpoint}:`, {
        userId: userId?.substring(0, 8) + '...',
        ipAddress,
        reason: result.reason
      });
      
      return createRateLimitResponse(result, corsHeaders);
    }

    // Rate limit check passed, proceed with the request
    const response = await handler();

    // Add rate limit headers to successful responses
    if (response.status < 400) {
      const headers = new Headers(response.headers);
      headers.set('X-RateLimit-Limit-User', result.userLimit?.toString() || '0');
      headers.set('X-RateLimit-Remaining-User', result.remainingUserRequests?.toString() || '0');
      headers.set('X-RateLimit-Limit-IP', result.ipLimit?.toString() || '0');
      headers.set('X-RateLimit-Remaining-IP', result.remainingIpRequests?.toString() || '0');

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    }

    return response;

  } catch (error) {
    console.error('Rate limiting middleware error:', error);
    // On rate limiting error, proceed with the request
    return await handler();
  }
}