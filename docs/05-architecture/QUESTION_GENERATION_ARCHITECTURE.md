# Question Generation System - Complete Architecture

**Created:** February 4, 2026
**Purpose:** Define how questions are generated, stored, and served to students

---

## 🎯 System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         QUESTION GENERATION SYSTEM                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Curriculum Data  →  Generation Engine  →  Storage  →  Student Drills  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📚 Phase 1: Curriculum Data (Source of Truth)

### **Location:** `src/data/curriculumData_v2/`

### **Files:**
- `types.ts` - TypeScript interfaces
- `edutest.ts` - EduTest examples (22 sub-skills, 103 examples)
- `acer.ts` - ACER examples (18 sub-skills, 40 examples)
- `nsw-selective.ts` - NSW Selective (placeholder)
- `vic-selective.ts` - VIC Selective (placeholder)
- `naplan-year5.ts` - Year 5 NAPLAN (placeholder)
- `naplan-year7.ts` - Year 7 NAPLAN (placeholder)

### **What's Stored:**
Each sub-skill contains:
```typescript
{
  description: "What this skill tests",
  visual_required: boolean,              // Does it need images/diagrams?
  image_type: "SVG" | "HTML" | "Image Generation" | null,
  llm_appropriate: boolean,              // Can LLM generate this?
  difficulty_range: [1, 2, 3],
  question_format: "Template description",

  examples: [                            // Real sample questions
    {
      difficulty: 2,
      question_text: "...",
      answer_options: ["A", "B", "C", "D"],
      correct_answer: "B",
      explanation: "...",
      characteristics: [...]
    }
  ],

  pattern: {                             // How to generate similar questions
    format_template: "...",
    key_characteristics: [...],
    distractor_strategies: [...],
    difficulty_progression: {
      "1": "Easy level description",
      "2": "Medium level description",
      "3": "Hard level description"
    }
  }
}
```

### **Current Status:**
- ✅ EduTest: Complete (22 sub-skills)
- ✅ ACER: Complete (18 sub-skills)
- ❌ Others: Placeholders (4 test types)

---

## 🤖 Phase 2: Question Generation Engine

### **Location:** `src/lib/question-generation/` (to be created)

### **High-Level Flow:**

```
┌──────────────────────────────────────────────────────────────────────┐
│ 1. INPUT: What question do we need?                                  │
│    - Test type: "ACER Scholarship"                                   │
│    - Section: "Mathematics"                                          │
│    - Sub-skill: "Probability"                                        │
│    - Difficulty: 2                                                   │
│    - Quantity: 10 questions                                          │
└──────────────────────────────────────────────────────────────────────┘
                                ↓
┌──────────────────────────────────────────────────────────────────────┐
│ 2. CURRICULUM LOOKUP                                                  │
│    → Load curriculumData_v2/acer.ts                                  │
│    → Find "Probability" sub-skill                                    │
│    → Extract: examples, pattern, format_template                     │
└──────────────────────────────────────────────────────────────────────┘
                                ↓
┌──────────────────────────────────────────────────────────────────────┐
│ 3. CHECK: Can LLM generate this?                                     │
│    → Check llm_appropriate field                                     │
│    → Check visual_required field                                     │
│    → Check image_type field                                          │
└──────────────────────────────────────────────────────────────────────┘
                                ↓
                    ┌───────────┴───────────┐
                    │                       │
              ✅ CAN GENERATE        ❌ CANNOT GENERATE
                    │                       │
                    ↓                       ↓
┌──────────────────────────────────┐  ┌──────────────────────┐
│ 4. GENERATE QUESTIONS             │  │ SKIP THIS SUB-SKILL  │
│                                   │  │                      │
│ Route to appropriate path:        │  │ Examples:            │
│                                   │  │ - Venn Diagrams      │
│ PATH A: Text-only (30 sub-skills)│  │ - 3D Visualization   │
│ PATH B: Simple visual (5)         │  │ - Reflections        │
│ PATH C: Image generation (2)      │  │                      │
└──────────────────────────────────┘  └──────────────────────┘
```

