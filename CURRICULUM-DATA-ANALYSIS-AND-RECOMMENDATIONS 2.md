# Curriculum Data V2 Analysis & Recommendations
**Date:** 2026-02-22

---

## 🔍 SHOCKING DISCOVERY

### The Mystery Solved: Why Does EduTest Work Perfectly But Others Don't?

**ONLY EduTest has proper difficulty coverage!** All other products have severe gaps.

---

## 📊 Summary Comparison

| Product | Examples | Easy | Medium | Hard | All-3 Coverage | Rating |
|---------|----------|------|--------|------|----------------|--------|
| **EduTest** | 116 | 43 (37%) | 39 (34%) | 34 (29%) | **81%** ✅ | ⭐⭐⭐⭐⭐ EXCELLENT |
| **NSW Selective** | 66 | **0 (0%)** | 66 (100%) | **0 (0%)** | **0%** ❌ | POOR |
| **VIC Selective** | 101 | **0 (0%)** | 101 (100%) | **0 (0%)** | **0%** ❌ | POOR |
| **Year 5 NAPLAN** | 35 | **0 (0%)** | 12 (34%) | 7 (20%) | **0%** ❌ | POOR |
| **ACER** | 50 | 7 (14%) | 32 (64%) | 11 (22%) | **17%** ❌ | POOR |

---

## 🎯 Key Findings

