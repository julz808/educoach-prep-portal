# Google Ads Agent V2 - Simplified & Focused

**Philosophy:** Strategic decisions are automated, tactical decisions need human approval.

---

## 🎯 What Changed from V1

### V1 Problems (Too Manual)
- ❌ AI suggested budget changes → You manually approved → You manually implemented
- ❌ Budget allocation should be automatic (we already calculated 104 weeks)
- ❌ Wasting AI on simple budget execution
- ❌ Too much manual work every Monday

### V2 Solution (Automated Strategy + AI Tactics)
- ✅ **Budget allocation runs on autopilot** (reads from `weekly_budget_allocation` table)
- ✅ **AI focuses on tactical wins** (ad copy, keywords, bids, negatives)
- ✅ **You review 3-5 high-impact suggestions** (not 20+ budget approvals)
- ✅ **Minimal manual work** (just approve good tactical ideas)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  MONDAY 6 AM AEST - Weekly Agent V2                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Phase 1: DATA COLLECTION (Deterministic)                   │
├─────────────────────────────────────────────────────────────┤
│  • Scrape Google Ads performance (last 7 days)              │
│  • Campaign metrics, keywords, search terms, ad copy        │
│  • Save to Supabase (google_ads_weekly_snapshots)          │
│  • Export JSON backup                                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Phase 2: BUDGET EXECUTION (Automated - NO APPROVAL)        │
├─────────────────────────────────────────────────────────────┤
│  1. Read current week from weekly_budget_allocation         │
│  2. For each product:                                        │
│     • Get allocated daily_budget                             │
│     • Update Google Ads campaign budget via API             │
│     • Update campaign status (ENABLED/PAUSED)               │
│  3. Log all changes                                          │
│  ✅ BUDGETS UPDATED AUTOMATICALLY                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Phase 3: AI TACTICAL ANALYSIS                              │
├─────────────────────────────────────────────────────────────┤
│  • AI analyzes current + prior week data                    │
│  • Focus: tactics ONLY (not budgets)                        │
│  • Generate 3-5 HIGH-IMPACT recommendations:                │
│    - Add negative keywords (wasteful searches)              │
│    - Add converting keywords (missed opportunities)         │
│    - Adjust bids (underbidding/overbidding)                 │
│    - Pause/enable ads (low/high CTR)                        │
│  ⚠️ NO BUDGET RECOMMENDATIONS                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Phase 4: TELEGRAM REPORT                                   │
├─────────────────────────────────────────────────────────────┤
│  📊 Budget Execution Summary (automated, no action)         │
│  📈 Performance Highlights (CAC, conversions, spend)        │
│  🎯 Tactical Recommendations (approve/reject via Telegram)  │
│  ✅ You review & approve good ideas                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📂 File Structure

```
Google Ads Agent/
├── scripts/v2/
│   ├── index-weekly-v2.ts        # Main weekly agent
│   ├── budget-executor.ts        # Auto-executes budgets (NO approval)
│   └── tactical-analyzer.ts      # AI tactical recommendations only
│
├── scripts/
│   └── collect-weekly-snapshots.ts  # Data collection (unchanged)
│
└── README_V2.md                  # This file
```

---

## 🚀 Quick Start

### 1. Run the Weekly Agent

```bash
cd "Google Ads Agent/scripts/v2"
npx tsx index-weekly-v2.ts
```

### 2. What Happens

```
✅ Phase 1: Collects last week's data
✅ Phase 2: Auto-updates budgets from weekly_budget_allocation table
✅ Phase 3: AI analyzes for tactical opportunities
✅ Phase 4: Sends Telegram report
```

### 3. Your Action

Check Telegram for:
- Budget execution summary (already done, no action needed)
- 3-5 tactical recommendations (approve or reject)

---

## 💡 Example Weekly Report

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
   NAPLAN Y7:      0 sales (no conversions yet)
   NSW:            0 sales (no conversions yet)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 TACTICAL RECOMMENDATIONS
(Review & approve below)

[1] 🚫 NEGATIVE KEYWORD - VIC Selective
   Add "free" as negative keyword
   • 30 clicks, $45 wasted, 0 conversions
   • Impact: Save ~$60/week
   👉 /approve_1 or /reject_1

[2] 💵 BID INCREASE - Year 5 NAPLAN
   "naplan practice test": $2.50 → $3.50
   • Converting at 8%, losing impression share
   • Impact: Estimated +3 conversions/week
   👉 /approve_2 or /reject_2

[3] ⏸️ PAUSE UNDERPERFORMING AD - ACER
   Pause Ad #12345 (CTR 0.4% vs avg 2.1%)
   • Best ad: #12347 (CTR 3.2%)
   • Impact: Focus budget on winning ad
   👉 /approve_3 or /reject_3

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Next update: Monday, April 1, 2026 6 AM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🎯 Decision Matrix: What's Automated vs Manual

| Decision Type | V1 (Old) | V2 (New) | Reason |
|---------------|----------|----------|--------|
| **STRATEGIC (Preset)** |
| Weekly budget per product | AI suggests → Approve | ✅ **Auto-execute** | Already calculated for 104 weeks |
| Campaign ON/OFF by season | AI suggests → Approve | ✅ **Auto-execute** | Follows preset formula |
| Product budget weights | Manual | Manual | ✅ Correct |
| **TACTICAL (AI + Human)** |
| Add negative keyword | AI suggests → Approve | AI suggests → Approve | ✅ Correct |
| Adjust keyword bids | AI suggests → Approve | AI suggests → Approve | ✅ Correct |
| Pause/enable ads | AI suggests → Approve | AI suggests → Approve | ✅ Correct |
| Add new keywords | AI suggests → Approve | AI suggests → Approve | ✅ Correct |

