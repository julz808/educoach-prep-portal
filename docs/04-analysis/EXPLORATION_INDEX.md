# EduCourse Platform Exploration - Complete Index

## Documents Generated

### 1. Comprehensive Platform Analysis Report
**File:** `/Users/julz88/Documents/educoach-prep-portal-2/PLATFORM_ANALYSIS_REPORT.md` (827 lines)

**Contents:**
- Executive summary
- Platform sections & navigation structure
- Diagnostic assessment deep dive
- Insights/analytics system with sub-skill tracking
- Skill drills section & user journey
- Practice tests overview
- Question & content structure
- Cross-cutting concerns (sub-skill tracking, time allocation, writing assessment, session persistence, product access)
- Pain points & opportunities
- Technical architecture
- Key files reference
- Landing page recommendations
- Conclusion

**Key Takeaway:** The platform's core innovation is sub-skill level tracking across 60+ skills, but the connection between diagnostic results and drill recommendations is manual and could be automated.

---

### 2. Quick Reference Summary
**File:** `/Users/julz88/Documents/educoach-prep-portal-2/PLATFORM_QUICK_REFERENCE.txt` (230 lines)

**Contents:**
- Route structure (7 main routes)
- Three main modes comparison table
- Insights/analytics system overview
- Sub-skill system architecture
- Products & their structures (6 products, 71-222 questions each)
- User journey flow with friction points
- Writing questions special handling
- Session persistence mechanism
- Key files by responsibility
- Landing page recommendations

**Use This For:** Quick lookup during development or landing page copy writing.

---

## File Structure Summary

### Page Files (Main UI)
```
/src/pages/
├── Dashboard.tsx                    (400 lines)    ✓ Explored
├── Diagnostic.tsx                  (1110 lines)   ✓ Explored  
├── Drill.tsx                       (1200 lines)   ✓ Explored
├── PracticeTests.tsx               (250+ lines)   ✓ Explored
├── Insights.tsx                    (1000+ lines)  ✓ Explored
├── TestTaking.tsx                  (1968 lines)   ✓ Explored (partial)
└── TestInstructionsPage.tsx        (400 lines)    ✓ Referenced
```

### Service Layer (Data & Business Logic)
```
/src/services/
├── analyticsService.ts             (500+ lines)   ✓ Explored
├── supabaseQuestionService.ts      (300+ lines)   ✓ Referenced
├── sessionService.ts               (200+ lines)   ✓ Referenced
├── testSessionService.ts           (200+ lines)   ✓ Referenced
├── drillSessionService.ts          (150+ lines)   ✓ Referenced
├── writingAssessmentService.ts     (150+ lines)   ✓ Referenced
├── scoringService.ts               (150+ lines)   ✓ Referenced
├── dashboardService.ts             (100+ lines)   ✓ Referenced
└── [+ 8 other services]
```

### Data & Configuration
```
/src/data/
├── curriculumData.ts               (700+ lines)   ✓ Explored
│   ├── TEST_STRUCTURES (6 products)
│   └── UNIFIED_SUB_SKILLS (60+ skills)
├── productConfig.ts                (100 lines)    ✓ Referenced
└── [other data files]

/src/config/
└── stripeConfig.ts                                ✓ Referenced
```

### Routes
```
/src/routes/
└── LearningRoutes.tsx              (56 lines)     ✓ Explored
```

### Components
```
/src/components/
├── EnhancedTestInterface.tsx                      ✓ Referenced
├── InteractiveInsightsDashboard.tsx               ✓ Referenced
├── WritingAssessmentFeedback.tsx                  ✓ Referenced
└── [+ 40 other components]
```

---

## Key Findings

### 1. Platform Architecture
**Three-Mode System:**
- Diagnostic Assessment: Initial skills assessment (130-220 questions per product)
- Skill Drills: Targeted sub-skill practice (Easy/Medium/Hard levels)
- Practice Tests: Full-length exam simulation (5 tests per product)

**Integration Point:** Insights/Analytics Dashboard pulls data from all three modes

### 2. Sub-Skill System (Core Innovation)
- **60+ unified sub-skills** defined in curriculumData.ts
- Every question tagged with a sub_skill
- Performance aggregated at sub-skill level (not just section/test level)
- Enables parent visibility into specific learning gaps
- **Gap:** No automation to recommend drills based on weak sub-skills

### 3. Data Model
**Three main tables:**
- `user_test_sessions` - Session metadata (status, score, timestamps)
- `question_attempt_history` - Per-question responses (user_answer, is_correct)
- `writing_assessments` - Writing rubric scores (0-30 points per essay)

**Analytics calculated by:**
1. Fetching question_attempt_history for session
2. Looking up question details (section, sub_skill, max_points)
3. Aggregating by section & sub-skill
4. Calculating Score % and Accuracy %

### 4. Products Supported
| Product | Sections | Total Q | Status |
|---------|----------|---------|--------|
| Year 5 NAPLAN | 5 | 131 | Active |
| Year 7 NAPLAN | 5 | 180 | Active |
| ACER (Y7) | 3 | 71 | Active |
| EduTest (Y7) | 5 | 222 | Active |
| NSW Selective (Y7) | 4 | 106 | Active |
| VIC Selective (Y9) | 5 | 222 | Active |

