# Ready to Regenerate - Summary

## ✅ Completed Steps

### 1. Curriculum Data V2 Updated
- ✅ All `visual_required: true` changed to `visual_required: false`
- ✅ 12 instances updated across 6 files
- ✅ Backups created (*.ts.backup files)

**Files updated:**
- vic-selective.ts (2 changes)
- nsw-selective.ts (3 changes)
- edutest.ts (3 changes)
- acer.ts (4 changes)
- naplan-year5.ts (0 changes)
- naplan-year7.ts (0 changes)

### 2. V2 Engine Prompts Updated
- ✅ Added CRITICAL text-completeness instruction
- ✅ Removed visual_spec from output format
- ✅ Always passes `false` to buildOutputFormat

**File updated:**
- `src/engines/questionGeneration/v2/promptBuilder.ts`

**Key changes:**
- Lines 90-95: Added text-completeness requirements
- Line 113: Changed to `buildOutputFormat(false)`
- Lines 291-299: Simplified output format (no visual_spec)

---

## 🔄 Next Steps

### Step 1: Backup Visual Questions
Run the SQL script to backup all 344 visual questions:

```bash
# Using psql
psql "$DATABASE_URL" < scripts/fix-visual-questions/backup-and-delete-visual-questions.sql

# OR using Supabase CLI
npx supabase db execute < scripts/fix-visual-questions/backup-and-delete-visual-questions.sql
```

**Expected output:**
- Backup table created: `questions_v2_visual_backup`
- 344 questions backed up
- 344 questions deleted from `questions_v2`
- 0 visual questions remaining

### Step 2: Regenerate Questions
Run generation scripts to fill the gaps:

```bash
# VIC Selective (~85 questions)
npm run generate:vic

# NSW Selective (~66 questions)
npm run generate:nsw

# EduTest (~145 questions)
npm run generate:edutest

# ACER (~48 questions)
npm run generate:acer
```

**What will happen:**
- Scripts read updated curriculum data (visual_required = false)
- V2 engine uses updated prompts (text-completeness required)
- Claude generates questions with ALL data in question_text
- Tables in markdown format
- Grid data as text
- All measurements included
- Questions validated automatically
- Stored with has_visual = false

**Cost:** ~$50-70 total (344 questions)
**Time:** 3-4 hours automated

### Step 3: Validation
Spot-check generated questions:

```sql
-- Check some math questions
SELECT
  id,
  test_type,
  section_name,
  question_text
FROM questions_v2
WHERE
  section_name LIKE '%Math%'
  AND created_at > NOW() - INTERVAL '1 hour'
LIMIT 10;

-- Check for markdown tables
SELECT
  id,
  test_type,
  question_text
FROM questions_v2
WHERE
  question_text LIKE '%|%'
  AND created_at > NOW() - INTERVAL '1 hour'
LIMIT 10;
```

---

## 📊 What Changed

### Before:
```typescript
// Curriculum
visual_required: true

// Engine
const visualBlock = subSkillData.visual_required ? buildVisualInstruction(subSkillData) : '';

// Output
{
  "question_text": "...",
  "visual_spec": {
    "type": "table",
    "description": "..."
  }
}
```

### After:
```typescript
// Curriculum
visual_required: false // ALL data must be in question text

// Engine
CRITICAL: This question MUST be answerable from the text alone...
- If table: Include markdown in question_text
- If grid: Include all values as text
- If geometry: Include ALL measurements

// Output
{
  "question_text": "Complete text with ALL data (tables, values, measurements)",
  "answer_options": [...],
  "correct_answer": "B"
}
```

---

## 🔒 Safety & Rollback

### Backups Created:
1. **Curriculum data:**
   - vic-selective.ts.backup
   - nsw-selective.ts.backup
   - edutest.ts.backup
   - acer.ts.backup
   - naplan-year5.ts.backup
   - naplan-year7.ts.backup

2. **Database:**
   - questions_v2_visual_backup table (344 questions)

### Rollback Procedure:
If needed, restore everything:

```bash
# 1. Restore curriculum data
cd src/data/curriculumData_v2
for file in *.backup; do
  mv "$file" "${file%.backup}"
done

# 2. Restore questions
psql "$DATABASE_URL" -c "INSERT INTO questions_v2 SELECT * FROM questions_v2_visual_backup;"

# 3. Revert engine changes
git checkout src/engines/questionGeneration/v2/promptBuilder.ts
```

---

## ✨ Expected Results

### After Regeneration:
- ✅ 344 new questions generated
- ✅ All questions have complete data in text
- ✅ Markdown tables properly formatted
- ✅ Grid data included as text
- ✅ Geometry has all measurements
- ✅ No `has_visual = true` in database
- ✅ Questions answerable from text alone

### Example Questions:

**Table Question:**
```
The table shows test scores for three students:

| Student | Math | English | Science |
|---------|------|---------|---------|
| Alice   | 85   | 92      | 88      |
| Bob     | 78   | 85      | 90      |
| Carol   | 90   | 88      | 85      |

What is the average Math score?
```

**Grid Question:**
```
Study the pattern in the grid below:

Row 1: 2, 4, 6
Row 2: 3, 6, 9
Row 3: 4, 8, ?

What number should replace the question mark?
```

**Geometry Question:**
```
A rectangular garden has a length of 12 meters and a width of 8 meters.
What is the perimeter of the garden?
```

---

## 🎯 Ready to Execute?

**Checklist:**
- [x] Curriculum data v2 updated
- [x] V2 engine prompts updated
- [x] Backup script created
- [ ] Run backup & delete script
- [ ] Run regeneration scripts
- [ ] Validate outputs
- [ ] Celebrate! 🎉

**Next command:**
```bash
# Execute backup and deletion
psql "$DATABASE_URL" < scripts/fix-visual-questions/backup-and-delete-visual-questions.sql
```

Then start regeneration!
