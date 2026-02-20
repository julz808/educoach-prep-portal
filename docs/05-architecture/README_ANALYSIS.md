# EduCourse Website Structure Analysis - Complete Documentation

This directory contains a comprehensive analysis of the EduCourse website structure, including the homepage and all 6 product landing pages.

## Documents Created

### 1. **WEBSITE_STRUCTURE_ANALYSIS.md** (725 lines, 25KB)
   **Most Comprehensive Reference**
   
   Contains:
   - Complete homepage structure (Landing.tsx)
   - All 6 product landing page structure (CourseDetail.tsx)
   - Product data mapping (courses.ts)
   - Every section with line numbers and file locations
   - Exact copy and messaging
   - Color specifications
   - Animation details
   - Trust signals and conversion elements
   - Missing optimization elements
   - Route structure and responsive design
   
   **Best for:** Detailed understanding of page structure, exact copy, and styling specs

---

### 2. **WEBSITE_QUICK_REFERENCE.md** (155 lines, 4.5KB)
   **Quick Lookup Guide**
   
   Contains:
   - File locations table
   - 6 Products with URLs
   - Homepage sections list (9 sections)
   - Product page sections list (8 sections)
   - Key messaging comparison
   - Trust signals summary
   - Design system colors
   - Missing optimization elements
   
   **Best for:** Quick reference, finding file locations, understanding messaging differences

---

### 3. **SECTION_BREAKDOWN.md** (650+ lines, 17KB)
   **Detailed Visual Breakdown**
   
   Contains:
   - Homepage section-by-section analysis
   - Product page section-by-section analysis
   - Line number ranges
   - HTML structure notes
   - Exact styling specifications
   - Button colors and states
   - Layout patterns for each breakpoint
   - Animation specifications
   - Responsive design patterns
   
   **Best for:** Understanding exact layouts, styling, and how sections are built

---

### 4. **ANALYSIS_SUMMARY.txt** (150+ lines, 13KB)
   **Executive Summary**
   
   Contains:
   - Project overview
   - Key files analyzed
   - 6 Products list with details
   - Homepage sections overview
   - Product page sections overview
   - Key messaging differences
   - Conversion elements
   - Design system
   - Responsive design specs
   - Animations and interactions
   - Key findings
   - Recommendations for optimization
   
   **Best for:** Getting the big picture, understanding architecture, key findings

---

## Quick Navigation

### Finding Information

**"I need to understand the homepage structure"**
→ Start with: WEBSITE_QUICK_REFERENCE.md (sections list)
→ Then read: WEBSITE_STRUCTURE_ANALYSIS.md (detailed breakdown)

**"I need to find a specific section's styling"**
→ Use: SECTION_BREAKDOWN.md (organized by section)

**"I need to understand the messaging strategy"**
→ Read: WEBSITE_QUICK_REFERENCE.md (Key Messaging section)
→ Then: WEBSITE_STRUCTURE_ANALYSIS.md (Messaging Differences)

**"I need to understand the conversion strategy"**
→ Read: ANALYSIS_SUMMARY.txt (Key Findings)
→ Then: WEBSITE_STRUCTURE_ANALYSIS.md (Trust Signals section)

**"I need exact line numbers and file paths"**
→ Use: WEBSITE_STRUCTURE_ANALYSIS.md (has line numbers throughout)
→ Or: SECTION_BREAKDOWN.md (organized by line ranges)

---

## Key Statistics

- **Homepage File:** `/src/pages/Landing.tsx` (1,194 lines)
- **Product Page File:** `/src/pages/CourseDetail.tsx` (1,101 lines)
- **Products:** 6 test preparation courses, all priced at $199
- **Homepage Sections:** 9 major sections
- **Product Page Sections:** 8 major sections (plus unique "About the Test" tabbed section)
- **School Logos:** 30 (15 Victorian, 15 NSW)
- **Testimonials:** 8 parent testimonials
- **FAQs:** 8 questions (shared between homepage and product pages)

---

## The 6 Products

All accessible via `/course/{slug}`:

1. **Year 5 NAPLAN** (year-5-naplan)
   - Target: Year 5 students or Year 4 preparing early
   
2. **Year 7 NAPLAN** (year-7-naplan)
   - Target: Year 7 students and ambitious Year 6s

3. **ACER Scholarship** (acer-scholarship)
   - Target: Students in Year 5-9 applying for scholarships

4. **EduTest Scholarship** (edutest-scholarship)
   - Target: Students applying to independent schools (Year 9 entry)

5. **NSW Selective Entry** (nsw-selective)
   - Target: Year 6 students preparing for Year 7 entry

6. **VIC Selective Entry** (vic-selective)
   - Target: Year 8 students sitting VIC selective test

---

## Homepage Key Sections

1. **Navigation Bar** - Fixed header with dropdown menu
2. **Hero Section** - Split layout with CTAs
3. **Test Products** - 6 product buttons in grid
4. **Methodology** - 3-step process with images
5. **Platform Features** - 3 features + animated GIF
6. **School Logos** - 30 logos in infinite carousel
7. **Testimonials** - 8 rotating parent testimonials
8. **FAQ** - 8 questions in accordion
9. **Footer** - Final CTA + links

---

## Product Page Key Sections

1. **Navigation Bar** - Identical to homepage
2. **Hero Section** - Test-specific headline + CTA
3. **About the Test** - Tabbed interface with curriculum details
4. **How It Works** - 4 features with toggle screenshots
5. **What's Included** - 6 features in grid
6. **How it Works Steps** - 5-step process with cards
7. **FAQ** - Same 8 questions as homepage
8. **Final CTA** - Gradient section with purchase button

---

## Design System

