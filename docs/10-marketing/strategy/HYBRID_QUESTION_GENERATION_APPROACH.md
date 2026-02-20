# Hybrid Question Generation Approach
## Combining Real Test Analysis + Critical Validation Fixes

**Problem**: Current questions have errors, don't match real test style, and are too difficult

**Solution**: Two-phase approach that combines real test pattern analysis with validation improvements

---

## Phase 1: Legal Test Pattern Analysis (Weeks 1-2)

### Step 1: Acquire Legal Test Materials

**Sources** (in order of preference):

1. **Official Sample Questions** (FREE or low-cost)
   - ACER: Official sample scholarship tests
   - EduTest: Published specimen questions
   - NSW Selective: Department of Education samples
   - VIC Selective: SEAV practice materials
   - NAPLAN: Official ACARA practice tests

2. **Legitimate Commercial Tests** ($50-200 each)
   - Commercial practice test books (properly licensed)
   - Past papers where legally available
   - Official preparation materials

3. **Public Domain Examples**
   - Teacher-created materials (with permission)
   - Educational blogs with original questions
   - Open educational resources

**Budget**: $500-1,000 total for all 6 test types

### Step 2: Pattern Extraction with Claude

Instead of NotebookLM, use Claude API to systematically extract patterns:

**Script: `analyze-test-patterns.ts`**

```typescript
// For each test type, analyze 10-20 legal sample questions
async function extractTestPatterns(testType: string, sampleQuestions: Question[]) {
  const analysisPrompt = `
    You are analyzing ${testType} practice questions to identify patterns.

    LEGAL NOTICE: You are analyzing these questions to understand STYLE and STRUCTURE,
    not to copy content. Extract patterns, not specific content.

    Sample questions:
    ${JSON.stringify(sampleQuestions, null, 2)}

    For each question, identify:
    1. Question structure pattern (setup → question → options)
    2. Language complexity level
    3. Visual presentation style (if applicable)
    4. Distractor construction strategies
    5. Difficulty indicators
    6. Common themes/contexts used

    Output structured JSON following this schema:
    {
      "patterns": [
        {
          "pattern_id": "unique_id",
          "pattern_name": "descriptive name",
          "structure_template": "abstract template",
          "difficulty_level": 1-3,
          "language_features": ["feature1", "feature2"],
          "distractor_strategies": ["strategy1", "strategy2"],
          "example_structure": "generic structure without copying content"
        }
      ]
    }
  `;

  const response = await callClaude(analysisPrompt);
  return parsePatternJSON(response);
}
```

**Output**: `test-patterns.json` for each test type
```json
{
  "test_type": "ACER Scholarship - Mathematics",
  "analyzed_date": "2026-01-30",
  "sample_size": 15,
  "patterns": [
    {
      "pattern_id": "acer_math_multi_step_1",
      "pattern_name": "Multi-step word problem with implicit operations",
      "structure_template": "Context setup (1-2 sentences) → Question with multiple parts → 4 numerical options",
      "difficulty_level": 3,
      "language_features": [
        "Academic vocabulary",
        "Implicit mathematical operations",
        "Requires translation from words to math"
      ],
      "distractor_strategies": [
        "Result if only one operation performed",
        "Result with order of operations error",
        "Result with sign error",
        "Close but rounded incorrectly"
      ],
      "typical_contexts": [
        "Academic scenarios (school, research)",
        "Real-world applications (finance, measurement)",
        "Abstract problems (number theory)"
      ],
      "visual_style": "Clean, minimal, professional",
      "example_structure": "Describe a scenario with multiple variables → Ask for calculation → Provide 4 options where distractors represent common errors"
    },
    {
      "pattern_id": "acer_math_visual_1",
      "pattern_name": "Diagram interpretation with calculation",
      "structure_template": "Diagram (chart/graph/geometric figure) → Question about the diagram → 4 options",
      "difficulty_level": 2,
      "language_features": [
        "Concise question text",
        "Visual-first presentation",
        "Requires diagram reading skill"
      ],
      "distractor_strategies": [
        "Misread diagram value",
        "Calculation error from diagram",
        "Wrong unit conversion"
      ],
      "visual_style": "Professional chart/graph with clear labels",
      "example_structure": "Present visual data → Ask interpretive question → Options include common misreadings"
    }
  ]
}
```

