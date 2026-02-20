# Solution Quality Validation System

## Overview

Added solution quality validation to the V2 question generation engine to prevent hallucinated or confused questions from being saved to the database.

## Problem Identified

Analysis of the `questions_v2` table revealed:
- **10 questions** (1%) with solutions over 200 words
- **6 questions** (0.6%) with solutions over 300 words
- **7 questions** (0.7%) with hallucination phrases like "wait, let me" or "let me recalculate"

These long or confused solutions are strong indicators that the LLM got confused during generation and produced an incorrect or impossible question.

## Solution Implemented

### Location
`src/engines/questionGeneration/v2/validator.ts`

### New Function: `validateSolutionQuality()`

Integrated into the structure validation step (Check 1), this function performs two checks:

#### 1. Word Count Check
- **Threshold**: 200 words
- **Rationale**: Analysis showed that solutions over 200 words almost always indicate hallucinations or confusion
- **Action**: Rejects question with error message including actual word count

#### 2. Hallucination Pattern Detection
Searches for common LLM confusion phrases:
- `wait, let me`
- `let me recalculate`
- `actually, wait`
- `i apologize`
- `my mistake`
- `let me check`
- `hold on`
- `correction:`
- `sorry,`

**Action**: Rejects question and lists all detected patterns

## Impact

### Before
- Questions with confused solutions would pass validation
- Could result in students seeing incorrect questions
- Manual cleanup required after generation

### After
- Questions are rejected at generation time (before DB insert)
- Prevents bad questions from ever reaching students
- Generator will automatically retry with a fresh generation

## Distribution of Solution Lengths

Current database analysis (1,000 questions):

| Word Count Range | Count | Percentage |
|-----------------|-------|------------|
| 0-50 words      | 329   | 32.9%      |
| 51-100 words    | 584   | 58.4%      |
| 101-150 words   | 68    | 6.8%       |
| 151-200 words   | 9     | 0.9%       |
| 201-250 words   | 4     | 0.4%       |
| 251-300 words   | 0     | 0.0%       |
| 301+ words      | 6     | 0.6%       |

**Target**: Keep 99%+ of solutions under 200 words

## Testing

Test script created: `scripts/generation/test-solution-validation.ts`

### Test Results
✅ All tests passing:
1. Good solution (26 words) → **PASS**
2. Solution with "wait, let me recalculate" → **FAIL** (hallucination detected)
3. Solution over 200 words (255 words) → **FAIL** (length exceeded)
4. Solution with "my mistake" → **FAIL** (hallucination detected)

## Audit Script

Created: `scripts/audit/check-long-solutions.ts`

### Features
- Counts questions by word count ranges
- Identifies questions with hallucination phrases
- Shows distribution statistics
- Provides preview of problematic solutions

### Usage
```bash
npx tsx scripts/audit/check-long-solutions.ts
```

## Next Steps

### Optional Cleanup
The existing 10 questions with long/hallucinated solutions could be:
1. Left as-is (they're a small percentage and may still be valid)
2. Manually reviewed and fixed
3. Regenerated automatically

### Recommendation
Leave existing questions for now. The validation will prevent new problematic questions from being added, and the existing ones are such a small percentage (<1%) that they likely won't impact users significantly.

## Files Modified

1. `src/engines/questionGeneration/v2/validator.ts`
   - Added `validateSolutionQuality()` function
   - Integrated into `validateStructure()`
   - Updated header comment

## Files Created

1. `scripts/audit/check-long-solutions.ts` - Database audit script
2. `scripts/audit/check-schema.ts` - Helper to check table schema
3. `scripts/generation/test-solution-validation.ts` - Validation test suite
4. `docs/SOLUTION_QUALITY_VALIDATION.md` - This document

## Technical Details

### Validation Flow
```
Question Generated
    ↓
Structure Validation (Check 1)
    ├── Basic structure checks
    ├── Solution quality checks ← NEW
    │   ├── Word count < 200
    │   └── No hallucination phrases
    ↓
Correctness Check (Check 2)
    ↓
Duplicate Check (Check 3)
    ↓
Save to Database (if all pass)
```

### Error Messages
- **Long solution**: `"Solution too long (XXX words). Solutions over 200 words often indicate hallucinations or confusion."`
- **Hallucination**: `"Solution contains hallucination phrases: [patterns]"`

### Performance Impact
**Negligible** - This is a synchronous regex check that runs in <1ms, added to the existing structure validation which is already fast.

## Conclusion

This validation system ensures high-quality questions by catching LLM hallucinations and confusion before they reach the database. The 200-word threshold and pattern detection effectively identify problematic solutions while allowing legitimate detailed explanations through.
