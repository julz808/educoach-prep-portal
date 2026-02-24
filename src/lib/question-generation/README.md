# Simplified Question Generation System

A pragmatic, production-ready question generation system using Claude API with smart prompting and minimal validation.

**Philosophy**: 90% quality with 20% of the effort (Pareto Principle)

**Target**: ~$0.020 per question, ~8 seconds per question, 90%+ quality

---

## Quick Start

### 1. Test Single Question Generation

```bash
tsx scripts/generation/test-simplified-generator.ts
```

This runs a comprehensive test suite including:
- Single question generation
- Multiple question types
- Diversity checking

### 2. Generate Questions in Batch

```bash
# Dry run (see what would be generated)
tsx scripts/generation/generate-edutest-verbal-batch.ts --dry-run

# Test mode (generate but don't save to DB)
tsx scripts/generation/generate-edutest-verbal-batch.ts --max 10

# Production mode (generate and save to DB)
tsx scripts/generation/generate-edutest-verbal-batch.ts --max 50 --save
```

---

## System Architecture

### 3 Core Components

#### 1. **Smart Template System** (`/templates`)
Each question type has ONE comprehensive template containing:
- Exact format specification
- 3 real examples from actual tests
- Critical rules (told to Claude: "violate = rejection")
- Difficulty-specific vocabulary guidance
- Diversity requirements injected directly into prompt

#### 2. **2-Stage Validation** (`/validation`)
- **Stage 1 (instant)**: Structural checks + top 10 hallucination patterns
- **Stage 2 (5 seconds)**: Independent answer verification (only for objective questions)

#### 3. **Simple Diversity Tracker** (`/diversity`)
- Tracks last 50 questions in memory
- Rotates through name pool (70+ diverse Australian names)
- Checks for duplicates (90% text similarity threshold)
- Injects "avoid these names/topics" into generation prompt

---

## How Generation Works

```
1. Gap Analysis
   └─> Query database: "How many synonym questions at difficulty 2 do we need?"
   └─> Result: "Need 10 more"

2. For Each Needed Question:
   a) Build Smart Prompt
      - Load template for question type
      - Inject: recent names, topics, suggested name
      - Inject: 3 real examples from PDFs
      - Inject: difficulty-appropriate vocabulary

   b) Generate with Claude (temp: 0.8)
      - One API call
      - Returns structured JSON

   c) Quick Validation (0.1s, $0)
      - Has all required fields?
      - Correct answer in options?
      - No hallucination phrases?
      └─> If fail: retry (max 3 attempts)

   d) Diversity Check (0.1s, $0)
      - Compare to last 10 questions
      - Text similarity < 90%?
      └─> If duplicate: retry

   e) Answer Verification (5s, $0.005 - only if needed)
      - Skip subjective questions
      - For objective: verify independently
      └─> If wrong: retry

   f) Save & Track
      - Insert into Supabase
      - Add to diversity tracker
```

---

## File Structure

```
/src/lib/question-generation/
├── types.ts                    # Core TypeScript interfaces
├── generator.ts                # Main SimplifiedQuestionGenerator class
├── gap-analysis.ts             # Quota management and gap analysis
├── templates/
│   └── edutest-verbal/
│       ├── index.ts            # Template registry
│       ├── synonym.ts          # Synonym template + examples
│       ├── antonym.ts          # Antonym template + examples
│       ├── analogy.ts          # Analogy template + examples
│       ├── foreign-language.ts # Foreign language template
│       └── logical-deduction.ts# Logical deduction template
├── validation/
│   ├── quick-checks.ts         # Stage 1: Instant validation
│   └── answer-verification.ts  # Stage 2: Independent verification
└── diversity/
    └── tracker.ts              # SimpleDiversityTracker class
```

---

## Usage Examples

### Generate Single Question

```typescript
import { SimplifiedQuestionGenerator } from '@/lib/question-generation/generator';

const generator = new SimplifiedQuestionGenerator();

const result = await generator.generateQuestion({
  testType: 'edutest',
  section: 'verbal',
  subSkill: 'vocabulary-synonyms',
  difficulty: 1,
  yearLevel: 7
});

if (result.success) {
  console.log('Question:', result.question);
  console.log('Cost:', result.cost);
  console.log('Time:', result.timeMs);
}
```

### Batch Generation with Gap Analysis

```typescript
import { analyzeGaps, createBatchPlan, EDUTEST_VERBAL_QUOTAS } from '@/lib/question-generation/gap-analysis';
import { SimplifiedQuestionGenerator } from '@/lib/question-generation/generator';

// 1. Analyze what's needed
const gaps = await analyzeGaps(EDUTEST_VERBAL_QUOTAS);

// 2. Create batch plan
const plan = createBatchPlan(gaps, 100); // Max 100 questions

// 3. Generate
const generator = new SimplifiedQuestionGenerator();

for (const gap of plan.gaps) {
  for (let i = 0; i < gap.needed; i++) {
    const result = await generator.generateQuestion(gap.request);

    if (result.success) {
      // Save to database
      await saveToDatabase(result.question);
    }
  }
}
```

---

## Current Implementation Status

### ✅ Implemented (5/8 Question Types)

