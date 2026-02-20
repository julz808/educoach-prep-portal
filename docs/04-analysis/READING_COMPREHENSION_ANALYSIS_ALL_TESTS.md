# Reading/Reading Comprehension Structure Analysis
## All 6 Test Types - Complete Breakdown

**Date**: 2026-02-09
**Source**: Sample Questions Master analysis

---

## 🔍 Executive Summary

**CRITICAL FINDING**: Not all "Reading" or "Reading Comprehension" sections work the same way!

| Test Type | Total Questions | Passage Dependency | Questions/Passage | Passage Length |
|-----------|----------------|-------------------|-------------------|----------------|
| **EduTest** | 20 | ❌ **MOSTLY STANDALONE** | 1-3 | Very short (50-150 words) |
| **NSW Selective** | 45 | ✅ **ALL PASSAGE-BASED** | 1-7 | Short to long (100-500 words) |
| **VIC Selective** | 50 | ⚠️ **HYBRID MIX** | 2-5 | Short to long (100-500 words) |
| **ACER** | 40 | ✅ **ALL PASSAGE-BASED** | 2-8 | Short to long (200-700 words) |
| **Year 5 NAPLAN** | 35 | ✅ **ALL PASSAGE-BASED** | 7-10 | Short to long (250-600 words) |
| **Year 7 NAPLAN** | ~40 | ✅ **ALL PASSAGE-BASED** | 6 | Medium to long (400-600 words) |

---

## 📊 Detailed Test Analysis

### 1. EduTest Scholarship - "Reading Comprehension"

**Test Structure**: 20 questions, 30 minutes
**Reality**: Despite being called "Reading Comprehension," this is **NOT primarily passage-based**

**Breakdown**:
- **Q1-5**: Sentence transformation (e.g., "If we re-write the beginning...")
- **Q6-11**: Short context questions (1-4 sentence passages)
  - "Vocabulary in Context" with 2-3 sentence passage
  - Grammar/punctuation questions
- **Q12-15**: Medium passage (1 passage) → 4 questions
  - Example: "Trent was disputatious" (vocabulary in context)
