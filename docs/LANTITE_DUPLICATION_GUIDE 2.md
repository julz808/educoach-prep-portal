# LANTITE Platform Duplication Guide

Complete step-by-step guide to duplicate the EduCourse platform for LANTITE test prep.

## Overview

This guide will help you:
1. Duplicate the EduCourse GitHub repository
2. Set up a new Claude Code workspace
3. Systematically adapt the platform for LANTITE
4. Deploy to production

---

## Part 1: Repository Duplication

### Step 1: Push Current Changes to GitHub

First, ensure all EduCourse changes are pushed:

```bash
# You may need to authenticate with GitHub
# Option 1: Use SSH (recommended)
git remote set-url origin git@github.com:julz808/educoach-prep-portal.git

# Option 2: Use Personal Access Token
# Create token at: https://github.com/settings/tokens
# Then use: git push with your token

# Push both branches
git checkout main
git push origin main
git push origin feature/drill-ui-improvements
```

### Step 2: Create New Repository on GitHub

1. Go to https://github.com/new
2. Repository name: `lantite-prep-platform` (or similar)
3. Description: "LANTITE Teacher Test Preparation Platform"
4. Visibility: Private (recommended initially)
5. **Do NOT initialize** with README, .gitignore, or license
6. Click "Create repository"

### Step 3: Duplicate the Repository

```bash
# Navigate to your projects directory
cd ~/Documents

# Clone the EduCourse repo as a bare repository
git clone --bare https://github.com/julz808/educoach-prep-portal.git educoach-temp

# Push to new LANTITE repository
cd educoach-temp
git push --mirror git@github.com:julz808/lantite-prep-platform.git

# Clean up temporary repo
cd ..
rm -rf educoach-temp

# Clone your new LANTITE repository
git clone git@github.com:julz808/lantite-prep-platform.git
cd lantite-prep-platform
```

---

## Part 2: Connect Claude Code

### Step 1: Open New Workspace

```bash
# Open the new repository in Claude Code
code-claude lantite-prep-platform

# Or if using VS Code with Claude Code extension:
code lantite-prep-platform
```

### Step 2: Initialize Claude Code Session

Start a new Claude Code session and share this adaptation checklist with Claude.

---

## Part 3: LANTITE Adaptation Checklist

### Phase 1: Brand & Configuration (30 mins)

**Project-wide find & replace:**
- [ ] "EduCourse" → "TeachPrep" (or your brand name)
- [ ] "educoach" → "lantite" (in package names, URLs)
- [ ] Update `package.json` name and description
- [ ] Update `vite.config.ts` if needed

**Environment variables (.env):**
```bash
VITE_APP_NAME=TeachPrep
VITE_PRODUCT_NAME=LANTITE
# Update Supabase URLs for new project
VITE_SUPABASE_URL=your-new-supabase-url
VITE_SUPABASE_ANON_KEY=your-new-anon-key
# Update Stripe keys for new account
VITE_STRIPE_PUBLISHABLE_KEY=your-new-stripe-key
```

---

### Phase 2: Test Configuration (1 hour)

**Update Product Context:**
`src/context/ProductContext.tsx`
- [ ] Replace product list with single LANTITE product
- [ ] Update default product
- [ ] Simplify product selector (single product mode)

**Update Curriculum Data:**
`src/data/curriculumData_v2/`
- [ ] Create `lantite.ts` based on official LANTITE structure:
  - Literacy Test sections
  - Numeracy Test sections
- [ ] Update `index.ts` to export only LANTITE config
- [ ] Remove other test type files (or keep for reference)

**LANTITE Test Structure Reference:**
```typescript
// LANTITE has 2 tests:
// 1. Literacy Test
//    - Reading (comprehension, analysis)
//    - Writing (grammar, spelling, punctuation)
// 2. Numeracy Test
//    - Number & Algebra
//    - Measurement & Geometry
//    - Statistics & Probability
```

---

### Phase 3: Database Setup (1-2 hours)

**Create New Supabase Project:**
1. Go to https://supabase.com/dashboard
2. Create new project: "lantite-prep-platform"
3. Note the URL and anon key
4. Update `.env` with new credentials

**Run Migrations:**
```bash
# Link to new Supabase project
npx supabase link --project-ref your-project-ref

# Push all migrations
npx supabase db push

# Verify V2 tables exist
npx supabase db query "SELECT tablename FROM pg_tables WHERE schemaname = 'public';"
```

**Seed Initial Data:**
- [ ] Run curriculum data generation for LANTITE sections
- [ ] Set up RLS policies
- [ ] Create admin user

---

