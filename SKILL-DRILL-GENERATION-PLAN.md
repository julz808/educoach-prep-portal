# Skill Drill Generation Plan

**Date:** 2026-02-22
**Status:** Ready to implement

---

## 🎯 Goal

Generate **10 questions per sub-skill per difficulty level** for targeted skill practice drills across all 6 products.

---

## 📊 Difficulty Level Strategy

### Current Curriculum Data Structure:

| Product | Difficulty Levels | Sub-Skills | Examples Coverage |
|---------|------------------|------------|-------------------|
| **NAPLAN Year 5** | **6 levels (1-6)** | 16 | 0% all-6 coverage ❌ |
| **NAPLAN Year 7** | **6 levels (1-6)** | 20 | 0% all-6 coverage ❌ |
| **EduTest** | 3 levels (1-3) | 26 | 81% all-3 coverage ✅ |
| **ACER** | 3 levels (1-3) | 18 | 17% all-3 coverage ❌ |
| **NSW Selective** | 3 levels (1-3)* | 25 | 0% all-3 coverage ❌ |
| **VIC Selective** | 3 levels (1-3)* | 31 | 0% all-3 coverage ❌ |

*NSW/VIC curriculum data only has `difficulty_range: [2]` but we should generate across all 3 levels

---

## 🔧 RECOMMENDATION: Simplify NAPLAN to 3 Difficulty Levels

### Why Simplify NAPLAN from 6 → 3 Levels?

**Current Problem:**
- NAPLAN curriculum data has `difficulty_range: [1, 2, 3, 4, 5, 6]`
- But **0% of sub-skills** have examples at all 6 levels
- Only 35 total examples across 16 sub-skills (Year 5)
- No examples at difficulty levels 1, 4, 5, or 6

**If we keep 6 levels:**
- Need to generate: **16 sub-skills × 6 difficulties × 10 questions = 960 questions** (Year 5)
- Need to generate: **20 sub-skills × 6 difficulties × 10 questions = 1,200 questions** (Year 7)
- **Total: 2,160 questions** just for NAPLAN
- Claude will default to easy without proper examples at each level

**If we simplify to 3 levels:**
- Generate: **16 sub-skills × 3 difficulties × 10 questions = 480 questions** (Year 5)
- Generate: **20 sub-skills × 3 difficulties × 10 questions = 600 questions** (Year 7)
- **Total: 1,080 questions** (saves 1,080 questions!)
- Easier to calibrate: Easy (levels 1-2), Medium (levels 3-4), Hard (levels 5-6)

### ✅ Recommended Mapping for NAPLAN:

```typescript
// Map 6-level NAPLAN structure to 3-level generation:
Difficulty 1 (Easy):    Covers NAPLAN levels 1-2
Difficulty 2 (Medium):  Covers NAPLAN levels 3-4
Difficulty 3 (Hard):    Covers NAPLAN levels 5-6
```

**Benefits:**
- ✅ Consistent with other products (all use 3 levels)
- ✅ Simpler for students to understand ("Easy", "Medium", "Hard")
- ✅ Easier to calibrate with limited examples
- ✅ Saves ~50% generation time and API costs
- ✅ Aligns with actual usage patterns (students rarely need 6 granular levels)

---

## 📋 Total Questions to Generate

### With 3 Difficulty Levels for All Products:

| Product | Sub-Skills | Difficulties | Questions per Sub-Skill | Total Drill Questions |
|---------|------------|--------------|-------------------------|---------------------|
| **Year 5 NAPLAN** | 16 | 3 | 30 (10 × 3) | **480** |
| **Year 7 NAPLAN** | 20 | 3 | 30 (10 × 3) | **600** |
| **EduTest** | 26 | 3 | 30 (10 × 3) | **780** |
| **ACER** | 18 | 3 | 30 (10 × 3) | **540** |
| **NSW Selective** | 25 | 3 | 30 (10 × 3) | **750** |
| **VIC Selective** | 31 | 3 | 30 (10 × 3) | **930** |
| **TOTAL** | **136** | | | **4,080** |

---

## ⚠️ Critical Issue: Missing Difficulty Examples

### Current Example Coverage:

**Products with GOOD coverage:**
- ✅ **EduTest**: 81% of sub-skills have all 3 difficulty levels

**Products with POOR coverage:**
- ❌ **NAPLAN Year 5**: 0% all-3 coverage (no Easy examples, few Hard)
- ❌ **NAPLAN Year 7**: Similar to Year 5
- ❌ **NSW Selective**: 0% all-3 coverage (only Medium examples)
- ❌ **VIC Selective**: 0% all-3 coverage (only Medium examples)
- ❌ **ACER**: 17% all-3 coverage (only 1 Easy example across 8 Humanities sub-skills)

### What This Means:

Without proper difficulty examples, Claude will **default to Easy** (as we saw in test generation):
- ACER: 79% Easy instead of 33%
- NSW Reading: 80-100% Easy instead of 30%

---

## 🎯 SOLUTION: Add Difficulty Examples BEFORE Skill Drill Generation

### Option 1: Add Full Example Coverage (BEST QUALITY) ⭐⭐⭐⭐⭐

**Add 2 examples per difficulty per sub-skill:**

