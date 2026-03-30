# Google Ads Weekly Automation (V2)

## Overview

The Google Ads Agent V2 runs **every Monday at 6 AM AEST** via GitHub Actions.

It focuses on **strategic budget execution** based on your predefined calendar, while keeping tactical decisions (keywords, ads, bids) for monthly manual review.

---

## What It Does Every Week

### Phase 1: Data Collection
**Status:** Currently skipped (TODO: port to V2)
- Will collect weekly performance snapshots
- Stores data in `google_ads_weekly_snapshots` table

### Phase 2: Budget Execution (AUTOMATED - No Approval Needed)
✅ **Reads from:** `weekly_budget_allocation` table in Supabase
✅ **Executes automatically:** Budget changes based on market phase

**Actions:**
1. Fetches current week's budget allocation
2. Compares Google Ads budgets with target budgets
3. Updates budgets if difference > 1%
4. Updates campaign status (ENABLED/PAUSED) based on phase

**Example:** Week of April 6, 2026
- Year 5 NAPLAN: $8.46 → $0.85 (POST_TEST phase)
- Year 7 NAPLAN: $8.46 → $0.85 (POST_TEST phase)
- EduTest: $18.28 → $6.11 (EARLY_AWARENESS)
- ACER: $4.40 → $3.31 (BASELINE)
- NSW: $10.16 → $8.49 (CONSIDERATION)
- VIC: $22.01 → $22.07 (PEAK)

### Phase 3: AI Tactical Analysis
**Status:** Currently skipped (no data being collected)
- Will analyze performance when data collection is ported
- AI generates 3-5 tactical recommendations
- Focus: negative keywords, new keywords, bid adjustments, ad copy

### Phase 4: Telegram Report
✅ **Sends to:** Your Telegram bot
✅ **Format:** Plain text with emojis

**Report includes:**
- Budget execution summary (updated/unchanged/failed)
- Campaign-by-campaign status
- Tactical recommendations (when available)
- Next update time

---

## How It Works

### Automated Schedule
```yaml
Schedule: Every Monday 6 AM AEST (Sunday 8 PM UTC)
Platform: GitHub Actions
Trigger: Cron job
Manual: Can trigger via GitHub Actions UI
```

### Budget Allocation Logic

The agent follows this decision tree:

```
1. Check current week in weekly_budget_allocation table
2. For each campaign:
   a. Get target daily_budget and phase
   b. Compare with current Google Ads budget
   c. If difference > 1%:
      - Update budget in Google Ads
      - Log as "success"
   d. If difference ≤ 1%:
      - Skip update (within tolerance)
      - Log as "skipped"
   e. Update campaign status:
      - If phase = PAUSED → Set status to PAUSED
      - If phase ≠ PAUSED → Set status to ENABLED
3. Send summary to Telegram
```

### Example Telegram Report

```
📊 GOOGLE ADS WEEKLY REPORT
Monday, April 6, 2026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 BUDGET EXECUTION (Automated)

✅ VIC Selective Entry
   $22.01/day → $22.07/day (+0%)
   Phase: PEAK

✅ NSW Selective Entry
   $10.16/day → $8.49/day (-16%)
   Phase: CONSIDERATION

✅ Year 5 NAPLAN
   $8.46/day → $0.85/day (-90%)
   Phase: POST_TEST

✅ Year 7 NAPLAN
   $8.46/day → $0.85/day (-90%)
   Phase: POST_TEST

✅ ACER Scholarship
   $4.40/day → $3.31/day (-25%)
   Phase: BASELINE

✅ EduTest Scholarship
   $18.28/day → $6.11/day (-67%)
   Phase: EARLY_AWARENESS

Budgets: 6 updated, 0 unchanged
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 TACTICAL RECOMMENDATIONS

No recommendations this week.
Campaigns performing well! 🎉
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Next update: Monday 6 AM AEST
```

---

## Managing the Weekly Budget Allocation

### Where to Update Budgets

**Database:** Supabase → `weekly_budget_allocation` table

**Columns:**
- `week_start_date` - Monday of the week (YYYY-MM-DD)
- `market_heat` - 0.0 to 1.0 intensity score
- `weekly_budget_aud` - Total weekly budget
- `product_allocations` - JSON with per-product budgets

### Example Budget Entry

