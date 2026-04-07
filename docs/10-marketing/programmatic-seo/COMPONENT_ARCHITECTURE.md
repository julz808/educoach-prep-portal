# School Prep Page - Component Architecture Plan

**Purpose:** Detailed plan for building school-specific landing page components
**Target:** Melbourne High School as first example, then scale to all schools
**Status:** 🔍 Awaiting approval before building

---

## 🎯 Page Structure Overview

Each school page will have **8 main sections** in this order:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. HERO SECTION                                              │
│    - School name + test type + entry year                   │
│    - Location, gender, school type                          │
│    - CTA: "Start Free Diagnostic Test"                      │
│    - School logo + platform screenshot                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 2. KEY FACTS BLOCK (AEO-Optimized)                          │
│    - Test date: June 20, 2026                               │
│    - Application window: Mar 2 - Apr 24, 2026               │
│    - Entry year: Year 9                                     │
│    - Places offered: 250                                    │
│    - Total applicants: ~12,000 (all 4 schools)              │
│    - Acceptance rate: ~7%                                   │
│    - ICSEA: 1178                                            │
│    - School type: Government Selective (Boys only)          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 3. WHAT'S ON THE TEST? (Table - AEO Critical)               │
│    ┌──────────────────────────────────────────────────────┐│
│    │ Section         │ Qs │ Time │ Skills Tested          ││
│    ├──────────────────────────────────────────────────────┤│
│    │ Numerical       │ 50 │ 30m  │ Patterns, algebra...   ││
│    │ Reading         │ 50 │ 35m  │ Inference, vocab...    ││
│    │ Verbal          │ 60 │ 30m  │ Analogies, logic...    ││
│    │ Quantitative    │ 50 │ 30m  │ Number sense...        ││
│    │ Writing         │ 2  │ 45m  │ Creative + persuasive  ││
│    │ TOTAL           │212 │170m  │ (2h 50min)             ││
│    └──────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 4. FAQ SECTION (AEO Critical)                               │
│    - 2 school-specific FAQs                                 │
│    - 9 general VIC Selective FAQs                           │
│    - Accordion UI (expandable)                              │
│    - FAQ schema markup                                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 5. PREPARATION TIMELINE                                     │
│    12 months before → 6 months → 3 months → 1 month         │
│    Specific actions for each milestone                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 6. EDUCOARSE PRODUCT SHOWCASE                               │
│    - How EduCourse helps for VIC Selective                  │
│    - "1000+ VIC Selective practice questions"               │
│    - Comparison table: Tutoring vs EduCourse                │
│    - CTA: "Start Free Diagnostic Test"                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 7. RELATED SCHOOLS                                          │
│    - Links to other 3 VIC Selective schools                 │
│    - "Also preparing for..." (internal linking)             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 8. OFFICIAL RESOURCES & CITATIONS                           │
│    - Link to school website                                 │
│    - Link to vic.gov.au selective entry portal              │
│    - Link to ACER Selective Entry                           │
│    - Builds credibility + domain authority                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Component File Structure

```
src/
├── pages/
│   └── SchoolPrepPage.tsx                    # Main page component (dynamic route)
│
├── components/
│   └── programmaticSEO/
│       ├── SchoolHero.tsx                    # Section 1: Hero
│       ├── SchoolKeyFacts.tsx                # Section 2: Key facts block
│       ├── TestDetailsTable.tsx              # Section 3: Test sections table
│       ├── SchoolFAQSection.tsx              # Section 4: FAQ accordion
│       ├── PreparationTimeline.tsx           # Section 5: Timeline
│       ├── ProductShowcase.tsx               # Section 6: EduCourse showcase
│       ├── RelatedSchools.tsx                # Section 7: Related schools
│       └── OfficialResources.tsx             # Section 8: Official links
│
└── schemas/
    └── programmaticSEO/
        ├── FAQPageSchema.tsx                 # FAQ schema markup
        ├── CourseSchema.tsx                  # Course schema markup
        ├── EducationalProgramSchema.tsx      # Test program schema
        └── BreadcrumbSchema.tsx              # Breadcrumb schema
```

---

## 🔧 Detailed Component Specifications

### 1. **SchoolHero.tsx**

**Purpose:** Eye-catching hero section with school identity and main CTA

**Props:**
```typescript
interface SchoolHeroProps {
  school: School;
}
```

