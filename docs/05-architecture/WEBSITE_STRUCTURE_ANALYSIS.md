# EduCourse Website Structure Analysis
## Homepage & All 6 Product Landing Pages - Comprehensive Report

---

## EXECUTIVE SUMMARY

**Project Structure:**
- **Single Page Application**: Built with React/TypeScript
- **Framework**: Vite with React Router for navigation
- **Homepage File**: `/Users/julz88/Documents/educoach-prep-portal-2/src/pages/Landing.tsx` (1,194 lines)
- **Product Pages File**: `/Users/julz88/Documents/educoach-prep-portal-2/src/pages/CourseDetail.tsx` (1,101 lines)
- **Data Source**: `/Users/julz88/Documents/educoach-prep-portal-2/src/data/courses.ts`

**6 Products Available:**
1. Year 5 NAPLAN
2. Year 7 NAPLAN
3. ACER Scholarship (Year 7 Entry)
4. EduTest Scholarship (Year 7 Entry)
5. NSW Selective Entry (Year 7 Entry)
6. VIC Selective Entry (Year 9 Entry)

---

## HOMEPAGE STRUCTURE (Landing.tsx)

**File Path:** `/Users/julz88/Documents/educoach-prep-portal-2/src/pages/Landing.tsx`

### 1. NAVIGATION BAR (Lines 312-429)
**Type:** Fixed top navigation with dynamic transparency

**Elements:**
- **Logo**: EduCourse logo (clickable, returns to home)
- **Learning Products Dropdown**: Links to all 6 product pages using `/course/{slug}` routes
- **Insights Link**: External link to `https://insights.educourse.com.au/`
- **Login Button**: Styled with teal outline, links to `/auth`
- **Mobile Menu**: Hamburger menu that expands on mobile devices

**Styling Details:**
- Fixed positioning with `z-50`
- Transparent background that becomes `bg-white/95 backdrop-blur-sm` on scroll
- Subtle shadow appears on scroll (`shadow-sm`)
- Navy blue text (`#3B4F6B`) with teal hover states (`#4ECDC4`)
- Dark purple CTA accent (`#6366F1`)

---

### 2. HERO SECTION (Lines 431-597)
**Background:** Gradient from light teal (`#E6F7F5`) to white

**Content - Left Side (Lines 436-525):**
- **Headline**: "Australia's Leading Test Preparation Platform"
- **Subheadline**: "Give your child the edge they need with Australia's most comprehensive test prep platform for NAPLAN, selective entry, and scholarship exams."
  - Emphasizes: NAPLAN, selective entry, scholarship exams (bold text)
  
**Key Points** (3 bullet points with CheckCircle icons):
1. "Designed by expert teachers and instructors"
2. "1000+ practice questions, with full-length practice tests"
3. "Detailed performance feedback and insights"

**CTAs** (2 buttons):
1. **Primary**: "Find Your Test" (dark purple, links to products section with scroll animation)
2. **Secondary**: "See how it works" (purple outline, links to methodology section)

**Animations:**
- Staggered fade-in sequence on load
- Letter-by-letter animated headline component
- Hover effects on CTAs with scale and translation

**Visuals - Right Side (Lines 528-594):**
- **Mobile**: Single centered screenshot with rounded corners and shadow
- **Desktop**: 3 overlapping rotated screenshots in cascade
  - Dashboard view (top right, rotated 3°)
  - Reading simulation (middle left, rotated -2°)
  - Performance analytics (front right, rotated 1°)
  - Each has hover effects (scale, rotation adjustment, enhanced shadow)

---

### 3. TEST PRODUCTS SECTION (Lines 599-687)
**Background:** White
**ID:** `products` (used for scroll anchor)

**Header:**
- **Title**: "Find Your Test Preparation Package"
- **Subtitle**: Removed in latest version

