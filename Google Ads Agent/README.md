# Google Ads AI Agent - Complete Documentation

**Automated Google Ads optimization powered by Claude AI with seasonal intelligence**

---

## Table of Contents

1. [What This Does](#what-this-does)
2. [How It Works](#how-it-works)
3. [File Structure](#file-structure)
4. [Setup Instructions](#setup-instructions)
5. [Weekly Workflow](#weekly-workflow)
6. [The 11 Hard Rules](#the-11-hard-rules)
7. [Test Calendar Management](#test-calendar-management)
8. [Troubleshooting](#troubleshooting)
9. [Database Schema](#database-schema)

---

## What This Does

An AI-powered Google Ads agent that runs automatically every Monday at 6 AM AEST to:

✅ **Collect weekly snapshots** of campaign performance, keywords, and ad copy
✅ **Analyze performance** using Claude AI with 11 hard safety rules
✅ **Generate recommendations** for budget changes, keyword adjustments, and ad copy improvements
✅ **Send to Telegram** with detailed reasoning and expected impact
✅ **Track everything** in Supabase for week-over-week attribution

**Key Difference from Other Automation:**
- **Two-phase architecture**: Deterministic data collection (Phase 1) + AI analysis (Phase 2)
- **11 hard rules**: Budget limits enforced programmatically, not just "guidelines" for AI
- **Seasonal intelligence**: Test calendar controls when campaigns should run based on test dates
- **Attribution tracking**: Every recommendation is tracked and results measured next week

---

## How It Works

### Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│       GitHub Actions (Every Monday 6 AM AEST)       │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│  PHASE 1: Data Collection (collect-weekly-snapshots) │
│  ├─ Fetch campaign performance from Google Ads API  │
│  ├─ Fetch keywords & ad copy                        │
│  ├─ Calculate seasonal phase from test calendar     │
│  └─ Save to Supabase (weekly_snapshots tables)      │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│  PHASE 2: AI Analysis (analyze-with-ai)             │
│  ├─ Load last week's snapshot from Supabase         │
│  ├─ Send to Claude with 11 hard rules               │
│  ├─ Claude generates recommendations                │
│  └─ Send to Telegram for human approval             │
└─────────────────────────────────────────────────────┘
```

### Two-Phase Architecture

**Why two phases?**

1. **Deterministic data collection** - Phase 1 collects raw data without AI interpretation
2. **AI analysis** - Phase 2 can be re-run multiple times on same data snapshot
3. **Cost efficiency** - Only Phase 2 uses Claude API (can retry without re-fetching Google Ads data)
4. **Attribution** - Each week's snapshot is frozen in time for accurate week-over-week comparison

**Example workflow:**

```bash
# Monday 6:00 AM - Phase 1 runs automatically
$ collect-weekly-snapshots.ts
  ✓ Collected data for 6 campaigns
  ✓ Saved to google_ads_weekly_snapshots (snapshot_id: abc123)
  ✓ Saved 1,247 keywords to google_ads_weekly_keywords
  ✓ Saved 43 ad variations to google_ads_weekly_ad_copy

# Monday 6:05 AM - Phase 2 runs automatically
$ analyze-with-ai.ts
  ✓ Loaded snapshot abc123
  ✓ Sent to Claude API
  ✓ Generated 3 recommendations
  ✓ Sent to Telegram

# If AI analysis needs tweaking, can re-run Phase 2 ONLY:
$ tsx scripts/analyze-with-ai.ts --snapshot-id abc123
  # Uses same snapshot, new AI analysis
```

---

## File Structure

```
Google Ads Agent/
├── README.md                          # This file
├── scripts/
│   ├── collect-weekly-snapshots.ts    # Phase 1: Data collection
│   ├── analyze-with-ai.ts             # Phase 2: AI analysis
│   ├── index-weekly.ts                # Orchestrator (runs both phases)
│   ├── google-ads-client.ts           # Google Ads API wrapper
│   ├── data-validator.ts              # Data quality validation
│   ├── rules-engine.ts                # 11 hard rules enforcement
│   ├── snapshot-exporter.ts           # JSON backup generator
│   ├── telegram-notifier.ts           # Telegram integration
│   └── get-test-calendar.ts           # View test dates helper
└── migrations/
    └── 001_weekly_snapshots.sql       # Database schema
```

### Key Files Explained

**collect-weekly-snapshots.ts** (Phase 1)
- Fetches data from Google Ads API
- Maps campaigns to products using `CAMPAIGN_PRODUCT_MAP`
- Calculates seasonal phase from test calendar
- Saves everything to `google_ads_weekly_snapshots` table
- Run weekly via GitHub Actions (or manually for testing)

**analyze-with-ai.ts** (Phase 2)
- Loads most recent snapshot from Supabase
- Sends to Claude API with 11 hard rules
- Validates recommendations against rules
- Sends to Telegram for human approval
- Run automatically after Phase 1 (or manually for testing)

**index-weekly.ts** (Orchestrator)
- Runs Phase 1, then Phase 2 sequentially
- This is what GitHub Actions calls every Monday

**google-ads-client.ts** (API Wrapper)
- `getCampaigns()` - Fetch all campaigns
- `getCampaignMetrics()` - Performance data
- `getKeywords()` - Top keywords
- `getAdCopy()` - Top ads
- Uses `google-ads-api` npm package (v23.0.0)

**rules-engine.ts** (Safety First)
- Enforces 11 hard rules BEFORE sending to Claude
- Validates Claude's recommendations AFTER
- If Claude breaks rules, recommendation is blocked
- See [The 11 Hard Rules](#the-11-hard-rules) section

---

## Setup Instructions

### 1. Prerequisites

You need:
- **Google Ads API credentials** (Developer Token, OAuth2 Client ID/Secret, Refresh Token, Customer ID)
- **Supabase database** (see [Database Schema](#database-schema))
- **Anthropic API key** (for Claude)
- **Telegram bot token** (for notifications)

### 2. Environment Variables

Create `.env` file:

```bash
# Google Ads API
GOOGLE_ADS_CLIENT_ID=your_client_id
GOOGLE_ADS_CLIENT_SECRET=your_client_secret
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token
GOOGLE_ADS_REFRESH_TOKEN=your_refresh_token
GOOGLE_ADS_CUSTOMER_ID=1234567890

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Anthropic
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

### 3. Database Setup

Run the migration:

```bash
psql -h your-supabase-host -U postgres -d postgres -f "Google Ads Agent/migrations/001_weekly_snapshots.sql"
```

Or manually create tables using SQL in `migrations/001_weekly_snapshots.sql`.

### 4. Campaign Product Mapping

**IMPORTANT**: Update the campaign mapping in `scripts/collect-weekly-snapshots.ts`:

```typescript
// Line 28-35
const CAMPAIGN_PRODUCT_MAP = new Map<string, string>([
  ['22929687344', 'vic-selective-entry'],    // ← Your campaign IDs
  ['22971222193', 'nsw-selective'],
  ['22971231259', 'acer-scholarship'],
  ['22973507747', 'edutest-scholarship'],
  ['22960959318', 'year-5-naplan'],
  ['22967300355', 'year-7-naplan'],
]);
```

**How to find your campaign IDs:**

```bash
# Run data collection once to see campaign IDs
tsx "Google Ads Agent/scripts/collect-weekly-snapshots.ts"

# Look for output like:
# Campaign: VIC Selective Entry (ID: 22929687344)
# Campaign: NSW Selective (ID: 22971222193)
```

Then update the mapping above with your actual campaign IDs.

### 5. Test Calendar Setup

Populate `test_calendar` table in Supabase:

```sql
INSERT INTO test_calendar (
  product_slug,
  product_name,
  test_date_primary,
  min_daily_budget_aud,
  max_daily_budget_aud,
  target_cpa_aud,
  pause_cpa_aud
) VALUES
  ('vic-selective-entry', 'VIC Selective Entry', '2026-06-20', 10, 50, 35, 50),
  ('nsw-selective', 'NSW Selective', '2026-05-01', 10, 50, 35, 50),
  ('year-5-naplan', 'NAPLAN Year 5', '2027-03-09', 5, 30, 35, 50),
  ('year-7-naplan', 'NAPLAN Year 7', '2027-03-09', 5, 30, 35, 50),
  ('edutest-scholarship', 'EduTest Scholarship', '2027-02-01', 10, 50, 35, 50),
  ('acer-scholarship', 'ACER Scholarship', '2027-02-01', 10, 50, 35, 50);
```

**Important fields:**
- `product_slug` - Must match keys in `CAMPAIGN_PRODUCT_MAP`
- `test_date_primary` - Main test date (for seasonal calculations)
- `min_daily_budget_aud` - Minimum budget ($10 recommended)
- `max_daily_budget_aud` - Maximum budget ($50 recommended)
- `target_cpa_aud` - Target cost per acquisition ($35 recommended)
- `pause_cpa_aud` - Pause if CAC exceeds this ($50 recommended)

### 6. Test Locally

```bash
# Install dependencies
npm install

# Test Phase 1 (data collection)
tsx "Google Ads Agent/scripts/collect-weekly-snapshots.ts"

# Check what was saved
tsx "Google Ads Agent/scripts/get-test-calendar.ts"

# Test Phase 2 (AI analysis) - requires Phase 1 to have run first
tsx "Google Ads Agent/scripts/analyze-with-ai.ts"

# Or run both phases together
tsx "Google Ads Agent/scripts/index-weekly.ts"
```

### 7. Deploy to Production

GitHub Actions automatically runs every Monday 6 AM AEST:

```yaml
# .github/workflows/google-ads-weekly-agent.yml
name: Google Ads Weekly Agent
on:
  schedule:
    - cron: '0 20 * * 0'  # Sunday 8 PM UTC = Monday 6 AM AEST
  workflow_dispatch:      # Manual trigger
```

---

## Weekly Workflow

### Monday 6:00 AM AEST

**Step 1: GitHub Actions triggers**

```bash
npm run agents:google-ads:weekly
```

**Step 2: Phase 1 runs (collect-weekly-snapshots.ts)**

```
📊 Collecting Google Ads Weekly Snapshot
────────────────────────────────────────

Fetching campaigns from Google Ads API...
✓ Found 6 campaigns

Fetching performance metrics (last 7 days)...
✓ VIC Selective Entry: 1,234 impressions, 87 clicks, 12 conversions, $18.50 CAC
✓ NSW Selective: 987 impressions, 65 clicks, 8 conversions, $22.30 CAC
✓ Year 5 NAPLAN: 456 impressions, 23 clicks, 3 conversions, $28.00 CAC
✓ Year 7 NAPLAN: 543 impressions, 31 clicks, 4 conversions, $25.50 CAC
✓ EduTest: 789 impressions, 45 clicks, 7 conversions, $19.80 CAC
✓ ACER: 654 impressions, 38 clicks, 6 conversions, $21.20 CAC

Fetching keywords (top 100)...
✓ Saved 1,247 keywords

Fetching ad copy (all active ads)...
✓ Saved 43 ad variations

Calculating seasonal phases from test calendar...
✓ VIC Selective: 12 weeks until test → RAMP_UP (70% budget)
✓ NSW Selective: 8 weeks until test → PEAK (100% budget)
✓ Year 5 NAPLAN: 52 weeks until test → TOO_EARLY (pause)
✓ Year 7 NAPLAN: 52 weeks until test → TOO_EARLY (pause)
✓ EduTest: Q1 concentration → PEAK (100% budget)
✓ ACER: Q1 concentration → PEAK (100% budget)

Saving to Supabase...
✓ Snapshot ID: wk_2026_03_24_abc123
✓ Saved to google_ads_weekly_snapshots
✓ Saved to google_ads_weekly_keywords
✓ Saved to google_ads_weekly_ad_copy

Phase 1 complete! ✅
```

**Step 3: Phase 2 runs (analyze-with-ai.ts)**

```
🧠 Analyzing with Claude AI
────────────────────────────────────────

Loading snapshot from Supabase...
✓ Loaded snapshot: wk_2026_03_24_abc123

Loading previous week for comparison...
✓ Loaded snapshot: wk_2026_03_17_xyz789

Sending to Claude API...
✓ Prompt size: 15,234 tokens
✓ 11 hard rules embedded in prompt

Claude is analyzing...
✓ Analysis complete (3,421 tokens)

Validating recommendations against rules...
✓ 3 recommendations generated
✓ All recommendations pass safety checks

Sending to Telegram...
✓ Sent to chat 123456789

Phase 2 complete! ✅
```

### Throughout the Week

**You receive Telegram notification:**

```
🧠 Google Ads Weekly Analysis
Monday, March 24, 2026

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 WEEK SUMMARY:
• Total spend: $1,234 AUD
• Total conversions: 40
• Average CAC: $30.85
• Best performer: VIC Selective ($18.50 CAC)
• Needs attention: Year 5 NAPLAN (wasting $70/week)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 HIGH PRIORITY

Recommendation #1: Pause Year 5 NAPLAN
┌────────────────────────────────────┐
│ Why: Test is 52 weeks away (March  │
│ 2027). Currently in TOO_EARLY      │
│ phase and wasting $10/day.         │
│                                    │
│ Current: ENABLED, $10/day          │
│ Recommended: PAUSE                 │
│                                    │
│ Expected Impact: Save $300/month   │
│ Risk: None (test is 1 year away)   │
│ Confidence: 100%                   │
└────────────────────────────────────┘

[✅ Approve] [❌ Reject] [💬 Comment]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🟡 MEDIUM PRIORITY

Recommendation #2: Increase VIC Selective budget
┌────────────────────────────────────┐
│ Why: Test is 12 weeks away (June   │
│ 20). Currently in RAMP_UP phase    │
│ and underbudgeted.                 │
│                                    │
│ Current: $15/day                   │
│ Recommended: $35/day (+133%)       │
│ Seasonal target: 70% of max        │
│                                    │
│ Expected Impact: +25 conv/week,    │
│ +$5,000 profit/month               │
│ Risk: Low (CAC likely $16-20)      │
│ Confidence: 92%                    │
└────────────────────────────────────┘

[✅ Approve] [❌ Reject] [💬 Comment]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

View full analysis: [Link to Supabase]
```

**You click ✅ Approve or ❌ Reject**

Currently, you need to manually execute approved actions. Future enhancement will auto-execute via Google Ads API.

### Next Monday 6:00 AM AEST

Claude sees last week's changes and analyzes impact:

```
WEEK-OVER-WEEK COMPARISON:

VIC Selective:
├─ Budget increased from $15 to $35 (last Monday)
├─ Conversions: 12 → 18 (+50% WoW) ✅
├─ CAC: $20 → $16.50 (-17.5% WoW) ✅
└─ Verdict: Successful recommendation, continue monitoring

Year 5 NAPLAN:
├─ Campaign paused (last Monday)
├─ Spend: $70 → $0 (saved $70 this week) ✅
└─ Verdict: Correct decision, keep paused until 20 weeks before test
```

---

## The 11 Hard Rules

These rules are **programmatically enforced** in `rules-engine.ts`. Claude cannot override them.

### Budget Rules

**Rule 1: Daily Budget Cap**
```typescript
// No campaign can exceed $150 AUD per day total
const totalDaily = campaigns.reduce((sum, c) => sum + c.budget, 0);
if (totalDaily > 150) throw new Error('Total daily budget exceeds $150 cap');
```

**Rule 2: Single Campaign Budget Cap**
```typescript
// No single campaign can exceed $50 AUD per day
if (campaign.budget > 50) throw new Error(`Campaign ${campaign.name} exceeds $50/day cap`);
```

**Rule 3: Minimum Budget Threshold**
```typescript
// If running, campaign must have at least $5 AUD per day
if (campaign.status === 'ENABLED' && campaign.budget < 5) {
  throw new Error(`Campaign ${campaign.name} below minimum $5/day`);
}
```

### Seasonal Rules

**Rule 4: POST_TEST Must Pause**
```typescript
// Campaigns in POST_TEST phase MUST be paused
if (campaign.seasonal_phase === 'POST_TEST' && campaign.status !== 'PAUSED') {
  throw new Error(`Campaign ${campaign.name} finished test but still running`);
}
```

**Rule 5: TOO_EARLY Must Pause**
```typescript
// Campaigns 26+ weeks from test MUST be paused (waste of money)
if (campaign.seasonal_phase === 'TOO_EARLY' && campaign.status !== 'PAUSED') {
  throw new Error(`Campaign ${campaign.name} is 26+ weeks from test, must pause`);
}
```

**Rule 6: Seasonal Budget Alignment**
```typescript
// Budget must align with seasonal phase multiplier (±15% tolerance)
const expectedBudget = calculateSeasonalBudget(campaign);
const tolerance = expectedBudget * 0.15;
if (Math.abs(campaign.budget - expectedBudget) > tolerance) {
  throw new Error(`Campaign ${campaign.name} budget doesn't match seasonal phase`);
}
```

### Performance Rules

**Rule 7: CAC Pause Threshold**
```typescript
// If CAC exceeds $50, campaign MUST pause
if (campaign.cac > 50 && campaign.status !== 'PAUSED') {
  throw new Error(`Campaign ${campaign.name} has CAC $${campaign.cac} (exceeds $50 pause threshold)`);
}
```

**Rule 8: CAC Target Monitoring**
```typescript
// If CAC exceeds $35 target, must reduce budget or pause
if (campaign.cac > 35 && campaign.cac <= 50) {
  // Warning: needs budget reduction or optimization
  // Not a hard error, but flagged for AI analysis
}
```

### Safety Rules

**Rule 9: No Destructive Changes Without Approval**
```typescript
// Cannot pause campaign, reduce budget >20%, or add negative keywords without human approval
// AI can only RECOMMEND these changes, not execute
```

**Rule 10: Maximum Budget Increase**
```typescript
// Cannot increase budget by more than 100% in single week
const maxIncrease = currentBudget * 2;
if (newBudget > maxIncrease) {
  throw new Error(`Budget increase from $${currentBudget} to $${newBudget} exceeds 100% weekly cap`);
}
```

**Rule 11: Data Quality Requirement**
```typescript
// Cannot make recommendations without at least 7 days of data
if (campaign.data_days < 7) {
  throw new Error(`Campaign ${campaign.name} has insufficient data (${campaign.data_days} days)`);
}
```

### How Rules Are Enforced

**Pre-AI Validation** (before sending to Claude):
```typescript
// In collect-weekly-snapshots.ts
const validator = new DataValidator();
const rulesEngine = new RulesEngine();

// Validate data quality
validator.validate(snapshot);

// Check current state against rules
rulesEngine.validateSnapshot(snapshot);
// If violations found, human is notified (not AI)
```

**Post-AI Validation** (after Claude responds):
```typescript
// In analyze-with-ai.ts
const recommendations = await claude.analyze(snapshot);

// Validate each recommendation against rules
for (const rec of recommendations) {
  rulesEngine.validateRecommendation(rec, snapshot);
  // If recommendation violates rules, it's rejected automatically
}

// Only safe recommendations go to Telegram
```

**Example blocked recommendation:**

```json
{
  "recommendation": {
    "action": "Increase VIC Selective budget from $15 to $200/day",
    "reasoning": "High demand period, scale aggressively"
  },
  "validation_error": "BLOCKED by Rule 2: Single campaign cannot exceed $50/day",
  "status": "rejected_by_rules_engine"
}
```

---

## Test Calendar Management

The test calendar controls seasonal intelligence. Each product has a test date that determines when its campaign should run.

### View Current Test Calendar

```bash
tsx "Google Ads Agent/scripts/get-test-calendar.ts"
```

Output:
```
📅 Test Calendar
────────────────────────────────────────

VIC Selective Entry
├─ Test Date: June 20, 2026
├─ Weeks Until: 12
├─ Seasonal Phase: RAMP_UP ⚡
├─ Budget Range: $10-$50/day
├─ Recommended: $35/day (70% of max)
└─ Target CAC: $35, Pause at: $50

NSW Selective
├─ Test Date: May 1, 2026
├─ Weeks Until: 8
├─ Seasonal Phase: PEAK 🔥
├─ Budget Range: $10-$50/day
├─ Recommended: $50/day (100% of max)
└─ Target CAC: $35, Pause at: $50

Year 5 NAPLAN
├─ Test Date: March 9, 2027
├─ Weeks Until: 52
├─ Seasonal Phase: TOO_EARLY ⏸️
├─ Budget Range: $5-$30/day
├─ Recommended: PAUSE (too far out)
└─ Target CAC: $35, Pause at: $50
```

### Update Test Dates

```sql
-- Update test date for a product
UPDATE test_calendar
SET test_date_primary = '2027-06-20'
WHERE product_slug = 'vic-selective-entry';

-- Update budget range
UPDATE test_calendar
SET min_daily_budget_aud = 15,
    max_daily_budget_aud = 75
WHERE product_slug = 'nsw-selective';

-- Update CAC thresholds
UPDATE test_calendar
SET target_cpa_aud = 30,
    pause_cpa_aud = 45
WHERE product_slug = 'edutest-scholarship';
```

### Seasonal Phase Logic

Defined in `collect-weekly-snapshots.ts`:

```typescript
private getSeasonalPhase(weeksUntil: number, productSlug?: string): string {
  // Special handling for EduTest/ACER (rolling test dates)
  if (productSlug === 'edutest-scholarship' || productSlug === 'acer-scholarship') {
    const currentMonth = new Date().getMonth() + 1; // 1-12
    if (currentMonth >= 1 && currentMonth <= 3) return 'PEAK';      // Jan-Mar: Q1 peak
    if (currentMonth === 12) return 'RAMP_UP';                      // Dec: Pre-Q1 ramp
    if (currentMonth >= 10 && currentMonth <= 11) return 'EARLY';   // Oct-Nov: Pre-Q1 awareness
    return 'BASELINE';                                              // Apr-Sep: Baseline
  }

  // Fixed-date tests (NAPLAN, VIC Selective, NSW Selective)
  if (weeksUntil < 0) return 'POST_TEST';      // Test finished - PAUSE
  if (weeksUntil <= 2) return 'IMMINENT';      // 0-2 weeks - 60% budget
  if (weeksUntil <= 6) return 'LATE';          // 2-6 weeks - 85% budget
  if (weeksUntil <= 12) return 'PEAK';         // 6-12 weeks - 100% budget
  if (weeksUntil <= 20) return 'RAMP_UP';      // 12-20 weeks - 70% budget
  if (weeksUntil <= 26) return 'EARLY';        // 20-26 weeks - 40% budget
  return 'TOO_EARLY';                          // 26+ weeks - PAUSE
}
```

### Budget Calculation

```typescript
private calculateSeasonalBudget(max: number, min: number, phase: string): number {
  const budgetMultipliers: Record<string, number> = {
    'POST_TEST': 0.0,   // PAUSE
    'TOO_EARLY': 0.0,   // PAUSE
    'EARLY': 0.4,       // 40% of max
    'RAMP_UP': 0.7,     // 70% of max
    'PEAK': 1.0,        // 100% of max
    'LATE': 0.85,       // 85% of max
    'IMMINENT': 0.6,    // 60% of max
    'BASELINE': 0.5,    // 50% of max (EduTest/ACER only)
  };

  const multiplier = budgetMultipliers[phase] || 0;
  return Math.round(min + (max - min) * multiplier);
}
```

**Example:**
- Product: VIC Selective Entry
- Min budget: $10/day
- Max budget: $50/day
- Test date: June 20, 2026
- Today: March 24, 2026
- Weeks until test: 12
- Seasonal phase: `RAMP_UP`
- Budget multiplier: `0.7`
- Recommended budget: `$10 + ($50 - $10) * 0.7 = $38/day`

---

## Troubleshooting

### Common Issues

**1. "Cannot find module 'google-ads-api'"**

```bash
npm install google-ads-api
```

**2. "db.from is not a function"**

Fixed in latest version. Issue was using `db.from()` instead of `db.client.from()`.

**3. "require.main is not defined in ES module scope"**

Fixed in latest version. Changed to use `import.meta.url`.

**4. "Multiple exports with the same name"**

Fixed in latest version. Removed duplicate export statement.

**5. "Could not authenticate with Google Ads API"**

Check `.env` file has correct credentials:
```bash
grep GOOGLE_ADS .env
```

**6. "No snapshots found in database"**

Run Phase 1 first:
```bash
tsx "Google Ads Agent/scripts/collect-weekly-snapshots.ts"
```

**7. "Claude API rate limit exceeded"**

Phase 2 uses Claude API. If rate limited, wait 60 seconds and retry:
```bash
sleep 60
tsx "Google Ads Agent/scripts/analyze-with-ai.ts"
```

### Debugging Tips

**Check recent snapshots:**

```sql
SELECT
  snapshot_id,
  snapshot_date,
  campaign_count,
  total_spend_aud,
  total_conversions,
  created_at
FROM google_ads_weekly_snapshots
ORDER BY snapshot_date DESC
LIMIT 5;
```

**Check keywords for a snapshot:**

```sql
SELECT
  keyword_text,
  impressions,
  clicks,
  cost_aud,
  conversions,
  cac_aud
FROM google_ads_weekly_keywords
WHERE snapshot_id = 'wk_2026_03_24_abc123'
  AND conversions > 0
ORDER BY cac_aud ASC
LIMIT 20;
```

**Check ad copy performance:**

```sql
SELECT
  headline_1,
  headline_2,
  headline_3,
  description_1,
  impressions,
  clicks,
  ctr,
  conversions,
  cac_aud
FROM google_ads_weekly_ad_copy
WHERE snapshot_id = 'wk_2026_03_24_abc123'
  AND conversions > 0
ORDER BY ctr DESC
LIMIT 10;
```

**Check AI recommendations:**

```sql
SELECT
  analysis_date,
  snapshot_id,
  recommendations_count,
  executive_summary,
  created_at
FROM google_ads_weekly_analysis
ORDER BY analysis_date DESC
LIMIT 5;
```

---

## Database Schema

### Core Tables

**google_ads_weekly_snapshots**
```sql
CREATE TABLE google_ads_weekly_snapshots (
  id SERIAL PRIMARY KEY,
  snapshot_id TEXT UNIQUE NOT NULL,
  snapshot_date DATE NOT NULL,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  campaign_count INTEGER NOT NULL,
  total_spend_aud DECIMAL(10,2) NOT NULL,
  total_conversions INTEGER NOT NULL,
  average_cac_aud DECIMAL(10,2),
  snapshot_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**google_ads_weekly_keywords**
```sql
CREATE TABLE google_ads_weekly_keywords (
  id SERIAL PRIMARY KEY,
  snapshot_id TEXT REFERENCES google_ads_weekly_snapshots(snapshot_id),
  campaign_id TEXT NOT NULL,
  campaign_name TEXT NOT NULL,
  product_slug TEXT NOT NULL,
  keyword_text TEXT NOT NULL,
  match_type TEXT NOT NULL,
  impressions INTEGER NOT NULL,
  clicks INTEGER NOT NULL,
  cost_aud DECIMAL(10,2) NOT NULL,
  conversions INTEGER NOT NULL,
  cac_aud DECIMAL(10,2),
  ctr DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**google_ads_weekly_ad_copy**
```sql
CREATE TABLE google_ads_weekly_ad_copy (
  id SERIAL PRIMARY KEY,
  snapshot_id TEXT REFERENCES google_ads_weekly_snapshots(snapshot_id),
  campaign_id TEXT NOT NULL,
  campaign_name TEXT NOT NULL,
  product_slug TEXT NOT NULL,
  ad_id TEXT NOT NULL,
  headline_1 TEXT,
  headline_2 TEXT,
  headline_3 TEXT,
  description_1 TEXT,
  description_2 TEXT,
  impressions INTEGER NOT NULL,
  clicks INTEGER NOT NULL,
  cost_aud DECIMAL(10,2) NOT NULL,
  conversions INTEGER NOT NULL,
  cac_aud DECIMAL(10,2),
  ctr DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**google_ads_weekly_analysis**
```sql
CREATE TABLE google_ads_weekly_analysis (
  id SERIAL PRIMARY KEY,
  analysis_id TEXT UNIQUE NOT NULL,
  analysis_date DATE NOT NULL,
  snapshot_id TEXT REFERENCES google_ads_weekly_snapshots(snapshot_id),
  executive_summary TEXT NOT NULL,
  recommendations_count INTEGER NOT NULL,
  full_analysis JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Supporting Tables

**test_calendar**
```sql
-- Managed separately, contains test dates and budget limits
-- See migrations/001_weekly_snapshots.sql for full schema
```

---

## Summary

**What you have:**
- ✅ Automated weekly data collection from Google Ads API
- ✅ AI analysis with Claude using 11 hard safety rules
- ✅ Seasonal intelligence based on test calendar
- ✅ Telegram notifications with human approval workflow
- ✅ Complete attribution tracking (week-over-week comparison)

**How to use:**
1. Set up environment variables
2. Update campaign product mapping
3. Populate test calendar
4. Run locally to test: `tsx "Google Ads Agent/scripts/index-weekly.ts"`
5. Deploy via GitHub Actions (runs every Monday 6 AM AEST)
6. Review recommendations in Telegram each week
7. Manually execute approved actions (or wait for auto-execution feature)

**Expected benefits:**
- Save $300-600/month by auto-pausing finished tests
- Gain $5,000-7,000/month by optimal seasonal ramping
- Improve CAC by 15-25% through AI recommendations
- Complete visibility into what's working via attribution tracking

**Need help?**
- Check troubleshooting section above
- Review database queries for debugging
- Check GitHub Actions logs for errors
- Contact support if issues persist
