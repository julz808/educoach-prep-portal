# Multi-Product Question Generation Architecture
## Scaling from 1 to 6 Test Products with Unified Engine

**Context**: Extending proven Verbal Reasoning approach to all 6 products
**Products**: EduTest, ACER, NSW Selective, VIC Selective, Year 5 NAPLAN, Year 7 NAPLAN
**Challenge**: Maintain product authenticity while sharing common infrastructure

---

## The Scaling Challenge

### What We're Dealing With:

**6 Products** × **~4 Sections Each** × **~8 Question Types** = **~192 unique question type variants**

Example breakdown:
- **EduTest**: Reading (8 types), Verbal (8 types), Math (10 types), Numerical (8 types), Writing (6 types)
- **ACER**: Writing (6 types), Math (10 types), Humanities (8 types)
- **NSW Selective**: Reading (8 types), Math (10 types), Thinking Skills (12 types), Writing (6 types)
- **VIC Selective**: Reading (8 types), Math (10 types), Verbal (8 types), Quantitative (8 types), Writing (6 types)
- **Year 5 NAPLAN**: Reading (8 types), Writing (6 types), Language (10 types), Numeracy (12 types)
- **Year 7 NAPLAN**: Reading (8 types), Writing (6 types), Language (10 types), Numeracy (12 types)

### Common Patterns Across Products:
✅ **Reading sections**: Similar question types (inference, main idea, vocabulary)
✅ **Math sections**: Similar problem types (algebra, geometry, word problems)
✅ **Writing sections**: All have prompt-based questions
✅ **Verbal/Thinking**: Logic, analogies, sequences

### Product-Specific Differences:
⚠️ **Question style**: EduTest is more formal than NAPLAN
⚠️ **Difficulty calibration**: VIC Selective is harder than Year 5 NAPLAN
⚠️ **Vocabulary**: ACER uses more sophisticated language
⚠️ **Format quirks**: Each test has unique presentation styles

---

## Architecture Option 1: Hierarchical Prompt Composition ⭐ **RECOMMENDED**

### Concept: Layer prompts from general → specific

```
┌─────────────────────────────────────┐
│  BASE PROMPT (All Products)         │  ← UK spelling, Supabase schema, validation rules
├─────────────────────────────────────┤
│  PRODUCT PROMPT (e.g., EduTest)     │  ← Test-specific style, difficulty calibration
├─────────────────────────────────────┤
│  SECTION PROMPT (e.g., Verbal)      │  ← Section-specific patterns
├─────────────────────────────────────┤
│  QUESTION TYPE (e.g., Synonym)      │  ← Specific template + examples
└─────────────────────────────────────┘
```

### Implementation:

```typescript
// File structure
/src/engines/questionGeneration/prompts/
  ├── base/
  │   ├── common-requirements.md          // UK spelling, output format, etc.
  │   └── validation-rules.md             // Distractor validation, explanation style
  │
  ├── products/
  │   ├── edutest.md                      // EduTest-specific style guide
  │   ├── acer.md                         // ACER-specific style guide
  │   ├── nsw-selective.md
  │   ├── vic-selective.md
  │   ├── year5-naplan.md
  │   └── year7-naplan.md
  │
  ├── sections/
  │   ├── reading/
  │   │   ├── common-reading.md           // Shared reading patterns
  │   │   ├── edutest-reading.md          // EduTest reading specifics
  │   │   └── acer-humanities.md          // ACER humanities (treated as reading)
  │   │
  │   ├── verbal/
  │   │   ├── common-verbal.md
  │   │   ├── edutest-verbal.md
  │   │   └── vic-verbal.md
  │   │
  │   ├── math/
  │   │   ├── common-math.md
  │   │   ├── edutest-math.md
  │   │   └── naplan-numeracy.md
  │   │
  │   └── writing/
  │       └── common-writing.md           // Writing is similar across all
  │
  └── question-types/
      ├── synonym.md                      // Generic synonym template
      ├── analogy.md
      ├── word-problem.md
      └── inference.md

// Generation code
async function buildPrompt(context: GenerationContext): Promise<string> {
  const layers = [
    readFile('prompts/base/common-requirements.md'),
    readFile('prompts/base/validation-rules.md'),
    readFile(`prompts/products/${context.testType}.md`),
    readFile(`prompts/sections/${context.section}/${context.testType}-${context.section}.md`),
    readFile(`prompts/question-types/${context.questionType}.md`)
  ];

  // Compose layers with context variables
  const composedPrompt = layers
    .map(layer => interpolateVariables(layer, context))
    .join('\n\n---\n\n');

  return composedPrompt;
}

// Example usage
const prompt = await buildPrompt({
  testType: 'edutest',
  section: 'verbal',
  questionType: 'synonym',
  difficulty: 1,
  yearLevel: 7
});
```

