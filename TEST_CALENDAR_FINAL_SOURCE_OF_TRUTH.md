# Test Calendar - Final Source of Truth

**Single source of truth for all marketing agents (Google Ads, SEO, CRO)**

This calendar defines week-by-week buyer intensity for each of the 6 products, informing:
- Google Ads budget allocation
- SEO content volume (how many blogs to write per week)
- CRO focus areas

---

## Research Summary - 2026 Test Dates

### ✅ VIC Selective Entry
- **Primary Test Date**: Saturday, June 20, 2026
- **Applications Open**: March 2, 2026
- **Applications Close**: April 24, 2026
- **Results Released**: August 2026
- **Entry**: Year 9 in 2027

**Key Insight**: Clear 4-month window from application open (March) → test (June) → results (Aug)

### ✅ NSW Selective Entry
- **Primary Test Date**: Friday, May 1 & Saturday, May 2, 2026 (computer-based)
- **Make-up Test**: Friday, May 22, 2026
- **Applications Open**: November 6, 2025
- **Applications Close**: February 20, 2026
- **Results Released**: Late August 2026
- **Entry**: Year 7 in 2027

**Key Insight**: Applications open BEFORE current school year ends. Peak interest: Nov 2025 → May 2026

### ✅ NAPLAN (Year 5 & 7)
- **Test Window**: March 11-23, 2026 (9-day window)
- **Writing Test**: Wednesday, March 11, 2026 (must be first day)
- **Entry**: Current Year 3 (for Year 5 NAPLAN), Current Year 5 (for Year 7 NAPLAN)

**Key Insight**: Fixed national date, all schools in same window. Peak interest: Jan-Mar

### ✅ ACER Scholarship
- **South Australia Test**: Saturday, February 7, 2026
- **All Other States**: Saturday, February 28, 2026
- **Applications Open**: September 22, 2025
- **Applications Close**: February 8, 2026
- **Entry**: 2027

**Key Insight**: Heavy Q1 concentration (Feb/Mar tests) BUT applications open in Q4 previous year (Sept). Some Victorian schools use "alternative date program" = tests scattered throughout year

### ✅ EduTest Scholarship
- **Test Dates**: Varies by school (no single national date)
- **Example**: Haileybury - June 20, 2026 (applications close March 13, 2026)
- **Peak Period**: Q1 (Feb-March) and mid-year (June)
- **Entry**: 2027

**Key Insight**: Most concentrated in Q1 and June. Schools set own dates within EduTest framework.

---

## Current vs Proposed Calendar Structure

###  Current Structure (from migration file)

```sql
CREATE TABLE test_calendar (
  product_slug TEXT,
  test_date_primary DATE,
  test_date_secondary DATE,

  -- Monthly intensity multipliers (1.0 = baseline, 5.0 = peak)
  intensity_jan DECIMAL(3,1),
  intensity_feb DECIMAL(3,1),
  intensity_mar DECIMAL(3,1),
  -- ... through Dec

  -- Budget config
  base_daily_budget_aud DECIMAL(10,2),
  min_daily_budget_aud DECIMAL(10,2),
  max_daily_budget_aud DECIMAL(10,2),
  target_cpa_aud DECIMAL(10,2),
  pause_cpa_aud DECIMAL(10,2)
);
```

**Problems:**
1. ❌ Monthly granularity too coarse (need weekly for content calendar)
2. ❌ Doesn't capture registration/application windows
3. ❌ Intensity multipliers unclear (what does 4.0 mean?)
4. ❌ Doesn't explain WHY certain months are higher

### ✅ Proposed Structure (Week-by-Week)