**Key Change:** Budget decisions moved from "AI suggests" to "Auto-execute" because they're preset (not AI-decided).

---

## 🔧 How Budget Execution Works

### 1. weekly_budget_allocation Table Structure

```sql
{
  week_start_date: '2026-03-24',
  weekly_budget_aud: 502.43,
  market_heat: 0.96,
  product_allocations: {
    'vic-selective': {
      phase: 'PEAK',
      daily_budget: 22.01,
      weekly_budget: 154.05
    },
    'acer-scholarship': {
      phase: 'BASELINE',
      daily_budget: 4.40,
      weekly_budget: 30.80
    },
    // ... other products
  }
}
```

### 2. Budget Executor Logic

```typescript
// 1. Get current week allocation
const allocation = getCurrentWeekAllocation(); // Monday of this week

// 2. For each product
for (const [slug, allocation] of Object.entries(product_allocations)) {
  const campaign = getCampaign(slug); // Map vic-selective → "VIC Selective Entry"

  // 3. Update if different (1% tolerance to avoid micro-adjustments)
  if (Math.abs(campaign.budget - allocation.daily_budget) > 0.01) {
    updateCampaignBudget(campaign.id, allocation.daily_budget);
  }

  // 4. Update status based on phase
  const targetStatus = allocation.phase === 'PAUSED' ? 'PAUSED' : 'ENABLED';
  if (campaign.status !== targetStatus) {
    updateCampaignStatus(campaign.id, targetStatus);
  }
}
```

**Result:** All 6 campaigns automatically match the preset strategy. No manual approval needed.

---

## 🧠 AI Tactical Analyzer

### What It Does

- Analyzes current + prior week performance
- Identifies 3-5 HIGH-IMPACT tactical opportunities
- Focuses ONLY on keywords, ads, bids (NOT budgets)

### AI Prompt (Simplified)

```
You are a Google Ads optimization expert.

IMPORTANT: DO NOT recommend budget changes.
Budgets are set automatically by preset strategy.

Your job: Find 3-5 HIGH-IMPACT tactical opportunities:

1. NEGATIVE KEYWORDS: What searches are wasting money?
2. ADD KEYWORDS: What converting search terms should we bid on?
3. BID ADJUSTMENTS: What keywords need higher/lower bids?
4. AD COPY: What ads should be paused/enabled?

Current Week Data: {...}
Prior Week Data: {...}

Provide 3-5 recommendations ranked by impact.
```

### Example AI Output

```json
[
  {
    "type": "negative_keyword",
    "campaign": "VIC Selective Entry",
    "action": "Add 'free' as negative keyword",
    "reason": "30 clicks, $45 spent, 0 conversions",
    "impact": "Save ~$60/week"
  },
  {
    "type": "bid_adjustment",
    "campaign": "Year 5 NAPLAN",
    "action": "Increase bid on 'naplan practice test' from $2.50 to $3.50",
    "reason": "Converting at 8% but losing 40% impression share",
    "impact": "Estimated +3 conversions/week"
  }
]
```

---

## 📅 Weekly Schedule

### Monday 6 AM AEST (Automated)
1. **Data Collection** - Scrape last week's performance
2. **Budget Execution** - Auto-update budgets from `weekly_budget_allocation`
3. **AI Analysis** - Generate tactical recommendations
4. **Telegram Report** - Send budget summary + recommendations

### Monday-Friday (Your Review)
- Check Telegram when convenient
- Approve good tactical ideas: `/approve_1`
- Reject bad ideas: `/reject_2`

### Tuesday-Sunday (Agent Executes)
- Agent executes approved recommendations only
- Logs all changes to database
- Next Monday: See attribution results

---

## ✅ Benefits of V2

### 1. Less Manual Work
- **V1:** 20+ budget approvals every Monday
- **V2:** 0 budget approvals (automated)
- **You Only:** Review 3-5 tactical suggestions

### 2. Strategic Control
- You control the formula (weekly_budget_allocation table)
- Agent just executes your preset strategy
- No AI "black box" deciding budgets

### 3. AI Focuses on What It's Good At
- **NOT good at:** Seasonal budget strategy (you already calculated this)
- **GOOD at:** Finding wasteful keywords, underperforming ads, bid opportunities

### 4. Faster Execution
- Budgets update immediately Monday 6 AM
- No waiting for manual approval
- Campaigns always aligned with current week's strategy

---

## 🚀 Next Steps

1. **Test Budget Executor:**
   ```bash
   npx tsx v2/budget-executor.ts
   ```
   Should auto-update all campaign budgets to match current week

2. **Test Tactical Analyzer:**
   ```bash
   npx tsx v2/tactical-analyzer.ts
   ```
   Should generate 3-5 tactical recommendations

3. **Run Full Weekly Agent:**
   ```bash
   npx tsx v2/index-weekly-v2.ts
   ```
   Should do all 4 phases end-to-end

4. **Set Up Cron Job:**
   ```
   0 6 * * 1 cd /path/to/project && npx tsx "Google Ads Agent/scripts/v2/index-weekly-v2.ts"
   ```
   Runs every Monday at 6 AM AEST

---

## 📝 Summary

**V2 = Simple & Focused**

- ✅ Budget allocation automated (reads from table, no approval)
- ✅ AI focuses on tactical wins (3-5 suggestions, not 20+)
- ✅ You review & approve only high-impact ideas
- ✅ Less work, better results

**No more over-engineering. Strategic decisions automated, tactical decisions AI-assisted.**
