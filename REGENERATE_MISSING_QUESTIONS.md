# Regenerate Missing Questions - Quick Guide

## Overview
7 questions were deleted due to format issues and need to be regenerated. The generation engine has been fixed to prevent this from happening again.

---

## Questions That Need Regeneration

### ACER Scholarship - Humanities (5 questions)
| Sub-Skill | Test Mode | Count |
|-----------|-----------|-------|
| Vocabulary in Context | practice_4 | 1 |
| Analysis & Comparison | practice_4 | 3 |
| Literal Comprehension | drill | 1 |

**Passage IDs needed**:
- `63f2b4e4-1cdd-43f4-9d4c-7284ca9f338d` (Vocabulary in Context)
- `84295f91-6d28-440f-bfaa-1dffb819a011` (Analysis & Comparison)
- `17a2a6ac-4f74-4462-bba0-c614e96a64b6` (Analysis & Comparison)
- `43c7cf5a-8079-4736-b642-2f12cd123c28` (Analysis & Comparison)
- `750a384b-5b18-4ddb-93b8-a2d73d8b1018` (Literal Comprehension)

### Year 5 NAPLAN - Reading (1 question)
| Sub-Skill | Test Mode | Count |
|-----------|-----------|-------|
| Literal Comprehension | practice_1 | 1 |

**Passage ID needed**:
- `e74bdd86-3b28-4646-adf3-5143dd8be18b`

### Year 7 NAPLAN - Reading (1 question)
| Sub-Skill | Test Mode | Count |
|-----------|-----------|-------|
| Evaluating Arguments & Evidence | drill | 1 |

**Passage ID needed**:
- `19d04d64-d8a9-4ae8-993c-6c5ba836c0d2`

---

## Option 1: Automatic Regeneration (Recommended)

The easiest way is to run the full generation commands. The engine will automatically detect gaps and fill them:

### For ACER Humanities
```bash
npx tsx scripts/generate-all-acer-humanities.ts
```

### For Year 5 NAPLAN Reading
```bash
npx tsx scripts/generate-year5-naplan-reading.ts
```

### For Year 7 NAPLAN Reading
```bash
npx tsx scripts/generate-year7-naplan-reading.ts
```

The generation engine will:
1. Detect that questions are missing for these sub-skills
2. Generate exactly the right number of questions needed
3. Use the correct passages and difficulty levels
4. Validate that answer_options are present (new fix!)

---

## Option 2: Manual Regeneration (If you want precise control)

If you want to regenerate specific questions manually, use the v2 generator directly:

### Example: ACER Humanities - Vocabulary in Context
```bash
npx tsx scripts/manual-generate-question.ts \
  --testType "ACER Scholarship (Year 7 Entry)" \
  --section "Humanities" \
  --subSkill "Vocabulary in Context" \
  --passageId "63f2b4e4-1cdd-43f4-9d4c-7284ca9f338d" \
  --difficulty 1 \
  --testMode "practice_4"
```

Repeat for each of the 7 missing questions with their respective passage IDs.

---

## Verification After Regeneration

After running the generation commands, verify that all questions were created:

```bash
npx tsx scripts/verify-question-counts.ts
```

This will check that:
- All 7 questions have been regenerated
- They all have `answer_options` arrays
- They all have `response_type: "multiple_choice"`
- No questions are showing free text fields

---

## What's Different Now?

The fixed generation engine will:

1. **Validate answer_options**: Non-writing questions MUST have 4-5 answer options
2. **Fail and retry**: If Claude doesn't include options, the generation attempt fails and retries
3. **Clean letter prefixes**: Automatically strips "A)", "B)", etc. from option text
4. **Clear error messages**: Shows exactly what went wrong if validation fails

**Result**: No more incomplete questions!

---

## Expected Generation Time

- **ACER Humanities (5 questions)**: ~2-3 minutes
- **Year 5 NAPLAN Reading (1 question)**: ~30 seconds
- **Year 7 NAPLAN Reading (1 question)**: ~30 seconds

**Total**: ~3-4 minutes for all 7 questions

---

## Troubleshooting

### If generation fails:
1. Check the error message - it will tell you exactly what's wrong
2. Common issues:
   - Missing passage: Check passage_id exists in passages_v2 table
   - Invalid difficulty: Must be 1, 2, or 3
   - Rate limit: Wait 60 seconds and try again

### If questions still show free text:
1. Verify the question has `answer_options` in the database:
   ```bash
   npx tsx scripts/check-question-format.ts <question_id>
   ```
2. If `answer_options` is null, the question wasn't generated with the fix - regenerate it

### If you see letter prefixes in options:
This shouldn't happen anymore, but if it does:
1. The automatic cleanup should handle it
2. If not, run:
   ```bash
   npx tsx scripts/clean-letter-prefixes.ts
   ```

---

## Success Criteria

After regeneration, you should have:
- ✅ 8,888 total questions in questions_v2
- ✅ 0 questions with embedded options in text
- ✅ 0 non-writing questions without answer_options
- ✅ All multiple choice questions showing option buttons
- ✅ All answer options without letter prefixes

You can verify this with:
```bash
npx tsx scripts/audit-question-format-issues.ts
```

Expected output:
```
Questions with embedded options in text: 0
Non-writing questions without answer options: 0
Total problematic questions: 0
```

---

## Ready to Regenerate!

Just run the commands in Option 1 above and you're done. The engine will handle everything automatically with the new fixes in place.
