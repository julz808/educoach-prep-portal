# Recommended Agent Schedule

## 📅 Optimal Schedule

### **Daily (Every Morning at 6 AM AEST)**

```bash
npm run agents:google-ads:collect-data
```

**What it does:**
- ✅ Collects yesterday's performance data
- ✅ Saves to database for trending
- ✅ Flags new negative keywords
- ✅ Checks for critical issues (CPA spikes, zero conversions)
- ❌ **Does NOT make any changes**

**Why daily?**
- Catch problems early (CPA spike, budget depletion)
- Build historical data faster
- Better trend analysis
- Faster negative keyword detection

**Runtime:** ~5-10 seconds

---

### **Weekly (Every Monday at 6 AM AEST)**

```bash
npm run agents:google-ads
```

**What it does:**
- ✅ Everything from daily collection PLUS:
- ✅ Adjusts budgets based on seasonality (±25% max)
- ✅ Pauses campaigns exceeding CPA thresholds
- ✅ Graduates campaigns to Maximize Conversions
- ✅ Saves weekly summary

**Why weekly?**
- Google Ads needs 3-7 days to learn from changes
- Prevents thrashing (constant changes hurt performance)
- Aligns with ±25% weekly change limit
- Gives you time to review over the weekend

**Runtime:** ~15-20 seconds

---

## 🤖 Automation Setup

### **Option 1: GitHub Actions (Recommended)**

Create `.github/workflows/google-ads-agent.yml`:

```yaml
name: Google Ads Agent

on:
  schedule:
    # Daily data collection: 6 AM AEST = 8 PM UTC (previous day)
    - cron: '0 20 * * *'
    # Weekly optimization: Monday 6 AM AEST = Sunday 8 PM UTC
    - cron: '0 20 * * 0'
  workflow_dispatch: # Manual trigger

jobs:
  determine-mode:
    runs-on: ubuntu-latest
    outputs:
      mode: ${{ steps.check-day.outputs.mode }}
    steps:
      - name: Check if Monday
        id: check-day
        run: |
          if [ "$(date +%u)" = "1" ]; then
            echo "mode=full" >> $GITHUB_OUTPUT
          else
            echo "mode=collect" >> $GITHUB_OUTPUT
          fi

  run-agent:
    needs: determine-mode
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run agent (data collection)
        if: needs.determine-mode.outputs.mode == 'collect'
        run: npm run agents:google-ads:collect-data
        env:
          GOOGLE_ADS_CLIENT_ID: ${{ secrets.GOOGLE_ADS_CLIENT_ID }}
          GOOGLE_ADS_CLIENT_SECRET: ${{ secrets.GOOGLE_ADS_CLIENT_SECRET }}
          GOOGLE_ADS_DEVELOPER_TOKEN: ${{ secrets.GOOGLE_ADS_DEVELOPER_TOKEN }}
          GOOGLE_ADS_REFRESH_TOKEN: ${{ secrets.GOOGLE_ADS_REFRESH_TOKEN }}
          GOOGLE_ADS_CUSTOMER_ID: ${{ secrets.GOOGLE_ADS_CUSTOMER_ID }}
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}

      - name: Run agent (full optimization)
        if: needs.determine-mode.outputs.mode == 'full'
        run: npm run agents:google-ads
        env:
          GOOGLE_ADS_CLIENT_ID: ${{ secrets.GOOGLE_ADS_CLIENT_ID }}
          GOOGLE_ADS_CLIENT_SECRET: ${{ secrets.GOOGLE_ADS_CLIENT_SECRET }}
          GOOGLE_ADS_DEVELOPER_TOKEN: ${{ secrets.GOOGLE_ADS_DEVELOPER_TOKEN }}
          GOOGLE_ADS_REFRESH_TOKEN: ${{ secrets.GOOGLE_ADS_REFRESH_TOKEN }}
          GOOGLE_ADS_CUSTOMER_ID: ${{ secrets.GOOGLE_ADS_CUSTOMER_ID }}
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

**Setup:**
1. Go to GitHub → Settings → Secrets → Actions
2. Add these secrets:
   - `GOOGLE_ADS_CLIENT_ID`
   - `GOOGLE_ADS_CLIENT_SECRET`
   - `GOOGLE_ADS_DEVELOPER_TOKEN`
   - `GOOGLE_ADS_REFRESH_TOKEN`
   - `GOOGLE_ADS_CUSTOMER_ID`
   - `VITE_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

---

### **Option 2: Vercel Cron**

If you're hosting on Vercel, create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/google-ads-collect",
      "schedule": "0 20 * * *"
    },
    {
      "path": "/api/cron/google-ads-optimize",
      "schedule": "0 20 * * 0"
    }
  ]
}
```

Then create the API endpoints:

`api/cron/google-ads-collect.ts`:
```typescript
import { exec } from 'child_process';

export default async function handler(req, res) {
  exec('npm run agents:google-ads:collect-data', (error, stdout) => {
    if (error) {
      res.status(500).json({ error: stderr });
    } else {
      res.status(200).json({ success: true, output: stdout });
    }
  });
}
```

---

## 📊 What This Schedule Achieves

### **Monday:**
- Full optimization runs
- Budgets adjusted for the week
- Underperformers paused
- Graduations executed

### **Tuesday-Sunday:**
- Data collection only
- Monitor for issues
- Flag new negative keywords
- Build historical data

### **Result:**
- ✅ Daily monitoring for problems
- ✅ Weekly optimization for performance
- ✅ 7 days of data to inform decisions
- ✅ Google Ads has time to learn

---

## 🎯 Conservative Alternative

If you want to start slow:

### **Bi-Weekly Schedule:**
- **Daily**: Data collection (monitoring)
- **Every Other Monday**: Full optimization (changes)

This gives Google Ads 14 days to learn from each change.

**To implement:**
Change the cron to:
```yaml
# Every other Monday (1st and 3rd Monday of month)
- cron: '0 20 1,15 * 1'
```

---

## 📈 Performance Tracking

After implementing this schedule, track:

1. **Week 1-2**: Baseline (just monitoring)
2. **Week 3-4**: First optimizations applied
3. **Week 5-8**: Measure CAC reduction
4. **Week 9-12**: Fine-tune based on results

**Expected timeline to results:**
- **2 weeks**: Negative keywords start saving money
- **4 weeks**: Budget optimization shows impact
- **6-8 weeks**: Full CAC reduction visible (15-30%)

---

## 🚨 Emergency Override

If you need to pause the agent:

### **Option 1: Disable in GitHub**
Go to Actions → Google Ads Agent → Disable workflow

### **Option 2: Add kill switch**
Add to `.env`:
```bash
AGENT_ENABLED=false
```

Then update the agent to check this at startup.

---

## 📝 Next Steps

1. ✅ **Today**: Set up GitHub Actions workflow
2. ✅ **This Week**: Monitor daily data collection
3. ✅ **Next Monday**: First optimization run
4. ⏳ **Week 2-4**: Review and adjust
5. ⏳ **Month 2**: Build Ad Copy Optimizer
6. ⏳ **Month 3**: Add Email Notifications

---

## 💡 Pro Tips

1. **Review Saturdays** - Check pending approvals over the weekend
2. **Monday Morning** - Review optimization changes before they execute
3. **Mid-week Check** - Wednesday quick check for critical issues
4. **Monthly Review** - Last Friday of month, full performance analysis

**Your agent is ready to run on schedule!** 🚀