---

## 🛤️ Generation Paths (3 Types)

### **PATH A: Text-Only Questions** (30 sub-skills)

**Examples:**
- EduTest: Vocabulary, Analogies, Reading Comprehension, Grammar
- ACER: Probability, Humanities comprehension, Persuasive Writing

**Process:**
```typescript
// 1. Build prompt
const prompt = `
Generate a ${difficulty} difficulty question for ${sub_skill}.

Use these example questions as reference:
${examples}

Follow this pattern:
${pattern.format_template}

Difficulty level ${difficulty} should have:
${pattern.difficulty_progression[difficulty]}

Use these distractor strategies:
${pattern.distractor_strategies}

Output JSON:
{
  "question_text": "...",
  "answer_options": ["A) ...", "B) ...", "C) ...", "D) ..."],
  "correct_answer": "B",
  "explanation": "..."
}
`;

// 2. Call Claude API
const response = await anthropic.messages.create({
  model: "claude-sonnet-4-5",
  messages: [{ role: "user", content: prompt }],
  response_format: { type: "json_object" }
});

// 3. Parse & validate
const question = JSON.parse(response.content);

// 4. Store in database (see Phase 3)
await storeQuestion(question);
```

**Status:** ✅ Ready (35/40 sub-skills can use this)

---

### **PATH B: Simple Visual Questions** (5 sub-skills)

**Examples:**
- Number Matrices & Grid Patterns (HTML table)
- Fractions & Number Lines (SVG)
- Simple Geometry (SVG)
- Logic Puzzles (SVG)
- Data Tables (HTML)

**Process:**
```typescript
// 1. Build prompt (includes visual generation)
const prompt = `
Generate a ${difficulty} difficulty question for ${sub_skill}.

[Same context as PATH A, plus:]

This question requires a visual element.
Generate both the question AND the visual.

Output JSON:
{
  "question_text": "Look at the grid below. What number replaces ?",
  "visual_data": {
    "type": "HTML",
    "content": "<table class='number-matrix'>...</table>",
    "description": "3×3 grid, row 1: 2,4,6, row 2: 3,6,9, row 3: 4,8,?",
    "validation_points": [
      "Table has 3 rows, 3 columns",
      "Row 3, column 3 contains '?'"
    ]
  },
  "answer_options": ["A) 10", "B) 12", "C) 14", "D) 16"],
  "correct_answer": "B",
  "explanation": "Row 3: 4×3 = 12"
}
`;

// 2. Call Claude API
const response = await anthropic.messages.create({ ... });

// 3. Parse & validate
const question = JSON.parse(response.content);

// 4. VALIDATE VISUAL
const isValid = await validateVisual(
  question.visual_data.content,
  question.visual_data.validation_points
);

if (!isValid) {
  // Retry generation or flag for review
}

// 5. Store in database with visual
await storeQuestionWithVisual(question);
```

**Validation Examples:**
- HTML table: Check row/column count, cell values
- SVG number line: Verify tick mark positions
- SVG geometry: Check shape dimensions, labels

**Status:** ⚠️ Ready but needs validation layer

---

### **PATH C: Image Generation Questions** (2 sub-skills)

**Examples:**
- Visual Interpretation (needs actual image to interpret)
- Creative Writing with Visual Stimulus

**Process:**
```typescript
// STEP 1: Generate question + image prompt
const prompt = `
Generate a ${difficulty} difficulty question for ${sub_skill}.

This question requires an image that will be generated by DALL-E.
Generate the question AND a detailed image generation prompt.

