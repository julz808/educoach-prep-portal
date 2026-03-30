# VIC Selective Entry Questions Audit - Methodology & Approach

## Overview

This document outlines the systematic approach used to audit all questions in the VIC Selective Entry (Year 9 Entry) test question bank stored in the Supabase `questions_v2` table.

## Objective

Verify mathematical accuracy and answer correctness for all VIC Selective Entry questions across all sub-skills, with zero tolerance for errors in a production educational product.

## Audit Methodology

### 1. Manual Verification from Scratch

**Core Principle**: Never trust stored answers during initial verification.

For each question:
1. Read the question text independently
2. Perform calculations/analysis from scratch without looking at stored answer
3. Determine the correct answer based on first principles
4. Compare calculated answer with stored answer
5. Flag any discrepancies for detailed analysis

### 2. Sub-Skill Organization

Questions are organized by `sub_skill` field. Common sub-skills include:
- Letter Series & Patterns
- Code & Symbol Substitution
- Pattern Recognition (Figural Reasoning)
- Algebraic Equations
- Number Series
- Applied Word Problems
- Ratios & Proportions
- Fractions, Decimals & Percentages
- Logical Deduction & Conditional Reasoning
- And 30+ more sub-skills

### 3. Batch Size Strategy

**Initial Review**: Review first 30 questions of each sub-skill
- If 0 errors found → Mark sub-skill as verified, move to next
- If errors found → Review ALL questions in that sub-skill

**Rationale**:
- Efficient use of time for clean sub-skills
- Comprehensive coverage for problematic sub-skills
- 10% error rate in sample warrants 100% review

### 4. Question Fetching

Use TypeScript scripts to fetch questions from Supabase:

```typescript
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fetchQuestions(subSkill: string, limit?: number) {
  let query = supabase
    .from('questions_v2')
    .select('*')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
    .eq('sub_skill', subSkill)
    .order('test_mode');

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  // Save to /tmp/ for review
  fs.writeFileSync(`/tmp/${subSkill.toLowerCase().replace(/\s/g, '_')}.txt`,
    formatQuestionsForReview(data));
}
```

### 5. Mathematical Verification

For mathematical questions, use Python scripts for calculation verification:

```python
# Example: Verify fractions calculation
def verify_question(num, description, calc_function, stored_answer):
    result = calc_function()
    print(f"Q{num}: {description}")
    print(f"  Calculated: {result}")
    print(f"  Stored: {stored_answer}")

    if result_matches_option(result, stored_answer):
        print(f"  Status: ✓ CORRECT")
    else:
        print(f"  Status: ✗ ERROR")
        log_error(num, result, stored_answer)
```

### 6. Error Classification

Errors are classified into categories:

1. **Wrong Option Selected**: Calculation correct but wrong letter chosen
2. **Calculation Error**: Mathematical error in deriving answer
3. **Answer Not in Options**: Correct answer doesn't match any provided option
4. **No Valid Solution**: Question may have issue with problem setup
5. **Typo/Formatting**: Question text or options have errors

### 7. Documentation Standards

For each error found, document:

```markdown
## ERROR X: QN - Brief Description

**Question ID**: `uuid-from-database`
**Test Mode**: diagnostic/drill/practice_N
**Stored Answer**: X (value)
**Correct Answer**: Y (value)

### Question Text
[Full question text]

### Mathematical Proof / Analysis
[Detailed step-by-step proof showing correct answer]

### Why Stored Answer is Wrong
[Explain the specific error]

### Fix Required
Update `correct_answer` from 'X' to 'Y'
```

### 8. Fix Script Pattern

Create TypeScript fix scripts for batch updates:

```typescript
const errors = [
  {
    id: 'question-uuid',
    name: 'Q15 - Meteorological Rainfall',
    oldAnswer: 'A',
    newAnswer: 'E',
    reason: 'Actual answer is 67.5mm, not in options A-D'
  },
  // ... more errors
];

async function fixErrors() {
  console.log(`Fixing ${errors.length} errors...`);

  for (const error of errors) {
    const { data, error: updateError } = await supabase
      .from('questions_v2')
      .update({ correct_answer: error.newAnswer })
      .eq('id', error.id);

    if (updateError) {
      console.error(`Error fixing ${error.name}:`, updateError);
    } else {
      console.log(`✓ Fixed ${error.name}: ${error.oldAnswer} → ${error.newAnswer}`);
    }
  }

  // Verify all fixes
  await verifyFixes(errors);
}
```

