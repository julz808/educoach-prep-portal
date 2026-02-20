# EduCourse Platform Comprehensive Analysis Report

## Executive Summary

EduCourse is a comprehensive test preparation platform with three main learning modes (Diagnostic Assessment, Skill Drills, Practice Tests) integrated with a powerful analytics system. The platform uses sub-skill-level tracking to help parents and students understand performance at the granular level.

**Key Insight:** The platform's primary strength is its ability to identify performance gaps at the sub-skill level and recommend targeted drills based on diagnostic results. However, the connection between diagnostic insights and drill recommendations could be clearer/more automated.

---

## 1. PLATFORM SECTIONS & NAVIGATION STRUCTURE

### 1.1 Route Structure
**File:** `/src/routes/LearningRoutes.tsx`

The learning platform uses a nested route structure:
```
/dashboard (protected, main hub)
├── /diagnostic (Diagnostic Assessment)
├── /drill (Skill Drills)
├── /practice-tests (Full-length Practice Tests)
├── /insights (Analytics & Performance Dashboard)

/test/:testType/:subjectId/:sectionId/:sessionId (Test Taking Interface)
/test-instructions/:testType/:subjectId/:sessionId (Pre-test Instructions)
```

### 1.2 Main Dashboard
**File:** `/src/pages/Dashboard.tsx` (~400 lines)

**Purpose:** Entry point showing overall progress and quick-access cards to three main features

**Key Metrics Displayed:**
- Total Questions Completed (aggregate across all modes)
- Overall Average Score (weighted across all modes)
- Overall Accuracy (percentage)
- Total Study Time (hours + minutes)

**Three Main Cards:**
1. **Diagnostic Assessment** - Shows sections completed vs total
2. **Skill Drills** - Shows sub-skills completed vs total
3. **Practice Tests** - Shows practice tests completed (up to 5 tests available)

**Data Flow:**
```
Dashboard
  ↓
fetchDashboardMetrics() [analyticsService.ts]
  ↓
Aggregates data from:
  - user_test_sessions table (diagnostic, practice, drill)
  - question_attempt_history table (detailed question data)
  - writing_assessments table (for written sections)
```

---

## 2. DIAGNOSTIC ASSESSMENT

### 2.1 Overview
**File:** `/src/pages/Diagnostic.tsx` (~1110 lines)

**Purpose:** Initial assessment to identify student's current strengths/weaknesses across all sub-skills

**Structure:**
- Single test per product with multiple sections
- Sections map to curriculum areas (Reading, Math, Writing, etc.)
- Each section contains questions at varying difficulty levels

### 2.2 User Journey: Diagnostic

**Step 1: Load Diagnostic Sections**
```typescript
fetchDiagnosticModes(selectedProduct)
  ↓
Returns: TestMode[] with sections containing all questions
  ↓
Transform into UI showing:
  - Section name
  - Question count
  - Time limit (from TEST_STRUCTURES)
  - Progress status (not-started, in-progress, completed)
```

**Step 2: Start/Resume Section**
- User clicks "Start Section" or "Resume Section"
- Navigates to `/test-instructions/diagnostic/{sectionId}?sectionName=...`
- Instructions page (TestInstructionsPage.tsx) shows test format and rules
- User confirms ready → navigates to `/test/diagnostic/{sectionId}/{sessionId}`

**Step 3: Take Diagnostic**
- EnhancedTestInterface component handles question display
- Questions presented sequentially
- User can flag questions, review, change answers
- Time tracking (if section has time limit)
- Auto-saves progress every 30 seconds

**Step 4: Submit & View Results**
- User submits section
- ScoringService calculates score based on:
  - Correct answers (1 point each for MC)
  - Writing assessments (0-30 points for written sections)
- Results stored in user_test_sessions table
- Can view detailed section results with sub-skill breakdown

### 2.3 Data Model - Diagnostic

**Database Tables:**
- `user_test_sessions` - Session metadata (status, score, timestamps)
  - Fields: user_id, product_type, test_mode='diagnostic', section_name, status, current_question_index, total_questions, final_score
  