Output JSON:
{
  "question_text": "In this picture, the tiger seems to be in:",
  "answer_options": ["A) Contentment", "B) Exuberance", "C) Exhilaration", "D) Misery"],
  "correct_answer": "D",
  "explanation": "...",

  "image_generation_data": {
    "prompt": "A realistic tiger with sad expression, surrounded by circus objects...",
    "style_requirements": ["Realistic illustration", "Clear emotion", ...],
    "validation_criteria": ["Tiger has sad expression", "Circus objects visible", ...]
  }
}
`;

// STEP 2: Call Claude to generate question + prompt
const questionData = await generateQuestionWithImagePrompt(prompt);

// STEP 3: Store as "WIP - awaiting image"
await database.questions.insert({
  ...questionData,
  status: "awaiting_image_generation",
  created_at: new Date()
});

// STEP 4: BATCH IMAGE GENERATION (separate process)
// This runs periodically (e.g., nightly) or when batch size reached

const wipQuestions = await database.questions.findMany({
  where: { status: "awaiting_image_generation" },
  limit: 50
});

for (const q of wipQuestions) {
  // Generate image using DALL-E or Gemini
  const imageUrl = await generateImage(q.image_generation_data.prompt);

  // Upload to Supabase Storage
  const storagePath = await uploadToSupabase(imageUrl);

  // Update question
  await database.questions.update({
    where: { id: q.id },
    data: {
      image_url: storagePath,
      status: "image_generated"
    }
  });
}

// STEP 5: HUMAN REVIEW (optional but recommended)
// Review interface to approve/reject generated images
```

**Status:** ⏳ Two-step process (question now, image later)

---

## 💾 Phase 3: Storage in Supabase

### **Database Tables**

#### **`questions` table:**
```sql
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Metadata
  test_type TEXT NOT NULL,              -- "ACER Scholarship (Year 7 Entry)"
  section TEXT NOT NULL,                -- "Mathematics"
  sub_skill TEXT NOT NULL,              -- "Probability"
  difficulty INTEGER NOT NULL,          -- 1, 2, or 3

  -- Question content
  question_text TEXT NOT NULL,
  answer_options JSONB NOT NULL,        -- ["A) ...", "B) ...", "C) ...", "D) ..."]
  correct_answer TEXT NOT NULL,         -- "B"
  explanation TEXT NOT NULL,

  -- Visual data (nullable for text-only questions)
  visual_type TEXT,                     -- "HTML", "SVG", "Image", null
  visual_content TEXT,                  -- HTML/SVG markup
  visual_description TEXT,              -- Human-readable description
  image_url TEXT,                       -- URL to Supabase Storage for images

  -- Generation metadata
  generated_by TEXT DEFAULT 'claude-sonnet-4-5',
  generated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Status tracking
  status TEXT DEFAULT 'ready',          -- "ready", "awaiting_image_generation", "needs_review"
  reviewed BOOLEAN DEFAULT false,
  reviewer_notes TEXT,

  -- Usage tracking
  times_used INTEGER DEFAULT 0,
  avg_student_score DECIMAL(3,2),

  -- Indexes
  CONSTRAINT valid_difficulty CHECK (difficulty IN (1, 2, 3)),
  CONSTRAINT valid_status CHECK (status IN ('ready', 'awaiting_image_generation', 'needs_review', 'rejected'))
);

-- Indexes for fast queries
CREATE INDEX idx_questions_test_type ON questions(test_type);
CREATE INDEX idx_questions_section ON questions(section);
CREATE INDEX idx_questions_sub_skill ON questions(sub_skill);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_status ON questions(status);
```

#### **`question_images` table (for Path C):**
```sql
CREATE TABLE question_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES questions(id),

  -- Image generation
  generation_prompt TEXT NOT NULL,
  style_requirements JSONB,
  validation_criteria JSONB,

  -- Storage
  image_url TEXT,
  storage_path TEXT,

  -- Generation attempts
  generation_attempts INTEGER DEFAULT 0,
  generated_by TEXT,                    -- "DALL-E 3", "Gemini Imagen"
  generated_at TIMESTAMPTZ,

  -- Review
  approved BOOLEAN DEFAULT false,
  reviewer_notes TEXT
);
```

