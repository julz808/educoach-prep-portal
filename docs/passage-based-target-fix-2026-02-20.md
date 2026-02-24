# Passage-Based Section Target Fix

**Date**: February 20, 2026
**Issue**: Passage-based sections skipping generation despite having gaps
**Status**: ✅ FIXED

---

## 🐛 Problem Description

### Symptoms
ACER Humanities generation was skipping all modes despite having 25 questions missing:

```bash
📊 practice_1:
   Target: 35 questions
   Existing: 30 questions
   Gaps: 6 questions        # ← Gap detected correctly

# But then...

✅ 30/30 questions already exist for practice_1. Skipping.  # ← WRONG! Comparing to 30 instead of 35
```

**Result**: Script detected gaps but then immediately skipped generation, claiming everything was complete.

---

## 🔍 Root Cause

**Location**: `src/engines/questionGeneration/v2/sectionGenerator.ts:464`

### The Bug

In the `generatePassageBasedSection` function:

```typescript
// Line 464 - BEFORE FIX
const targetQuestionCount = config.total_questions || 30;
```

**Problem**: `config` here refers to `passage_blueprint`, NOT the full section configuration.

### How It Happened

1. **Line 158-161**: Main generation function calls `generatePassageBasedSection`:
   ```typescript
   const result = await generatePassageBasedSection({
     testType,
     sectionName,
     config: section_structure.passage_blueprint!,  // ← Only passing passage blueprint
     difficultyPlan,
     testMode,
     skipStorage
   });
   ```

2. **Line 464**: Function tries to get `total_questions` from config:
   ```typescript
   const targetQuestionCount = config.total_questions || 30;
   ```

3. **Result**: Since `passage_blueprint` doesn't have a `total_questions` property, it defaulted to **30** instead of using the correct value of **35** from the section configuration.

### Impact

**All passage-based sections affected:**
- ACER Humanities (target 35, used 30)
- EduTest Reading Comprehension (target 50, used 30)
- NSW Reading (target 30, used 30) ← accidentally correct
- VIC Reading Reasoning (target 50, used 30)
- Year 5 NAPLAN Reading (target 40, used 30)
- Year 7 NAPLAN Reading (target 50, used 30)

**Severity**: HIGH - Prevented generation of hundreds of questions across multiple test types.

---

## ✅ Solution

### Fix Applied

**Three changes to `sectionGenerator.ts`:**

#### 1. Pass `totalQuestions` as parameter (Line 158-166)

```typescript
// BEFORE
const result = await generatePassageBasedSection({
  testType,
  sectionName,
  config: section_structure.passage_blueprint!,
  difficultyPlan,
  testMode,
  skipStorage
});

// AFTER
const result = await generatePassageBasedSection({
  testType,
  sectionName,
  config: section_structure.passage_blueprint!,
  totalQuestions: sectionConfig.total_questions,  // ✅ ADDED
  difficultyPlan,
  testMode,
  skipStorage
});
```

#### 2. Add parameter to function signature (Line 424-434)

```typescript
// BEFORE
async function generatePassageBasedSection(params: {
  testType: string;
  sectionName: string;
  config: any;
  difficultyPlan: DifficultyDistributionPlan;
  testMode: string;
  skipStorage: boolean;
}): Promise<...> {
  const { testType, sectionName, config, difficultyPlan, testMode, skipStorage } = params;

// AFTER
async function generatePassageBasedSection(params: {
  testType: string;
  sectionName: string;
  config: any;
  totalQuestions: number;  // ✅ ADDED
  difficultyPlan: DifficultyDistributionPlan;
  testMode: string;
  skipStorage: boolean;
}): Promise<...> {
  const { testType, sectionName, config, totalQuestions, difficultyPlan, testMode, skipStorage } = params;
  //                                      ^^^^^^^^^^^^^ ADDED
```

#### 3. Use parameter instead of config (Line 464-471)