- `test_section_states` - Section-level progress
  - Fields: user_id, product_type, section_name, status, last_updated

- `question_attempt_history` - Per-question performance
  - Fields: session_id, question_id, user_answer, is_correct, time_spent_seconds

- `writing_assessments` - Writing rubric scores
  - Fields: session_id, question_id, total_score, max_possible_score, percentage_score

### 2.4 Diagnostic Sections by Product

| Product | Sections | Total Questions |
|---------|----------|-----------------|
| Year 5 NAPLAN | Writing, Reading, Language Conventions, Numeracy No Calc, Numeracy Calc | 131 |
| Year 7 NAPLAN | Writing, Reading, Language Conventions, Numeracy No Calc, Numeracy Calc | 180 |
| ACER (Y7) | Written Expression, Mathematics, Humanities | 71 |
| EduTest (Y7) | Reading Comprehension, Verbal Reasoning, Numerical Reasoning, Mathematics, Written Expression | 222 |
| NSW Selective (Y7) | Reading, Mathematical Reasoning, Thinking Skills, Writing | 106 |
| VIC Selective (Y9) | Reading Reasoning, Mathematics Reasoning, General Ability Verbal, General Ability Quantitative, Writing | 222 |

---

## 3. INSIGHTS / ANALYTICS DASHBOARD

### 3.1 Overview
**File:** `/src/pages/Insights.tsx` (~1000+ lines)
**Service:** `/src/services/analyticsService.ts` (~500+ lines)

**Purpose:** Comprehensive performance analysis across all three modes (Diagnostic, Practice, Drills)

### 3.2 Key Tabs & Views

#### **1. Overall Performance**
Displays aggregated metrics across all modes:
- **Overall Score:** Weighted average of diagnostic + practice + drill scores
- **Overall Accuracy:** Percentage of questions answered correctly
- **Spider/Radar Chart:** Shows performance across 4-6 sub-skills (varies by product)

#### **2. Diagnostic Results Tab**
Shows section-by-section breakdown:
- **Section Breakdown:** Score for each test section (Reading, Math, Writing, etc.)
- **Sub-Skill Analysis:** Performance broken down by individual sub-skills
  - Example: Reading Comprehension section has sub-skills like:
    - Literal Comprehension
    - Inferential Reasoning
    - Vocabulary in Context
    - Text Structure Analysis
- **Top/Bottom Performers:** Identifies strongest and weakest sub-skills
- **Toggle Views:** Switch between Score View and Accuracy View

#### **3. Practice Tests Tab**
Shows performance across practice test attempts:
- **Practice Test Listing:** Shows each practice test attempt (1-5)
- **Section Scores:** Performance on each section within the test
- **Skill Filter:** Filter by specific skill/section to see sub-skill breakdown
- **Trends:** Shows improvement over multiple practice test attempts

#### **4. Drills Tab**
Shows targeted drill performance:
- **Skill Area Breakdown:** Performance in each skill area
- **Difficulty Progression:** Tracks easy → medium → hard progression within each skill
- **Accuracy by Difficulty:** Compares accuracy across difficulty levels
- **Recommended Drills:** (Feature stub) Would highlight drills based on weak sub-skills from diagnostic

### 3.3 Sub-Skill System Architecture

#### **Unified Sub-Skills Catalog**
**File:** `/src/data/curriculumData.ts` (Lines 269-700+)

The platform defines 60+ unified sub-skills across all products:

**Reading & Comprehension:**
- Literal Comprehension
- Inferential Reasoning
- Interpretive Comprehension
- Vocabulary in Context
- Text Structure Analysis
- Character Analysis
- Theme & Message Analysis
- Critical Analysis & Evaluation
- Integration & Synthesis

**Mathematical Skills:**
- Numerical Operations
- Algebraic Reasoning
- Geometric & Spatial Reasoning
- Data Interpretation and Statistics
- Logical Mathematical Deduction
- Conceptual Understanding

