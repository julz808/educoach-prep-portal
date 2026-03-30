# SEO Agent - Setup Guide

## ✅ What's Been Created

### 1. Folder Structure
```
SEO Agent/
├── README.md                          ✅ Complete documentation
├── SEO_TIME_LAG_STRATEGY.md           ✅ 10-week time lag explanation
├── SETUP_GUIDE.md                     ✅ This file
├── scripts/
│   └── seo-seasonality-calculator.ts  ✅ Time lag calculator
├── migrations/
│   └── 001_seo_weekly_snapshots.sql   ✅ Database schema
└── test-seasonality.mjs               ✅ Test script
```

### 2. Database Migration Created

**File:** `SEO Agent/migrations/001_seo_weekly_snapshots.sql`

**Tables to be created:**
- ✅ `seo_weekly_snapshots` - Weekly performance data
- ✅ `seo_weekly_blog_posts` - Individual post tracking
- ✅ `seo_weekly_keywords` - Keyword ranking tracking
- ✅ `seo_backlink_opportunities` - Backlink discovery
- ✅ `seo_acquired_backlinks` - Backlink profile tracking
- ✅ `seo_agent_actions` - AI recommendations + attribution
- ✅ `seo_competitor_content` - Competitor analysis

**Views created:**
- ✅ `vw_current_week_seo_performance` - Current week summary
- ✅ `vw_pending_seo_approvals` - Pending recommendations
- ✅ `vw_top_performing_posts` - Best posts (last 4 weeks)
- ✅ `vw_keyword_position_improvements` - Ranking winners
- ✅ `vw_backlink_opportunities_ready` - Ready for outreach
- ✅ `vw_seo_attribution_success_rate` - Agent success rate
- ✅ `vw_seo_week_over_week` - WoW comparison

### 3. Time Lag Logic Implemented

**File:** `SEO Agent/scripts/seo-seasonality-calculator.ts`

**Key features:**
- Applies 10-week offset to Google Ads calendar
- Calculates posts/week per product
- Stops writing when test <10 weeks away
- Works with `weekly_budget_allocation.json`

**Test it:**
```bash
node --import tsx "SEO Agent/test-seasonality.mjs"
```

---

## 🚀 Next Steps: Run the Database Migration

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase dashboard
2. Click on **SQL Editor** in the left sidebar
3. Create a new query
4. Copy the entire contents of `SEO Agent/migrations/001_seo_weekly_snapshots.sql`
5. Paste into the editor
6. Click **Run** (bottom right)
7. You should see "Success. No rows returned"

### Option 2: Supabase CLI

```bash
# If you have supabase CLI installed
supabase db push

# Or run the migration directly
psql $DATABASE_URL -f "SEO Agent/migrations/001_seo_weekly_snapshots.sql"
```

### Option 3: npx supabase

```bash
# If using local supabase
npx supabase db reset
```

---

## 🔍 Verify Migration Success

After running the migration, verify tables were created:

```sql
-- Run this in Supabase SQL Editor
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'seo_%'
ORDER BY table_name;
```

**You should see:**
- seo_acquired_backlinks
- seo_agent_actions
- seo_backlink_opportunities
- seo_competitor_content
- seo_weekly_blog_posts
- seo_weekly_keywords
- seo_weekly_snapshots

**Also verify views:**
```sql
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name LIKE 'vw_%seo%'
ORDER BY table_name;
```

---

## 📋 What's Still TODO

### Phase 1: Data Collection (Next Priority)

**Need to build:**
- [ ] `collect-seo-snapshots.ts` - Fetches data from:
  - Ghost CMS API (blog posts)
  - Google Search Console API (rankings)
  - Competitor scraping
  - Seasonal calculation (using seo-seasonality-calculator.ts)

**APIs required:**
- ✅ Ghost CMS API (you already have)
- ⏳ Google Search Console API (need to set up)
- ⏳ Optional: Ahrefs API ($99/month) or use free alternatives

### Phase 2: AI Analysis

**Need to build:**
- [ ] `analyze-with-ai.ts` - Claude AI analyzes data
- [ ] `seo-rules-engine.ts` - Validates recommendations
- [ ] `telegram-notifier.ts` - Sends approvals (can copy from Google Ads)

### Phase 3: Content Generation

**Need to build:**
- [ ] `execute-approved-actions.ts` - Generates blog posts
- [ ] `content-generator.ts` - Claude writes full posts
- [ ] `backlink-hunter.ts` - Finds opportunities
- [ ] `seo-client.ts` - Ghost + GSC API wrapper

### Phase 4: Orchestration

**Need to build:**
- [ ] `index-weekly.ts` - Runs all 3 phases
- [ ] `.github/workflows/seo-agent-weekly.yml` - GitHub Actions

---

## 🔑 Environment Variables Needed

Add these to your `.env` file:

