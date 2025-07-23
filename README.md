# EduCourse Implementation Guide

<!-- Webhook fix deployment trigger -->

## Project Overview

**Project Name:** EduCourse  
**Version:** 1.0.0  
**Description:** Australian test prep platform with diagnostic tests, drills, and practice tests

## Database Configuration

**Provider:** Supabase  
**Schema Version:** 2025-01-14

### Product Types
- VIC Selective Entry (Year 9 Entry)
- NSW Selective Entry (Year 7 Entry)
- Year 5 NAPLAN
- Year 7 NAPLAN
- EduTest Scholarship (Year 7 Entry)
- ACER Scholarship (Year 7 Entry)

### Test Modes
- diagnostic
- drill
- practice_1
- practice_2
- practice_3
- practice_4
- practice_5

## Database Schema

### Tables

#### user_profiles
**Description:** Extended user profile with student and parent information

**Fields:**
- `user_id`: UUID (FK to auth.users, CASCADE DELETE)
- `display_name`: varchar
- `student_first_name`: varchar NOT NULL
- `student_last_name`: varchar NOT NULL
- `parent_first_name`: varchar NOT NULL
- `parent_last_name`: varchar NOT NULL
- `school_name`: varchar NOT NULL
- `year_level`: integer (5-10)
- `timezone`: varchar DEFAULT 'Australia/Melbourne'

**Constraints:** UNIQUE(user_id)  
**RLS Policy:** Users can view own data

#### user_progress
**Description:** Auto-tracked progress per product

**Fields:**
- `user_id`: UUID (FK to auth.users, CASCADE DELETE)
- `product_type`: varchar (one of 6 products)
- `total_questions_completed`: integer (auto-updated by trigger)
- `total_questions_attempted`: integer (auto-updated by trigger)
- `total_questions_correct`: integer (auto-updated by trigger)
- `overall_accuracy`: numeric (auto-calculated)
- `total_study_time_seconds`: integer
- `diagnostic_completed`: boolean
- `diagnostic_score`: numeric
- `practice_tests_completed`: integer[]

**Constraints:** UNIQUE(user_id, product_type)  
**Triggers:** update_progress_on_attempt  
**Important:** Never manually update auto-tracked fields

#### user_test_sessions
**Description:** Diagnostic and practice test sessions (NOT drills)

**Fields:**
- `user_id`: UUID (FK to auth.users, CASCADE DELETE)
- `product_type`: varchar
- `test_mode`: 'diagnostic' or 'practice'
- `test_number`: NULL for diagnostic, 1-5 for practice
- `status`: 'active', 'paused', 'completed', 'abandoned'
- `total_questions`: integer
- `questions_answered`: integer
- `correct_answers`: integer
- `final_score`: numeric (0-100)
- `section_scores`: jsonb
- `section_states`: jsonb

**RLS Policy:** Users can manage own test sessions

#### test_section_states
**Description:** Granular section progress for save/resume

**Fields:**
- `test_session_id`: UUID (FK to user_test_sessions, CASCADE DELETE)
- `section_name`: varchar
- `status`: 'not_started', 'in_progress', 'completed'
- `current_question_index`: integer (0-based)
- `time_remaining_seconds`: integer
- `flagged_questions`: integer[]
- `answers`: jsonb {0: 'A', 1: 'C', ...}

**Constraints:** UNIQUE(test_session_id, section_name)

#### drill_sessions
**Description:** Separate from test sessions, no pause/resume

**Fields:**
- `user_id`: UUID (FK to auth.users, CASCADE DELETE)
- `sub_skill_id`: UUID (FK to sub_skills, CASCADE DELETE)
- `product_type`: varchar
- `difficulty`: 1, 2, or 3
- `status`: 'active', 'completed', 'abandoned'
- `questions_total`: integer (usually 10)
- `questions_answered`: integer
- `questions_correct`: integer
- `question_ids`: UUID[]
- `answers_data`: jsonb {question_id: answer}

#### question_attempt_history
**Description:** Universal attempt tracking, triggers progress updates

**Fields:**
- `user_id`: UUID (FK to auth.users, CASCADE DELETE)
- `question_id`: UUID (FK to questions, NO ACTION)
- `session_id`: UUID (test_session OR drill_session)
- `session_type`: 'diagnostic', 'practice', or 'drill'
- `user_answer`: varchar or NULL
- `is_correct`: boolean
- `is_flagged`: boolean
- `is_skipped`: boolean
- `time_spent_seconds`: integer

**Triggers:** update_progress_on_attempt on INSERT

#### user_sub_skill_performance
**Description:** Aggregated performance per skill

**Fields:**
- `user_id`: UUID (FK to auth.users, CASCADE DELETE)
- `sub_skill_id`: UUID (FK to sub_skills, CASCADE DELETE)
- `product_type`: varchar
- `questions_attempted`: integer
- `questions_correct`: integer
- `accuracy_percentage`: numeric

