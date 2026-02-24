# LANTITE Duplication - Quick Checklist

Fast reference for duplicating EduCourse → LANTITE platform.

---

## ☑️ Part 1: Repository Setup (30 mins)

```bash
# 1. Push current EduCourse changes
cd ~/Documents/educoach-prep-portal-2
git checkout main
git push origin main
git push origin feature/drill-ui-improvements

# 2. Create bare clone
cd ~/Documents
git clone --bare https://github.com/julz808/educoach-prep-portal.git educoach-temp

# 3. Push to new LANTITE repo (create on GitHub first!)
cd educoach-temp
git push --mirror git@github.com:julz808/lantite-prep-platform.git

# 4. Clean up and clone
cd ..
rm -rf educoach-temp
git clone git@github.com:julz808/lantite-prep-platform.git
cd lantite-prep-platform

# 5. Open in Claude Code
code-claude .
```

---

## ☑️ Part 2: Configuration (1 hour)

### .env File
```bash
VITE_APP_NAME=TeachPrep
VITE_PRODUCT_NAME=LANTITE
VITE_SUPABASE_URL=<new-project-url>
VITE_SUPABASE_ANON_KEY=<new-anon-key>
VITE_STRIPE_PUBLISHABLE_KEY=<new-stripe-key>
```

### Find & Replace (project-wide)
- [ ] "EduCourse" → "TeachPrep"
- [ ] "educoach" → "lantite"
- [ ] Update package.json name

### Files to Update Immediately
- [ ] `package.json`
- [ ] `src/config/stripeConfig.ts`
- [ ] `src/context/ProductContext.tsx`

---

## ☑️ Part 3: Curriculum Data (2 hours)

### Create LANTITE Config
- [ ] Create `src/data/curriculumData_v2/lantite.ts`
- [ ] Define Literacy sections (Reading, Writing)
- [ ] Define Numeracy sections (Number, Measurement, Statistics)
- [ ] Add 3-5 example questions per sub-skill
- [ ] Update `index.ts` to export LANTITE only

### LANTITE Structure
```
Literacy Test:
├── Reading
│   ├── Comprehension
│   ├── Inference
│   └── Analysis
└── Writing
    ├── Grammar
    ├── Spelling
    ├── Punctuation
    └── Writing Quality

Numeracy Test:
├── Number & Algebra
├── Measurement & Geometry
└── Statistics & Probability
```

---

## ☑️ Part 4: Database (1 hour)

### Supabase Setup
```bash
# 1. Create new project at supabase.com
# 2. Link locally
npx supabase link --project-ref <your-ref>

# 3. Push migrations
npx supabase db push

# 4. Verify tables
npx supabase db query "SELECT tablename FROM pg_tables WHERE schemaname = 'public';"
```

### Tables to Verify
- [ ] questions_v2
- [ ] passages
- [ ] test_sessions
- [ ] user_answers
- [ ] drill_sessions
- [ ] purchases

---

## ☑️ Part 5: Landing Pages (2 hours)

### Files to Update
- [ ] `src/pages/Home.tsx` - Hero, features, pricing
- [ ] `src/pages/ProductLanding.tsx` - LANTITE-specific
- [ ] `src/components/Header.tsx` - Logo, brand
- [ ] `src/components/Footer.tsx` - Links, company
- [ ] `public/index.html` - Meta tags

### Marketing Copy Focus
- Target: Teachers preparing for LANTITE
- Pain points: Literacy & Numeracy certification
- Solution: Comprehensive practice platform
- USP: AI-generated questions, progress tracking

---

## ☑️ Part 6: Stripe (30 mins)

### Setup
1. [ ] Create Stripe account or use test mode
2. [ ] Create product: "LANTITE Prep - Full Access"
3. [ ] Create price: $XX.XX
4. [ ] Update `src/config/stripeConfig.ts` with IDs
5. [ ] Test checkout flow

---

## ☑️ Part 7: Question Generation (Ongoing)

### Generate Initial Batch
```bash
# Start with one section
npm run tsx scripts/generation/generate-section-all-modes.ts

# Parameters:
- Test: LANTITE
- Section: Literacy - Reading
- Difficulty: medium
- Mode: practice
- Count: 50
```

### Quality Check
- [ ] Review generated questions
- [ ] Check answer correctness
- [ ] Verify difficulty appropriateness
- [ ] Adjust prompts if needed
- [ ] Regenerate until satisfied

### Repeat for All Sections
- [ ] Literacy - Reading (all sub-skills)
- [ ] Literacy - Writing (all sub-skills)
- [ ] Numeracy - Number & Algebra
- [ ] Numeracy - Measurement & Geometry
- [ ] Numeracy - Statistics & Probability

