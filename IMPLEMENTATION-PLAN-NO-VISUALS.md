# Implementation Plan - No Visual Questions

## Goal
Remove all visual dependencies from questions. All questions must be answerable from text alone.

---

## Phase 1: Update Curriculum Data V2 ✅

### What We're Doing:
1. Set all `visual_required: true` → `visual_required: false` in all curriculum files
2. Ensure all question examples contain complete information in text
3. Add notes that all data must be in question text

### Files to Update:
- `src/data/curriculumData_v2/vic-selective.ts`
- `src/data/curriculumData_v2/nsw-selective.ts`
- `src/data/curriculumData_v2/edutest.ts`
- `src/data/curriculumData_v2/acer.ts`
- `src/data/curriculumData_v2/naplan-year5.ts`
- `src/data/curriculumData_v2/naplan-year7.ts`

### Script Created:
`scripts/fix-visual-questions/update-curriculum-no-visuals.ts`

### Run:
```bash
npx tsx scripts/fix-visual-questions/update-curriculum-no-visuals.ts
```

---

## Phase 2: Update V2 Engine Prompts

### Changes Needed in `promptBuilder.ts`:

**Line 83:** Remove visual block entirely
```typescript
// OLD:
const visualBlock = subSkillData.visual_required ? buildVisualInstruction(subSkillData) : '';

// NEW:
const visualBlock = ''; // No visuals - all information must be in question text
```

**Line 88-111:** Add text-completeness instruction
```typescript
const prompt = `You are an expert question writer for ${testType}.

Generate ONE ${section} question for the sub-skill: "${subSkill}"
Difficulty: ${difficulty} (${getDifficultyDescriptor(difficulty)})

CRITICAL: This question MUST be answerable from the text alone. NO VISUAL AIDS WILL BE PROVIDED.
- If the question involves a table: Include complete table data in markdown format in question_text
- If the question involves a grid/pattern: Include ALL grid values in question_text (e.g., "Row 1: 2, 4, 6. Row 2: 3, 6, 9...")
- If the question involves geometry: Include ALL measurements and dimensions in question_text
- If the question involves data/numbers: Include ALL necessary data in question_text
- Use clear, complete textual descriptions. The student will NOT see any visual.

DESCRIPTION: ${subSkillData.description}
FORMAT: ${subSkillData.question_format}
...
```

**Line 109:** Update output format (remove visual_spec)
```typescript
// No visual spec in output format
Return ONLY valid JSON, no markdown:
{
  "question_text": "Complete question with ALL necessary data/information",
  "answer_options": ["A) ...", "B) ...", "C) ...", "D) ...", "E) ..."],
  "correct_answer": "B",
  "solution": "• [step 1]\\n• [step 2]\\n• Therefore, the answer is B because [reason]"
}
```

**Lines 271-281:** Update or remove `buildVisualInstruction`
```typescript
// This function should never be called now, but update for safety:
function buildVisualInstruction(subSkillData: any): string {
  return `
ERROR: Visual generation is disabled. All questions must be text-only.
Include ALL information (tables, grids, measurements) directly in question_text.
`;
}
```

**Lines 287-305:** Update `buildOutputFormat`
```typescript
function buildOutputFormat(visualRequired: boolean): string {
  // visualRequired should always be false now
  return `{
  "question_text": "Complete question text with ALL data and information needed to answer",
  "answer_options": ["A) ...", "B) ...", "C) ...", "D) ...", "E) ..."],
  "correct_answer": "B",
  "solution": "• [step 1]\\n• [step 2]\\n• Therefore, the answer is B because [reason]"
}`;
}
```

### Manual Edits Required:
Since these are code changes, I'll need to update the file:

**File:** `src/engines/questionGeneration/v2/promptBuilder.ts`

---

## Phase 3: Backup Existing Visual Questions

### SQL Backup Script:
```sql
-- Create backup table
CREATE TABLE IF NOT EXISTS questions_v2_visual_backup AS
SELECT * FROM questions_v2
WHERE has_visual = true;

-- Verify backup
SELECT
  test_type,
  COUNT(*) as count
FROM questions_v2_visual_backup
GROUP BY test_type
ORDER BY test_type;

-- Expected: 344 total questions
-- EduTest: 145
-- VIC: 85
-- NSW: 66
-- ACER: 48
```

### Export to JSON (optional):
```bash
npx tsx scripts/fix-visual-questions/backup-visual-questions.ts
```

---

## Phase 4: Delete Visual Questions

### SQL Delete Script:
```sql
-- IMPORTANT: Run backup first (Phase 3)!

