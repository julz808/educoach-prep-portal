# Gap Analysis Summary - Practice & Diagnostic Tests

**Date**: February 20, 2026
**Overall Completion**: 99.3% (5,458 / 5,499 questions)
**Questions Needed**: 41

---

## 📊 Summary by Test Type

| Test | Completion | Gaps | Status |
|------|-----------|------|--------|
| **ACER Scholarship** | 434/436 | 2 | ⚠️ Nearly Complete |
| **EduTest Scholarship** | 1,332/1,332 | 0 | ✅ Complete |
| **NSW Selective Entry** | 640/640 | 0 | ✅ Complete |
| **VIC Selective Entry** | 1,296/1,335 | 39 | ⚠️ Gaps in 3 sections |
| **Year 5 NAPLAN** | 787/787 | 0 | ✅ Complete |
| **Year 7 NAPLAN** | 969/969 | 0 | ✅ Complete |

---

## ⚠️ Sections with Gaps

### 1. ACER Scholarship (Year 7 Entry) - Humanities
**Gap**: 2 questions
**Section Total**: 434/436

**By Mode**:
- ✅ practice_1: 35/35 (complete)
- ⚠️ **practice_2: 33/35 (need 2)**
- ✅ practice_3: 35/35 (complete)
- ✅ practice_4: 35/35 (complete)
- ✅ practice_5: 35/35 (complete)
- ✅ diagnostic: 35/35 (complete)

**Generation Command**:
```bash
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="ACER Scholarship (Year 7 Entry)" \
  --section="Humanities" \
  --modes="practice_2"
```

---

### 2. VIC Selective Entry (Year 9 Entry) - Reading Reasoning
**Gap**: 29 questions
**Section Total**: 271/300

**By Mode**:
- ⚠️ **practice_1: 45/50 (need 5)**
- ⚠️ **practice_2: 45/50 (need 5)**
- ⚠️ **practice_3: 45/50 (need 5)**
- ⚠️ **practice_4: 45/50 (need 5)**
- ⚠️ **practice_5: 46/50 (need 4)**
- ⚠️ **diagnostic: 45/50 (need 5)**

**Generation Command**:
```bash
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="VIC Selective Entry (Year 9 Entry)" \
  --section="Reading Reasoning" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"
```

---

### 3. VIC Selective Entry (Year 9 Entry) - Mathematics Reasoning
**Gap**: 3 questions
**Section Total**: 357/360

**By Mode**:
- ✅ practice_1: 60/60 (complete)
- ✅ practice_2: 60/60 (complete)
- ✅ practice_3: 60/60 (complete)
- ✅ practice_4: 60/60 (complete)
- ⚠️ **practice_5: 59/60 (need 1)**
- ⚠️ **diagnostic: 58/60 (need 2)**

**Generation Command**:
```bash
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="VIC Selective Entry (Year 9 Entry)" \
  --section="Mathematics Reasoning" \
  --modes="practice_5,diagnostic"
```

---

### 4. VIC Selective Entry (Year 9 Entry) - General Ability - Verbal
**Gap**: 7 questions
**Section Total**: 353/360

**By Mode**:
- ✅ practice_1: 60/60 (complete)
- ⚠️ **practice_2: 59/60 (need 1)**
- ⚠️ **practice_3: 58/60 (need 2)**
- ⚠️ **practice_4: 58/60 (need 2)**
- ✅ practice_5: 60/60 (complete)
- ⚠️ **diagnostic: 58/60 (need 2)**

**Generation Command**:
```bash
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="VIC Selective Entry (Year 9 Entry)" \
  --section="General Ability - Verbal" \
  --modes="practice_2,practice_3,practice_4,diagnostic"
```

---

## ✅ Complete Tests (No Gaps)

### EduTest Scholarship (Year 7 Entry) - 100% Complete
- ✅ Verbal Reasoning: 360/360
- ✅ Numerical Reasoning: 300/300
- ✅ Mathematics: 360/360
- ✅ Reading Comprehension: 300/300
- ✅ Written Expression: 12/12

### NSW Selective Entry (Year 7 Entry) - 100% Complete
- ✅ Reading: 180/180
- ✅ Mathematical Reasoning: 210/210
- ✅ Thinking Skills: 240/240
- ✅ Writing: 10/6 (over-generated)

### Year 5 NAPLAN - 100% Complete
- ✅ Reading: 240/240
- ✅ Language Conventions: 240/240
- ✅ Numeracy: 300/300
- ✅ Writing: 7/6 (over-generated)

### Year 7 NAPLAN - 100% Complete
- ✅ Reading: 300/300
- ✅ Language Conventions: 270/270
- ✅ Numeracy No Calculator: 180/180
- ✅ Numeracy Calculator: 210/210
- ✅ Writing: 9/6 (over-generated)

---

## 🎯 Priority Order

Based on gap size and impact:

### High Priority (20+ questions)
1. **VIC Reading Reasoning**: 29 questions needed
   - All 6 modes have gaps
   - Largest remaining gap in the system

### Medium Priority (5-10 questions)
2. **VIC General Ability - Verbal**: 7 questions needed
   - 4 modes with gaps

### Low Priority (< 5 questions)
3. **VIC Mathematics Reasoning**: 3 questions needed
   - Only 2 modes with gaps
4. **ACER Humanities**: 2 questions needed
   - Only 1 mode with gap

---

## 📋 Quick Generation Script

To complete all remaining questions:

```bash
# 1. ACER Humanities (2 questions)
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="ACER Scholarship (Year 7 Entry)" \
  --section="Humanities" \
  --modes="practice_2"

# 2. VIC Reading Reasoning (29 questions)
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="VIC Selective Entry (Year 9 Entry)" \
  --section="Reading Reasoning" \
  --modes="practice_1,practice_2,practice_3,practice_4,practice_5,diagnostic"

# 3. VIC Mathematics Reasoning (3 questions)
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="VIC Selective Entry (Year 9 Entry)" \
  --section="Mathematics Reasoning" \
  --modes="practice_5,diagnostic"

# 4. VIC General Ability - Verbal (7 questions)
npx tsx --env-file=.env scripts/generation/generate-section-all-modes.ts \
  --test="VIC Selective Entry (Year 9 Entry)" \
  --section="General Ability - Verbal" \
  --modes="practice_2,practice_3,practice_4,diagnostic"
```

**Total Time Estimate**: ~15-20 minutes
**Total Cost Estimate**: ~$0.50 - $1.00

---

## 📊 Passage Coverage

All passage-based sections have passages generated:

| Section | Passages |
|---------|----------|
| ACER Humanities | 45 |
| EduTest Reading Comprehension | 6 |
| NSW Selective Reading | 85 |
| VIC Reading Reasoning | 90 |
| Year 5 NAPLAN Reading | 30 |
| Year 7 NAPLAN Reading | 42 |
| **TOTAL** | **298 passages** |

---

## 🎉 Achievement Summary

- **4 out of 6 tests**: 100% complete ✅
- **Overall**: 99.3% complete
- **Only 41 questions** away from 100% completion
- **All passages generated** for reading sections

---

## 🚀 Next Steps

1. **Generate remaining 41 questions** (use commands above)
2. **Verify 100% completion** with gap analysis
3. **Generate drills** for all sections
4. **Production ready!** 🎉

---

*Analysis run: February 20, 2026*
*Based on live data from questions_v2 and passages_v2 tables*