### Prompt Layer Examples:

**Layer 1: Base Common Requirements** (`base/common-requirements.md`)
```markdown
# Universal Question Generation Requirements

## Language Standards
- UK/Australian English spelling (colour, centre, realise)
- No American spelling (color, center, realize)
- Professional, clear language

## Output Format
Return valid JSON matching Supabase schema:
{
  "question_text": "string (10-500 chars)",
  "answer_options": ["A", "B", "C", "D", "E"],
  "correct_answer": "string (must match one option exactly)",
  "solution": "string (explanation, 1-3 sentences)",
  "difficulty": number (1-3),
  "sub_skill": "string",
  "response_type": "multiple_choice" | "extended_response",
  "test_mode": "diagnostic" | "practice_1" | "drill"
}

## Quality Requirements
✓ Exactly ONE unambiguous correct answer
✓ All distractors must be definitively wrong
✓ No cultural bias or region-specific knowledge
✓ Age-appropriate content
✓ Clear, professional presentation
```

**Layer 2: Product-Specific** (`products/edutest.md`)
```markdown
# EduTest Scholarship Test - Style Guide

## Test Characteristics
- **Audience**: Private school scholarship candidates (Year 7 entry)
- **Tone**: Formal, sophisticated, academically rigorous
- **Difficulty**: Moderately challenging (top 30% of students)
- **Style**: Clean, professional presentation

## Language Complexity
- Use formal, academic vocabulary where appropriate
- Avoid overly casual or colloquial language
- Balance sophistication with clarity

## Question Presentation
- Questions should feel polished and professional
- Avoid overly playful or whimsical scenarios
- Use realistic, meaningful contexts

## Explanation Style
- Concise (1-2 sentences)
- Clear logical reasoning
- Professional tone
- Common phrase: "Process of elimination" when appropriate

## Difficulty Calibration
- Difficulty 1 (Easy): Accessible to average Year 7 student
- Difficulty 2 (Medium): Requires careful thinking, top 50%
- Difficulty 3 (Hard): Challenging for top 30% of students
```

**Layer 3: Section-Specific** (`sections/verbal/edutest-verbal.md`)
```markdown
# EduTest - Verbal Reasoning Section

## Section Overview
Tests logical thinking and language reasoning skills through 8 question types.

## Question Type Distribution
1. Synonyms (15%)
2. Antonyms (10%)
3. Analogies (20%)
4. Foreign Language Decoding (15%)
5. Odd One Out (10%)
6. Anagrams (10%)
7. Logical Deduction (15%)
8. Sequencing (5%)

## Vocabulary Guidelines

### Year 7 (Difficulty 1)
Common, everyday vocabulary:
- Verbs: repair, mend, change, alter, fix, break
- Adjectives: happy, sad, big, small, sufficient, inadequate
- Concrete concepts preferred

### Year 8 (Difficulty 2)
Intermediate vocabulary:
- More sophisticated but accessible
- Some abstract concepts
- Academic language emerging

### Year 9 (Difficulty 3)
Academic vocabulary:
- Formal, nuanced language
- Abstract concepts
- Requires deeper understanding

## Format Standards
- Always 5 options (A, B, C, D, E)
- Option E can be "None of these" for some question types
- Clean text-only presentation
- No images or diagrams

## Distractor Strategy
All distractors must be plausible but definitively wrong.
Common distractor patterns per question type documented in question-type prompts.
```

