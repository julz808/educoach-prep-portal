# EduCourse Website - Complete Section Breakdown

## HOMEPAGE (Landing.tsx) - Section-by-Section

### 1. NAVIGATION BAR
**Lines:** 312-429
**ID:** None (fixed position)
**Background:** Transparent → `bg-white/95 backdrop-blur-sm` on scroll
**Height:** 64px (h-16)

**Elements:**
```
[Logo] ..................... [Dropdown] [Insights] [Login Button]
                          (Learning Products)
```

**Desktop Menu:**
- Learning Products Dropdown (shows all 6 courses)
- Insights Link (external: insights.educourse.com.au)
- Login Button (teal outline, teal text)

**Mobile Menu:**
- Hamburger icon that expands to show all items vertically

**Styling:**
- Fixed `z-50` (always on top)
- Logo height: 140px mobile, 208px desktop
- Text color: `#3B4F6B` (navy blue)
- Hover color: `#4ECDC4` (teal)
- Button: `border-[#4ECDC4] text-[#4ECDC4] hover:bg-[#4ECDC4]`

---

### 2. HERO SECTION
**Lines:** 431-597
**ID:** None
**Background:** `gradient-to-b from-[#E6F7F5] to-white`
**Padding:** `pt-24 md:pt-32 pb-16 md:pb-20`
**Layout:** 2-column grid (responsive to 1 column on mobile)

**LEFT COLUMN (Content):**

**Headline:**
```
"Australia's Leading Test Preparation Platform"
Font: text-3xl sm:text-4xl lg:text-5xl
Weight: font-bold
Color: #2C3E50
Animation: fade-in + translate on load
```

**Subheadline:**
```
"Give your child the edge they need with Australia's most 
comprehensive test prep platform for NAPLAN, selective entry, 
and scholarship exams."
Font: text-lg sm:text-xl
Color: #4B5563
With bold emphasis on: NAPLAN, selective entry, scholarship exams
```

**Key Points (3 items):**
```
✓ Designed by expert teachers and instructors
✓ 1000+ practice questions, with full-length practice tests
✓ Detailed performance feedback and insights
```
Icon: CheckCircle (`#4ECDC4`)
Animation: Staggered fade-in with delay

**CTAs (2 buttons):**
```
[Find Your Test] [See how it works]
Purple bg       Purple outline
```
- Primary: `bg-[#6366F1] hover:bg-[#5B5BD6]` - scrolls to #products
- Secondary: `border-2 border-[#6366F1]` - scrolls to #methodology

**RIGHT COLUMN (Visuals):**

**Mobile (hidden lg:hidden):**
- Single screenshot: `/images/insights 5.png`
- Size: max-w-sm mx-auto h-[280px]
- Style: rounded-xl shadow-2xl

**Desktop (hidden lg:block):**
- 3 overlapping rotated screenshots in cascade:
  1. Dashboard view (top right, rotate-3, w-[400px] h-[240px])
  2. Reading simulation (middle left, -rotate-2)
  3. Analytics (front right, rotate-1)
- Each has hover effect: `hover:rotate-0 hover:scale-105`
- Each has z-index stacking (z-10, z-20, z-30)

---

### 3. TEST PRODUCTS SECTION
**Lines:** 599-687
**ID:** `products`
**Background:** White
**Padding:** `py-16 md:py-20`

**Header:**
```
Title: "Find Your Test Preparation Package"
Font: text-2xl sm:text-3xl md:text-4xl
Color: #2C3E50
```

**Product Buttons Grid:**
- Layout: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Gap: `gap-4`
- Height: `py-8` (large buttons)

**6 Product Buttons:**
1. Year 5 NAPLAN
2. Year 7 NAPLAN
3. ACER Scholarship
4. EduTest Scholarship
5. NSW Selective Entry
6. VIC Selective Entry

**Button Styling:**
```css
bg-gradient-to-br from-[#4ECDC4] to-[#6366F1]
hover:from-[#45beb5] hover:to-[#5b5ef1]
text-white
font-bold
text-lg
shadow-md hover:shadow-lg
transition-all
```

