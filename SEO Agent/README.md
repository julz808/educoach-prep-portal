# SEO Agent - Autonomous Content & Backlink Engine

**Automated SEO optimization powered by Claude AI with seasonal intelligence (10-week time lag)**

---

## Table of Contents

1. [What This Does](#what-this-does)
2. [How It Works](#how-it-works)
3. [File Structure](#file-structure)
4. [Key Difference from Google Ads Agent](#key-difference-from-google-ads-agent)
5. [Setup Instructions](#setup-instructions)
6. [Weekly Workflow](#weekly-workflow)
7. [The SEO Hard Rules](#the-seo-hard-rules)
8. [Backlink Automation](#backlink-automation)
9. [Time Lag Strategy](#time-lag-strategy)
10. [Database Schema](#database-schema)

---

## What This Does

An AI-powered SEO agent that runs automatically every Monday at 9 AM AEST to:

✅ **Collect weekly snapshots** of blog posts, keyword rankings, and backlinks
✅ **Analyze performance** using Claude AI with SEO hard rules
✅ **Generate content recommendations** based on test calendar (10-week time lag)
✅ **Find backlink opportunities** from competitor analysis
✅ **Send to Telegram** with detailed reasoning and expected impact
✅ **Track attribution** week-over-week (did content actually rank?)

**Key Difference from Google Ads Agent:**
- **Google Ads:** Instant results → 0-day lag
- **SEO:** Takes 8-12 weeks to rank → **10-week time lag applied**

---

## How It Works

### Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│    GitHub Actions (Every Monday 9 AM AEST)          │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│  PHASE 1: Data Collection (Deterministic)           │
│  ├─ Fetch Ghost CMS posts                           │
│  ├─ Fetch Google Search Console rankings            │
│  ├─ Scrape competitor sites for new content         │
│  ├─ Calculate seasonal context (10-week lag)        │
│  └─ Save to Supabase (seo_weekly_snapshots)         │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│  PHASE 2: AI Analysis & Recommendations             │
│  ├─ Load last week's snapshot from Supabase         │
│  ├─ Send to Claude with SEO hard rules              │
│  ├─ Claude analyzes content gaps + backlink opps    │
│  ├─ Generate 2-5 blog post outlines (seasonal)      │
│  └─ Send to Telegram for human approval             │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│  PHASE 3: Content Generation (On Approval)          │
│  ├─ Human approves recommendations via Telegram     │
│  ├─ Agent generates full blog posts (2,000+ words)  │
│  ├─ Publishes to Ghost as drafts                    │
│  ├─ Generates backlink outreach emails              │
│  └─ Saves attribution data for next week            │
└─────────────────────────────────────────────────────┘
```

### Three-Phase Architecture

**Why three phases?**

1. **Deterministic data collection** - Phase 1 collects raw data without AI interpretation
2. **AI analysis** - Phase 2 can be re-run multiple times on same data snapshot
3. **Execution** - Phase 3 only runs on approved recommendations
4. **Cost efficiency** - Only Phase 2 & 3 use Claude API (can retry Phase 2 without re-fetching data)
5. **Attribution** - Each week's snapshot is frozen in time for accurate week-over-week comparison

---

## File Structure

```
SEO Agent/
├── README.md                          # This file
├── SEO_TIME_LAG_STRATEGY.md           # 10-week time lag explanation
├── scripts/
│   ├── collect-seo-snapshots.ts      # Phase 1: Data collection
│   ├── analyze-with-ai.ts            # Phase 2: AI analysis
│   ├── execute-approved-actions.ts   # Phase 3: Content generation
│   ├── index-weekly.ts               # Orchestrator (runs all 3 phases)
│   ├── seo-client.ts                 # Ghost + Google Search Console APIs
│   ├── seo-rules-engine.ts           # Hard rules enforcement
│   ├── seo-seasonality-calculator.ts # 10-week time lag calculator
│   ├── backlink-hunter.ts            # Backlink opportunity finder
│   ├── content-generator.ts          # Claude-powered blog writer
│   ├── telegram-notifier.ts          # Telegram integration
│   └── get-seo-status.ts             # View current SEO state
└── migrations/
    └── 001_seo_weekly_snapshots.sql  # Database schema
```

---

## Key Difference from Google Ads Agent

### Google Ads Agent (0-day lag)

- Turn on campaign → immediate impressions/clicks
- Test is 12 weeks away → start ads NOW at RAMP_UP phase
- **Lag time: ~0 days**

### SEO Agent (10-week lag)

- Publish post → takes 8-12 weeks to rank on page 1
- Test is 12 weeks away → **STOP WRITING** (content won't rank in time!)
- Test is 22 weeks away → START WRITING (content will rank by week 12)
- **Lag time: 10 weeks**

### Side-by-Side Comparison

| Week | Weeks Until Test | Google Ads Phase | Google Ads Budget | SEO Phase (10-week lag) | SEO Posts/Week |
|---|---|---|---|---|---|
| Feb 23 | 17 weeks | EARLY | $20/day (40%) | PEAK | 5 posts/week |
| Mar 23 | 13 weeks | RAMP_UP | $35/day (70%) | PEAK | 5 posts/week |
| Apr 6 | 11 weeks | RAMP_UP | $35/day (70%) | IMMINENT | 3 posts/week |
| Apr 27 | **8 weeks** | **PEAK** 🔥 | **$50/day (100%)** | **POST_TEST** 🛑 | **0 posts** (STOP!) |
| May 18 | 5 weeks | LATE | $42/day (85%) | POST_TEST | 0 posts |

**Key insight:** When Google Ads enters PEAK phase, SEO should STOP writing because content won't rank in time!

See [SEO_TIME_LAG_STRATEGY.md](./SEO_TIME_LAG_STRATEGY.md) for full details.

---

## Setup Instructions

### 1. Prerequisites

You need:
- **Ghost CMS API** (Admin API key)
- **Google Search Console API** (OAuth2 credentials)
- **Supabase database** (see [Database Schema](#database-schema))
- **Anthropic API key** (for Claude)
- **Telegram bot token** (for notifications)

### 2. Environment Variables

Create `.env` file (or add to existing):

```bash
# Ghost CMS
GHOST_API_URL=https://your-ghost-site.com
GHOST_ADMIN_API_KEY=your_admin_api_key

# Google Search Console
GOOGLE_SEARCH_CONSOLE_CLIENT_ID=your_client_id
GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET=your_client_secret
GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN=your_refresh_token

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
psql -h your-supabase-host -U postgres -d postgres -f "SEO Agent/migrations/001_seo_weekly_snapshots.sql"
```

Or manually create tables using SQL in `migrations/001_seo_weekly_snapshots.sql`.

### 4. Test Locally

```bash
# Test seasonality calculator
node --import tsx "SEO Agent/test-seasonality.mjs"

# Test Phase 1 (data collection)
npm run seo:collect

# Test Phase 2 (AI analysis)
npm run seo:analyze

# Test Phase 3 (content generation)
npm run seo:execute

# Or run all 3 phases together
npm run seo:weekly
```

### 5. Deploy to Production

GitHub Actions automatically runs every Monday 9 AM AEST:

```yaml
# .github/workflows/seo-agent-weekly.yml
name: SEO Agent Weekly
on:
  schedule:
    - cron: '0 23 * * 0'  # Sunday 11 PM UTC = Monday 9 AM AEST
  workflow_dispatch:      # Manual trigger
```

---

## Weekly Workflow

### Monday 9:00 AM - Phase 1: Data Collection

```
🔍 Collecting SEO Weekly Snapshot
────────────────────────────────────────

Fetching Ghost CMS posts...
✓ Found 47 published posts (+3 since last week)

Fetching Google Search Console data (last 7 days)...
✓ 217 keywords tracked
✓ 12,345 impressions (+8.5% WoW)
✓ 543 clicks (+12.3% WoW)
✓ Average position: 28.4 (-2.1 WoW - improving!)

Scraping competitor sites...
✓ competitor1.com: 2 new blog posts this week
✓ competitor2.com: 1 new blog post this week

Calculating seasonal phases (10-week time lag)...
✓ VIC Selective: 11 weeks until test → IMMINENT (3 posts/week)
✓ NSW Selective: 4 weeks until test → POST_TEST (0 posts - STOP!)
✓ Year 5 NAPLAN: 49 weeks until test → TOO_EARLY (0 posts)
✓ ACER: Rolling tests → BASELINE (3 posts/week)

Saving to Supabase...
✓ Snapshot ID: seo_2026_03_30_abc123
✓ Saved 47 blog posts
✓ Saved 217 keywords
✓ Saved 8 backlink opportunities

Phase 1 complete! ✅
```

### Monday 9:05 AM - Phase 2: AI Analysis

```
🧠 Analyzing SEO Data with Claude AI
────────────────────────────────────────

Loading snapshot from Supabase...
✓ Loaded snapshot: seo_2026_03_30_abc123

Loading previous week for comparison...
✓ Loaded snapshot: seo_2026_03_23_xyz789

Sending to Claude API...
✓ Prompt size: 18,432 tokens
✓ SEO hard rules embedded in prompt

Claude is analyzing...
✓ Analysis complete (4,821 tokens)

Validating recommendations against SEO rules...
✓ 3 content recommendations generated
✓ 2 backlink opportunities identified
✓ All recommendations pass safety checks

Sending to Telegram...
✓ Sent to chat 123456789

Phase 2 complete! ✅
```

### Throughout the Week - Human Approval

**Telegram Notification:**

```
🧠 SEO Weekly Analysis
Monday, March 30, 2026

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 WEEK SUMMARY:
• Total posts: 47 (+3 WoW)
• Keywords ranking top 50: 89 (+7 WoW)
• Organic traffic: 543 clicks (+12.3% WoW)
• New backlinks: 5 this week

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 HIGH PRIORITY

Recommendation #1: Write "VIC Selective Test Day Checklist 2026"
┌────────────────────────────────────┐
│ Why: VIC Selective test is 11      │
│ weeks away (IMMINENT phase with    │
│ 10-week lag). This keyword has     │
│ 480 monthly searches.              │
│                                    │
│ Target: "VIC selective checklist"  │
│ Expected: +80 clicks/month         │
│ Will rank by: Week 1 (test day)    │
│ Word Count: 2,000                  │
│ Confidence: 87%                    │
└────────────────────────────────────┘

[✅ Approve] [❌ Reject] [💬 Edit]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🛑 IMPORTANT: NSW Selective

Recommendation #2: STOP writing NSW content
┌────────────────────────────────────┐
│ Why: NSW test is 4 weeks away.     │
│ New content won't rank in time     │
│ (needs 10 weeks). STOP writing.    │
│                                    │
│ Action: Pause new NSW content      │
│ Instead: Update existing posts     │
│ with "2026" in title               │
└────────────────────────────────────┘

[✅ Approve Pause] [❌ Keep Writing]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

View full analysis: [Link to Supabase]
```

### Tuesday - Thursday: Content Generation (Approved Items Only)

**Human clicks ✅ Approve on Recommendation #1**

```
📝 Generating Blog Post: "VIC Selective Test Day Checklist 2026"
────────────────────────────────────────

Calling Claude API for full content generation...
✓ Generated 2,143 words
✓ SEO optimized (keyword density: 1.8%)
✓ Internal links: 3
✓ H2 headings: 6
✓ H3 headings: 12

Publishing to Ghost CMS as draft...
✓ Published: https://educourse.com.au/blog/vic-selective-test-day-checklist-2026

Saving attribution data...
✓ Action ID: act_2026_03_30_001
✓ Expected: Rank page 1 by Apr 27 (test is June 20)
✓ Will measure in 8 weeks

Content generation complete! ✅
```

---

## The SEO Hard Rules

### RULE 1: 10-Week Time Lag Enforcement

**Content won't rank in time if test is <10 weeks away.**

```typescript
if (weeksUntilTest < 10) {
  return {
    posts: 0,
    phase: 'POST_TEST',
    reasoning: 'Content won't rank in time - STOP writing'
  };
}
```

### RULE 2: Minimum Word Count

**SEO posts must be ≥1,500 words.**

```typescript
if (wordCount < 1500) {
  throw new Error('Post too short - minimum 1,500 words for SEO');
}
```

### RULE 3: Keyword Density Cap

**Keyword density must be <3% (avoid keyword stuffing).**

```typescript
const keywordDensity = (keywordCount / totalWords) * 100;
if (keywordDensity > 3) {
  throw new Error('Keyword stuffing detected - max 3% density');
}
```

### RULE 4: Internal Links Required

**Every post must link to ≥1 product page.**

```typescript
const productLinks = extractProductLinks(html);
if (productLinks.length === 0) {
  throw new Error('No product links found - add at least 1 CTA');
}
```

### RULE 5: No Keyword Cannibalization

**Check if we already have content on this keyword.**

```typescript
const existingPost = await findPostByKeyword(keyword);
if (existingPost) {
  return {
    action: 'UPDATE_EXISTING',
    postSlug: existingPost.slug,
    reasoning: 'Already have content on this keyword - update instead'
  };
}
```

### RULE 6: Seasonal Budget Cap

**Maximum 5 posts per week total across all products.**

```typescript
const totalPosts = allocations.reduce((sum, a) => sum + a.posts, 0);
if (totalPosts > 5) {
  throw new Error('Exceeds weekly budget cap of 5 posts');
}
```

### RULE 7: Backlink Quality Threshold

**Backlinks must be from sites with Domain Authority ≥20.**

```typescript
if (backlink.domain_authority < 20) {
  throw new Error('Domain Authority too low - minimum DA 20');
}
```

---

## Backlink Automation

### Phase 1: Discover Opportunities (Automated)

```typescript
// Scrape "best test prep resources" roundup pages
const roundupPages = [
  'https://educationhq.com.au/test-prep-resources',
  'https://parenthub.com.au/selective-schools',
];

for (const url of roundupPages) {
  const html = await fetchPage(url);
  const hasOurLink = html.includes('educourse.com.au');

  if (!hasOurLink) {
    // They link to competitors but not us!
    opportunities.push({
      target_domain: new URL(url).hostname,
      target_page: url,
      estimated_da: await checkDomainAuthority(url),
    });
  }
}
```

### Phase 2: Generate Outreach (Automated)

```typescript
const email = await claude.generateText(`
  Generate a backlink outreach email.

  Target: ${opp.target_domain}
  Context: They link to 5 competitors but not us

  Write a 100-word email that:
  1. Compliments their page
  2. Suggests our resource
  3. Doesn't sound spammy
`);
```

### Phase 3: Human Approval (Manual)

```
🔗 Backlink Opportunity #3
Target: educationhq.com.au
DA: 58
Expected: +40 clicks/month

Draft Email:
"Hi Jane, love your test prep resource page..."

[✅ Send] [❌ Skip] [✏️ Edit]
```

### Phase 4: Track Results (Automated)

```typescript
// Next week, check if backlink appeared
const newBacklinks = await checkBacklinks({ since: '2026-03-30' });

for (const outreach of pendingOutreaches) {
  const gotBacklink = newBacklinks.some(
    bl => bl.source_domain === outreach.target_domain
  );

  if (gotBacklink) {
    await telegram.send(`🎉 Backlink acquired from ${outreach.target_domain}!`);
  }
}
```

---

## Time Lag Strategy

See [SEO_TIME_LAG_STRATEGY.md](./SEO_TIME_LAG_STRATEGY.md) for full details.

**TL;DR:**
- Google Ads = instant results (0-day lag)
- SEO = takes 10 weeks to rank (10-week lag)
- **SEO agent runs 10 weeks AHEAD of Google Ads agent**
- When Google Ads enters PEAK, SEO STOPS writing (too late)

---

## Database Schema

### seo_weekly_snapshots

```sql
CREATE TABLE seo_weekly_snapshots (
  id SERIAL PRIMARY KEY,
  snapshot_id TEXT UNIQUE NOT NULL,
  snapshot_date DATE NOT NULL,
  week_start_date DATE NOT NULL,

  -- Content metrics
  total_posts INTEGER NOT NULL,
  posts_this_week INTEGER NOT NULL,

  -- SEO metrics
  total_keywords INTEGER,
  keywords_top_10 INTEGER,
  keywords_top_50 INTEGER,
  total_impressions INTEGER,
  total_clicks INTEGER,
  average_position DECIMAL(5,2),

  -- Backlink metrics
  total_backlinks INTEGER,
  new_backlinks_this_week INTEGER,

  -- Full snapshot
  snapshot_data JSONB NOT NULL,

  created_at TIMESTAMP DEFAULT NOW()
);
```

### seo_agent_actions

```sql
CREATE TABLE seo_agent_actions (
  id SERIAL PRIMARY KEY,
  action_id TEXT UNIQUE NOT NULL,
  snapshot_id TEXT REFERENCES seo_weekly_snapshots(snapshot_id),

  week_date DATE NOT NULL,
  action_type TEXT NOT NULL, -- 'write_blog', 'update_blog', 'backlink_outreach'
  product_slug TEXT,

  -- Recommendation
  title TEXT,
  description TEXT,
  reasoning TEXT,
  expected_impact TEXT,

  -- Execution
  approved BOOLEAN DEFAULT FALSE,
  approved_at TIMESTAMP,
  executed BOOLEAN DEFAULT FALSE,
  executed_at TIMESTAMP,

  -- Results (measured 10 weeks later)
  measured_impact JSONB,

  created_at TIMESTAMP DEFAULT NOW()
);
```

See `migrations/001_seo_weekly_snapshots.sql` for full schema.

---

## Summary

**What you have:**
- ✅ Automated weekly data collection (Ghost + Google Search Console)
- ✅ AI analysis with Claude using SEO hard rules
- ✅ Seasonal intelligence (10-week time lag applied)
- ✅ Backlink opportunity discovery + email generation
- ✅ Telegram approval workflow
- ✅ Attribution tracking (did content actually rank?)

**How to use:**
1. Set up environment variables
2. Run database migrations
3. Test locally: `npm run seo:weekly`
4. Deploy via GitHub Actions (runs every Monday 9 AM AEST)
5. Review recommendations in Telegram each week
6. Approve content to generate
7. Measure results 10 weeks later

**Expected benefits:**
- Month 6: 2,000-5,000 organic clicks/month
- Month 12: 5,000-15,000 organic clicks/month
- $10,000-30,000 revenue from organic traffic annually
- SEO agent pays for itself 10-20x

**Need help?**
- Check [SEO_TIME_LAG_STRATEGY.md](./SEO_TIME_LAG_STRATEGY.md) for time lag details
- Review database queries in migrations folder
- Check GitHub Actions logs for errors