```bash
# Ghost CMS (you already have these)
GHOST_API_URL=https://your-ghost-site.com
GHOST_ADMIN_API_KEY=your_admin_api_key

# Google Search Console (need to set up)
GOOGLE_SEARCH_CONSOLE_CLIENT_ID=your_client_id
GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET=your_client_secret
GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN=your_refresh_token
GOOGLE_SEARCH_CONSOLE_SITE_URL=https://educourse.com.au

# Supabase (you already have these)
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Anthropic (you already have this)
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Telegram (you already have these from Google Ads)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# Optional: Ahrefs API (for backlinks)
AHREFS_API_TOKEN=your_ahrefs_token
```

---

## 📊 Expected Timeline

**This Week (Week 1):**
- ✅ Database migration
- ✅ Time lag calculator
- ✅ Documentation

**Week 2:**
- [ ] Set up Google Search Console API
- [ ] Build collect-seo-snapshots.ts
- [ ] Test data collection locally

**Week 3:**
- [ ] Build analyze-with-ai.ts
- [ ] Build seo-rules-engine.ts
- [ ] Test AI analysis locally

**Week 4:**
- [ ] Build execute-approved-actions.ts
- [ ] Build content-generator.ts
- [ ] Test full workflow locally

**Week 5:**
- [ ] Build backlink-hunter.ts
- [ ] Deploy to GitHub Actions
- [ ] First automated run!

---

## 🧪 Testing the Time Lag Calculator

Run this to see how the 10-week lag works:

```bash
node --import tsx "SEO Agent/test-seasonality.mjs"
```

**Expected output:**
```
📊 SEO Content Allocation Report (10-Week Time Lag Applied)
================================================================================

Total posts this week: 9
Active products: 3/6

🟢 VIC Selective
   Weeks until test: 11
   Google Ads phase: RAMP_UP
   SEO phase: IMMINENT (accounting for 10-week lag)
   Posts this week: 3
   Reasoning: Test is 11 weeks away. SEO phase IMMINENT...

⚪ NSW Selective
   Weeks until test: 4
   Google Ads phase: PEAK
   SEO phase: POST_TEST (accounting for 10-week lag)
   Posts this week: 0
   Reasoning: Test is 4 weeks away (< 10 week SEO lag). Content won't rank in time - STOP writing.
```

This shows:
- VIC Selective (11 weeks): Write 3 posts (will rank by test day)
- NSW Selective (4 weeks): STOP writing (won't rank in time)
- NAPLAN (49 weeks): Too early

---

## 📚 Key Documents

1. **README.md** - Complete documentation (like Google Ads README)
2. **SEO_TIME_LAG_STRATEGY.md** - Deep dive on 10-week lag
3. **SETUP_GUIDE.md** - This file (setup steps)
4. **migrations/001_seo_weekly_snapshots.sql** - Database schema

---

## ❓ FAQ

### Q: Do I need Ahrefs API?

**A:** No! You can start with free alternatives:
- Google Search Console (free) - keyword rankings
- Manual backlink tracking in database (free)
- SerpAPI ($50/month) - competitor analysis

Add Ahrefs later if needed ($99/month).

### Q: Why 10 weeks specifically?

**A:** Industry data shows blog posts take 8-12 weeks to rank on page 1. We use 10 weeks as a conservative estimate. See `SEO_TIME_LAG_STRATEGY.md` for details.

### Q: Can I run this without Google Search Console?

**A:** Not really - you need GSC for keyword rankings and impressions/clicks. It's free and essential for SEO tracking.

### Q: How is this different from the old SEO agent?

**Old agent:**
- Generated 4 posts blindly
- No tracking
- No attribution
- No seasonal awareness

**New agent:**
- Analyzes data first
- Tracks performance week-over-week
- Measures if content actually ranks
- Follows test calendar (10-week lag)
- Learns what works over time

---

## 🎯 Success Metrics

After the SEO agent is fully running, you should see:

**Month 1:**
- 12-16 blog posts published
- Complete tracking setup
- First attribution data

**Month 3:**
- 2,000-5,000 organic clicks/month
- 50+ keywords ranking top 50
- 10-20 new backlinks

**Month 6:**
- 5,000-15,000 organic clicks/month
- 80-100 keywords ranking top 10
- $4,000-10,000 revenue from organic

**Month 12:**
- 15,000-30,000 organic clicks/month
- $10,000-30,000 revenue from organic
- SEO agent pays for itself 10-20x

---

## 🆘 Need Help?

1. Check the main `README.md` for architecture details
2. Check `SEO_TIME_LAG_STRATEGY.md` for time lag explanation
3. Compare with `Google Ads Agent/README.md` for reference
4. Test the seasonality calculator to understand allocation logic

---

## ✅ Current Status

**Completed:**
- [x] Folder structure created
- [x] Database schema designed
- [x] Time lag calculator implemented
- [x] Documentation written
- [x] Test script created

**Next Steps:**
1. Run the database migration in Supabase
2. Set up Google Search Console API
3. Build data collection script

**Ready to proceed?** Run the migration, then we'll build Phase 1 (data collection)!