```typescript
// BEFORE
const existingQuestionCount = await getExistingQuestionCount(testType, sectionName, testMode);
const targetQuestionCount = config.total_questions || 30;  // ❌ WRONG

if (existingQuestionCount >= targetQuestionCount) {
  console.log(`   ✅ ${existingQuestionCount}/${targetQuestionCount} questions already exist...`);
  return { questions: [], passages: [], totalCost: 0, subSkillStats: {} };
}

// AFTER
const existingQuestionCount = await getExistingQuestionCount(testType, sectionName, testMode);
const targetQuestionCount = totalQuestions;  // ✅ CORRECT - uses parameter

if (existingQuestionCount >= targetQuestionCount) {
  console.log(`   ✅ ${existingQuestionCount}/${targetQuestionCount} questions already exist...`);
  return { questions: [], passages: [], totalCost: 0, subSkillStats: {} };
}
```

---

## 🎯 Expected Impact

### Before Fix

```bash
📊 practice_1:
   Target: 35 questions
   Existing: 30 questions
   Gaps: 6 questions

# Generation phase:
✅ 30/30 questions already exist for practice_1. Skipping.  # ❌ WRONG

Result: 0 questions generated, gaps remain
```

### After Fix

```bash
📊 practice_1:
   Target: 35 questions
   Existing: 30 questions
   Gaps: 6 questions

# Generation phase:
📝 Generating questions from existing passages for practice_1...
   Target: 35 questions, Existing: 30, Needed: 5  # ✅ CORRECT

Result: 5 questions generated, gaps filled
```

---

## 📊 Questions Unblocked

| Test Type | Section | Target | Was Using | Affected |
|-----------|---------|--------|-----------|----------|
| ACER Scholarship | Humanities | 35 | 30 | ✅ Yes |
| EduTest Scholarship | Reading Comprehension | 50 | 30 | ✅ Yes |
| NSW Selective | Reading | 30 | 30 | ❌ No (lucky match) |
| VIC Selective | Reading Reasoning | 50 | 30 | ✅ Yes |
| Year 5 NAPLAN | Reading | 40 | 30 | ✅ Yes |
| Year 7 NAPLAN | Reading | 50 | 30 | ✅ Yes |

**Total passage-based sections fixed**: 5/6

---

## 🧪 Testing & Verification

### Test the Fix

```bash
# Should now generate the missing 25 questions for ACER Humanities
./scripts/generation/generate-all-acer-scholarship.sh
```

### Expected Output

```bash
📝 MODE 1/6: practice_1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Target: 35 questions
   Existing: 30 questions
   Gaps to fill: 6 questions  # ← Gap detected

   ✅ All passages already exist!

   📝 Generating questions from existing passages for practice_1...
   Target: 35 questions, Existing: 30, Needed: 5  # ← CORRECT target!

   Generating 5 questions...
   [Generation proceeds]
```

### Verification Commands

```bash
# Check ACER Humanities counts after fix
npx tsx --env-file=.env scripts/debug/check-acer-humanities.ts

# Should show all modes at 35/35
```

---

## 🔧 Files Modified

| File | Lines Changed | Description |
|------|--------------|-------------|
| `sectionGenerator.ts` | 158-166 | Added `totalQuestions` parameter to function call |
| `sectionGenerator.ts` | 424-434 | Added `totalQuestions` to function signature |
| `sectionGenerator.ts` | 464-471 | Use `totalQuestions` parameter instead of config |

**Total changes**: 3 modifications, ~6 lines
**Impact**: Unblocks generation for all passage-based sections

---

## 💡 Key Takeaway

**The Problem**: Function received `passage_blueprint` as `config`, which doesn't contain `total_questions`

**The Solution**: Pass `total_questions` explicitly as a separate parameter

**The Lesson**: When refactoring config objects, ensure all necessary properties are accessible or passed explicitly

---

## ✅ Checklist

- [x] Identified root cause (wrong config reference)
- [x] Implemented fix (added totalQuestions parameter)
- [x] Documented the issue and solution
- [ ] Test ACER Humanities generation
- [ ] Verify other passage-based sections generate correctly
- [ ] Run full gap analysis to confirm completion

---

*Fix implemented: February 20, 2026*
*Status: Ready for testing*
*Priority: HIGH - Unblocks 200+ question generation*