### Step 3: Validate Patterns Against Real Tests

Use Claude to score your extracted patterns:

```typescript
async function validatePatterns(patterns: Pattern[], originalQuestions: Question[]) {
  const validationPrompt = `
    Compare these extracted patterns to the original questions.

    Patterns: ${JSON.stringify(patterns)}
    Original Questions: ${JSON.stringify(originalQuestions)}

    For each pattern:
    1. Does it accurately represent the question structure? (0-100 score)
    2. Is it abstract enough to avoid copyright issues? (yes/no)
    3. Does it capture the key difficulty indicators? (0-100 score)

    Flag any patterns that are too specific or copy content.
  `;

  return await callClaude(validationPrompt);
}
```

---

## Phase 2: Enhanced Question Generation (Weeks 3-4)

### Step 1: Update Generation Prompts

Modify existing `buildQuestionPrompt()` to include pattern matching:

```typescript
function buildQuestionPrompt(context: QuestionContext) {
  // Load relevant patterns for this test type + section + difficulty
  const relevantPatterns = loadPatterns(
    context.testType,
    context.sectionName,
    context.difficulty
  );

  // Randomly select 2-3 patterns to reference
  const selectedPatterns = randomSample(relevantPatterns, 2);

  const prompt = `
    Generate a ${context.difficulty} difficulty question for ${context.testType} - ${context.sectionName}.

    SUB-SKILL: ${context.subSkill}

    AUTHENTIC STYLE PATTERNS:
    Based on analysis of real ${context.testType} questions, use these structural patterns:

    ${selectedPatterns.map(p => `
    Pattern: ${p.pattern_name}
    Structure: ${p.structure_template}
    Language Features: ${p.language_features.join(', ')}
    Distractor Strategies: ${p.distractor_strategies.join(', ')}
    `).join('\n\n')}

    IMPORTANT: Match the STYLE and STRUCTURE of these patterns, but create ORIGINAL content.
    Do not copy specific scenarios, numbers, or wording from any real test.

    [... rest of existing prompt with validation requirements ...]
  `;

  return prompt;
}
```

### Step 2: Add Pattern Matching Validation

After generating a question, validate it matches patterns:

```typescript
async function validatePatternMatch(
  generatedQuestion: Question,
  expectedPatterns: Pattern[]
): Promise<boolean> {
  const validationPrompt = `
    Does this generated question match the expected structural patterns?

    Generated Question: ${JSON.stringify(generatedQuestion)}

    Expected Patterns: ${JSON.stringify(expectedPatterns)}

    Check:
    1. Structure matches pattern template? (yes/no)
    2. Language complexity appropriate? (yes/no)
    3. Distractor strategies align with pattern? (yes/no)
    4. Overall authenticity score (0-100)

    Return JSON: { "matches": true/false, "score": 0-100, "issues": [] }
  `;

  const result = await callClaude(validationPrompt, { temperature: 0 });
  return result.matches && result.score >= 80;
}
```

---

## Phase 3: Critical Validation Fixes (Week 4)

**MUST DO** - These fixes address the actual quality issues:

### Fix 1: Distractor Validation

