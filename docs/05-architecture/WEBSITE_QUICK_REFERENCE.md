# EduCourse Website - Quick Reference Summary

## File Locations

| Component | Path |
|-----------|------|
| **Homepage** | `/src/pages/Landing.tsx` (1,194 lines) |
| **Product Pages** | `/src/pages/CourseDetail.tsx` (1,101 lines) |
| **Product Data** | `/src/data/courses.ts` |
| **App Routes** | `/src/App.tsx` |

## The 6 Products

1. **Year 5 NAPLAN** → `/course/year-5-naplan`
2. **Year 7 NAPLAN** → `/course/year-7-naplan`
3. **ACER Scholarship** → `/course/acer-scholarship`
4. **EduTest Scholarship** → `/course/edutest-scholarship`
5. **NSW Selective Entry** → `/course/nsw-selective`
6. **VIC Selective Entry** → `/course/vic-selective`

## Homepage Sections (Landing.tsx)

1. **Navigation Bar** - Fixed, transparent on top, white on scroll
2. **Hero Section** - Split layout (text left, 3 overlapping screenshots right)
3. **Test Products** - 3x2 grid of product buttons with gradient backgrounds
4. **Methodology** - 3 steps (Diagnostic, Drills, Practice Tests) with alternating images
5. **Platform Features** - 3 features (Progress, Analytics, Feedback) + animated GIF
6. **School Logos** - 30 school logos in infinite carousel (70sec cycle)
7. **Testimonials** - 8 rotating testimonials with auto-play + manual controls
8. **FAQ** - 8 questions in accordion format
9. **Footer** - Final CTA + links + trust signals

## Product Page Sections (CourseDetail.tsx)

1. **Navigation Bar** - Identical to homepage
2. **Hero Section** - Test-specific headline + short description
3. **About the Test** - Tabbed interface showing test sections + sub-skills
4. **How It Works** - 4 features (Diagnostic, Drills, Tests, Analytics) + toggle screenshots
5. **What's Included** - 6 features grid (1000+ questions, 5 tests, AI writing, etc.)
6. **How it Works Steps** - 5 step cards (Purchase → Access → Diagnose → Practice → Progress)
7. **FAQ** - Same 8 FAQs as homepage
8. **Final CTA** - Gradient section with purchase button

## Key Messaging

**Homepage:** "Australia's Leading Test Preparation Platform"
- Broad appeal across all test types
- Focus on platform features and benefits
- Multiple CTAs ("Find Your Test", "See How It Works")

**Product Page:** "{Test Name} Test Prep"
- Test-specific positioning
- Detailed curriculum mapping
- Single primary CTA ("Start Improving Today - $199")

## Trust Signals

**All Pages:**
- 7-Day Money-Back Guarantee
- Instant Access
- 12 Months Access (product pages)
- Works on All Devices

**Homepage Only:**
- 8 parent testimonials with specific results
- 30 school logos (Victorian & NSW)
- "Trusted by 1000+ families"

**Product Pages Only:**
- Test section breakdowns
- Sub-skills curriculum mapping
- Expert-crafted claim

## Design System

**Colors:**
- Teal: `#4ECDC4` (primary accents)
- Coral Red: `#FF6B6B` (primary CTAs)
- Dark Purple: `#6366F1` (secondary, gradients)
- Navy Blue: `#3B4F6B` (text)

**Responsive:**
- Mobile: 1-column stacked
- Tablet: 2-column layouts
- Desktop: 3-column grids

**Animations:**
- Lenis smooth scrolling (lerp: 0.1)
- Intersection Observer for scroll reveals
- Framer Motion for complex animations
- 300-500ms timing for interactions

## Conversion Elements

**Quantity Claims:**
- 1000+ practice questions
- 5 full-length practice tests
- 30+ school logos
- 8 parent testimonials
- All at $199 price point

**Risk Reversal:**
- 7-day money-back guarantee
- Prominently displayed on all product pages

**Social Proof:**
- Parent testimonials with specific percentile improvements
- School logos (30+ elite schools)
- "1000+ families" reference

## Key Differences: Homepage vs Product Pages

| Element | Homepage | Product Page |
|---------|----------|--------------|
| Hero Background | Light teal gradient | Light coral gradient |
| Headlines | Platform-focused | Test-specific |
| Pricing | Not mentioned | $199 prominent |
| Guarantee | In footer only | Multiple locations |
| Trust Signals | Logos, testimonials | Test details, sub-skills |
| CTAs | 2 buttons (Find Test, How It Works) | 1 primary (Start Today) |
| Test Details | None | Full tabbed breakdown |

## Missing Elements (Optimization Opportunities)

- No video on homepage
- No specific outcome metrics in hero ("X% improvement")
- No expert credentials displayed
- No comparison with competitors
- No urgency copy ("limited spots", "time-sensitive")
- No student testimonials (only parent)
- No specific case studies with before/after
- No personalization or AI-driven recommendations preview

## Full Documentation

See `WEBSITE_STRUCTURE_ANALYSIS.md` for complete details on every section, line numbers, exact copy, styling specifications, and component structure.
