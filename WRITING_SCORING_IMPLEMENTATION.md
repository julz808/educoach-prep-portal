# Writing Scoring System Implementation Plan

## Overview
Currently, the system treats all questions as worth 1 point, which works for multiple choice but not for writing questions that can be worth 15-50 points based on their rubrics. This implementation will fix the scoring system end-to-end.

## Current Issues
1. Writing questions scored as 1 point instead of actual rubric values (15-50 points)
2. Test totals calculated incorrectly (e.g., showing 2/2 instead of 54/60)
3. Insights and analytics using wrong calculations
4. Progress tracking not accounting for weighted scoring

## Implementation Phases

### Phase 1: Database Schema Updates

#### 1.1 Create Migration for max_points Column
**File:** `supabase/migrations/20240622000000_add_max_points_to_questions.sql`

```sql
-- Add max_points column to questions table
ALTER TABLE questions 
ADD COLUMN max_points INTEGER DEFAULT 1;

-- Add comment for documentation
COMMENT ON COLUMN questions.max_points IS 'Maximum possible points for this question. Default 1 for multiple choice, varies for writing based on rubric.';

-- Create index for performance when filtering by question type
CREATE INDEX idx_questions_max_points ON questions(max_points) WHERE max_points > 1;
```

#### 1.2 Create Data Migration to Populate max_points
**File:** `supabase/migrations/20240622000001_populate_max_points.sql`

```sql
-- Update writing questions with their rubric-based max points
UPDATE questions 
SET max_points = 
  CASE 
    -- NSW Selective Entry (50 points per writing task)
    WHEN product_type = 'NSW Selective Entry (Year 7 Entry)' 
         AND sub_skill IN ('Narrative Writing', 'Persuasive Writing', 'Expository Writing', 'Imaginative Writing') 
    THEN 50
    
    -- VIC Selective Entry (30 points per writing task)
    WHEN product_type = 'VIC Selective Entry (Year 9 Entry)' 
         AND sub_skill IN ('Creative Writing', 'Persuasive Writing')
    THEN 30
    
    -- Year 5 & 7 NAPLAN (48 points per writing task)
    WHEN product_type IN ('Year 5 NAPLAN', 'Year 7 NAPLAN')
         AND sub_skill IN ('Narrative Writing', 'Persuasive Writing')
    THEN 48
    
    -- EduTest Scholarship (15 points per writing task)
    WHEN product_type = 'EduTest Scholarship (Year 7 Entry)'
         AND sub_skill IN ('Narrative Writing', 'Persuasive Writing', 'Expository Writing', 'Creative Writing', 'Descriptive Writing')
    THEN 15
    
    -- ACER Scholarship (20 points per writing task)
    WHEN product_type = 'ACER Scholarship (Year 7 Entry)'
         AND sub_skill IN ('Narrative Writing', 'Persuasive Writing', 'Expository Writing', 'Creative Writing')
    THEN 20
    
    ELSE max_points -- Keep existing value
  END
WHERE sub_skill LIKE '%Writing%' 
   OR topic LIKE '%Writing%' 
   OR topic LIKE '%Written%';

-- Verify the update
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count 
  FROM questions 
  WHERE max_points > 1;
  
  RAISE NOTICE 'Updated % writing questions with max_points > 1', updated_count;
END $$;
```

### Phase 2: Backend Service Updates

#### 2.1 Update Question Types
**File:** `src/types/index.ts` or relevant type file

```typescript
// Add to Question interface
export interface Question {
  id: string;
  text: string;
  options?: string[];
  correctAnswer: number;
  explanation?: string;
  topic: string;
  subSkill: string;
  difficulty: number;
  passageContent?: string;
  format?: 'Multiple Choice' | 'Written Response';
  maxPoints: number; // NEW: Maximum points for this question
  userAnswer?: number;
  userTextAnswer?: string;
  flagged?: boolean;
}
```

#### 2.2 Create Scoring Service
**File:** `src/services/scoringService.ts`

