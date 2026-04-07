# School Prep Page - REVISED Component Plan
**Based on existing CourseDetail.tsx structure**

**Date:** April 1, 2026
**Status:** 🔍 Awaiting approval

---

## 🎯 Strategy: Reuse 90% of CourseDetail.tsx Components

You're absolutely right - we should copy the existing product landing page structure and just customize these key school-specific sections:

### ✅ **REUSE AS-IS (From CourseDetail.tsx):**
1. Navigation Bar (lines 286-397)
2. Pricing Card Section (lines 568-678)
3. Testimonials Section (lines 680-782)
4. Comparison Table "Why Choose EduCourse?" (lines 784-...)
5. "How It Works" 5-Step Section (lines 1257-1353)
6. FAQ Section (lines 1355+)
7. Footer

### 🎨 **CUSTOMIZE FOR EACH SCHOOL:**
1. **Hero Section** - School-specific
2. **School Facts Block** - NEW (school dates, location, stats)
3. **Test Details Section** - Reuse structure, customize content

---

## 📋 Detailed Plan for Customized Sections

### **SECTION 1: Hero (Customize from existing)**

**Current CourseDetail Hero:**
```tsx
- Headline: "Master the VIC Selective Entry Test"
- Subheadline: "1000+ practice questions..."
- Bullets: Generic test prep benefits
- CTA: "Start Improving Today - $199"
- Screenshots: Platform screenshots
```

**School-Specific Hero (Melbourne High):**
```tsx
- Headline: "Melbourne High School Selective Entry Prep 2027"
- Subheadline: "Prepare for Victoria's #1 ranked selective school with 1000+ VIC Selective practice questions"
- Bullets:
  ✓ Test Date: June 20, 2026 | Entry: Year 9 (Boys only)
  ✓ 250 places available | ~12,000 applicants | ~7% acceptance rate
  ✓ Located in South Yarra | ICSEA: 1178 (Top 5% nationally)
  ✓ 1000+ VIC Selective practice questions + 5 full practice tests
- CTA: Same - "Start Improving Today - $199"
- Screenshots: Same platform screenshots
```

**Code Changes:**
```typescript
// BEFORE (CourseDetail.tsx line 429)
{heroContent.headline}

// AFTER (SchoolPrepPage.tsx)
{school.name} Selective Entry Prep 2027

// BEFORE (line 436)
{heroContent.subheadline}

// AFTER
Prepare for {school.suburb}'s {school.gender === 'boys' ? 'premier boys' : school.gender === 'girls' ? 'premier girls' : 'top co-ed'} selective school with 1000+ VIC Selective practice questions

// BEFORE (lines 448-459 - bullets)
{heroContent.bullets.map...}

// AFTER
{[
  `Test Date: ${formatDate(school.testDates.testDate)} | Entry: Year ${school.entryYears[0]} (${school.gender})`,
  `${school.placesOffered} places | ~${school.estimatedApplicants?.toLocaleString()} applicants | ~${school.acceptanceRate}% acceptance`,
  `Located in ${school.suburb} | ICSEA: ${school.icsea} (Top 5% nationally)`,
  `1000+ VIC Selective practice questions + 5 full practice tests`
].map...}
```

---

### **SECTION 1.5: School Facts Block (NEW - Insert After Hero)**

**Purpose:** School-specific dates and facts (AEO-critical)

**Location:** Insert between Hero and Pricing Card