**Primary Colors:**
- Teal: `#4ECDC4` (accents, highlights)
- Coral Red: `#FF6B6B` (CTAs, testimonials)
- Dark Purple: `#6366F1` (secondary, gradients)

**Fonts:**
- Primary: Inter
- Weights: 300-700
- Body leading: 1.5-1.6
- Headlines: 1.2-1.3

**Spacing:**
- 8px grid system
- Generous whitespace
- Consistent padding/margins

**Shadows:**
- Subtle (sm), Medium (lg), Heavy (xl)
- Used for card elevation and depth

**Border Radius:**
- Cards: 8-12px
- Buttons: 8px
- Sections: 12-24px

---

## Messaging Strategy

**Homepage Positioning:**
- "Australia's Leading Test Preparation Platform"
- Umbrella approach covering all test types
- Focus on platform features and methodology
- Multiple entry points for user engagement

**Product Page Positioning:**
- "{Test Name} Test Prep"
- Test-specific expertise and curriculum mapping
- Detailed section breakdowns and sub-skills
- Clear, single conversion path to purchase

---

## Trust Signals

**Universal Trust Elements:**
- 7-Day Money-Back Guarantee (primary risk reversal)
- Instant Access guarantee
- 12 Months Access (product pages)
- Works on All Devices

**Homepage Trust Elements:**
- 8 parent testimonials with specific results
- 30+ elite school logos
- "Trusted by 1000+ families" claim

**Product Page Trust Elements:**
- Detailed test section information
- Sub-skills curriculum mapping
- Question counts and time limits
- "Expert-crafted" claims

---

## Conversion Elements

**Call-to-Action Strategy:**
- Homepage: Multiple CTAs with clear hierarchy
  - Primary: "Find Your Test" (scroll to products)
  - Secondary: "See how it works" (scroll to methodology)
  - Tertiary: Footer CTAs for different interests
  
- Product Pages: Single, focused primary CTA
  - "Start Improving Today - $199"
  - Repeated throughout page
  - Prominent in final section

**Pricing:**
- All products: $199
- No monthly subscriptions mentioned
- 12-month access period
- 7-day money-back guarantee

---

## Missing Elements (Opportunities for Improvement)

1. **No Video Content** - Demo videos could increase engagement
2. **No Outcome Metrics** - Specific improvement percentages in hero
3. **No Expert Credentials** - Teacher/instructor bios and qualifications
4. **No Comparisons** - Competitor comparison tables
5. **No Urgency/Scarcity** - "Limited spots", "Early bird pricing"
6. **No Student Testimonials** - Only parent testimonials
7. **No Case Studies** - Detailed before/after stories
8. **No Personalization** - Quiz or recommendation engine

---

## Animation and Interaction Details

**Scroll-Based Animations:**
- Intersection Observer triggers
- 20% visibility threshold
- Fade up, slide in effects
- Staggered timing for grouped elements

**Smooth Scrolling:**
- Lenis library implementation
- Lerp: 0.1
- Wheel multiplier: 0.8
- Smooth, professional feel

**Auto-Playing Elements:**
- Testimonials: 5-second interval
- School logos: 70-second carousel
- Both with manual controls

**Hover Effects:**
- Scale transformations (1.02-1.1)
- Shadow elevation
- Color transitions
- Smooth 300ms timing

---

## Responsive Breakpoints

- **Mobile:** < 768px (1-column, stacked, hamburger menu)
- **Tablet:** 768px - 1024px (2-column grids, adjusted spacing)
- **Desktop:** 1024px+ (3-column grids, full effects, hover states)

---

## File Locations Summary

| Component | Path |
|-----------|------|
| Homepage | `/src/pages/Landing.tsx` |
| Product Pages | `/src/pages/CourseDetail.tsx` |
| Product Data | `/src/data/courses.ts` |
| Routes | `/src/App.tsx` |
| Curriculum Data | `/src/data/curriculumData.ts` |
| SEO Components | `/src/components/SEOHead.tsx` |
| Layout | `/src/components/Layout.tsx` |

---

## Recommendations for Optimization

**Homepage:**
1. Add 7-day guarantee badge to hero section
2. Include specific conversion rate or outcome metric
3. Add hero video or GIF demo
4. Create "Why Choose Us" expert credentials section
5. Add sense of urgency copy

**Product Pages:**
1. Add student success stories and testimonials
2. Include instructor credentials and bios
3. Create comparison table with alternatives
4. Add test-specific FAQ section
5. Include progress prediction or outcome calculator

**General Conversion:**
1. Implement exit-intent popup offer
2. Add live chat for questions
3. Create time-limited discount offers
4. Add social proof badges (like "Trusted by X students")
5. Implement email capture forms with lead magnets

---

## Using This Documentation

These documents are designed to be used together:

1. **Start here:** WEBSITE_QUICK_REFERENCE.md (5-minute overview)
2. **Then read:** WEBSITE_STRUCTURE_ANALYSIS.md (detailed deep dive)
3. **For specifics:** SECTION_BREAKDOWN.md (styling and layout details)
4. **For strategy:** ANALYSIS_SUMMARY.txt (architecture and recommendations)

All documents reference file paths, line numbers, and specific locations for easy navigation and verification.

---

**Last Updated:** January 2, 2026
**Analysis Type:** Complete website structure analysis
**Files Analyzed:** Landing.tsx (1,194 lines), CourseDetail.tsx (1,101 lines), courses.ts
**Coverage:** Homepage + 6 product landing pages

---

## Questions or Need More Info?

Each document contains:
- Exact line numbers for reference
- File paths for verification
- Specific styling specifications
- Copy and messaging examples
- Animation and interaction details
- Design system specifications

Use the table of contents in each document to find specific sections quickly.

