# Data Analysis: School Database Review

**File:** `top_schools_ranked.xlsx`
**Date Analyzed:** April 1, 2026

---

## 📊 What We Have

### Coverage
- ✅ **NSW Selective:** 21 schools (top 20 + header)
- ✅ **VIC Selective:** 4 schools (all 4 government selective schools)
- ✅ **EduTest VIC:** 25 schools
- ✅ **ACER VIC:** 25 schools
- ✅ **EduTest NSW:** 25 schools

**Total:** ~100 schools (excellent coverage!)

### Data Fields Present

✅ **Core Identity:**
- Rank (market size ranking)
- School Name
- State (NSW/VIC)
- Suburb/Location
- Gender (Boys/Girls/Co-ed)
- School Type (Govt Selective / Independent / Catholic)

✅ **Market Sizing:**
- Total Enrolment (entire school)
- Scholarship/Entry Places (annual intake)
- ICSEA score
- Competitiveness description

✅ **Test Information:**
- Test Type (NSW Selective / VIC Selective / EduTest / ACER)
- Entry Year(s)
- Application dates (some "Check website" - need refinement)
- Test dates (some TBC)
- Results dates (some "Varies")

✅ **Additional Context:**
- Website URL
- Notable Features (strengths, unique characteristics)
- Source (where data came from)

---

## ✅ What's GOOD About This Data

1. **Market-size ranked** - Perfect for prioritization
2. **Rich context** - "Notable Features" column is gold for unique content
3. **Competitiveness data** - Great for AEO answers
4. **Source citations** - Critical for credibility
5. **Real enrollment numbers** - Not estimates, actual data
6. **Test type mapping is clear** - NSW/VIC/EduTest/ACER correctly identified

---

## ⚠️ What We're MISSING (for full programmatic SEO pages)

### Critical Gaps (Need for ALL pages)

1. **Specific Test Dates** ❌
   - Many say "TBC" or "Check website" or "Varies"
   - **Impact:** Can't answer "When is the [school] test in 2027?" (AEO-critical question)
   - **Solution:** Need research per school (automated or manual)

2. **Exact Application Dates** ❌
   - Many say "Check school website" or "Varies"
   - **Impact:** Parents need exact dates for planning
   - **Solution:** Research from official school websites

3. **Acceptance Rate %** ❌
   - Only have qualitative ("highly competitive", "extremely competitive")
   - **Impact:** Can't provide data-driven comparisons
   - **Solution:** Calculate where possible (Places ÷ Applicants × 100)
   - **Note:** Most schools don't publish applicant numbers

4. **Estimated Applicants** ❌
   - Not present in dataset
   - **Impact:** Hard to quantify competitiveness
   - **Solution:** May need to leave blank (better than guessing)

### Nice-to-Have Gaps (Can add later)

5. **School-Specific FAQ Answers** ⚠️
   - We have general data, but need specific Q&As per school
   - **Examples needed:**
     - "What score do you need for Melbourne High?"
     - "Can you retake the VIC Selective test?"
     - "Does Haileybury offer full scholarships?"
   - **Solution:** Generate via research + AI (school-specific)

6. **Test Section Breakdown** ⚠️
   - For AEO tables: "What sections are on the [school] test?"
   - **Solution:** Use our curriculum data (same for all schools using same test type)
   - **Example:** All VIC Selective schools use same ACER test format

7. **Historical Cut-off Scores** ⚠️
   - Some have this ("min ~278/300"), most don't
   - **Impact:** Parents want to know target scores
   - **Solution:** Research school websites, forums (MySchool, Whirlpool)
   - **Note:** Most don't publish - can leave blank

8. **School-Specific Images** 📸
   - School logos (we have 29 already!)
   - Campus photos (optional, for visual appeal)
   - **Solution:** Use existing logos, add more as needed

---

## 💡 YOUR QUESTION: "Is this all the information we need?"

### Short Answer: **Almost! We have 80% of what we need.**

### What We Can Do RIGHT NOW:
✅ Import all 100 schools into database
✅ Generate SEO metadata for each
✅ Create page structure with existing data
✅ Build FAQ sections (using general questions + our research)
✅ Create test details tables (from curriculum data)
✅ Add "Notable Features" as unique content per school

### What We NEED Before Launch:
❌ Specific 2027 test dates for each school
❌ Application window dates for each school
❌ Clarify which EduTest/ACER schools test on which dates

---

## 🎯 PROPOSED SOLUTION: Two-Tier Approach

### **Tier 1: Build Pages with Current Data (This Week)**

**What we'll do:**
1. Import all 100 schools into TypeScript database
2. Generate all pages with:
   - ✅ School name, location, type, gender
   - ✅ ICSEA, enrollment, competitiveness
   - ✅ "Notable Features" as unique content block
   - ✅ Test type (NSW/VIC/EduTest/ACER)
   - ✅ Entry years
   - ⚠️ **Placeholder for test dates:** "2027 test dates TBC - check [school website]"
   - ✅ Link to official school website
   - ✅ General FAQs (same across similar schools)
   - ✅ Test section details (from our curriculum data)

**Why this works:**
- Pages are live and indexing
- 80% of content is unique per school
- We cite official sources for missing data
- Can update dates once confirmed

