# Programmatic SEO Implementation Log

**Project:** School-Specific Landing Pages for AEO + SEO
**Started:** March 31, 2026
**Target:** 2027 entry dates

---

## Day 1: March 31, 2026

### ✅ Phase 1: Planning & Setup

**Completed:**
1. ✅ Created project plan and strategy
2. ✅ Created Perplexity research prompt (`PERPLEXITY_RESEARCH_PROMPT.txt`)
3. ✅ Set up documentation structure in `docs/10-marketing/programmatic-seo/`
4. ✅ Defined scope: 4 products (EduTest, ACER, VIC Selective, NSW Selective)

**Key Decisions:**
- **Target year:** 2027 entry (use 2026 dates if 2027 not published)
- **Products:** Excluding NAPLAN (not school-specific)
- **Approach:** Static page generation (Option B) for better SEO
- **Expected schools:** 150-200 total
  - NSW Selective: ~47 schools
  - VIC Selective: 4 schools
  - ACER: ~40-60 schools
  - EduTest: ~50-80 schools

**Core Principles:**
1. ✅ Grounded in truth - fact-based only, no made-up data
2. ✅ Correct test-to-school mapping
3. ✅ URLs: `/prep/{product-slug}/{school-slug}`
4. ✅ Cite official sources
5. ✅ Direct, comprehensive answers (AEO-optimized)
6. ✅ Option B: Individual page files for better SEO

**Next Steps:**
- [ ] User runs Perplexity research prompt
- [ ] User exports school data as CSV
- [ ] Import and structure data into TypeScript database
- [ ] Create database schema file

---

## Research Progress

### Perplexity Research
- **Status:** Waiting for user to run prompt
- **Prompt location:** `docs/10-marketing/programmatic-seo/PERPLEXITY_RESEARCH_PROMPT.txt`
- **Expected output:** CSV with 150-200 schools ranked by market size

**Data Fields Requested:**
- School identity (name, state, suburb, URL)
- Test mapping (test type, entry years, gender)
- Test dates (2027 or 2026)
- Market sizing (enrollment, places, applicants, ICSEA, acceptance rate)
- Additional context (scholarship type, prerequisites)

---

## Technical Architecture

### URL Structure
```
/prep/{product-slug}/{school-slug}

Examples:
- /prep/vic-selective/melbourne-high-school
- /prep/nsw-selective/james-ruse-agricultural-high-school
- /prep/edutest-scholarship/trinity-grammar-sydney
- /prep/acer-scholarship/scotch-college-melbourne
```

### File Structure (Planned)
```
src/
├── pages/
│   └── prep/
│       └── SchoolPrepPage.tsx              # Dynamic route component
├── components/
│   └── programmaticSEO/
│       ├── SchoolHero.tsx
│       ├── SchoolKeyFacts.tsx
│       ├── TestDetailsTable.tsx
│       ├── SchoolFAQ.tsx
│       ├── PreparationTimeline.tsx
│       ├── ProductShowcase.tsx
│       └── RelatedSchools.tsx
├── data/
│   └── programmaticSEO/
│       ├── schoolsDatabase.ts
│       ├── faqDatabase.ts
│       └── testDetailsDatabase.ts
└── schemas/
    └── programmaticSEO/
        ├── FAQPageSchema.tsx
        ├── CourseSchema.tsx
        └── EducationalProgramSchema.tsx
```

### Routing Approach
- React Router dynamic segment: `/prep/:productSlug/:schoolSlug`
- Component finds school in database by slug matching
- Returns 404 if school not found

---

## Content Strategy

### Page Sections (8 total)
1. **Hero** - School name, test type, year, CTA
2. **Key Facts Block** - Test dates, location, places, acceptance rate (AEO-optimized)
3. **Test Details Table** - Sections, questions, time, skills (table for AI parsing)
4. **FAQ Section** - 8-12 school-specific Q&As (FAQ schema)
5. **Preparation Timeline** - 12mo, 6mo, 3mo, 1mo before test
6. **Product Showcase** - How EduCourse helps, comparison to tutoring
7. **Related Schools** - Internal linking to similar schools
8. **Official Resources** - Links to school site, gov sites, ACER/EduTest

### AEO Optimization Checklist
- [ ] FAQ schema markup
- [ ] Course schema markup
- [ ] EducationalOccupationalProgram schema
- [ ] BreadcrumbList schema
- [ ] HTML tables for test details (AI-parseable)
- [ ] Direct, factual answers (no fluff)
- [ ] Specific dates and numbers
- [ ] Citation of official sources

---

## Metrics to Track

### SEO Metrics (Target: 90 days)
- Pages indexed in Google
- Keywords ranking (top 50, top 20, top 10)
- Impressions from school pages
- Clicks from school pages
- Average position

### AEO Metrics (Target: 90 days)
- Citations in ChatGPT responses
- Citations in Perplexity responses
- Citations in Claude responses
- School pages appearing in AI-generated study plans

### Conversion Metrics (Target: 90 days)
- Conversion rate on school pages vs general product pages
- Revenue attributed to school pages
- Purchases from school-page traffic

---

## Notes & Learnings

### March 31, 2026
- User confirmed focusing on 2027 dates (2026 already passed for most tests)
- Important to find consolidated EduTest/ACER school calendars
- Ranking by market size helps prioritize which pages to build/promote first
- Excluding NAPLAN because it's not school-specific

---

## Questions Log

**Q1:** Should we include ALL schools or just top 25 per state?
**A1:** ALL schools - be exhaustive. Rank by market size so we know which to prioritize.

**Q2:** What year to target?
**A2:** 2027 entry (use 2026 dates if 2027 not published yet)

**Q3:** How to find all schools?
**A3:** EduTest and ACER publish consolidated school calendars - find these first.

---

**Last updated:** March 31, 2026
**Next update:** After Perplexity research completed