**Design:**
```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  [School Logo]              Melbourne High School                │
│                            VIC Selective Entry Preparation 2027  │
│                                                                  │
│  📍 South Yarra, Victoria  |  👨 Boys Only  |  🎓 Year 9 Entry   │
│                                                                  │
│          [Start Free Diagnostic Test] [View Test Dates]         │
│                                                                  │
│  [Platform Screenshot - shows test interface]                   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Key Elements:**
- H1: `{school.name} Selective Entry Prep 2027`
- Subheading: Location, gender, entry year badges
- 2 CTAs: Primary (Start Free Diagnostic), Secondary (View Test Dates - scrolls to key facts)
- School logo (if available in `/public/images/school logos/`)
- Platform screenshot for social proof

**SEO:**
- H1 contains school name + test type + year
- Alt text on images
- Semantic HTML

---

### 2. **SchoolKeyFacts.tsx**

**Purpose:** AEO-optimized fact block with all critical dates/stats

**Props:**
```typescript
interface SchoolKeyFactsProps {
  school: School;
}
```

**Design:**
```
┌──────────────────────────────────────────────────────────────┐
│  📅 Key Dates & Facts                                         │
│                                                               │
│  ┌────────────────────┬────────────────────┬────────────────┐│
│  │ 📝 Applications    │ ✏️ Test Date       │ 📊 Results     ││
│  │ Open: Mar 2, 2026  │ June 20, 2026      │ Aug 3, 2026    ││
│  │ Close: Apr 24,2026 │                    │                ││
│  └────────────────────┴────────────────────┴────────────────┘│
│                                                               │
│  🎓 Entry Year: Year 9                                        │
│  📍 Location: South Yarra, Victoria                           │
│  👨 Gender: Boys only                                         │
│  🏫 School Type: Government Selective Entry                   │
│  📊 Total Enrollment: 1,400 students                          │
│  🎯 Places Offered: ~250 per year                             │
│  👥 Total Applicants: ~12,000 (across all 4 VIC schools)      │
│  📈 Acceptance Rate: ~7%                                      │
│  🎓 ICSEA Score: 1178 (National avg: 1000)                    │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Key Elements:**
- Dates prominently displayed (AEO-critical for "When is the test?" queries)
- All facts as structured data (not paragraphs)
- Icons for visual scanning
- ICSEA with context ("National avg: 1000")
- Acceptance rate with context

**AEO Optimization:**
- Structured as `<dl>` (definition list) or `<table>` for AI parsing
- EducationalOccupationalProgram schema markup
- Specific dates in ISO format in schema

---

### 3. **TestDetailsTable.tsx**

**Purpose:** AEO-optimized table of test sections (critical for AI citations)

**Props:**
```typescript
interface TestDetailsTableProps {
  testType: string;  // 'vic-selective', 'nsw-selective', etc.
  schoolName: string;  // For title: "What's on the Melbourne High School Test?"
}
```

**Design:**
```
┌─────────────────────────────────────────────────────────────────┐
│  ## What's on the Melbourne High School Test?                   │
│                                                                  │
│  The VIC Selective Entry Test is used for all 4 Victorian       │
│  government selective schools. All students sit the same test   │
│  on the same day.                                               │
│                                                                  │
│  ┌──────────────┬───────┬──────┬─────────────────────────────┐ │
│  │ Test Section │ Qs    │ Time │ Skills Tested               │ │
│  ├──────────────┼───────┼──────┼─────────────────────────────┤ │
│  │ Numerical    │ 50    │ 30m  │ Number patterns, algebra,   │ │
│  │ Reasoning    │       │      │ geometry, data analysis     │ │
│  ├──────────────┼───────┼──────┼─────────────────────────────┤ │
│  │ Reading      │ 50    │ 35m  │ Inference, comprehension,   │ │
│  │ Comprehension│       │      │ vocabulary, analysis        │ │
│  ├──────────────┼───────┼──────┼─────────────────────────────┤ │
│  │ Verbal       │ 60    │ 30m  │ Analogies, word relations,  │ │
│  │ Reasoning    │       │      │ logical connections         │ │
│  ├──────────────┼───────┼──────┼─────────────────────────────┤ │
│  │ Quantitative │ 50    │ 30m  │ Number sense, patterns,     │ │
│  │ Reasoning    │       │      │ proportional reasoning      │ │
│  ├──────────────┼───────┼──────┼─────────────────────────────┤ │
│  │ Writing      │ 2     │ 45m  │ Creative (15m) +            │ │
│  │              │       │      │ Persuasive (30m) writing    │ │
│  ├──────────────┼───────┼──────┼─────────────────────────────┤ │
│  │ **TOTAL**    │**212**│**170m**│ **(2 hours 50 minutes)** │ │
│  └──────────────┴───────┴──────┴─────────────────────────────┘ │
│                                                                  │
│  Source: ACER Selective Entry, vic.gov.au                       │
└─────────────────────────────────────────────────────────────────┘
```