```sql
CREATE TABLE test_calendar_weekly (
  id BIGSERIAL PRIMARY KEY,
  product_slug TEXT NOT NULL,
  week_start_date DATE NOT NULL, -- Monday of each week
  week_number INTEGER NOT NULL, -- 1-52

  -- Buyer intent (0.0 = none, 1.0 = peak)
  buyer_intensity DECIMAL(3,2) NOT NULL,

  -- What's happening this week
  phase_name TEXT NOT NULL,
  -- Phases:
  -- 'TOO_EARLY' = 26+ weeks before test (no demand)
  -- 'EARLY_AWARENESS' = 20-26 weeks before test (some demand)
  -- 'CONSIDERATION' = 12-20 weeks before (growing demand)
  -- 'PEAK_PREP' = 6-12 weeks before (maximum demand)
  -- 'FINAL_PUSH' = 2-6 weeks before (intense demand)
  -- 'IMMINENT' = 0-2 weeks before (urgent demand)
  -- 'POST_TEST' = After test (no demand)

  phase_description TEXT,
  -- e.g., "Applications open", "2 weeks to test", "Registration deadline"

  -- Recommended marketing actions
  google_ads_budget_multiplier DECIMAL(3,2), -- 0.0-1.0
  seo_posts_per_week INTEGER, -- 0-4
  cro_focus_area TEXT, -- 'product_page', 'checkout', 'landing_page'

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(product_slug, week_start_date)
);
```

**Benefits:**
✅ Week-by-week granularity (perfect for Monday agents)
✅ Clear phase names (easier to understand)
✅ Explicit marketing actions (budget multiplier, content volume)
✅ Phase descriptions explain context

---

## Proposed Buyer Intensity Profiles (Week-by-Week)

### 📅 VIC Selective Entry (Test: June 20, 2026)

| Week Starting | Phase | Buyer Intensity | Why | Google Ads Budget | SEO Posts/Week |
|---------------|-------|----------------|-----|-------------------|----------------|
| Jan 6, 2026 | TOO_EARLY | 0.10 | 24 weeks to test | 10% | 0-1 |
| Feb 3, 2026 | EARLY_AWARENESS | 0.25 | 20 weeks to test | 25% | 1 |
| Mar 2, 2026 | **APPLICATIONS OPEN** | 0.50 | Applications open! | 50% | 2 |
| Mar 9, 2026 | CONSIDERATION | 0.60 | Applications open, 15 weeks to test | 60% | 2-3 |
| Apr 7, 2026 | CONSIDERATION | 0.70 | 10 weeks to test | 70% | 3 |
| Apr 21, 2026 | **REGISTRATION DEADLINE** | 0.75 | Last week to apply | 75% | 3 |
| May 5, 2026 | PEAK_PREP | 1.00 | 6 weeks to test, ramping up | 100% | 4 |
| May 12, 2026 | PEAK_PREP | 1.00 | 5 weeks to test | 100% | 4 |
| Jun 2, 2026 | FINAL_PUSH | 0.90 | 2 weeks to test | 90% | 3 |
| Jun 9, 2026 | IMMINENT | 0.70 | 1 week to test | 70% | 2 |
| Jun 16, 2026 | **TEST WEEK** | 0.30 | Test day Sat June 20 | 30% | 1 |
| Jun 23, 2026 | POST_TEST | 0.05 | Test finished | 5% | 0 |
| Aug 3, 2026 | RESULTS_WEEK | 0.10 | Results released (interest for next year) | 10% | 0-1 |

**Key Buyer Intent Windows:**
- **Peak 1**: March 2-April 24 (Applications open → deadline) = 0.50-0.75
- **Peak 2**: May 5-June 2 (6 weeks before test) = 1.00
- **Cliff**: June 20+ (test finished) = 0.05

### 📅 NSW Selective Entry (Test: May 1-2, 2026)

