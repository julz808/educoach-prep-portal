# SEO Agent - Complete Redesign (Inspired by Google Ads Agent)

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│    GitHub Actions (Every Monday 9 AM AEST)          │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│  PHASE 1: Data Collection (Deterministic)           │
│  ├─ Scrape Ghost CMS for existing blog posts        │
│  ├─ Fetch Google Search Console rankings            │
│  ├─ Check Ahrefs API for backlinks                  │
│  ├─ Analyze competitor sites (web scraping)         │
│  ├─ Calculate seasonal context from test calendar   │
│  └─ Save to Supabase (weekly_seo_snapshots)         │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│  PHASE 2: AI Analysis & Recommendations             │
│  ├─ Load last week's snapshot from Supabase         │
│  ├─ Send to Claude with SEO hard rules              │
│  ├─ Claude analyzes content gaps + backlink opps    │
│  ├─ Generate 2-4 blog post outlines                 │
│  └─ Send to Telegram for human approval             │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│  PHASE 3: Content Generation (On Approval)          │
│  ├─ Human approves recommendations via Telegram     │
│  ├─ Agent generates full blog posts (2,000+ words)  │
│  ├─ Publishes to Ghost as drafts                    │
│  └─ Saves attribution data for next week            │
└─────────────────────────────────────────────────────┘
```

---

## Two-Phase Architecture

### Why This Matters

**Current SEO Agent Problem:**
- Generates content blindly without measuring what works
- No historical tracking or attribution
- Can't optimize over time
- Wastes money on content that doesn't rank

**New Approach:**
1. **Phase 1**: Deterministic data collection (can re-run without AI cost)
2. **Phase 2**: AI analysis reads from Supabase (can retry multiple times)
3. **Phase 3**: Execute approved actions only

### Example Workflow

```bash
# Monday 9:00 AM - Phase 1 runs automatically
$ collect-seo-snapshots.ts
  ✓ Scraped 47 existing blog posts from Ghost
  ✓ Fetched Google Search Console rankings (217 keywords)
  ✓ Checked Ahrefs backlinks (143 domains)
  ✓ Analyzed 3 competitor sites (new content alerts)
  ✓ Calculated seasonal phases (VIC Selective = PEAK, NAPLAN = TOO_EARLY)
  ✓ Saved to seo_weekly_snapshots (snapshot_id: seo_2026_03_24_abc)

# Monday 9:05 AM - Phase 2 runs automatically
$ analyze-seo-with-ai.ts
  ✓ Loaded snapshot seo_2026_03_24_abc
  ✓ Sent to Claude API
  ✓ Generated 4 content recommendations
  ✓ Identified 8 backlink opportunities
  ✓ Sent to Telegram for approval

# Tuesday 10:00 AM - Human approves in Telegram
$ execute-seo-actions.ts
  ✓ Generating "VIC Selective Test Day Checklist 2026"
  ✓ Publishing to Ghost as draft
  ✓ Generating outreach email for backlink #1
  ✓ Saved attribution data for next Monday