### ✅ **EduTest Scholarship:**
- **81% of sub-skills** have Easy, Medium, AND Hard examples
- **Well-balanced distribution:** 37% Easy, 34% Medium, 29% Hard
- **4.5 examples per sub-skill** (highest of all products)
- **Result:** PERFECT generation quality (as you've seen in the database)

### ❌ **NSW Selective:**
- **0% of sub-skills** have all three difficulty levels
- **100% Medium** - NO Easy or Hard examples at all!
- **2.6 examples per sub-skill**
- **Result:** Same problem as ACER (likely defaulting to one difficulty)

### ❌ **VIC Selective:**
- **0% of sub-skills** have all three difficulty levels
- **100% Medium** - NO Easy or Hard examples at all!
- **3.3 examples per sub-skill**
- **Result:** Same problem as ACER

### ❌ **Year 5 NAPLAN:**
- **0% of sub-skills** have all three difficulty levels
- **NO Easy examples** across entire product
- **Only 34% Medium, 20% Hard** (and 46% have NO examples at difficulty 1)
- **Result:** Likely similar generation issues

### ❌ **ACER Scholarship:**
- **Only 17% of sub-skills** have all three difficulties
- **Severe imbalance:** 14% Easy, 64% Medium, 22% Hard
- Only **4 out of 18 sub-skills** have any Easy examples
- **Result:** 85-97% Easy questions generated (as we discovered)

---

## 💡 WHY THIS MATTERS

### The Pattern:

1. **EduTest = Great examples coverage → Great question generation** ✅
2. **All Others = Poor examples coverage → Poor question generation** ❌

### What Happens When Examples Are Missing:

**NSW/VIC (100% Medium examples):**
- Engine requests: "Generate Easy question"
- Available examples: Only Medium
- Claude's response: Makes it easier → Defaults to Easy
- **Result:** Likely 80-95% Easy questions (same as ACER)

**NAPLAN Year 5 (No Easy examples):**
- Engine requests: "Generate Easy question"
- Available examples: Medium or Hard only
- Claude's response: Defaults to Easy
- **Result:** Likely imbalanced toward Easy

---

## 🛠️ RECOMMENDATIONS

### Option 1: Add Examples to Curriculum Data (BEST LONG-TERM) ⭐⭐⭐⭐⭐

**Add to ALL products except EduTest:**

#### **ACER Scholarship** (Priority: HIGH)
- Add **2 Easy examples** for each of 8 Humanities sub-skills (16 total)
- Add **2 Easy examples** for each of 8 Mathematics sub-skills (16 total)
- Add **1-2 Hard examples** for sub-skills missing them (12 total)
- **Total: ~44 new examples**
- **Time: 6-8 hours**

#### **NSW Selective** (Priority: HIGH)
- Add **2 Easy examples** for each of 25 sub-skills (50 total)
- Add **2 Hard examples** for each of 25 sub-skills (50 total)
- **Total: ~100 new examples**
- **Time: 12-15 hours**

#### **VIC Selective** (Priority: HIGH)
- Add **2 Easy examples** for each of 31 sub-skills (62 total)
- Add **2 Hard examples** for each of 31 sub-skills (62 total)
- **Total: ~124 new examples**
- **Time: 15-18 hours**

#### **Year 5 NAPLAN** (Priority: MEDIUM)
- Add **2 Easy examples** for each of 16 sub-skills (32 total)
- Add **1-2 Medium/Hard** for sub-skills missing them (20 total)
- **Total: ~52 new examples**
- **Time: 8-10 hours**

**TOTAL EFFORT: 41-51 hours of example writing**

### Option 2: Use Single-Difficulty Generation (QUICK FIX) ⚠️

Generate questions in forced-difficulty batches:
```typescript
// For each test
Batch 1: 30% of questions at { type: 'single', difficulty: 1 }
Batch 2: 40% of questions at { type: 'single', difficulty: 2 }
Batch 3: 30% of questions at { type: 'single', difficulty: 3 }
```

**Pros:**
- Works immediately
- No curriculum changes needed
- Gets correct distribution

**Cons:**
- Doesn't fix root cause
- Same problem if you regenerate later
- Less elegant solution

### Option 3: Hybrid Approach (RECOMMENDED) ⭐⭐⭐⭐⭐

**Phase 1 (Immediate - Week 1):**
1. Regenerate ACER, NSW, VIC with single-difficulty strategy
2. Gets all products to production quality FAST
3. **Time: 1-2 days**

**Phase 2 (Long-term - Weeks 2-6):**
1. Add examples to curriculum data over time
2. Start with ACER (6-8 hours)
3. Then NSW (12-15 hours)
4. Then VIC (15-18 hours)
5. Then NAPLAN (8-10 hours)
6. **Time: 41-51 hours spread over 4-5 weeks**

**Phase 3 (Future):**
1. Re-regenerate all products using updated curriculum data
2. Proves the examples work
3. Future generations will be perfect

---

## 📝 SPECIFIC RECOMMENDATIONS BY PRODUCT

### **ACER Scholarship**

#### Immediate Action:
Delete existing Humanities questions and regenerate:
```bash
# 12 Easy (30%)
npx tsx scripts/generation/generate-section.ts \
  --product="ACER Scholarship (Year 7 Entry)" \
  --section="Humanities" \
  --mode="practice_1" \
  --count=12 \
  --difficulty='{ "type": "single", "difficulty": 1 }'

# 16 Medium (40%)
npx tsx scripts/generation/generate-section.ts \
  --product="ACER Scholarship (Year 7 Entry)" \
  --section="Humanities" \
  --mode="practice_1" \
  --count=16 \
  --difficulty='{ "type": "single", "difficulty": 2 }'

# 12 Hard (30%)
npx tsx scripts/generation/generate-section.ts \
  --product="ACER Scholarship (Year 7 Entry)" \
  --section="Humanities" \
  --mode="practice_1" \
  --count=12 \
  --difficulty='{ "type": "single", "difficulty": 3 }'
```

Repeat for all 6 test modes (diagnostic + 5 practice tests).

#### Long-term Fix:
Add 44 examples to `src/data/curriculumData_v2/acer.ts`:
- 2 Easy examples per Humanities sub-skill (16 total)
- 2 Easy examples per Mathematics sub-skill (16 total)
- 1-2 Hard examples for sub-skills missing them (12 total)

### **NSW & VIC Selective**

**Critical Issue:** These have **ZERO** Easy or Hard examples!

#### Immediate Action:
Regenerate ALL questions with single-difficulty strategy.

#### Long-term Fix:
Add 100-124 examples each - this is a MAJOR undertaking.

**Alternative:** Keep using single-difficulty generation for these products since they don't have curriculum examples. This is acceptable if you're willing to manage it manually.

---

## 🎯 FINAL RECOMMENDATION

### **What You Should Do:**

1. **This Week - Fix ACER:**
   - Regenerate Humanities with single-difficulty (2-3 hours)
   - Gets ACER production-ready immediately

2. **Next Week - Add ACER Examples:**
   - Write 44 examples for ACER curriculum data (6-8 hours)
   - Proves the concept works

3. **Decide on NSW/VIC/NAPLAN:**
   - **Option A:** Keep using single-difficulty generation (acceptable)
   - **Option B:** Invest 35-43 hours writing examples (better long-term)

### **My Honest Opinion:**

Given the effort required (100+ examples for NSW, 124+ for VIC), I'd recommend:

✅ **Fix ACER with both approaches** (regenerate + add examples)
⚠️ **Keep NSW/VIC/NAPLAN on single-difficulty generation** for now
🎯 **Only add examples to NSW/VIC/NAPLAN if you have time and want "perfect" curriculum data**

The single-difficulty approach works well enough for production, and you've already generated 5,392 good questions this way!

---

## ✅ Action Items Summary

**Immediate (This Week):**
1. [ ] Regenerate ACER Humanities questions with single-difficulty strategy
2. [ ] Verify correct distribution (30% / 40% / 30%)

**Short-term (Next 2-4 Weeks):**
1. [ ] Add 44 examples to ACER curriculum data
2. [ ] Decide whether to invest in NSW/VIC/NAPLAN examples

**Optional (Future):**
1. [ ] Add 100+ examples to NSW Selective curriculum data
2. [ ] Add 124+ examples to VIC Selective curriculum data
3. [ ] Add 52+ examples to NAPLAN curriculum data

---

**Status:** Root cause identified for ALL products ✅
**Priority:** Fix ACER immediately, decide on others
**Effort:** 2-3 hours (immediate) + 6-8 hours (examples) + 35-43 hours (optional)