**Product Grid:**
- **Layout**: 3 columns on desktop, 2 on tablet, 1 on mobile
- **Button Styling**: 
  - Gradient background: teal to purple (`from-[#4ECDC4] to-[#6366F1]`)
  - Hover state: darker gradient
  - Height: `py-8` (large, prominent)
  - Text: White, bold, large font size
  - Shadow on normal and hover states

**Product Buttons** (6 buttons linking to `/course/{slug}`):
1. Year 5 NAPLAN
2. Year 7 NAPLAN
3. ACER Scholarship
4. EduTest Scholarship
5. NSW Selective Entry
6. VIC Selective Entry

**Features Grid Below Buttons** (3x2 grid):
- 1000+ Questions
- 5 Full-Length Tests
- AI-Powered Writing Practice
- Sub-skill Level Practice
- Detailed Analytics
- Practice anywhere

Each feature has:
- Green checkmark icon (`CheckCircle`)
- Bold title
- Descriptive text

---

### 4. METHODOLOGY SECTION (Lines 688-857)
**Background:** Light gray (`#F8F9FA`)
**ID:** `methodology` (scroll anchor)

**Header:**
- **Title**: "How Our Test Prep Platform Works" (animated text component)
- **Subtitle**: "From identifying gaps to mastering skills - every step designed for success"

**3 Steps with Alternating Layout:**

#### Step 1: Uncover Strengths & Gaps (Diagnostic)
- **Icon**: Activity icon in gradient circle
- **Prefix**: "Diagnostic:" (coral red `#FF6B6B`)
- **Title**: "Uncover Strengths & Gaps"
- **Description**: "Start with our comprehensive diagnostic test. Get detailed insights into your child's current performance across all sub-skills and question types."
- **Screenshot**: `diagnostic home 3.png`
- **Step Number**: "01" in teal

#### Step 2: Targeted Skill Building (Drills)
- **Icon**: Target icon
- **Prefix**: "Skill Drills:"
- **Title**: "Targeted Skill Building"
- **Description**: "Access 1000+ questions designed to strengthen specific sub-skills. Our platform identifies exactly what your child needs to practice most."
- **Screenshot**: `writing feedback 3.png`
- **Step Number**: "02"

#### Step 3: Simulate the Real Test (Practice Tests)
- **Icon**: FileText icon
- **Prefix**: "Practice Tests:"
- **Title**: "Simulate the Real Test"
- **Description**: "Take full-length practice tests that perfectly simulate the real exam environment. Track improvement with detailed analytics."
- **Screenshot**: `test taking maths.png`
- **Step Number**: "03"

**Layout Details:**
- Mobile: Content and images stacked vertically
- Desktop: Grid with alternating left/right images
- Spring animations on scroll

---

### 5. PLATFORM FEATURES SHOWCASE (Lines 859-936)
**Background:** White

**Header:**
- **Title**: "Best-in-Class Performance & Progress Insights" (animated text)
- **Subtitle**: "See exactly how your child is performing - not just overall, but at the sub-skill level"

**Layout:** 
- Mobile: Stacked (features on top, screenshot below)
- Desktop: 3-column with features left, animated GIF right (takes 2 columns)

**3 Feature Items** (left side):
1. **Progress Tracking** (TrendingUp icon)
   - "Visual dashboards showing improvement over time with actionable insights"

2. **Sub-Skill Analytics** (BarChart3 icon)
   - "Performance tracking beyond test sections - see progress in specific question types"

3. **Instant Feedback** (Zap icon)
   - "Detailed explanations for every question with improvement suggestions"

**GIF Demo** (right side):
- Source: `/images/CleanShot 2025-07-28 at 19.48.04.gif`
- Contained in gradient border (teal to purple)
- Aspect ratio: video
- Image rendering: crisp-edges for GIF quality

---

### 6. SCHOOL LOGOS SECTION (Lines 938-984)
**Background:** Light gray (`#F8F9FA`)

**Header:**
- **Title**: "Trusted by Students Entering Australia's Top Schools"

**Implementation:**
- **Infinite scrolling carousel** using Framer Motion
- **Duration**: 70 seconds per full cycle (slower animation)
- **Layout**: Logos rendered twice for seamless infinite loop

