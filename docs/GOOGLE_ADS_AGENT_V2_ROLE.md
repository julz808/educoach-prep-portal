# Google Ads Agent V2 - New Role & Responsibilities

**Status**: 🔄 In Design
**Change**: From "AI recommends budget changes" → "Auto-execute preset budget strategy"

---

## 🎯 What Changed & Why

### Current Role (V1) - Too Manual

```
❌ Agent analyzes data
❌ Agent suggests budget changes via Telegram
❌ You approve/reject budget recommendations
❌ Agent waits for manual approval
❌ You implement budget changes yourself
```

**Problems**:
- Budget allocation should be automatic (we already calculated 104 weeks)
- You don't want to approve budget changes every week
- Budget decisions are strategic (preset), not tactical (AI-decided)
- Wasting AI on simple budget execution

### New Role (V2) - Automated Execution

```
✅ Agent reads preset budget from weekly_budget_allocation table
✅ Agent AUTOMATICALLY sets Google Ads campaign budgets (no approval needed)
✅ Agent focuses AI on tactical optimization (ad copy, keywords, negatives)
✅ Agent sends weekly performance report + tactical recommendations
✅ You review tactical suggestions (not budget changes)
```

**Benefits**:
- Budget allocation runs on autopilot (preset strategy)
- AI focuses on what it's good at (copy, keywords, optimization)
- You get weekly updates without manual budget approvals
- Strategic control (you set formula), tactical automation (agent executes)

---

## 📋 New Weekly Workflow

### Monday 6 AM AEST (Automated)

**Phase 1: Data Collection (Deterministic)**
```
1. Scrape Google Ads performance (last 7 days)
   • Campaign metrics (impressions, clicks, cost, conversions)
   • Keyword performance
   • Search terms (for negative keyword analysis)
   • Ad copy performance

2. Save to Supabase
   • google_ads_weekly_snapshots
   • google_ads_weekly_keywords
   • google_ads_weekly_ad_copy
   • google_ads_weekly_search_terms
```

**Phase 2: Budget Execution (Automated - NO APPROVAL NEEDED)**
```
3. Read current week's budget allocation
   SELECT * FROM weekly_budget_allocation
   WHERE week_start_date = CURRENT_WEEK;

4. For each product:
   • Get allocated daily_budget from database
   • Map product_slug to Google Ads campaign_id
   • Update campaign budget via Google Ads API
   • Log budget change to google_ads_budget_changes table

5. Verify budgets applied correctly
   • Fetch campaign budgets from Google Ads
   • Compare actual vs allocated
   • Alert if mismatch (Telegram)
```

**Phase 3: AI Analysis (Tactical Optimization)**
```
6. AI analyzes performance data:
   • Which keywords are converting?
   • Which keywords are wasting money? (suggest negatives)
   • Which ad copy is performing best?
   • Which search terms should be added as keywords?
   • Are bids too high/low? (suggest bid adjustments)

7. Generate tactical recommendations:
   • "Add negative keyword 'free' to VIC Selective campaign"
   • "Increase bid on 'VIC selective practice test' from $2.50 to $3.00"
   • "Pause ad copy variant #3 (0.5% CTR vs 2.1% average)"
   • "Add new keyword 'year 5 naplan preparation' (converting search term)"
```