-- Delete all questions with visuals
DELETE FROM questions_v2
WHERE has_visual = true;

-- Verify deletion
SELECT COUNT(*) FROM questions_v2 WHERE has_visual = true;
-- Should return: 0

-- Check remaining counts
SELECT
  test_type,
  COUNT(*) as remaining_questions
FROM questions_v2
GROUP BY test_type
ORDER BY test_type;
```

### Safety Check:
- Backup exists: ✅
- Can restore if needed: ✅
- Only deleting visual questions: ✅

---

## Phase 5: Regenerate Questions

### Updated Generation Scripts:

All existing scripts will work with updated curriculum data:

```bash
# VIC Selective (need to regenerate ~85 questions)
npm run generate:vic

# NSW Selective (need to regenerate ~66 questions)
npm run generate:nsw

# EduTest (need to regenerate ~145 questions)
npm run generate:edutest

# ACER (need to regenerate ~48 questions)
npm run generate:acer

# NAPLAN Year 5 (if any visual questions exist)
npm run generate:year5

# NAPLAN Year 7 (if any visual questions exist)
npm run generate:year7
```

### What Will Happen:
1. Scripts read updated curriculum data (visual_required = false)
2. V2 engine gets updated prompts (text-completeness required)
3. Claude generates questions with ALL information in text
4. Questions validated automatically
5. Stored in database with has_visual = false

### Monitoring:
Check generation logs for:
- ✅ No visual_spec in generated JSON
- ✅ Questions have complete data in question_text
- ✅ Tables formatted as markdown
- ✅ Grid data included as text
- ✅ Geometry measurements included

---

## Phase 6: Validation

### Automated Checks:
```typescript
// Check all questions can be answered from text
SELECT
  id,
  test_type,
  section_name,
  question_text
FROM questions_v2
WHERE
  has_visual = false
  AND (
    question_text LIKE '%table%' OR
    question_text LIKE '%grid%' OR
    question_text LIKE '%triangle%' OR
    question_text LIKE '%rectangle%'
  )
LIMIT 20;
```

### Manual Spot Checks:
- Review 10 random questions from each test type
- Verify all contain complete information
- Check markdown tables are formatted correctly
- Ensure geometry questions have measurements
- Confirm grid questions have all values

---

## Timeline

| Phase | Duration | Description |
|-------|----------|-------------|
| 1 | 30 minutes | Update curriculum data v2 (automated) |
| 2 | 1-2 hours | Update V2 engine prompts (manual edits) |
| 3 | 15 minutes | Backup visual questions |
| 4 | 5 minutes | Delete visual questions |
| 5 | 3-4 hours | Regenerate all questions (automated) |
| 6 | 2-3 hours | Validation and spot checks |
| **Total** | **1 day** | **Full implementation** |

---

## Cost Estimate

- 344 questions to regenerate
- ~$0.15 per question (Claude Sonnet 4.5 + validation)
- **Total: ~$50-70**

---

## Rollback Plan

If issues found:

1. **Restore from backup:**
```sql
INSERT INTO questions_v2
SELECT * FROM questions_v2_visual_backup;
```

2. **Revert curriculum changes:**
```bash
# Restore from .backup files
cp src/data/curriculumData_v2/vic-selective.ts.backup src/data/curriculumData_v2/vic-selective.ts
# ... repeat for all files
```

3. **Revert engine changes:**
```bash
git checkout src/engines/questionGeneration/v2/promptBuilder.ts
```

---

## Success Criteria

✅ All visual_required set to false in curriculum data
✅ V2 engine prompts updated with text-completeness requirements
✅ 344 visual questions backed up
✅ 344 visual questions deleted
✅ 344 new questions generated with complete text
✅ All questions answerable from text alone
✅ No has_visual = true in database
✅ Markdown tables render properly (requires frontend update separately)

---

## Frontend Updates (Separate Task)

After regeneration complete, update frontend to:
1. Install `react-markdown` + `remark-gfm`
2. Create MarkdownTableRenderer component
3. Detect and render markdown tables in question text
4. Style tables beautifully

This can be done in parallel or after regeneration.

---

## Next Steps

Ready to begin? Here's the order:

1. ✅ Run curriculum update script
2. ✅ Manually update promptBuilder.ts
3. ✅ Backup visual questions
4. ✅ Delete visual questions
5. ✅ Run regeneration scripts
6. ✅ Validate outputs

**Start with Phase 1?**
