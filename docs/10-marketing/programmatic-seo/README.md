# Programmatic SEO - School-Specific Landing Pages

**Status:** 🚧 Phase 1 - Research & Setup (In Progress)
**Started:** March 31, 2026
**Target:** 150-200 school-specific pages optimized for SEO + AEO

---

## 📁 What We've Created

### Documentation
1. ✅ **`PERPLEXITY_RESEARCH_PROMPT.txt`** - Copy-paste prompt for Perplexity research
2. ✅ **`SCHOOL_DATABASE_SCHEMA.md`** - Database structure documentation
3. ✅ **`IMPLEMENTATION_LOG.md`** - Daily progress tracking
4. ✅ **`README.md`** - This file

### Code Structure
1. ✅ **`src/data/programmaticSEO/types.ts`** - TypeScript interfaces
2. ✅ **`src/data/programmaticSEO/schoolsDatabase.ts`** - Schools database (empty, ready for import)

### Directories Created
```
src/
├── data/programmaticSEO/          ✅ Database files
├── components/programmaticSEO/    ✅ React components (coming soon)
└── schemas/programmaticSEO/       ✅ Schema markup components (coming soon)

scripts/
└── programmatic-seo/              ✅ Build scripts (coming soon)

docs/10-marketing/programmatic-seo/ ✅ Documentation
```

---

## 🎯 YOUR NEXT STEPS

### Step 1: Run Perplexity Research (30-45 minutes)

1. **Open:** `docs/10-marketing/programmatic-seo/PERPLEXITY_RESEARCH_PROMPT.txt`
2. **Copy** the entire prompt
3. **Go to:** https://www.perplexity.ai
4. **Paste** the prompt
5. **Wait** for comprehensive results
6. **Export** as CSV or copy table to Google Sheets

**What Perplexity will provide:**
- Complete list of ALL NSW Selective schools (~47)
- Complete list of ALL VIC Selective schools (4)
- Comprehensive ACER scholarship schools list (~40-60)
- Comprehensive EduTest scholarship schools list (~50-80)
- All critical data: test dates, enrollment, acceptance rates, etc.
- Schools ranked by market size (largest to smallest)

**Expected outcome:** 150-200 schools total

---

### Step 2: Share Results with Claude (Me)

Once Perplexity completes:

**Option A: CSV File**
- Save Perplexity output as CSV
- Share the CSV file with me
- I'll import it automatically

**Option B: Copy-Paste**
- Copy the table from Perplexity
- Paste into our chat
- I'll parse and import it

**I will then:**
1. ✅ Parse the data
2. ✅ Generate school IDs (slugify names)
3. ✅ Map test types to products
4. ✅ Generate SEO metadata
5. ✅ Populate `schoolsDatabase.ts`
6. ✅ Create validation script
7. ✅ Show you the first 5 schools for review

---

### Step 3: Review & Approve (10 minutes)

I'll show you:
- First 5 schools in the database
- Data structure
- SEO metadata examples
- Any issues or missing data

You:
- Review for accuracy
- Confirm data looks correct
- Approve to proceed

---

### Step 4: I'll Build the First Page (1-2 hours)

Once data is approved, I'll create:
1. ✅ Schema markup components (FAQ, Course, etc.)
2. ✅ React components for page sections
3. ✅ Dynamic route: `/prep/:productSlug/:schoolSlug`
4. ✅ First working page (Melbourne High School)
5. ✅ Test page locally

You'll be able to:
- View the live page
- See all 8 content sections
- Test schema markup
- Verify SEO metadata
- Check mobile responsiveness

---

## 🔧 Technical Architecture

### URL Structure
```
/prep/{product-slug}/{school-slug}

Examples:
- /prep/vic-selective/melbourne-high-school
- /prep/nsw-selective/james-ruse-agricultural-high-school
- /prep/edutest-scholarship/trinity-grammar-sydney
- /prep/acer-scholarship/scotch-college-melbourne
```

### Product Mapping
| Test Type | Product Slug | Entry Years | Target |
|-----------|-------------|-------------|--------|
| VIC Selective | `vic-selective` | Year 9 | 4 schools |
| NSW Selective | `nsw-selective` | Year 7 | ~47 schools |
| ACER | `acer-scholarship` | Years 6-8 | ~40-60 schools |
| EduTest | `edutest-scholarship` | Years 6-8 | ~50-80 schools |

### Page Sections (8 total)
1. **Hero** - School name, test type, CTA
2. **Key Facts** - Dates, stats, acceptance rate (AEO-optimized)
3. **Test Details Table** - Sections, questions, time (AI-parseable)
4. **FAQ Section** - 8-12 school-specific Q&As (AEO-critical)
5. **Preparation Timeline** - 12mo, 6mo, 3mo, 1mo strategy
6. **Product Showcase** - How EduCourse helps
7. **Related Schools** - Internal linking
8. **Official Resources** - Citations

### Schema Markup (AEO)
- ✅ FAQPage schema
- ✅ Course schema
- ✅ EducationalOccupationalProgram schema
- ✅ BreadcrumbList schema

---

## 📊 Expected Outcomes

### Phase 1 (Weeks 1-2): Foundation
- ✅ Research complete
- ✅ Database populated
- ✅ First 5 pages built and tested
- ✅ Schema markup validated

### Phase 2 (Weeks 3-4): Scale
- ✅ All 150-200 pages generated
- ✅ Internal linking implemented
- ✅ Sitemap updated
- ✅ Google Search Console submission

### Phase 3 (Weeks 5-8): Optimize & Monitor
- ✅ AEO testing (ChatGPT, Perplexity, Claude)
- ✅ SEO performance tracking
- ✅ Conversion rate monitoring
- ✅ Content refinement

### 90-Day Goals
**SEO:**
- 100+ pages indexed
- 50+ keywords ranking
- 1,000+ impressions/month

**AEO:**
- Cited by ChatGPT for 5+ queries
- Cited by Perplexity for 10+ queries
- Cited by Claude for 5+ queries

**Conversions:**
- 5-10% conversion rate (vs 2-3% baseline)
- $5,000-$15,000 revenue from school pages

---

## 💡 Key Principles

1. **Grounded in truth** - Only factual data, cite official sources
2. **Answer Engine Optimized** - Direct answers, tables, FAQ schema
3. **Conversion-focused** - Every page drives to product purchase
4. **Scalable** - Built to handle 200+ schools easily
5. **Maintainable** - Annual updates for test dates

---

## 📞 Questions?

**"How long will Perplexity research take?"**
→ 30-45 minutes for comprehensive results. It's smart - it will find consolidated school calendars.

**"What if some data is missing?"**
→ No problem! Leave fields blank. We only use verified data. Better accurate than complete.

**"Can we add more schools later?"**
→ Absolutely! The system is designed to scale. Just add to the database.

**"How do we update test dates annually?"**
→ Simple script updates all dates. ~30 minutes/year.

**"Will this really help SEO?"**
→ Yes! School-specific pages target long-tail keywords with low competition. Plus AEO citations build domain authority.

---

## 🚀 READY TO START?

**Your immediate action:**

1. Open: `docs/10-marketing/programmatic-seo/PERPLEXITY_RESEARCH_PROMPT.txt`
2. Copy the entire prompt
3. Paste into Perplexity.ai
4. Wait for results (~30-45 min)
5. Export as CSV or copy table
6. Share results with me

**I'll be ready to:**
- Import the data
- Build the first page
- Get you live in 24-48 hours

Let's do this! 🎉

---

**Last updated:** March 31, 2026