**Constraints:** UNIQUE(user_id, sub_skill_id, product_type)

### Views

#### user_performance_summary
**Description:** Pre-calculated metrics for dashboard

**Fields:**
- user_id
- product_type
- total_questions_completed
- total_questions_attempted
- total_questions_correct
- overall_accuracy
- total_study_time_seconds
- total_study_hours

## Implementation Flows

### Registration

**Step 1:** Create Supabase auth user
```javascript
const { data: authData, error } = await supabase.auth.signUp({ email, password })
```

**Step 2:** Create user profile
**Required Fields:**
- student_first_name
- student_last_name
- parent_first_name
- parent_last_name
- school_name
- year_level

**Note:** display_name = student_first_name + ' ' + student_last_name

**Step 3:** Initialize progress for all 6 products
```javascript
for (const product of products) { 
  await supabase.from('user_progress').insert({ user_id, product_type: product }) 
}
```

### Dashboard

#### Metrics

**Questions Completed:**
- Query: `SELECT total_questions_completed FROM user_progress WHERE user_id = ? AND product_type = ?`
- Note: Auto-maintained by trigger

**Average Score:**
- Query: `SELECT ROUND(AVG(final_score), 0) FROM user_test_sessions WHERE user_id = ? AND product_type = ? AND status = 'completed' AND test_mode IN ('diagnostic', 'practice')`
- Note: Show '-' if no tests completed

**Overall Accuracy:**
- Query: `SELECT overall_accuracy FROM user_progress WHERE user_id = ? AND product_type = ?`
- Note: Auto-calculated percentage

**Study Time:**
- Query: `SELECT ROUND(total_study_time_seconds / 3600.0 * 2) / 2 as study_hours FROM user_progress WHERE user_id = ? AND product_type = ?`
- Note: Display as 'Xh' format

#### Cards

**Diagnostic:**
- Metric: Sections Completed: X/Y
- Button States:
  - No session: "Start Diagnostic"
  - In progress: "Continue Diagnostic"
  - Completed: "View Results"

**Drills:**
- Metric: Sub-Skills Drilled: X/Y
- Button: "Start Drilling"

**Practice Tests:**
- Metric: Tests Completed: X/5
- Button: "Start Practice Tests"

### Diagnostic Test

#### Overview Page
**Displays:**
- All sections with status badges
- Question count and time limits
- Progress visualization

#### Test Session Creation
- Note: Create session only when starting first section
- test_mode: "diagnostic"
- test_number: null

#### Section Flow
- **Start:** Create test_section_state with status='in_progress'
- **Auto-save:** Every 30 seconds + on every action
- **Resume:** Load from test_section_states (current_question_index, answers, flagged_questions, time_remaining)
- **Complete:** Record all attempts, update section status='completed', check if all sections done

### Skill Drills

#### Overview
- **Display:** Expandable sections with sub-skills
- **Progress:** Questions completed per sub-skill
- **Recommendation:** Tag weak areas from diagnostic

#### Difficulty Selection
- **Levels:** 1, 2, 3
- **Shows:** Available questions per difficulty

#### Drill Session
- **Questions:** 10
- **Mode:** Immediate feedback
- **No timer:** true
- **No pause/resume:** true

### Practice Tests

#### Overview
- **Tests:** 5
- **Display:** Status and scores for each test

#### Key Differences
- **test_mode_in_session:** "practice"
- **test_number:** 1-5
- **questions_test_mode:** practice_1, practice_2, etc.

### Performance Insights

#### Tabs

**Overall:**
- **Source:** user_performance_summary view
- **Additional:** Average test performance calculation

**Diagnostic:**
- **Requires:** Completed diagnostic
- **Displays:** Overall score, Average score, Overall accuracy, Section breakdown with Score/Accuracy toggle, Sub-skill performance with proper denominators

**Practice Tests:**
- **Features:** Test selector with dynamic detection, Overall score, Average score, Overall accuracy cards, Section analysis with Score/Accuracy toggle, Sub-skill performance with total available questions as denominators

**Drills:**
- **Displays:** Total questions drilled, Overall accuracy, Sub-skill breakdown with section filtering, Difficulty level performance (Easy/Medium/Hard), Structured layout matching practice test insights

## Critical Implementation Notes

- **Product Types:** Use EXACT strings from product_types array - case sensitive!
- **Progress Tracking:** Never manually update fields managed by update_progress_on_attempt trigger
- **Unique Constraints:** Handle with ON CONFLICT clauses
- **Analytics Denominators:** Score view uses total available questions, Accuracy view uses questions attempted
- **Practice Test Detection:** Use dynamic database queries to detect available practice tests (1-5) instead of hardcoded arrays
- **Sub-skill Totals:** Prevent double-counting by properly tracking questions within sections

