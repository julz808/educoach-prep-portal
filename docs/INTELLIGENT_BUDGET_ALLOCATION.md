# Intelligent Budget Allocation System

**Status**: ✅ Deployed
**Annual Budget**: $20,000
**Period**: Jan 2026 - Dec 2027 (104 weeks)
**Database**: `weekly_budget_allocation` table in Supabase

## Overview

This system dynamically allocates a $20,000 annual marketing budget across 6 test prep products based on:

1. **Test window timing** (seasonal demand)
2. **Historical sales performance** (actual sales data)
3. **CAC efficiency** (how well each product converts)
4. **Buyer intent timing** (most purchase 2-15 weeks before test)

The result: **Budget flows to high-opportunity products automatically**, maximizing conversions at the right time.

## Key Insight: Opportunity Scoring

Each product gets an opportunity score every week:

```
Opportunity Score = Seasonal Multiplier × Sales Percentage × CAC Efficiency
```

Budget is allocated proportionally to these scores.

### Example Week (2026-02-23)

| Product | Seasonal | Sales % | CAC Eff | Score | Daily Budget |
|---------|----------|---------|---------|-------|--------------|
| ACER    | 1.00     | 32%     | 0.85    | 0.272 | $46.49       |
| EduTest | 1.00     | 22%     | 0.80    | 0.176 | $30.08       |
| VIC     | 0.30     | 28%     | 0.90    | 0.076 | $12.92       |
| Y5 NAPLAN | 1.00   | 12%     | 0.60    | 0.072 | $12.31       |
| Y7 NAPLAN | 1.00   | 4%      | 0.50    | 0.020 | $3.42        |
| NSW     | 0.85     | 2%      | 0.70    | 0.012 | $1.79        |

**Total daily budget**: $107.01/day (high market heat = 0.80)

### Dead Week (2026-08-03)

| Product | Seasonal | Sales % | CAC Eff | Score | Daily Budget |
|---------|----------|---------|---------|-------|--------------|
| ACER    | 0.25     | 32%     | 0.85    | 0.068 | $11.20       |
| EduTest | 0.25     | 22%     | 0.80    | 0.044 | $7.25        |
| VIC     | 0.05     | 28%     | 0.90    | 0.013 | $2.08        |
| Y5 NAPLAN | 0.05   | 12%     | 0.60    | 0.004 | $0.59        |
| Y7 NAPLAN | 0.05   | 4%      | 0.50    | 0.001 | $0.16        |
| NSW     | 0.05     | 2%      | 0.70    | 0.001 | $0.12        |

**Total daily budget**: $21.40/day (low market heat = 0.16)

## Seasonal Multipliers

### Fixed-Date Tests (VIC, NSW, NAPLAN)

Based on weeks until test:

- **26+ weeks out**: 0.05 (too early, minimal interest)
- **20-26 weeks**: 0.15 (very early awareness)
- **15-20 weeks**: 0.30 (early awareness)
- **10-15 weeks**: 0.50 (growing awareness)
- **6-10 weeks**: 0.75 (serious prep begins)
- **2-6 weeks**: 1.00 ⭐ **PEAK** (most parents buying now)
- **0-2 weeks**: 0.70 (imminent, some last-minute)
- **Post-test**: 0.05 (dead zone)

### Rolling Tests (ACER, EduTest)

Monthly patterns:

**ACER**:
- Jan-Mar: 1.00 (Q1 peak)
- December: 0.80 (pre-Q1 ramp)
- Oct-Nov: 0.40 (early awareness)
- Rest of year: 0.25 (baseline)

**EduTest**:
- Jan-Mar: 1.00 (Q1 peak)
- June: 0.90 (mid-year peak)
- May: 0.60 (pre mid-year ramp)
- December: 0.80 (pre-Q1 ramp)
- Oct-Nov: 0.40 (early awareness)
- Rest of year: 0.25 (baseline)

### Registration Deadline Boost

If a registration deadline falls within 7 days, seasonal multiplier gets boosted:

```sql
-- Example: NSW Selective registration deadline Feb 20, 2026
-- Week of Feb 16-22 gets 0.85 multiplier (deadline boost)
```

## Sales Distribution (Actual Data)

Based on 100 sales to date:

| Product | Sales % | Target CAC | Actual CAC | Efficiency |
|---------|---------|------------|------------|------------|
| ACER Scholarship | 32% | $120 | $102 | 0.85 ⭐ |
| VIC Selective | 28% | $120 | $96 | 0.90 ⭐ |
| EduTest Scholarship | 22% | $120 | $108 | 0.80 |
| Year 5 NAPLAN | 12% | $120 | $150 | 0.60 |
| Year 7 NAPLAN | 4% | $120 | $180 | 0.50 |
| NSW Selective | 2% | $120 | $135 | 0.70 |

**Insight**: VIC Selective and ACER have the best CAC efficiency, so they get more budget during their peak seasons.

## Market Heat Calculation

Market heat is the weighted average of all products' seasonal multipliers:

```typescript
marketHeat = Σ (seasonal_multiplier × sales_percentage)
```

Examples:
- **Q1 2026** (Jan-Mar): Heat = 0.67-0.80 (ACER + EduTest + NAPLAN all peak)
- **May 2026**: Heat = 0.40-0.50 (NSW Selective + VIC ramp-up)
- **June 2026**: Heat = 0.55-0.65 (VIC peak + EduTest mid-year)
- **August 2026**: Heat = 0.16 (dead zone, all tests finished)