### Phase 4: Landing Pages (2 hours)

**Homepage:**
`src/pages/Home.tsx`
- [ ] Update hero section for LANTITE positioning
- [ ] Single product focus (no product selection)
- [ ] Update copy to target teachers
- [ ] Update testimonials (if any)
- [ ] Update pricing (single product pricing)

**Product Page:**
`src/pages/ProductLanding.tsx`
- [ ] Simplify for single product (LANTITE)
- [ ] Update features specific to LANTITE
- [ ] Update sample questions showcase
- [ ] Update pricing card
- [ ] Update FAQ for LANTITE

**Remove Multi-Product Elements:**
- [ ] Remove product comparison sections
- [ ] Remove product selector dropdowns
- [ ] Simplify navigation (no product switching)

---

### Phase 5: Payment & Stripe (1 hour)

**Create New Stripe Account:**
1. Create new Stripe account or use test mode
2. Create product: "LANTITE Prep - Full Access"
3. Create price: $XX (your pricing)
4. Note Product ID and Price ID

**Update Stripe Config:**
`src/config/stripeConfig.ts`
- [ ] Update product IDs for LANTITE
- [ ] Update price IDs
- [ ] Simplify to single product
- [ ] Test checkout flow

---

### Phase 6: Question Generation (Ongoing)

**Initial Setup:**
`src/data/curriculumData_v2/lantite.ts`
- [ ] Define all LANTITE sections and sub-skills
- [ ] Add example questions for each sub-skill
- [ ] Configure difficulty levels
- [ ] Set up passage requirements (for reading)

**Generate Initial Questions:**
```bash
# Use V2 generation engine
npm run tsx scripts/generation/generate-section-all-modes.ts

# Parameters:
# - Test: LANTITE
# - Section: Literacy - Reading (start with one)
# - Difficulty: medium
# - Mode: practice
# - Count: 50 (initial batch)
```

**Iterate on Quality:**
- [ ] Review generated questions
- [ ] Adjust prompts in `src/engines/questionGeneration/v2/`
- [ ] Add more example questions to improve quality
- [ ] Generate for all sections

---

### Phase 7: Domain & Deployment (2-3 hours)

**Purchase Domain:**
- [ ] Buy domain (e.g., `lantiteprep.com`)
- [ ] Configure DNS settings

**Deploy to Vercel:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configure custom domain in Vercel dashboard
# Set environment variables in Vercel
```

**SSL & Final Setup:**
- [ ] Verify SSL certificate
- [ ] Test all pages
- [ ] Test payment flow
- [ ] Test question generation

---

### Phase 8: Google Ads (When Ready)

**Create New Google Ads Account:**
- [ ] Link to new domain
- [ ] Set up conversion tracking
- [ ] Create LANTITE-specific campaigns
- [ ] Target teacher audience
- [ ] Set daily budget

**Keywords to Target:**
- "LANTITE practice test"
- "LANTITE preparation"
- "LANTITE study guide"
- "teacher literacy numeracy test"
- etc.

Reference: `docs/10-marketing/google-ads/` for strategies

---

## Part 4: Files Requiring Changes

### Critical Files to Update

**Configuration:**
- `package.json` - name, description
- `.env` - all API keys and project IDs
- `vite.config.ts` - if needed
- `src/config/stripeConfig.ts` - Stripe products

**Branding:**
- `public/index.html` - title, meta description
- `src/components/Header.tsx` - logo, brand name
- `src/components/Footer.tsx` - links, company name
- All landing pages

**Data & Logic:**
- `src/context/ProductContext.tsx` - single product
- `src/data/curriculumData_v2/lantite.ts` - NEW FILE
- `src/data/curriculumData_v2/index.ts` - export only LANTITE
- Database migrations if schema changes needed

**Marketing:**
- `public/sitemap.xml` - update URLs
- `public/robots.txt` - update domain
- Google Analytics tracking code
- Google Ads conversion tracking

### Files to DELETE (Optional)

These are specific to the multi-product EduCourse model:
- `src/data/curriculumData_v2/acer.ts`
- `src/data/curriculumData_v2/edutest.ts`
- `src/data/curriculumData_v2/nsw-selective.ts`
- `src/data/curriculumData_v2/vic-selective.ts`
- `src/data/curriculumData_v2/naplan-year5.ts`
- `src/data/curriculumData_v2/naplan-year7.ts`
- Product comparison pages/components
- Multi-product documentation

**Keep these as reference** during initial development, delete later.

---

## Part 5: Testing Checklist

### Before Launch

**User Flows:**
- [ ] Homepage loads correctly
- [ ] Sign up flow works
- [ ] Payment flow completes
- [ ] Dashboard loads after purchase
- [ ] Practice tests work
- [ ] Skill drills work
- [ ] Progress tracking works
- [ ] Writing assessment works (if applicable)

**Technical:**
- [ ] All environment variables set
- [ ] Database migrations applied
- [ ] Questions generated for all sections
- [ ] Stripe webhooks configured
- [ ] Error tracking set up (Sentry, etc.)
- [ ] Analytics tracking works

**Mobile:**
- [ ] Responsive design works
- [ ] Touch interactions work
- [ ] Performance is acceptable

---

## Part 6: Claude Code Prompts

**Share these with Claude in your new workspace:**

### Initial Setup Prompt
```
I've duplicated the EduCourse repository for a new LANTITE test prep platform.
Please help me adapt it systematically:

1. First, update all brand references from "EduCourse" to "TeachPrep"
2. Then, simplify for single product (LANTITE instead of 6 test types)
3. Create new curriculum data structure for LANTITE
4. Update landing pages and marketing copy
5. Configure Stripe for single product

Let's start with #1 - brand updates.
```

### Curriculum Setup Prompt
```
I need to create curriculum data for LANTITE. The test has:

Literacy Test:
- Reading (comprehension, inference, analysis)
- Writing (grammar, spelling, punctuation, writing quality)

Numeracy Test:
- Number & Algebra
- Measurement & Geometry
- Statistics & Probability

Please create src/data/curriculumData_v2/lantite.ts following the same
structure as the other test types, with appropriate sub-skills for each section.
```

### Question Generation Prompt
```
Now that we have curriculum data, let's generate initial questions.
Please use the V2 generation engine to create 50 practice questions
for LANTITE Literacy - Reading, medium difficulty.

Walk me through the process and show me the generated questions for review.
```

---

## Part 7: Timeline Estimate

**Week 1: Setup & Configuration**
- Day 1-2: Repository duplication, environment setup
- Day 3-4: Curriculum data creation, database setup
- Day 5: Landing page updates, branding

**Week 2: Content Generation**
- Day 1-3: Generate questions for all sections
- Day 4-5: Review and refine question quality

**Week 3: Testing & Polish**
- Day 1-2: End-to-end testing
- Day 3-4: Bug fixes, UI polish
- Day 5: Deployment prep

**Week 4: Launch**
- Day 1: Soft launch, monitoring
- Day 2-3: Marketing setup (Google Ads)
- Day 4-5: Public launch, monitoring

---

## Part 8: Key Differences - LANTITE vs Multi-Product

### Simplifications Possible

**Navigation:**
- No product switcher needed
- Single test type throughout
- Simpler routing

**Pricing:**
- Single price point
- No product comparison
- Simpler checkout flow

**Content:**
- All content focused on LANTITE
- Simpler FAQ
- More targeted messaging

**User Experience:**
- No test type selection confusion
- Clearer user journey
- More focused positioning

---

## Resources

**LANTITE Official Resources:**
- https://www.lantite.edu.au/ - Official LANTITE website
- Study official sample questions
- Understand test format and scoring

**Technical Docs:**
- `docs/01-generation/V2_ENGINE_COMPLETE_GUIDE.md` - Question generation
- `docs/05-architecture/` - Platform architecture
- `docs/10-marketing/` - Marketing strategies

**This Repository:**
- All existing code is reusable
- V2 engine is test-agnostic
- UI components work for any test type
- Payment flow is generic

---

## Support & Troubleshooting

### Common Issues

**Authentication:**
If git push fails, set up SSH:
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
cat ~/.ssh/id_ed25519.pub
# Add to GitHub: Settings > SSH Keys
```

**Supabase Connection:**
```bash
# Check connection
npx supabase status

# Re-link if needed
npx supabase link --project-ref your-ref
```

**Question Generation:**
If questions are low quality:
1. Add more example questions
2. Adjust prompts in `v2/promptBuilder.ts`
3. Increase diversity settings
4. Review validator rules

---

## Conclusion

You now have:
1. ✅ Complete V2 question generation engine
2. ✅ Proven conversion-optimized UI/UX
3. ✅ Stripe payment integration
4. ✅ Database schema and migrations
5. ✅ Marketing and Google Ads foundation

This architecture was built to be **reusable**. The LANTITE adaptation is primarily:
- Configuration changes (product definitions)
- Content changes (curriculum data, copy)
- Branding changes (name, domain, styling)

The core platform remains the same, saving you months of development time!

**Next Step:** Push to GitHub and start Part 1!