**Layer 4: Question Type Template** (`question-types/synonym.md`)
```markdown
# Synonym Questions - Universal Template

## Format
"Which of the following words is similar to [TARGET_WORD]?"

## Structure
- Target word: Capitalized in question
- 5 options: One correct synonym, 4 distractors
- Explanation: "Both '[word1]' and '[word2]' mean [definition]."

## Distractor Strategy (Universal)
Your 4 incorrect options should include:
1. One ANTONYM (catches students who confuse similar/opposite)
2. One RELATED WORD (same semantic field, not synonym)
3. Two UNRELATED WORDS (plausible but wrong)

## Critical Requirements
✓ Synonym must be same part of speech as target
✓ Synonym must be unambiguous (no "close but not quite")
✓ All distractors definitively wrong
✓ No duplicate meanings among options

## Examples (adapt vocabulary to product difficulty)

### Example 1 (Easy):
{
  "question_text": "Which of the following words is similar to REPAIR?",
  "answer_options": ["broken", "mend", "detach", "remove", "smash"],
  "correct_answer": "mend",
  "explanation": "Both 'repair' and 'mend' mean to fix something that is broken.",
  "distractor_analysis": {
    "broken": "Antonym - state of needing repair",
    "detach": "Related but different action",
    "remove": "Related but different action",
    "smash": "Antonym - causes damage"
  }
}

### Example 2 (Medium):
{
  "question_text": "Which of the following words is similar to CHANGE?",
  "answer_options": ["keep", "alter", "new", "give", "chance"],
  "correct_answer": "alter",
  "explanation": "Change and alter both mean to make something different.",
  "distractor_analysis": {
    "keep": "Antonym - maintaining without change",
    "new": "Related - result of change, not the action",
    "give": "Unrelated",
    "chance": "Similar spelling, unrelated meaning"
  }
}

## Vocabulary Selection by Difficulty
- Difficulty 1: Common everyday words (100-500 most frequent)
- Difficulty 2: Intermediate vocabulary (500-2000 most frequent)
- Difficulty 3: Academic vocabulary (2000+ frequency rank)
```

### Advantages:
✅ **DRY Principle**: Common rules written once, reused everywhere
✅ **Easy Updates**: Change base prompt → affects all products
✅ **Product Authenticity**: Each product's style preserved in its layer
✅ **Maintainable**: Clear separation of concerns
✅ **Flexible**: Can override specific layers when needed
✅ **Testable**: Can test each layer independently

### Disadvantages:
⚠️ **Complexity**: Need to understand layer hierarchy
⚠️ **Debugging**: Issues could be in any layer
⚠️ **Large Prompts**: Composing all layers = long prompts

### When to Use:
- ✅ You want maximum reusability
- ✅ You have common patterns across products
- ✅ You want to maintain product-specific authenticity
- ✅ You'll be updating requirements frequently

---

## Architecture Option 2: Schema-Driven Generation

### Concept: Define everything in JSON schemas, engine reads and generates