**School Logos Included:**
- **Victorian Schools** (15 logos):
  - Brighton Grammar School, Camberwell Girls Grammar, Camberwell Grammar, Carey Baptist Grammar, Caulfield Grammar, Firbank Grammar, Geelong College, Geelong Grammar, Genazzano FCJ College, Goulburn Valley Grammar, Haileybury College, Huntingtower School, Ivanhoe Girls Grammar, Ivanhoe Grammar, Kilvington Grammar

- **NSW Schools** (15 logos):
  - Arden Anglican School, Barker College, Our Lady of the Sacred Heart, Ravenswood School, Redfield College, St Aloysius College, St Augustine's College, St Catherine's School, St Clare's College, St Stanislaus College, Sydney Grammar School, The King's School, Trinity Catholic College, Trinity Grammar School, Waverley College

**Features:**
- Grayscale by default, color on hover
- Fallback to text if image fails
- Dimensions: 120px x 60px (mobile), 150px x 80px (desktop)

---

### 7. TESTIMONIALS SECTION (Lines 986-1030)
**Background:** White

**Header:**
- **Title**: "What Parents Are Saying"
- **Subtitle**: "Real results from real families across Australia"

**Implementation:**
- **Active testimonial** state managed in component
- **Auto-rotation**: Changes every 5 seconds
- **Manual controls**: Dot indicators below (clickable)

**8 Testimonials** (rotating):
1. Michelle K. (Parent of Year 6) - 60th to 90th percentile in 8 weeks
2. David R. (Parent of Year 9) - Real test environment preparation
3. Sarah L. (Parent of Year 7) - Diagnostic reveals gaps
4. James M. (Parent of Year 5) - Writing feedback improvement
5. Lisa T. (Parent of Year 8) - Real-time progress tracking
6. Robert C. (Parent of Year 6) - Scholarship exam success
7. Amanda H. (Parent of Year 7) - Perfect test simulation
8. Michael D. (Parent of Year 9) - Instant feedback benefits

**Card Styling:**
- Background: White with rounded corners
- Shadow: Substantial (xl)
- All testimonials: 5 stars (coral red `#FF6B6B`)
- Quote styling: Italic, large, centered
- Name and details centered below quote

---

### 8. FAQ SECTION (Lines 1032-1109)
**Background:** Light gray (`#F8F9FA`)

**Header:**
- **Title**: "Frequently Asked Questions"
- **Subtitle**: "Everything you need to know about EduCourse test preparation"

**8 FAQs** (Accordion component):
1. "How long do I have access to the course?"
2. "Are the practice tests similar to the real exams?"
3. "Can I use this course on multiple devices?"
4. "What happens after I purchase?"
5. "Do you offer refunds if I'm not satisfied?"
6. "How do the diagnostic tests work?"
7. "Do you provide feedback on writing tasks?"
8. "Can siblings share one account?"

**Accordion Features:**
- Expandable/collapsible items
- Hover states with teal color (`#4ECDC4`)
- Rounded container (`rounded-xl`)
- Box shadow styling

**CTA Below FAQ** (Lines 1071-1107):
- "Still have questions? We're here to help!"
- 2 buttons:
  1. **Contact Us** (outline, purple border)
  2. **Get Started - Risk Free** (solid purple background)

---

### 9. FOOTER SECTION (Lines 1111-1189)
**Background:** Dark navy blue (`#2C3E50`)
**Text Color:** White

**Final CTA Block** (Lines 1115-1151):
- **Heading**: "Ready to Help Your Child Succeed?"
- **Subheading**: "Join 1000+ families who trust EduCourse for test preparation"
- **CTA Button**: "Get Started Today" (coral red `#FF6B6B`) with arrow icon
- **Trust Signals** (3 items with teal checkmarks):
  1. 7-Day Money-Back Guarantee
  2. Instant Access
  3. Works on All Devices

