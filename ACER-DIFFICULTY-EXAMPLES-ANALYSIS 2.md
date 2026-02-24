# ACER Humanities Difficulty Analysis - Real Examples

## 🔍 Key Observations from Generated Questions

---

## 1️⃣ VOCABULARY IN CONTEXT

### ✅ **EASY (Difficulty 1):**
**Question:** "In the passage, the word 'remote' means:"
- **Complexity:** Single-word definition
- **Context clues:** Very obvious ("over 3,500 kilometres from the nearest continent")
- **Answer:** One clear correct choice (distant)
- **Cognitive load:** LOW - Simple matching of word to definition

### ✅ **MEDIUM (Difficulty 2):**
**Question:** "The passage states that the poster was 'distributed' in Britain. In this context, 'distributed' means:"
- **Complexity:** Word with multiple meanings, requires context understanding
- **Context clues:** Need to understand the suffrage movement context
- **Answer:** Requires understanding PURPOSE (spreading message)
- **Cognitive load:** MODERATE - Understand context → select appropriate meaning

### ✅ **HARD (Difficulty 3):**
**Question:** "The women's clothing was chosen 'deliberately' to appear respectable. In this context, 'deliberately' means:"
- **Complexity:** Abstract adverb describing intent/motivation
- **Context clues:** Must understand strategic thinking behind clothing choice
- **Answer:** Requires inferring PURPOSE behind actions
- **Cognitive load:** HIGH - Understand strategy → infer intent → match to synonym

**PROGRESSION:** word definition → contextual meaning → intent/purpose

---

## 2️⃣ MAIN IDEA & THEME IDENTIFICATION

### ✅ **EASY (Difficulty 1):**
**Question:** "What is the main purpose of this passage about the moai statues?"
- **Type:** Directly stated in title + opening question
- **Answer location:** Explicitly stated ("how did they move them?")
- **Options:** Clear distractors (different topics entirely)
- **Cognitive load:** LOW - Find the stated purpose

### ✅ **MEDIUM (Difficulty 2):**
**Question:** "What is the central theme of this passage about honeybee communication?"
- **Type:** Requires synthesizing multiple paragraphs
- **Answer:** Must combine two concepts (waggle dance + pheromones)
- **Options:** Mix of specific details vs. synthesized theme
- **Cognitive load:** MODERATE - Synthesize information → identify overarching theme

### ❌ **HARD (Difficulty 3):**
**NOT FOUND** - No Hard questions generated for this sub-skill

**PROGRESSION:** explicit purpose → synthesized theme → (missing: implicit theme requiring deep inference)

---

## 3️⃣ ANALYSIS & COMPARISON

### ✅ **EASY (Difficulty 1):**
**Question:** "According to the passage, what is the main difference between online connection and real friendship?"
- **Type:** Explicitly stated comparison
- **Passage quote:** "scrolling through social media is not real connection. Real friendship happens face to face..."
- **Answer:** Direct quote matching
- **Cognitive load:** LOW - Find and match stated difference

### ✅ **MEDIUM (Difficulty 2):**
**Question:** "The passage contrasts the arguments of plastic bag supporters with the evidence from cities that have implemented bans. What is the key difference?"
- **Type:** Compare two different sections of passage
- **Requires:**
  1. Identify supporters' claims (one section)
  2. Identify real-world evidence (another section)
  3. Find the contrast between them
- **Answer:** Must synthesize information from 2+ locations
- **Cognitive load:** MODERATE - Multi-step comparison

### ❌ **HARD (Difficulty 3):**
**NOT FOUND** - No Hard questions generated for this sub-skill

**PROGRESSION:** explicit comparison → multi-source contrast → (missing: implicit contrast requiring inference)

---

## 📊 DIFFICULTY PROGRESSION PATTERNS