```

---

## Hard Rules for SEO

### RULE 1: Seasonal Awareness (Test Calendar)

**Just like Google Ads, SEO content must align with test seasons.**

```typescript
const seasonalPhases = {
  'POST_TEST': 0.0,   // Don't write about finished tests
  'TOO_EARLY': 0.1,   // Minimal content 6+ months before test
  'EARLY': 0.3,       // Some evergreen content
  'RAMP_UP': 0.7,     // Increase content frequency
  'PEAK': 1.0,        // Maximum content output
  'IMMINENT': 0.6,    // Last-minute tips
};
```

**Example:**
- **VIC Selective** (test June 2026, currently March): RAMP_UP phase
  - Recommended: 2-3 posts/week on VIC topics
  - Focus: Test prep strategies, study plans, day-of tips

- **Year 5 NAPLAN** (test March 2027, currently March 2026): TOO_EARLY
  - Recommended: 0-1 post/month (evergreen only)
  - Focus: General NAPLAN info, not time-sensitive tips

### RULE 2: Content Quality Thresholds

**AI cannot publish content that:**
- Is <1,500 words (too thin for SEO)
- Has keyword density >3% (keyword stuffing)
- Doesn't include internal links to products
- Lacks proper H2/H3 structure
- Has plagiarism score >15%

### RULE 3: Budget Constraints

**Content generation costs money (Claude API).**

```typescript
const contentBudget = {
  maxPostsPerWeek: 4,           // Hard cap
  maxWordsPerPost: 3000,        // Cost control
  maxClaudeTokensPerWeek: 200000, // ~$6 USD/week
};
```

### RULE 4: Backlink Quality Rules

**AI cannot recommend backlinks from:**
- Sites with Domain Authority <20
- Sites not related to education
- Link farms or PBNs
- Sites with spam score >30%

### RULE 5: No Cannibalization

**Before creating new content, check:**
- Do we already have a post on this keyword?
- Would this compete with existing content?
- Should we update old content instead?

---

## Database Schema

### seo_weekly_snapshots

Stores weekly SEO data (Phase 1 output)

```sql
CREATE TABLE seo_weekly_snapshots (
  id SERIAL PRIMARY KEY,
  snapshot_id TEXT UNIQUE NOT NULL,
  snapshot_date DATE NOT NULL,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,

  -- Ghost CMS data
  total_posts INTEGER NOT NULL,
  posts_this_week INTEGER NOT NULL,

  -- Google Search Console data
  total_keywords INTEGER,
  keywords_ranked_top_10 INTEGER,
  keywords_ranked_top_50 INTEGER,
  total_impressions INTEGER,
  total_clicks INTEGER,
  average_position DECIMAL(5,2),

  -- Backlink data (from Ahrefs)
  total_backlinks INTEGER,
  total_referring_domains INTEGER,
  new_backlinks_this_week INTEGER,
  lost_backlinks_this_week INTEGER,

  -- Competitor analysis
  competitor_new_content JSONB,

  -- Seasonal context
  seasonal_phases JSONB,

  -- Full snapshot data
  snapshot_data JSONB NOT NULL,

  created_at TIMESTAMP DEFAULT NOW()
);
```

### seo_weekly_blog_posts

Tracks individual blog posts over time

```sql
CREATE TABLE seo_weekly_blog_posts (
  id SERIAL PRIMARY KEY,
  snapshot_id TEXT REFERENCES seo_weekly_snapshots(snapshot_id),

  post_slug TEXT NOT NULL,
  post_title TEXT NOT NULL,
  post_url TEXT NOT NULL,
  product_slug TEXT,

  word_count INTEGER,
  published_date DATE,
  updated_date DATE,

  -- SEO metrics from Google Search Console
  impressions INTEGER,
  clicks INTEGER,
  average_position DECIMAL(5,2),
  ctr DECIMAL(5,2),

  -- Top ranking keywords
  top_keywords JSONB,

  created_at TIMESTAMP DEFAULT NOW()
);
```

### seo_weekly_keywords

Tracks keyword rankings over time

```sql
CREATE TABLE seo_weekly_keywords (
  id SERIAL PRIMARY KEY,
  snapshot_id TEXT REFERENCES seo_weekly_snapshots(snapshot_id),

  keyword TEXT NOT NULL,
  product_slug TEXT,

  -- Rankings
  current_position INTEGER,
  previous_position INTEGER,
  position_change INTEGER,

  -- Metrics
  impressions INTEGER,
  clicks INTEGER,
  ctr DECIMAL(5,2),

  -- Which page ranks for this keyword
  ranking_url TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);