**Phase 4: Telegram Report (Weekly Update)**
```
8. Send Telegram message with:
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📊 GOOGLE ADS WEEKLY REPORT
   Week of March 25, 2026
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   💰 BUDGET EXECUTION (Automated)
   ✅ Budgets updated automatically

   VIC Selective:    $50.00/day (was $30.00)
   ACER:             $22.00/day (was $45.00)
   EduTest:          $20.00/day (was $30.00)
   NAPLAN Y5:        $17.00/day (was $6.00)
   NAPLAN Y7:        $17.00/day (was $2.00)
   NSW:              $17.00/day (was $1.00)

   📈 PERFORMANCE HIGHLIGHTS
   • Total spend: $1,234.56 (vs allocated $1,400)
   • Total conversions: 12
   • Average CAC: $102.88
   • Best performer: VIC Selective (CAC $85)
   • Worst performer: NAPLAN Y7 (CAC $180)

   🎯 TACTICAL RECOMMENDATIONS
   (Review & approve below)

   1. [NEGATIVE KEYWORD] VIC Selective
      • Add "free" as negative (30 clicks, $45 wasted, 0 conv)
      • Impact: Save ~$60/week
      • Approve? /approve_1 or /reject_1

   2. [BID ADJUSTMENT] Year 5 NAPLAN
      • Increase "naplan practice test" bid $2.50 → $3.50
      • Reason: Converting at 8%, losing impression share
      • Approve? /approve_2 or /reject_2

   3. [AD COPY PAUSE] ACER Scholarship
      • Pause Ad #12345 (CTR 0.4% vs avg 2.1%)
      • Best ad: #12347 (CTR 3.2%)
      • Approve? /approve_3 or /reject_3

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Next update: Monday, April 1, 2026
```

**User Action (Optional)**
```
9. You review tactical recommendations in Telegram
   • Approve good ideas: /approve_2
   • Reject bad ideas: /reject_3
   • Ignore = agent won't execute (safe default)

10. Agent executes approved actions
    • Runs Tuesday-Sunday (after you've had time to review)
    • Only executes what you explicitly approved
    • Logs all changes to google_ads_agent_actions table
```

---

## 🔀 Comparison: V1 vs V2

### Decision Authority Matrix

| Decision Type | V1 (Old) | V2 (New) | Why Changed |
|---------------|----------|----------|-------------|
| **STRATEGIC** |
| Annual budget ($20k) | You | You | ✅ Correct |
| Budget allocation formula | You | You | ✅ Correct |
| Product weights (1.3x ACER, etc) | You | You | ✅ Correct |
| Weekly budget per product | ❌ AI suggests → You approve | ✅ Auto-execute preset | Automation |
| Campaign ON/OFF | ❌ AI suggests → You approve | ✅ Auto-execute preset | Automation |
| **TACTICAL** |
| Add negative keyword | AI suggests → You approve | AI suggests → You approve | ✅ Correct |
| Adjust keyword bids | AI suggests → You approve | AI suggests → You approve | ✅ Correct |
| Pause/enable ads | AI suggests → You approve | AI suggests → You approve | ✅ Correct |
| Add new keywords | AI suggests → You approve | AI suggests → You approve | ✅ Correct |
| Change ad copy | AI suggests → You approve | AI suggests → You approve | ✅ Correct |

### Weekly Telegram Message Changes

**V1 (Budget Recommendations)**:
```
❌ BUDGET RECOMMENDATIONS
   1. Increase VIC Selective to $50/day
      Reason: Peak season (applications open)
      Approve? /approve_budget_1

   2. Decrease ACER to $20/day
      Reason: Post-test season
      Approve? /approve_budget_2
```

**V2 (Budget Execution Report)**:
```
✅ BUDGET EXECUTION (Automated)
   VIC Selective:  $50/day ✅ Applied
   ACER:           $20/day ✅ Applied
   EduTest:        $20/day ✅ Applied

   (No action needed - following preset strategy)
```

You no longer approve budget changes. They happen automatically based on `weekly_budget_allocation` table.

---

## 🏗️ Technical Architecture (V2)

### New Database Tables

```sql
-- Track automated budget changes
CREATE TABLE google_ads_budget_changes (
  id BIGSERIAL PRIMARY KEY,
  week_start_date DATE NOT NULL,
  product_slug TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  campaign_name TEXT NOT NULL,

  -- Budgets
  allocated_daily_budget_aud DECIMAL(10,2) NOT NULL, -- From weekly_budget_allocation
  previous_daily_budget_aud DECIMAL(10,2), -- What was set before
  new_daily_budget_aud DECIMAL(10,2) NOT NULL, -- What we set it to

  -- Status
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  execution_status TEXT DEFAULT 'success', -- success, failed, skipped
  error_message TEXT,

  -- Metadata
  agent_version TEXT DEFAULT 'v2',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_budget_changes_date ON google_ads_budget_changes(week_start_date DESC);
CREATE INDEX idx_budget_changes_product ON google_ads_budget_changes(product_slug, week_start_date);
```

