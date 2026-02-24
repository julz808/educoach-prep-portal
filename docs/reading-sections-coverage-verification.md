# Reading Sections Coverage Verification

**Date**: February 20, 2026
**Purpose**: Verify duplicate detection fix applies to ALL reading/humanities sections

---

## ✅ Confirmed: All Reading Sections Covered

The duplicate detection fix is **automatically applied** to ALL reading and humanities sections across all test types.

### 🎯 How It Works

The fix uses a **category-based system** that automatically categorizes sections:

**Location**: `src/engines/questionGeneration/v2/validator.ts:387-413`

```typescript
const SECTION_CATEGORIES: Record<string, SectionCategory> = {
  // Reading sections (all map to 'reading' category)
  'Reading':                            'reading',  // ✅ NSW, NAPLAN Y5, NAPLAN Y7
  'Reading Comprehension':              'reading',  // ✅ EduTest
  'Reading Reasoning':                  'reading',  // ✅ VIC Selective
  'Humanities':                         'reading',  // ✅ ACER
};
```

**Key point**: ALL these sections use `category: 'reading'`, which triggers the passage-aware duplicate detection logic.

---

## 📊 All Reading/Humanities Sections by Test Type

### 1. ✅ EduTest Scholarship (Year 7 Entry)
**Section**: Reading Comprehension
- **Category**: `reading` ✅
- **Passage-based**: Yes (7 questions per passage)
- **Fix applied**: YES - passage-aware duplicate detection enabled

---

### 2. ✅ NSW Selective Entry (Year 7 Entry)
**Section**: Reading
- **Category**: `reading` ✅
- **Passage-based**: Yes (5 questions per passage)
- **Fix applied**: YES - passage-aware duplicate detection enabled
- **Note**: This is the section where we discovered the issue

---

### 3. ✅ VIC Selective Entry (Year 9 Entry)
**Section**: Reading Reasoning
- **Category**: `reading` ✅
- **Passage-based**: Yes (5 questions per passage)
- **Fix applied**: YES - passage-aware duplicate detection enabled

---

### 4. ✅ ACER Scholarship (Year 7 Entry)
**Section**: Humanities
- **Category**: `reading` ✅ (mapped on line 408)
- **Passage-based**: Yes (5 questions per passage)
- **Fix applied**: YES - passage-aware duplicate detection enabled

---

### 5. ✅ Year 5 NAPLAN
**Section**: Reading
- **Category**: `reading` ✅
- **Passage-based**: Yes (5-8 questions per passage)
- **Fix applied**: YES - passage-aware duplicate detection enabled

---

### 6. ✅ Year 7 NAPLAN
**Section**: Reading
- **Category**: `reading` ✅
- **Passage-based**: Yes (5-8 questions per passage)
- **Fix applied**: YES - passage-aware duplicate detection enabled

---

## 🔧 Technical Verification

### How the Fix Applies to All Sections

**Step 1**: Section name gets mapped to category
```typescript
// Location: validator.ts:523
const category = getSectionCategory(question.section_name ?? '');

// For all reading/humanities sections, returns: 'reading'
```

**Step 2**: Fast passage-aware check triggers for 'reading' category
```typescript
// Location: validator.ts:529-537
if (category === 'reading' && question.passage_id && recent.passage_id) {
  if (question.passage_id !== recent.passage_id) {
    continue;  // ✅ Different passages = skip duplicate check
  }
}
```

**Step 3**: LLM check includes passage IDs for 'reading' category
```typescript
// Location: validator.ts:660-672
const passageInfo = (category === 'reading' && q.passage_id)
  ? ` [Passage: ${q.passage_id.slice(0, 8)}]`
  : '';
```

**Step 4**: Reading-specific guidance used for 'reading' category
```typescript
// Location: validator.ts:473-496
categoryGuidance['reading']  // ✅ Uses passage-aware duplicate rules
```

---

## ✅ No Additional Changes Needed

**Why?** The fix is **category-based**, not section-specific.

All reading/humanities sections:
1. ✅ Are mapped to `category: 'reading'`
2. ✅ Automatically get passage-aware duplicate detection
3. ✅ Automatically get passage IDs in LLM prompts
4. ✅ Automatically get reading-specific duplicate guidance

---

## 📋 Complete Section Mapping

| Test Type | Section Name | Category | Passage-Based | Fix Applied |
|-----------|--------------|----------|--------------|-------------|
| EduTest Scholarship | Reading Comprehension | `reading` | ✅ Yes (7/passage) | ✅ YES |
| NSW Selective | Reading | `reading` | ✅ Yes (5/passage) | ✅ YES |
| VIC Selective | Reading Reasoning | `reading` | ✅ Yes (5/passage) | ✅ YES |
| ACER Scholarship | Humanities | `reading` | ✅ Yes (5/passage) | ✅ YES |
| Year 5 NAPLAN | Reading | `reading` | ✅ Yes (5-8/passage) | ✅ YES |
| Year 7 NAPLAN | Reading | `reading` | ✅ Yes (5-8/passage) | ✅ YES |

**Total sections covered**: 6/6 ✅

---

## 🧪 Testing Recommendations

To verify the fix works across all test types, you can run:

### Test 1: EduTest Reading Comprehension
```bash
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="EduTest Scholarship (Year 7 Entry)" \
  --section="Reading Comprehension" \
  --modes="practice_1"
```

### Test 2: VIC Reading Reasoning
```bash
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="VIC Selective Entry (Year 9 Entry)" \
  --section="Reading Reasoning" \
  --modes="practice_1"
```

### Test 3: ACER Humanities
```bash
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="ACER Scholarship (Year 7 Entry)" \
  --section="Humanities" \
  --modes="practice_1"
```

### Test 4: Year 5 NAPLAN Reading
```bash
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="Year 5 NAPLAN" \
  --section="Reading" \
  --modes="practice_1"
```

### Test 5: Year 7 NAPLAN Reading
```bash
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="Year 7 NAPLAN" \
  --section="Reading" \
  --modes="practice_1"
```

**Expected results for ALL tests**:
- ✅ Very few duplicate rejections
- ✅ Questions about different passages accepted
- ✅ Multiple vocabulary questions per passage accepted
- ✅ Success rate ~90%+

---

## 💡 Key Insight

The beauty of the category-based system is that:
- ✅ **One fix** applies to **all reading sections**
- ✅ No need to modify each test type individually
- ✅ Future reading sections automatically get the fix
- ✅ Consistent behavior across all passage-based questions

---

## 🎯 Summary

| Question | Answer |
|----------|--------|
| Does the fix apply to EduTest Reading Comprehension? | ✅ YES |
| Does the fix apply to NSW Reading? | ✅ YES |
| Does the fix apply to VIC Reading Reasoning? | ✅ YES |
| Does the fix apply to ACER Humanities? | ✅ YES |
| Does the fix apply to Year 5 NAPLAN Reading? | ✅ YES |
| Does the fix apply to Year 7 NAPLAN Reading? | ✅ YES |
| Do we need additional changes? | ❌ NO |

**All reading/humanities sections across all 6 test types are covered!** ✅

---

*Verified: February 20, 2026*
*Category-based system ensures universal coverage*