### 5. Current Friction Points
1. **Diagnostic → Drill Gap:** Users must manually navigate from Insights to Drills
2. **Manual Skill Selection:** Must find weak skill area in drills (not pre-selected)
3. **No Recommended Drills:** Feature stub exists (`isRecommended` field) but unused
4. **Sub-skill Matching:** UUID generation complexity across regular vs writing drills
5. **Writing Drill Integration:** Different session tables, different routing

### 6. Opportunities for Improvement
1. **Automated Drill Recommendations**
   - Show "Based on your diagnostic, you scored 45% on Literal Comprehension"
   - Suggest recommended difficulty level based on score
   - Direct "Start Drill" button from weak skills

2. **Linked Learning Path**
   - Diagnostic → View Results → Recommended Drills → Take Drill → Practice Tests
   - Show progress comparison across modes

3. **Unified Session Tracking**
   - Consolidate writing drill sessions into drill_sessions table
   - Simplify UUID generation and progress matching

4. **Sub-Skill Data Validation**
   - Audit all questions for sub_skill assignment
   - Create missing definitions
   - Validate on upload

---

## References by Topic

### Understanding Sub-Skills
- **Definition:** `/src/data/curriculumData.ts` (Lines 269-700+) - UNIFIED_SUB_SKILLS export
- **Usage:** Every question in questions table has `sub_skill` field
- **Tracking:** `/src/services/analyticsService.ts` - aggregates by sub_skill
- **Display:** `/src/pages/Insights.tsx` - shows sub-skill breakdown in diagnostic results tab

### Understanding Diagnostic Flow
- **Page:** `/src/pages/Diagnostic.tsx` (lines 1-100) - Component setup
- **Loading:** `/src/pages/Diagnostic.tsx` (lines 121-195) - Data loading with fetchDiagnosticModes()
- **Taking:** `/src/pages/TestTaking.tsx` - Universal test interface
- **Results:** `/src/pages/Insights.tsx` - Insights tab for diagnostic results

### Understanding Drill Workflow
- **Page:** `/src/pages/Drill.tsx` (lines 1-100) - Component setup
- **Loading:** `/src/pages/Drill.tsx` (lines 100-502) - loadDrillProgress() + fetchDrillModes()
- **Progress:** `/src/pages/Drill.tsx` (lines 100-286) - Progress tracking from drill_sessions
- **Taking:** `/src/pages/TestTaking.tsx` - Routes to test interface
- **Results:** `/src/pages/Insights.tsx` - Drills tab for drill performance

### Understanding Analytics
- **Service:** `/src/services/analyticsService.ts` (500+ lines)
- **Key Function:** `getRealTestData()` (lines 158-450) - Calculates real performance
- **UI:** `/src/pages/Insights.tsx` (1000+ lines) - Displays analytics
- **Tabs:** Overall, Diagnostic, Practice, Drills

### Understanding Time Allocation
- **Source:** `/src/data/curriculumData.ts` - TEST_STRUCTURES (times for each section)
- **Usage:** `/src/utils/timeUtils.ts` - getUnifiedTimeLimit() function
- **Applied:** All test modes use these times (diagnostic, practice, drill)
- **Override:** Drills use no timer (null) for immediate feedback

### Understanding Writing Assessment
- **Service:** `/src/services/writingAssessmentService.ts`
- **Rubric:** Content (0-10), Organization (0-10), Style/Grammar (0-10)
- **Storage:** `/src/services/analyticsService.ts` - fetches from writing_assessments table
- **Calculation:** Uses actual rubric score (0-30), not binary correct/incorrect

---

## Recommendations for Landing Page

Based on comprehensive platform analysis:

### 1. Emphasize Sub-Skill Level Insights
"See exactly where your child is struggling, not just overall scores"
"Track progress in 60+ specific skills like Literal Comprehension and Spatial Reasoning"

### 2. Align With Three-Step Methodology
- **Step 1: Diagnostic** - "Identify gaps in specific sub-skills"
- **Step 2: Drills** - "Practice weak skills at targeted difficulty levels"
- **Step 3: Practice Tests** - "Full-length exam simulation to test readiness"

### 3. Highlight Expert Design
"1000+ questions mapped to official test curriculums"
"Expert teachers created every question with detailed explanations"

### 4. Show Progress Tracking
"Charts and graphs show improvement week-by-week in specific skills"
"Parent dashboard lets you monitor your child's real-time progress"

### 5. Demonstrate Real Results
"See exactly which sub-skills improved and which need more practice"
"Detailed feedback explains WHY answers are correct, not just that you got it wrong"

---

## How to Use These Documents

**For Landing Page Copy:**
→ Use PLATFORM_QUICK_REFERENCE.txt + Section 11 of PLATFORM_ANALYSIS_REPORT.md

**For Architecture Understanding:**
→ Read full PLATFORM_ANALYSIS_REPORT.md

**For Quick Lookup:**
→ Use PLATFORM_QUICK_REFERENCE.txt for page locations and routes

**For Feature Implementation:**
→ Reference specific file paths and line numbers in PLATFORM_ANALYSIS_REPORT.md

---

**Report Generated:** January 30, 2026
**Platform Version:** EduCourse Learning Platform (2026)
**Explored Files:** 50+
**Total Documentation:** 1,057 lines across 2 files
