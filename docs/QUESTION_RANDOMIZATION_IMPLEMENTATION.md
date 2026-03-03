# Question Randomization Implementation

## Overview

This document describes the implementation of deterministic question randomization for the EduCoach Prep Portal. This feature randomizes question order for practice tests and diagnostics while maintaining consistency across all users and sessions.

## Problem Statement

Previously, questions were loaded in database order, which meant:
- **Sub-skills were grouped together** - students would answer multiple questions of the same sub-skill in a row
- **Not realistic** - real tests mix question types throughout
- **Predictable** - students could memorize question order

## Solution: Seeded Randomization

We implement **deterministic randomization** using a seeded shuffle algorithm:

1. **Generate a seed** based on `(test_type, test_mode, section_name)`
2. **Shuffle question order** using this seed during generation
3. **Store order** in `question_order` column in database
4. **Frontend sorts** by `question_order` when loading questions

### Key Benefits

✅ **Consistent for all users** - Same question is always at position X for everyone
✅ **Persistent across sessions** - Order never changes
✅ **Deterministic** - Same seed always produces same order
✅ **Auditable** - Order stored in database for debugging
✅ **Passage-aware** - Reading sections keep questions grouped by passage

## Architecture

### 1. Seeded Shuffle Utility (`src/utils/seededShuffle.ts`)

Core randomization logic:

```typescript
// Generate seed from test configuration
const seed = generateQuestionOrderSeed(testType, testMode, sectionName);

// Generate shuffled indices
const orderIndices = generateQuestionOrders(questionCount, seed);

// Assign to questions
questions.forEach((question, index) => {
  question.question_order = orderIndices[index];
});
```

**Key Functions:**

- `generateQuestionOrderSeed(testType, testMode, sectionName)` - Creates deterministic seed
- `generateQuestionOrders(count, seed)` - Returns shuffled array of indices
- `shouldRandomizeSection(sectionName)` - Determines if section should be randomized
- `seededShuffle(array, seed)` - Generic Fisher-Yates shuffle with seed

### 2. Generation Integration (`src/engines/questionGeneration/v2/sectionGenerator.ts`)

Randomization happens **after all questions are generated**, before storage:

```typescript
// After question generation (all strategies: balanced, passage-based, hybrid)
if (shouldRandomizeSection(sectionName)) {
  // Non-passage section: randomize
  const seed = generateQuestionOrderSeed(testType, testMode, sectionName);
  const orderIndices = generateQuestionOrders(questions.length, seed);
  questions.forEach((q, i) => q.question_order = orderIndices[i]);
} else {
  // Passage-based section: sequential order
  questions.forEach((q, i) => q.question_order = i);
}
```

### 3. Frontend Loading (`src/services/supabaseQuestionService.ts`)

Questions are **always sorted by question_order**:

```typescript
const { data: questions } = await supabase
  .from('questions_v2')
  .select('*')
  .eq('test_type', testType)
  .eq('test_mode', testMode)
  .order('question_order', { ascending: true, nullsFirst: false });
```

## Sections Affected

### ✅ Randomized Sections (Non-Passage Based)

All test types:
- Language Conventions (NAPLAN)
- Numeracy / Numeracy Calculator / Numeracy No Calculator (NAPLAN)
- Mathematics (all scholarship tests)
- Mathematical Reasoning (NSW Selective)
- Thinking Skills (NSW Selective)
- Verbal Reasoning (EduTest)
- Numerical Reasoning (EduTest)
- General Ability - Verbal (VIC Selective)
- General Ability - Quantitative (VIC Selective)

### ❌ NOT Randomized (Passage-Based)

These sections keep questions grouped by passage:
- **Reading** (all test types)
- **Reading Comprehension** (EduTest, VIC)
- **Reading Reasoning** (VIC)
- **Humanities** (ACER)

### ❌ NOT Randomized (Writing)

Writing sections have only 1-2 prompts, no need to randomize.

## Database Schema

### `questions_v2` Table

```sql
-- Already exists
question_order INTEGER
```

- **NULL** - Not yet assigned (legacy questions)
- **0, 1, 2, ...** - Display order (0 = first question)

### Indexes

Consider adding index for query performance:

```sql
CREATE INDEX IF NOT EXISTS idx_questions_v2_order
ON questions_v2(test_type, test_mode, section_name, question_order);
```

## Implementation Steps

### Phase 1: Backfill Existing Questions ✅

Run once to assign `question_order` to all existing questions:

```bash
npx tsx scripts/backfill-question-order.ts
```

This script:
1. Fetches all questions from `questions_v2`
2. Groups by `(test_type, test_mode, section_name)`
3. Generates randomized order for non-passage sections
4. Generates sequential order for passage-based sections
5. Updates database with `question_order` values

### Phase 2: Update Generation Scripts ✅

Modifications to `sectionGenerator.ts`:
- Import `seededShuffle` utilities
- After question generation, assign `question_order`
- Log randomization details for debugging

### Phase 3: Update Frontend ✅