```typescript
// Schema structure
interface QuestionTypeSchema {
  id: string;
  name: string;
  products: string[];  // Which products use this type
  format: string;      // Question format template
  examples: Example[]; // Few-shot examples
  validation: ValidationRules;
  distractor_strategy: DistractorStrategy;
  difficulty_indicators: DifficultyIndicators;
}

// Example schema file: schemas/question-types/synonym.json
{
  "id": "synonym",
  "name": "Synonym Identification",
  "products": ["edutest", "vic-selective", "nsw-selective"],
  "sections": ["verbal-reasoning"],

  "format": {
    "question_template": "Which of the following words is similar to {{TARGET_WORD}}?",
    "options_count": 5,
    "response_type": "multiple_choice"
  },

  "distractor_strategy": {
    "required": [
      {
        "type": "antonym",
        "count": 1,
        "description": "Opposite meaning to catch confusion"
      },
      {
        "type": "related",
        "count": 1,
        "description": "Same semantic field, not synonym"
      },
      {
        "type": "unrelated",
        "count": 2,
        "description": "Plausible but wrong"
      }
    ]
  },

  "explanation_format": "Both '{{word1}}' and '{{word2}}' mean {{definition}}.",

  "difficulty_indicators": {
    "1": {
      "vocabulary_frequency": "top-500",
      "part_of_speech": "common-verbs-adjectives",
      "examples": ["repair", "happy", "big"]
    },
    "2": {
      "vocabulary_frequency": "500-2000",
      "part_of_speech": "all",
      "examples": ["change", "sufficient", "alter"]
    },
    "3": {
      "vocabulary_frequency": "2000+",
      "part_of_speech": "all",
      "examples": ["document", "serene", "activist"]
    }
  },

  "product_variations": {
    "edutest": {
      "tone": "formal-academic",
      "vocabulary_sophistication": "high"
    },
    "naplan": {
      "tone": "clear-accessible",
      "vocabulary_sophistication": "moderate"
    }
  },

  "examples": [
    {
      "difficulty": 1,
      "product": "edutest",
      "question_text": "Which of the following words is similar to REPAIR?",
      "answer_options": ["broken", "mend", "detach", "remove", "smash"],
      "correct_answer": "mend",
      "explanation": "Both 'repair' and 'mend' mean to fix something that is broken."
    }
  ]
}
```

```typescript
// Generation engine
class SchemaBasedGenerator {
  private schemas: Map<string, QuestionTypeSchema>;

  async generateQuestion(
    product: string,
    section: string,
    questionType: string,
    difficulty: number
  ): Promise<Question> {
    // Load schema
    const schema = this.schemas.get(questionType);

    // Build prompt from schema
    const prompt = this.buildPromptFromSchema(schema, {
      product,
      section,
      difficulty
    });

    // Generate using Claude
    const response = await callClaude(prompt);

    // Validate against schema
    const valid = this.validateAgainstSchema(response, schema);

    return valid ? response : this.regenerate();
  }

  private buildPromptFromSchema(
    schema: QuestionTypeSchema,
    context: GenerationContext
  ): string {
    // Compose prompt from schema components
    return `
You are generating a ${schema.name} question for ${context.product}.

FORMAT:
${schema.format.question_template}

DISTRACTOR STRATEGY:
${schema.distractor_strategy.required.map(d => `- ${d.description}`).join('\n')}

DIFFICULTY ${context.difficulty} GUIDELINES:
Vocabulary: ${schema.difficulty_indicators[context.difficulty].vocabulary_frequency}
Examples: ${schema.difficulty_indicators[context.difficulty].examples.join(', ')}

PRODUCT-SPECIFIC STYLE:
${schema.product_variations[context.product].tone}
Vocabulary sophistication: ${schema.product_variations[context.product].vocabulary_sophistication}

EXAMPLES:
${schema.examples.filter(ex => ex.difficulty === context.difficulty && ex.product === context.product)
  .map(ex => JSON.stringify(ex, null, 2)).join('\n\n')}

Generate a new question following this exact schema.
Return valid JSON.
    `;
  }
}
```

### Advantages:
✅ **Data-Driven**: All config in JSON, easy to edit
✅ **Versionable**: Can version schemas independently
✅ **Testable**: Easy to validate schema compliance
✅ **Portable**: Schemas can be used by other tools
✅ **UI-Friendly**: Can build admin UI to edit schemas
✅ **Type-Safe**: TypeScript interfaces for schemas

### Disadvantages:
⚠️ **Complex Schemas**: JSON can get large and unwieldy
⚠️ **Limited Flexibility**: Harder to express complex logic in JSON
⚠️ **Learning Curve**: Team needs to understand schema structure
⚠️ **Duplication**: Some info repeated across schemas

### When to Use:
- ✅ You want a GUI to manage question types
- ✅ You have non-technical team members editing configs
- ✅ You want strict validation
- ✅ You plan to version question types independently

---

## Architecture Option 3: Modular Plugin System

### Concept: Core engine + product-specific plugins