| Product | Sub-Skills | Examples Needed | Estimated Time |
|---------|------------|-----------------|----------------|
| **NAPLAN Year 5** | 16 | 96 (16 × 3 × 2) | 10-12 hours |
| **NAPLAN Year 7** | 20 | 120 (20 × 3 × 2) | 12-15 hours |
| **ACER** | 18 | 44 (missing Easy/Hard) | 6-8 hours |
| **NSW Selective** | 25 | 100 (missing Easy/Hard) | 12-15 hours |
| **VIC Selective** | 31 | 124 (missing Easy/Hard) | 15-18 hours |
| **TOTAL** | **110** | **484 examples** | **55-68 hours** |

**Pros:**
- ✅ Perfect calibration for all future generation
- ✅ One-time investment that pays off forever
- ✅ High-quality, well-balanced questions

**Cons:**
- ⏰ 55-68 hours of work upfront

---

### Option 2: Use Single-Difficulty Generation (QUICK START) ⚡

**Force difficulty using generation parameters:**

```typescript
// Generate in batches with forced difficulty
For each sub-skill:
  Batch 1: 10 questions at { type: 'single', difficulty: 1 }
  Batch 2: 10 questions at { type: 'single', difficulty: 2 }
  Batch 3: 10 questions at { type: 'single', difficulty: 3 }
```

**Pros:**
- ✅ Works immediately without curriculum changes
- ✅ Guarantees correct distribution
- ✅ Can start generating today

**Cons:**
- ⚠️ Requires good prompting to ensure actual difficulty differences
- ⚠️ Won't fix the underlying curriculum data issue
- ⚠️ May still have some Easy bias (but much better than balanced mode)

---

### Option 3: HYBRID APPROACH (RECOMMENDED) ⭐⭐⭐⭐⭐

**Phase 1 (This Week): Generate All Drills with Single-Difficulty**
- Generate all 4,080 drill questions using forced single-difficulty strategy
- Time: 2-3 days (mostly API time)
- Gets skill drills live immediately

**Phase 2 (Next 2-6 Weeks): Add Examples Gradually**
- Week 1: Add NAPLAN Year 5 examples (10-12 hours)
- Week 2: Add NAPLAN Year 7 examples (12-15 hours)
- Week 3: Add ACER examples (6-8 hours)
- Week 4-5: Add NSW examples (12-15 hours)
- Week 6: Add VIC examples (15-18 hours)

**Phase 3 (Future): Regenerate with Proper Examples**
- When curriculum data is complete, regenerate drills
- Verify quality improvement
- Keep as reference for future products

---

## 📝 Recommended Approach

### **GO WITH HYBRID:**

1. **Immediate Action (Today):**
   - Update generation script to use 3 difficulty levels for NAPLAN (not 6)
   - Use single-difficulty strategy for all products
   - Generate all 4,080 skill drill questions

2. **Short-term (Next 1-2 Weeks):**
   - Prioritize adding examples for most-used products (start with NAPLAN Year 5)
   - Add at least 1 Easy and 1 Hard example per sub-skill

3. **Long-term (Next 2-6 Weeks):**
   - Complete full example coverage for all products
   - Regenerate 10-20% of drills as test to verify improvement
   - Document best practices for future curriculum development

---

## 🚀 Implementation Commands

### Generate Skill Drills (Single-Difficulty Strategy):

```bash
# Example for NAPLAN Year 5 - Reading - Literal Comprehension
# Difficulty 1 (Easy)
npx tsx scripts/generation/generate-drill.ts \
  --product="Year 5 NAPLAN" \
  --section="Reading" \
  --sub-skill="Literal Comprehension" \
  --count=10 \
  --difficulty='{ "type": "single", "difficulty": 1 }'

# Difficulty 2 (Medium)
npx tsx scripts/generation/generate-drill.ts \
  --product="Year 5 NAPLAN" \
  --section="Reading" \
  --sub-skill="Literal Comprehension" \
  --count=10 \
  --difficulty='{ "type": "single", "difficulty": 2 }'

# Difficulty 3 (Hard)
npx tsx scripts/generation/generate-drill.ts \
  --product="Year 5 NAPLAN" \
  --section="Reading" \
  --sub-skill="Literal Comprehension" \
  --count=10 \
  --difficulty='{ "type": "single", "difficulty": 3 }'
```

**Repeat for all 136 sub-skills × 3 difficulties = 408 generation batches**

---

## 📊 Example Coverage Summary

### What We Need to Add:

**Minimum (to avoid Easy bias):**
- 1 Easy example per sub-skill (110 examples)
- 1 Hard example per sub-skill (110 examples)
- **Total: 220 examples minimum**

**Recommended (for good calibration):**
- 2 Easy examples per sub-skill (220 examples)
- 2 Hard examples per sub-skill (220 examples)
- **Total: 440 examples recommended**

---

## ✅ Next Steps

1. **Confirm approach:** Do you want to proceed with Hybrid (recommended)?
2. **NAPLAN simplification:** Confirm mapping 6 levels → 3 levels is acceptable
3. **Start generation:** Begin with single-difficulty strategy for immediate results
4. **Plan example writing:** Decide which products to prioritize for example additions

---

**Ready to proceed?** Let me know and I'll help you start generating the skill drills!
