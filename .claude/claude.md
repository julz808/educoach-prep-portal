# EduCoach Prep Portal - Complete Platform Documentation

**Last Updated:** May 3, 2026
**Platform Version:** V2.3+
**Status:** ✅ Production Ready

---

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Core Systems](#core-systems)
   - [Question Generation Engine](#question-generation-engine)
   - [Test Delivery System](#test-delivery-system)
   - [User Progress Tracking](#user-progress-tracking)
   - [Payment & Subscriptions](#payment--subscriptions)
5. [Marketing Automation](#marketing-automation)
   - [Google Ads Agent](#google-ads-agent)
   - [SEO Agent](#seo-agent)
6. [Questions Audit System](#questions-audit-system)
7. [Database Schema](#database-schema)
8. [Deployment](#deployment)
9. [Development Workflow](#development-workflow)

---

## Platform Overview

EduCoach is an **adaptive learning platform** for Australian selective school and NAPLAN preparation. The platform delivers personalized practice tests, diagnostic assessments, and skill drills across 6 test types:

### Supported Test Types
1. **VIC Selective Entry** (Year 9 Entry)
2. **NSW Selective Entry** (Year 7 Entry)
3. **ACER Scholarship** (Various years)
4. **EduTest Scholarship** (Year 7 Entry)
5. **Year 5 NAPLAN**
6. **Year 7 NAPLAN**

### Key Features
- ✅ **4,341+ AI-generated questions** (79% complete, targeting 5,500)
- ✅ **Adaptive difficulty** based on user performance
- ✅ **Real-time progress tracking** with insights dashboard
- ✅ **Writing assessment** with AI-powered rubric scoring
- ✅ **Visual questions** (SVG/HTML diagrams)
- ✅ **Practice tests** (5 per test type) + diagnostic tests
- ✅ **Skill drills** for targeted practice
- ✅ **Stripe payment integration**
- ✅ **Ghost CMS blog** for SEO content
- ✅ **Automated marketing** (Google Ads + SEO agents)

---

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **shadcn/ui** component library (54 components)
- **Recharts** for data visualization

### Backend
- **Supabase** (PostgreSQL + Auth + Edge Functions)
- **Serverless Edge Functions** (8 functions)
- **Row Level Security (RLS)** for data access control

### AI & APIs
- **Claude AI (Anthropic)** - Question generation & writing assessment
- **OpenAI** - Alternative LLM for specific tasks
- **Google Ads API** - Marketing automation
- **Google Search Console API** - SEO tracking
- **Ghost CMS API** - Content management
- **Stripe API** - Payment processing

### Infrastructure
- **Vercel** - Frontend hosting
- **GitHub Actions** - CI/CD automation
- **Supabase Cloud** - Database & backend
- **Telegram Bot** - Notifications

---

## Project Structure

```
educoach-prep-portal-2/
├── src/                          # Frontend application
│   ├── pages/                    # React pages (23 components)
│   ├── components/               # Reusable components (29 main + 54 UI)
│   ├── engines/                  # Question generation engine
│   │   └── questionGeneration/
│   │       ├── v2/              # 🟢 Current engine (active)
│   │       └── v1/              # 🔴 Legacy (deprecated)
│   ├── services/                 # Business logic (20 services)
│   ├── data/                     # Curriculum & content data
│   │   ├── curriculumData_v2/   # Test configurations (6 test types)
│   │   └── courses.ts           # Course definitions
│   ├── context/                  # Global state (Auth, User, Product)
│   ├── hooks/                    # Custom React hooks
│   ├── utils/                    # Utility functions
│   └── integrations/             # Third-party integrations
│
├── scripts/                      # Automation scripts (67+ files)
│   ├── generation/              # Question generation scripts
│   ├── audit/                   # Quality control scripts
│   ├── ghost/                   # Ghost CMS automation
│   ├── marketing/               # Marketing automation
│   └── archive/                 # One-off fixes (archived)
│
├── supabase/                     # Backend services
│   ├── migrations/              # Database migrations (4 files)
│   └── functions/               # Edge Functions (8 serverless)
│
├── docs/                         # Documentation (93 files, 16 sections)
│   ├── 01-generation/           # Question generation guides
│   ├── 04-analysis/             # System audits
│   ├── 05-architecture/         # Architecture documentation
│   └── 10-marketing/            # Marketing documentation
│
├── Google Ads Agent/             # Automated Google Ads optimization
│   ├── scripts/v2/              # V2 implementation (current)
│   ├── scripts/                 # Utility scripts
│   ├── archive/                 # V1 implementation (archived)
│   └── migrations/              # Database schema
│
├── SEO Agent/                    # Autonomous SEO content generation
│   ├── scripts/                 # SEO automation scripts
│   └── migrations/              # Database schema
│
├── questions-audit/              # Question quality audits
│   └── vic-selective/           # VIC test audit reports
│
└── content/                      # Blog content
    ├── blog/                    # Blog posts
    └── lead-magnets/            # Lead generation content
```

---

## Core Systems

## Question Generation Engine

### Architecture: V2 Engine (Current)

**Location:** `src/engines/questionGeneration/v2/`

The V2 engine uses **AI-powered generation with intelligent gap detection** to create high-quality practice questions.

### Key Components

#### 1. Main Generator (`generator.ts`)
- Entry point for question generation
- Orchestrates the entire generation pipeline
- Handles retries and error recovery

#### 2. Section Generator (`sectionGenerator.ts`)
- Generates questions for specific test sections
- Applies section-specific rules
- Manages difficulty distribution

#### 3. Gap Detection (`gapDetection.ts`)
- **Identifies missing questions** in the curriculum
- Prevents duplicate generation
- Ensures balanced coverage

**How it works:**
```typescript
// Example: Generate questions for VIC Selective Maths
await generateSection({
  test: 'VIC Selective Entry (Year 9)',
  section: 'Numerical Reasoning',
  mode: 'practice_1',
  subskill: 'Fractions, Decimals & Percentages',
  count: 10
});
```

**Gap detection logic:**
1. Load existing questions from database (up to 1,000 for context)
2. Identify which sub-skills/difficulties are missing
3. Generate only what's needed
4. Validate and prevent duplicates

#### 4. Visual Generator (`visualGenerator.ts`)
- Generates SVG/HTML diagrams for visual questions
- Uses Claude Opus 4.5 for diagram generation
- Caches visuals for reuse

#### 5. Passage Generator (`passageGenerator.ts`)
- Creates reading comprehension passages
- Manages passage quotas (prevents over-generation)
- Ensures topic diversity

#### 6. Prompt Builder (`promptBuilder.ts`)
- Constructs LLM prompts with curriculum context
- Embeds validation rules
- Includes examples for few-shot learning

#### 7. Difficulty Distributor (`difficultyDistributor.ts`)
- Ensures even distribution across difficulty levels
- Adjusts for existing question distribution

#### 8. Validation Layers

**3 validation layers:**
1. **Structural validation** - Checks JSON structure
2. **LLM validation** - Claude validates correctness
3. **Duplicate detection** - Prevents duplicate content

**Section-aware duplicate detection:**
- **Maths:** Checks numerical similarity
- **Verbal:** Checks semantic similarity (word meanings)
- **Reading:** Allows passage reuse (but checks question uniqueness)

### Running Question Generation

#### Generate Practice Tests + Diagnostic

```bash
# Example: EduTest Verbal Reasoning
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="EduTest Scholarship (Year 7 Entry)" \
  --section="Verbal Reasoning" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"
```

#### Generate Skill Drills

```bash
# Example: EduTest Verbal Reasoning drills
npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \
  --test="EduTest Scholarship (Year 7 Entry)" \
  --section="Verbal Reasoning"
```

#### Check What's Missing

```bash
# Detailed gap analysis
npx tsx scripts/audit/detailed-gap-analysis.ts

# Full system status
npx tsx scripts/audit/full-v2-status.ts
```

### Generation Status (as of March 30, 2026)

| Test Type | Questions | Completion |
|-----------|-----------|------------|
| ACER Scholarship | 297 | 68% ✅ |
| EduTest Scholarship | 1,158 | 87% ✅ |
| NSW Selective Entry | 403 | 63% ⚠️ |
| VIC Selective Entry | 905 | 60% ⚠️ |
| Year 5 NAPLAN | 708 | 67% ⚠️ |
| Year 7 NAPLAN | 870 | 60% ⚠️ |

**Total:** 4,341 / ~5,500 (79% complete)

---

## Test Delivery System

### Architecture

**Frontend:** `src/pages/TestTaking.tsx` (91KB - main test interface)
**Services:** `src/services/testSessionService.ts` + `src/services/scoringService.ts`

### Test Flow

1. **Test Selection** → User selects test type & mode
2. **Question Loading** → Fetch questions from `questions_v2` table
3. **Shuffle** → Deterministic shuffle (same seed = same order)
4. **Delivery** → Show one question at a time
5. **Submission** → Store answers in `user_test_responses`
6. **Scoring** → Calculate score, identify weak areas
7. **Results** → Display performance + recommendations

### Test Modes

- **Practice Tests** (5 per test type) - Full-length practice exams
- **Diagnostic Test** - Adaptive test to identify weak areas
- **Skill Drills** - Targeted practice for specific sub-skills

### Question Types Supported

1. **Multiple Choice** - Standard MCQ
2. **Cloze** - Fill in the blank
3. **Number Grid** - Grid-based number puzzles
4. **Visual** - Questions with SVG/HTML diagrams
5. **Reading Comprehension** - Passage-based questions
6. **Writing** - Extended response questions

---

## User Progress Tracking

### Architecture

**Dashboard:** `src/pages/Dashboard.tsx` + `src/pages/Insights.tsx` (146KB)
**Services:** `src/services/userProgressService.ts` + `src/services/analyticsService.ts`

### Tracked Metrics

1. **Overall Performance**
   - Total tests taken
   - Average score
   - Completion rate
   - Time spent

2. **Section Performance**
   - Score by section (Maths, Verbal, Reading, Writing)
   - Weak areas identified
   - Improvement trends

3. **Sub-skill Mastery**
   - Performance per sub-skill
   - Difficulty progression
   - Recommended drills

4. **Test History**
   - All past tests
   - Question-level answers
   - Detailed solutions

### Data Storage

**Tables:**
- `user_test_sessions` - Test metadata
- `user_test_responses` - Individual answers
- `user_diagnostic_results` - Diagnostic test results
- `user_drill_sessions` - Drill session data

---

## Payment & Subscriptions

### Architecture

**Stripe Integration:** `src/services/stripeService.ts`
**Checkout:** `supabase/functions/create-checkout-session/`
**Webhook:** `supabase/functions/stripe-webhook-v2/`

### Product Tiers

1. **Free Trial** - 1 practice test
2. **Single Test** - $47 (5 practice tests + drills)
3. **All Tests Bundle** - $197 (all 6 test types)

### Payment Flow

1. User clicks "Buy" → Calls `stripeService.createCheckoutSession()`
2. Redirects to Stripe Checkout
3. User completes payment
4. Stripe sends webhook → `stripe-webhook-v2` Edge Function
5. Updates `user_product_access` table
6. User gets instant access

### Access Control

**Database:** Row Level Security (RLS) policies on `questions_v2`

```sql
-- Example RLS policy
CREATE POLICY "Users can view questions for purchased products"
ON questions_v2
FOR SELECT
TO authenticated
USING (
  test_type IN (
    SELECT product_slug
    FROM user_product_access
    WHERE user_id = auth.uid()
  )
);
```

---

## Marketing Automation

## Google Ads Agent

**Location:** `Google Ads Agent/`
**Current Version:** V2 (automated budget execution + AI tactical recommendations)
**Runs:** Every Monday 6 AM AEST (GitHub Actions)

### Architecture

```
┌─────────────────────────────────────────┐
│  MONDAY 6 AM - Weekly Agent V2          │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│  Phase 1: DATA COLLECTION               │
│  • Scrape last 7 days performance       │
│  • Save to google_ads_weekly_snapshots  │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│  Phase 2: BUDGET EXECUTION (Automated)  │
│  • Read weekly_budget_allocation table  │
│  • Auto-update campaign budgets         │
│  • NO APPROVAL NEEDED ✅                │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│  Phase 3: AI TACTICAL ANALYSIS          │
│  • Claude AI analyzes performance       │
│  • Suggests 3-5 tactical improvements   │
│  • Keywords, bids, ads (NOT budgets)    │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│  Phase 4: TELEGRAM REPORT               │
│  • Send budget summary (automated)      │
│  • Send tactical recommendations        │
│  • You approve via Telegram commands    │
└─────────────────────────────────────────┘
```

### Key Difference from V1

**V1 (Old):** AI suggested budget changes → Manual approval → Manual implementation
**V2 (New):** Budget execution automated (follows preset strategy) + AI focuses on tactics only

### Running Manually

```bash
# Full weekly workflow
cd "Google Ads Agent/scripts/v2"
npx tsx index-weekly-v2.ts

# Individual phases
npx tsx ../collect-weekly-snapshots.ts  # Phase 1
npx tsx budget-executor.ts              # Phase 2
npx tsx tactical-analyzer.ts            # Phase 3
```

### Budget Allocation Strategy

**Seasonal intelligence** based on test calendars (104 weeks pre-calculated):
- **TOO_EARLY** (>24 weeks) - 0% budget (PAUSED)
- **BASELINE** (16-24 weeks) - 40% budget
- **EARLY** (12-16 weeks) - 70% budget
- **RAMP_UP** (8-12 weeks) - 85% budget
- **PEAK** (4-8 weeks) - 100% budget
- **IMMINENT** (2-4 weeks) - 100% budget
- **POST_TEST** (0-2 weeks after) - 0% budget (PAUSED)

### Database Tables

- `google_ads_weekly_snapshots` - Performance data
- `google_ads_agent_actions` - Tactical recommendations & execution log
- `weekly_budget_allocation` - Preset budget strategy (104 weeks)

### Documentation

- **`Google Ads Agent/README_V2.md`** - Complete V2 guide
- **`Google Ads Agent/V1_TO_V2_MIGRATION.md`** - Migration notes
- **`Google Ads Agent/TELEGRAM_SETUP_GUIDE.md`** - Telegram bot setup

---

## SEO Agent

**Location:** `SEO Agent/`
**Status:** 🟢 Audit toolkit live (May 2026); autonomous weekly agent still planned
**Runs:** On-demand audit scripts; weekly automation deferred

### Current State (as of 2026-05-03)

A toolkit of read-only audit scripts is live and connected to production data:
- **GA4 Data API** + **Search Console API** authenticated via gcloud Application Default Credentials (no key files; org policy blocks service account keys)
- **Ghost Admin API** wired for inventory + management
- All scripts under `SEO Agent/scripts/`; reports under `docs/04-analysis/`

Re-runnable audit scripts:
| Script | Purpose |
|---|---|
| `audit-30-day.ts` | Full GA4 + GSC 30-day report |
| `find-impression-cliff.ts` | Detects sustained impression drops + git correlation |
| `cliff-query-diff.ts` | Spike-vs-current query/page diff (what rankings did we lose?) |
| `diagnose-ga4-channels.ts` | Source/medium breakdown per channel (catches misattribution) |
| `check-ghost-posts.ts` | Ghost CMS post inventory |
| `find-draft-duplicates.ts` | Detects draft posts that duplicate published ones |
| `delete-all-drafts.ts` | Bulk-delete Ghost drafts (with safety checks) |

Required env vars (in `.env`):
```
GA4_PROPERTY_ID=351688132
GSC_SITE_URL=sc-domain:educourse.com.au
```

ADC must be active: `gcloud auth application-default login --scopes=...analytics.readonly,...webmasters.readonly` (one-time, see [SEO Analytics session doc](../docs/04-analysis/SEO_ANALYTICS_SESSION_2026-05-03.md) for full setup).

**Companion toolkit in `Google Ads Agent/scripts/`:**
- `audit-final-urls.ts` — flags ads pointing to wrong URLs/domains
- `audit-all-ad-destinations.ts` — comprehensive ad URL audit (RSA, sitelinks, PMax)
- `show-wrong-domain-ads.ts` — full details of ads on non-educourse domains

### Planned (not yet built): Autonomous weekly agent

The original 3-phase autonomous agent (collect → analyze → publish) is still planned but deferred. The audit toolkit replaces "Phase 1" for now.

### Architecture

```
┌─────────────────────────────────────────┐
│  MONDAY 9 AM - SEO Weekly Agent         │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│  Phase 1: DATA COLLECTION               │
│  • Fetch Ghost CMS posts                │
│  • Google Search Console rankings       │
│  • Calculate seasonal context           │
│  • Save to seo_weekly_snapshots         │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│  Phase 2: AI ANALYSIS                   │
│  • Claude analyzes content gaps         │
│  • Applies 10-week time lag             │
│  • Generates 2-5 blog post outlines     │
│  • Finds backlink opportunities         │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│  Phase 3: CONTENT GENERATION            │
│  • Human approves via Telegram          │
│  • Claude generates full blog posts     │
│  • Publishes to Ghost as drafts         │
│  • Tracks attribution (ranks?)          │
└─────────────────────────────────────────┘
```

### Key Insight: 10-Week Time Lag

**SEO takes 8-12 weeks to rank** → Apply 10-week offset from Google Ads strategy

| Weeks Until Test | Google Ads Phase | SEO Phase | SEO Posts/Week |
|---|---|---|---|
| 17 weeks | EARLY (40%) | PEAK | 5 posts/week |
| 13 weeks | RAMP_UP (70%) | PEAK | 5 posts/week |
| 11 weeks | RAMP_UP (85%) | IMMINENT | 3 posts/week |
| **8 weeks** | **PEAK (100%)** 🔥 | **POST_TEST** 🛑 | **0 posts** (STOP!) |

**When Google Ads enters PEAK, SEO STOPS writing** (content won't rank in time!)

### SEO Hard Rules

1. **10-week time lag enforcement** - Stop writing if <10 weeks until test
2. **Minimum 1,500 words** per post
3. **Keyword density <3%** (avoid stuffing)
4. **≥1 internal link** to product page
5. **No keyword cannibalization** - Check existing content first
6. **Max 5 posts/week** total across all products
7. **Backlinks from DA≥20 sites** only

### Running Manually

```bash
# Full weekly workflow
cd "SEO Agent/scripts"
npm run seo:weekly

# Individual phases
npm run seo:collect   # Phase 1: Data collection
npm run seo:analyze   # Phase 2: AI analysis
npm run seo:execute   # Phase 3: Content generation
```

### Database Tables

- `seo_weekly_snapshots` - Performance data
- `seo_agent_actions` - Content recommendations & results
- `seo_backlink_opportunities` - Backlink targets

### Documentation

- **`docs/04-analysis/SEO_ANALYTICS_SESSION_2026-05-03.md`** ⭐ Latest session: full audit findings, code changes shipped, manual actions outstanding
- **`SEO Agent/README.md`** - Original architecture (autonomous agent vision)
- **`SEO Agent/SEO_TIME_LAG_STRATEGY.md`** - 10-week time lag explained
- **`SEO Agent/SETUP_GUIDE.md`** - Setup instructions (predates audit toolkit)

### Conversion / Attribution Tracking

Production ads conversion pipeline (live as of 2026-05-03):
- gtag config in [index.html](../index.html) with `conversion_linker: true` and cross-subdomain `linker.domains`
- gclid captured to localStorage on landing
- gclid passed through Stripe via [src/services/stripeService.ts](../src/services/stripeService.ts) `successUrl`
- gclid re-attached to verified purchase conversion in [src/pages/PurchaseSuccess.tsx](../src/pages/PurchaseSuccess.tsx)
- Supabase email confirmation links carry `utm_source=email&utm_medium=...` to prevent post-purchase email traffic from being misattributed to Paid Search

GA4 measurement ID is **not** installed (`G-XXXXXXX`). GA4 receives data via the linked Google Ads property. Future improvement: install GA4 directly to fire `purchase`, `sign_up`, `test_start` events natively.

---

## Questions Audit System

**Location:** `questions-audit/`

### Purpose

Manual quality control for generated questions - catch errors that automated validation missed.

### Structure

```
questions-audit/
└── vic-selective/
    ├── README.md              # Audit overview
    ├── PROGRESS.md            # Current status
    ├── APPROACH.md            # Audit methodology
    ├── error-docs/            # Error reports by sub-skill
    │   ├── FRACTIONS_DECIMALS_PERCENTAGES_ERRORS.md
    │   ├── APPLIED_WORD_PROBLEMS_ERRORS.md
    │   ├── GEOMETRY_ERRORS.md
    │   └── ...
    └── scripts/               # Audit scripts
        ├── fetch-*.ts         # Fetch questions for review
        ├── fix-*.ts           # Apply fixes to database
        └── audit-*.ts         # Automated audit checks
```

### Audit Progress (VIC Selective)

✅ **Completed Sub-skills:**
- Fractions, Decimals & Percentages (79 questions) ✅
- Algebraic Equations (30 questions) ✅
- Applied Word Problems (30 questions) ✅
- Data Interpretation (30 questions) ✅
- Geometry (30 questions) ✅
- Number Operations (30 questions) ✅
- Time, Money & Measurement (30 questions) ✅

⚠️ **In Progress:**
- Letter Series (30 questions)
- Pattern Recognition (30 questions)
- Number Grids & Matrices (30 questions)

🔴 **Not Started:**
- Vocabulary (30 questions)
- Reading Comprehension (varies)
- Creative Writing (15 questions)
- Persuasive Writing (15 questions)

### Common Error Types Found

1. **Incorrect solutions** - Wrong answer marked as correct
2. **Duplicate answer options** - Same option appears twice
3. **Ambiguous wording** - Question unclear
4. **Missing context** - Insufficient information to solve
5. **Difficulty mismatch** - Question too easy/hard for assigned level

### Running Audits

```bash
# Fetch questions for manual review
cd questions-audit/vic-selective/scripts
npx tsx fetch-fractions-decimals-percentages.ts

# Apply fixes after review
npx tsx fix-fractions-decimals-percentages.ts

# Automated quality checks
npx tsx audit-pattern-recognition.ts
```

### Documentation

- **`questions-audit/vic-selective/README.md`** - Audit system overview
- **`questions-audit/vic-selective/PROGRESS.md`** - Current status tracker
- **Error docs in `error-docs/`** - Detailed error reports by sub-skill

---

## Database Schema

### Core Tables

#### `questions_v2` (4,341 questions)
```sql
- id (uuid, primary key)
- test_type (text) - e.g., 'vic-selective'
- section (text) - e.g., 'Numerical Reasoning'
- mode (text) - 'practice_1', 'diagnostic', 'drill'
- subskill (text) - e.g., 'Fractions, Decimals & Percentages'
- difficulty (integer) - 1 (easy) to 5 (hard)
- question_text (text)
- question_type (text) - 'multiple_choice', 'cloze', etc.
- options (jsonb) - Answer choices
- correct_answer (text)
- explanation (text) - Detailed solution
- passage_id (uuid, nullable) - Links to passages_v2
- visual_id (uuid, nullable) - Links to question_visuals
- created_at (timestamp)
```

#### `passages_v2` (Reading passages)
```sql
- id (uuid, primary key)
- test_type (text)
- section (text)
- passage_text (text)
- topic (text) - For diversity tracking
- difficulty (integer)
- word_count (integer)
- created_at (timestamp)
```

#### `question_visuals` (SVG/HTML diagrams)
```sql
- id (uuid, primary key)
- visual_type (text) - 'svg', 'html'
- visual_content (text) - SVG/HTML code
- cache_key (text) - For reuse
- created_at (timestamp)
```

### User Tables

#### `profiles` (User accounts)
```sql
- id (uuid, primary key, references auth.users)
- email (text)
- full_name (text)
- created_at (timestamp)
```

#### `user_product_access` (Purchases)
```sql
- id (uuid, primary key)
- user_id (uuid, references profiles)
- product_slug (text) - e.g., 'vic-selective'
- access_granted_at (timestamp)
- stripe_payment_intent (text)
```

#### `user_test_sessions` (Test history)
```sql
- id (uuid, primary key)
- user_id (uuid, references profiles)
- test_type (text)
- mode (text)
- score (integer)
- total_questions (integer)
- started_at (timestamp)
- completed_at (timestamp)
```

#### `user_test_responses` (Individual answers)
```sql
- id (uuid, primary key)
- session_id (uuid, references user_test_sessions)
- question_id (uuid, references questions_v2)
- user_answer (text)
- is_correct (boolean)
- time_taken (integer) - Seconds
- created_at (timestamp)
```

### Marketing Tables

#### `google_ads_weekly_snapshots`
```sql
- id (serial, primary key)
- snapshot_id (text, unique)
- week_start_date (date)
- snapshot_data (jsonb) - Full performance data
- created_at (timestamp)
```

#### `weekly_budget_allocation`
```sql
- id (serial, primary key)
- week_start_date (date, unique)
- weekly_budget_aud (decimal)
- market_heat (decimal) - 0.0 to 1.0
- product_allocations (jsonb) - Budget per product
- created_at (timestamp)
```

#### `seo_weekly_snapshots`
```sql
- id (serial, primary key)
- snapshot_id (text, unique)
- snapshot_date (date)
- total_posts (integer)
- keywords_top_50 (integer)
- total_clicks (integer)
- snapshot_data (jsonb)
- created_at (timestamp)
```

---

## Deployment

### Frontend (Vercel)

**Domain:** `educourse.com.au`
**Build Command:** `npm run build`
**Output Directory:** `dist`

**Environment Variables:**
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### Backend (Supabase)

**Project:** Supabase Cloud
**Database:** PostgreSQL 15
**Edge Functions:** 8 deployed

**Migrations:**
```bash
# Apply new migration
npx supabase db push

# Or manually via SQL editor
```

### GitHub Actions

**Workflows:**
1. `.github/workflows/google-ads-weekly.yml` - Monday 6 AM AEST
2. `.github/workflows/seo-agent-weekly.yml` - Monday 9 AM AEST (planned)

**Secrets required:**
- `ANTHROPIC_API_KEY`
- `GOOGLE_ADS_*` (client ID, secret, refresh token)
- `SUPABASE_SERVICE_ROLE_KEY`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

### Monitoring

- **Supabase Dashboard** - Database queries, logs
- **Vercel Dashboard** - Build logs, analytics
- **Telegram Notifications** - Weekly reports from agents
- **Sentry** (optional) - Error tracking

---

## Development Workflow

### Initial Setup

```bash
# Clone repository
git clone https://github.com/your-username/educoach-prep-portal-2
cd educoach-prep-portal-2

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your API keys

# Start development server
npm run dev
```

### Common Tasks

#### Generate Questions

```bash
# Generate practice tests for a section
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="VIC Selective Entry (Year 9)" \
  --section="Numerical Reasoning" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"

# Generate skill drills
npx tsx --env-file=.env scripts/generation/generate-drills-for-section.ts \
  --test="VIC Selective Entry (Year 9)" \
  --section="Numerical Reasoning"

# Check what's missing
npx tsx scripts/audit/detailed-gap-analysis.ts
```

#### Run Marketing Agents

```bash
# Google Ads Agent (weekly)
cd "Google Ads Agent/scripts/v2"
npx tsx index-weekly-v2.ts

# SEO Agent (weekly)
cd "SEO Agent/scripts"
npm run seo:weekly
```

#### Audit Questions

```bash
# Fetch questions for review
cd questions-audit/vic-selective/scripts
npx tsx fetch-fractions-decimals-percentages.ts

# Apply fixes
npx tsx fix-fractions-decimals-percentages.ts
```

#### Database Operations

```bash
# View logs
npx supabase logs

# Execute SQL
psql -h db.your-project.supabase.co -U postgres -d postgres

# Reset database (⚠️ WARNING: Deletes all data)
npx supabase db reset
```

### Code Standards

- **TypeScript** - All code must be TypeScript
- **ESLint** - Run `npm run lint` before commit
- **Prettier** - Auto-format with VSCode extension
- **Commit Messages** - Use conventional commits (`feat:`, `fix:`, `chore:`)

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Commit changes
git add .
git commit -m "feat: Add your feature description"

# Push to remote
git push origin feature/your-feature

# Create pull request on GitHub
```

---

## Key Documentation Files

### Generation System
- **`docs/01-generation/GENERATION_READINESS_REPORT.md`** ⭐ Start here for question generation
- **`docs/01-generation/V2_ENGINE_COMPLETE_GUIDE.md`** - Technical deep-dive
- **`docs/01-generation/GENERATION_SCRIPTS_REFERENCE.md`** - Copy-paste commands

### System Architecture
- **`docs/05-architecture/QUESTION_GENERATION_ARCHITECTURE.md`** - Engine design
- **`docs/05-architecture/WEBSITE_STRUCTURE_ANALYSIS.md`** - Frontend architecture

### Marketing Automation
- **`Google Ads Agent/README_V2.md`** - Google Ads automation
- **`SEO Agent/README.md`** - SEO automation
- **`docs/10-marketing/strategy/`** - Marketing strategy

### System Status
- **`docs/04-analysis/V2_SYSTEM_AUDIT_REPORT.md`** - Latest system audit
- **`docs/04-analysis/VIC_SELECTIVE_COMPLETE_AUDIT_STATUS.md`** - VIC audit status

### Questions Audit
- **`questions-audit/vic-selective/README.md`** - Audit system overview
- **`questions-audit/vic-selective/PROGRESS.md`** - Current audit progress

---

## Quick Reference

### Environment Variables

**Required:**
```bash
# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI APIs
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Google Ads (optional)
GOOGLE_ADS_DEVELOPER_TOKEN=
GOOGLE_ADS_CLIENT_ID=
GOOGLE_ADS_CLIENT_SECRET=
GOOGLE_ADS_REFRESH_TOKEN=
GOOGLE_ADS_CUSTOMER_ID=

# Telegram (optional)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# Ghost CMS (optional)
GHOST_API_URL=
GHOST_ADMIN_API_KEY=
```

### Package.json Scripts

```json
{
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview",
  "lint": "eslint .",

  // Question generation
  "generate:section": "tsx scripts/generation/generate-section-all-modes.ts",
  "generate:drills": "tsx scripts/generation/generate-drills-for-section.ts",
  "audit:gaps": "tsx scripts/audit/detailed-gap-analysis.ts",

  // Marketing agents
  "ads:weekly": "tsx 'Google Ads Agent/scripts/v2/index-weekly-v2.ts'",
  "seo:weekly": "tsx 'SEO Agent/scripts/index-weekly.ts'",

  // Database
  "db:migrate": "supabase db push",
  "db:reset": "supabase db reset"
}
```

---

## Support & Resources

**Main Documentation:** `docs/README.md`
**Generation Guide:** `docs/01-generation/GENERATION_READINESS_REPORT.md`
**System Audit:** `docs/04-analysis/V2_SYSTEM_AUDIT_REPORT.md`

**GitHub Repository:** [Private]
**Production URL:** https://educourse.com.au
**Supabase Dashboard:** https://supabase.com/dashboard
**Vercel Dashboard:** https://vercel.com/dashboard

---

**Last Updated:** March 30, 2026
**Next Review:** April 30, 2026