```typescript
// Core engine (shared)
abstract class QuestionGenerator {
  abstract getProductStyle(): ProductStyle;
  abstract getSectionPatterns(): SectionPattern[];
  abstract getQuestionTypes(): QuestionType[];

  async generate(context: GenerationContext): Promise<Question> {
    const prompt = this.buildPrompt(context);
    const response = await this.callLLM(prompt);
    return this.validate(response);
  }

  protected buildPrompt(context: GenerationContext): string {
    // Common prompt building logic
    return this.composePrompt([
      this.getBasePrompt(),
      this.getProductPrompt(context),
      this.getSectionPrompt(context),
      this.getQuestionTypePrompt(context)
    ]);
  }
}

// Product-specific plugin
class EdutestGenerator extends QuestionGenerator {
  getProductStyle(): ProductStyle {
    return {
      tone: 'formal-academic',
      difficulty_calibration: {
        easy: 'top-50-percentile',
        medium: 'top-30-percentile',
        hard: 'top-10-percentile'
      },
      explanation_style: 'concise-professional'
    };
  }

  getSectionPatterns(): SectionPattern[] {
    return [
      {
        name: 'Verbal Reasoning',
        question_types: [
          new SynonymQuestionType(),
          new AnalogyQuestionType(),
          // ... more types
        ]
      },
      {
        name: 'Reading Comprehension',
        question_types: [
          new InferenceQuestionType(),
          new MainIdeaQuestionType(),
          // ... more types
        ]
      }
    ];
  }
}

// Usage
const generators = {
  'edutest': new EdutestGenerator(),
  'acer': new AcerGenerator(),
  'nsw-selective': new NSWSelectiveGenerator(),
  'vic-selective': new VICSelectiveGenerator(),
  'year5-naplan': new Year5NaplanGenerator(),
  'year7-naplan': new Year7NaplanGenerator()
};

// Generate question
const question = await generators['edutest'].generate({
  section: 'verbal',
  questionType: 'synonym',
  difficulty: 2
});
```

### Advantages:
✅ **Modular**: Each product is isolated
✅ **Type-Safe**: TypeScript classes with interfaces
✅ **Flexible**: Can override any method per product
✅ **Testable**: Can test each product independently
✅ **IDE Support**: Great autocomplete and type checking

### Disadvantages:
⚠️ **Code Duplication**: Similar products might duplicate code
⚠️ **Harder to Share**: Common patterns need to be in base class
⚠️ **More Files**: Separate file per product

### When to Use:
- ✅ Products are significantly different
- ✅ You have TypeScript/programming expertise
- ✅ You want strong type safety
- ✅ Products will evolve independently

---

## Architecture Option 4: Hybrid (Hierarchical + Schema) ⭐ **BEST FOR SCALE**

### Concept: Combine best of both worlds

```
Base Prompts (Markdown)
    ↓
Product Schemas (JSON) → Defines structure, rules, examples
    ↓
Section Prompts (Markdown) → Specific guidance
    ↓
Question Type Schemas (JSON) → Templates + validation
    ↓
Runtime Composition → Build final prompt
```