---

## ☑️ Part 8: Deployment (2 hours)

### Domain
- [ ] Purchase domain (e.g., lantiteprep.com)
- [ ] Configure DNS

### Vercel Deploy
```bash
npm i -g vercel
vercel
# Follow prompts
# Add environment variables in Vercel dashboard
# Configure custom domain
```

### Verify
- [ ] Site loads on custom domain
- [ ] SSL certificate active
- [ ] All pages accessible
- [ ] Payment flow works
- [ ] Question loading works

---

## ☑️ Part 9: Testing (1 day)

### User Flows
- [ ] Sign up
- [ ] Purchase access
- [ ] Take practice test
- [ ] Complete skill drill
- [ ] View progress dashboard
- [ ] Access analytics

### Technical
- [ ] Error tracking configured
- [ ] Analytics tracking works
- [ ] Mobile responsive
- [ ] Performance acceptable (Lighthouse)

---

## ☑️ Part 10: Launch (1 week)

### Soft Launch
- [ ] Limited user testing
- [ ] Monitor errors
- [ ] Gather feedback
- [ ] Fix critical bugs

### Marketing Setup
- [ ] Google Ads account
- [ ] Conversion tracking
- [ ] Initial campaigns
- [ ] Set budget ($10-20/day start)

### Public Launch
- [ ] Announce on relevant channels
- [ ] Monitor traffic
- [ ] Monitor conversions
- [ ] Iterate based on data

---

## 🚀 Claude Code Prompts

### Prompt 1: Initial Setup
```
I've cloned the EduCourse repo to create a LANTITE platform.
Please help me:
1. Update all brand references (EduCourse → TeachPrep)
2. Simplify to single product (LANTITE)
3. Update package.json and configs

Let's start!
```

### Prompt 2: Curriculum Data
```
Create src/data/curriculumData_v2/lantite.ts with:
- Literacy Test (Reading, Writing sections)
- Numeracy Test (Number, Measurement, Statistics sections)
- 3-5 example questions per sub-skill
- Following the same structure as other test types
```

### Prompt 3: Landing Page
```
Update src/pages/Home.tsx for LANTITE:
- Single product focus
- Target: Teachers
- Emphasize: Literacy & Numeracy test prep
- Keep conversion-optimized structure
```

### Prompt 4: Question Generation
```
Generate 50 practice questions for LANTITE Literacy - Reading
using the V2 engine. Walk me through the process.
```

---

## 📊 Time Estimates

| Phase | Time | Status |
|-------|------|--------|
| Repo setup | 30 mins | ⏳ |
| Configuration | 1 hour | ⏳ |
| Curriculum data | 2 hours | ⏳ |
| Database setup | 1 hour | ⏳ |
| Landing pages | 2 hours | ⏳ |
| Stripe setup | 30 mins | ⏳ |
| Question generation | 1 week | ⏳ |
| Deployment | 2 hours | ⏳ |
| Testing | 1 day | ⏳ |
| Launch prep | 1 week | ⏳ |

**Total: ~2-3 weeks** (including question generation and testing)

---

## 🔗 Key Files Reference

### Must Change
```
.env
package.json
src/config/stripeConfig.ts
src/context/ProductContext.tsx
src/data/curriculumData_v2/lantite.ts (NEW)
src/data/curriculumData_v2/index.ts
src/pages/Home.tsx
src/pages/ProductLanding.tsx
src/components/Header.tsx
public/index.html
```

### Can Delete Later
```
src/data/curriculumData_v2/acer.ts
src/data/curriculumData_v2/edutest.ts
src/data/curriculumData_v2/nsw-selective.ts
src/data/curriculumData_v2/vic-selective.ts
src/data/curriculumData_v2/naplan-year5.ts
src/data/curriculumData_v2/naplan-year7.ts
```

---

## ✅ Success Criteria

You're ready to launch when:
- [ ] All sections have 200+ practice questions
- [ ] Payment flow works end-to-end
- [ ] Users can complete full practice tests
- [ ] Progress tracking is accurate
- [ ] Mobile experience is smooth
- [ ] Site performance is good (Lighthouse > 80)
- [ ] No critical bugs in error tracking
- [ ] Conversion tracking works

---

## 🆘 Need Help?

**Check these docs:**
- `LANTITE_DUPLICATION_GUIDE.md` - Full detailed guide
- `docs/01-generation/V2_ENGINE_COMPLETE_GUIDE.md` - Question generation
- `docs/05-architecture/` - Platform architecture
- `docs/10-marketing/` - Marketing and Google Ads

**Claude Code is your friend!**
Share the detailed guide and work through it systematically.

---

**You got this! 🚀**
