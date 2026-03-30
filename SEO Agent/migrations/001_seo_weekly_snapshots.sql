-- SEO Agent Database Schema
-- This migration creates the complete infrastructure for SEO tracking and attribution
-- Run this in Supabase SQL Editor to add SEO agent tables

-- ============================================================================
-- SEO WEEKLY SNAPSHOTS (Phase 1 Data Collection)
-- ============================================================================

-- 1. Weekly SEO snapshots (aggregate metrics by week)
CREATE TABLE IF NOT EXISTS seo_weekly_snapshots (
  id BIGSERIAL PRIMARY KEY,
  snapshot_id TEXT UNIQUE NOT NULL,
  snapshot_date DATE NOT NULL,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,

  -- Ghost CMS metrics
  total_posts INTEGER NOT NULL DEFAULT 0,
  posts_published_this_week INTEGER NOT NULL DEFAULT 0,
  total_words INTEGER NOT NULL DEFAULT 0,

  -- Google Search Console metrics (last 7 days)
  total_keywords_tracked INTEGER DEFAULT 0,
  keywords_ranking_top_10 INTEGER DEFAULT 0,
  keywords_ranking_top_50 INTEGER DEFAULT 0,
  total_impressions INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  average_position DECIMAL(5,2) DEFAULT 0,
  average_ctr DECIMAL(5,2) DEFAULT 0,

  -- Backlink metrics (if using Ahrefs or manual tracking)
  total_backlinks INTEGER DEFAULT 0,
  total_referring_domains INTEGER DEFAULT 0,
  new_backlinks_this_week INTEGER DEFAULT 0,
  lost_backlinks_this_week INTEGER DEFAULT 0,

  -- Competitor analysis
  competitor_new_content_count INTEGER DEFAULT 0,
  competitor_data JSONB,

  -- Seasonal context (using 10-week time lag)
  seasonal_allocations JSONB NOT NULL,
  total_posts_recommended_this_week INTEGER NOT NULL DEFAULT 0,

  -- Full snapshot data (for re-analysis)
  snapshot_data JSONB NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(snapshot_date)
);

CREATE INDEX idx_seo_snapshots_date ON seo_weekly_snapshots(snapshot_date DESC);
CREATE INDEX idx_seo_snapshots_week_start ON seo_weekly_snapshots(week_start_date DESC);

COMMENT ON TABLE seo_weekly_snapshots IS 'Weekly aggregate snapshots of SEO performance for AI analysis (10-week time lag applied)';

-- ============================================================================
-- BLOG POST TRACKING (Individual Post Performance)
-- ============================================================================

-- 2. Weekly blog post snapshots (track each post over time)
CREATE TABLE IF NOT EXISTS seo_weekly_blog_posts (
  id BIGSERIAL PRIMARY KEY,
  snapshot_id TEXT NOT NULL REFERENCES seo_weekly_snapshots(snapshot_id) ON DELETE CASCADE,

  -- Post identification
  post_slug TEXT NOT NULL,
  post_title TEXT NOT NULL,
  post_url TEXT NOT NULL,
  product_slug TEXT,

  -- Post metadata
  word_count INTEGER,
  published_date DATE,
  updated_date DATE,
  days_since_published INTEGER,

  -- Google Search Console metrics (last 7 days)
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  average_position DECIMAL(5,2),
  ctr DECIMAL(5,2),

  -- Top ranking keywords for this post
  top_keywords JSONB,

  -- Internal metrics
  internal_links_count INTEGER DEFAULT 0,
  outbound_links_count INTEGER DEFAULT 0,
  has_product_cta BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(snapshot_id, post_slug)
);

CREATE INDEX idx_seo_blog_posts_snapshot ON seo_weekly_blog_posts(snapshot_id);
CREATE INDEX idx_seo_blog_posts_slug ON seo_weekly_blog_posts(post_slug, snapshot_id);
CREATE INDEX idx_seo_blog_posts_product ON seo_weekly_blog_posts(product_slug, snapshot_id);
CREATE INDEX idx_seo_blog_posts_clicks ON seo_weekly_blog_posts(clicks DESC);

COMMENT ON TABLE seo_weekly_blog_posts IS 'Weekly tracking of individual blog post performance from Google Search Console';

-- ============================================================================
-- KEYWORD RANKING TRACKING
-- ============================================================================