**Logical Reasoning:**
- Logical Reasoning & Deduction
- Spatial Reasoning (2D & 3D)
- Verbal Reasoning & Analogies
- Pattern Recognition & Sequences
- Critical Thinking & Problem-Solving

**Writing Skills:**
- Narrative Writing
- Persuasive Writing
- Expository Writing
- Imaginative Writing
- Creative Writing
- Descriptive Writing
- Reflective Writing

**Each Sub-Skill Has:**
```typescript
{
  "Literal Comprehension": {
    "description": "Extracting explicitly stated information and factual details from texts",
    "visual_required": false  // Whether it requires visual rendering
  }
}
```

#### **Section-to-Sub-Skills Mapping**
**File:** `/src/data/curriculumData.ts` - `SECTION_TO_SUB_SKILLS` export

Maps curriculum sections to their constituent sub-skills. Example:
```
Reading Comprehension → [
  Literal Comprehension,
  Inferential Reasoning,
  Vocabulary in Context,
  ...
]
```

### 3.4 How Insights Calculates Performance

**Real Test Data Retrieval:**
`getRealTestData()` in analyticsService.ts (Lines 158-450)

```
1. Fetch ALL question_attempt_history records for session
2. For each attempt, look up question details (section, sub-skill, max_points)
3. If writing section:
   - Fetch writing_assessments for that session
   - Use actual rubric score instead of binary correct/incorrect
4. Aggregate by:
   - Section (sum of earned points / sum of max points)
   - Sub-skill (sum of earned points / sum of max points)
   - Overall (total earned / total max)
5. Calculate accuracy & score percentages
```

**Accuracy Calculation:**
```
Accuracy = (Questions Correct / Questions Attempted) × 100
Score = (Total Points Earned / Total Points Possible) × 100
```

### 3.5 Analytics Data Flow

```
Insights Page
  ↓
(On tab change)
  ↓
AnalyticsService.getDiagnosticResults(userId, productId)
  ↓
1. Query user_test_sessions WHERE test_mode='diagnostic'
2. For each completed session:
   - getRealTestData() → detailed Q&A breakdown
   - Build sectionBreakdown array
   - Build subSkillBreakdown array
3. Return {
     sectionBreakdown: [{section, score, accuracy, ...}],
     subSkillBreakdown: [{subSkill, section, score, accuracy, ...}],
     overallScore: number,
     overallAccuracy: number
   }
```

---

## 4. SKILL DRILLS SECTION

### 4.1 Overview
**File:** `/src/pages/Drill.tsx` (~1200 lines)

**Purpose:** Targeted practice of specific sub-skills at varying difficulty levels (Easy, Medium, Hard)

**Key Insight:** Drills are NOT automatically recommended based on diagnostic results - users must manually browse and select areas to practice.

### 4.2 Drill Hierarchy

```
Skill Areas (6-12 per product)
  ├─ Reading Comprehension
  ├─ Mathematical Reasoning
  ├─ Verbal Reasoning
  └─ [etc...]
     ↓
   Sub-Skills (3-5 per skill area)
     ├─ Literal Comprehension (15 questions)
     ├─ Inferential Reasoning (18 questions)
     └─ Vocabulary in Context (20 questions)
        ↓
      Difficulty Levels (3 per sub-skill)
        ├─ Easy (5 questions)
        ├─ Medium (5 questions)
        └─ Hard (5 questions)
```

### 4.3 User Journey: Drills

**Step 1: Browse Skill Areas**
- Drill.tsx loads all skill areas for product
- Calls `fetchDrillModes(selectedProduct)`
- Displays collapsible skill area cards showing:
  - Sub-skill count
  - Total questions
  - Progress % (completed / total)
  - Status badge (Not Started, In Progress, Completed)

**Step 2: Select Sub-Skill**
- User clicks "Start Practice" on a sub-skill
- Navigates to sub-skill detail view
- Shows three difficulty cards: Easy, Medium, Hard
- Each card displays:
  - Current score (if completed)
  - Progress circle (% complete)
  - Questions answered / total questions