- **Q16-18**: Long narrative passage (Jack's airplane story, ~400 words) → **3 questions**
- **Q19-20**: Standalone questions again

**Key Characteristics**:
```
Passage Dependency: LOW (10-15%)
- 85% of questions: Standalone or very short context (1-4 sentences)
- 15% of questions: Actual passage-based (ONE long passage with 3 questions)
- NO multiple passages with 5+ questions each
```

**Sub-Skills**:
1. **Vocabulary in Context** - Short 2-3 sentence passages (NOT full passages)
2. **Sentence Transformation** - No passage required
3. **Grammar & Punctuation** - No passage required
4. **Figurative Language & Idioms** - No passage required
5. **Passage Comprehension** - ONE longer passage toward end of test

**Passage Generation Requirements**:
```typescript
{
  passage_required: false,  // For most sub-skills
  passage_length: "micro",  // 2-4 sentences when needed
  questions_per_passage: 1, // Usually just 1 question per context
  passage_types: ["contextual_snippet"]
}

// Exception: "Passage Comprehension & Inference" sub-skill
{
  passage_required: true,
  passage_length: "medium_to_long", // 250-400 words
  questions_per_passage: 3,
  passage_types: ["narrative"]
}
```

---

### 2. NSW Selective - "Reading"

**Test Structure**: 45 questions, 40 minutes
**Reality**: **TRUE PASSAGE-BASED COMPREHENSION**

**Breakdown**:
- **Passage 1**: "Connie Hart" (Aboriginal basket making, ~300 words) → **4 questions** (Q1-4)
- **Passage 2**: "The Horse" (poem, ~100 words) → **4 questions** (Q5-8)
- **Passage 3**: "Sydney Opera House" (architecture, ~150 words) → **4 questions** (Q9-12)
- **Passage 4**: "Caves" (informational, ~300 words) → **4 questions** (Q13-16)
- **Visual**: Cartoon → **1 question** (Q17)
- **Passage 5**: "Ryl and Dusty" (narrative, ~350 words) → **7 questions** (Q18-24)
- **Passage 6**: "The Palm Tree" (poem, ~200 words) → **6 questions** (Q25-30)
- **Passage 7**: "Dr Michael Archer" (informational, ~250 words) → **5 questions** (Q31-35)

**Key Characteristics**:
```
Passage Dependency: HIGH (100%)
- 100% of questions: Passage-based
- 8-10 passages total
- Questions per passage: 1-7 (average 4-5)
- Mix of narrative, informational, poetry, visual
```

**Passage Types**:
1. **Narrative** - Personal stories, fiction (300-400 words)
2. **Informational** - Factual articles (250-350 words)
3. **Poetry** - Structured poems (100-200 words)
4. **Visual** - Cartoons, diagrams (1 image)

**Passage Generation Requirements**:
```typescript
{
  passage_required: true,  // ALL questions
  passage_length_range: {
    narrative: "300-400 words",
    informational: "250-350 words",
    poetry: "100-200 words",
    visual: "1 image + caption"
  },
  questions_per_passage: "1-7",  // Varies significantly
  passage_types: ["narrative", "informational", "poetry", "visual"],

  // Important: Generate passage FIRST, then 4-5 questions about it
  workflow: "passage_first_then_questions"
}
```

---

### 3. VIC Selective - "Reading Reasoning"

**Test Structure**: 50 questions, 30 minutes
**Reality**: **HYBRID - Mix of standalone AND passage-based**

**Breakdown**:
- **Q1**: Vocabulary (standalone: "tangible")
- **Q2**: Sentence transformation (standalone)
- **Q3**: Vocabulary (standalone: "incorrigible")
- **Q4**: Short passage "Genealogy" (~100 words) → **1 question**
- **Q5**: Grammar (standalone)
- **Q6-7**: "Tailgating" passage (~120 words) → **2 questions**
- **Q8-9**: "Lake Condah" passage (~300 words) → **2 questions**
- **Q10**: Punctuation (standalone)
- **Q11**: Idiom (standalone: "A bird in the hand...")
- **Q12-15**: "Heart of Darkness" passage (~250 words) → **4 questions**
- **Q16-19**: "Tyrannosaurus Rex" passage (~300 words) → **4 questions**
- **Q20-23**: "Persuasion" by Jane Austen (~400 words) → **4 questions**
- **Q24-25**: "Hare and Friends" fable (~300 words) → **2 questions**
- **Q26**: Punctuation (standalone)
- **Q27**: Spelling (standalone)
- **Q28-32**: "War of the Worlds" passage (~600 words) → **5 questions**
- **Q33**: Sentence combination (standalone)
- **Q34**: Vocabulary (standalone: "morose")
- **Q35-36**: "Carbon trading" passage (~200 words) → **2 questions**
- **Q37-41**: "Amelia Earhart" passage (~600 words) → **5 questions**
- **Q42-50**: Mix of standalone + 2-3 more short passages

**Key Characteristics**:
```
Passage Dependency: MEDIUM (60-70%)
- 30-40%: Standalone vocabulary, grammar, punctuation, idioms
- 60-70%: Passage-based comprehension
- 10-12 passages total
- Questions per passage: 1-5 (average 2-4)
- Mix of very short (100 words) to long (600 words)
```

**Passage Types**:
1. **Micro passages** - 50-150 words → 1-2 questions
2. **Medium passages** - 200-350 words → 2-4 questions
3. **Long passages** - 400-600 words → 4-5 questions
4. **Standalone questions** - No passage needed

**Passage Generation Requirements**:
```typescript
{
  passage_required: "sometimes",  // 60-70% of questions
  passage_length_range: {
    micro: "50-150 words",    // 1-2 questions
    medium: "200-350 words",  // 2-4 questions
    long: "400-600 words"     // 4-5 questions
  },
  questions_per_passage: "1-5",
  passage_types: ["narrative", "informational", "persuasive", "literary_excerpt", "fable"],

  // Important: Mix of passage-based AND standalone
  workflow: "hybrid_approach"
}
```

---

### 4. ACER Scholarship - "Humanities"

**Test Structure**: 40 questions, 35 minutes
**Reality**: **TRUE PASSAGE-BASED COMPREHENSION** (100% passage-based)

**Breakdown** (from Set 1):
- **Passage 1**: "Sportsmanship" (informational, ~500 words) → **6 questions** (Q1-6)
  - Q1: Main idea, Q2: Inference, Q3: Vocabulary ("personified"), Q4: True/False, Q5: Inference, Q6: Comprehension
- **Passage 2**: "Books/Reading" (persuasive, ~400 words) → **7 questions** (Q7-13)
  - Q7: Purpose, Q8: Inference, Q9: Vocabulary, Q10: Main idea, Q11: Tone, Q12: Evidence, Q13: Comprehension
- **Passage 3**: "Dengue" (informational, ~600 words) → **5 questions** (Q14-18)
  - Q14: Detail, Q15: Vocabulary ("eradicated"), Q16: Inference, Q17: Main idea, Q18: Detail
- **[Gap in questions Q19-20]** - Likely another passage
- **Passage 4**: "Amelia Earhart" (biographical, ~700 words) → **6 questions** (Q21-26)
  - Q21: Detail, Q22: Inference, Q23: Vocabulary, Q24: Chronology, Q25: Main idea, Q26: Comprehension
- **Passage 5**: "Amanda" poem (~200 words) → **6 questions** (Q27-32)
  - Q27: Literary device, Q28: Tone, Q29: Theme, Q30: Meaning, Q31: Structure, Q32: Inference
- **Visual 1**: Tiger conservation poster → **3 questions** (Q33-35)
  - Q33: Purpose, Q34: Target audience, Q35: Persuasive techniques
- **Visual 2**: Maze image → **3 questions** (Q36-38)
  - Q36: Interpretation, Q37: Symbolism, Q38: Inference
- **Visual 3**: Unity/hands image → **2 questions** (Q39-40)
  - Q39: Message, Q40: Visual techniques

**Key Characteristics**:
```
Passage Dependency: VERY HIGH (100%)
- 100% of questions: Passage or visual-based
- 8-10 passages/visuals total per test
- Questions per passage: 2-8 (average 5-6)
- Mix of: informational, persuasive, narrative, poetry, visual interpretation
- Passage lengths: 200-700 words (wide range)
```

**Passage Types**:
1. **Informational** - Factual articles (400-600 words) → 5-6 questions
2. **Persuasive/Argumentative** - Opinion pieces (400-500 words) → 6-7 questions
3. **Narrative/Biographical** - Stories, biographies (600-700 words) → 6-8 questions
4. **Poetry** - Structured poems (150-250 words) → 4-6 questions
5. **Visual Interpretation** - Posters, images, diagrams → 2-3 questions

**Sub-Skills Identified**:
1. Main Idea & Purpose
2. Inference & Interpretation
3. Vocabulary in Context
4. Literary Devices & Poetry Analysis
5. Visual Literacy & Persuasive Techniques
6. Evidence & Supporting Details
7. Tone & Author's Purpose

**Passage Generation Requirements**:
```typescript
{
  passage_required: true,  // ALL questions
  passage_dependency: "always",
  passage_length_range: {
    informational: "400-600 words",
    persuasive: "400-500 words",
    narrative: "600-700 words",
    poetry: "150-250 words",
    visual: "1 image + context"
  },
  questions_per_passage: [2, 8],  // Varies significantly: 2-8 questions per passage
  passage_types: ["informational", "persuasive", "narrative", "poetry", "visual"],

  // Important: Generate passage FIRST, then 5-6 questions about it
  workflow: "passage_first_then_questions"
}
```

**Key Difference from NSW/VIC**:
- **Longer passages**: ACER uses 400-700 word passages (vs 200-400 for NSW/VIC)
- **More questions per passage**: 5-8 questions typical (vs 4-5 for NSW/VIC)
- **Visual literacy emphasized**: 3 visual interpretation tasks (posters, images)
- **Poetry analysis**: Dedicated poetry passage with 6 questions
- **Broader range**: Mix of short (200w) to very long (700w) passages

---

### 5. Year 5 NAPLAN - "Reading"

**Test Structure**: ~35 questions, 50 minutes
**Reality**: **TRUE PASSAGE-BASED COMPREHENSION** (100% passage-based)

**Breakdown** (from Reading Test 1):
- **Passage 1**: Narrative (~250 words) → **7 questions**
  - Mix of: character understanding, plot comprehension, inference, vocabulary
- **Passage 2**: Informational (~350 words) → **8 questions**
  - Mix of: main idea, supporting details, text structure, vocabulary
- **Passage 3**: Procedural/Instructions (~200 words) → **5 questions**
  - Following instructions, sequence, purpose
- **Passage 4**: Persuasive (~300 words) → **7 questions**
  - Author's purpose, persuasive techniques, evidence, opinion vs fact
- **Passage 5**: Visual + Text (chart/diagram + ~150 words) → **8 questions**
  - Reading graphs, interpreting data, connecting visual to text

**Key Characteristics**:
```
Passage Dependency: VERY HIGH (100%)
- 100% of questions: Passage-based (no standalone)
- 4-5 passages total per test
- Questions per passage: 7-10 (HIGH - more than other tests)
- All passages include visual elements or formatting
- Passage lengths: 250-600 words
- Strong focus on: text structure, purpose, literal/inferential comprehension
```

**Passage Types**:
1. **Narrative** - Stories with clear structure (250-350 words) → 7-8 questions
2. **Informational** - Factual articles (300-400 words) → 7-9 questions
3. **Procedural** - Instructions, how-to (200-300 words) → 5-7 questions
4. **Persuasive** - Persuasive texts (250-350 words) → 6-8 questions
5. **Multimodal** - Text + visual (charts, diagrams) (200-400 words) → 7-10 questions

**Sub-Skills Identified**:
1. Literal Comprehension (who, what, when, where)
2. Inferential Comprehension (why, how, predict)
3. Vocabulary in Context
4. Text Structure & Organization
5. Author's Purpose & Audience
6. Visual Literacy (charts, diagrams, images)
7. Connecting Ideas Across Text

**Passage Generation Requirements**:
```typescript
{
  passage_required: true,  // ALL questions
  passage_dependency: "always",
  passage_length_range: {
    narrative: "250-350 words",
    informational: "300-400 words",
    procedural: "200-300 words",
    persuasive: "250-350 words",
    multimodal: "200-400 words + visual"
  },
  questions_per_passage: [7, 10],  // HIGH: 7-10 questions per passage
  passage_types: ["narrative", "informational", "procedural", "persuasive", "multimodal"],

  // Important: Generate passage FIRST, then 7-10 questions about it
  workflow: "passage_first_then_questions",

  // Special: Many passages include visual elements
  visual_integration: true
}
```

**Key Difference from Other Tests**:
- **MORE questions per passage**: 7-10 questions (vs 4-6 for NSW/VIC, 5-8 for ACER)
- **Shorter passages**: 250-400 words typical (vs 400-600 for ACER)
- **Visual integration**: Most passages include charts, diagrams, images
- **Text types emphasized**: Strong focus on procedural, multimodal texts
- **Age-appropriate**: Year 5 level (10-11 years old) - simpler vocabulary, shorter passages

---

### 6. Year 7 NAPLAN - "Reading"

**Test Structure**: ~40 questions, 65 minutes
**Reality**: **TRUE PASSAGE-BASED COMPREHENSION** (100% passage-based)

**Breakdown** (from Sample Test):
- **Passage 1**: "The Headless Horseman" (narrative, ~600 words) → **6 questions** (Q1-6)
  - Q1: Setting, Q2: Character description, Q3: Plot detail, Q4: Vocabulary ("apparition"), Q5: Inference, Q6: Theme
- **Passage 2**: "Modern Food Production" (informational/persuasive, ~500 words) → **6 questions** (Q7-12)
  - Q7: Main idea, Q8: Supporting detail, Q9: Author's purpose, Q10: Vocabulary ("sustainable"), Q11: Inference, Q12: Text structure
- **[Remaining passages estimated]**:
  - Passage 3: Poetry (~150 words) → 5-6 questions
  - Passage 4: Informational (~550 words) → 7 questions
  - Passage 5: Persuasive (~500 words) → 6 questions
  - Passage 6: Multimodal (text + visual) → 6-8 questions
  - Passage 7: Literary excerpt (~600 words) → 6 questions

**Key Characteristics**:
```
Passage Dependency: VERY HIGH (100%)
- 100% of questions: Passage-based (no standalone)
- 6-7 passages total per test
- Questions per passage: 5-8 (average 6)
- Passage lengths: 400-600 words (longer than Year 5)
- Mix of: narrative, informational, persuasive, poetry, multimodal
- More complex vocabulary and inference than Year 5
```

**Passage Types**:
1. **Narrative/Literary** - Stories, excerpts (500-600 words) → 6 questions
2. **Informational** - Factual articles (500-550 words) → 6-7 questions
3. **Persuasive/Argumentative** - Opinion pieces (450-550 words) → 6 questions
4. **Poetry** - Structured poems (100-200 words) → 5-6 questions
5. **Multimodal** - Text + visual (400-500 words + visual) → 6-8 questions

**Sub-Skills Identified**:
1. Literal Comprehension
2. Inferential Comprehension (more complex than Year 5)
3. Vocabulary in Context (more advanced words)
4. Literary Devices & Figurative Language
5. Author's Purpose, Perspective & Bias
6. Text Structure & Argumentation
7. Synthesizing Information Across Sources
8. Visual Literacy & Multimodal Texts

**Passage Generation Requirements**:
```typescript
{
  passage_required: true,  // ALL questions
  passage_dependency: "always",
  passage_length_range: {
    narrative: "500-600 words",
    informational: "500-550 words",
    persuasive: "450-550 words",
    poetry: "100-200 words",
    multimodal: "400-500 words + visual"
  },
  questions_per_passage: 6,  // Consistent: 6 questions per passage
  passage_types: ["narrative", "informational", "persuasive", "poetry", "multimodal"],

  // Important: Generate passage FIRST, then 6 questions about it
  workflow: "passage_first_then_questions",

  // Special: Include multimodal texts with visual elements
  visual_integration: true
}
```

**Key Difference from Year 5 NAPLAN**:
- **Longer passages**: 400-600 words (vs 250-400 for Year 5)
- **Fewer questions per passage**: 6 questions typical (vs 7-10 for Year 5)
- **More complex vocabulary**: "apparition", "sustainable", "indigenous", etc.
- **More inference required**: Less literal, more analytical questions
- **Literary focus**: More emphasis on literary devices, theme, author's craft
- **Age-appropriate**: Year 7 level (12-13 years old) - more sophisticated content

---

## 🎯 Proposed Solution: Update CurriculumData V2

### Current Problem

Current `curriculumData_v2` structure assumes:
```typescript
// ALL sub-skills treated the same way
{
  subSkill: "Vocabulary in Context",
  examples: [
    { question_text, answer_options, correct_answer, passage_text }
  ]
}
```

### Proposed Enhanced Structure

```typescript
interface ReadingSubSkillData {
  // ... existing fields ...

  // NEW: Passage requirements
  passage_requirements: {
    passage_required: boolean;           // Does this sub-skill need passages?
    passage_dependency: "none" | "optional" | "always";

    // If passages needed
    passage_config?: {
      length: "micro" | "short" | "medium" | "long";
      word_count_range: [number, number];  // e.g., [250, 350]
      passage_types: ("narrative" | "informational" | "persuasive" | "poetry" | "visual")[];
      questions_per_passage: number | [number, number];  // e.g., 5 or [3, 5]
    };

    // Generation workflow
    generation_workflow: "standalone" | "passage_first" | "hybrid";
  };
}
```

### Example: EduTest Reading Comprehension

```typescript
"EduTest Scholarship (Year 7 Entry) - Reading Comprehension": {

  // SUB-SKILL 1: Vocabulary in Context
  "Vocabulary in Context": {
    description: "Understanding word meanings from short contextual clues",
    llm_appropriate: true,

    passage_requirements: {
      passage_required: false,              // ← KEY: NO full passage
      passage_dependency: "optional",       // Sometimes needs 2-3 sentences
      passage_config: {
        length: "micro",
        word_count_range: [20, 60],         // 2-4 sentences
        passage_types: ["contextual_snippet"],
        questions_per_passage: 1
      },
      generation_workflow: "standalone"     // Generate question + short context together
    },

    examples: [
      {
        difficulty: 2,
        question_text: "Trent was always very disputatious. No matter what the topic of conversation, Trent would continuously voice an opposing view. He would never back down from a disagreement, in fact it seemed he rather enjoyed it.\n\nThe word disputatious in this sentence means:",
        answer_options: ["A) friendly", "B) shy", "C) sociable", "D) argumentative", "E) displaced"],
        correct_answer: "D",
        explanation: "The context describes someone who 'voices opposing views' and 'never backs down from disagreement'."
      }
    ]
  },

  // SUB-SKILL 2: Sentence Transformation
  "Sentence Transformation": {
    description: "Rewriting sentences while maintaining meaning",
    llm_appropriate: true,

    passage_requirements: {
      passage_required: false,              // ← NO passage needed at all
      passage_dependency: "none",
      generation_workflow: "standalone"
    },

    examples: [...]
  },

  // SUB-SKILL 3: Passage Comprehension & Inference
  "Passage Comprehension & Inference": {
    description: "Understanding longer narratives and making inferences",
    llm_appropriate: true,

    passage_requirements: {
      passage_required: true,               // ← YES, needs full passage
      passage_dependency: "always",
      passage_config: {
        length: "medium",
        word_count_range: [250, 400],
        passage_types: ["narrative"],
        questions_per_passage: 3            // ONE passage → 3 questions
      },
      generation_workflow: "passage_first"  // Generate passage, THEN 3 questions
    },

    examples: [
      {
        difficulty: 2,
        passage_text: "Mesmerised by the thought of flying, Jack Simonds decided he was going to attempt to build an aeroplane...",  // Full 400-word story
        question_text: "In this story, who is Max?",
        answer_options: ["A) Jack's friend", "B) Jack's brother", "C) Jack's father", "D) The Mayor", "E) none of these"],
        correct_answer: "E",
        explanation: "The story clearly states: 'Grandpa Fred and Jack wheeled out the bright red aeroplane they had named Max'."
      }
    ]
  }
}
```

### Example: NSW Selective Reading

```typescript
"NSW Selective Entry (Year 7 Entry) - Reading": {

  // SUB-SKILL 1: Narrative Comprehension
  "Narrative Comprehension": {
    description: "Understanding characters, events, and themes in stories",
    llm_appropriate: true,

    passage_requirements: {
      passage_required: true,               // ← ALWAYS needs passage
      passage_dependency: "always",
      passage_config: {
        length: "medium",
        word_count_range: [300, 400],
        passage_types: ["narrative", "personal_story"],
        questions_per_passage: [4, 7]       // ONE passage → 4-7 questions
      },
      generation_workflow: "passage_first"  // MUST generate passage first
    },

    examples: [
      {
        difficulty: 2,
        passage_text: "One night they sat at the top of the tall steps, watching the skyline stretching in a half-circle about them from Brunswick Heads to Surfers Paradise...",  // Full Ryl & Dusty passage
        question_text: "The setting of the passage is",
        answer_options: ["A) lonely", "B) gloomy", "C) peaceful", "D) glamorous"],
        correct_answer: "C",
        explanation: "The passage describes a calm evening watching the skyline, described as 'lime-scented night'."
      }
    ]
  },

  // SUB-SKILL 2: Informational Text Comprehension
  "Informational Text Comprehension": {
    description: "Understanding factual articles and extracting key information",
    llm_appropriate: true,

    passage_requirements: {
      passage_required: true,
      passage_dependency: "always",
      passage_config: {
        length: "medium",
        word_count_range: [250, 350],
        passage_types: ["informational", "expository"],
        questions_per_passage: 4
      },
      generation_workflow: "passage_first"
    }
  },

  // SUB-SKILL 3: Poetry Analysis
  "Poetry Analysis": {
    description: "Interpreting poetic devices, themes, and meaning",
    llm_appropriate: true,

    passage_requirements: {
      passage_required: true,
      passage_dependency: "always",
      passage_config: {
        length: "short",
        word_count_range: [100, 200],
        passage_types: ["poetry"],
        questions_per_passage: [4, 6]
      },
      generation_workflow: "passage_first"
    }
  }
}
```

---

## 🔧 Implementation Steps

### Step 1: Audit Remaining Test Types

**Need to check**:
- ✅ EduTest (DONE)
- ✅ NSW Selective (DONE)
- ✅ VIC Selective (DONE)
- ❓ ACER Scholarship - Check Reading/Comprehension section
- ❓ Year 5 NAPLAN - Check Reading section
- ❓ Year 7 NAPLAN - Check Reading section

### Step 2: Update curriculumData_v2 Schema

Add `passage_requirements` field to all reading/comprehension sub-skills:

```typescript
// types.ts
export interface SubSkillExampleData {
  // ... existing fields ...

  passage_requirements: {
    passage_required: boolean;
    passage_dependency: "none" | "optional" | "always";
    passage_config?: {
      length: "micro" | "short" | "medium" | "long";
      word_count_range: [number, number];
      passage_types: string[];
      questions_per_passage: number | [number, number];
    };
    generation_workflow: "standalone" | "passage_first" | "hybrid";
  };
}
```

### Step 3: Create Passage Generation Functions

```typescript
// New file: src/engines/questionGeneration/v2/passageGenerator.ts

export async function generatePassageWithQuestions(
  testType: string,
  section: string,
  subSkill: string,
  difficulty: number,
  testMode: string
): Promise<{
  passage: PassageV2;
  questions: QuestionV2[];
}> {
  // 1. Load sub-skill data
  const subSkillData = loadSubSkillData(testType, section, subSkill);

  // 2. Check passage requirements
  if (!subSkillData.passage_requirements.passage_required) {
    throw new Error(`Sub-skill "${subSkill}" does not require passages`);
  }

  const { passage_config } = subSkillData.passage_requirements;

  // 3. Generate passage first
  const passagePrompt = buildPassagePrompt(
    testType,
    section,
    passage_config.passage_types[0],  // narrative, informational, etc.
    passage_config.word_count_range[1],  // target word count
    difficulty
  );

  const passageResult = await callClaudeAPI(passagePrompt);
  const passage = parsePassageResponse(passageResult);

  // 4. Store passage
  const passageId = await storePassageV2(passage);

  // 5. Generate N questions about that passage
  const questionCount = Array.isArray(passage_config.questions_per_passage)
    ? passage_config.questions_per_passage[1]  // Use max
    : passage_config.questions_per_passage;

  const questions: QuestionV2[] = [];
  for (let i = 0; i < questionCount; i++) {
    const questionRequest = {
      testType,
      section,
      subSkill,
      difficulty,
      testMode,
      passageId  // ← Link to passage
    };

    const result = await generateQuestionV2(questionRequest);
    if (result.success && result.question) {
      questions.push(result.question);
    }
  }

  return { passage, questions };
}
```

### Step 4: Update Generator to Include Passage Content

```typescript
// generator.ts - Update buildPromptWithExamples

if (request.passageId) {
  // Fetch the passage
  const passage = await fetchPassageV2(request.passageId);

  // Include passage in prompt
  promptContext.passage = passage;

  // Update prompt to include passage text
  prompt += `
## PASSAGE
The question MUST be answerable using ONLY this passage:

Title: ${passage.title}

${passage.content}

Generate a question testing: ${request.subSkill}
The question should test comprehension/inference/vocabulary from this specific passage.
`;
}
```

### Step 5: Update Batch Generation Scripts

```typescript
// Example: generate-nsw-selective-reading.ts

import { generatePassageWithQuestions } from '@/engines/questionGeneration/v2';

async function generateNSWReadingSection() {
  const testType = 'NSW Selective Entry (Year 7 Entry)';
  const section = 'Reading';

  // Generate 8 passages (each with 4-5 questions = 32-40 questions)
  const passageTypes = [
    { subSkill: 'Narrative Comprehension', count: 3 },
    { subSkill: 'Informational Text Comprehension', count: 3 },
    { subSkill: 'Poetry Analysis', count: 2 }
  ];

  for (const { subSkill, count } of passageTypes) {
    for (let i = 0; i < count; i++) {
      const { passage, questions } = await generatePassageWithQuestions(
        testType,
        section,
        subSkill,
        2,  // difficulty
        'practice_1'
      );

      console.log(`✅ Generated passage "${passage.title}" with ${questions.length} questions`);
    }
  }
}
```

---

## 📋 Summary: What Each Test Needs

| Test | Workflow | Generation Approach | Q per Passage | Passage Length |
|------|----------|---------------------|---------------|----------------|
| **EduTest** | `standalone` | Generate questions directly (some with 2-3 sentence context) | 1-3 | 50-150 words |
| **NSW Selective** | `passage_first` | Generate passage → Generate 4-7 questions about passage | 4-7 | 100-500 words |
| **VIC Selective** | `hybrid` | Mix: 40% standalone, 60% passage-first (2-5 Q per passage) | 2-5 | 100-600 words |
| **ACER** | `passage_first` | Generate passage → Generate 5-8 questions about passage | 5-8 | 200-700 words |
| **NAPLAN Y5** | `passage_first` | Generate passage → Generate 7-10 questions about passage | 7-10 | 250-400 words |
| **NAPLAN Y7** | `passage_first` | Generate passage → Generate 6 questions about passage | 6 | 400-600 words |

---

## ✅ Next Actions

1. ✅ **Audit all 6 test types** - COMPLETED
   - ✅ EduTest: Mostly standalone (85%), 1-3 Q per passage
   - ✅ NSW Selective: 100% passage-based, 4-7 Q per passage
   - ✅ VIC Selective: Hybrid (60% passage-based), 2-5 Q per passage
   - ✅ ACER: 100% passage-based, 5-8 Q per passage
   - ✅ Year 5 NAPLAN: 100% passage-based, 7-10 Q per passage
   - ✅ Year 7 NAPLAN: 100% passage-based, 6 Q per passage

2. ❓ **Update curriculumData_v2 schema** with `passage_requirements`
3. ❓ **Update existing reading sub-skills** with correct metadata
4. ❓ **Implement passage generation function** (`generatePassageWithQuestions`)
5. ❓ **Update generator to include passage content** when passageId provided
6. ❓ **Test end-to-end** for each workflow type
7. ❓ **Create test-specific batch generation scripts**

**Priority**: HIGH - This affects 6 out of 6 test types!