**Features Grid Below (3x2):**
```
[1000+ Questions] [5 Full-Length Tests] [AI-Powered Writing]
[Sub-skill Level] [Detailed Analytics]  [Practice anywhere]
```
- Icon: CheckCircle in `#22C55E`
- Grid: `md:grid-cols-2 lg:grid-cols-3 gap-8`

---

### 4. METHODOLOGY SECTION
**Lines:** 688-857
**ID:** `methodology`
**Background:** `#F8F9FA` (light gray)
**Padding:** `py-16 md:py-20`

**Header:**
```
Title: "How Our Test Prep Platform Works" (animated text)
Subtitle: "From identifying gaps to mastering skills - 
           every step designed for success"
```

**3 Step Cards (Alternating Layout):**

**STEP 1: Diagnostic**
- Prefix: "Diagnostic:" (coral `#FF6B6B`)
- Title: "Uncover Strengths & Gaps"
- Icon: Activity icon in gradient circle
- Step Number: "01" in teal
- Description: "Start with our comprehensive diagnostic test..."
- Image: `diagnostic home 3.png`
- Layout: Text left, image right (desktop) or stacked (mobile)

**STEP 2: Skill Drills**
- Prefix: "Skill Drills:" (coral)
- Title: "Targeted Skill Building"
- Icon: Target icon
- Step Number: "02"
- Description: "Access 1000+ questions designed to strengthen..."
- Image: `writing feedback 3.png`
- Layout: Image left, text right (alternates)

**STEP 3: Practice Tests**
- Prefix: "Practice Tests:" (coral)
- Title: "Simulate the Real Test"
- Icon: FileText icon
- Step Number: "03"
- Description: "Take full-length practice tests that perfectly..."
- Image: `test taking maths.png`
- Layout: Text left, image right

**Animation Specs:**
- Spring animation on scroll: `stiffness: 100`, `damping: 20`
- Images have hover effects: scale 1.02, rotate slightly

---

### 5. PLATFORM FEATURES SHOWCASE
**Lines:** 859-936
**ID:** None
**Background:** White
**Padding:** `py-16 md:py-20`

**Header:**
```
Title: "Best-in-Class Performance & Progress Insights"
Subtitle: "See exactly how your child is performing - 
           not just overall, but at the sub-skill level"
```

**Layout:** 3-column on desktop
- Left column: Features list
- Right 2 columns: Animated GIF

**3 Features:**

1. **Progress Tracking**
   - Icon: TrendingUp (`#4ECDC4`, `#6366F1` gradient circle)
   - "Visual dashboards showing improvement over time..."

2. **Sub-Skill Analytics**
   - Icon: BarChart3
   - "Performance tracking beyond test sections..."

3. **Instant Feedback**
   - Icon: Zap
   - "Detailed explanations for every question..."

**GIF Container:**
- Source: `/images/CleanShot 2025-07-28 at 19.48.04.gif`
- Border: Gradient teal to purple
- Style: `rounded-xl md:rounded-2xl`
- Image rendering: `crisp-edges`
- Decorative blurred circles behind

---

### 6. SCHOOL LOGOS SECTION
**Lines:** 938-984
**ID:** None
**Background:** `#F8F9FA`
**Padding:** `py-12 md:py-16`

**Header:**
```
"Trusted by Students Entering Australia's Top Schools"
```

**Infinite Carousel:**
- Implementation: Framer Motion `animate.x`
- Duration: 70 seconds
- Easing: linear
- Repeat: Infinity
- Logos rendered twice for seamless loop

**School Logos:**
- 15 Victorian schools (SVG format)
- 15 NSW schools (PNG format)
- Total: 30 logos

**Logo Styling:**
- Mobile: 120px × 60px
- Desktop: 150px × 80px
- Grayscale by default: `grayscale`
- Hover: `hover:grayscale-0`
- Fallback: Text display if image fails to load

---

### 7. TESTIMONIALS SECTION
**Lines:** 986-1030
**ID:** None
**Background:** White
**Padding:** `py-16 md:py-20`

**Header:**
```
Title: "What Parents Are Saying"
Subtitle: "Real results from real families across Australia"
```

