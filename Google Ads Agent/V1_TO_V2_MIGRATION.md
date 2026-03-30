# Migration Guide: Google Ads Agent V1 → V2

## 🎯 Why Migrate?

### V1 Problems
1. **Over-engineered** - Too many manual approvals for strategic decisions
2. **Wasting AI** - Using AI to suggest budget changes you already planned
3. **Too much work** - Approving 20+ budget recommendations every Monday
4. **Budget delays** - Budgets not updated until you manually approve

### V2 Benefits
1. **Automated strategy** - Budgets execute automatically from `weekly_budget_allocation`
2. **AI focuses on tactics** - Keywords, ads, bids (what AI is good at)
3. **Less manual work** - Review 3-5 tactical suggestions (not 20+ budget approvals)
4. **Faster execution** - Budgets update immediately Monday 6 AM

---

## 📊 What Changed

| Feature | V1 | V2 |
|---------|----|----|
| **Budget Allocation** | AI suggests → You approve → Manual implementation | ✅ Auto-executes from `weekly_budget_allocation` table |
| **Campaign ON/OFF** | AI suggests → You approve | ✅ Auto-executes based on phase |
| **AI Recommendations** | Budget + Tactical (20+ items) | Tactical only (3-5 high-impact) |
| **Weekly Telegram** | Budget recommendations | Budget execution report + tactical suggestions |
| **Your Work** | Approve budgets + tactics | Approve tactics only |
| **Approval Needed** | Every change (strategic + tactical) | Tactical changes only |

---

## 🏗️ New Architecture

### V2 Structure

```
scripts/v2/
├── index-weekly-v2.ts        # Main weekly agent (4 phases)
├── budget-executor.ts        # Auto-executes budgets (NO approval)
└── tactical-analyzer.ts      # AI tactical recommendations only

scripts/
└── collect-weekly-snapshots.ts  # Data collection (unchanged)
```

### V2 Workflow

```
Monday 6 AM AEST:
  1. Collect last week's data → Supabase
  2. Auto-execute budget changes from weekly_budget_allocation (NO approval)
  3. AI analyzes for tactical opportunities (3-5 suggestions)
  4. Send Telegram report (budget execution + tactical recommendations)

You:
  - Review tactical recommendations in Telegram
  - Approve good ideas: /approve_1
  - Agent executes approved actions
```

---

## 🔄 Migration Steps

### Step 1: Understand the Philosophy Change

**V1 Philosophy:**
- AI decides everything → You approve everything

**V2 Philosophy:**
- **Strategic decisions** (budget allocation) = Preset & automated
- **Tactical decisions** (keywords, ads, bids) = AI suggests → You approve

### Step 2: Verify weekly_budget_allocation Table

This table is now the **source of truth** for budgets. Verify it exists and has data:

```sql
SELECT * FROM weekly_budget_allocation
WHERE week_start_date >= CURRENT_DATE
ORDER BY week_start_date
LIMIT 5;
```

Should see:
- `week_start_date` (Monday dates)
- `weekly_budget_aud` (total weekly budget)
- `market_heat` (seasonality factor)
- `product_allocations` (JSON with daily_budget per product)

### Step 3: Test Budget Executor

```bash
cd "Google Ads Agent/scripts/v2"
npx tsx budget-executor.ts
```

Expected output:
```
💰 BUDGET EXECUTOR V2
Auto-executing preset budget strategy...

Week: 2026-03-31
Market Heat: 0.96
Weekly Budget: $502.43 AUD

📊 VIC Selective Entry
   Phase: PEAK
   Current: ENABLED @ $22.01/day
   Target:  ENABLED @ $22.01/day
   ✓ Already correct (within 1% tolerance)

... (for all 6 campaigns)

✅ Budget execution complete
   Updates: 0
   Skipped: 6
   Failed: 0
```

### Step 4: Test Tactical Analyzer

```bash
npx tsx tactical-analyzer.ts
```

Expected output:
```
🎯 TACTICAL ANALYZER V2
AI analyzing performance for tactical opportunities...

Analyzing week: 2026-03-24
Total spend: $1,234.56
Total conversions: 12

✅ Analysis complete
   Recommendations generated: 3

Recommendations:
[
  {
    "type": "negative_keyword",
    "campaign": "VIC Selective Entry",
    "action": "Add 'free' as negative keyword",
    "reason": "30 clicks, $45 spent, 0 conversions",
    "impact": "Save ~$60/week"
  },
  ...
]
```

### Step 5: Test Full Weekly Agent V2

```bash
npx tsx index-weekly-v2.ts
```

Should run all 4 phases:
1. ✅ Data collection
2. ✅ Budget execution
3. ✅ AI tactical analysis
4. ✅ Telegram report

### Step 6: Update Cron Job

Replace V1 cron with V2:

**Old (V1):**
```cron
0 6 * * 1 cd /path && npx tsx "Google Ads Agent/scripts/index-weekly.ts"
```