### Campaign Mapping (Product → Google Ads)

```sql
-- Map our product slugs to Google Ads campaign IDs
CREATE TABLE google_ads_campaign_mapping (
  id BIGSERIAL PRIMARY KEY,
  product_slug TEXT NOT NULL UNIQUE,
  campaign_id TEXT NOT NULL,
  campaign_name TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data (you'll need to fill in actual campaign IDs)
INSERT INTO google_ads_campaign_mapping (product_slug, campaign_id, campaign_name) VALUES
  ('acer-scholarship', '12345678', 'ACER Scholarship - Search'),
  ('vic-selective', '23456789', 'VIC Selective - Search'),
  ('edutest-scholarship', '34567890', 'EduTest Scholarship - Search'),
  ('year-5-naplan', '45678901', 'Year 5 NAPLAN - Search'),
  ('year-7-naplan', '56789012', 'Year 7 NAPLAN - Search'),
  ('nsw-selective', '67890123', 'NSW Selective - Search');
```

### New Agent Flow (TypeScript)

```typescript
// scripts/google-ads-agent-v2/execute-budget-allocation.ts

export class BudgetExecutor {
  async execute() {
    console.log('💰 Executing Budget Allocation (Automated)\n');

    // 1. Get current week's allocation
    const thisMonday = getCurrentMonday();
    const allocation = await this.getAllocation(thisMonday);

    if (!allocation) {
      console.log('⚠️  No allocation found for this week. Skipping.');
      return;
    }

    console.log(`Week of ${thisMonday}`);
    console.log(`Market heat: ${allocation.market_heat}`);
    console.log(`Weekly budget: $${allocation.weekly_budget_aud}\n`);

    // 2. Get campaign mapping
    const campaigns = await this.getCampaignMapping();

    // 3. For each product, update budget
    const changes: any[] = [];

    for (const campaign of campaigns) {
      const productAlloc = allocation.product_allocations[campaign.product_slug];

      if (!productAlloc) {
        console.log(`⚠️  No allocation for ${campaign.product_slug}, skipping`);
        continue;
      }

      const allocatedBudget = productAlloc.daily_budget;

      console.log(`\n${campaign.product_slug}:`);
      console.log(`  Allocated: $${allocatedBudget}/day (${productAlloc.phase})`);

      // Get current budget from Google Ads
      const currentBudget = await this.getCurrentBudget(campaign.campaign_id);
      console.log(`  Current:   $${currentBudget}/day`);

      // Update if different (allow 1% tolerance to avoid constant updates)
      const diff = Math.abs(allocatedBudget - currentBudget);
      const tolerance = allocatedBudget * 0.01;

      if (diff > tolerance) {
        console.log(`  ➜ Updating to $${allocatedBudget}/day...`);

        try {
          await this.updateBudget(campaign.campaign_id, allocatedBudget);
          console.log(`  ✅ Budget updated`);

          changes.push({
            week_start_date: thisMonday,
            product_slug: campaign.product_slug,
            campaign_id: campaign.campaign_id,
            campaign_name: campaign.campaign_name,
            allocated_daily_budget_aud: allocatedBudget,
            previous_daily_budget_aud: currentBudget,
            new_daily_budget_aud: allocatedBudget,
            execution_status: 'success',
          });
        } catch (error) {
          console.log(`  ❌ Failed: ${error.message}`);

          changes.push({
            week_start_date: thisMonday,
            product_slug: campaign.product_slug,
            campaign_id: campaign.campaign_id,
            campaign_name: campaign.campaign_name,
            allocated_daily_budget_aud: allocatedBudget,
            previous_daily_budget_aud: currentBudget,
            new_daily_budget_aud: currentBudget,
            execution_status: 'failed',
            error_message: error.message,
          });
        }
      } else {
        console.log(`  ✓ Already correct (within 1% tolerance)`);
      }
    }

    // 4. Save budget changes to database
    if (changes.length > 0) {
      await this.supabase
        .from('google_ads_budget_changes')
        .insert(changes);
    }

    console.log(`\n✅ Budget execution complete (${changes.length} changes)`);
    return changes;
  }

  private async updateBudget(campaignId: string, dailyBudgetAud: number) {
    // Convert AUD to micros (Google Ads uses micros)
    const budgetMicros = Math.round(dailyBudgetAud * 1_000_000);

    // Update via Google Ads API
    // (Implementation depends on google-ads-api library)
    await this.googleAdsClient.updateCampaignBudget(campaignId, budgetMicros);
  }
}
```

