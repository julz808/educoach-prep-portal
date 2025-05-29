# VIC Selective Entry Question Generation

## Overview
This document outlines the setup for generating VIC Selective Entry test questions using the `questionGenerationEngine`.

## Requested Questions
- **2 Written Expression Questions:**
  - 1 Analytical Writing prompt
  - 1 Creative Writing prompt
- **4 Mathematical Reasoning Questions:**
  - Sub-skill: Spatial Problem Solving

All questions should be saved to Supabase with `test_mode = 'practice_1'`.

## Implementation Details

### Question Types Generated
1. **Written Expression Questions:**
   - `response_type`: `'extended_response'`
   - `answer_options`: `null`
   - `correct_answer`: `null`
   - `solution`: `null`
   - `question_text`: Contains the full writing prompt

2. **Mathematical Reasoning Questions:**
   - `response_type`: `'multiple_choice'`
   - `answer_options`: Array of 4 choices
   - `correct_answer`: Letter (A, B, C, or D)
   - `solution`: Explanation of correct answer
   - `question_text`: Contains the question

### Test Configuration
- **Test Type:** `'VIC Selective Entry'`
- **Year Level:** `'Year 9'` (typical for VIC selective entry)
- **Difficulty:** `3` (High difficulty appropriate for selective entry)
- **Test Mode:** `'practice_1'`

### Current API Status
The Claude API is currently experiencing high load (529 errors), which is preventing question generation. This is a temporary service issue.

## Alternative Generation Approaches

### Option 1: Manual Generation (Immediate)
Run individual question generation commands with longer delays:

```bash
# Generate one question at a time with 5-minute delays
npx tsx -e "
import { generateStandaloneQuestions, saveGeneratedQuestions } from './src/engines/question-generation/questionGenerationEngine.ts';

async function generateSingle() {
  try {
    const result = await generateStandaloneQuestions(
      'VIC Selective Entry',
      'Year 9',
      'Written Expression', 
      'Analytical Writing',
      3,
      1
    );
    
    const saved = await saveGeneratedQuestions(result, undefined, 'practice_1');
    console.log('✅ Generated and saved:', saved.questionIds[0]);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

generateSingle();
"
```

### Option 2: Batch Processing with Extended Delays
Modify the script to use 10-minute delays between each API call to avoid overload.

### Option 3: Queue-Based Generation
Implement a queue system that retries every hour until successful.

## Generated Questions Structure

### Database Schema
Questions will be stored in the `questions` table with these key fields:

```sql
INSERT INTO questions (
  question_text,
  answer_options,
  correct_answer,
  solution,
  response_type,
  test_type,
  year_level,
  section_name,
  sub_skill,
  difficulty,
  test_mode,
  has_visual,
  created_at
) VALUES (
  -- Writing questions will have null for answer_options, correct_answer, solution
  -- Math questions will have array for answer_options, letter for correct_answer
);
```

### Expected Outputs

#### Analytical Writing Question
```json
{
  "questionText": "Analytical writing prompt about current issues...",
  "options": null,
  "correctAnswer": null,
  "explanation": "Strong responses should include clear thesis, evidence...",
  "response_type": "extended_response"
}
```

#### Creative Writing Question  
```json
{
  "questionText": "Creative writing prompt with imaginative scenario...",
  "options": null,
  "correctAnswer": null,
  "explanation": "Effective creative writing should demonstrate...",
  "response_type": "extended_response"
}
```

#### Mathematical Reasoning Question
```json
{
  "questionText": "Spatial problem involving 3D visualization...",
  "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
  "correctAnswer": "B",
  "explanation": "The correct answer is B because...",
  "response_type": "multiple_choice"
}
```

## Next Steps

1. **Wait for API Recovery:** Monitor Claude API status and retry when 529 errors resolve
2. **Manual Generation:** Use individual commands for immediate generation
3. **Validate Questions:** Review generated questions for quality and alignment with VIC selective entry standards
4. **Test Integration:** Ensure questions display correctly in the application

## Files Created
- `generate-vic-selective-questions.ts` - Main generation script with retry logic
- This README file for documentation

The generation script is ready and will work once the API load issues are resolved. 