**Card Style:**
- Background: White
- Rounded: `rounded-xl md:rounded-2xl`
- Shadow: `shadow-xl`
- Padding: `p-6 md:p-8`

**8 Testimonials (Rotating):**
1. Michelle K. - 60th to 90th percentile (8 weeks)
2. David R. - Real test environment
3. Sarah L. - Diagnostic reveals gaps
4. James M. - Writing feedback (40% improvement)
5. Lisa T. - Real-time progress tracking
6. Robert C. - Scholarship exam success
7. Amanda H. - Perfect test simulation
8. Michael D. - Instant feedback benefits

**Content Layout:**
- Stars: 5 red stars (`fill-[#FF6B6B]`)
- Quote: Italic, centered, large font
- Name: Bold, centered
- Details: Gray text, centered
- "Parent of Year X student"

**Auto-Rotation:**
- Interval: 5000ms (5 seconds)
- Manual controls: Dot indicators (clickable)

---

### 8. FAQ SECTION
**Lines:** 1032-1109
**ID:** None
**Background:** `#F8F9FA`
**Padding:** `py-16 md:py-20`

**Header:**
```
Title: "Frequently Asked Questions"
Subtitle: "Everything you need to know about EduCourse"
```

**8 FAQs (Accordion):**
1. How long do I have access to the course?
2. Are the practice tests similar to the real exams?
3. Can I use this course on multiple devices?
4. What happens after I purchase?
5. Do you offer refunds if I'm not satisfied?
6. How do the diagnostic tests work?
7. Do you provide feedback on writing tasks?
8. Can siblings share one account?

**Accordion Styling:**
- Background: White in container
- Border: 1px gray between items
- Rounded: `rounded-xl`
- Trigger hover: Text color `#4ECDC4`

**CTA Below FAQ:**
```
"Still have questions? We're here to help!"

[Contact Us] [Get Started - Risk Free]
outline     solid purple
purple border
```

---

### 9. FOOTER SECTION
**Lines:** 1111-1189
**ID:** None
**Background:** `#2C3E50` (dark navy)
**Text Color:** White
**Padding:** `py-12 md:py-16`

**Final CTA Block:**
```
"Ready to Help Your Child Succeed?"
"Join 1000+ families who trust EduCourse..."

[Get Started Today] →

✓ 7-Day Money-Back Guarantee
✓ Instant Access
✓ Works on All Devices
```
Button: `bg-[#FF6B6B] hover:bg-[#E55A5A]`

**Footer Links Grid (3 columns):**

**Column 1 - Company:**
- "EduCourse" (teal text, `#4ECDC4`)
- "Australia's premier test preparation platform..."

**Column 2 - Products:**
- Year 5 NAPLAN
- Year 7 NAPLAN
- ACER Scholarship
- EduTest Scholarship
- NSW Selective Entry
- VIC Selective Entry

**Column 3 - Contact:**
- learning@educourse.com.au

**Bottom:**
```
© 2024 EduCourse. All rights reserved. | 
Privacy Policy | Terms of Service
```
Font: `text-xs md:text-sm`
Color: `text-gray-400`

---

## PRODUCT PAGE (CourseDetail.tsx) - Section-by-Section

### 1. NAVIGATION BAR
**Identical to Homepage** - Same styling, same menu structure

---

### 2. HERO SECTION
**Lines:** 417-590
**ID:** None
**Background:** `gradient-to-b from-[#FFE8E8] to-white` (coral tint)
**Padding:** `pt-24 md:pt-32 pb-16 md:pb-20`
**Layout:** 2-column grid (responsive)

**LEFT COLUMN:**

**Headline:**
```
{course.title}
Test Prep
```
- First line: Black
- Second line: Teal `#4ECDC4`
- Font: text-3xl sm:text-4xl lg:text-5xl
- Weight: font-bold

**Example:** "ACER Scholarship Test Prep"

**Subheadline:**
- Uses `course.shortDescription` from data
- Font: text-lg sm:text-xl
- Color: `#4B5563`

**Key Points (3 items):**
```
✓ Dynamic target (ACER/EduTest: "Designed for Students in...")
✓ Expert-crafted questions aligned to test format
✓ Instant feedback with detailed explanations
```