**Key Elements:**
- H2: "What's on the {school name} Test?"
- HTML `<table>` for AI parsing
- Clear headers: Section, Questions, Time, Skills
- Total row at bottom (bold)
- Source citation
- Brief intro paragraph explaining all 4 schools use same test

**AEO Optimization:**
- Semantic HTML table (not CSS grid)
- Clear headers with `<th>` tags
- Totals clearly marked
- Citation to official source

---

### 4. **SchoolFAQSection.tsx**

**Purpose:** AEO-critical FAQ section with schema markup

**Props:**
```typescript
interface SchoolFAQSectionProps {
  schoolName: string;
  faqs: SchoolFAQ[];
}
```

**Design:**
```
┌────────────────────────────────────────────────────────────────┐
│  ## Frequently Asked Questions - Melbourne High School         │
│                                                                 │
│  ▼ When is the Melbourne High School test in 2027?             │
│     The Victorian Selective Entry Test for 2027 entry is...    │
│                                                                 │
│  ▼ What makes Melbourne High different from other VIC schools? │
│     Melbourne High School is Victoria's only government...     │
│                                                                 │
│  ▼ What is the VIC Selective Entry Test?                       │
│     The Victorian Selective Entry High School Placement...     │
│                                                                 │
│  [Show 3 more FAQs...]                                         │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

**Key Elements:**
- H2: "Frequently Asked Questions - {school name}"
- Accordion UI (shadcn/ui Accordion component)
- School-specific FAQs first (2), then general FAQs (9)
- "Show more" button if >6 FAQs
- Each FAQ has category badge (Dates, Requirements, Preparation)

**AEO Optimization:**
- FAQPage schema markup (critical!)
- Direct, factual answers (no fluff)
- Citations where applicable
- Each Q&A is self-contained (no "see above")

---

### 5. **PreparationTimeline.tsx**

**Purpose:** Practical timeline for test prep

**Props:**
```typescript
interface PreparationTimelineProps {
  testDate: string;  // "2026-06-20"
  schoolName: string;
}
```

**Design:**
```
┌────────────────────────────────────────────────────────────────┐
│  ## How to Prepare for Melbourne High School                   │
│                                                                 │
│  📅 12 Months Before (June 2025)                               │
│  ✓ Take free diagnostic test to identify strengths/weaknesses  │
│  ✓ Begin reading widely (30min daily)                          │
│  ✓ Start basic mathematics review                              │
│                                                                 │
│  📅 6 Months Before (December 2025)                            │
│  ✓ Complete 2-3 practice tests per month                       │
│  ✓ Focus on weak areas identified in diagnostics               │
│  ✓ Practice writing to time (15min creative, 30min persuasive) │
│  ✓ Build vocabulary (learn 10 new words weekly)                │
│                                                                 │
│  📅 3 Months Before (March 2026)                               │
│  ✓ Take full-length practice tests weekly                      │
│  ✓ Review test strategies (time management, guessing)          │
│  ✓ Simulate test conditions at home                            │
│                                                                 │
│  📅 1 Month Before (May 2026)                                  │
│  ✓ Final practice tests (2-3 per week)                         │
│  ✓ Review weak areas one last time                             │
│  ✓ Prepare mentally (rest, nutrition, confidence)              │
│  ✓ Familiarize with test day logistics                         │
│                                                                 │
│  [Start Your Preparation Today - Free Diagnostic Test]         │
└────────────────────────────────────────────────────────────────┘
```

**Key Elements:**
- H2: "How to Prepare for {school name}"
- 4 milestones: 12mo, 6mo, 3mo, 1mo before
- Each milestone has 3-5 action items
- Checkboxes for visual appeal
- CTA at end
- Timeline auto-calculates from test date

---

### 6. **ProductShowcase.tsx**

**Purpose:** Conversion-focused EduCourse pitch

**Props:**
```typescript
interface ProductShowcaseProps {
  testType: string;
  schoolName: string;
}
```

**Design:**
```
┌────────────────────────────────────────────────────────────────┐
│  ## Prepare for Melbourne High with EduCourse                  │
│                                                                 │
│  ✅ 1000+ VIC Selective Entry practice questions               │
│  ✅ 5 full-length practice tests matching real exam format     │
│  ✅ Diagnostic test to identify your weak areas                │
│  ✅ Targeted drills for each test section                      │
│  ✅ AI-powered writing feedback (instant scoring)              │
│  ✅ Detailed analytics tracking progress over time             │
│                                                                 │
│  ### Tutoring vs EduCourse                                     │
│  ┌─────────────────┬──────────────┬─────────────────────┐     │
│  │                 │ Private Tutor│ EduCourse           │     │
│  ├─────────────────┼──────────────┼─────────────────────┤     │
│  │ Cost            │ $80-150/hr   │ $47 one-time        │     │
│  │ Total Cost      │ $800-1,800   │ $47                 │     │
│  │ Practice Qs     │ Limited      │ 1000+               │     │
│  │ Availability    │ Scheduled    │ 24/7                │     │
│  │ Feedback        │ Weekly       │ Instant             │     │
│  │ Progress Track  │ Manual notes │ Automated analytics │     │
│  └─────────────────┴──────────────┴─────────────────────┘     │
│                                                                 │
│  [Start Free Diagnostic Test] [View Full Course ($47)]         │
└────────────────────────────────────────────────────────────────┘
```

**Key Elements:**
- H2: "Prepare for {school name} with EduCourse"
- 6 benefit bullets (specific to test type)
- Comparison table (tutoring vs EduCourse)
- 2 CTAs: Free diagnostic + Paid course
- Course schema markup

---

### 7. **RelatedSchools.tsx**

**Purpose:** Internal linking to other schools (SEO)

**Props:**
```typescript
interface RelatedSchoolsProps {
  currentSchoolId: string;
  testType: string;
}
```

**Design:**
```
┌────────────────────────────────────────────────────────────────┐
│  ## Also Preparing For...                                      │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ Mac.Robertson│  │ Nossal High  │  │ Suzanne Cory │        │
│  │ Girls' High  │  │ School       │  │ High School  │        │
│  │              │  │              │  │              │        │
│  │ Girls only   │  │ Co-ed        │  │ Co-ed        │        │
│  │ Melbourne CBD│  │ Berwick      │  │ Werribee     │        │
│  │ [Learn More] │  │ [Learn More] │  │ [Learn More] │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└────────────────────────────────────────────────────────────────┘
```

**Key Elements:**
- H2: "Also Preparing For..."
- Cards for 3 related schools (same test type, exclude current school)
- Each card: School name, gender, location, CTA link
- Links go to `/prep/vic-selective/{school-slug}`

**SEO Benefits:**
- Internal linking between related pages
- Helps Google understand content relationships
- Keeps users on site

---

### 8. **OfficialResources.tsx**

**Purpose:** Build credibility + provide official links

**Props:**
```typescript
interface OfficialResourcesProps {
  school: School;
}
```

**Design:**
```
┌────────────────────────────────────────────────────────────────┐
│  ## Official Resources                                          │
│                                                                 │
│  🔗 Melbourne High School Official Website                     │
│     https://mhs.vic.edu.au/                                    │
│                                                                 │
│  🔗 VIC Selective Entry Portal (Applications)                  │
│     https://www.vic.gov.au/selective-entry-high-schools        │
│                                                                 │
│  🔗 ACER Selective Entry (Test Information)                    │
│     https://selectiveentry.acer.org/vic                        │
│                                                                 │
│  📋 Important: Always verify test dates and requirements on    │
│     official websites. Information on this page is updated     │
│     regularly but official sources are authoritative.          │
└────────────────────────────────────────────────────────────────┘
```

**Key Elements:**
- H2: "Official Resources"
- 3 links: School website, Government portal, ACER
- Disclaimer about verifying with official sources
- Links open in new tab with `rel="noopener noreferrer"`

**Benefits:**
- Builds trust (we cite official sources)
- Good for domain authority (outbound links to authoritative sites)
- AEO-friendly (AI likes citations)

---

## 🔗 Page Routing

### Route Setup

**File:** `src/App.tsx`

**Add this route:**
```typescript
<Route path="/prep/:productSlug/:schoolSlug" element={<SchoolPrepPage />} />
```

**Examples:**
- `/prep/vic-selective/melbourne-high-school`
- `/prep/vic-selective/mac-robertson-girls-high-school`
- `/prep/nsw-selective/james-ruse-agricultural-high-school` (coming soon)

### SchoolPrepPage Component

**File:** `src/pages/SchoolPrepPage.tsx`

**Logic:**
```typescript
const SchoolPrepPage = () => {
  const { productSlug, schoolSlug } = useParams();

  // Get school from database
  const school = getSchoolBySlug(productSlug, schoolSlug);

  // If school not found, show 404
  if (!school) return <NotFound />;

  // Render page with all 8 sections
  return (
    <>
      <SEOHead metadata={generateSEOMetadata(school)} />
      <FAQPageSchema faqs={school.faqs} />
      <CourseSchema course={school} />
      <EducationalProgramSchema school={school} />
      <BreadcrumbSchema school={school} />

      <div className="min-h-screen bg-white">
        <SchoolHero school={school} />
        <SchoolKeyFacts school={school} />
        <TestDetailsTable testType={school.testType} schoolName={school.name} />
        <SchoolFAQSection schoolName={school.name} faqs={school.faqs} />
        <PreparationTimeline testDate={school.testDates.testDate} schoolName={school.name} />
        <ProductShowcase testType={school.testType} schoolName={school.name} />
        <RelatedSchools currentSchoolId={school.id} testType={school.testType} />
        <OfficialResources school={school} />
      </div>
    </>
  );
};
```

---

## 📊 Schema Markup (AEO Critical)

### 1. FAQPageSchema.tsx

```typescript
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "When is the Melbourne High School test in 2027?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The Victorian Selective Entry Test for 2027 entry..."
      }
    }
    // ... all FAQs
  ]
}
```

### 2. CourseSchema.tsx

```typescript
{
  "@context": "https://schema.org",
  "@type": "Course",
  "name": "Melbourne High School VIC Selective Entry Preparation",
  "description": "Complete preparation course for Melbourne High School...",
  "provider": {
    "@type": "Organization",
    "name": "EduCourse"
  },
  "offers": {
    "@type": "Offer",
    "price": "47",
    "priceCurrency": "AUD"
  }
}
```

### 3. EducationalOccupationalProgram Schema

```typescript
{
  "@context": "https://schema.org",
  "@type": "EducationalOccupationalProgram",
  "name": "VIC Selective Entry Test",
  "provider": {
    "@type": "EducationalOrganization",
    "name": "Melbourne High School"
  },
  "startDate": "2026-06-20",
  "applicationDeadline": "2026-04-24"
}
```

### 4. BreadcrumbSchema.tsx

```typescript
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://educourse.com.au"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "VIC Selective Entry",
      "item": "https://educourse.com.au/course/vic-selective"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Melbourne High School",
      "item": "https://educourse.com.au/prep/vic-selective/melbourne-high-school"
    }
  ]
}
```

---

## 🎨 Design Principles

### Visual Hierarchy
1. **Hero:** Large, bold, eye-catching
2. **Key Facts:** Scannable, icon-based
3. **Test Table:** Clean, professional table
4. **FAQ:** Accordion (collapsed by default)
5. **Timeline:** Vertical timeline with milestones
6. **Product:** Conversion-focused, clear value prop
7. **Related:** Card grid
8. **Resources:** Simple link list

### Styling Approach
- **Use existing Tailwind classes** from your codebase
- **Match CourseDetail.tsx style** for consistency
- **Mobile-first** responsive design
- **Accessibility:** WCAG 2.1 AA compliant

### Colors (from existing brand)
- Primary: `#4ECDC4` (Teal)
- Secondary: `#FF6B6B` (Coral)
- Text: `#333` (Dark gray)
- Background: `#FFF` (White)
- Accents: Use existing color scheme

