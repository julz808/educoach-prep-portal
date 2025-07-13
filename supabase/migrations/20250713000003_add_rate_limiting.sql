-- Rate Limiting Implementation for EduCourse Production Security
-- Creates tables and functions for API rate limiting

-- 1. Create rate_limits table
CREATE TABLE rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ip_address INET,
    endpoint VARCHAR(100) NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Add indexes for performance
CREATE INDEX idx_rate_limits_user_endpoint ON rate_limits(user_id, endpoint);
CREATE INDEX idx_rate_limits_ip_endpoint ON rate_limits(ip_address, endpoint);
CREATE INDEX idx_rate_limits_window_start ON rate_limits(window_start);
CREATE INDEX idx_rate_limits_endpoint ON rate_limits(endpoint);

-- 3. Enable RLS on rate_limits table
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies for rate_limits (admin/service role only)
CREATE POLICY "Rate limits are service role only" ON rate_limits
    FOR ALL USING (false); -- Only accessible via service role

-- 5. Create rate limiting configuration table
CREATE TABLE rate_limit_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint VARCHAR(100) UNIQUE NOT NULL,
    user_limit_per_hour INTEGER NOT NULL,
    ip_limit_per_hour INTEGER NOT NULL,
    window_minutes INTEGER DEFAULT 60,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. Insert default rate limiting configurations
INSERT INTO rate_limit_config (endpoint, user_limit_per_hour, ip_limit_per_hour, window_minutes) VALUES
    ('question-generation', 50, 100, 60),
    ('writing-assessment', 20, 50, 60),
    ('general-api', 100, 200, 60),
    ('auth-attempt', 10, 20, 60);

-- 7. Enable RLS on rate_limit_config
ALTER TABLE rate_limit_config ENABLE ROW LEVEL SECURITY;

-- 8. RLS policy for rate_limit_config (read-only for authenticated users)
CREATE POLICY "Rate limit config is readable by authenticated users" ON rate_limit_config
    FOR SELECT TO authenticated USING (true);

-- 9. Create function to check rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_user_id UUID,
    p_ip_address INET,
    p_endpoint VARCHAR,
    p_window_minutes INTEGER DEFAULT 60
)
RETURNS JSONB AS $$
DECLARE
    config_row RECORD;
    user_count INTEGER := 0;
    ip_count INTEGER := 0;
    window_start_time TIMESTAMP;
    result JSONB;
