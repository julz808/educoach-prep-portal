-- Marketing Agents Database Schema
-- This migration creates the complete infrastructure for both Google Ads Agent and CRO Agent

-- ============================================================================
-- GOOGLE ADS AGENT TABLES
-- ============================================================================

-- Campaign performance tracking (daily snapshots)
CREATE TABLE IF NOT EXISTS google_ads_campaign_performance (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  campaign_id TEXT NOT NULL,
  campaign_name TEXT NOT NULL,
  product_slug TEXT NOT NULL,

  -- Raw metrics from Google Ads API
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  cost_micros BIGINT NOT NULL DEFAULT 0,
  conversions DECIMAL(10,2) NOT NULL DEFAULT 0,
  conversion_value_micros BIGINT NOT NULL DEFAULT 0,

  -- Calculated metrics (stored for performance)
  cost_aud DECIMAL(10,2) GENERATED ALWAYS AS (cost_micros::DECIMAL / 1000000) STORED,
  ctr_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN impressions > 0
    THEN (clicks::DECIMAL / impressions * 100)
    ELSE 0 END
  ) STORED,
  cpa_aud DECIMAL(10,2) GENERATED ALWAYS AS (
    CASE WHEN conversions > 0
    THEN (cost_micros::DECIMAL / 1000000 / conversions)
    ELSE NULL END
  ) STORED,
  conversion_rate_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN clicks > 0
    THEN (conversions / clicks * 100)
    ELSE 0 END
  ) STORED,
  roas DECIMAL(10,2) GENERATED ALWAYS AS (
    CASE WHEN cost_micros > 0
    THEN (conversion_value_micros::DECIMAL / cost_micros)
    ELSE NULL END
  ) STORED,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(date, campaign_id)
);

CREATE INDEX idx_campaign_perf_date ON google_ads_campaign_performance(date DESC);
CREATE INDEX idx_campaign_perf_product ON google_ads_campaign_performance(product_slug, date DESC);
CREATE INDEX idx_campaign_perf_campaign ON google_ads_campaign_performance(campaign_id, date DESC);