---

## ⏱️ Implementation Timeline

**If approved, here's the build sequence:**

### Day 1 (Today - 3-4 hours)
1. ✅ Build all 8 section components (SchoolHero, SchoolKeyFacts, etc.)
2. ✅ Build all 4 schema components
3. ✅ Create SchoolPrepPage main component
4. ✅ Add routing to App.tsx
5. ✅ Test Melbourne High School page locally
6. ✅ Show you for review

### Day 2 (Tomorrow - 1-2 hours)
1. ✅ Incorporate your feedback
2. ✅ Build remaining 3 VIC pages (Mac.Rob, Nossal, Suzanne Cory)
3. ✅ Test all 4 pages
4. ✅ Deploy to production
5. ✅ Update sitemap
6. ✅ Submit to Google Search Console

---

## ❓ Questions for You

Before I start building, please confirm:

1. **Design approval:** Does this page structure look good to you?
2. **Section order:** Happy with the 8 sections in this order?
3. **Content tone:** Factual, direct, AEO-optimized - is this the right tone?
4. **CTAs:** "Start Free Diagnostic Test" as primary CTA - correct?
5. **Any sections to add/remove?** Anything missing you want included?
6. **Any specific design preferences?** (colors, layout tweaks, etc.)

---

## 🚀 Ready to Build?

Once you approve this plan, I'll:
1. Build all components in ~3-4 hours
2. Test Melbourne High School page
3. Show you the live page for review
4. Iterate based on your feedback
5. Build remaining 3 VIC pages
6. Deploy to production

**Say "approved" and I'll start building!** 🎯

Or let me know any changes you'd like to make first.