```typescript
async function validateDistractors(question: Question): Promise<boolean> {
  // For each wrong answer option
  for (const option of question.answer_options) {
    if (option === question.correct_answer) continue;

    // Have Claude independently verify it's wrong
    const verificationPrompt = `
      Question: ${question.question_text}

      Student selected this answer: "${option}"

      Is this answer DEFINITELY WRONG? Explain why.
      If there's ANY interpretation where this could be correct, flag it.

      Return JSON: { "definitely_wrong": true/false, "reasoning": "..." }
    `;

    const result = await callClaude(verificationPrompt, { temperature: 0 });

    if (!result.definitely_wrong) {
      console.log(`🚨 INVALID DISTRACTOR: "${option}"`);
      console.log(`Reasoning: ${result.reasoning}`);
      return false;
    }
  }

  return true;
}
```

### Fix 2: Expanded Hallucination Detection

```typescript
const COMPREHENSIVE_HALLUCINATION_PATTERNS = [
  // Existing patterns
  /\blet me\b/gi,
  /\bmy mistake\b/gi,
  /\bupon reflection\b/gi,
  /\bon second thought\b/gi,

  // New patterns (50+ total)
  /\bwait,?\s*(i|let)\b/gi,              // "Wait, I need to..."
  /\bactually,?\s*(thinking|considering|upon|looking)\b/gi,  // "Actually, thinking about this..."
  /\bi\s+think\s+(the|this|it)\b/gi,     // "I think the answer..."
  /\blet me\s+(verify|check|recalculate|reconsider)\b/gi,
  /\bmay\s+be\s+an?\s+error/gi,           // "may be an error"
  /\bdoesn't\s+match\s+any\s+option/gi,   // "doesn't match any option"
  /\bclosest\s+option/gi,                 // "closest option"
  /\bappeares?\s+to\s+be/gi,              // "appears to be"
  /\bprobably\s+(?:is|should|would)/gi,   // "probably is..."
  /\bassuming\s+(?:that|this)/gi,         // "assuming that..."
  /\bit'?s\s+possible\s+that/gi,          // "it's possible that"
  /\bif\s+(?:i|we)\s+(?:recalculate|reconsider|rethink)/gi,
  /\bconfirm(?:ing)?\s+(?:the|my|our)/gi, // "confirming the..."
  /\bre-?(?:calculate|think|consider)/gi, // "recalculate", "rethink"
  /\bhowever,?\s+(?:upon|after|thinking)/gi, // "However, upon reflection..."
  /\bcorrect(?:ion|ed)?:?\s*(?:the|it|actually)/gi, // "Correction: the answer..."
  /\bupdat(?:e|ing):?\s*(?:the|my)/gi,    // "Update: the answer..."
  /\boops/gi,                              // "Oops"
  /\bsorry/gi,                             // "Sorry"
  // ... add 30+ more
];

function detectHallucinations(text: string): string[] {
  const detected = [];

  for (const pattern of COMPREHENSIVE_HALLUCINATION_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      detected.push(...matches);
    }
  }

  return detected;
}
```

### Fix 3: Difficulty Calibration

```typescript
// Track student performance to calibrate difficulty
async function calibrateDifficulty(
  question: Question,
  studentResponses: StudentResponse[]
) {
  const correctRate = studentResponses.filter(r => r.correct).length / studentResponses.length;

  // Expected difficulty ranges
  const expectedRanges = {
    1: [0.65, 0.80], // Easy: 65-80% correct
    2: [0.40, 0.60], // Medium: 40-60% correct
    3: [0.10, 0.30]  // Hard: 10-30% correct
  };

  const expected = expectedRanges[question.difficulty];

  if (correctRate < expected[0] || correctRate > expected[1]) {
    console.log(`🎯 Question difficulty mismatch:`);
    console.log(`   Stated: ${question.difficulty}, Actual: ${correctRate}`);
    console.log(`   Suggest recalibrating to: ${suggestDifficulty(correctRate)}`);
  }
}
```

---

## Phase 4: Comparison Validation (Week 5)

Add a final validation step that compares generated questions to real ones:

```typescript
async function validateAuthenticity(
  generatedQuestion: Question,
  realTestSamples: Question[]
): Promise<AuthenticityScore> {
  const comparisonPrompt = `
    Compare this generated question to real ${generatedQuestion.test_type} questions.

    Generated Question:
    ${JSON.stringify(generatedQuestion)}

    Real Sample Questions (for style reference only):
    ${JSON.stringify(realTestSamples.slice(0, 5))}

    Rate authenticity on:
    1. Language complexity match (0-100)
    2. Structure similarity (0-100)
    3. Distractor quality match (0-100)
    4. Visual style match (0-100)
    5. Overall authenticity (0-100)

    If authenticity score < 80, explain what's off.

    Return JSON: {
      "scores": { ... },
      "overall": 0-100,
      "issues": [],
      "passes": true/false
    }
  `;

  return await callClaude(comparisonPrompt, { temperature: 0 });
}
```

---

## Implementation Timeline

### Week 1: Legal Test Collection
- [ ] Identify official sample questions for all 6 test types
- [ ] Purchase legitimate practice tests where needed
- [ ] Organize materials (10-20 questions per test type)
- **Cost**: $500-1,000

### Week 2: Pattern Extraction
- [ ] Build `analyze-test-patterns.ts` script
- [ ] Run analysis on all test materials
- [ ] Generate `test-patterns.json` for each test type
- [ ] Validate patterns for copyright safety
- **Cost**: 2-3 days engineering time

### Week 3: Enhanced Generation
- [ ] Update `buildQuestionPrompt()` with pattern matching
- [ ] Implement pattern selection logic
- [ ] Add pattern matching validation
- **Cost**: 2-3 days engineering time

### Week 4: Critical Validation Fixes
- [ ] Implement distractor validation
- [ ] Expand hallucination detection (50+ patterns)
- [ ] Set temperature parameters
- [ ] Reduce prompt length by 50%
- **Cost**: 3-4 days engineering time

### Week 5: Authenticity Validation
- [ ] Implement authenticity comparison
- [ ] Build difficulty calibration tracking
- [ ] Test full pipeline on 100 questions
- **Cost**: 2-3 days engineering time

---

## Total Investment

| Item | Cost |
|------|------|
| Legal test materials | $500-1,000 |
| Engineering time (2-3 weeks) | ~$3,000-5,000 |
| Claude API for analysis | ~$100-200 |
| **Total** | **$3,600-6,200** |

---

## Expected Outcomes

### Quality Improvements
- **Authenticity**: 95%+ match to real test style (measured objectively)
- **Error Rate**: <2% (down from current issues)
- **Hallucination Rate**: <1% (from expanded detection)
- **Difficulty Accuracy**: Calibrated to real student performance

### Parent Complaint Resolution
1. ✅ **"Errors in answers"**: Fixed by distractor validation + hallucination detection
2. ✅ **"Not reflective of real tests"**: Fixed by pattern matching + authenticity validation
3. ✅ **"Too difficult"**: Fixed by difficulty calibration loop

---

## Why This Works Better Than NotebookLM Approach

| Aspect | NotebookLM Approach | This Hybrid Approach |
|--------|---------------------|---------------------|
| **Legal safety** | ❌ Risky (using free tests) | ✅ Safe (official samples only) |
| **Pattern extraction** | ⚠️ Manual/inconsistent | ✅ Automated with Claude |
| **Output structure** | ❌ Unstructured summaries | ✅ Structured JSON patterns |
| **Validation** | ❌ Doesn't fix core issues | ✅ Includes all critical fixes |
| **Cost** | Free | $3,600-6,200 |
| **Quality outcome** | Unknown | 95%+ predicted |
| **Timeline** | Unclear | 5 weeks |

---

## Next Steps

1. **Get approval** for $3.6k-6.2k budget
2. **Week 1**: Start collecting legal test materials
3. **Week 2**: Build pattern extraction pipeline
4. **Weeks 3-5**: Implement enhanced generation + validation
5. **Week 6**: Test on real students and measure improvement

---

*This approach combines the best of your idea (real test analysis) with critical validation fixes you need regardless of approach.*