### **Tier 2: Enhanced Research (Week 2-3)**

**For top 20 schools (by market rank), I'll do grounded research:**
1. Visit each school's official website
2. Find exact 2027 test dates
3. Find exact application windows
4. Research school-specific FAQs (Whirlpool, forums, MySchool)
5. Find any published cut-off scores
6. Generate 3-5 unique FAQ answers per school
7. Update pages with rich, school-specific content

**Tools I'll use:**
- WebFetch tool (to read school websites)
- Claude's knowledge (for general test info)
- Your curriculum data (for test sections)
- Perplexity (for missing dates)

---

## 📝 Example: What a Page Will Look Like

### **Melbourne High School** (Tier 1 - Current Data)

**Hero Section:**
- ✅ "Melbourne High School VIC Selective Entry Prep 2027"
- ✅ "Boys only, Government Selective, South Yarra"
- ✅ CTA: "Start Free Diagnostic Test"

**Key Facts Block:**
- ✅ Total Enrollment: 1,400 students
- ✅ Entry Places: ~250/year (Year 9)
- ✅ ICSEA: 1178
- ✅ Competitiveness: "Extremely competitive. ~12,000+ applicants for ~860 total places across 4 schools. ~7% acceptance."
- ⚠️ **Test Date:** "2027 test dates typically June - check [vic.gov.au] for confirmation"
- ⚠️ **Application Window:** "Applications typically open March - check official VIC Selective Entry portal"

**Test Details Table:**
- ✅ VIC Selective Entry Test sections (from our curriculum data)
- ✅ Numerical Reasoning: 30 questions, 30 minutes
- ✅ Reading Comprehension: 35 questions, 35 minutes
- ✅ (etc - all sections listed)

**FAQ Section (General):**
- ✅ "What is the VIC Selective Entry Test?" → Standard answer
- ✅ "What score do you need for Melbourne High?" → "While exact cutoffs aren't published, successful applicants typically score in the Superior band (top 5%)."
- ⚠️ "When is the Melbourne High test in 2027?" → "The VIC Selective Entry Test for 2027 entry is typically held in June. Check [vic.gov.au/selective-entry] for confirmed dates."

**Notable Features:**
- ✅ "#1 ranked VIC school many years"
- ✅ "Boys only Yr 9-12"
- ✅ "Also EduTest for Yr 10 entry"
- ✅ "17 principal discretion places"
- ✅ Link to: https://mhs.vic.edu.au/

**Product Showcase:**
- ✅ "1000+ VIC Selective Entry practice questions"
- ✅ "Covers all test sections Melbourne High requires"
- ✅ Comparison: Tutoring vs EduCourse

---

## 🚀 ACTION PLAN

### **TODAY (Your Task):**
Review this analysis and confirm:
1. **Approve Tier 1 approach?** (Build pages with current data + placeholders for dates)
2. **Approve Tier 2 research?** (Enhanced research for top 20 schools)
3. **Any schools missing** you definitely want included?
4. **Any additional data points** you have access to?

### **NEXT (My Task - 24-48 hours):**
1. ✅ Import Excel data into TypeScript database
2. ✅ Generate school IDs (slugs)
3. ✅ Create SEO metadata for each school
4. ✅ Build page template components
5. ✅ Generate first 5 pages (Melbourne High, Mac.Robertson, Sydney Boys, Sydney Girls, + 1 EduTest school)
6. ✅ Show you for review

### **WEEK 2 (Enhanced Research):**
For top 20 schools (by rank):
1. Research exact 2027 dates from official sources
2. Generate school-specific FAQs
3. Find cut-off scores if available
4. Update pages with rich content

---

## 💭 YOUR OTHER QUESTION: "More grounded research per school for uniqueness?"

### **YES - Great idea! Here's how we'll do it:**

**For ALL schools (Tier 1):**
- Use "Notable Features" column as unique content
- Each school gets its own intro paragraph
- Different competitiveness stats
- Different enrollment numbers
- Link to different official website

**For TOP 20 schools (Tier 2 - Enhanced):**
I'll do grounded research using:
1. **WebFetch tool** - Read school websites directly
2. **Perplexity** - Find forum discussions, parent reviews
3. **Official sources** - vic.gov.au, education.nsw.gov.au, ACER, EduTest
4. **Your curriculum data** - Test section details
5. **AI generation** - School-specific FAQs (fact-checked)

**Result:**
- Top 20 pages: 95% unique content
- Other 80 pages: 80% unique content (still good!)
- All pages: Factual, citation-worthy, AEO-optimized

---

## ✅ SUMMARY

**What we have:** 🎉 Excellent foundation data for 100 schools
**What we're missing:** ⚠️ Specific 2027 test dates (need research)
**Proposed approach:** ✅ Tier 1 (all 100 pages) + Tier 2 (top 20 enhanced)
**Your input needed:** Approve approach, confirm priorities

**Ready to build!** 🚀

---

**Next steps:**
1. You review this analysis
2. You approve Tier 1 + Tier 2 approach
3. I import data and build first 5 pages
4. You review first pages
5. I scale to all 100 pages
6. Week 2: I enhance top 20 with research

Sound good?