```

### seo_weekly_backlinks

Tracks backlink profile over time

```sql
CREATE TABLE seo_weekly_backlinks (
  id SERIAL PRIMARY KEY,
  snapshot_id TEXT REFERENCES seo_weekly_snapshots(snapshot_id),

  source_domain TEXT NOT NULL,
  source_url TEXT NOT NULL,
  target_url TEXT NOT NULL,

  anchor_text TEXT,
  link_type TEXT, -- 'dofollow', 'nofollow'
  domain_authority INTEGER,

  first_seen_date DATE,
  last_seen_date DATE,
  status TEXT, -- 'active', 'lost'

  created_at TIMESTAMP DEFAULT NOW()
);
```

### seo_agent_actions

Tracks AI recommendations and execution (like Google Ads agent)

```sql
CREATE TABLE seo_agent_actions (
  id SERIAL PRIMARY KEY,
  action_id TEXT UNIQUE NOT NULL,
  snapshot_id TEXT REFERENCES seo_weekly_snapshots(snapshot_id),

  week_date DATE NOT NULL,
  action_type TEXT NOT NULL, -- 'write_blog', 'update_blog', 'backlink_outreach'

  product_slug TEXT,

  -- Recommendation details
  title TEXT,
  description TEXT,
  reasoning TEXT,
  expected_impact TEXT,
  confidence INTEGER, -- 0-100
  priority INTEGER, -- 1-10

  -- Metadata
  recommended_at TIMESTAMP,
  recommended_by TEXT, -- 'claude'

  -- Execution
  approved BOOLEAN DEFAULT FALSE,
  approved_at TIMESTAMP,
  approved_by TEXT,

  executed BOOLEAN DEFAULT FALSE,
  executed_at TIMESTAMP,

  -- Results (measured next week)
  measured_impact JSONB,
  attribution_calculated_at TIMESTAMP,

  -- Full details
  details JSONB,

  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Deterministic vs AI Decision-Making

### Phase 1: Deterministic (No AI)

**What happens automatically without AI:**

1. **Data Collection**
   - Scrape Ghost CMS posts
   - Fetch Google Search Console API
   - Query Ahrefs API for backlinks
   - Scrape competitor sites (3 URLs)
   - Load test calendar from Supabase

2. **Seasonal Phase Calculation**
   ```typescript
   function calculateSeasonalPhase(productSlug: string): string {
     const test = testCalendar.get(productSlug);
     const weeksUntil = getWeeksUntilTest(test.testDate);

     if (weeksUntil < 0) return 'POST_TEST';
     if (weeksUntil <= 2) return 'IMMINENT';
     if (weeksUntil <= 6) return 'PEAK';
     if (weeksUntil <= 12) return 'RAMP_UP';
     if (weeksUntil <= 20) return 'EARLY';
     return 'TOO_EARLY';
   }
   ```

3. **Content Budget Calculation**
   ```typescript
   function calculateContentBudget(phase: string): number {
     const budgetMultipliers = {
       'POST_TEST': 0,
       'TOO_EARLY': 0.25,  // 1 post/week
       'EARLY': 0.5,       // 2 posts/week
       'RAMP_UP': 0.75,    // 3 posts/week
       'PEAK': 1.0,        // 4 posts/week
       'IMMINENT': 0.5,    // 2 posts/week
     };
     return Math.floor(4 * budgetMultipliers[phase]);
   }
   ```

4. **Data Validation**
   - Check for missing data
   - Validate API responses
   - Flag anomalies (e.g., 50% traffic drop)

### Phase 2: AI Analysis

**What AI decides:**

1. **Content Gap Analysis**
   - Which keywords to target
   - Which topics to write about
   - Whether to update old content or create new

2. **Content Strategy**
   - Blog post titles
   - Target keywords
   - Internal linking structure

3. **Backlink Opportunities**
   - Which sites to target
   - Outreach email drafts
   - Link-worthy content angles

4. **Attribution Analysis**
   - Did last week's content rank?
   - Are rankings improving?
   - Which topics drive most traffic?

**What AI CANNOT decide (hard-coded rules):**
- How many posts to write (seasonal budget)
- Minimum word count (<1,500 = rejected)
- Maximum token spend per week
- Which test seasons to focus on
- Backlink quality thresholds

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

Fetching Ahrefs backlink data...
✓ 143 referring domains (+5 new this week)
✓ 1,247 total backlinks (+23 this week, -2 lost)
✓ Domain Rating: 32 (+1 WoW)

Scraping competitor sites...
✓ competitor1.com: 2 new blog posts this week
✓ competitor2.com: 1 new blog post this week
✓ competitor3.com: 0 new posts

Calculating seasonal phases from test calendar...
✓ VIC Selective: 13 weeks until test → RAMP_UP (3 posts/week)
✓ NSW Selective: 6 weeks until test → PEAK (4 posts/week)
✓ Year 5 NAPLAN: 52 weeks until test → TOO_EARLY (0 posts/week)
✓ Year 7 NAPLAN: 52 weeks until test → TOO_EARLY (0 posts/week)
✓ EduTest: Ongoing → BASELINE (2 posts/week)
✓ ACER: Ongoing → BASELINE (2 posts/week)

Saving to Supabase...
✓ Snapshot ID: seo_2026_03_24_abc123
✓ Saved 47 blog posts
✓ Saved 217 keywords
✓ Saved 143 backlinks

Phase 1 complete! ✅
```

### Monday 9:05 AM - Phase 2: AI Analysis

```
🧠 Analyzing SEO Data with Claude AI
────────────────────────────────────────

Loading snapshot from Supabase...
✓ Loaded snapshot: seo_2026_03_24_abc123

Loading previous week for comparison...
✓ Loaded snapshot: seo_2026_03_17_xyz789

Sending to Claude API...
✓ Prompt size: 18,432 tokens
✓ SEO hard rules embedded in prompt

Claude is analyzing...
✓ Analysis complete (4,821 tokens)

Validating recommendations against SEO rules...
✓ 4 content recommendations generated
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
Monday, March 24, 2026

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 WEEK SUMMARY:
• Total posts: 47 (+3 WoW)
• Keywords ranking top 50: 89 (+7 WoW)
• Organic traffic: 543 clicks (+12.3% WoW)
• Backlinks: 143 domains (+5 WoW)

Best performing content:
• "VIC Selective Sample Questions 2026" - Position 3, 234 clicks
• "NSW Selective Test Tips" - Position 8, 145 clicks

Needs attention:
• "ACER Test Guide" - Dropped from position 12 → 28 (competitor outranking us)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 HIGH PRIORITY

Recommendation #1: Write "VIC Selective Test Day Checklist 2026"
┌────────────────────────────────────┐
│ Why: VIC Selective test is 13      │
│ weeks away (RAMP_UP phase). This   │
│ keyword has 480 monthly searches   │
│ and we have no content targeting   │
│ it. Competitors ranking #1-3.      │
│                                    │
│ Target Keyword: "VIC selective     │
│ test day checklist"                │
│ Expected Traffic: +80 clicks/month │
│ Confidence: 87%                    │
│ Word Count: 2,000                  │
│                                    │
│ Internal Links:                    │
│ - VIC Selective product page       │
│ - Sample questions page            │
└────────────────────────────────────┘

[✅ Approve] [❌ Reject] [💬 Edit]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🟡 MEDIUM PRIORITY

Recommendation #2: Update "ACER Test Guide" (recovering rankings)
┌────────────────────────────────────┐
│ Why: This post dropped from #12 to │
│ #28 this week. Competitor published│
│ fresher content. We should update  │
│ with 2026 info and reclaim ranking.│
│                                    │
│ Current: 1,800 words, last updated │
│ 2024-11-12                         │
│ Recommended: Add 600 words on 2026 │
│ changes, update examples           │
│                                    │
│ Expected: Recover to position 8-12 │
│ Confidence: 72%                    │
└────────────────────────────────────┘

[✅ Approve] [❌ Reject] [💬 Edit]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔗 BACKLINK OPPORTUNITY

Recommendation #3: Outreach to educationhq.com.au
┌────────────────────────────────────┐
│ They published "Top Test Prep      │
│ Resources 2026" and linked to 5    │
│ competitors but not us.            │
│                                    │
│ Domain Authority: 58               │
│ Traffic Potential: +50 clicks/month│
│ Outreach Angle: "We have the most  │
│ comprehensive VIC Selective guide  │
│ in Australia"                      │
│                                    │
│ Draft email ready ✓                │
└────────────────────────────────────┘

[✅ Approve & Send] [❌ Reject] [💬 Edit Email]

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
✓ Action ID: act_2026_03_24_001
✓ Expected impact: +80 clicks/month
✓ Will measure next Monday

Notifying Telegram...
✓ Sent confirmation

Content generation complete! ✅
```

### Next Monday 9:00 AM - Attribution Tracking

```
WEEK-OVER-WEEK COMPARISON:

VIC Selective Test Day Checklist (published last Monday):
├─ Google Search Console impressions: 12 (new post)
├─ Average position: 47 (new post, climbing)
├─ Clicks: 0 (too early)
└─ Verdict: ON TRACK (new posts take 2-4 weeks to rank)

ACER Test Guide (updated last Monday):
├─ Previous position: 28
├─ Current position: 15 (+13 positions! ✅)
├─ Clicks: 34 → 67 (+97% WoW ✅)
├─ Expected: Recover to position 8-12
├─ Actual: Position 15 (75% success)
└─ Verdict: PARTIAL SUCCESS (heading in right direction)

Backlink Outreach to educationhq.com.au:
├─ Email sent: March 25
├─ Backlink acquired: Not yet (too early)
└─ Verdict: PENDING (follow up in 2 weeks)
```

---

## Telegram Integration

### Setup

```typescript
// scripts/seo/telegram-notifier.ts
export class SEOTelegramNotifier {
  async sendWeeklyAnalysis(analysis: SEOAnalysis) {
    const message = this.formatAnalysis(analysis);

    await this.sendMessage(message, {
      reply_markup: {
        inline_keyboard: analysis.recommendations.map(rec => [
          { text: '✅ Approve', callback_data: `approve_${rec.action_id}` },
          { text: '❌ Reject', callback_data: `reject_${rec.action_id}` },
          { text: '💬 Edit', callback_data: `edit_${rec.action_id}` },
        ]),
      },
    });
  }

  async handleCallback(callbackQuery: any) {
    const [action, actionId] = callbackQuery.data.split('_');

    if (action === 'approve') {
      // Mark as approved in database
      await db.updateAction(actionId, { approved: true });

      // Trigger content generation
      await executeAction(actionId);

      await this.reply('✅ Approved! Generating content...');
    }
  }
}
```

---

## File Structure

```
SEO Agent/
├── README.md                          # Complete documentation
├── scripts/
│   ├── collect-seo-snapshots.ts      # Phase 1: Data collection
│   ├── analyze-seo-with-ai.ts        # Phase 2: AI analysis
│   ├── execute-seo-actions.ts        # Phase 3: Content generation
│   ├── index-weekly.ts               # Orchestrator (runs all phases)
│   ├── seo-client.ts                 # Ghost CMS + GSC + Ahrefs API wrapper
│   ├── seo-rules-engine.ts           # Hard rules enforcement
│   ├── content-generator.ts          # Claude-powered blog writer
│   ├── backlink-hunter.ts            # Backlink opportunity finder
│   ├── telegram-notifier.ts          # Telegram integration
│   └── get-seo-calendar.ts           # View seasonal context
└── migrations/
    └── 001_seo_weekly_snapshots.sql  # Database schema
```

---

## Key Differences from Current SEO Agent

| Current SEO Agent | New SEO Agent (Google Ads-Inspired) |
|-------------------|--------------------------------------|
| Generates content blindly | Analyzes data first, then recommends |
| No historical tracking | Week-over-week snapshots in Supabase |
| No attribution | Measures if content actually ranks |
| No seasonal awareness | Test calendar controls content volume |
| No hard rules | Rules engine validates all recommendations |
| No approval workflow | Telegram approval before execution |
| All AI, no deterministic logic | Two-phase: deterministic + AI |
| Can't optimize over time | Learns what works via attribution |

---

## Expected Benefits

**Month 1:**
- 12-16 high-quality blog posts published
- All aligned with test calendar (no wasted content)
- Complete tracking of rankings + backlinks

**Month 3:**
- Attribution shows which content types rank best
- AI learns to recommend better keywords
- Backlink profile growing +20-30 domains/month

**Month 6:**
- 2,000-5,000 organic clicks/month
- $4,000-10,000 revenue from organic traffic
- 80-100 ranking keywords in top 10

**Month 12:**
- 5,000-15,000 organic clicks/month
- $10,000-30,000 revenue from organic
- SEO agent pays for itself 10-20x

---

## Next Steps

1. **Set up database schema** (migrations/001_seo_weekly_snapshots.sql)
2. **Build Phase 1: Data collection** (collect-seo-snapshots.ts)
3. **Build SEO rules engine** (seo-rules-engine.ts)
4. **Build Phase 2: AI analysis** (analyze-seo-with-ai.ts)
5. **Integrate Telegram** (telegram-notifier.ts)
6. **Build Phase 3: Content generator** (execute-seo-actions.ts)
7. **Deploy via GitHub Actions** (runs every Monday 9 AM AEST)
8. **Test locally first** (run all 3 phases manually)

---

## APIs Required

1. **Ghost CMS API** (already have)
   - Read existing posts
   - Publish new drafts

2. **Google Search Console API** (need to set up)
   - Keyword rankings
   - Impressions/clicks
   - Average positions

3. **Ahrefs API** (need subscription ~$99/month)
   - Backlink data
   - Domain authority
   - Competitor analysis
   - OR use free alternative: Google Search Console + manual backlink tracking

4. **Anthropic API** (already have)
   - Content gap analysis
   - Blog post generation
   - Backlink outreach emails

5. **Telegram Bot API** (already have from Google Ads agent)
   - Weekly notifications
   - Approval workflow

---

## Cost Estimate

**Monthly Costs:**
- Ahrefs API: $99/month (or use free GSC alternative)
- Claude API: ~$25/month (200K tokens/week × 4 weeks)
- Ghost CMS: $0 (already have)
- Google Search Console: $0 (free)
- Telegram: $0 (free)

**Total: ~$125/month (or $25/month without Ahrefs)**

**Expected ROI:**
- Month 6: $4,000-10,000 revenue → 32-80x ROI
- Month 12: $10,000-30,000 revenue → 80-240x ROI

---

## Backlink Automation Strategy

### Phase 1: Backlink Discovery (Deterministic)

**What we collect automatically:**

1. **Ahrefs API (Paid Option)**
   ```typescript
   const backlinks = await ahrefs.getBacklinks({
     target: 'educourse.com.au',
     mode: 'domain',
     limit: 1000,
   });

   // Get competitor backlinks
   const competitorLinks = await ahrefs.getBacklinks({
     target: 'competitor.com.au',
     mode: 'domain',
     limit: 100,
   });

   // Find link gaps (sites linking to competitors but not us)
   const linkGaps = competitorLinks.filter(
     link => !ourBacklinks.includes(link.source_domain)
   );
   ```

2. **Google Search Console (Free Option)**
   ```typescript
   // Can't get backlink data directly, but can track:
   // - Referring domains from traffic sources
   // - Which pages get external traffic
   ```

3. **Manual Scraping (Free Option)**
   ```typescript
   // Scrape "test prep resources" roundup pages
   const roundupPages = [
     'https://educationhq.com.au/test-prep-resources',
     'https://australiancurriculum.edu.au/resources',
     // etc.
   ];

   for (const page of roundupPages) {
     const links = await scrapePage(page);
     const hasOurLink = links.some(link => link.includes('educourse.com.au'));

     if (!hasOurLink) {
       // Backlink opportunity!
       backlinkOpportunities.push({
         source: page,
         domain_authority: await checkDA(page),
         anchor_opportunity: 'VIC Selective Test Prep',
       });
     }
   }
   ```

### Phase 2: AI Backlink Outreach

**AI generates outreach emails:**

```typescript
const prompt = `Write a backlink outreach email for this opportunity:

Target Site: ${opportunity.source_domain}
Their Page: ${opportunity.page_url}
Domain Authority: ${opportunity.da}

Our Best Resource to Suggest:
- URL: https://educourse.com.au/blog/vic-selective-complete-guide
- Title: "VIC Selective Entry Test 2026: Complete Guide"
- Why valuable: Most comprehensive VIC guide in Australia, 5,000+ words

Context:
They have a roundup page linking to 5 competitors but not us. We have better content.

Write a professional, non-spammy outreach email that:
1. Compliments their existing resource page
2. Points out our comprehensive guide
3. Suggests they add it to their list
4. Keeps it under 150 words

Email should feel personal, not templated.`;

const email = await claude.generateText(prompt);
```

**Example AI-generated email:**

```
Subject: Love your test prep resource page!

Hi [Name],

I came across your "Top Test Prep Resources 2026" page and found it really useful—
especially your section on VIC Selective prep.

I noticed you've linked to [Competitor1] and [Competitor2], which are great, but I
thought you might be interested in our complete VIC Selective guide:

https://educourse.com.au/blog/vic-selective-complete-guide

It's a 5,000-word deep dive covering everything from registration to test day
strategy. We've helped 500+ students get into selective entry schools.

Would you consider adding it to your resource list? Happy to answer any questions!

Cheers,
[Your Name]
EduCourse Team
```

### Phase 3: Track & Measure

**Save outreach attempts:**
```sql
INSERT INTO seo_backlink_outreach (
  opportunity_id,
  target_domain,
  target_url,
  outreach_email,
  sent_at,
  status
) VALUES (
  'opp_001',
  'educationhq.com.au',
  'https://educationhq.com.au/test-prep-resources',
  '[Email content]',
  '2026-03-25',
  'sent'
);
```

**Next week, check if backlink appeared:**
```typescript
// Phase 1 next Monday
const newBacklinks = await ahrefs.getBacklinks({ since: '2026-03-24' });

for (const outreach of pendingOutreaches) {
  const gotBacklink = newBacklinks.some(
    bl => bl.source_domain === outreach.target_domain
  );

  if (gotBacklink) {
    // Success!
    await db.updateOutreach(outreach.id, {
      status: 'success',
      backlink_acquired_at: new Date(),
    });

    // Notify Telegram
    await telegram.send(`🎉 Backlink acquired from ${outreach.target_domain}!`);
  }
}
```

### Backlink Attribution Example

**Week 1: Send outreach**
- Target: educationhq.com.au (DA 58)
- Expected impact: +50 clicks/month
- Confidence: 65%

**Week 2: No response yet**
- Status: PENDING
- Follow-up: Send reminder email

**Week 3: Backlink acquired!**
- Link appeared on their resource page
- Traffic from educationhq.com.au: 12 clicks this week
- Status: SUCCESS

**Week 4-8: Measure impact**
- Cumulative traffic from backlink: 78 clicks
- Expected: +50 clicks/month × 1.25 months = 62 clicks
- Actual: 78 clicks (126% success rate ✅)

---

## Smart Features (Inspired by Google Ads Agent)

### 1. Auto-Pause Low-Performing Content

**Just like Google Ads pauses high-CAC campaigns, SEO agent should flag low-performing content:**

```typescript
// Deterministic rule
if (post.published_months_ago >= 3 && post.clicks_last_30_days < 10) {
  // Flag for AI review
  lowPerformers.push({
    post_slug: post.slug,
    clicks: post.clicks_last_30_days,
    recommendation: 'UPDATE_OR_REMOVE',
    reasoning: 'Published 3+ months ago, <10 clicks/month',
  });
}
```

**AI decides:**
- Update with fresh info?
- Consolidate with another post?
- Redirect and delete?

### 2. Content Refresh Triggers

**Automatically detect when old content needs updating:**

```typescript
// Deterministic triggers
const refreshTriggers = [
  // Ranking dropped significantly
  (post.current_position - post.position_30_days_ago) > 10,

  // Competitor outranking us
  post.current_position > 5 && competitorPublishedRecently,

  // Old content (>12 months) in PEAK season
  post.months_since_updated >= 12 && product.seasonal_phase === 'PEAK',

  // Still getting traffic but outdated
  post.clicks_last_30_days > 50 && post.content_freshness_score < 0.7,
];
```

**AI decides which updates to make.**

### 3. Internal Linking Automation

**Automatically suggest internal links between posts:**

```typescript
// AI analyzes semantic similarity
const relatedPosts = await claude.analyze(`
  Current post: "${post.title}"
  Content: "${post.excerpt}"

  Other posts:
  ${allPosts.map(p => `- ${p.title} (${p.slug})`).join('\n')}

  Which 3-5 posts should we link to from this post?
  Return: [{"slug": "...", "anchor_text": "...", "reason": "..."}]
`);

// Automatically add links to Ghost post
await ghost.updatePost(post.id, {
  html: insertInternalLinks(post.html, relatedPosts),
});
```

### 4. Seasonal Content Calendar

**Auto-generate content ideas based on test calendar:**

```typescript
// 13 weeks before VIC Selective test
const seasonalIdeas = {
  'PEAK': [
    'VIC Selective Test Day Checklist',
    'Last-Minute VIC Selective Tips',
    'What to Bring to VIC Selective Test',
  ],
  'RAMP_UP': [
    'VIC Selective Study Plan (12 Weeks)',
    'VIC Selective Sample Questions 2026',
    'How to Prepare for VIC Selective',
  ],
  'TOO_EARLY': [
    // No time-sensitive content
  ],
};
```

---

## Summary: Why This Is Better

**Current SEO Agent:**
- "Generate 4 blog posts this week"
- No data collection
- No historical tracking
- No attribution
- Can't optimize

**New SEO Agent (Google Ads-Inspired):**
- "Collect all SEO data → Analyze → Recommend → Execute → Measure"
- Two-phase architecture
- Week-over-week snapshots
- Attribution tracking (did it rank?)
- Hard rules enforcement
- Seasonal intelligence
- Telegram approval workflow
- Learns what works over time

**Result:** SEO agent that gets smarter every week, just like your Google Ads agent.