**Step 3: Start Drill at Difficulty Level**
- User clicks "Start Practice" on difficulty level
- For **Writing Drills:**
  - Routes to `/test/drill/{subSkillName}?difficulty=easy`
  - TestTaking.tsx handles navigation and session creation
  
- For **Non-Writing Drills:**
  - Creates session via DrillSessionService
  - Routes to `/test/drill/{subSkillId}?skill=...&difficulty=...`

**Step 4: Take Drill**
- EnhancedTestInterface displays questions sequentially
- NO TIMER for drills (immediate answer feedback)
- After each question:
  - Shows correct/incorrect indicator
  - Displays explanation
  - User can review and move to next
- Questions selected from difficulty-filtered set

**Step 5: Complete & View Results**
- DrillSessionService marks session as completed
- Calculates score (% correct)
- Stores in:
  - drill_sessions table (for regular drills)
  - user_test_sessions table (for writing drills)
- Can review drill response

### 4.4 Data Model - Drills

**Database Tables:**
- `drill_sessions` - Drill session metadata (for non-writing drills)
  - Fields: user_id, product_type, sub_skill_id, difficulty (1-3), status, questions_answered, questions_total, questions_correct, final_score

- `user_test_sessions` - Drill session metadata (for writing drills)
  - Fields: user_id, product_type, test_mode='drill', section_name, status, current_question_index, total_questions, final_score

- `writing_assessments` - Writing drill rubric scores
  - Fields: session_id, question_id, total_score, max_possible_score, percentage_score

### 4.5 Progress Tracking - Drills

**How Progress is Loaded:**
```typescript
loadDrillProgress():
  1. Query drill_sessions for this user/product
  2. Query user_test_sessions for this user/product (writing drills)
  3. Organize by sub_skill_id and difficulty
  4. For each entry:
     - Record completed count
     - Record total questions
     - Record best score
     - Record session ID (for resume/review)
```

**Key Challenge:** Sub-skill ID matching
- Regular drills use deterministic UUID generation: `generateDeterministicUUID(subSkillName)`
- Writing drills use: `getWritingDrillUUID(sectionName)` (which also generates deterministic UUID)
- Must match when loading progress to display correctly

### 4.6 Writing Drills Special Handling

**Different from other drills:**
- Route through TestTaking.tsx (like diagnostic/practice)
- Can have text responses scored by writing_assessments table
- Session created in user_test_sessions (not drill_sessions)
- Difficulty levels mapped to essay numbering:
  - Easy → Essay 1
  - Medium → Essay 2
  - Hard → Essay 3

### 4.7 Problem: Drill Navigation Friction

**Current State:**
1. User takes diagnostic test
2. Gets detailed sub-skill breakdown in Insights
3. Must manually go back to Drill page
4. Must manually find the weak skill area
5. Must manually drill on that sub-skill

**What Could Improve:**
- Auto-recommended drills in Insights showing "Based on your diagnostic results, you scored 45% on Literal Comprehension - try our drills"
- Direct "Start Drill" link from Insights → Drill page with pre-selected skill
- Progress sync between diagnostic results and drill recommendations

---

## 5. PRACTICE TESTS

### 5.1 Overview
**File:** `/src/pages/PracticeTests.tsx` (~250+ lines)

**Purpose:** Full-length practice tests that simulate real exam conditions

**Available Tests:** 5 full-length practice tests per product

### 5.2 User Journey: Practice Tests

**Step 1: View Practice Tests**
- Loads up to 5 practice test modes: `practice_1` through `practice_5`
- Each shows:
  - Test name
  - Section breakdown
  - Total time estimate
  - Sections completed vs total
  - Status (Not Started, In Progress, Completed)

**Step 2: Start/Resume Test**
- Click "Start Test" on a practice test
- Navigates to `/test-instructions/practice/{testNumber}?sectionName=...`
- Instruction page shows:
  - Format (Multiple Choice, Written Response)
  - Time limits
  - Rules and strategies

**Step 3: Take Practice Test**
- Same EnhancedTestInterface as diagnostic
- Sections presented sequentially
- Timer enforces time limits
- All questions in section must be answered
- Immediate feedback (optional)