**New (V2):**
```cron
0 6 * * 1 cd /path && npx tsx "Google Ads Agent/scripts/v2/index-weekly-v2.ts"
```

### Step 7: Archive V1 Files

Move old files to archive (don't delete yet, keep for reference):

```bash
# Already exists:
Google Ads Agent/archive/

# V1 files still in scripts/ are fine to keep
# V2 files in scripts/v2/ won't conflict
```

---

## 📋 Checklist

Before going live with V2:

- [ ] Verify `weekly_budget_allocation` table has current week data
- [ ] Test budget executor standalone (does it update budgets correctly?)
- [ ] Test tactical analyzer standalone (does it generate good recommendations?)
- [ ] Test full weekly agent end-to-end
- [ ] Update cron job to V2
- [ ] Test Telegram notifications (when implemented)
- [ ] Monitor first V2 run on Monday
- [ ] Verify budgets were auto-updated correctly

---

## 🚨 Important Notes

### Budget Execution is Automatic

**V2 DOES NOT ask for approval before updating budgets.**

It reads from `weekly_budget_allocation` table and immediately executes.

If you want to change budgets:
1. Update the `weekly_budget_allocation` table
2. Wait for next Monday (or run budget-executor.ts manually)
3. Budgets will auto-update

### Tactical Recommendations Still Need Approval

V2 still sends tactical recommendations to Telegram for your approval:
- Add negative keywords
- Adjust bids
- Pause/enable ads
- Add new keywords

You approve via Telegram: `/approve_1`, `/reject_2`, etc.

### Campaign Mapping

Budget executor uses this mapping:

```typescript
const CAMPAIGN_MAPPING = {
  'vic-selective': 'VIC Selective Entry',
  'nsw-selective': 'NSW Selective Entry',
  'year-5-naplan': 'Year 5 NAPLAN',
  'year-7-naplan': 'Year 7 NAPLAN',
  'acer-scholarship': 'ACER Scholarship',
  'edutest-scholarship': 'EduTest Scholarship',
};
```

If you rename campaigns in Google Ads, update this mapping in `budget-executor.ts`.

---

## 🎯 Expected Outcomes

After migrating to V2:

### Week 1 (First Monday V2 Runs)
- ✅ Budgets auto-updated to match current week allocation
- ✅ You receive Telegram report with budget execution summary
- ✅ You receive 3-5 tactical recommendations
- ✅ You approve/reject tactical suggestions
- ✅ No budget approvals needed

### Week 2+
- ✅ Same flow every Monday
- ✅ Budgets always aligned with preset strategy
- ✅ AI keeps finding tactical opportunities
- ✅ You spend 5 minutes reviewing (not 30 minutes approving)

### Time Savings
- **V1:** 30-45 min/week (approving budgets + tactics)
- **V2:** 5-10 min/week (approving tactics only)
- **Saved:** 25-35 min/week = ~20 hours/year

---

## 🆘 Troubleshooting

### Budget Executor Not Updating Budgets

**Problem:** Budgets don't match `weekly_budget_allocation` after running

**Check:**
1. Is current week data in `weekly_budget_allocation` table?
   ```sql
   SELECT * FROM weekly_budget_allocation WHERE week_start_date = '2026-03-31';
   ```

2. Are campaign names correct in CAMPAIGN_MAPPING?
   ```sql
   SELECT name FROM campaign WHERE status != 'REMOVED';
   ```

3. Check Google Ads API credentials:
   ```bash
   echo $GOOGLE_ADS_REFRESH_TOKEN
   ```

### Tactical Analyzer Returns Empty Recommendations

**Problem:** AI returns no recommendations

**Check:**
1. Is there data for current week in `google_ads_weekly_snapshots`?
   ```sql
   SELECT * FROM google_ads_weekly_snapshots ORDER BY week_start_date DESC LIMIT 1;
   ```

2. Check Anthropic API key:
   ```bash
   echo $ANTHROPIC_API_KEY
   ```

3. Check AI response in console (might be formatting error)

### Telegram Report Not Sending

**Problem:** No Telegram message received

**Not implemented yet!** The Telegram notification function is stubbed out in V2.

To implement:
1. Add Telegram bot token to .env
2. Implement `sendTelegramReport()` function in `index-weekly-v2.ts`
3. Use Telegram Bot API to send formatted message

---

## 📝 Summary

**V2 Simplifies Everything:**

✅ **Strategic decisions (budgets)** = Automated from preset table
✅ **Tactical decisions (keywords/ads/bids)** = AI suggests → You approve
✅ **Less manual work** = 5 min/week instead of 30 min/week
✅ **Faster execution** = Budgets update immediately
✅ **Better focus** = AI does what it's good at (tactics, not strategy)

**Migration is simple:**
1. Verify `weekly_budget_allocation` table
2. Test V2 scripts
3. Update cron job
4. Monitor first run

**Result:** Google Ads runs on autopilot with smart AI assistance.