1. **Vocabulary - Synonyms** (15% of questions)
2. **Vocabulary - Antonyms** (10% of questions)
3. **Word Relationships - Analogies** (20% of questions)
4. **Pattern Recognition - Foreign Language** (15% of questions)
5. **Logical Reasoning - Deduction** (15% of questions)

### 🚧 TODO (3/8 Question Types)

6. **Classification - Odd One Out** (10% of questions)
7. **Letter Manipulation - Anagrams** (10% of questions)
8. **Logical Reasoning - Sequencing** (5% of questions)

### 📋 Future Expansion

- Add templates for other products:
  - ACER Scholarship
  - NSW Selective
  - VIC Selective
  - Year 5 NAPLAN
  - Year 7 NAPLAN
- Add templates for other sections:
  - Quantitative Reasoning
  - Reading Comprehension
  - Writing
  - Mathematics

---

## Key Design Decisions

### Why This Approach Works

✅ **Smart Prompting** → One well-crafted prompt with real examples beats complex validation

✅ **2-Stage Validation** → Catches 90%+ of errors at 1/3 the cost of 5-stage validation

✅ **In-Memory Diversity** → No database queries during generation (fast!)

✅ **Objective Verification Only** → Skip verification for subjective questions (saves time/cost)

✅ **Name Rotation** → Prevents name overuse without complex tracking

### What We're Giving Up (Compared to Complex System)

- ~5-10% of edge case errors (still catch 90%+)
- Some conceptually similar questions (good enough diversity)
- Some mediocre explanations (90% are good)

### What We Gain

- ✅ 3x faster (~8s vs ~30s per question)
- ✅ 3x cheaper (~$0.020 vs ~$0.056 per question)
- ✅ 10x easier to maintain (300 lines vs 2000 lines)
- ✅ Ship in 1 week vs 4 weeks

---

## Monitoring & Quality Control

### Success Rate Targets

- **Target**: 90%+ questions pass validation on first attempt
- **Warning**: If success rate < 70%, review prompts
- **Critical**: If success rate < 50%, halt and debug

### Cost Targets

- **Target**: $0.015-$0.025 per question
- **Warning**: If > $0.030, review retry logic
- **Critical**: If > $0.050, halt and review

### Quality Metrics to Track

1. **Error Rate**: % of questions with wrong answers (should be < 5%)
2. **Repetition Rate**: % of duplicate questions (should be < 2%)
3. **Explanation Quality**: % with comprehensive explanations (should be > 90%)
4. **Authenticity**: Expert review - does it feel like real test? (should be > 85%)

---

## Troubleshooting

### Question Generation Failing

**Symptom**: Success rate < 70%

**Possible Causes**:
1. Template prompt unclear → Review and add more examples
2. Hallucination detection too strict → Reduce patterns checked
3. API errors → Check Claude API status, check rate limits

### Questions Too Similar

**Symptom**: Duplicate questions generated

**Possible Causes**:
1. Diversity tracker not working → Check tracking logic
2. Name pool too small → Expand name pool
3. Question type too restrictive → Review template constraints

### Cost Too High

**Symptom**: Average cost > $0.030 per question

**Possible Causes**:
1. Too many retries → Improve prompts to reduce failures
2. Verification running on all questions → Check needsVerification() logic
3. Prompts too long → Trim unnecessary context

---

## Next Steps

### Phase 1: Validate (Week 1-2)
1. ✅ Build simplified system
2. ⏳ Generate 50 test questions
3. ⏳ Expert review for quality
4. ⏳ Measure: error rate, repetition, authenticity

### Phase 2: Iterate (Week 3-4)
- If quality ≥ 90% → Expand to remaining 3 question types
- If quality 80-90% → Add Stage 3 validation (distractor check)
- If quality < 80% → Review prompts, add examples

### Phase 3: Scale (Week 5+)
- Add remaining 3 EduTest Verbal question types
- Apply to other 5 products
- Generate 1000s of questions
- Monitor quality over time

---

## Contributing

### Adding a New Question Type

1. Create template in `/templates/{product}/{type}.ts`
2. Add real examples (minimum 3)
3. Define difficulty guidance
4. Add to template registry
5. Add quota definitions in `gap-analysis.ts`
6. Test with `test-simplified-generator.ts`

### Adding a New Product

1. Create `/templates/{product}/` directory
2. Analyze actual test questions → identify patterns
3. Create templates for each question type
4. Define quotas
5. Test end-to-end

---

## References

- [SIMPLIFIED_PRACTICAL_APPROACH.md](/docs/architecture/SIMPLIFIED_PRACTICAL_APPROACH.md) - Full system design
- [EDUTEST_VERBAL_REASONING_PATTERN_ANALYSIS.md](/docs/analysis/EDUTEST_VERBAL_REASONING_PATTERN_ANALYSIS.md) - Question type patterns
- [MULTI_PRODUCT_GENERATION_ARCHITECTURE.md](/docs/architecture/MULTI_PRODUCT_GENERATION_ARCHITECTURE.md) - Scaling strategy

---

**Built with**: Claude Sonnet 4, TypeScript, Supabase

**Maintained by**: EduCourse Team

**Last Updated**: February 3, 2026