```typescript
interface HybridGenerationSystem {
  // Base prompts (markdown files)
  base: {
    common_requirements: string;  // UK spelling, output format
    validation_rules: string;     // Distractor validation
  };

  // Product schemas (JSON)
  products: {
    [productName: string]: ProductSchema;
  };

  // Question type templates (JSON + markdown)
  questionTypes: {
    [typeName: string]: QuestionTypeTemplate;
  };
}

// Product schema (JSON for structure)
interface ProductSchema {
  name: string;
  style: {
    tone: string;
    formality: 'casual' | 'professional' | 'academic';
    vocabulary_level: 'basic' | 'intermediate' | 'advanced';
  };
  sections: SectionConfig[];
  difficulty_calibration: DifficultyConfig;
  examples_per_type: number;
}

// Question type template (JSON + markdown prompt)
interface QuestionTypeTemplate {
  schema: QuestionTypeSchema;      // Structure (JSON)
  prompt_guidance: string;         // Detailed guidance (markdown)
  examples: Example[];             // Few-shot examples
  validation_rules: ValidationRule[];
}

// Generation
class HybridGenerator {
  async generate(context: GenerationContext): Promise<Question> {
    // Load components
    const basePrompt = this.loadBasePrompts();
    const productSchema = this.loadProductSchema(context.product);
    const questionTemplate = this.loadQuestionTemplate(context.questionType);

    // Compose prompt
    const prompt = this.compose({
      base: basePrompt,
      product: {
        schema: productSchema,
        style: this.renderProductStyle(productSchema)
      },
      questionType: {
        schema: questionTemplate.schema,
        guidance: questionTemplate.prompt_guidance,
        examples: this.selectExamples(questionTemplate, context)
      }
    });

    // Generate and validate
    const response = await callClaude(prompt);
    const validated = await this.validate(response, questionTemplate.validation_rules);

    return validated;
  }
}
```

### File Structure:

```
/src/engines/questionGeneration/
  ├── base/
  │   ├── common-requirements.md
  │   └── validation-rules.md
  │
  ├── products/
  │   ├── schemas/
  │   │   ├── edutest.json
  │   │   ├── acer.json
  │   │   ├── nsw-selective.json
  │   │   ├── vic-selective.json
  │   │   ├── year5-naplan.json
  │   │   └── year7-naplan.json
  │   │
  │   └── styles/
  │       ├── edutest-style.md
  │       ├── acer-style.md
  │       └── naplan-style.md
  │
  ├── question-types/
  │   ├── synonym/
  │   │   ├── schema.json           // Structure, validation rules
  │   │   ├── guidance.md           // Detailed prompt guidance
  │   │   └── examples.json         // Few-shot examples
  │   │
  │   ├── analogy/
  │   │   ├── schema.json
  │   │   ├── guidance.md
  │   │   └── examples.json
  │   │
  │   └── ... (one folder per question type)
  │
  ├── generators/
  │   ├── hybrid-generator.ts       // Main generation engine
  │   ├── prompt-composer.ts        // Composes prompts from components
  │   └── validators.ts             // Validation logic
  │
  └── utils/
      ├── schema-loader.ts
      └── template-renderer.ts
```

### Example Product Schema (`products/schemas/edutest.json`):

```json
{
  "name": "EduTest Scholarship",
  "target_audience": "Year 7 entry, private school candidates",

  "style": {
    "tone": "formal-academic",
    "formality": "professional",
    "vocabulary_level": "advanced",
    "presentation": "polished-sophisticated"
  },

  "sections": [
    {
      "name": "Verbal Reasoning",
      "question_types": ["synonym", "antonym", "analogy", "foreign_language", "odd_one_out", "anagram", "logical_deduction", "sequencing"],
      "distribution": {
        "synonym": 0.15,
        "antonym": 0.10,
        "analogy": 0.20,
        "foreign_language": 0.15,
        "odd_one_out": 0.10,
        "anagram": 0.10,
        "logical_deduction": 0.15,
        "sequencing": 0.05
      }
    },
    {
      "name": "Reading Comprehension",
      "question_types": ["inference", "main_idea", "vocabulary", "detail", "author_purpose"],
      "requires_passages": true
    }
  ],

  "difficulty_calibration": {
    "1": {
      "percentile": "50-80",
      "description": "Accessible to above-average students"
    },
    "2": {
      "percentile": "30-50",
      "description": "Challenging for average students"
    },
    "3": {
      "percentile": "10-30",
      "description": "Top tier students"
    }
  },

  "explanation_style": {
    "max_sentences": 2,
    "tone": "clear-professional",
    "common_phrases": ["Process of elimination", "Both X and Y mean..."]
  },

  "examples_per_type": 3,
  "validation": {
    "strict_mode": true,
    "require_independent_distractor_verification": true
  }
}
```

### Example Question Type Schema (`question-types/synonym/schema.json`):