**Primary CTA:**
```
[Start Improving Today - $199]
[7-Day Money-Back Guarantee]

Coral red bg: #FF6B6B
With arrow icon on right
```

**Trust Signals (3 items below button):**
```
✓ Instant Access
✓ 12 Months Access
✓ Works on All Devices
```

**RIGHT COLUMN:**
- Identical to homepage: 3 overlapping rotated screenshots

---

### 3. ABOUT THE TEST SECTION
**Lines:** 592-707
**ID:** None
**Background:** White
**Padding:** `py-16 md:py-20`

**Header:**
```
"About the {course.title} Test"
"Understand exactly what's tested in each section..."
```

**Tabbed Interface:**

**Tab Navigation (Underline style):**
- Each test section as a tab
- Active: Purple underline `border-[#6366F1]`
- Inactive: Gray text, transparent border
- Example sections for NAPLAN: Writing, Reading, Language Conventions, Numeracy...

**Tab Content (Animated):**

**Section Icon & Title:**
- Gradient circle (teal → purple): `from-[#4ECDC4] to-[#6366F1]`
- Size: w-14 h-14
- Icon: Relevant to section (PenTool, BookOpen, etc.)

**Description:**
- From `TEST_SECTION_DESCRIPTIONS` mapping
- Example: "Students write a narrative or persuasive piece..."

**Test Details (2 items):**
- Questions: "45 questions" with FileText icon
- Time: "40 minutes" with Clock icon

**Sub-skills List:**
- Grid: 2 columns (`md:grid-cols-2`)
- Max height: 240px with scroll
- Each item: CheckCircle (teal) + skill text
- Dynamically loaded from curriculum data

**Tab Styling:**
- Card: White background, 2px gray border, rounded
- Animation: Fade in/out with opacity
- Smooth transitions

---

### 4. HOW IT WORKS / OUR LEARNING PLATFORM
**Lines:** 709-813
**ID:** None
**Background:** `#F8F9FA`
**Padding:** `py-16 md:py-20`

**Header:**
```
"Our Learning Platform"
"Our proven approach to test preparation success"
```

**Two-Column Layout:**
- Left: Interactive feature list
- Right: Screenshot display

**4 Feature Items (Left Column):**

1. **Diagnostic**
   - Icon: Activity
   - Title: "Diagnostic"
   - Description: "Comprehensive initial assessment..."
   - Screenshot: `diagnostic home 3.png`

2. **Skill Drills**
   - Icon: Target
   - Title: "Skill Drills"
   - Description: "Targeted practice exercises..."
   - Screenshot: `writing feedback 3.png`

3. **Practice Tests**
   - Icon: FileText
   - Title: "Practice Tests"
   - Description: "Full-length timed tests..."
   - Screenshot: `test taking maths.png`

4. **Performance Analytics**
   - Icon: ChartBar
   - Title: "Performance Analytics"
   - Description: "Detailed insights and progress tracking..."
   - Screenshot: `insights 5.png`

**Feature Card Styling:**
```css
border-2 transparent
when inactive: bg-white/50
when active: bg-white, border-[#6366F1], shadow-lg
```

**Screenshot Display (Right Column):**
- Aspect ratio: video (16:9)
- Border: Gradient teal → purple
- Rounded: `rounded-2xl`
- Animated transitions between screenshots
- Blurred circles: teal and purple behind

---

### 5. WHAT'S INCLUDED SECTION
**Lines:** 815-880
**ID:** None
**Background:** White
**Padding:** `py-16 md:py-20`

**Header:**
```
"What's Included"
"Everything you need to prepare for success"
```

**6 Features (3x2 Grid):**
1. 1000+ Questions - Comprehensive question bank...
2. 5 Full-Length Tests - Complete practice exams...
3. AI-Powered Writing Practice - Instant feedback...
4. Sub-skill Level Practice - Targeted exercises...
5. Detailed Analytics - Insights and progress tracking...
6. Practice anywhere - Tablet and desktop friendly...