**Footer Links** (3-column grid):
1. **Company Info Column**:
   - Brand name "EduCourse" (teal)
   - Short description of platform

2. **Products Column**:
   - Links to all 6 product pages
   - Styled as `/course/{slug}` links

3. **Contact Column**:
   - Email: learning@educourse.com.au

**Bottom Copyright**:
- "© 2024 EduCourse. All rights reserved. | Privacy Policy | Terms of Service"

---

## PRODUCT LANDING PAGE STRUCTURE (CourseDetail.tsx)

**File Path:** `/Users/julz88/Documents/educoach-prep-portal-2/src/pages/CourseDetail.tsx`

**Route:** `/course/:slug` where slug is one of:
- `year-5-naplan`
- `year-7-naplan`
- `acer-scholarship`
- `edutest-scholarship`
- `nsw-selective`
- `vic-selective`

### 1. NAVIGATION BAR
**Identical to homepage** with same styling and functionality

---

### 2. HERO SECTION
**Background:** Light coral gradient (`from-[#FFE8E8] to-white`)

**Content - Left Side:**
- **Headline**: `{course.title} Test Prep` where second line is teal
  - Example: "ACER Scholarship Test Prep" (with "Test Prep" in teal)
  
- **Subheadline**: Uses `course.shortDescription` from data
  - Pulled directly from courses array

**Key Points** (3 bullet points):
1. **Dynamic target text**: 
   - ACER/EduTest: "Designed for Students in Year 5/6 applying for Year 7 Entry"
   - Others: "Designed for {course.target}" (from data)
   
2. "Expert-crafted questions aligned to test format"
3. "Instant feedback with detailed explanations"

**Primary CTA:**
- Text: "Start Improving Today - $199"
- Subtext: "7-Day Money-Back Guarantee"
- Color: Coral red (`#FF6B6B`)
- Icon: Arrow right

**Trust Signals Below CTA** (3 items):
1. Instant Access (teal checkmark)
2. 12 Months Access (teal checkmark)
3. Works on All Devices (teal checkmark)

**Visuals - Right Side:**
- **Identical to homepage**: 3 overlapping rotated screenshots with same hover effects

---

### 3. ABOUT THE TEST SECTION (Lines 592-707)
**Background:** White

**Header:**
- **Title**: "About the {course.title} Test"
- **Subtitle**: "Understand exactly what's tested in each section of the {course.title} examination"

**Tabbed Interface:**
- **Tab Titles**: All test sections for that specific course
  - E.g., for Year 5 NAPLAN: Writing, Reading, Language Conventions, Numeracy No Calculator, Numeracy Calculator
  - E.g., for ACER: Written Expression, Mathematics, Humanities

**Tab Content** (animated transitions):
- **Section Icon**: Gradient circle with relevant icon
- **Section Name** (as h3)
- **Section Description**: Detailed explanation of what's tested (from `TEST_SECTION_DESCRIPTIONS` mapping)
- **Question Count**: With FileText icon
- **Time Limit**: With Clock icon
- **Sub-skills List** (scrollable, 2-column grid):
  - Dynamically pulled from curriculum data
  - Each item has teal checkmark
  - Max height 240px with overflow-y-auto

**Tab Styling:**
- Underline tabs with active state in purple (`#6366F1`)
- Content area: White card with 2px gray border
- Smooth fade/slide transitions

---

### 4. HOW IT WORKS / OUR LEARNING PLATFORM (Lines 709-813)
**Background:** Light gray (`#F8F9FA`)

**Header:**
- **Title**: "Our Learning Platform"
- **Subtitle**: "Our proven approach to test preparation success"

**Two-Column Layout:**
- **Left Column**: Interactive feature list
- **Right Column**: Screenshot display

**Features Toggle List** (4 items):
1. **Diagnostic**
   - Icon: Activity
   - Description: "Comprehensive initial assessment to identify strengths and areas for improvement"
   - Screenshot: `/images/diagnostic home 3.png`