-- 3. Weekly keyword rankings (track position changes over time)
CREATE TABLE IF NOT EXISTS seo_weekly_keywords (
  id BIGSERIAL PRIMARY KEY,
  snapshot_id TEXT NOT NULL REFERENCES seo_weekly_snapshots(snapshot_id) ON DELETE CASCADE,

  -- Keyword details
  keyword TEXT NOT NULL,
  product_slug TEXT,

  -- Rankings
  current_position INTEGER,
  previous_position INTEGER,
  position_change INTEGER,

  -- Google Search Console metrics (last 7 days)
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr DECIMAL(5,2),

  -- Which page ranks for this keyword
  ranking_url TEXT,
  ranking_post_slug TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(snapshot_id, keyword)
);

CREATE INDEX idx_seo_keywords_snapshot ON seo_weekly_keywords(snapshot_id);
CREATE INDEX idx_seo_keywords_keyword ON seo_weekly_keywords(keyword);
CREATE INDEX idx_seo_keywords_product ON seo_weekly_keywords(product_slug, snapshot_id);
CREATE INDEX idx_seo_keywords_position ON seo_weekly_keywords(current_position) WHERE current_position <= 10;
CREATE INDEX idx_seo_keywords_clicks ON seo_weekly_keywords(clicks DESC);

COMMENT ON TABLE seo_weekly_keywords IS 'Weekly keyword ranking tracking from Google Search Console';

-- ============================================================================
-- BACKLINK TRACKING
-- ============================================================================