**Feature Styling:**
- Grid: `md:grid-cols-2 lg:grid-cols-3`
- Icon: CheckCircle in green `#22C55E`
- Layout: Icon left, text right
- Bold title, regular description text

---

### 6. HOW IT WORKS STEPS
**Lines:** 882-1012
**ID:** None
**Background:** `#F8F9FA`
**Padding:** `py-16 md:py-20`

**Header:**
```
"How it Works"
"Five simple steps to exam success"
```

**5 Step Cards (5-column grid, responsive):**

1. **Purchase**
   - Icon: Shopping cart
   - "Choose your test package"
   - Step circle: "1"

2. **Access**
   - Icon: Lock/key
   - "Get instant platform access"
   - Step circle: "2"

3. **Diagnose**
   - Icon: Clipboard + checkmark
   - "Take your first practice test"
   - Step circle: "3"

4. **Practice**
   - Icon: Lightning bolt
   - "Focus on targeted drills"
   - Step circle: "4"

5. **Progress**
   - Icon: Bar chart
   - "Track improvement over time"
   - Step circle: "5"

**Card Styling:**
- Background: White
- Rounded: `rounded-2xl`
- Shadow: lg, increases on hover
- Border: 1px gray, hover: `border-[#4ECDC4]/30`
- Padding: `p-8`

**Connecting Lines:**
- Between cards on desktop (hidden mobile)
- Gradient teal to transparent
- Height: `h-0.5`

**Step Circle:**
- Gradient: teal → purple
- Size: w-16 h-16
- Text: White, bold, large
- Hover: Scale up 1.1

**Bottom CTA:**
```
"Ready to help your child succeed?"

[Start Risk-Free Today]
[7-Day Money-Back Guarantee • $199]
```

---

### 7. FAQ SECTION
**Lines:** 1014-1050
**Background:** White
**Padding:** `py-16 md:py-20`

**Same 8 FAQs as Homepage** in Accordion format

---

### 8. FINAL CTA SECTION
**Lines:** 1052-1095
**ID:** None
**Background:** `gradient-to-br from-[#4ECDC4] to-[#6366F1]`
**Padding:** `py-16 md:py-20`
**Text Color:** White

**Content:**
```
"Ready to Start Your Test Prep Journey?"
"Join 1,000+ families who trust EduCourse..."

[Start Risk-Free Today - $199] →
[7-Day Money-Back Guarantee]

✓ Instant access
✓ 12 months access
✓ Works on all devices
```

**Button:** Coral red `#FF6B6B`
**Arrow Icon:** White, right-aligned

---

## KEY STRUCTURAL PATTERNS

### Repeated Components:
1. **Navigation Bar** - Both homepage and product pages
2. **Hero Section** - Same layout, different backgrounds
3. **Trust Signals** - Checkmarks repeated throughout
4. **CTAs** - Multiple instances per page
5. **FAQ Accordion** - Identical on both page types

### Layout Patterns:
- **3-column desktop, 2-column tablet, 1-column mobile** (most grids)
- **Alternating left/right layout** (methodology section)
- **Split left-content right-visual** (hero sections)
- **Tab interfaces** (test sections)
- **Feature cards with icons** (features sections)

### Animation Patterns:
- **Scroll-triggered fade-in** (intersection observer)
- **Staggered animations** (multiple elements in sequence)
- **Hover effects** (scale, shadow, color changes)
- **Auto-rotating carousels** (testimonials, logos)
- **Spring animations** (imagery on scroll)

### Color Patterns:
- **Gradient buttons** (teal → purple)
- **White cards on light backgrounds**
- **Alternating backgrounds** (white, light gray)
- **Color-coded icons** (teal, green, coral)

---

## RESPONSIVE BREAKPOINTS

**Mobile (< 768px):**
- 1-column grids
- Stacked layouts
- Full-width buttons
- Smaller fonts
- Hamburger menu

**Tablet (768px - 1024px):**
- 2-column grids
- Partial side-by-side
- More compact spacing
- Smaller heading sizes

**Desktop (1024px+):**
- 3-column grids
- Full side-by-side layouts
- Maximum spacing
- Hover effects active
- Complex animations