2. **Skill Drills**
   - Icon: Target
   - Description: "Targeted practice exercises to strengthen specific sub-skills and concepts"
   - Screenshot: `/images/writing feedback 3.png`

3. **Practice Tests**
   - Icon: FileText
   - Description: "Full-length timed tests that simulate real exam conditions"
   - Screenshot: `/images/test taking maths.png`

4. **Performance Analytics**
   - Icon: ChartBar (custom icon showing bars)
   - Description: "Detailed insights and progress tracking at the sub-skill level"
   - Screenshot: `/images/insights 5.png`

**Feature Card Styling:**
- Button layout with padding
- Border: 2px transparent, changes to `2px border-[#6366F1]` when active
- Background: `bg-white/50` or solid white when active
- Icon circle changes from gray to gradient (teal-purple) on active

**Screenshot Container:**
- Aspect ratio: video (16:9)
- Bordered with gradient (teal to purple)
- Animated transitions between screenshots
- Decorative blurred circles behind (teal and purple)

---

### 5. WHAT'S INCLUDED SECTION (Lines 815-880)
**Background:** White

**Header:**
- **Title**: "What's Included"
- **Subtitle**: "Everything you need to prepare for success"

**6 Features Grid** (3x2):
- 1000+ Questions
- 5 Full-Length Tests
- AI-Powered Writing Practice
- Sub-skill Level Practice
- Detailed Analytics
- Practice anywhere

**Each Feature:**
- Green checkmark icon (`CheckCircle` in `#22C55E`)
- Bold title
- Descriptive text below

---

### 6. HOW IT WORKS STEPS (Lines 882-1012)
**Background:** Light gray (`#F8F9FA`)

**Header:**
- **Title**: "How it Works"
- **Subtitle**: "Five simple steps to exam success"

**5 Step Cards** (5-column grid, responsive):
1. **Purchase** - "Choose your test package" (shopping cart icon)
2. **Access** - "Get instant platform access" (lock/key icon)
3. **Diagnose** - "Take your first practice test" (clipboard/checkmark icon)
4. **Practice** - "Focus on targeted drills" (lightning bolt icon)
5. **Progress** - "Track improvement over time" (bar chart icon)

**Card Features:**
- Gradient circle with white step number (1-5)
- Title and description
- Connecting lines between cards (hidden on mobile)
- Hover effects: shadow increase, number scale up, text color change

**Bottom CTA:**
- Text: "Ready to help your child succeed?"
- Button: "Start Risk-Free Today" (coral red)
- Subtext: "7-Day Money-Back Guarantee • $199"

---

### 7. FAQ SECTION (Lines 1014-1050)
**Background:** White

**Same 8 FAQs as homepage** in Accordion format

---

### 8. FINAL CTA SECTION (Lines 1052-1095)
**Background:** Gradient teal to purple (`from-[#4ECDC4] to-[#6366F1]`)

**Content:**
- **Heading**: "Ready to Start Your Test Prep Journey?"
- **Subheading**: "Join 1,000+ families who trust EduCourse for test preparation"
- **Button**: "Start Risk-Free Today - $199" (coral red)
- **Subtext**: "7-Day Money-Back Guarantee"

**Trust Signals** (3 items, white text):
1. Instant access
2. 12 months access
3. Works on all devices

---

## PRODUCT DATA STRUCTURE (courses.ts)

Each course has the following properties:

```typescript
{
  id: string;                    // unique identifier
  title: string;                 // display name
  shortDescription: string;      // used in product page hero
  fullDescription: string;       // not currently used in UI
  price: number;                 // always 199
  target: string;                // audience description
  skills: string[];              // array of 5 key skills
  image: string;                 // unused in current UI
  slug: string;                  // URL parameter for routing
}
```

### The 6 Products:

**1. Year 5 NAPLAN**
- Slug: `year-5-naplan`
- Target: "Year 5 students (or Year 4 preparing early)"
- Short Description: "Build foundational skills in reading, writing, language conventions, and numeracy. Practice real-style adaptive questions and timed tests."