| Week Starting | Phase | Buyer Intensity | Why | Google Ads Budget | SEO Posts/Week |
|---------------|-------|----------------|-----|-------------------|----------------|
| Nov 4, 2025 | **APPLICATIONS OPEN** | 0.40 | Applications open (early birds) | 40% | 2 |
| Nov 11, 2025 | EARLY_AWARENESS | 0.45 | 25 weeks to test | 45% | 2 |
| Dec 2, 2025 | EARLY_AWARENESS | 0.40 | Holiday slowdown | 40% | 1 |
| Jan 6, 2026 | CONSIDERATION | 0.60 | 17 weeks to test, back from holidays | 60% | 2 |
| Feb 3, 2026 | CONSIDERATION | 0.75 | 13 weeks to test | 75% | 3 |
| Feb 16, 2026 | **REGISTRATION DEADLINE** | 0.80 | Last 4 days to apply | 80% | 3 |
| Feb 23, 2026 | PEAK_PREP | 1.00 | 10 weeks to test | 100% | 4 |
| Mar 9, 2026 | PEAK_PREP | 1.00 | 7 weeks to test | 100% | 4 |
| Apr 7, 2026 | FINAL_PUSH | 0.95 | 3 weeks to test | 95% | 3 |
| Apr 21, 2026 | IMMINENT | 0.75 | 10 days to test | 75% | 2 |
| Apr 28, 2026 | **TEST WEEK** | 0.40 | Test Fri May 1 & Sat May 2 | 40% | 1 |
| May 5, 2026 | POST_TEST | 0.05 | Test finished | 5% | 0 |

**Key Buyer Intent Windows:**
- **Early Peak**: Nov 4, 2025-Dec (Applications open) = 0.40-0.45
- **Peak**: Feb 23-Apr 7 (10 weeks before test) = 1.00
- **Cliff**: May 2+ (test finished) = 0.05

### 📅 NAPLAN Year 5 & 7 (Test: March 11-23, 2026)

| Week Starting | Phase | Buyer Intensity | Why | Google Ads Budget | SEO Posts/Week |
|---------------|-------|----------------|-----|-------------------|----------------|
| Sep 2, 2025 | TOO_EARLY | 0.05 | 27 weeks to test | 5% | 0 |
| Oct 7, 2025 | TOO_EARLY | 0.10 | 22 weeks to test | 10% | 0-1 |
| Nov 4, 2025 | EARLY_AWARENESS | 0.20 | 18 weeks to test | 20% | 1 |
| Dec 2, 2025 | EARLY_AWARENESS | 0.15 | Holiday slowdown | 15% | 1 |
| Jan 6, 2026 | CONSIDERATION | 0.60 | 10 weeks to test, back from holidays | 60% | 2 |
| Jan 27, 2026 | PEAK_PREP | 0.90 | 6 weeks to test | 90% | 3 |
| Feb 10, 2026 | PEAK_PREP | 1.00 | 4 weeks to test | 100% | 4 |
| Feb 24, 2026 | FINAL_PUSH | 1.00 | 2 weeks to test | 100% | 4 |
| Mar 9, 2026 | **TEST WEEK** | 0.50 | Test March 11-23 | 50% | 1 |
| Mar 24, 2026 | POST_TEST | 0.05 | Test finished | 5% | 0 |

**Key Buyer Intent Windows:**
- **Ramp**: Jan 6-Jan 27 (10-6 weeks before) = 0.60-0.90
- **Peak**: Feb 10-Mar 9 (4 weeks before test) = 1.00
- **Cliff**: March 23+ (test finished) = 0.05
- **Dead Zone**: Sep-Nov (>20 weeks before test) = 0.05-0.20

### 📅 ACER Scholarship (Test: Feb 7 SA, Feb 28 Other States)