### Updated index-weekly.ts

```typescript
async function main() {
  console.log('🤖 Google Ads Weekly Agent V2');
  console.log('═══════════════════════════════════════════\n');

  try {
    // Step 1: Data Collection (unchanged)
    console.log('━━━ STEP 1: DATA COLLECTION ━━━\n');
    const collector = new WeeklySnapshotCollector();
    await collector.collect();

    // Step 2: Budget Execution (NEW - AUTOMATED)
    console.log('\n━━━ STEP 2: BUDGET EXECUTION (Automated) ━━━\n');
    const executor = new BudgetExecutor();
    const budgetChanges = await executor.execute();

    // Step 3: AI Analysis (UPDATED - Tactical Only)
    console.log('\n━━━ STEP 3: AI ANALYSIS (Tactical Optimization) ━━━\n');
    const analyzer = new AIAnalyzer();
    const analysis = await analyzer.analyze(); // Returns tactical recommendations only

    // Step 4: Telegram Report (UPDATED)
    console.log('\n━━━ STEP 4: TELEGRAM REPORT ━━━\n');
    const notifier = new TelegramNotifier();
    await notifier.sendWeeklyReport({
      budgetChanges, // Automated (no approval needed)
      performance: analysis.performance,
      tacticalRecommendations: analysis.recommendations, // User approves these
    });

    console.log('\n✅ Weekly Agent Complete!');
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}
```

---

## 📊 New AI Analysis Prompt (Tactical Focus)

```typescript
const TACTICAL_ANALYSIS_PROMPT = `
You are a Google Ads optimization expert. Analyze this week's performance data and provide TACTICAL recommendations.

IMPORTANT: DO NOT recommend budget changes. Budgets are set automatically by a preset allocation strategy.

Focus on:
1. NEGATIVE KEYWORDS: Which search terms are wasting money? (high cost, low/no conversions)
2. BID ADJUSTMENTS: Which keywords need bid increases/decreases?
3. AD COPY: Which ads should be paused/enabled based on CTR and conversion rate?
4. NEW KEYWORDS: Which converting search terms should be added as keywords?
5. KEYWORD MATCH TYPES: Should any broad match keywords be switched to phrase/exact?

Current Week Data:
${JSON.stringify(currentWeek, null, 2)}

Prior Week Data:
${JSON.stringify(priorWeek, null, 2)}

Budget Allocation (For Context Only - DO NOT CHANGE):
${JSON.stringify(budgetAllocation, null, 2)}

Provide recommendations in this format:
{
  "recommendations": [
    {
      "type": "negative_keyword",
      "campaign": "VIC Selective",
      "action": "Add negative keyword 'free'",
      "reason": "30 clicks, $45 spent, 0 conversions",
      "impact": "Save ~$60/week"
    },
    {
      "type": "bid_adjustment",
      "campaign": "Year 5 NAPLAN",
      "keyword": "naplan practice test",
      "current_bid": 2.50,
      "recommended_bid": 3.50,
      "reason": "Converting at 8%, losing impression share to competitors",
      "impact": "Estimated +3 conversions/week"
    }
  ]
}
`;
```