### 9. Verification After Fixes

Always verify fixes were applied to live database:

```typescript
async function verifyFixes(errors) {
  const errorIds = errors.map(e => e.id);
  const { data } = await supabase
    .from('questions_v2')
    .select('id, question_text, correct_answer')
    .in('id', errorIds);

  for (const error of errors) {
    const question = data.find(q => q.id === error.id);
    if (question.correct_answer === error.newAnswer) {
      console.log(`✓ Verified: ${error.name} = ${error.newAnswer}`);
    } else {
      console.error(`✗ VERIFICATION FAILED: ${error.name}`);
    }
  }
}
```

### 10. Progress Tracking

Maintain master tracking document with:
- Overall summary table (sub-skills reviewed, questions reviewed, errors found)
- Detailed breakdown by sub-skill
- Error rates and patterns
- Files created for each sub-skill
- Links to error documentation

## Quality Standards

### Zero Tolerance for Errors

This is a production educational product. Students and parents trust the accuracy of every question. We maintain:

- **100% verification rate** for questions with errors found
- **Detailed mathematical proofs** for every error identified
- **Live database verification** after every fix
- **Comprehensive documentation** for audit trail

### Systematic Approach

- Never skip steps in verification process
- Never assume stored answer is correct
- Never fix an error without mathematical proof
- Never move to next sub-skill if errors found in current one (complete 100% review)

## Technical Environment

### Database
- **Platform**: Supabase (PostgreSQL)
- **Table**: `questions_v2`
- **Key Fields**:
  - `id` (UUID)
  - `test_type` (e.g., "VIC Selective Entry (Year 9 Entry)")
  - `sub_skill` (e.g., "Fractions, Decimals & Percentages")
  - `test_mode` (diagnostic, drill, practice_1 through practice_5)
  - `question_text`
  - `options` (array)
  - `correct_answer` (single letter or value)

### Scripts Location
- **Primary**: `/Users/julz88/Documents/educoach-prep-portal-2/scripts/`
- **Naming Convention**: `fix-[sub-skill-name].ts` or `fetch-[sub-skill-name].ts`
- **Execution**: `npx tsx scripts/[script-name].ts`

### Documentation Location
- **New Structure**: `/Users/julz88/Documents/educoach-prep-portal-2/questions-audit/vic-selective/`
- **Previous Location**: `/Users/julz88/Documents/educoach-prep-portal-2/docs/04-analysis/`
- **Naming Convention**: `[SUB_SKILL_NAME]_ERRORS.md`

### Temporary Files
- **Location**: `/tmp/`
- **Purpose**: Store fetched questions for review
- **Format**: Plain text with structured format
- **Retention**: Session-based (not committed to git)

## Error Patterns Observed

### High Error Rate Sub-Skills
1. **Letter Series & Patterns**: 52/84 errors (62% error rate)
2. **Code & Symbol Substitution**: 6/18 errors (33% error rate)

### Low/Zero Error Rate Sub-Skills
1. **Number Series**: 0/30 errors
2. **Analogies**: 0/30 errors
3. **Vocabulary**: 0/30 errors
4. **Ratios & Proportions**: 0/30 errors

### Common Error Types
1. Pattern recognition errors in letter series
2. Off-by-one errors in sequences
3. Calculation errors in complex word problems
4. Answer not in provided options (requires "None of these")

## Workflow Summary

```
1. Select next sub-skill from tracking document
2. Fetch first 30 questions → /tmp/
3. Manual verification of each question
4. If errors found:
   a. Fetch ALL questions for sub-skill
   b. Verify 100% of questions
   c. Document all errors with proofs
   d. Create fix script
   e. Execute fixes
   f. Verify fixes in live database
   g. Update tracking document
5. If no errors: Update tracking document, move to next sub-skill
6. Repeat until all sub-skills completed
```

## Notes on Previous Sessions

### Mathematics & Quantitative Section
According to user: "Mathematics and quantitative section for vic selective have already been reviewed and fixed in another session"

This current audit focuses on remaining sections, particularly Verbal Reasoning sub-skills.

## Handoff Protocol

When preparing for new Claude session:
1. Ensure all error documentation is complete
2. Verify all fix scripts are saved and executed
3. Update master tracking document (`PROGRESS.md`)
4. Commit all changes to git
5. Provide summary of current status and next steps