**Design:** (Matches your existing section style)
```tsx
{/* NEW: School Facts Block */}
<section className="py-16 md:py-20 bg-white">
  <div className="container mx-auto px-4">
    <motion.div
      className="text-center mb-12"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
    >
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#2C3E50] mb-4">
        {school.name} - Key Facts & Dates 2027
      </h2>
      <p className="text-lg md:text-xl text-[#6B7280]">
        Everything you need to know about {school.name} selective entry
      </p>
    </motion.div>

    {/* Facts Grid */}
    <div className="max-w-5xl mx-auto">
      {/* Test Dates Row */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-[#E6F7F5] to-white rounded-xl p-6 border-2 border-[#4ECDC4]/20 shadow-lg">
          <div className="flex items-center space-x-3 mb-3">
            <Calendar className="h-6 w-6 text-[#4ECDC4]" />
            <h3 className="font-bold text-[#2C3E50]">Applications Open</h3>
          </div>
          <p className="text-2xl font-bold text-[#6366F1]">
            {formatDateLong(school.testDates.applicationOpen)}
          </p>
          <p className="text-sm text-[#6B7280] mt-1">March 2, 2026</p>
        </div>

        <div className="bg-gradient-to-br from-[#FEF2F2] to-white rounded-xl p-6 border-2 border-[#FF6B6B]/20 shadow-lg">
          <div className="flex items-center space-x-3 mb-3">
            <Clock className="h-6 w-6 text-[#FF6B6B]" />
            <h3 className="font-bold text-[#2C3E50]">Test Date</h3>
          </div>
          <p className="text-2xl font-bold text-[#6366F1]">
            {formatDateLong(school.testDates.testDate)}
          </p>
          <p className="text-sm text-[#6B7280] mt-1">June 20, 2026</p>
        </div>

        <div className="bg-gradient-to-br from-[#F3F4F6] to-white rounded-xl p-6 border-2 border-[#6366F1]/20 shadow-lg">
          <div className="flex items-center space-x-3 mb-3">
            <Award className="h-6 w-6 text-[#6366F1]" />
            <h3 className="font-bold text-[#2C3E50]">Results Released</h3>
          </div>
          <p className="text-2xl font-bold text-[#6366F1]">
            {formatDateLong(school.testDates.resultsDate)}
          </p>
          <p className="text-sm text-[#6B7280] mt-1">August 3, 2026</p>
        </div>
      </div>

      {/* School Stats Grid */}
      <div className="bg-white rounded-xl border-2 border-gray-100 p-8 shadow-lg">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <MapPin className="h-8 w-8 text-[#4ECDC4] mx-auto mb-2" />
            <p className="text-sm text-[#6B7280] mb-1">Location</p>
            <p className="text-lg font-bold text-[#2C3E50]">{school.suburb}</p>
          </div>

          <div className="text-center">
            <Users className="h-8 w-8 text-[#4ECDC4] mx-auto mb-2" />
            <p className="text-sm text-[#6B7280] mb-1">Entry Places</p>
            <p className="text-lg font-bold text-[#2C3E50]">~{school.placesOffered}/year</p>
          </div>

          <div className="text-center">
            <Target className="h-8 w-8 text-[#4ECDC4] mx-auto mb-2" />
            <p className="text-sm text-[#6B7280] mb-1">Acceptance Rate</p>
            <p className="text-lg font-bold text-[#2C3E50]">~{school.acceptanceRate}%</p>
          </div>

          <div className="text-center">
            <TrendingUp className="h-8 w-8 text-[#4ECDC4] mx-auto mb-2" />
            <p className="text-sm text-[#6B7280] mb-1">ICSEA Score</p>
            <p className="text-lg font-bold text-[#2C3E50]">{school.icsea}</p>
            <p className="text-xs text-[#6B7280]">(Avg: 1000)</p>
          </div>
        </div>

        {/* Key Facts List */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="font-bold text-[#2C3E50] mb-4 text-center">About {school.name}</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {school.keyFacts.map((fact, index) => (
              <div key={index} className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-[#4ECDC4] flex-shrink-0 mt-0.5" />
                <span className="text-sm text-[#6B7280]">{fact}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
```

---

### **SECTION 3: Test Details (Reuse structure, customize content)**

**Current CourseDetail Structure:**
```tsx
// Lines 1162-1255
- Title: "Understanding the VIC Selective Entry Test"
- Tabs: One tab per test section (Reading, Maths, etc.)
- Tab Content:
  - Icon
  - Section name
  - Description
  - Questions count + Time
  - Sub-skills list
```

**School-Specific Version:**
```tsx
// SAME STRUCTURE, different title:

// BEFORE
<h2>Understanding the {course.title} Test</h2>

// AFTER
<h2>Understanding the {school.name} Test</h2>
<p>The {school.name} entrance exam uses the VIC Selective Entry Test (ACER). All 4 Victorian selective schools use the same test on the same day.</p>

// SAME: Tab structure, section content, sub-skills
// (Pulls from TEST_STRUCTURES using school.testType)
```

**Code Changes:** Minimal - just pass `school.name` instead of `course.title`

---

### **SECTION 4: FAQ (Reuse structure, school-specific content)**

**Current CourseDetail Structure:**
```tsx
// Lines 1355+ - Accordion with general FAQs
<Accordion>
  {faqs.map((faq, index) => (
    <AccordionItem>
      <AccordionTrigger>{faq.question}</AccordionTrigger>
      <AccordionContent>{faq.answer}</AccordionContent>
    </AccordionItem>
  ))}
</Accordion>
```