```json
{
  "id": "synonym",
  "name": "Synonym Identification",
  "category": "vocabulary",

  "applicable_products": ["edutest", "vic-selective", "nsw-selective"],
  "applicable_sections": ["verbal-reasoning"],

  "format": {
    "question_template": "Which of the following words is similar to {{TARGET_WORD}}?",
    "response_type": "multiple_choice",
    "options_count": 5,
    "options_format": ["A", "B", "C", "D", "E"]
  },

  "generation_rules": {
    "target_word": {
      "must_be": "capitalized",
      "part_of_speech": ["verb", "adjective", "noun"],
      "avoid": ["proper_nouns", "technical_jargon"]
    },

    "correct_answer": {
      "must_match_pos": true,
      "must_be_unambiguous": true,
      "similarity_threshold": 0.9
    },

    "distractors": {
      "required_types": [
        {"type": "antonym", "count": 1},
        {"type": "related_word", "count": 1},
        {"type": "unrelated", "count": 2}
      ],
      "avoid": ["near_synonyms", "contextual_synonyms"]
    }
  },

  "validation": {
    "distractor_verification": {
      "required": true,
      "method": "independent_llm_check",
      "each_must_be_definitively_wrong": true
    },

    "explanation": {
      "format": "Both '{{word1}}' and '{{word2}}' mean {{definition}}.",
      "max_sentences": 2,
      "required_elements": ["both_words", "meaning"]
    }
  },

  "difficulty_indicators": {
    "1": {
      "vocabulary_frequency_rank": "0-500",
      "semantic_field": "concrete-everyday",
      "examples": ["repair", "happy", "big", "fast"]
    },
    "2": {
      "vocabulary_frequency_rank": "500-2000",
      "semantic_field": "intermediate-abstract",
      "examples": ["change", "sufficient", "alter", "adequate"]
    },
    "3": {
      "vocabulary_frequency_rank": "2000+",
      "semantic_field": "academic-formal",
      "examples": ["document", "serene", "advocate", "meticulous"]
    }
  }
}
```

### Advantages:
✅ **Best of Both**: Structure (JSON) + Flexibility (markdown)
✅ **Maintainable**: Clear separation of data vs. guidance
✅ **Scalable**: Easy to add new products/question types
✅ **Versionable**: Can version schemas and prompts independently
✅ **Developer-Friendly**: TypeScript + JSON + markdown
✅ **Non-Developer-Friendly**: Can edit JSON schemas with UI

### Disadvantages:
⚠️ **Most Complex**: Requires understanding multiple systems
⚠️ **Initial Setup**: More upfront work to build

### When to Use:
- ✅ Long-term project with 6+ products ← **YOUR CASE**
- ✅ Mix of technical and non-technical maintainers
- ✅ Need both flexibility and structure
- ✅ Planning to scale significantly

---

## Comparison Matrix

| Aspect | Hierarchical Prompts | Schema-Driven | Plugin System | Hybrid |
|--------|---------------------|---------------|---------------|--------|
| **Setup Complexity** | Medium | High | Medium | High |
| **Maintenance** | Easy | Medium | Medium | Easy |
| **Flexibility** | High | Medium | High | Very High |
| **Type Safety** | Low | High | High | High |
| **Non-Dev Friendly** | Medium | High | Low | High |
| **Scalability** | Good | Very Good | Good | Excellent |
| **DRY Principle** | Excellent | Good | Medium | Excellent |
| **Testability** | Medium | High | High | High |
| **Best For** | Quick start | GUI editing | Different products | Long-term scale |

---

## My Recommendation for Your Use Case

### **Use Option 4: Hybrid (Hierarchical + Schema)** ⭐

**Why**:
1. **You have 6 products** - need structured approach
2. **Products share patterns** (reading, math, writing) - hierarchical composition helps
3. **Products differ in style** (EduTest formal, NAPLAN accessible) - schemas capture this
4. **Long-term project** - worth the upfront investment
5. **Will scale** - easy to add new products/question types

### Implementation Roadmap:

**Phase 1: Foundation (Week 1)**
- [ ] Set up file structure
- [ ] Create base prompts (common-requirements.md, validation-rules.md)
- [ ] Build prompt composer utility