**Step 4: Complete & View Results**
- Auto-calculated score stored in user_test_sessions
- Can review test with detailed feedback
- Trends tracked across multiple attempts

### 5.3 Data Model - Practice Tests

**Database Tables:**
- `user_test_sessions` - Practice test session metadata
  - Fields: user_id, product_type, test_mode='practice_1|2|3|4|5', section_name, status, final_score

- `question_attempt_history` - Question-level data
  - Fields: session_id, question_id, user_answer, is_correct

---

## 6. QUESTION & CONTENT STRUCTURE

### 6.1 Question Database Schema

**File:** `questions` table in Supabase

**Fields:**
```typescript
{
  id: string (UUID)
  product_type: string (e.g., "EduTest Scholarship (Year 7 Entry)")
  test_mode: string (e.g., "diagnostic", "practice_1", "drill")
  section_name: string (e.g., "Reading Comprehension")
  sub_skill: string (e.g., "Literal Comprehension")
  text: string (question text)
  options: string[] (multiple choice options)
  correct_answer: number (0-3 index)
  explanation: string (detailed answer explanation)
  difficulty: number (1=easy, 2=medium, 3=hard)
  format: string ("Multiple Choice" | "Written Response")
  max_points: number (1 for MC, 0-30 for writing)
  passage_id?: string (links to reading passage)
}
```

### 6.2 Content Organization

**By Product:** Questions organized by curriculum product type

**By Test Mode:**
- `diagnostic` - Initial assessment questions
- `practice_1` through `practice_5` - Practice test variants
- `drill` - Drill-specific questions organized by sub-skill

**By Difficulty:**
- 1 = Easy (foundation building)
- 2 = Medium (typical exam level)
- 3 = Hard (stretch/challenge)

### 6.3 Question Generation

**File:** `/src/engines/questionGeneration/` (multiple files)

The platform can auto-generate questions using Claude AI:
- Curriculum-based generation
- Question validation
- Difficulty calibration
- Visual rendering (diagrams, shapes for spatial reasoning)

---

## 7. CROSS-CUTTING CONCERNS

### 7.1 Sub-Skill Tracking

**The Core Innovation:** Every question is tagged with a sub-skill

```typescript
// When taking any test (diagnostic, practice, drill)
1. Question is presented: { text, options, sub_skill: "Literal Comprehension" }
2. User answers: { userAnswer: 1 }
3. Session is saved with sub-skill info
4. In Analytics, aggregated by sub-skill
5. User can see: "You got 6/8 (75%) on Literal Comprehension"
```

**Benefits:**
- Parents see exactly WHERE student is weak
- Enables targeted drill recommendations
- Tracks improvement in specific skills

**Current Gap:** The linkage between weak sub-skills in diagnostics → recommended drills is manual, not automated.

### 7.2 Time Allocation System

**File:** `/src/utils/timeUtils.ts`

Unified time limits from curriculum data:
```typescript
getUnifiedTimeLimit(productType: string, sectionName: string): number

// Example:
getUnifiedTimeLimit("EduTest Scholarship (Year 7 Entry)", "Reading Comprehension")
// Returns: 30 (minutes from TEST_STRUCTURES)
```

**Applied To:**
- Diagnostic: Uses curriculum times (same as practice)
- Practice: Uses curriculum times
- Drills: No timer (null) - immediate answer reveal

### 7.3 Writing Assessment

**File:** `/src/services/writingAssessmentService.ts`

For written response questions (essays, short answers):
```
1. User submits text response
2. WritingAssessmentService evaluates using rubric:
   - Content (0-10 points)
   - Organization (0-10 points)  
   - Style/Grammar (0-10 points)
   - Total: 0-30 points
3. Stored in writing_assessments table
4. Used in score calculation (not binary correct/incorrect)
```

### 7.4 Session Persistence & Resume

**Files:**
- `/src/services/sessionPersistenceService.ts`
- `/src/services/sessionService.ts`

