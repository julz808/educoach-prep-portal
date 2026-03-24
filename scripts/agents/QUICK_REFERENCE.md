# 🚀 Google Ads Agent - Quick Reference

## 📋 Commands

```bash
# Test without making changes
npm run agents:google-ads:dry-run

# Daily data collection (no changes)
npm run agents:google-ads:collect-data

# Full optimization (makes changes!)
npm run agents:google-ads

# Helper scripts
npx tsx scripts/agents/google-ads/show-campaigns.ts
npx tsx scripts/agents/google-ads/show-negative-keywords.ts
npx tsx scripts/agents/google-ads/list-accounts.ts
```

## 🤖 Automation

### GitHub Actions (Recommended)
1. Add secrets to GitHub → Settings → Secrets
2. Push workflow file (already created!)
3. Enable in Actions tab

### Claude Code
```
/loop 24h npm run agents:google-ads:collect-data
```

## 📊 What It Does

✅ **Daily (6 AM AEST):**
- Collects performance data
- Flags negative keywords
- Checks for critical issues
- NO changes made

✅ **Weekly (Monday 6 AM AEST):**
- Adjusts budgets (±25% max)
- Pauses underperformers
- Graduates to Maximize Conversions
- Analyzes ad copy
- Executes approved changes

## 🎯 Current Status

- ✅ Connected to Google Ads
- ✅ 6 campaigns mapped
- ✅ 31 negative keywords flagged
- ✅ Database schema deployed
- ⏳ Automation: YOUR CHOICE
- ⏳ Review approvals in Supabase

## 📈 Expected Results

- **Week 1-2:** Baseline data collection
- **Week 3-4:** First optimizations
- **Week 5-8:** 15-30% CAC reduction
- **Annual:** $8k-14k saved

## 🔗 Important Links

- Full docs: `scripts/agents/FINAL_SUMMARY.md`
- Automation: `scripts/agents/AUTOMATION_SETUP.md`
- Schedule: `scripts/agents/RECOMMENDED_SCHEDULE.md`

## ⚡ Quick Start

1. **Choose automation:**
   - GitHub Actions (best)
   - Claude Code `/loop` (test)

2. **Enable it**

3. **Review approvals weekly**

Done! 🎉