**2. Year 7 NAPLAN**
- Slug: `year-7-naplan`
- Target: "Year 7 students and ambitious Year 6s"
- Short Description: "Advanced practice for high-performing students preparing for Year 7 NAPLAN. Covers harder numeracy, grammar, inference, and essay writing."

**3. ACER Scholarship**
- Slug: `acer-scholarship`
- Target: "Students in Year 5–9 applying for private school scholarships"
- Short Description: "Prepare for ACER's Scholarship Test (Year 7 Entry). Includes reading, mathematics, writing prompts, and high-order reasoning."

**4. EduTest Scholarship**
- Slug: `edutest-scholarship`
- Target: "Students applying to independent schools (Year 9 entry)"
- Short Description: "Covers all 5 sections of the EduTest exam: Verbal Reasoning, Numerical Reasoning, Reading, Mathematics, and Written Expression."

**5. NSW Selective Entry**
- Slug: `nsw-selective`
- Target: "Year 6 students preparing for Year 7 entry to NSW Selective Schools"
- Short Description: "Master the NSW Selective High School Placement Test. Includes Reading, Mathematical Reasoning, Thinking Skills, and Writing."

**6. VIC Selective Entry**
- Slug: `vic-selective`
- Target: "Year 8 students sitting the VIC selective test"
- Short Description: "Full prep for Victoria's Year 9 selective exam (Melbourne High, Mac.Robertson, etc.). Includes reading, mathematics, verbal/quant reasoning, and dual writing tasks."

---

## KEY MESSAGING DIFFERENCES

### Homepage vs. Product Pages

**Homepage Emphasis:**
- **Umbrella positioning**: "Australia's Leading Test Preparation Platform"
- **Wide appeal**: Covers all test types (NAPLAN, selective entry, scholarships)
- **Platform benefits**: Focus on features and methodology
- **Multiple CTAs**: "Find Your Test" and "See How It Works"

**Product Pages Emphasis:**
- **Test-specific positioning**: "{Test Name} Test Prep"
- **Targeted audience**: Specific year levels and entry requirements
- **Test structure details**: Tabbed section breakdowns with sub-skills
- **Single CTA**: "Start Improving Today - $199"

---

## CONVERSION ELEMENTS & TRUST SIGNALS

### Homepage Trust Signals:
1. "Trusted by 1000+ families" (footer, final CTA)
2. 8 parent testimonials with specific results (percentile improvements)
3. 30 school logos (Victorian and NSW selective schools)
4. 7-Day Money-Back Guarantee
5. Expert-designed credential
6. 1000+ questions claimed
7. 5 full-length practice tests

### Product Page Trust Signals:
1. "Join 1,000+ families" (final CTA)
2. 7-Day Money-Back Guarantee (prominent, multiple locations)
3. Instant Access (emphasized)
4. 12 Months Access (emphasized)
5. Works on All Devices
6. Expert-crafted questions claim
7. 1000+ questions
8. 5 full-length tests
9. Specific test structure details
10. Sub-skills curriculum mapping

---

## MISSING ELEMENTS & CONVERSION OPTIMIZATION GAPS

### Homepage Gaps:
1. **No specific pricing mention** until product page
2. **No testimonials on first fold** (only after testimonials section)
3. **No urgency/scarcity tactics** (could add "limited time" or "early bird")
4. **Limited social proof diversity** (only parent testimonials, no expert credentials)
5. **No video** (could embed demo video in hero)
6. **No risk reversal statement** in hero (appears only on product pages)
7. **No specific outcome metrics** in hero (e.g., "average X% improvement")

### Product Page Gaps:
1. **No student testimonials** (only parent testimonials on homepage)
2. **No expert credentials** (teachers/instructors names/credentials)
3. **No guarantee badge/icon** visual treatment
4. **No comparison table** with competitors
5. **No specific case studies** with before/after
6. **No urgency copy** (no "limited spots" or time-sensitive offers)
7. **No social proof numbers** for this specific test (generic 1000+ families)
8. **No FAQ** specific to this test's unique challenges