```json
{
  "week_start_date": "2026-04-06",
  "market_heat": 0.36,
  "weekly_budget_aud": 291.73,
  "product_allocations": {
    "vic-selective": {
      "phase": "PEAK",
      "daily_budget": 22.07,
      "weekly_budget": 154.48
    },
    "nsw-selective": {
      "phase": "CONSIDERATION",
      "daily_budget": 8.49,
      "weekly_budget": 59.42
    },
    "year-5-naplan": {
      "phase": "POST_TEST",
      "daily_budget": 0.85,
      "weekly_budget": 5.94
    },
    "year-7-naplan": {
      "phase": "POST_TEST",
      "daily_budget": 0.85,
      "weekly_budget": 5.94
    },
    "acer-scholarship": {
      "phase": "BASELINE",
      "daily_budget": 3.31,
      "weekly_budget": 23.17
    },
    "edutest-scholarship": {
      "phase": "EARLY_AWARENESS",
      "daily_budget": 6.11,
      "weekly_budget": 42.78
    }
  }
}
```

### Valid Phases

- `PEAK` - Maximum spend (major test dates)
- `RAMP_UP` - Building awareness before tests
- `CONSIDERATION` - Moderate engagement
- `EARLY_AWARENESS` - Low baseline presence
- `BASELINE` - Minimum viable presence
- `POST_TEST` - Minimal spend (tests completed)
- `PAUSED` - Campaign disabled

---

## Manual Intervention

### When to Update Budget Allocation

Update the `weekly_budget_allocation` table when:
- 🗓️ Test dates change
- 💰 Overall marketing budget changes
- 📊 Campaign priorities shift
- 🎯 New products launch

### How to Check Budget Allocation

```bash
npx tsx "Google Ads Agent/scripts/check-budget-allocation.ts"
```

This shows:
- Current week's allocation
- Next 4 weeks of planned budgets
- Phase for each product
- Daily and weekly budget breakdown

### Manual Agent Run

To test or run outside schedule:

```bash
npx tsx "Google Ads Agent/scripts/v2/index-weekly-v2.ts"
```

Or trigger via GitHub Actions UI:
1. Go to repository → Actions tab
2. Select "Google Ads Weekly AI Agent"
3. Click "Run workflow"

---

## File Structure

```
Google Ads Agent/
├── scripts/v2/
│   ├── index-weekly-v2.ts       # Main orchestrator
│   ├── budget-executor.ts        # Phase 2: Auto-execute budgets
│   ├── tactical-analyzer.ts      # Phase 3: AI recommendations
│   └── telegram-notifier.ts      # Phase 4: Send reports
├── WEEKLY_AUTOMATION.md          # This file
└── MONTHLY_AUDIT_GUIDE.md        # Manual monthly deep-dive
```

---

## Troubleshooting

### No Telegram Message Received

**Check:**
1. Is GitHub Actions workflow enabled?
2. Are secrets configured in GitHub?
3. Check workflow logs in Actions tab
4. Run manually to test: `npx tsx "Google Ads Agent/scripts/v2/index-weekly-v2.ts"`

### Budget Not Updating

**Check:**
1. Is `weekly_budget_allocation` table populated for current week?
2. Is difference > 1% (anything less is within tolerance)?
3. Check Google Ads API credentials are valid
4. Review workflow logs for errors

### Wrong Week Being Used

The agent uses **Monday of the current week** as the key to lookup budgets.

Example:
- Today: Tuesday, April 8, 2026
- Week used: Monday, April 6, 2026

---

## Performance Impact

**Time Saved:**
- Manual budget updates: ~30-45 min/week
- With automation: 0 min/week
- **Annual savings: ~26-39 hours**

**Risk Mitigation:**
- Budget changes follow preset strategy (no AI guessing)
- 1% tolerance prevents micro-adjustments
- Telegram notifications keep you informed
- Can always override manually in Google Ads

---

## Next Steps

### To Complete V2 (Optional)

1. **Port data collection to V2**
   - Move `WeeklySnapshotCollector` to V2 architecture
   - Remove dependencies on old shared modules
   - Enable Phase 1 in `index-weekly-v2.ts`

2. **Enable AI tactical recommendations**
   - Will automatically work once data collection is ported
   - AI will analyze weekly performance
   - 3-5 recommendations sent via Telegram

3. **Add interactive Telegram approvals** (future)
   - `/approve_1` and `/reject_1` commands
   - Store recommendations in database
   - Execute approved changes

---

## Best Practices

✅ **DO:**
- Update budget allocation 2-3 weeks in advance
- Check Telegram every Monday morning
- Review GitHub Actions logs monthly
- Keep secrets up to date

❌ **DON'T:**
- Change budgets directly in Google Ads (agent will overwrite)
- Add weeks with gaps (agent needs continuous data)
- Set phases without understanding impact
- Ignore Telegram failure notifications

---

## Support

**Issues/Questions:**
- GitHub Actions logs: Check repository → Actions tab
- Manual run for debugging: See "Manual Agent Run" above
- Update allocation: Edit `weekly_budget_allocation` in Supabase
- Telegram issues: Test with `npx tsx "Google Ads Agent/scripts/test-telegram.ts"`