### **Supabase Storage Buckets:**

```
supabase-storage/
├── question-visuals/
│   ├── number-matrices/
│   │   ├── {question_id}.html
│   ├── geometry/
│   │   ├── {question_id}.svg
│   ├── number-lines/
│   │   ├── {question_id}.svg
│   └── logic-puzzles/
│       ├── {question_id}.svg
│
└── generated-images/
    ├── visual-interpretation/
    │   ├── {question_id}.png
    └── creative-writing/
        ├── {question_id}.png
```

---

## 🎮 Phase 4: Serving Questions to Students

### **Student Drill Flow:**

```
┌──────────────────────────────────────────────────────────────────────┐
│ Student starts drill: "ACER Mathematics - Difficulty 2"              │
└──────────────────────────────────────────────────────────────────────┘
                                ↓
┌──────────────────────────────────────────────────────────────────────┐
│ Query questions table:                                                │
│                                                                       │
│ SELECT * FROM questions                                              │
│ WHERE test_type = 'ACER Scholarship (Year 7 Entry)'                 │
│   AND section = 'Mathematics'                                        │
│   AND difficulty = 2                                                 │
│   AND status = 'ready'                                               │
│ ORDER BY RANDOM()                                                    │
│ LIMIT 10;                                                            │
└──────────────────────────────────────────────────────────────────────┘
                                ↓
┌──────────────────────────────────────────────────────────────────────┐
│ For each question, render appropriate format:                        │
│                                                                       │
│ IF visual_type === 'HTML':                                           │
│   → Inject visual_content into question display                      │
│                                                                       │
│ IF visual_type === 'SVG':                                            │
│   → Render SVG in question display                                   │
│                                                                       │
│ IF image_url !== null:                                               │
│   → Display image from Supabase Storage                              │
│                                                                       │
│ ELSE:                                                                 │
│   → Display text-only question                                       │
└──────────────────────────────────────────────────────────────────────┘
                                ↓
┌──────────────────────────────────────────────────────────────────────┐
│ Student answers → Record result → Update times_used & avg_score     │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Complete System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CURRICULUM DATA (Source)                            │
│  curriculumData_v2/edutest.ts, acer.ts, etc.                               │
│  • 40 sub-skills across 6 test types                                        │
│  • Examples + Patterns for each sub-skill                                   │
│  • Metadata: visual_required, image_type, llm_appropriate                   │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GENERATION ENGINE (Brain)                            │
│  src/lib/question-generation/                                               │
│                                                                              │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────┐                │
│  │ Path A:      │  │ Path B:       │  │ Path C:          │                │
│  │ Text Only    │  │ Simple Visual │  │ Image Generation │                │
│  │ (30 skills)  │  │ (5 skills)    │  │ (2 skills)       │                │
│  └──────┬───────┘  └───────┬───────┘  └────────┬─────────┘                │
│         │                  │                    │                           │
│         └──────────┬───────┴────────────────────┘                           │
│                    ↓                                                         │
│         ┌──────────────────────┐                                            │
│         │  Claude Sonnet 4.5   │                                            │
│         │  API Call            │                                            │
│         └──────────────────────┘                                            │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                          VALIDATION LAYER                                    │
│  • Check JSON structure                                                     │
│  • Validate visual content (if applicable)                                  │
│  • Check answer options make sense                                          │
│  • Verify difficulty matches request                                        │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SUPABASE DATABASE                                   │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────┐            │
│  │ questions table                                             │            │
│  │ • id, test_type, section, sub_skill, difficulty            │            │
│  │ • question_text, answer_options, correct_answer            │            │
│  │ • visual_content (HTML/SVG inline)                         │            │
│  │ • image_url (reference to storage)                         │            │
│  │ • status: "ready" | "awaiting_image_generation"            │            │
│  └────────────────────────────────────────────────────────────┘            │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────┐            │
│  │ Supabase Storage                                            │            │
│  │ • question-visuals/ (HTML/SVG files)                       │            │
│  │ • generated-images/ (PNG/JPG from DALL-E/Gemini)          │            │
│  └────────────────────────────────────────────────────────────┘            │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BATCH IMAGE GENERATION (Async)                            │
│  • Run periodically or on-demand                                            │
│  • Fetch questions with status="awaiting_image_generation"                  │
│  • Call DALL-E 3 / Gemini Imagen with prompts                              │
│  • Upload images to Supabase Storage                                        │
│  • Update questions with image_url + status="ready"                         │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                          STUDENT DRILL SYSTEM                                │
│  • Query questions by test_type, section, difficulty                        │
│  • Render text + visuals (HTML/SVG/images)                                  │
│  • Collect student answers                                                  │
│  • Update usage statistics                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Question Generation Workflow (Step-by-Step)

### **Scenario: Generate 100 ACER Mathematics questions**

```bash
# 1. Admin triggers generation
POST /api/admin/generate-questions
{
  "test_type": "ACER Scholarship (Year 7 Entry)",
  "section": "Mathematics",
  "quantity_per_skill": 10,
  "difficulty_distribution": { "1": 3, "2": 4, "3": 3 }
}
```

**Backend Process:**

```typescript
// Step 1: Load curriculum data
const acerMath = await import('@/data/curriculumData_v2/acer');
const subSkills = acerMath.ACER_SUB_SKILLS['ACER Scholarship (Year 7 Entry) - Mathematics'];