BEGIN
    -- Get rate limit configuration for this endpoint
    SELECT * INTO config_row 
    FROM rate_limit_config 
    WHERE endpoint = p_endpoint AND enabled = true;
    
    -- If no config found, use general-api config
    IF NOT FOUND THEN
        SELECT * INTO config_row 
        FROM rate_limit_config 
        WHERE endpoint = 'general-api' AND enabled = true;
    END IF;
    
    -- If still no config, return allowed (no rate limiting)
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'allowed', true,
            'message', 'No rate limit configuration found'
        );
    END IF;
    
    -- Calculate window start time
    window_start_time := NOW() - (config_row.window_minutes || ' minutes')::INTERVAL;
    
    -- Count requests for this user in the window
    IF p_user_id IS NOT NULL THEN
        SELECT COALESCE(SUM(request_count), 0) INTO user_count
        FROM rate_limits
        WHERE user_id = p_user_id 
            AND endpoint = p_endpoint 
            AND window_start >= window_start_time;
    END IF;
    
    -- Count requests for this IP in the window
    IF p_ip_address IS NOT NULL THEN
        SELECT COALESCE(SUM(request_count), 0) INTO ip_count
        FROM rate_limits
        WHERE ip_address = p_ip_address 
            AND endpoint = p_endpoint 
            AND window_start >= window_start_time;
    END IF;
    
    -- Check if limits exceeded
    IF user_count >= config_row.user_limit_per_hour THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'user_limit_exceeded',
            'user_count', user_count,
            'user_limit', config_row.user_limit_per_hour,
            'retry_after_minutes', config_row.window_minutes
        );
    END IF;
    
    IF ip_count >= config_row.ip_limit_per_hour THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'ip_limit_exceeded',
            'ip_count', ip_count,
            'ip_limit', config_row.ip_limit_per_hour,
            'retry_after_minutes', config_row.window_minutes
        );
    END IF;
    
    -- Rate limit check passed
    RETURN jsonb_build_object(
        'allowed', true,
        'user_count', user_count,
        'user_limit', config_row.user_limit_per_hour,
        'ip_count', ip_count,
        'ip_limit', config_row.ip_limit_per_hour,
        'remaining_user_requests', config_row.user_limit_per_hour - user_count,
        'remaining_ip_requests', config_row.ip_limit_per_hour - ip_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create function to record rate limit usage
CREATE OR REPLACE FUNCTION record_rate_limit_usage(
    p_user_id UUID,
    p_ip_address INET,
    p_endpoint VARCHAR,
    p_request_count INTEGER DEFAULT 1
)
RETURNS VOID AS $$
DECLARE
    current_window TIMESTAMP;
    existing_record RECORD;
BEGIN
    -- Calculate current hour window
    current_window := DATE_TRUNC('hour', NOW());
    
    -- Try to find existing record for this user/IP/endpoint/window
    IF p_user_id IS NOT NULL THEN
        SELECT * INTO existing_record
        FROM rate_limits
        WHERE user_id = p_user_id 
            AND endpoint = p_endpoint 
            AND window_start = current_window;
            
        IF FOUND THEN
            -- Update existing record
            UPDATE rate_limits 
            SET request_count = request_count + p_request_count,
                updated_at = NOW()
            WHERE id = existing_record.id;
        ELSE
            -- Insert new record
            INSERT INTO rate_limits (user_id, ip_address, endpoint, request_count, window_start)
            VALUES (p_user_id, p_ip_address, p_endpoint, p_request_count, current_window);
        END IF;
    ELSEIF p_ip_address IS NOT NULL THEN
        -- Handle IP-only tracking
        SELECT * INTO existing_record
        FROM rate_limits
        WHERE ip_address = p_ip_address 
            AND endpoint = p_endpoint 
            AND window_start = current_window
            AND user_id IS NULL;
            
        IF FOUND THEN
            UPDATE rate_limits 
            SET request_count = request_count + p_request_count,
                updated_at = NOW()
            WHERE id = existing_record.id;
        ELSE
            INSERT INTO rate_limits (ip_address, endpoint, request_count, window_start)
            VALUES (p_ip_address, p_endpoint, p_request_count, current_window);
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create function to clean up old rate limit records
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete records older than 7 days
    DELETE FROM rate_limits 
    WHERE window_start < NOW() - INTERVAL '7 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Grant permissions to authenticated users for the functions
GRANT EXECUTE ON FUNCTION check_rate_limit(UUID, INET, VARCHAR, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION record_rate_limit_usage(UUID, INET, VARCHAR, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_rate_limits() TO authenticated;

-- 13. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_rate_limits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_rate_limits_updated_at
    BEFORE UPDATE ON rate_limits
    FOR EACH ROW
    EXECUTE FUNCTION update_rate_limits_updated_at();

CREATE TRIGGER trigger_update_rate_limit_config_updated_at
    BEFORE UPDATE ON rate_limit_config
    FOR EACH ROW
    EXECUTE FUNCTION update_rate_limits_updated_at();

-- 14. Add comments for documentation
COMMENT ON TABLE rate_limits IS 'Tracks API request counts for rate limiting by user and IP address';
COMMENT ON TABLE rate_limit_config IS 'Configuration for rate limiting rules per endpoint';
COMMENT ON FUNCTION check_rate_limit(UUID, INET, VARCHAR, INTEGER) IS 'Checks if a request should be rate limited';
COMMENT ON FUNCTION record_rate_limit_usage(UUID, INET, VARCHAR, INTEGER) IS 'Records API usage for rate limiting tracking';
COMMENT ON FUNCTION cleanup_old_rate_limits() IS 'Cleans up old rate limiting records to prevent table bloat';

-- 15. Create view for rate limiting statistics
CREATE VIEW rate_limit_stats AS
SELECT 
    endpoint,
    COUNT(*) as total_windows,
    SUM(request_count) as total_requests,
    AVG(request_count) as avg_requests_per_window,
    MAX(request_count) as max_requests_per_window,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT ip_address) as unique_ips
FROM rate_limits 
WHERE window_start >= NOW() - INTERVAL '24 hours'
GROUP BY endpoint
ORDER BY total_requests DESC;

-- 16. Enable RLS on the view
ALTER VIEW rate_limit_stats SET (security_barrier = true);

-- Grant access to authenticated users for monitoring
GRANT SELECT ON rate_limit_stats TO authenticated;