Modifications to `supabaseQuestionService.ts`:
- Add `.order('question_order', { ascending: true, nullsFirst: false })` to all queries
- Remove any sub-skill grouping logic (except passage sections)

### Phase 4: Testing ✅

Test script verifies:

```bash
npx tsx scripts/test-question-randomization.ts
```

Tests:
1. Seeded shuffle produces consistent results
2. Section type detection (randomize vs sequential)
3. Same section always gets same seed
4. Same seed always produces same order
5. Different sections get different orders
6. Different test modes get different orders
7. Database queries return ordered results

## Example: How It Works

### Generation Time

```
Test: Year 7 NAPLAN
Mode: practice_1
Section: Language Conventions
Questions: 45

Seed: 1234567890 (deterministic)
Original order: Q1, Q2, Q3, ..., Q45
Shuffled order: Q23, Q7, Q41, Q2, Q19, ... (same for everyone)

Database:
  Q23 gets question_order = 0
  Q7 gets question_order = 1
  Q41 gets question_order = 2
  ...
```

### Load Time (Frontend)

```
Query: SELECT * FROM questions_v2
       WHERE test_type = 'Year 7 NAPLAN'
         AND test_mode = 'practice_1'
         AND section_name = 'Language Conventions'
       ORDER BY question_order ASC

Results:
  1. Q23 (order=0)
  2. Q7 (order=1)
  3. Q41 (order=2)
  ...

Every user, every session, sees same order!
```

## Testing Strategy

### Unit Tests

Test the seeded shuffle algorithm:

```bash
npm test -- seededShuffle.test.ts
```

### Integration Tests

Test end-to-end flow:

```bash
npx tsx scripts/test-question-randomization.ts
```

### Manual QA Checklist

- [ ] Generate new practice test - questions are randomized
- [ ] Generate new diagnostic - questions are randomized
- [ ] Reading section - questions grouped by passage
- [ ] Resume session - same order as before
- [ ] Multiple users - see same question at same position
- [ ] Different practice tests (practice_1 vs practice_2) - different orders

## Deployment Checklist

### Pre-Deployment

1. ✅ Run backfill script on staging database
2. ✅ Test with multiple test types and sections
3. ✅ Verify passage-based sections remain ordered
4. ✅ Verify different modes get different orders
5. ✅ Check active user sessions aren't affected

### Deployment

1. Deploy code changes (frontend + generation scripts)
2. Run backfill script on production (if not already done)
3. Monitor logs for any ordering issues
4. Verify with sample user account

### Post-Deployment

1. Generate new practice test - verify randomization
2. Check existing sessions still work
3. Verify question review shows correct order
4. Monitor user feedback

## Rollback Plan

If issues occur:

1. **Frontend only** - Revert frontend changes, questions load in database order
2. **Database** - `question_order` column remains, no data loss
3. **Generation** - New questions get sequential order

**Note:** Existing `question_order` values are harmless if feature is disabled.

## Performance Considerations

### Query Performance

Sorting by `question_order` is efficient:
- Integer column (fast comparison)
- Questions already pre-shuffled (no runtime computation)
- Can add index if needed

### Generation Performance

Minimal impact:
- Shuffling happens once during generation
- Deterministic algorithm (no randomness calls)
- O(n) time complexity (Fisher-Yates)

## Future Enhancements

### Dynamic Re-Randomization

Could add option to regenerate order:

```typescript
// Change seed strategy
const seed = generateQuestionOrderSeed(testType, testMode, sectionName, version);
```

### Per-User Randomization

Could make order unique per user (not recommended for consistency):

```typescript
const seed = generateQuestionOrderSeed(testType, testMode, sectionName, userId);
```

### Adaptive Ordering

Could order by difficulty or performance (requires different approach).

## Troubleshooting

### Questions appear in wrong order

**Check:**
1. Is `question_order` NULL? Run backfill script
2. Is query sorting by `question_order`?
3. Is this a passage-based section? Should be sequential

### Different users see different order

**Check:**
1. Verify seed generation is deterministic
2. Check `question_order` values in database match
3. Ensure no client-side shuffling happening

### Passage questions are mixed up

**Check:**
1. Is section detected as passage-based?
2. Run: `shouldRandomizeSection('Reading')` - should return `false`
3. Verify `question_order` is sequential (0, 1, 2, ...)

## Code Locations

- **Utility**: `src/utils/seededShuffle.ts`
- **Generation**: `src/engines/questionGeneration/v2/sectionGenerator.ts`
- **Frontend**: `src/services/supabaseQuestionService.ts`
- **Backfill**: `scripts/backfill-question-order.ts`
- **Tests**: `scripts/test-question-randomization.ts`

## References

- **Fisher-Yates Shuffle**: https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
- **Linear Congruential Generator**: https://en.wikipedia.org/wiki/Linear_congruential_generator
- **Seeded Random**: Deterministic PRNG for reproducible randomness

---

**Last Updated**: 2026-03-03
**Author**: Claude Code
**Status**: Implementation Complete ✅