**Auto-Save Strategy:**
```
Every 30 seconds while user is active:
  1. Save current answers to session_data
  2. Update current_question_index
  3. Save flagged questions
  4. Persist to Supabase
  
When user resumes:
  1. Load last session_data
  2. Restore answers and current position
  3. Restore time remaining
  4. Resume from where they left off
```

### 7.5 Product Access Control

**File:** `/src/context/ProductContext.tsx`

Users can have access to multiple products (Year 5 NAPLAN, EduTest, etc.)

```typescript
// ProductContext provides:
selectedProduct: string // Currently selected product
currentProduct: Product // Full product object
hasAccessToCurrentProduct: boolean // Can user access it?
productAccess: Record<string, boolean> // All accessible products

// Usage in components:
if (!hasAccessToCurrentProduct) {
  return <PaywallComponent /> // Show paywall if not accessible
}
```

---

## 8. CURRENT PAIN POINTS & OPPORTUNITIES

### 8.1 Diagnostic → Drill Connection Weakness

**Current State:** Users must manually translate diagnostic insights into drill practice
- Take diagnostic → See weak sub-skills in Insights
- Manually navigate back to Drill page
- Search for weak skill area
- Select sub-skill to drill

**Opportunity:** 
- Add "Recommended Drills" section in Insights showing top 3 weak skills
- Add direct "Start Drill" button from insights → pre-loads weak skill
- Auto-populate recommended difficulties based on diagnostic score

**Implementation Path:**
```typescript
// In analyticsService.ts
getRecommendedDrills(diagnosticResults): {
  subSkill: string,
  section: string,
  diagnosticScore: number,
  recommendedDifficulty: 'easy' | 'medium' | 'hard'
}[]

// Returns bottom 3 sub-skills with recommended difficulty:
// - Score < 50% → Start at Easy
// - Score 50-70% → Start at Medium  
// - Score > 70% → Start at Hard
```

### 8.2 Sub-Skill Recommendations in Drills

**Current State:** No logic recommends specific drills based on diagnostic weaknesses

**Opportunity:**
- Use `DrillSection.isRecommended` field (already exists but unused)
- Fetch diagnostic sub-skill scores
- Mark bottom 3 skills with `isRecommended: true`
- Show "Recommended Based on Your Diagnostic" badge

### 8.3 Practice Test Progression

**Current State:** All 5 practice tests are available at once; no suggested sequence

**Opportunity:**
- Suggest practice test sequence based on progress
- Test 1 → Review results → Drill weak areas → Test 2, etc.
- Show "You've improved 15% since Practice Test 1" between tests

### 8.4 Writing Drill Integration

**Current Gap:** Writing drills are harder to discover and use than MC drills
- Routed through TestTaking.tsx (same as practice)
- Different session table (user_test_sessions vs drill_sessions)
- More complex progress tracking

**Opportunity:**
- Standardize on single session table
- Better discovery in Drill interface
- Show rubric scores prominently in drill results

### 8.5 Sub-Skill Definition Gaps

**Some products have incomplete sub-skill mappings:**
- Some questions lack sub_skill assignment
- Drill section lookups may fail to match progress
- UUID generation consistency issues

**Opportunity:**
- Audit all questions for sub-skill tagging
- Create missing sub-skill definitions
- Implement validation on question upload

---

## 9. TECHNICAL ARCHITECTURE SUMMARY

### 9.1 Frontend Stack
- **Framework:** React 18 with TypeScript
- **Routing:** React Router v6 (with outlet pattern)
- **State Management:** React Context (Auth, Product, User)
- **UI Components:** shadcn/ui + Tailwind CSS
- **Data Fetching:** Supabase client SDK + React hooks

### 9.2 Backend (Supabase)
- **Database:** PostgreSQL (Supabase)
- **Auth:** Supabase Auth (JWT)
- **Functions:** Edge functions for server-side logic
- **Real-time:** Subscriptions for live updates