```typescript
import { WritingAssessmentService } from './writingAssessmentService';

export interface QuestionScore {
  questionId: string;
  earnedPoints: number;
  maxPoints: number;
  isCorrect: boolean;
}

export interface TestScore {
  totalEarnedPoints: number;
  totalMaxPoints: number;
  percentageScore: number;
  questionScores: QuestionScore[];
  sectionScores: Record<string, {
    earned: number;
    max: number;
    percentage: number;
  }>;
}

export class ScoringService {
  /**
   * Calculate total test score including writing assessments
   */
  static async calculateTestScore(
    questions: Question[],
    answers: Record<number, number>,
    textAnswers: Record<number, string>,
    sessionId: string
  ): Promise<TestScore> {
    const questionScores: QuestionScore[] = [];
    const sectionScores: Record<string, { earned: number; max: number; percentage: number }> = {};
    
    let totalEarnedPoints = 0;
    let totalMaxPoints = 0;

    // Process each question
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const maxPoints = question.maxPoints || 1;
      let earnedPoints = 0;
      let isCorrect = false;

      if (question.format === 'Written Response') {
        // Get writing assessment score
        const assessment = await WritingAssessmentService.getWritingAssessment(
          question.id,
          sessionId
        );
        
        if (assessment) {
          earnedPoints = assessment.total_score || 0;
          isCorrect = earnedPoints > 0;
        }
      } else {
        // Multiple choice scoring
        if (answers[i] === question.correctAnswer) {
          earnedPoints = maxPoints;
          isCorrect = true;
        }
      }

      // Track scores
      totalEarnedPoints += earnedPoints;
      totalMaxPoints += maxPoints;

      questionScores.push({
        questionId: question.id,
        earnedPoints,
        maxPoints,
        isCorrect
      });

      // Track section scores
      const section = question.topic || 'General';
      if (!sectionScores[section]) {
        sectionScores[section] = { earned: 0, max: 0, percentage: 0 };
      }
      sectionScores[section].earned += earnedPoints;
      sectionScores[section].max += maxPoints;
    }

    // Calculate section percentages
    for (const section in sectionScores) {
      const { earned, max } = sectionScores[section];
      sectionScores[section].percentage = max > 0 ? Math.round((earned / max) * 100) : 0;
    }

    return {
      totalEarnedPoints,
      totalMaxPoints,
      percentageScore: totalMaxPoints > 0 ? Math.round((totalEarnedPoints / totalMaxPoints) * 100) : 0,
      questionScores,
      sectionScores
    };
  }

  /**
   * Get display score for a question (e.g., "24/30" for writing, "1/1" for MC)
   */
  static getQuestionScoreDisplay(questionScore: QuestionScore): string {
    return `${questionScore.earnedPoints}/${questionScore.maxPoints}`;
  }
}
```

#### 2.3 Update SessionService
**File:** `src/services/sessionService.ts`

Add scoring calculation to session completion:

```typescript
// In completeSession method, add:
const testScore = await ScoringService.calculateTestScore(
  questions,
  answers,
  textAnswers,
  sessionId
);

// Store the calculated scores
await supabase
  .from('user_test_sessions')
  .update({
    total_score: testScore.totalEarnedPoints,
    max_possible_score: testScore.totalMaxPoints,
    percentage_score: testScore.percentageScore,
    section_scores: testScore.sectionScores
  })
  .eq('id', sessionId);
```

### Phase 3: Frontend Updates

#### 3.1 Update TestTaking Component
**File:** `src/pages/TestTaking.tsx`

1. Update completed state display:
```typescript
// In the completed state rendering
const testScore = await ScoringService.calculateTestScore(
  session.questions,
  session.answers,
  session.textAnswers,
  session.id
);

// Display:
<div className="text-3xl font-bold text-edu-teal">
  {testScore.totalEarnedPoints}/{testScore.totalMaxPoints}
</div>
<div className="text-3xl font-bold text-edu-coral">
  {testScore.percentageScore}%
</div>
```

2. Update question loading to include maxPoints:
```typescript
// When mapping questions, include maxPoints
questions.map((q, index) => ({
  id: q.id || `question-${index}`,
  text: q.text,
  options: q.options,
  correctAnswer: q.correctAnswer,
  explanation: q.explanation,
  topic: q.topic || 'General',
  subSkill: q.subSkill || 'General',
  difficulty: q.difficulty || 2,
  passageContent: q.passageContent || '',
  format: q.format,
  maxPoints: q.maxPoints || 1 // Include maxPoints
}))
```

#### 3.2 Update EnhancedTestInterface
**File:** `src/components/EnhancedTestInterface.tsx`

Update the review mode sidebar to show correct scores:

```typescript
// In the test results display
const questionScore = await getQuestionScore(question, index);

// For multiple choice:
Answered: {answeredQuestions}
Score: {testScore.totalEarnedPoints}/{testScore.totalMaxPoints}

// For writing questions in review:
<div className="text-sm text-gray-600">
  Score: {writingAssessment.total_score}/{question.maxPoints}
</div>
```

### Phase 4: Analytics Updates

#### 4.1 Update Analytics Service
**File:** `src/services/analyticsService.ts`

Update all score calculations to use max_points:

```typescript
// Instead of:
const totalQuestions = questions.length;
const score = correctAnswers.length;

// Use:
const scores = await ScoringService.calculateTestScore(questions, answers, textAnswers, sessionId);
const totalScore = scores.totalEarnedPoints;
const maxScore = scores.totalMaxPoints;
const percentage = scores.percentageScore;
```

#### 4.2 Update Dashboard Service
**File:** `src/services/dashboardService.ts`

Update aggregation queries to sum actual points:

```typescript
// Update getTestModeMetrics to calculate weighted averages
const averageScore = sessions.reduce((sum, session) => {
  return sum + (session.total_score / session.max_possible_score);
}, 0) / sessions.length * 100;
```

### Phase 5: Database Updates

#### 5.1 Add Columns to Session Tables
**File:** `supabase/migrations/20240622000002_add_scoring_columns.sql`

```sql
-- Add scoring columns to user_test_sessions
ALTER TABLE user_test_sessions
ADD COLUMN total_score INTEGER DEFAULT 0,
ADD COLUMN max_possible_score INTEGER DEFAULT 0,
ADD COLUMN percentage_score DECIMAL(5,2) DEFAULT 0,
ADD COLUMN section_scores JSONB DEFAULT '{}';

-- Add scoring columns to test_section_states
ALTER TABLE test_section_states
ADD COLUMN section_score INTEGER DEFAULT 0,
ADD COLUMN section_max_score INTEGER DEFAULT 0;

-- Update existing sessions (run after code deployment)
-- This will be handled by a separate migration script
```

#### 5.2 Create Score Recalculation Function
**File:** `supabase/migrations/20240622000003_create_recalculate_scores.sql`

```sql
CREATE OR REPLACE FUNCTION recalculate_session_scores(session_id UUID)
RETURNS void AS $$
DECLARE
  total_earned INTEGER := 0;
  total_max INTEGER := 0;
  question_record RECORD;
  writing_score INTEGER;
BEGIN
  -- Calculate scores for all questions in the session
  FOR question_record IN 
    SELECT q.id, q.max_points, q.correct_answer, q.sub_skill,
           s.answers_data, s.question_order
    FROM user_test_sessions s
    JOIN questions q ON q.id = ANY(s.question_order)
    WHERE s.id = session_id
  LOOP
    IF question_record.sub_skill LIKE '%Writing%' THEN
      -- Get writing assessment score
      SELECT total_score INTO writing_score
      FROM writing_assessments
      WHERE session_id = session_id 
        AND question_id = question_record.id
      LIMIT 1;
      
      total_earned := total_earned + COALESCE(writing_score, 0);
    ELSE
      -- Check if multiple choice answer is correct
      -- Implementation depends on answer storage format
      -- Add logic here
    END IF;
    
    total_max := total_max + question_record.max_points;
  END LOOP;
  
  -- Update session with calculated scores
  UPDATE user_test_sessions
  SET total_score = total_earned,
      max_possible_score = total_max,
      percentage_score = CASE 
        WHEN total_max > 0 THEN ROUND((total_earned::DECIMAL / total_max) * 100, 2)
        ELSE 0
      END
  WHERE id = session_id;
END;
$$ LANGUAGE plpgsql;
```

### Phase 6: Testing & Validation

#### 6.1 Create Test Scripts
**File:** `scripts/test-scoring-system.ts`

```typescript
// Test scoring for different scenarios:
// 1. Test with only multiple choice questions
// 2. Test with only writing questions  
// 3. Test with mixed questions
// 4. Test with multiple writing questions
// 5. Verify section scoring
// 6. Verify analytics calculations
```

#### 6.2 Data Validation Queries
```sql
-- Check max_points distribution
SELECT product_type, sub_skill, max_points, COUNT(*)
FROM questions
GROUP BY product_type, sub_skill, max_points
ORDER BY product_type, sub_skill;

-- Verify writing questions have correct max_points
SELECT id, product_type, sub_skill, max_points
FROM questions
WHERE sub_skill LIKE '%Writing%'
  AND max_points = 1; -- Should return 0 rows

-- Check session scores
SELECT id, total_score, max_possible_score, percentage_score
FROM user_test_sessions
WHERE status = 'completed'
ORDER BY updated_at DESC
LIMIT 10;
```

### Phase 7: UI Polish

#### 7.1 Update Score Displays
- Test completion screen: Show "Total Score: 84/130 (65%)"
- Review mode sidebar: Show individual question scores
- Insights: Show weighted averages
- Progress tracking: Use percentage of points, not questions

#### 7.2 Add Visual Indicators
- Color code scores based on percentage
- Show max points for each section
- Display writing scores prominently

### Rollback Plan

If issues arise:
1. Remove max_points from calculations (fall back to count)
2. Revert database migrations in reverse order
3. Deploy previous version of scoring service
4. Recalculate affected session scores

### Success Metrics

1. All writing questions show correct max points (15-50)
2. Test totals match sum of all question max points
3. Analytics show accurate weighted percentages
4. No regression in multiple choice scoring
5. Historical data properly migrated

### Timeline

- Phase 1-2: Database and backend (2 hours)
- Phase 3-4: Frontend updates (2 hours)
- Phase 5: Migration scripts (1 hour)
- Phase 6: Testing (1 hour)
- Phase 7: UI polish (1 hour)

Total: ~7 hours of implementation