---

## ANIMATIONS & INTERACTIONS

### Key Framer Motion Usage:
1. **Landing page hero**: Staggered fade-in with letter-by-letter text animation
2. **Scroll-triggered reveals**: Fade up, slide in from sides
3. **Hover effects on CTAs**: Scale, glow (elevated shadow)
4. **Screenshot rotations**: 3D perspective with hover adjustments
5. **Carousel**: Infinite scrolling (school logos)
6. **Testimonial rotation**: Auto-changes with manual dot controls
7. **Tab transitions**: Animated content swap with opacity/movement
8. **Feature toggles**: Active state styling with smooth transitions

### Performance Specs:
- **Intersection Observer**: For scroll-triggered animations
- **Lenis smooth scrolling**: Lerp of 0.1, wheel multiplier 0.8
- **Animation timing**: 300-500ms for most interactions
- **Easing**: cubic-bezier(0.4, 0, 0.2, 1) for natural motion

---

## ROUTE STRUCTURE

```
/ → Landing.tsx (homepage)
/course/:slug → CourseDetail.tsx (product page)
  - /course/year-5-naplan
  - /course/year-7-naplan
  - /course/acer-scholarship
  - /course/edutest-scholarship
  - /course/nsw-selective
  - /course/vic-selective
/auth → Auth.tsx (login)
/dashboard → Layout + Dashboard.tsx (protected)
/profile → Profile.tsx (protected)
```

---

## RESPONSIVE DESIGN BREAKPOINTS

- **Mobile**: < 768px (full-width stacked layouts)
- **Tablet**: 768px - 1024px (2-column grids, partial layouts)
- **Desktop**: 1024px+ (3-column grids, full side-by-side)

---

## COLOR SYSTEM

**Primary Colors:**
- Teal: `#4ECDC4` (buttons, accents, highlights)
- Coral Red: `#FF6B6B` (primary CTA, testimonials)
- Dark Purple: `#6366F1` (secondary CTA, gradient)

**Neutral Colors:**
- Navy Blue: `#3B4F6B` (headings, nav text)
- Dark Gray: `#2C3E50` (body text, hero headline)
- Text Gray: `#6B7280` (secondary text)
- Light Gray: `#F8F9FA` (section backgrounds)
- Background Teal: `#E6F7F5` (hero section)
- Coral Background: `#FFE8E8` (product page hero)

**Accents:**
- Green: `#22C55E` (success checkmarks)
- Gradient: Teal → Purple for primary gradients

---

## FILE LOCATIONS SUMMARY

| Component | File Path |
|-----------|-----------|
| Homepage | `/src/pages/Landing.tsx` |
| Product Pages | `/src/pages/CourseDetail.tsx` |
| Course Data | `/src/data/courses.ts` |
| Curriculum Data | `/src/data/curriculumData.ts` |
| Routes | `/src/App.tsx` |
| Layout | `/src/components/Layout.tsx` |
| SEO Head | `/src/components/SEOHead.tsx` |
| Course Schema | `/src/components/CourseSchema.tsx` |
| FAQ Schema | `/src/components/FAQSchema.tsx` |

---

## CONCLUSION

The EduCourse website implements a **hub-and-spoke model** with:
- **Hub**: Comprehensive homepage showcasing all products with broad messaging
- **Spokes**: 6 individual product landing pages with test-specific messaging

The design prioritizes:
1. **Trust through social proof** (testimonials, school logos)
2. **Clear conversion paths** (multiple CTAs)
3. **Modern interactions** (smooth scrolling, animated reveals)
4. **Mobile responsiveness** (stacked layouts)
5. **Premium positioning** ($199 price point justified by content)

**Conversion strategy relies on:**
- Risk reversal (7-day guarantee)
- Specific results (testimonials with percentile improvements)
- Community proof (30+ school logos, 1000+ families)
- Transparency (detailed curriculum mapping, sub-skills breakdown)

