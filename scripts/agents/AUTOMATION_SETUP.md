# 🤖 Marketing Agent Automation - 3 Options

## Option 1: GitHub Actions (RECOMMENDED) ⭐

**Best for:** Production use, "set it and forget it"

### ✅ Pros:
- Runs automatically 24/7 in the cloud
- No need to keep your computer on
- Free for public repos, included in GitHub plans
- Email notifications on failure
- View logs in GitHub UI
- Most reliable option

### Setup (5 minutes):

1. **Add secrets to GitHub:**
   - Go to your repo → Settings → Secrets and variables → Actions
   - Click "New repository secret" and add:

   ```
   GOOGLE_ADS_CLIENT_ID = [your client ID from step 1]
   GOOGLE_ADS_CLIENT_SECRET = [your client secret from step 1]
   GOOGLE_ADS_DEVELOPER_TOKEN = [your developer token]
   GOOGLE_ADS_REFRESH_TOKEN = [your refresh token from OAuth flow]
   GOOGLE_ADS_CUSTOMER_ID = [your customer ID from Google Ads]
   VITE_SUPABASE_URL = [your Supabase URL from .env]
   SUPABASE_SERVICE_ROLE_KEY = [your service role key from .env]
   ```

2. **Commit the workflow file:**
   ```bash
   git add .github/workflows/google-ads-agent.yml
   git commit -m "Add Google Ads agent automation"
   git push
   ```

3. **Enable the workflow:**
   - Go to your repo → Actions tab
   - You'll see "Google Ads Marketing Agent"
   - Click "Enable workflow" if prompted

4. **Test it manually:**
   - Click "Run workflow" → "Run workflow"
   - Watch it execute in real-time

5. **Done!** It will now run:
   - **Daily at 6 AM AEST** (data collection)
   - **Monday at 6 AM AEST** (full optimization)

### Monitor:
- Go to Actions tab to see execution logs
- You'll get email if it fails
- Check Supabase for results

---

## Option 2: Claude Code `/loop` (DEVELOPMENT ONLY)

**Best for:** Testing, development, short-term monitoring

### ✅ Pros:
- Zero setup - works right now
- Great for testing before production
- Natural language commands

### ❌ Cons:
- Only runs while Claude Code is open
- Expires after 3 days
- Not suitable for production

### How to use:

In Claude Code, type:

```
/loop 24h npm run agents:google-ads:collect-data
```

Or for more natural language:

```
every day at 6am, run npm run agents:google-ads:collect-data
```

### Management:

```
what scheduled tasks do I have?
cancel the google ads task
```

### When to use:
- Testing the agent before going live
- Temporary monitoring during changes
- Development/debugging

---

## Option 3: Cloud Platform Cron

**Best for:** If you're already using Render/Railway/Fly.io

### Render (Recommended Cloud Option)

1. **Create Cron Job:**
   - Dashboard → New → Cron Job
   - Name: "Google Ads Data Collection"
   - Build Command: `npm install`
   - Start Command: `npm run agents:google-ads:collect-data`
   - Schedule: `0 20 * * *` (daily at 6 AM AEST)

2. **Add Environment Variables:**
   - Same as GitHub secrets above

3. **Create second Cron Job for weekly optimization:**
   - Name: "Google Ads Weekly Optimization"
   - Start Command: `npm run agents:google-ads`
   - Schedule: `0 20 * * 0` (Monday 6 AM AEST)

### Railway

```yaml
# railway.toml
[[crons]]
  schedule = "0 20 * * *"
  command = "npm run agents:google-ads:collect-data"

[[crons]]
  schedule = "0 20 * * 0"
  command = "npm run agents:google-ads"
```

### Fly.io

```toml
# fly.toml
[experimental]
  [[experimental.crons]]
    schedule = "0 20 * * *"
    command = ["npm", "run", "agents:google-ads:collect-data"]
```

---

## 🎯 Which Should You Choose?

### **For Production:** GitHub Actions ⭐
- Most reliable
- Free
- Easy monitoring
- No server needed

### **For Testing:** Claude Code `/loop`
- Quick to test
- No setup
- Good for development

### **If Already Hosting:** Render/Railway
- Integrate with existing infrastructure
- Managed platform

---

## 📊 Cron Schedule Reference

```
0 20 * * *     # Every day at 8 PM UTC (6 AM AEST)
0 20 * * 0     # Every Sunday at 8 PM UTC (Monday 6 AM AEST)
0 20 * * 1-5   # Weekdays only
0 20 1,15 * *  # 1st and 15th of month (bi-weekly)
```

**AEST to UTC conversion:**
- 6 AM AEST = 8 PM UTC (previous day)
- 9 AM AEST = 11 PM UTC (previous day)

---

## 🚀 Quick Start (Recommended)

1. **Week 1:** Test with Claude Code `/loop`
   ```
   /loop 24h npm run agents:google-ads:collect-data
   ```

2. **Week 2:** Deploy to GitHub Actions
   - Add secrets
   - Push workflow file
   - Enable and test

3. **Week 3+:** Monitor and enjoy automated optimization!

---

## 📝 Next Steps

After automation is set up:

1. **Monitor first week** - Check GitHub Actions logs daily
2. **Review negative keywords** - Approve flagged terms in Supabase
3. **Analyze results** - Check weekly summaries
4. **Fine-tune** - Adjust configuration based on performance

**Your agent is ready to run on autopilot!** 🤖