### 9.3 Key Service Layer Files
```
/src/services/
├── analyticsService.ts (60+ functions for insights)
├── sessionService.ts (Session state management)
├── testSessionService.ts (Practice/diagnostic sessions)
├── drillSessionService.ts (Drill session management)
├── writingAssessmentService.ts (Writing rubric scoring)
├── supabaseQuestionService.ts (Content retrieval)
├── dashboardService.ts (Dashboard metrics)
└── [+ 10 other services]
```

### 9.4 Data Flow Pattern

```
Component (e.g., Diagnostic.tsx)
  ↓
useEffect(() => loadData())
  ↓
Service Layer (e.g., fetchDiagnosticModes)
  ↓
Supabase Client
  ↓
Database Query
  ↓
Process/Transform Data
  ↓
Return to Component
  ↓
setState() → Re-render
```

---

## 10. KEY FILES REFERENCE

### Core Pages
| File | Purpose | Lines |
|------|---------|-------|
| `/src/pages/Dashboard.tsx` | Main hub, metrics overview | 400+ |
| `/src/pages/Diagnostic.tsx` | Diagnostic test interface | 1110 |
| `/src/pages/Drill.tsx` | Skill drills browser & launcher | 1200 |
| `/src/pages/PracticeTests.tsx` | Practice test launcher | 250+ |
| `/src/pages/Insights.tsx` | Analytics dashboard | 1000+ |
| `/src/pages/TestTaking.tsx` | Test interface (universal) | 1968 |
| `/src/pages/TestInstructionsPage.tsx` | Pre-test instructions | ~400 |

### Services
| File | Purpose |
|------|---------|
| `/src/services/analyticsService.ts` | Performance analysis, reporting |
| `/src/services/sessionService.ts` | Session state tracking |
| `/src/services/supabaseQuestionService.ts` | Content retrieval & organization |
| `/src/services/writingAssessmentService.ts` | Writing rubric evaluation |
| `/src/services/scoringService.ts` | Test score calculation |

### Data
| File | Purpose |
|------|---------|
| `/src/data/curriculumData.ts` | TEST_STRUCTURES, UNIFIED_SUB_SKILLS, mappings |
| `/src/lib/config/productConfig.ts` | Product definitions & pricing |

### Components
| Component | Purpose |
|-----------|---------|
| `EnhancedTestInterface.tsx` | Actual test UI (Q&A display) |
| `InteractiveInsightsDashboard.tsx` | Analytics visualization |
| `WritingAssessmentFeedback.tsx` | Writing feedback display |
| `HeroBanner.tsx` | Section header with metrics |

---

## 11. RECOMMENDATIONS FOR LANDING PAGE COPY

Based on the platform analysis, emphasize:

1. **Sub-Skill Level Insights**
   - "See exactly WHERE your child is struggling, not just overall scores"
   - "Track progress in 60+ specific skills like Literal Comprehension and Spatial Reasoning"

2. **Three-Step Methodology (Already Aligned)**
   - Diagnostic → Identify gaps in specific sub-skills
   - Drills → Practice weak skills at targeted difficulty levels
   - Practice Tests → Full-length exam simulation

3. **Detailed Feedback & Explanations**
   - "Every question includes detailed explanations written by expert teachers"
   - "Learn WHY answers are correct, not just that you got it wrong"

4. **Progress Tracking**
   - "See improvement week-by-week in specific skills"
   - "Charts and graphs show exactly how your child is progressing"

5. **Expert-Designed Content**
   - "Questions mapped to official test curriculums"
   - "1000+ practice questions covering all difficulty levels"

6. **Parent Dashboard**
   - "Monitor your child's progress in real-time"
   - "Understand test format and what to expect on exam day"

---

## 12. CONCLUSION

The EduCourse platform is a sophisticated test preparation system with:
- **Strength:** Granular sub-skill level tracking and comprehensive analytics
- **Strength:** Seamless integration of diagnostic, drill, and practice test modes
- **Opportunity:** Automating the connection between diagnostic insights and drill recommendations
- **Opportunity:** Creating a more guided learning path rather than self-directed navigation

The landing page should emphasize the detailed, sub-skill level insights that set EduCourse apart from generic test prep platforms.