### Current Development Focus (Phases 1-4)
- **Question Quality:** Implement validation pipeline to catch mathematical errors and impossible questions
- **Multi-Product Support:** Generate questions for all 6 products using existing scripts and curriculumData.ts
- **Universal Code:** Ensure all frontend/backend logic works across all products without modifications
- **Monetization Ready:** Integrate Stripe via Lovable for subscription-based access to products

### State Management
- **Tests:** Use test_section_states for granular save/resume
- **Drills:** Complete in one session, no pause/resume

### Timer Handling
- **Storage:** time_remaining_seconds in test_section_states
- **Expiry:** Auto-submit and mark unanswered as skipped

### Year Level Recommendations
- **5:** Year 5 NAPLAN
- **6:** EduTest Scholarship (Year 7 Entry)
- **7:** Year 7 NAPLAN
- **8:** NSW Selective Entry (Year 7 Entry)
- **9:** VIC Selective Entry (Year 9 Entry)
- **10:** VIC Selective Entry (Year 9 Entry)

## Key Queries

### Diagnostic Session Check
```sql
SELECT uts.*, json_agg(json_build_object('section_name', tss.section_name, 'status', tss.status, 'time_remaining', tss.time_remaining_seconds)) as section_states 
FROM user_test_sessions uts 
LEFT JOIN test_section_states tss ON tss.test_session_id = uts.id 
WHERE uts.user_id = ? AND uts.product_type = ? AND uts.test_mode = 'diagnostic' 
GROUP BY uts.id
```

### Load Questions
```sql
SELECT q.*, p.title as passage_title, p.content as passage_content 
FROM questions q 
LEFT JOIN passages p ON q.passage_id = p.id 
WHERE q.product_type = ? AND q.test_mode = ? AND q.section_name = ? 
ORDER BY q.question_order
```

### Drill Questions
```sql
SELECT * FROM questions 
WHERE sub_skill_id = ? AND difficulty = ? AND test_mode = 'drill' 
ORDER BY RANDOM() LIMIT 10
```

### Sub-Skill Progress
```sql
SELECT ss.*, ts.section_name, ts.section_order, 
       COALESCE(drill_stats.total_completed, 0) as questions_completed, 
       COALESCE(drill_stats.accuracy, 0) as accuracy 
FROM sub_skills ss 
JOIN test_sections ts ON ss.section_id = ts.id 
LEFT JOIN (
  SELECT sub_skill_id, 
         SUM(questions_answered) as total_completed, 
         ROUND(AVG(questions_correct::numeric / NULLIF(questions_answered, 0) * 100), 0) as accuracy 
  FROM drill_sessions 
  WHERE user_id = ? AND status = 'completed' 
  GROUP BY sub_skill_id
) drill_stats ON drill_stats.sub_skill_id = ss.id 
WHERE ss.product_type = ? 
ORDER BY ts.section_order, ss.name
```

## Question Generation & Validation

### Current Issue
- **Problem:** Mathematics/Quantitative questions sometimes have hallucinations (impossible/incorrect questions)
- **Example:** UUID 03fdec17-26e8-4852-ac24-e2d5031f8015 shows overly complex solution due to generation error
- **Impact:** Affects user experience and test validity

### Validation Pipeline (Phase 1)
- **Step 0:** **Schema Compatibility Check** - Verify generation engine populates all current database fields (max_points, etc.)
- **Step 1:** Generate question using existing engine
- **Step 2:** Automated validation check for mathematical accuracy and logical consistency
- **Step 3:** Auto-regeneration if validation fails
- **Step 4:** Manual review queue for persistent failures
- **Efficiency:** Keep simple and cost-effective, avoid over-complication

### Database Schema Updates Since Last Generation
- **New Fields:** max_points column and potentially other fields added to questions table
- **Requirement:** Generation engine must populate ALL current database fields
- **Risk:** Incomplete data population could break analytics and scoring systems
- **Action:** Comprehensive audit of generation output vs database requirements

### Multi-Product Generation (Phase 2)
- **Existing Infrastructure:** Product-specific prompts and curriculumData.ts already configured
- **Execution:** Run generation scripts (similar to VIC Selective) for remaining 5 products
- **Products:** NSW Selective, Year 5 NAPLAN, Year 7 NAPLAN, EduTest Scholarship, ACER Scholarship

## Error Handling

### Network Failures
- **Strategy:** Queue locally, retry with exponential backoff
- **Critical:** Never lose user answers

### Concurrent Access
- **Detection:** last_updated timestamp
- **Resolution:** Merge answers, warn user

### Data Validation
- **Before Start:** Verify question count matches test_sections.question_count
- **Missing Progress:** Auto-create with zeros
- **Question Validation:** Implement automated checks for question quality and correctness # Force deployment