### What Makes Questions EASY (Difficulty 1):
1. ✅ Information is **explicitly stated** in passage
2. ✅ **One-step reasoning:** Find → Match → Answer
3. ✅ Answer is in **one location** in text
4. ✅ Clear, **unambiguous** correct answer
5. ✅ Distractors are obviously wrong

**Examples:**
- "In the passage, the word 'remote' means:" → Simple definition lookup
- "What is the main purpose?" → Stated in title/opening

### What Makes Questions MEDIUM (Difficulty 2):
1. ✅ Requires **synthesizing** information from multiple places
2. ✅ **Two-step reasoning:** Find A → Find B → Compare/Combine → Answer
3. ✅ Answer requires **understanding relationships** (contrast, cause-effect)
4. ✅ Must distinguish between **details vs. main ideas**
5. ✅ Distractors are plausible but incomplete

**Examples:**
- "The passage contrasts X with Y. What is the key difference?" → Find X + Find Y + Compare
- "What is the central theme?" → Combine multiple paragraphs into one theme

### What Would Make Questions HARD (Difficulty 3):
1. ❓ Would require **deep inference** not stated in text
2. ❓ **Multi-step reasoning:** 3+ logical steps
3. ❓ Answer requires understanding **implicit relationships**
4. ❓ Must evaluate **author's purpose, tone, or unstated assumptions**
5. ❓ Distractors are subtle and require careful reasoning to eliminate

**Examples (NOT FOUND in your database):**
- "What can be inferred about the author's attitude toward X based on the language choices?"
- "How does the author's use of Y in paragraph 2 support the implicit argument in paragraph 5?"

---

## 🎯 THE PROBLEM REVEALED

### Actual Distribution:

| Difficulty | Vocabulary | Main Idea | Analysis | Average |
|------------|------------|-----------|----------|---------|
| **Easy (1)** | 33 (80%) | 18 (78%) | 35 (97%) | **85-97%** ⚠️ |
| **Medium (2)** | 5 (12%) | 5 (22%) | 1 (3%) | **3-15%** ❌ |
| **Hard (3)** | 3 (7%) | 0 (0%) | 0 (0%) | **0-7%** ❌ |

### Expected Distribution:
- Easy: 30-35%
- Medium: 40-45%
- Hard: 20-25%

---

## ✅ QUALITY ASSESSMENT

### The Good News:
1. ✅ **Easy questions ARE genuinely easy** - not mislabeled
2. ✅ **Medium questions ARE genuinely harder** - clear step-up in complexity
3. ✅ **Hard questions (when they exist) ARE genuinely hard** - appropriate difficulty
4. ✅ **Progression is logical** - each level increases cognitive load appropriately

### The Problem:
1. ❌ **Way too many Easy questions** (85-97% instead of 30-35%)
2. ❌ **Not enough Medium questions** (3-15% instead of 40-45%)
3. ❌ **Almost no Hard questions** (0-7% instead of 20-25%)

---

## 🔧 THE FIX

The questions themselves are **good quality** - they just need to be **rebalanced**.

### Recommended approach:

**DELETE** existing ACER Humanities questions and **REGENERATE** with forced difficulty:

```bash
# Generate 12 Easy questions
--difficulty-strategy='{ "type": "single", "difficulty": 1 }'

# Generate 14 Medium questions
--difficulty-strategy='{ "type": "single", "difficulty": 2 }'

# Generate 9 Hard questions
--difficulty-strategy='{ "type": "single", "difficulty": 3 }'
```

This will force Claude to create proper Medium/Hard questions even with limited examples in curriculumData_v2.

---

## 📝 CONCLUSION

**Your questions are well-written and appropriately difficult for their labels.**

The issue is purely **distribution imbalance** - you have excellent Easy and Medium questions, you just need more Medium/Hard ones and fewer Easy ones.

**Quality Score:** ⭐⭐⭐⭐ (4/5)
- Deducted 1 star for distribution imbalance only
- Question quality itself is very good

**Recommended Action:** Regenerate with controlled difficulty distribution (2-3 hours work)