| Week Starting | Phase | Buyer Intensity | Why | Google Ads Budget | SEO Posts/Week |
|---------------|-------|----------------|-----|-------------------|----------------|
| Sep 16, 2025 | **APPLICATIONS OPEN** | 0.50 | Applications open | 50% | 2 |
| Sep 23, 2025 | EARLY_AWARENESS | 0.55 | 22 weeks to test (SA), some early prep | 55% | 2 |
| Oct 7, 2025 | CONSIDERATION | 0.60 | 18 weeks to test | 60% | 2 |
| Nov 4, 2025 | CONSIDERATION | 0.70 | 14 weeks to test | 70% | 3 |
| Dec 2, 2025 | CONSIDERATION | 0.60 | Holiday slowdown | 60% | 2 |
| Jan 6, 2026 | PEAK_PREP | 0.90 | 5-8 weeks to tests | 90% | 3 |
| Jan 20, 2026 | PEAK_PREP | 1.00 | 3-6 weeks to tests | 100% | 4 |
| Feb 3, 2026 | **PEAK (SA TEST)** | 1.00 | SA test Feb 7 | 100% | 4 |
| Feb 10, 2026 | **REGISTRATION DEADLINE** | 1.00 | Closes Feb 8, Other states test Feb 28 | 100% | 4 |
| Feb 24, 2026 | FINAL_PUSH | 0.80 | Other states test in 4 days | 80% | 3 |
| Mar 2, 2026 | POST_TEST | 0.10 | Most tests finished | 10% | 0-1 |
| Apr 7, 2026 | BASELINE | 0.15 | Alternative date schools (scattered) | 15% | 1 |

**Key Buyer Intent Windows:**
- **Applications**: Sep 16-Oct 7 (Applications open) = 0.50-0.60
- **Peak**: Jan 20-Feb 24 (6 weeks before tests) = 1.00
- **Cliff**: March 1+ (main tests finished) = 0.10
- **Long Tail**: Apr-Aug (alternative date schools) = 0.15-0.25

**Note**: Victorian schools often use alternative dates, so maintain baseline 0.15-0.25 year-round

### 📅 EduTest Scholarship (Test: Scattered, Peak Q1 & June)

| Week Starting | Phase | Buyer Intensity | Why | Google Ads Budget | SEO Posts/Week |
|---------------|-------|----------------|-----|-------------------|----------------|
| Sep 2, 2025 | EARLY_AWARENESS | 0.30 | Some schools opening applications | 30% | 1 |
| Oct 7, 2025 | CONSIDERATION | 0.40 | 20-30 weeks to various tests | 40% | 2 |
| Nov 4, 2025 | CONSIDERATION | 0.45 | Growing interest | 45% | 2 |
| Dec 2, 2025 | CONSIDERATION | 0.35 | Holiday slowdown | 35% | 1 |
| Jan 6, 2026 | PEAK_PREP | 0.80 | Q1 tests approaching (most common) | 80% | 3 |
| Feb 3, 2026 | PEAK_PREP | 1.00 | Q1 test window | 100% | 4 |
| Feb 24, 2026 | PEAK_PREP | 1.00 | Q1 test window | 100% | 4 |
| Mar 9, 2026 | **PEAK (MOST Q1 TESTS)** | 1.00 | Many schools test in March | 100% | 4 |
| Mar 24, 2026 | BASELINE | 0.40 | Some Q1 tests finished | 40% | 2 |
| Apr 7, 2026 | BASELINE | 0.35 | Between Q1 and mid-year tests | 35% | 1-2 |
| May 5, 2026 | RAMP_UP (MID-YEAR) | 0.60 | Mid-year tests approaching | 60% | 2 |
| Jun 2, 2026 | **PEAK (MID-YEAR)** | 0.90 | Mid-year test window (e.g., Haileybury June 20) | 90% | 3 |
| Jun 23, 2026 | BASELINE | 0.30 | Mid-year tests finished | 30% | 1 |
| Aug 4, 2026 | BASELINE | 0.25 | Scattered tests year-round | 25% | 1 |

**Key Buyer Intent Windows:**
- **Peak 1 (Q1)**: Feb 3-Mar 9 (most schools test) = 1.00
- **Peak 2 (Mid-year)**: Jun 2-Jun 16 (some schools test) = 0.90
- **Baseline**: Year-round scattered tests = 0.25-0.40
- **Cliff**: Very brief (tests are scattered, not synchronized)

**Note**: Most unpredictable calendar. Maintain higher baseline year-round (0.25-0.40) due to scattered school dates.