// Step 2: Filter to LLM-appropriate sub-skills
const generatableSkills = Object.entries(subSkills)
  .filter(([name, data]) => data.llm_appropriate === true);

// Returns 5 out of 8 sub-skills:
// - Probability ✅
// - Geometry - Perimeter & Area ✅
// - Fractions & Number Lines ✅
// - Logic Puzzles ✅
// - Data Interpretation ✅
// (Skips: Venn Diagrams, Reflections, 3D Visualization)

// Step 3: Generate questions for each skill
for (const [skillName, skillData] of generatableSkills) {

  // Generate 10 questions (3 easy, 4 medium, 3 hard)
  const difficulties = [1,1,1, 2,2,2,2, 3,3,3];

  for (const difficulty of difficulties) {

    // Determine generation path
    if (skillData.visual_required === false) {
      // PATH A: Text-only
      const question = await generateTextQuestion(skillName, skillData, difficulty);
      await saveQuestion(question);

    } else if (skillData.image_type === "HTML" || skillData.image_type === "SVG") {
      // PATH B: Simple visual
      const question = await generateVisualQuestion(skillName, skillData, difficulty);
      const isValid = await validateVisual(question.visual_data);

      if (isValid) {
        await saveQuestionWithVisual(question);
      } else {
        await retryOrFlag(question);
      }

    } else if (skillData.image_type === "Image Generation") {
      // PATH C: Image generation
      const questionWithPrompt = await generateQuestionWithImagePrompt(skillName, skillData, difficulty);
      await saveWIPQuestion(questionWithPrompt); // Status: awaiting_image_generation
    }
  }
}

