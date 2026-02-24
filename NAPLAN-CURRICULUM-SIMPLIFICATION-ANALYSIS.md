# NAPLAN Curriculum Data: 6-Level to 3-Level Simplification Analysis

**Date:** 2026-02-22

---

## 🎯 Question: Do we need 3 difficulty examples per question type within each sub-skill?

### **Answer: NO - 1 example per difficulty per sub-skill is sufficient**

---

## 📊 Current NAPLAN Curriculum Structure

### Sub-Skills are **Question Types**, not variations:

Each sub-skill represents a **distinct type of question**:

**Year 5 NAPLAN - Reading:**
1. **Literal Comprehension** = "Where/when/who" questions (explicit facts)
2. **Inferential Comprehension** = "Reading between lines" questions
3. **Vocabulary in Context** = Word meaning questions
4. **Text Structure & Features** = Organization/formatting questions
5. **Author's Purpose & Perspective** = Intent/viewpoint questions

**Year 5 NAPLAN - Language Conventions:**
1. **Spelling** = Correct spelling choice
2. **Grammar & Syntax** = Sentence structure correctness
3. **Punctuation** = Correct punctuation usage
4. **Parts of Speech & Word Choice** = Appropriate word selection

**Year 5 NAPLAN - Numeracy:**
1. **Number Operations & Place Value** = Arithmetic and place value
2. **Fractions, Decimals & Percentages** = Rational number operations
3. **Measurement & Geometry** = Spatial/measurement problems
4. **Patterns & Algebra** = Pattern recognition and algebraic thinking
5. **Data & Statistics** = Graph/data interpretation

---

## ✅ Recommendation: 1 Example Per Difficulty Per Sub-Skill

### Why This is Sufficient:

**Each sub-skill already represents ONE question type:**
- Literal Comprehension = always "explicit fact retrieval"
- Inferential Comprehension = always "draw conclusions from clues"
- Vocabulary in Context = always "word meaning from context"

**Within each sub-skill, difficulty increases by:**
- Complexity of passage/problem
- Sophistication of vocabulary
- Number of steps required
- Familiarity of context

**NOT by changing the question type itself**

---

## 📋 What We Need to Add

### Year 5 NAPLAN (16 sub-skills):

**Current coverage:**
- 35 total examples
- 0 at difficulty 1
- 12 at difficulty 2
- 0 at difficulty 3
- 7 at difficulty 4
- 0 at difficulty 5
- 0 at difficulty 6

**What we need (simplified to 3 levels):**

For **each of 16 sub-skills**, add:
- 1 example at difficulty 1 (Easy = old levels 1-2)
- 1 example at difficulty 2 (Medium = old levels 3-4)
- 1 example at difficulty 3 (Hard = old levels 5-6)

**Total examples needed:** 48 (16 sub-skills × 3 difficulties)

**BUT** we already have some examples we can repurpose:
- Current difficulty 2 examples → Keep as new difficulty 1 (Easy)
- Current difficulty 3-4 examples → Keep as new difficulty 2 (Medium)
- Current difficulty 5-6 examples → Keep as new difficulty 3 (Hard)

**Net new examples to write:** ~32 (filling gaps)

---

### Year 7 NAPLAN (20 sub-skills):

Similar structure, need:
- 60 total examples (20 sub-skills × 3 difficulties)
- Can repurpose some existing examples
- **Net new examples to write:** ~40-45

---

## 🎨 Example Template for Each Sub-Skill

### Example: "Literal Comprehension"

```typescript
"Literal Comprehension": {
  description: "Understanding explicitly stated information...",
  difficulty_range: [1, 2, 3],  // CHANGED from [1, 2, 3, 4, 5, 6]

  examples: [
    {
      difficulty: 1,  // EASY (maps to old 1-2)
      question_text: "...",
      // Simple passage, obvious detail, familiar topic
    },
    {
      difficulty: 2,  // MEDIUM (maps to old 3-4)
      question_text: "...",
      // Moderate passage, requires careful reading
    },
    {
      difficulty: 3,  // HARD (maps to old 5-6)
      question_text: "...",
      // Complex passage, subtle detail, challenging vocabulary
    }
  ],

  pattern: {
    difficulty_progression: {
      "1": "Obvious details, simple sentences, familiar topics",
      "2": "Details requiring careful reading, some complex sentences",
      "3": "Subtle details, sophisticated vocabulary, challenging texts"
    }
  }
}
```

---

## 🔧 Implementation Steps

### 1. **Update difficulty_range for all NAPLAN sub-skills:**

```typescript
// BEFORE:
difficulty_range: [1, 2, 3, 4, 5, 6]

// AFTER:
difficulty_range: [1, 2, 3]
```

### 2. **Remap existing examples:**

```typescript
// Old difficulty 2 → New difficulty 1
// Old difficulty 3-4 → New difficulty 2
// Old difficulty 5-6 → New difficulty 3
```

### 3. **Add missing examples:**

For each sub-skill that lacks all 3 difficulties, write new examples following the pattern.

### 4. **Update difficulty_progression:**

```typescript
// BEFORE:
difficulty_progression: {
  "1": "...",
  "2": "...",
  "3": "...",
  "4": "...",
  "5": "...",
  "6": "..."
}

// AFTER:
difficulty_progression: {
  "1": "Simple/obvious (covers old 1-2)",
  "2": "Moderate/careful reading (covers old 3-4)",
  "3": "Complex/challenging (covers old 5-6)"
}
```

---

## 📊 Time Estimate

### Year 5 NAPLAN:
- Update all 16 sub-skills to 3-level structure: **30 minutes**
- Remap existing 35 examples to new difficulty levels: **30 minutes**
- Write 32 new examples (gaps): **4-5 hours**
- **Total: ~5-6 hours**

### Year 7 NAPLAN:
- Update all 20 sub-skills to 3-level structure: **30 minutes**
- Remap existing examples: **30 minutes**
- Write 40-45 new examples: **5-6 hours**
- **Total: ~6-7 hours**

### **TOTAL TIME: ~11-13 hours for both NAPLAN products**

---

## ✅ Final Answer

**NO, you don't need multiple example types per sub-skill.**

**Each sub-skill = ONE question type**
- 1 example at Easy difficulty
- 1 example at Medium difficulty
- 1 example at Hard difficulty

**= 3 examples per sub-skill (total of 108 examples for both NAPLANs)**

This is much more manageable than 484 examples across all products!

---

## 🚀 Next Steps

1. **Update Year 5 NAPLAN** curriculum data (5-6 hours)
2. **Update Year 7 NAPLAN** curriculum data (6-7 hours)
3. **Verify engine compatibility** (should already work with 3 levels)
4. **Update documentation** (30 minutes)

**Ready to start?**