---

## Recommended Implementation

### Option A: Keep Monthly Table, Add Weekly View

**Pros**: Less database work, backward compatible
**Cons**: Still coarse granularity

```sql
-- Keep existing test_calendar table

-- Add a function to calculate weekly intensity
CREATE OR REPLACE FUNCTION get_weekly_intensity(
  p_product_slug TEXT,
  p_week_start_date DATE
) RETURNS TABLE (
  buyer_intensity DECIMAL(3,2),
  phase_name TEXT,
  phase_description TEXT,
  google_ads_budget_multiplier DECIMAL(3,2),
  seo_posts_per_week INTEGER
) AS $$
DECLARE
  v_test_date DATE;
  v_weeks_until_test INTEGER;
  v_month INTEGER;
  v_monthly_intensity DECIMAL(3,1);
BEGIN
  -- Get test date and monthly intensity
  SELECT
    test_date_primary,
    EXTRACT(MONTH FROM p_week_start_date)::INTEGER
  INTO v_test_date, v_month
  FROM test_calendar
  WHERE product_slug = p_product_slug;

  -- Calculate weeks until test
  v_weeks_until_test := FLOOR((v_test_date - p_week_start_date) / 7);

  -- Get monthly intensity
  v_monthly_intensity := CASE v_month
    WHEN 1 THEN (SELECT intensity_jan FROM test_calendar WHERE product_slug = p_product_slug)
    WHEN 2 THEN (SELECT intensity_feb FROM test_calendar WHERE product_slug = p_product_slug)
    -- ... etc
  END;

  -- Calculate weekly values based on weeks until test
  -- (Logic from profiles above)

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;
```

### ⭐ Option B: Create New Weekly Table (RECOMMENDED)

**Pros**: Precise, explicit, easy to understand
**Cons**: More upfront work to populate 52 weeks × 6 products = 312 rows

```sql
-- New table structure
CREATE TABLE test_calendar_weekly (
  id BIGSERIAL PRIMARY KEY,
  product_slug TEXT NOT NULL,
  week_start_date DATE NOT NULL,
  week_number INTEGER NOT NULL,

  buyer_intensity DECIMAL(3,2) NOT NULL,
  phase_name TEXT NOT NULL,
  phase_description TEXT,

  google_ads_budget_multiplier DECIMAL(3,2) NOT NULL,
  seo_posts_per_week INTEGER NOT NULL,
  cro_focus_area TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(product_slug, week_start_date)
);

CREATE INDEX idx_test_calendar_weekly_product ON test_calendar_weekly(product_slug, week_start_date);
CREATE INDEX idx_test_calendar_weekly_date ON test_calendar_weekly(week_start_date);

-- Sample data for VIC Selective (first 4 weeks of 2026)
INSERT INTO test_calendar_weekly (
  product_slug, week_start_date, week_number,
  buyer_intensity, phase_name, phase_description,
  google_ads_budget_multiplier, seo_posts_per_week, cro_focus_area
) VALUES
  ('vic-selective', '2026-01-05', 1, 0.10, 'TOO_EARLY', '24 weeks until test', 0.10, 0, 'none'),
  ('vic-selective', '2026-01-12', 2, 0.10, 'TOO_EARLY', '23 weeks until test', 0.10, 0, 'none'),
  ('vic-selective', '2026-01-19', 3, 0.15, 'TOO_EARLY', '22 weeks until test', 0.15, 1, 'none'),
  ('vic-selective', '2026-01-26', 4, 0.20, 'EARLY_AWARENESS', '21 weeks until test', 0.20, 1, 'product_page');

-- (Continue for all 52 weeks × 6 products = 312 rows)
```

---

## What This Enables

### For Google Ads Agent
```typescript
// Every Monday, get current week's budget multiplier
const thisWeek = await db.query(`
  SELECT google_ads_budget_multiplier, phase_name
  FROM test_calendar_weekly
  WHERE product_slug = 'vic-selective'
    AND week_start_date = '2026-03-02'