---

## 📱 New Telegram Message Format

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 GOOGLE ADS WEEKLY REPORT
Week of March 25, 2026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 BUDGET EXECUTION (Automated ✅)
Market Heat: 0.96 (PEAK)

✅ VIC Selective:    $50.00/day (was $30.00) +67%
✅ EduTest:          $20.00/day (was $30.00) -33%
✅ ACER:             $22.00/day (was $45.00) -51%
✅ NAPLAN Y5:        $17.00/day (was $6.00)  +183%
✅ NAPLAN Y7:        $17.00/day (was $2.00)  +750%
✅ NSW:              $17.00/day (was $1.00)  +1600%

All budgets updated automatically.
No action needed (following preset strategy).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 PERFORMANCE SUMMARY (Last 7 Days)

Spend:        $1,234.56 (88% of allocated $1,400)
Conversions:  12 sales
Avg CAC:      $102.88

By Product:
🏆 VIC Selective:  6 sales @ $85 CAC  ⭐ Best
   EduTest:        3 sales @ $110 CAC
   ACER:           2 sales @ $95 CAC
   NAPLAN Y5:      1 sale @ $150 CAC
❌ NAPLAN Y7:      0 sales @ $0 CAC   (no conversions yet)
   NSW:            0 sales @ $0 CAC   (no conversions yet)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 TACTICAL RECOMMENDATIONS
(Review & approve below)

[1] NEGATIVE KEYWORD - VIC Selective
   Add "free" as negative keyword
   • 30 clicks, $45 wasted, 0 conversions
   • Impact: Save ~$60/week
   👉 /approve_1 or /reject_1

[2] BID INCREASE - Year 5 NAPLAN
   "naplan practice test": $2.50 → $3.50
   • Converting at 8%, losing impression share
   • Impact: Estimated +3 conversions/week
   👉 /approve_2 or /reject_2

[3] PAUSE UNDERPERFORMING AD - ACER
   Pause Ad #12345 (CTR 0.4% vs avg 2.1%)
   • Best ad: #12347 (CTR 3.2%)
   • Impact: Focus budget on winning ad
   👉 /approve_3 or /reject_3

[4] ADD CONVERTING KEYWORD - EduTest
   Add "edutest scholarship 2026" (phrase match)
   • Showed up in search terms: 12 impressions, 3 clicks, 1 conversion
   • Currently not bidding on this exact phrase
   • Impact: Capture more qualified traffic
   👉 /approve_4 or /reject_4

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Reply with /approve_X to approve
or /reject_X to reject any recommendation.

Next update: Monday, April 1, 2026 6 AM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## ✅ Summary: What You Get Every Week

### Automated (No Approval Needed)
✅ Budget allocation executed automatically
✅ Campaigns turned ON/OFF based on season
✅ Daily budgets adjusted per product
✅ Logged to database for auditing

### Tactical Recommendations (You Approve)
📋 Negative keywords to add
📋 Bid adjustments (increase/decrease)
📋 Ad copy to pause/enable
📋 New keywords to add
📋 Match type changes

### Weekly Report
📊 Budget execution summary
📊 Performance highlights (CAC, conversions, spend)
📊 Product-by-product breakdown
📊 Tactical recommendations (approve/reject)

---

## 🚀 Next Steps

1. ✅ Create `google_ads_budget_changes` table (migration)
2. ✅ Create `google_ads_campaign_mapping` table (seed with your campaign IDs)
3. 🔄 Build `BudgetExecutor` class (auto-execute budgets)
4. 🔄 Update `AIAnalyzer` prompt (tactical only, no budget recommendations)
5. 🔄 Update `TelegramNotifier` format (show budget execution + tactical recs)
6. 🔄 Test on staging with dummy campaign IDs
7. 🔄 Deploy to production (Monday automation)

---

**Philosophy**: Strategic decisions (budget allocation) are preset and automated. Tactical decisions (keywords, bids, ad copy) require AI + human approval.