-- Agent actions log (all changes made by the agent)
CREATE TABLE IF NOT EXISTS google_ads_agent_actions (
  id BIGSERIAL PRIMARY KEY,
  action_type TEXT NOT NULL, -- 'budget_change', 'bidding_strategy_change', 'pause_campaign', 'add_negative_keywords'
  campaign_id TEXT,
  product_slug TEXT,

  -- Action details (JSON for flexibility)
  details JSONB NOT NULL,

  -- Approval workflow
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  approved_at TIMESTAMPTZ,
  approved_by TEXT,
  rejected_at TIMESTAMPTZ,
  rejected_by TEXT,
  rejection_reason TEXT,

  -- Execution tracking
  executed_at TIMESTAMPTZ,
  execution_status TEXT, -- 'pending', 'executed', 'failed', 'rolled_back'
  execution_error TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_actions_type ON google_ads_agent_actions(action_type, created_at DESC);
CREATE INDEX idx_agent_actions_status ON google_ads_agent_actions(execution_status, created_at DESC);
CREATE INDEX idx_agent_actions_pending_approval ON google_ads_agent_actions(requires_approval, approved_at, rejected_at)
  WHERE requires_approval = true AND approved_at IS NULL AND rejected_at IS NULL;

-- Search terms analysis (for negative keyword mining)
CREATE TABLE IF NOT EXISTS google_ads_search_terms (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  campaign_id TEXT NOT NULL,
  product_slug TEXT NOT NULL,
  search_term TEXT NOT NULL,

  -- Metrics
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  cost_micros BIGINT NOT NULL DEFAULT 0,
  conversions DECIMAL(10,2) NOT NULL DEFAULT 0,

  -- Analysis flags
  flagged_as_negative BOOLEAN NOT NULL DEFAULT false,
  flagged_reason TEXT,
  added_as_negative_at TIMESTAMPTZ,

  -- High performer flag
  is_high_performer BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(date, campaign_id, search_term)
);

CREATE INDEX idx_search_terms_date ON google_ads_search_terms(date DESC);
CREATE INDEX idx_search_terms_flagged ON google_ads_search_terms(flagged_as_negative, added_as_negative_at)
  WHERE flagged_as_negative = true AND added_as_negative_at IS NULL;
CREATE INDEX idx_search_terms_high_performers ON google_ads_search_terms(is_high_performer, date DESC)
  WHERE is_high_performer = true;

-- Test calendar (seasonality data for budget optimization)
CREATE TABLE IF NOT EXISTS test_calendar (
  id BIGSERIAL PRIMARY KEY,
  product_slug TEXT NOT NULL UNIQUE,
  product_name TEXT NOT NULL,

  -- Test dates
  test_date_primary DATE NOT NULL,
  test_date_secondary DATE, -- Some tests have multiple dates

  -- Monthly intensity multipliers (1.0 = normal, higher = more demand)
  intensity_jan DECIMAL(3,1) NOT NULL DEFAULT 1.0,
  intensity_feb DECIMAL(3,1) NOT NULL DEFAULT 1.0,
  intensity_mar DECIMAL(3,1) NOT NULL DEFAULT 1.0,
  intensity_apr DECIMAL(3,1) NOT NULL DEFAULT 1.0,
  intensity_may DECIMAL(3,1) NOT NULL DEFAULT 1.0,
  intensity_jun DECIMAL(3,1) NOT NULL DEFAULT 1.0,
  intensity_jul DECIMAL(3,1) NOT NULL DEFAULT 1.0,
  intensity_aug DECIMAL(3,1) NOT NULL DEFAULT 1.0,
  intensity_sep DECIMAL(3,1) NOT NULL DEFAULT 1.0,
  intensity_oct DECIMAL(3,1) NOT NULL DEFAULT 1.0,
  intensity_nov DECIMAL(3,1) NOT NULL DEFAULT 1.0,
  intensity_dec DECIMAL(3,1) NOT NULL DEFAULT 1.0,

  -- Budget configuration
  base_daily_budget_aud DECIMAL(10,2) NOT NULL,
  min_daily_budget_aud DECIMAL(10,2) NOT NULL DEFAULT 5.00,
  max_daily_budget_aud DECIMAL(10,2) NOT NULL DEFAULT 50.00,

  -- CPA thresholds
  target_cpa_aud DECIMAL(10,2) NOT NULL,
  pause_cpa_aud DECIMAL(10,2) NOT NULL, -- Pause campaign if CPA exceeds this

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Weekly execution summary
CREATE TABLE IF NOT EXISTS google_ads_weekly_summary (
  id BIGSERIAL PRIMARY KEY,
  week_start_date DATE NOT NULL,
  execution_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Overall results
  total_budget_changes INTEGER NOT NULL DEFAULT 0,
  total_bidding_changes INTEGER NOT NULL DEFAULT 0,
  total_negative_keywords_flagged INTEGER NOT NULL DEFAULT 0,
  total_campaigns_paused INTEGER NOT NULL DEFAULT 0,

  -- Performance summary (JSON)
  performance_summary JSONB NOT NULL,

  -- Execution details
  dry_run BOOLEAN NOT NULL DEFAULT false,
  execution_duration_seconds INTEGER,
  errors JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_weekly_summary_date ON google_ads_weekly_summary(week_start_date DESC);

-- ============================================================================
-- CRO AGENT TABLES
-- ============================================================================

-- Landing page performance (from GA4 + Stripe)
CREATE TABLE IF NOT EXISTS cro_landing_page_performance (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  product_slug TEXT NOT NULL,
  landing_page_url TEXT NOT NULL,

  -- GA4 metrics
  sessions INTEGER NOT NULL DEFAULT 0,
  users INTEGER NOT NULL DEFAULT 0,
  pageviews INTEGER NOT NULL DEFAULT 0,
  avg_session_duration_seconds DECIMAL(10,2) NOT NULL DEFAULT 0,
  bounce_rate_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,

  -- Stripe metrics
  checkouts_started INTEGER NOT NULL DEFAULT 0,
  purchases_completed INTEGER NOT NULL DEFAULT 0,
  revenue_aud DECIMAL(10,2) NOT NULL DEFAULT 0,

  -- Calculated metrics
  conversion_rate_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN sessions > 0
    THEN (purchases_completed::DECIMAL / sessions * 100)
    ELSE 0 END
  ) STORED,
  revenue_per_session DECIMAL(10,2) GENERATED ALWAYS AS (
    CASE WHEN sessions > 0
    THEN (revenue_aud / sessions)
    ELSE 0 END
  ) STORED,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(date, product_slug, landing_page_url)
);

CREATE INDEX idx_landing_page_perf_date ON cro_landing_page_performance(date DESC);
CREATE INDEX idx_landing_page_perf_product ON cro_landing_page_performance(product_slug, date DESC);

-- A/B tests management
CREATE TABLE IF NOT EXISTS cro_ab_tests (
  id BIGSERIAL PRIMARY KEY,
  test_name TEXT NOT NULL,
  product_slug TEXT NOT NULL,

  -- Test setup
  variant_a_url TEXT NOT NULL,
  variant_b_url TEXT NOT NULL,
  hypothesis TEXT NOT NULL,
  success_metric TEXT NOT NULL, -- 'conversion_rate', 'revenue_per_session', etc.

  -- Test status
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'running', 'completed', 'cancelled'
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,

  -- Results (populated when test ends)
  winner TEXT, -- 'variant_a', 'variant_b', 'no_difference'
  confidence_level DECIMAL(5,2), -- e.g., 95.00
  results_summary JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ab_tests_status ON cro_ab_tests(status, created_at DESC);
CREATE INDEX idx_ab_tests_product ON cro_ab_tests(product_slug, status);

-- CRO agent actions (similar to Google Ads agent actions)
CREATE TABLE IF NOT EXISTS cro_agent_actions (
  id BIGSERIAL PRIMARY KEY,
  action_type TEXT NOT NULL, -- 'alert_low_conversion_rate', 'recommend_ab_test', 'flag_poor_performer'
  product_slug TEXT,
  landing_page_url TEXT,

  details JSONB NOT NULL,

  -- Resolution tracking
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  resolution_notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cro_actions_type ON cro_agent_actions(action_type, created_at DESC);
CREATE INDEX idx_cro_actions_unresolved ON cro_agent_actions(resolved_at) WHERE resolved_at IS NULL;

-- CRO monthly summary
CREATE TABLE IF NOT EXISTS cro_monthly_summary (
  id BIGSERIAL PRIMARY KEY,
  month_start_date DATE NOT NULL,
  execution_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  overall_conversion_rate DECIMAL(5,2),
  conversion_rate_change_percentage DECIMAL(5,2),
  total_alerts_triggered INTEGER NOT NULL DEFAULT 0,
  total_ab_tests_recommended INTEGER NOT NULL DEFAULT 0,

  performance_summary JSONB NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cro_summary_date ON cro_monthly_summary(month_start_date DESC);

-- ============================================================================
-- AGENT COORDINATION
-- ============================================================================

-- Events for inter-agent communication
CREATE TABLE IF NOT EXISTS agent_coordination_events (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL, -- 'conversion_rate_drop', 'cpa_spike', 'budget_exhausted', etc.
  source_agent TEXT NOT NULL, -- 'google_ads', 'cro'
  target_agent TEXT, -- NULL means broadcast to all agents

  product_slug TEXT,
  event_data JSONB NOT NULL,

  -- Processing tracking
  processed_at TIMESTAMPTZ,
  processed_by TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_coordination_events_type ON agent_coordination_events(event_type, created_at DESC);
CREATE INDEX idx_coordination_events_unprocessed ON agent_coordination_events(processed_at) WHERE processed_at IS NULL;

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert verified test calendar data for 2026
INSERT INTO test_calendar (
  product_slug,
  product_name,
  test_date_primary,
  test_date_secondary,
  intensity_jan,
  intensity_feb,
  intensity_mar,
  intensity_apr,
  intensity_may,
  intensity_jun,
  intensity_jul,
  intensity_aug,
  intensity_sep,
  intensity_oct,
  intensity_nov,
  intensity_dec,
  base_daily_budget_aud,
  min_daily_budget_aud,
  max_daily_budget_aud,
  target_cpa_aud,
  pause_cpa_aud
) VALUES
  (
    'acer-scholarship',
    'ACER Scholarship',
    '2026-02-28',
    NULL,
    5.0, 5.0, 3.0, 3.0, 2.0, 2.0, 1.0, 1.0, 3.0, 4.0, 4.0, 4.0,
    20.00, 10.00, 40.00, 120.00, 150.00
  ),
  (
    'edutest-scholarship',
    'EduTest Scholarship',
    '2026-02-15',
    '2026-06-30',
    5.0, 5.0, 4.0, 4.0, 4.0, 4.0, 2.0, 2.0, 3.0, 4.0, 4.0, 4.0,
    20.00, 10.00, 40.00, 120.00, 150.00
  ),
  (
    'vic-selective',
    'VIC Selective Entry',
    '2026-06-20',
    '2026-05-15',
    3.0, 3.0, 4.0, 4.0, 5.0, 5.0, 2.0, 2.0, 2.0, 3.0, 3.0, 3.0,
    25.00, 15.00, 50.00, 120.00, 150.00
  ),
  (
    'nsw-selective',
    'NSW Selective Entry',
    '2026-05-01',
    '2026-05-03',
    3.0, 3.0, 4.0, 5.0, 5.0, 3.0, 2.0, 2.0, 2.0, 3.0, 3.0, 3.0,
    25.00, 15.00, 50.00, 120.00, 150.00
  ),
  (
    'year-5-naplan',
    'Year 5 NAPLAN',
    '2026-03-11',
    '2026-03-23',
    4.0, 5.0, 5.0, 2.0, 2.0, 2.0, 1.0, 1.0, 2.0, 3.0, 3.0, 4.0,
    15.00, 8.00, 35.00, 150.00, 180.00
  ),
  (
    'year-7-naplan',
    'Year 7 NAPLAN',
    '2026-03-11',
    '2026-03-23',
    4.0, 5.0, 5.0, 2.0, 2.0, 2.0, 1.0, 1.0, 2.0, 3.0, 3.0, 4.0,
    15.00, 8.00, 35.00, 150.00, 180.00
  )
ON CONFLICT (product_slug) DO NOTHING;

-- ============================================================================
-- HELPFUL VIEWS
-- ============================================================================

-- Current week performance overview
CREATE OR REPLACE VIEW vw_current_week_performance AS
SELECT
  product_slug,
  COUNT(DISTINCT date) as days_tracked,
  SUM(impressions) as total_impressions,
  SUM(clicks) as total_clicks,
  SUM(cost_aud) as total_cost_aud,
  SUM(conversions) as total_conversions,
  AVG(ctr_percentage) as avg_ctr,
  AVG(cpa_aud) as avg_cpa_aud,
  AVG(conversion_rate_percentage) as avg_conversion_rate
FROM google_ads_campaign_performance
WHERE date >= DATE_TRUNC('week', CURRENT_DATE)
GROUP BY product_slug;

-- Pending approvals
CREATE OR REPLACE VIEW vw_pending_approvals AS
SELECT
  id,
  action_type,
  campaign_id,
  product_slug,
  details,
  created_at
FROM google_ads_agent_actions
WHERE requires_approval = true
  AND approved_at IS NULL
  AND rejected_at IS NULL
ORDER BY created_at ASC;

-- Search term opportunities (high performers not yet added as keywords)
CREATE OR REPLACE VIEW vw_search_term_opportunities AS
SELECT
  product_slug,
  search_term,
  SUM(clicks) as total_clicks,
  SUM(conversions) as total_conversions,
  AVG((conversions / NULLIF(clicks, 0)) * 100) as conversion_rate_percentage,
  SUM(cost_micros::DECIMAL / 1000000) as total_cost_aud
FROM google_ads_search_terms
WHERE is_high_performer = true
  AND date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY product_slug, search_term
HAVING SUM(clicks) >= 10 AND SUM(conversions) >= 2
ORDER BY total_conversions DESC;

COMMENT ON TABLE google_ads_campaign_performance IS 'Daily campaign performance snapshots from Google Ads API';
COMMENT ON TABLE google_ads_agent_actions IS 'Audit log of all actions taken by the Google Ads agent';
COMMENT ON TABLE google_ads_search_terms IS 'Search term analysis for negative keyword mining and opportunity discovery';
COMMENT ON TABLE test_calendar IS 'Seasonality data for intelligent budget optimization';
COMMENT ON TABLE cro_landing_page_performance IS 'Landing page metrics from GA4 and Stripe for CRO analysis';
COMMENT ON TABLE cro_ab_tests IS 'A/B test management and results tracking';
COMMENT ON TABLE agent_coordination_events IS 'Communication channel between Google Ads and CRO agents';