`);

// thisWeek.google_ads_budget_multiplier = 0.50 (50% of max budget)
// thisWeek.phase_name = 'APPLICATIONS_OPEN'

const recommendedBudget =
  baseMaxBudget * thisWeek.google_ads_budget_multiplier;
// $50 * 0.50 = $25/day
```

### For SEO Agent
```typescript
// Every Monday, get this week's content volume
const thisWeek = await db.query(`
  SELECT seo_posts_per_week, phase_name
  FROM test_calendar_weekly
  WHERE week_start_date = '2026-03-02'
`);

// Loop through each product
for (const product of products) {
  const weekPlan = await db.query(`
    SELECT seo_posts_per_week
    FROM test_calendar_weekly
    WHERE product_slug = $1 AND week_start_date = $2
  `, [product.slug, thisMonday]);

  // vic-selective: 2 posts
  // nsw-selective: 4 posts (peak for them)
  // year-5-naplan: 4 posts (peak for them)
  // Total: 10 posts this week
}
```

### For CRO Agent
```typescript
// Monthly check: which products need CRO focus?
const currentMonth = await db.query(`
  SELECT DISTINCT product_slug, cro_focus_area
  FROM test_calendar_weekly
  WHERE week_start_date >= '2026-03-01'
    AND week_start_date < '2026-04-01'
    AND buyer_intensity > 0.70
`);

// Focus on: vic-selective (applications open),
//           nsw-selective (peak prep),
//           naplan (final push)
```

---

## Summary & Recommendation

**My Understanding:**
You want ONE definitive calendar that shows week-by-week buyer intensity for each product, which will drive:
1. Google Ads budget allocation
2. SEO content volume (posts/week)
3. CRO priorities

**Current State:**
✅ Monthly intensity table exists in Supabase
❌ Too coarse (need weekly)
❌ Multipliers unclear
❌ Missing context (registration windows, etc.)

**My Recommendation:**

**✅ Create `test_calendar_weekly` table** (Option B)
- 52 weeks × 6 products = 312 rows
- Columns: `buyer_intensity` (0.0-1.0), `phase_name`, `google_ads_budget_multiplier`, `seo_posts_per_week`
- Stored in Supabase
- Updated annually (or when test dates change)

**Output Format:**
```
Week of March 2, 2026:

VIC Selective:
  • Buyer Intensity: 0.50 (Applications open!)
  • Phase: APPLICATIONS_OPEN
  • Google Ads Budget: 50% of max ($25/day)
  • SEO Posts: 2/week

NSW Selective:
  • Buyer Intensity: 1.00 (Peak prep - 8 weeks to test)
  • Phase: PEAK_PREP
  • Google Ads Budget: 100% of max ($50/day)
  • SEO Posts: 4/week

Year 5 NAPLAN:
  • Buyer Intensity: 1.00 (Final push - test in 9 days!)
  • Phase: IMMINENT
  • Google Ads Budget: 100% of max ($35/day)
  • SEO Posts: 4/week

Total Google Ads: $110/day
Total SEO Posts: 10/week
```

**Storage Location:**
- Supabase table: `test_calendar_weekly`
- Documentation: This file (`TEST_CALENDAR_FINAL_SOURCE_OF_TRUTH.md`)
- Both Google Ads Agent and SEO Agent query the same table

**Next Steps:**
1. Create migration file for `test_calendar_weekly` table
2. Populate all 312 rows (52 weeks × 6 products) with data from profiles above
3. Update Google Ads Agent to read from this table
4. Update SEO Agent to read from this table
5. Set annual calendar review (update when 2027 test dates announced)

**Questions for You:**
1. Do you want me to create the full 52-week calendar now (312 rows)?
2. Should I keep the existing monthly `test_calendar` table or migrate completely to weekly?
3. Any adjustments to the buyer intensity profiles above?