// Step 4: Return summary
return {
  total_generated: 50,
  ready_to_use: 40,
  awaiting_images: 0,
  failed: 0,
  skipped_skills: 3
};
```

---

## 📁 File Structure (Proposed)

```
src/
├── data/
│   └── curriculumData_v2/
│       ├── types.ts              ✅ Exists
│       ├── edutest.ts            ✅ Exists (complete)
│       ├── acer.ts               ✅ Exists (complete)
│       ├── nsw-selective.ts      📝 Placeholder
│       ├── vic-selective.ts      📝 Placeholder
│       ├── naplan-year5.ts       📝 Placeholder
│       └── naplan-year7.ts       📝 Placeholder
│
├── lib/
│   └── question-generation/
│       ├── index.ts                    🆕 Main orchestrator
│       ├── generators/
│       │   ├── text-only.ts            🆕 PATH A
│       │   ├── simple-visual.ts        🆕 PATH B
│       │   └── image-prompt.ts         🆕 PATH C
│       ├── validators/
│       │   ├── html-validator.ts       🆕 Validate HTML tables
│       │   ├── svg-validator.ts        🆕 Validate SVG content
│       │   └── question-validator.ts   🆕 General validation
│       ├── prompts/
│       │   ├── base-prompt.ts          🆕 Shared prompt templates
│       │   └── visual-prompt.ts        🆕 Visual-specific prompts
│       └── utils/
│           ├── curriculum-loader.ts    🆕 Load curriculum data
│           └── anthropic-client.ts     🆕 Claude API wrapper
│
├── app/
│   └── api/
│       └── admin/
│           ├── generate-questions/
│           │   └── route.ts            🆕 Admin endpoint
│           └── batch-generate-images/
│               └── route.ts            🆕 Image gen batch job
│
└── supabase/
    └── migrations/
        └── YYYYMMDD_create_questions_tables.sql  🆕 Database schema
```

---

## 🚀 Implementation Phases

### **Phase 1: Foundation (Week 1)**
- ✅ Curriculum data complete (DONE)
- 🆕 Database schema
- 🆕 Basic generation engine (PATH A: text-only)
- 🆕 Admin API endpoint

**Deliverable:** Can generate text-only questions for 30 sub-skills

### **Phase 2: Simple Visuals (Week 2)**
- 🆕 PATH B: HTML table generation (number matrices, data tables)
- 🆕 HTML validation layer
- 🆕 Storage integration

**Deliverable:** Can generate questions with HTML tables

### **Phase 3: SVG Support (Week 3)**
- 🆕 PATH B: SVG generation (number lines, simple shapes)
- 🆕 SVG validation layer
- 🆕 More complex visual questions

**Deliverable:** Can generate questions with simple SVG

### **Phase 4: Image Generation Pipeline (Week 4)**
- 🆕 PATH C: Image prompt generation
- 🆕 WIP queue system
- 🆕 Batch image generation job
- 🆕 DALL-E/Gemini integration

**Deliverable:** Can generate image-based questions (2-step process)

### **Phase 5: Remaining Test Types (Ongoing)**
- 📝 NSW Selective curriculum data
- 📝 VIC Selective curriculum data
- 📝 NAPLAN Year 5 & 7 curriculum data

**Deliverable:** Full coverage of all test types

---

## 📊 Expected Coverage

### **After Phase 1:**
- 30/40 sub-skills working (75%)
- ~1,200 questions generated (30 skills × 40 questions each)

### **After Phase 2:**
- 32/40 sub-skills working (80%)
- +80 questions with HTML tables

### **After Phase 3:**
- 35/40 sub-skills working (87.5%)
- +120 questions with SVG visuals

### **After Phase 4:**
- 37/40 sub-skills working (92.5%)
- +80 questions with image generation (awaiting images)

### **Permanently Skipped:**
- 3/40 sub-skills (7.5%)
- Venn Diagrams, 3D Visualization, Mirror Reflections
- Too complex for reliable LLM generation

---

## 💡 Key Decisions Summary

1. **37 out of 40 sub-skills** can be generated by LLM
2. **3 paths** based on visual complexity
3. **Supabase** for storage (database + file storage)
4. **Batch image generation** for DALL-E/Gemini questions
5. **Validation layer** for HTML/SVG quality control
6. **WIP status** for questions awaiting images
7. **Skip 3 sub-skills** that are too complex

---

## ❓ Open Questions

1. How many questions per sub-skill do you want? (Suggest: 30-50 each)
2. Should we implement human review for generated questions?
3. What's the budget for DALL-E/Gemini API calls?
4. Do you want A/B testing of different question styles?
5. Should we track which questions students struggle with?