## Budget Distribution Over Time

### 2026 Budget Allocation

**Total**: $19,999.93 (out of $20,000 target)
**Total heat**: 21.36

**High-spending weeks**:
- Week of Feb 23, 2026: $748/week ($107/day) - ACER + NAPLAN peak
- Week of Feb 16, 2026: $715/week ($102/day) - Multiple peaks

**Low-spending weeks**:
- Week of Aug 3, 2026: $150/week ($21/day) - Post-test dead zone
- Week of Sep 14, 2026: $120/week ($17/day) - All tests finished

### 2027 Budget Allocation

**Total**: $20,000.08
**Total heat**: 21.29

Pattern repeats with same seasonal logic.

## Database Structure

### `weekly_budget_allocation` Table

Contains 104 rows (one per week, Jan 2026 - Dec 2027):

```sql
SELECT
  week_start_date,
  week_number,
  market_heat,
  weekly_budget_aud,
  daily_budget_aud,
  product_allocations
FROM weekly_budget_allocation
WHERE week_start_date >= '2026-01-01'
ORDER BY week_start_date;
```

### `product_allocations` JSONB Structure

Each week contains:

```json
{
  "acer-scholarship": {
    "seasonal_multiplier": 1.00,
    "opportunity_score": 0.272,
    "daily_budget": 46.49,
    "weekly_budget": 325.43,
    "phase": "PEAK"
  },
  "vic-selective": {
    "seasonal_multiplier": 0.30,
    "opportunity_score": 0.076,
    "daily_budget": 12.92,
    "weekly_budget": 90.44,
    "phase": "EARLY_AWARENESS"
  },
  // ... other products
}
```

### Phase Labels

- `PEAK`: seasonal ≥ 0.95 (maximum buying intent)
- `RAMP_UP`: seasonal ≥ 0.70 (strong intent)
- `CONSIDERATION`: seasonal ≥ 0.50 (growing interest)
- `EARLY_AWARENESS`: seasonal ≥ 0.30 (initial research)
- `BASELINE`: seasonal ≥ 0.15 (minimal activity)
- `TOO_EARLY`: seasonal ≥ 0.10 (very low interest)
- `POST_TEST`: seasonal < 0.10 (test finished)

## How Agents Use This

### Google Ads Agent

Reads current week's allocation:

```sql
SELECT product_allocations
FROM weekly_budget_allocation
WHERE week_start_date = DATE_TRUNC('week', CURRENT_DATE);
```

Then:
1. Gets daily budget for each product
2. Adjusts Google Ads campaign budgets
3. Tracks actual spend vs allocated budget
4. Updates `actual_spend_aud` and `actual_conversions`

### SEO Agent (Future)

Uses same calendar to determine content volume:

- High market heat (0.7+) → 3-4 blog posts/week
- Medium heat (0.4-0.7) → 2 posts/week
- Low heat (0.2-0.4) → 1 post/week
- Dead zone (<0.2) → 1 post/2 weeks (maintenance)

**Lead time**: SEO content should be published 3-6 months before PEAK to rank in time.

## Regenerating Budget Calendar

If test dates or sales distribution changes, regenerate:

```bash
# Update test dates in:
# - supabase/migrations/20260326000000_intelligent_budget_allocation.sql
# - scripts/marketing/generate-budget-calendar.ts

# Then regenerate:
tsx scripts/marketing/generate-budget-calendar.ts
```

The script will:
1. Recalculate seasonal multipliers for all 104 weeks
2. Recalculate opportunity scores
3. Redistribute $20k budget proportionally
4. Upsert into `weekly_budget_allocation` table

## Monitoring & Optimization

### Monthly Review

Check actual performance vs allocation:

```sql
SELECT
  product_slug,
  allocated_budget_ytd,
  actual_spend_ytd,
  actual_conversions,
  actual_cac_aud
FROM vw_product_performance_ytd
ORDER BY allocated_budget_ytd DESC;
```

### Update CAC Efficiency

If actual CAC changes significantly:

```sql
UPDATE product_performance_metrics
SET actual_cac_aud = 95.00  -- Updated from Google Ads data
WHERE product_slug = 'vic-selective';

-- CAC efficiency auto-recalculates
-- Then regenerate budget calendar to reflect new priorities
```

## Key Insights from Initial Run

1. **Q1 is critical**: Jan-Mar accounts for ~35% of annual budget due to ACER + EduTest + NAPLAN overlap
2. **Summer is dead**: Jul-Aug only ~8% of budget (post-test recovery period)
3. **VIC gets steady allocation**: June peak is isolated, gets consistent budget May-June
4. **NAPLAN has sharp peak**: High intensity 2-6 weeks before March test, then cliff
5. **Budget is proportional to heat**: $17/day in dead weeks, $107/day in peak weeks

## Next Steps

1. ✅ Database schema created
2. ✅ Migration applied
3. ✅ 104 weeks generated
4. 🔄 Update Google Ads Agent to read from `weekly_budget_allocation`
5. 🔄 Create SEO content calendar using same seasonal data
6. 🔄 Monthly review and CAC efficiency updates

---

**Last Generated**: 2026-03-25
**Generator Script**: `scripts/marketing/generate-budget-calendar.ts`
**Migration**: `supabase/migrations/20260326000000_intelligent_budget_allocation.sql`