-- 4. Backlink opportunities (discovered from competitor analysis)
CREATE TABLE IF NOT EXISTS seo_backlink_opportunities (
  id BIGSERIAL PRIMARY KEY,
  snapshot_id TEXT NOT NULL REFERENCES seo_weekly_snapshots(snapshot_id) ON DELETE CASCADE,

  -- Target site details
  target_domain TEXT NOT NULL,
  target_url TEXT NOT NULL,
  target_page_title TEXT,

  -- Metrics
  domain_authority INTEGER,
  estimated_traffic_potential INTEGER,
  competitor_links_count INTEGER DEFAULT 0,

  -- Status
  status TEXT NOT NULL DEFAULT 'discovered', -- 'discovered', 'outreach_sent', 'backlink_acquired', 'rejected', 'ignored'
  priority INTEGER DEFAULT 5, -- 1-10

  -- Outreach tracking
  outreach_email_draft TEXT,
  outreach_sent_at TIMESTAMPTZ,
  outreach_response_at TIMESTAMPTZ,
  backlink_acquired_at TIMESTAMPTZ,

  -- Attribution
  expected_clicks_per_month INTEGER,
  actual_clicks_measured JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_backlink_opps_snapshot ON seo_backlink_opportunities(snapshot_id);
CREATE INDEX idx_backlink_opps_status ON seo_backlink_opportunities(status, created_at DESC);
CREATE INDEX idx_backlink_opps_domain ON seo_backlink_opportunities(target_domain);
CREATE INDEX idx_backlink_opps_priority ON seo_backlink_opportunities(priority DESC, status);

COMMENT ON TABLE seo_backlink_opportunities IS 'Backlink opportunities discovered from competitor analysis and roundup pages';

-- ============================================================================
-- BACKLINK TRACKING (Acquired Backlinks)
-- ============================================================================

-- 5. Acquired backlinks (track backlink profile over time)
CREATE TABLE IF NOT EXISTS seo_acquired_backlinks (
  id BIGSERIAL PRIMARY KEY,
  snapshot_id TEXT NOT NULL REFERENCES seo_weekly_snapshots(snapshot_id) ON DELETE CASCADE,

  -- Backlink details
  source_domain TEXT NOT NULL,
  source_url TEXT NOT NULL,
  target_url TEXT NOT NULL,

  -- Link attributes
  anchor_text TEXT,
  link_type TEXT, -- 'dofollow', 'nofollow'
  domain_authority INTEGER,

  -- Discovery tracking
  first_seen_date DATE,
  last_seen_date DATE,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'lost'

  -- Attribution (if from outreach)
  opportunity_id BIGINT REFERENCES seo_backlink_opportunities(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_acquired_backlinks_snapshot ON seo_acquired_backlinks(snapshot_id);
CREATE INDEX idx_acquired_backlinks_source ON seo_acquired_backlinks(source_domain);
CREATE INDEX idx_acquired_backlinks_status ON seo_acquired_backlinks(status);
CREATE INDEX idx_acquired_backlinks_opportunity ON seo_acquired_backlinks(opportunity_id);

COMMENT ON TABLE seo_acquired_backlinks IS 'Weekly tracking of acquired backlinks (from Ahrefs API or manual tracking)';

-- ============================================================================
-- SEO AGENT ACTIONS (AI Recommendations & Attribution)
-- ============================================================================

-- 6. SEO agent actions (like google_ads_agent_actions but for SEO)
CREATE TABLE IF NOT EXISTS seo_agent_actions (
  id BIGSERIAL PRIMARY KEY,
  action_id TEXT UNIQUE NOT NULL,
  snapshot_id TEXT NOT NULL REFERENCES seo_weekly_snapshots(snapshot_id) ON DELETE CASCADE,

  week_date DATE NOT NULL,
  action_type TEXT NOT NULL, -- 'write_blog', 'update_blog', 'backlink_outreach', 'pause_content', 'stop_writing'
  product_slug TEXT,

  -- Recommendation details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reasoning TEXT NOT NULL,
  expected_impact TEXT,
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100), -- 0-100
  priority INTEGER CHECK (priority >= 1 AND priority <= 10), -- 1-10

  -- Content details (for write_blog/update_blog actions)
  target_keyword TEXT,
  target_word_count INTEGER,
  target_post_slug TEXT,
  content_outline JSONB,

  -- Backlink details (for backlink_outreach actions)
  backlink_opportunity_id BIGINT REFERENCES seo_backlink_opportunities(id),
  outreach_email_draft TEXT,

  -- Metadata
  recommended_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recommended_by TEXT NOT NULL DEFAULT 'claude',

  -- Approval workflow
  requires_approval BOOLEAN NOT NULL DEFAULT true,
  approved BOOLEAN DEFAULT false,
  approved_at TIMESTAMPTZ,
  approved_by TEXT,
  rejected_at TIMESTAMPTZ,
  rejected_by TEXT,
  rejection_reason TEXT,

  -- Execution tracking
  executed BOOLEAN DEFAULT false,
  executed_at TIMESTAMPTZ,
  execution_status TEXT, -- 'pending', 'executed', 'failed'
  execution_error TEXT,

  -- Attribution (measured 10 weeks later)
  measured_impact JSONB,
  attribution_calculated_at TIMESTAMPTZ,
  attribution_verdict TEXT, -- 'success', 'partial_success', 'failed', 'too_early'

  -- Full details
  details JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_seo_actions_snapshot ON seo_agent_actions(snapshot_id);
CREATE INDEX idx_seo_actions_week ON seo_agent_actions(week_date DESC);
CREATE INDEX idx_seo_actions_action_id ON seo_agent_actions(action_id);
CREATE INDEX idx_seo_actions_type ON seo_agent_actions(action_type, created_at DESC);
CREATE INDEX idx_seo_actions_product ON seo_agent_actions(product_slug, week_date DESC);
CREATE INDEX idx_seo_actions_pending_approval ON seo_agent_actions(requires_approval, approved_at, rejected_at)
  WHERE requires_approval = true AND approved_at IS NULL AND rejected_at IS NULL;
CREATE INDEX idx_seo_actions_executed ON seo_agent_actions(executed, execution_status);
CREATE INDEX idx_seo_actions_attribution ON seo_agent_actions(attribution_calculated_at, attribution_verdict);

COMMENT ON TABLE seo_agent_actions IS 'AI recommendations for SEO (blog posts, updates, backlinks) with attribution tracking';
COMMENT ON COLUMN seo_agent_actions.action_id IS 'Unique identifier for tracking recommendations across weeks';
COMMENT ON COLUMN seo_agent_actions.measured_impact IS 'Actual results measured 10 weeks later: {ranking_achieved, clicks_gained, expected_vs_actual}';
COMMENT ON COLUMN seo_agent_actions.attribution_verdict IS 'Success assessment: success (met expectations), partial_success (some results), failed (no ranking), too_early (< 10 weeks)';

-- ============================================================================
-- COMPETITOR TRACKING
-- ============================================================================

-- 7. Competitor content tracking
CREATE TABLE IF NOT EXISTS seo_competitor_content (
  id BIGSERIAL PRIMARY KEY,
  snapshot_id TEXT NOT NULL REFERENCES seo_weekly_snapshots(snapshot_id) ON DELETE CASCADE,

  -- Competitor details
  competitor_domain TEXT NOT NULL,
  competitor_name TEXT,

  -- Content details
  content_url TEXT NOT NULL,
  content_title TEXT,
  content_type TEXT, -- 'blog_post', 'guide', 'video', 'tool'

  -- Discovery
  discovered_date DATE NOT NULL,
  published_date DATE,

  -- Analysis
  estimated_word_count INTEGER,
  target_keywords JSONB,
  content_quality_score INTEGER, -- 1-10 (AI-assessed)

  -- Threat assessment
  is_direct_competitor BOOLEAN DEFAULT false,
  threatens_our_ranking BOOLEAN DEFAULT false,
  affected_keywords TEXT[],

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_competitor_content_snapshot ON seo_competitor_content(snapshot_id);
CREATE INDEX idx_competitor_content_domain ON seo_competitor_content(competitor_domain);
CREATE INDEX idx_competitor_content_discovered ON seo_competitor_content(discovered_date DESC);
CREATE INDEX idx_competitor_content_threat ON seo_competitor_content(threatens_our_ranking)
  WHERE threatens_our_ranking = true;

COMMENT ON TABLE seo_competitor_content IS 'Competitor content tracking for gap analysis and threat detection';

-- ============================================================================
-- HELPFUL VIEWS
-- ============================================================================

-- Current week SEO performance overview
CREATE OR REPLACE VIEW vw_current_week_seo_performance AS
SELECT
  s.week_start_date,
  s.total_posts,
  s.posts_published_this_week,
  s.total_posts_recommended_this_week,
  s.total_keywords_tracked,
  s.keywords_ranking_top_10,
  s.keywords_ranking_top_50,
  s.total_impressions,
  s.total_clicks,
  s.average_position,
  s.average_ctr,
  s.new_backlinks_this_week,
  s.total_referring_domains
FROM seo_weekly_snapshots s
WHERE s.week_start_date = (SELECT MAX(week_start_date) FROM seo_weekly_snapshots)
LIMIT 1;

COMMENT ON VIEW vw_current_week_seo_performance IS 'Current week SEO performance snapshot';

-- Pending SEO approvals (like Google Ads agent)
CREATE OR REPLACE VIEW vw_pending_seo_approvals AS
SELECT
  id,
  action_id,
  action_type,
  product_slug,
  title,
  description,
  reasoning,
  expected_impact,
  confidence,
  priority,
  created_at
FROM seo_agent_actions
WHERE requires_approval = true
  AND approved_at IS NULL
  AND rejected_at IS NULL
ORDER BY priority DESC, created_at ASC;

COMMENT ON VIEW vw_pending_seo_approvals IS 'SEO recommendations pending human approval';

-- Top performing blog posts (last 4 weeks)
CREATE OR REPLACE VIEW vw_top_performing_posts AS
SELECT
  bp.post_slug,
  bp.post_title,
  bp.product_slug,
  bp.published_date,
  bp.days_since_published,
  SUM(bp.impressions) as total_impressions,
  SUM(bp.clicks) as total_clicks,
  AVG(bp.average_position) as avg_position,
  AVG(bp.ctr) as avg_ctr
FROM seo_weekly_blog_posts bp
JOIN seo_weekly_snapshots s ON bp.snapshot_id = s.snapshot_id
WHERE s.week_start_date >= CURRENT_DATE - INTERVAL '28 days'
GROUP BY bp.post_slug, bp.post_title, bp.product_slug, bp.published_date, bp.days_since_published
HAVING SUM(bp.clicks) > 0
ORDER BY total_clicks DESC
LIMIT 20;

COMMENT ON VIEW vw_top_performing_posts IS 'Top 20 blog posts by clicks in last 4 weeks';

-- Keywords with biggest position improvements
CREATE OR REPLACE VIEW vw_keyword_position_improvements AS
SELECT
  k.keyword,
  k.product_slug,
  k.current_position,
  k.previous_position,
  k.position_change,
  k.clicks,
  k.impressions,
  k.ranking_url,
  s.week_start_date
FROM seo_weekly_keywords k
JOIN seo_weekly_snapshots s ON k.snapshot_id = s.snapshot_id
WHERE k.position_change < 0  -- Negative = improvement (e.g., position 20 -> 10 = -10)
  AND k.current_position <= 50
  AND s.week_start_date >= CURRENT_DATE - INTERVAL '28 days'
ORDER BY k.position_change ASC, k.current_position ASC
LIMIT 50;

COMMENT ON VIEW vw_keyword_position_improvements IS 'Keywords with biggest ranking improvements in last 4 weeks';

-- Backlink opportunities ready for outreach
CREATE OR REPLACE VIEW vw_backlink_opportunities_ready AS
SELECT
  bo.id,
  bo.target_domain,
  bo.target_url,
  bo.domain_authority,
  bo.estimated_traffic_potential,
  bo.competitor_links_count,
  bo.priority,
  bo.status,
  bo.created_at
FROM seo_backlink_opportunities bo
WHERE bo.status = 'discovered'
  AND bo.outreach_email_draft IS NOT NULL
ORDER BY bo.priority DESC, bo.domain_authority DESC
LIMIT 20;

COMMENT ON VIEW vw_backlink_opportunities_ready IS 'Top 20 backlink opportunities ready for outreach';

-- Attribution success rate (actions with measured impact)
CREATE OR REPLACE VIEW vw_seo_attribution_success_rate AS
SELECT
  action_type,
  COUNT(*) as total_actions,
  COUNT(*) FILTER (WHERE attribution_verdict = 'success') as successful,
  COUNT(*) FILTER (WHERE attribution_verdict = 'partial_success') as partial_success,
  COUNT(*) FILTER (WHERE attribution_verdict = 'failed') as failed,
  COUNT(*) FILTER (WHERE attribution_verdict = 'too_early') as too_early,
  ROUND(
    COUNT(*) FILTER (WHERE attribution_verdict = 'success')::DECIMAL /
    NULLIF(COUNT(*) FILTER (WHERE attribution_verdict IN ('success', 'partial_success', 'failed')), 0) * 100,
    1
  ) as success_rate_percentage
FROM seo_agent_actions
WHERE attribution_calculated_at IS NOT NULL
GROUP BY action_type
ORDER BY success_rate_percentage DESC;

COMMENT ON VIEW vw_seo_attribution_success_rate IS 'SEO agent success rate by action type (measured 10 weeks after execution)';

-- Week-over-week comparison
CREATE OR REPLACE VIEW vw_seo_week_over_week AS
SELECT
  current.week_start_date as current_week,
  current.total_clicks as current_clicks,
  previous.total_clicks as previous_clicks,
  current.total_clicks - previous.total_clicks as clicks_change,
  ROUND(
    ((current.total_clicks::DECIMAL - previous.total_clicks) / NULLIF(previous.total_clicks, 0) * 100),
    1
  ) as clicks_change_percentage,
  current.keywords_ranking_top_10 as current_top_10,
  previous.keywords_ranking_top_10 as previous_top_10,
  current.keywords_ranking_top_10 - previous.keywords_ranking_top_10 as top_10_change,
  current.average_position as current_avg_position,
  previous.average_position as previous_avg_position,
  current.average_position - previous.average_position as position_change
FROM seo_weekly_snapshots current
LEFT JOIN seo_weekly_snapshots previous
  ON previous.week_start_date = current.week_start_date - INTERVAL '7 days'
ORDER BY current.week_start_date DESC
LIMIT 12;

COMMENT ON VIEW vw_seo_week_over_week IS 'Week-over-week SEO performance comparison (last 12 weeks)';

-- ============================================================================
-- EXAMPLE QUERIES (for documentation)
-- ============================================================================

-- Example 1: Get current week's content allocation
-- SELECT seasonal_allocations FROM seo_weekly_snapshots ORDER BY week_start_date DESC LIMIT 1;

-- Example 2: Check attribution for posts published 10+ weeks ago
-- SELECT * FROM seo_agent_actions
-- WHERE action_type = 'write_blog'
--   AND executed = true
--   AND executed_at < NOW() - INTERVAL '10 weeks'
--   AND attribution_calculated_at IS NULL;

-- Example 3: Find keywords we should write about
-- SELECT keyword, impressions, current_position
-- FROM seo_weekly_keywords
-- WHERE current_position > 10 AND current_position <= 30
--   AND impressions > 100
-- ORDER BY impressions DESC;

-- Example 4: Backlink success rate
-- SELECT
--   COUNT(*) as total_outreach,
--   COUNT(*) FILTER (WHERE status = 'backlink_acquired') as acquired,
--   ROUND(COUNT(*) FILTER (WHERE status = 'backlink_acquired')::DECIMAL / COUNT(*) * 100, 1) as success_rate
-- FROM seo_backlink_opportunities
-- WHERE outreach_sent_at IS NOT NULL;

-- ============================================================================
-- GRANT PERMISSIONS (if using RLS)
-- ============================================================================

-- If you're using Row Level Security, you may need to grant permissions
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