**Phase 2: First Product (Week 2)**
- [ ] Create EduTest schema (edutest.json)
- [ ] Document 3 question types (synonym, analogy, logical_deduction)
- [ ] Create schemas + examples for these 3 types
- [ ] Test generation with 50 questions

**Phase 3: Validate & Refine (Week 3)**
- [ ] Compare generated to real questions
- [ ] Refine schemas based on results
- [ ] Add remaining EduTest question types
- [ ] Generate 500 questions for validation

**Phase 4: Scale to Other Products (Week 4-8)**
- [ ] Create schemas for remaining 5 products
- [ ] Document product-specific styles
- [ ] Reuse question type schemas where possible
- [ ] Test each product with 100 questions

**Phase 5: Production (Week 9+)**
- [ ] Generate full question banks (10,000+ questions)
- [ ] Build admin UI for schema editing (optional)
- [ ] Set up monitoring and quality metrics
- [ ] Continuous improvement based on student data

---

## Code Example: Complete Hybrid System

```typescript
// hybrid-generator.ts
export class HybridQuestionGenerator {
  private basePrompts: BasePrompts;
  private productSchemas: Map<string, ProductSchema>;
  private questionTypeTemplates: Map<string, QuestionTypeTemplate>;

  constructor() {
    this.loadAllConfigs();
  }

  async generateQuestion(request: GenerationRequest): Promise<Question> {
    // 1. Load components
    const productSchema = this.productSchemas.get(request.testType);
    const questionTemplate = this.questionTypeTemplates.get(request.questionType);

    // 2. Compose prompt
    const prompt = this.composePrompt({
      base: this.basePrompts,
      product: productSchema,
      questionType: questionTemplate,
      context: request
    });

    // 3. Generate
    const response = await this.callClaude(prompt, {
      temperature: 0.8,
      max_tokens: 1500
    });

    // 4. Validate
    const question = this.parseResponse(response);
    const validation = await this.validate(question, questionTemplate);

    if (!validation.valid) {
      console.log(`Validation failed: ${validation.errors.join(', ')}`);
      return this.regenerate(request);
    }

    return question;
  }

  private composePrompt(components: PromptComponents): string {
    const sections = [
      // Base requirements
      components.base.common_requirements,
      components.base.validation_rules,

      // Product style
      this.renderProductStyle(components.product),

      // Question type guidance
      components.questionType.guidance,

      // Examples (few-shot)
      this.renderExamples(
        components.questionType.examples,
        components.context.difficulty,
        components.context.testType
      ),

      // Generation instruction
      this.buildGenerationInstruction(components.context)
    ];

    return sections.join('\n\n---\n\n');
  }

  private async validate(
    question: Question,
    template: QuestionTypeTemplate
  ): Promise<ValidationResult> {
    const checks = [
      // Structural validation
      await this.validateStructure(question, template.schema),

      // Distractor validation
      await this.validateDistractors(question),

      // Explanation validation
      this.validateExplanation(question, template.schema.validation.explanation),

      // Product-specific validation
      await this.validateProductStyle(question, this.productSchemas.get(question.test_type))
    ];

    const errors = checks.flatMap(check => check.errors);

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Usage
const generator = new HybridQuestionGenerator();

const question = await generator.generateQuestion({
  testType: 'edutest',
  section: 'verbal',
  questionType: 'synonym',
  difficulty: 2,
  testMode: 'practice_1'
});

console.log('Generated:', question);
```

---

## Next Steps

1. **Choose architecture** (I recommend Hybrid)
2. **Analyze remaining products**:
   - Get sample questions for each product × section
   - I'll extract patterns like I did for EduTest Verbal
3. **Build schemas incrementally**:
   - Start with 1 product (EduTest)
   - Validate quality
   - Expand to other products
4. **Create reusable question type library**:
   - Many question types shared across products
   - Build once, configure per product

**Want me to help build this?** I can:
- Create the file structure
- Build the hybrid generator
- Document your next product (what should we analyze next?)

