-- Intelligent Budget Allocation System
-- Dynamically allocates $20k annual budget across 6 products based on:
-- 1. Test window timing (seasonal demand)
-- 2. Historical sales performance
-- 3. CAC efficiency
-- 4. Registration deadlines

-- ============================================================================
-- MARKETING BUDGET ENVELOPE
-- ============================================================================

-- Annual budget cap
CREATE TABLE IF NOT EXISTS marketing_budget_envelope (
  id BIGSERIAL PRIMARY KEY,
  year INTEGER NOT NULL UNIQUE,
  annual_budget_aud DECIMAL(10,2) NOT NULL,
  annual_spend_aud DECIMAL(10,2) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Set $20k annual budget for 2026-2027
INSERT INTO marketing_budget_envelope (year, annual_budget_aud)
VALUES
  (2026, 20000.00),
  (2027, 20000.00)
ON CONFLICT (year) DO NOTHING;

-- ============================================================================
-- PRODUCT PERFORMANCE METRICS
-- ============================================================================

-- Historical performance data (updated monthly by agents)
CREATE TABLE IF NOT EXISTS product_performance_metrics (
  id BIGSERIAL PRIMARY KEY,
  product_slug TEXT NOT NULL UNIQUE,
  product_name TEXT NOT NULL,

  -- Sales distribution (from actual sales data)
  sales_percentage DECIMAL(5,4) NOT NULL, -- 0.3200 = 32%

  -- CAC performance
  target_cac_aud DECIMAL(10,2) NOT NULL DEFAULT 120.00,
  actual_cac_aud DECIMAL(10,2), -- Updated monthly from Google Ads
  cac_efficiency DECIMAL(3,2) GENERATED ALWAYS AS (
    CASE
      WHEN actual_cac_aud > 0
      THEN LEAST(target_cac_aud / actual_cac_aud, 1.00)
      ELSE 0.50
    END
  ) STORED, -- 1.00 = hitting target, 0.50 = 2x over target

  -- Budget constraints
  max_daily_budget_aud DECIMAL(10,2) NOT NULL,
  min_daily_budget_aud DECIMAL(10,2) NOT NULL DEFAULT 1.00,

  -- Test dates (for seasonal calculation)
  test_date_primary DATE NOT NULL,
  test_date_secondary DATE,
  registration_deadline DATE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed with actual sales distribution and test dates
INSERT INTO product_performance_metrics (
  product_slug,
  product_name,
  sales_percentage,
  target_cac_aud,
  actual_cac_aud,
  max_daily_budget_aud,
  min_daily_budget_aud,
  test_date_primary,
  test_date_secondary,
  registration_deadline
) VALUES
  -- ACER: 32% of sales, Q1 peak
  ('acer-scholarship', 'ACER Scholarship', 0.3200, 120.00, 102.00, 60.00, 3.00, '2026-02-28', NULL, '2026-02-08'),

  -- VIC Selective: 28% of sales, June test
  ('vic-selective', 'VIC Selective Entry', 0.2800, 120.00, 96.00, 50.00, 3.00, '2026-06-20', NULL, '2026-04-24'),

  -- EduTest: 22% of sales, Q1 + mid-year peaks
  ('edutest-scholarship', 'EduTest Scholarship', 0.2200, 120.00, 108.00, 50.00, 3.00, '2026-03-15', '2026-06-20', '2026-03-01'),

  -- Year 5 NAPLAN: 12% of sales, March test
  ('year-5-naplan', 'Year 5 NAPLAN', 0.1200, 120.00, 150.00, 25.00, 1.00, '2026-03-17', NULL, NULL),

  -- Year 7 NAPLAN: 4% of sales, March test
  ('year-7-naplan', 'Year 7 NAPLAN', 0.0400, 120.00, 180.00, 15.00, 1.00, '2026-03-17', NULL, NULL),

  -- NSW Selective: 2% of sales, May test
  ('nsw-selective', 'NSW Selective Entry', 0.0200, 120.00, 135.00, 20.00, 1.00, '2026-05-01', NULL, '2026-02-20')
ON CONFLICT (product_slug) DO UPDATE SET
  sales_percentage = EXCLUDED.sales_percentage,
  actual_cac_aud = EXCLUDED.actual_cac_aud,
  test_date_primary = EXCLUDED.test_date_primary,
  registration_deadline = EXCLUDED.registration_deadline,
  updated_at = NOW();

-- ============================================================================
-- WEEKLY BUDGET ALLOCATION
-- ============================================================================

-- Pre-calculated weekly budgets (104 weeks: Jan 2026 - Dec 2027)
CREATE TABLE IF NOT EXISTS weekly_budget_allocation (
  id BIGSERIAL PRIMARY KEY,
  week_start_date DATE NOT NULL UNIQUE,
  week_number INTEGER NOT NULL, -- 1-104
  year INTEGER NOT NULL,

  -- Overall market demand
  market_heat DECIMAL(3,2) NOT NULL, -- 0.00-1.00 (weighted avg of all products)
  weekly_budget_aud DECIMAL(10,2) NOT NULL, -- Calculated from annual budget
  daily_budget_aud DECIMAL(10,2) GENERATED ALWAYS AS (weekly_budget_aud / 7) STORED,

  -- Product allocations (calculated from opportunity scores)
  product_allocations JSONB NOT NULL,
  -- Structure:
  -- {
  --   "acer-scholarship": {
  --     "seasonal_multiplier": 1.00,
  --     "opportunity_score": 0.272,
  --     "daily_budget": 30.50,
  --     "phase": "PEAK"
  --   },
  --   ...
  -- }

  -- Actual spend tracking (filled by Google Ads agent)
  actual_spend_aud DECIMAL(10,2),
  actual_conversions INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_weekly_budget_date ON weekly_budget_allocation(week_start_date DESC);
CREATE INDEX idx_weekly_budget_year ON weekly_budget_allocation(year, week_number);

-- ============================================================================
-- SEASONAL MULTIPLIER CALCULATION FUNCTION
-- ============================================================================

-- Calculate seasonal multiplier based on weeks until test
CREATE OR REPLACE FUNCTION calculate_seasonal_multiplier(
  p_product_slug TEXT,
  p_current_date DATE
) RETURNS DECIMAL(3,2) AS $$
DECLARE
  v_test_date DATE;
  v_test_date_secondary DATE;
  v_registration_deadline DATE;
  v_weeks_until_test DECIMAL(5,2);
  v_weeks_until_secondary DECIMAL(5,2);
  v_days_until_deadline INTEGER;
  v_multiplier DECIMAL(3,2);
  v_current_month INTEGER;
BEGIN
  -- Get product test dates
  SELECT
    test_date_primary,
    test_date_secondary,
    registration_deadline
  INTO v_test_date, v_test_date_secondary, v_registration_deadline
  FROM product_performance_metrics
  WHERE product_slug = p_product_slug;

  -- Calculate weeks until primary test
  v_weeks_until_test := (v_test_date - p_current_date)::DECIMAL / 7;

  -- Special handling for ACER/EduTest (rolling tests with Q1 + mid-year peaks)
  IF p_product_slug IN ('acer-scholarship', 'edutest-scholarship') THEN
    v_current_month := EXTRACT(MONTH FROM p_current_date);

    -- Q1 peak (Jan-Mar)
    IF v_current_month >= 1 AND v_current_month <= 3 THEN
      RETURN 1.00;
    -- December (pre-Q1 ramp)
    ELSIF v_current_month = 12 THEN
      RETURN 0.80;
    -- Mid-year peak (June) - EduTest only
    ELSIF v_current_month = 6 AND p_product_slug = 'edutest-scholarship' THEN
      RETURN 0.90;
    -- May (pre mid-year ramp)
    ELSIF v_current_month = 5 AND p_product_slug = 'edutest-scholarship' THEN
      RETURN 0.60;
    -- October-November (early awareness for Q1)
    ELSIF v_current_month >= 10 AND v_current_month <= 11 THEN
      RETURN 0.40;
    -- Baseline rest of year
    ELSE
      RETURN 0.25;
    END IF;
  END IF;

  -- Registration deadline boost (if within 7 days)
  IF v_registration_deadline IS NOT NULL THEN
    v_days_until_deadline := v_registration_deadline - p_current_date;
    IF v_days_until_deadline >= 0 AND v_days_until_deadline <= 7 THEN
      -- Boost by 20% during deadline week
      v_multiplier := LEAST(1.00, 0.20);
    END IF;
  END IF;

  -- Standard seasonal curve for fixed-date tests (VIC, NSW, NAPLAN)
  IF v_weeks_until_test < 0 THEN
    -- Test finished
    RETURN 0.05;
  ELSIF v_weeks_until_test <= 2 THEN
    -- 0-2 weeks: Imminent (some last-minute, but many feel too late)
    RETURN GREATEST(0.70, COALESCE(v_multiplier, 0));
  ELSIF v_weeks_until_test <= 6 THEN
    -- 2-6 weeks: PEAK (most parents buying now)
    RETURN GREATEST(1.00, COALESCE(v_multiplier, 0));
  ELSIF v_weeks_until_test <= 10 THEN
    -- 6-10 weeks: Serious prep begins
    RETURN GREATEST(0.75, COALESCE(v_multiplier, 0));
  ELSIF v_weeks_until_test <= 15 THEN
    -- 10-15 weeks: Growing awareness
    RETURN GREATEST(0.50, COALESCE(v_multiplier, 0));
  ELSIF v_weeks_until_test <= 20 THEN
    -- 15-20 weeks: Early awareness
    RETURN GREATEST(0.30, COALESCE(v_multiplier, 0));
  ELSIF v_weeks_until_test <= 26 THEN
    -- 20-26 weeks: Very early
    RETURN 0.15;
  ELSE
    -- 26+ weeks: Too early
    RETURN 0.05;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- OPPORTUNITY SCORE CALCULATION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_opportunity_score(
  p_product_slug TEXT,
  p_current_date DATE
) RETURNS DECIMAL(5,4) AS $$
DECLARE
  v_seasonal DECIMAL(3,2);
  v_sales_pct DECIMAL(5,4);
  v_cac_efficiency DECIMAL(3,2);
  v_score DECIMAL(5,4);
BEGIN
  -- Get seasonal multiplier
  v_seasonal := calculate_seasonal_multiplier(p_product_slug, p_current_date);

  -- Get sales percentage and CAC efficiency
  SELECT sales_percentage, cac_efficiency
  INTO v_sales_pct, v_cac_efficiency
  FROM product_performance_metrics
  WHERE product_slug = p_product_slug;

  -- Calculate opportunity score
  v_score := v_seasonal * v_sales_pct * v_cac_efficiency;

  RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS FOR EASY QUERYING
-- ============================================================================

-- Current week budget allocation
CREATE OR REPLACE VIEW vw_current_week_budget AS
SELECT
  wba.*,
  (
    SELECT json_object_agg(
      key,
      value || jsonb_build_object(
        'actual_spend', COALESCE(
          (SELECT SUM(cost_aud)
           FROM google_ads_campaign_performance
           WHERE product_slug = key
             AND date >= wba.week_start_date
             AND date < wba.week_start_date + INTERVAL '7 days'
          ),
          0
        )
      )
    )
    FROM jsonb_each(wba.product_allocations)
  ) as product_allocations_with_actuals
FROM weekly_budget_allocation wba
WHERE week_start_date = DATE_TRUNC('week', CURRENT_DATE)::DATE;

-- Monthly budget summary
CREATE OR REPLACE VIEW vw_monthly_budget_summary AS
SELECT
  DATE_TRUNC('month', week_start_date)::DATE as month_start,
  year,
  SUM(weekly_budget_aud) as monthly_budget_aud,
  AVG(market_heat) as avg_market_heat,
  SUM(actual_spend_aud) as actual_spend_aud,
  SUM(actual_conversions) as total_conversions,
  CASE
    WHEN SUM(actual_spend_aud) > 0
    THEN SUM(actual_spend_aud) / NULLIF(SUM(actual_conversions), 0)
    ELSE NULL
  END as actual_cac_aud
FROM weekly_budget_allocation
GROUP BY DATE_TRUNC('month', week_start_date)::DATE, year
ORDER BY month_start;

-- Product performance comparison
CREATE OR REPLACE VIEW vw_product_performance_ytd AS
SELECT
  ppm.product_slug,
  ppm.product_name,
  ppm.sales_percentage,
  ppm.target_cac_aud,
  ppm.actual_cac_aud,
  ppm.cac_efficiency,
  SUM(
    (wba.product_allocations->ppm.product_slug->>'daily_budget')::DECIMAL * 7
  ) as allocated_budget_ytd,
  COUNT(*) as weeks_active
FROM product_performance_metrics ppm
LEFT JOIN weekly_budget_allocation wba ON wba.year = EXTRACT(YEAR FROM CURRENT_DATE)
WHERE wba.week_start_date <= CURRENT_DATE
GROUP BY ppm.product_slug, ppm.product_name, ppm.sales_percentage,
         ppm.target_cac_aud, ppm.actual_cac_aud, ppm.cac_efficiency
ORDER BY allocated_budget_ytd DESC;

-- ============================================================================
-- HELPER COMMENTS
-- ============================================================================

COMMENT ON TABLE marketing_budget_envelope IS 'Annual marketing budget cap ($20k/year). Agent checks this before allocating weekly budgets.';
COMMENT ON TABLE product_performance_metrics IS 'Sales distribution and CAC efficiency per product. Updated monthly from actual performance.';
COMMENT ON TABLE weekly_budget_allocation IS 'Pre-calculated weekly budget allocations for 104 weeks (2026-2027). Generated by script based on seasonal demand.';
COMMENT ON FUNCTION calculate_seasonal_multiplier IS 'Returns 0.00-1.00 multiplier based on weeks until test. Accounts for buyer intent timing (peak at 2-6 weeks before test).';
COMMENT ON FUNCTION calculate_opportunity_score IS 'Returns opportunity score = seasonal × sales_pct × cac_efficiency. Higher score = more budget allocated.';
