-- Weekly Google Ads Snapshots Schema
-- Run this in Supabase SQL Editor to add weekly tracking tables

-- 1. Weekly campaign snapshots (aggregate metrics by week)
CREATE TABLE IF NOT EXISTS google_ads_weekly_snapshots (
  id BIGSERIAL PRIMARY KEY,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  campaign_id TEXT NOT NULL,
  campaign_name TEXT,
  product_slug TEXT,

  -- Aggregate metrics for the week
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  cost_micros BIGINT DEFAULT 0,
  conversions NUMERIC(10,2) DEFAULT 0,
  conversion_value_micros BIGINT DEFAULT 0,

  -- Calculated metrics
  cac_aud NUMERIC(10,2),
  ctr NUMERIC(5,2),
  conversion_rate NUMERIC(5,2),

  -- Campaign settings at end of week
  daily_budget_aud NUMERIC(10,2),
  campaign_status TEXT,
  bidding_strategy TEXT,

  -- Seasonal context
  test_date DATE,
  weeks_until_test INTEGER,
  seasonal_phase TEXT,
  recommended_budget_aud NUMERIC(10,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(week_start_date, campaign_id)
);

-- 2. Weekly keyword snapshots
CREATE TABLE IF NOT EXISTS google_ads_weekly_keywords (
  id BIGSERIAL PRIMARY KEY,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  campaign_id TEXT NOT NULL,
  campaign_name TEXT,
  ad_group_id TEXT,
  ad_group_name TEXT,
  keyword_text TEXT NOT NULL,
  match_type TEXT,

  -- Aggregate performance for the week
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  cost_micros BIGINT DEFAULT 0,
  conversions NUMERIC(10,2) DEFAULT 0,

  -- Calculated metrics
  cac_aud NUMERIC(10,2),
  ctr NUMERIC(5,2),

  -- Bid at end of week
  cpc_bid_micros BIGINT,
  cpc_bid_aud NUMERIC(10,2),

  -- Status
  keyword_status TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(week_start_date, campaign_id, keyword_text, match_type)
);

-- 3. Weekly ad copy snapshots
CREATE TABLE IF NOT EXISTS google_ads_weekly_ad_copy (
  id BIGSERIAL PRIMARY KEY,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  campaign_id TEXT NOT NULL,
  campaign_name TEXT,
  ad_group_id TEXT,
  ad_id TEXT NOT NULL,

  -- Ad content
  headlines JSONB,
  descriptions JSONB,
  final_url TEXT,

  -- Aggregate performance for the week
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions NUMERIC(10,2) DEFAULT 0,

  -- Calculated metrics
  ctr NUMERIC(5,2),
  conversion_rate NUMERIC(5,2),

  -- Status
  ad_status TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(week_start_date, ad_id)
);

-- 4. Update google_ads_agent_actions to include detailed tracking
ALTER TABLE google_ads_agent_actions
  ADD COLUMN IF NOT EXISTS action_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS week_date DATE,
  ADD COLUMN IF NOT EXISTS measured_impact JSONB,
  ADD COLUMN IF NOT EXISTS attribution_calculated_at TIMESTAMPTZ;

-- Add comment for action_id
COMMENT ON COLUMN google_ads_agent_actions.action_id IS 'Unique identifier for tracking recommendations across weeks';
COMMENT ON COLUMN google_ads_agent_actions.week_date IS 'Which week this recommendation is for';
COMMENT ON COLUMN google_ads_agent_actions.measured_impact IS 'Actual results measured next week: {conversions_change, cac_change, accuracy, verdict}';

-- 5. Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_weekly_snapshots_date
  ON google_ads_weekly_snapshots(week_start_date);
CREATE INDEX IF NOT EXISTS idx_weekly_snapshots_campaign
  ON google_ads_weekly_snapshots(campaign_id);
CREATE INDEX IF NOT EXISTS idx_weekly_snapshots_product
  ON google_ads_weekly_snapshots(product_slug);

CREATE INDEX IF NOT EXISTS idx_weekly_keywords_date
  ON google_ads_weekly_keywords(week_start_date);
CREATE INDEX IF NOT EXISTS idx_weekly_keywords_campaign
  ON google_ads_weekly_keywords(campaign_id);
CREATE INDEX IF NOT EXISTS idx_weekly_keywords_text
  ON google_ads_weekly_keywords(keyword_text);

CREATE INDEX IF NOT EXISTS idx_weekly_ad_copy_date
  ON google_ads_weekly_ad_copy(week_start_date);
CREATE INDEX IF NOT EXISTS idx_weekly_ad_copy_campaign
  ON google_ads_weekly_ad_copy(campaign_id);

CREATE INDEX IF NOT EXISTS idx_agent_actions_week
  ON google_ads_agent_actions(week_date);
CREATE INDEX IF NOT EXISTS idx_agent_actions_action_id
  ON google_ads_agent_actions(action_id);

-- 6. Add comments for documentation
COMMENT ON TABLE google_ads_weekly_snapshots IS 'Weekly aggregate snapshots of campaign performance for AI analysis';
COMMENT ON TABLE google_ads_weekly_keywords IS 'Weekly aggregate snapshots of keyword performance for AI analysis';
COMMENT ON TABLE google_ads_weekly_ad_copy IS 'Weekly aggregate snapshots of ad copy performance for AI analysis';

-- 7. Create view for easy querying
CREATE OR REPLACE VIEW google_ads_weekly_performance AS
SELECT
  s.week_start_date,
  s.campaign_name,
  s.product_slug,
  s.impressions,
  s.clicks,
  s.cost_micros / 1000000 as cost_aud,
  s.conversions,
  s.cac_aud,
  s.ctr,
  s.daily_budget_aud,
  s.campaign_status,
  s.seasonal_phase,
  s.weeks_until_test,
  s.recommended_budget_aud,
  -- Calculate budget variance
  s.recommended_budget_aud - s.daily_budget_aud as budget_variance_aud,
  -- Calculate if action needed
  CASE
    WHEN s.campaign_status = 'ENABLED' AND s.seasonal_phase = 'POST_TEST' THEN 'PAUSE_NEEDED'
    WHEN s.campaign_status = 'PAUSED' AND s.seasonal_phase IN ('RAMP_UP', 'PEAK') THEN 'UNPAUSE_NEEDED'
    WHEN ABS(s.recommended_budget_aud - s.daily_budget_aud) > 5 THEN 'BUDGET_ADJUSTMENT_NEEDED'
    ELSE 'OK'
  END as action_status
FROM google_ads_weekly_snapshots s
ORDER BY s.week_start_date DESC, s.campaign_name;

COMMENT ON VIEW google_ads_weekly_performance IS 'Convenient view showing weekly performance with action recommendations';