**School-Specific Version:**
```tsx
// EXACT SAME STRUCTURE

// BEFORE
{faqs.map...} // General FAQs from courses.ts

// AFTER
{school.faqs.map...} // School-specific FAQs from vicSelectiveFAQs.ts

// Example FAQs for Melbourne High:
- "When is the Melbourne High School test in 2027?"
- "What makes Melbourne High different from other VIC schools?"
- "What is the VIC Selective Entry Test?"
- [8 more general VIC FAQs...]
```

**Code Changes:** Change data source from `faqs` to `school.faqs`

---

## 📁 Implementation Strategy

### **Option A: Copy CourseDetail.tsx → SchoolPrepPage.tsx**

1. **Copy entire CourseDetail.tsx**
2. **Search & Replace:**
   - `course` → `school` (where appropriate)
   - `course.title` → `school.name`
   - `heroContent` → school-specific content
   - `faqs` → `school.faqs`
3. **Insert NEW "School Facts Block"** after Hero
4. **Keep everything else identical**

**Pros:**
- Fastest approach (90% copy-paste)
- Guaranteed visual consistency
- Minimal risk of breaking existing styles

**Cons:**
- Duplicates code (but we can refactor later)

---

### **Option B: Extract Shared Components**

1. **Extract reusable sections from CourseDetail:**
   - `<ComparisonTable />`
   - `<HowItWorks />`
   - `<TestDetailsSection />`
   - `<FAQSection />`
2. **Build SchoolPrepPage using shared components**
3. **Add school-specific sections**

**Pros:**
- DRY (Don't Repeat Yourself)
- Easier to maintain long-term

**Cons:**
- More work upfront (3-4 hours)
- Risk of breaking CourseDetail if not careful

---

## ✅ **RECOMMENDED APPROACH: Option A (Copy & Customize)**

**Reason:** Speed + consistency. We can refactor later if needed.

**Timeline:**
- **Copy CourseDetail.tsx** (10 min)
- **Replace `course` with `school` data** (30 min)
- **Build "School Facts Block"** (45 min)
- **Customize Hero bullets** (15 min)
- **Test Melbourne High page** (20 min)
- **Total:** ~2 hours

---

## 🔧 File Changes Summary

### New Files:
```
src/pages/SchoolPrepPage.tsx  (copied from CourseDetail.tsx with changes)
```

### Modified Files:
```
src/App.tsx  (add route: /prep/:productSlug/:schoolSlug)
```

### Data Files (Already Created):
```
src/data/programmaticSEO/vicSelectiveSchools.ts ✅
src/data/programmaticSEO/vicSelectiveFAQs.ts ✅
src/data/programmaticSEO/schoolsDatabase.ts ✅
src/data/programmaticSEO/testDetails.ts ✅
```

---

## 📊 Comparison: What's Different vs CourseDetail?

| Section | CourseDetail | SchoolPrepPage |
|---------|--------------|----------------|
| **Hero** | Generic test prep | School-specific (name, location, dates in bullets) |
| **School Facts** | ❌ Not present | ✅ NEW section with dates & stats |
| **Pricing Card** | ✅ Same | ✅ Same (identical) |
| **Testimonials** | ✅ Test-specific | ✅ Same testimonials (VIC Selective) |
| **Comparison Table** | ✅ Same | ✅ Same (identical) |
| **Test Details** | ✅ "Understanding the VIC Test" | ✅ "Understanding the Melbourne High Test" |
| **How It Works** | ✅ Same | ✅ Same (identical) |
| **FAQ** | ✅ General FAQs | ✅ School-specific FAQs (11 total) |
| **Footer** | ✅ Same | ✅ Same |

**Summary:** ~80% identical, ~20% customized

---

## ❓ Questions for You

1. **Approve Option A** (Copy & Customize)? Or prefer Option B (Extract Components)?
2. **School Facts Block location** - After Hero, before Pricing Card - good placement?
3. **Test Details section** - Keep the tab UI from CourseDetail? Or switch to different format?
4. **Testimonials** - Use same VIC Selective testimonials for all 4 schools? Or create school-specific ones later?
5. **CTA Button** - Should it link to `/course/vic-selective` product page? Or directly to checkout?

---

## 🚀 Next Steps (If Approved)

1. **Copy CourseDetail.tsx → SchoolPrepPage.tsx** (10 min)
2. **Build School Facts Block component** (45 min)
3. **Wire up school data** (30 min)
4. **Add routing** (10 min)
5. **Test Melbourne High page locally** (20 min)
6. **Show you for review** (you approve/give feedback)
7. **Build remaining 3 VIC pages** (30 min - just change school ID)
8. **Deploy** (10 min)

**Total:** ~2.5 hours from approval to live pages

---

**Ready to proceed with Option A?** Say "approved" and I'll start building!
