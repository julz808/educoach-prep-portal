# Question Generation Engine - Technical Deep Dive

## File Structure & Components

### Core Generation Files
```
src/engines/questionGeneration/
├── claudePrompts.ts (1,300+ lines)
│   ├── buildQuestionPrompt() - Main prompt builder
│   ├── buildPassagePrompt() - Passage generation
│   ├── callClaudeAPI() - API calls
│   ├── parseClaudeResponse() - JSON extraction
│   └── 40+ helper functions for prompt sections
│
├── questionGeneration.ts (400+ lines)
│   ├── generateQuestion() - Individual question generation
│   ├── calculateMaxPoints() - Point calculation
│   ├── selectQuestionDifficulty() - Random difficulty selection
│   └── updateContextFromQuestion() - Context updates
│
├── batchGeneration.ts (1,000+ lines)
│   ├── generatePracticeTest() - Complete test generation
│   ├── generateSectionQuestions() - Section-level generation
│   └── Integrates passage + question + storage
│
├── passageGeneration.ts (1,200+ lines)
│   ├── generatePassage() - Full passage creation
│   ├── generateMiniPassage() - For drill questions
│   ├── determinePassageType() - With rotation logic
│   └── Topic cycling integration
│
├── validationPipeline.ts (400+ lines)
│   ├── validateQuestionWithPipeline() - Multi-stage validation
│   ├── validateQuestionStructure() - Field validation
│   ├── validateMathematicsQuestion() - Math-specific
│   ├── analyzeConfidenceIndicators() - Uncertainty detection
│   └── performCrossValidation() - Fresh solve verification
│
├── questionValidator.ts (250+ lines)
│   ├── validateQuestion() - Two-stage validation
│   ├── checkForHallucinations() - Stage 1
│   ├── verifyAnswerIndependently() - Stage 2
│   └── validateAndRegenerateIfNeeded() - Auto-regen logic
│
├── validators.ts (500+ lines)
│   ├── validateQuestion() - Field validation
│   ├── validatePassage() - Passage validation
│   ├── Australian spelling checks
│   └── Format validation
│
├── hallucinationValidator.ts (140 lines)
│   ├── validateQuestionForHallucinations()
│   ├── validateAndRegenerateIfNeeded()
│   └── batchValidateQuestions()
│
├── supabaseStorage.ts (500+ lines)
│   ├── storeQuestion() - Save to database
│   ├── storePassage() - Save passages
│   ├── fetchQuestionsForPassage() - Retrieve questions
│   └── Gap analysis functions
│
├── curriculumBasedGeneration.ts (400+ lines)
│   ├── CurriculumBasedGenerator class
│   ├── generateContent() - Main method
│   ├── generateMissingPassages() - Passage generation
│   └── generateMissingQuestions() - Question generation
│
└── 15+ other supporting files

scripts/generation/
├── generate-all-remaining-acer-scholarship-v2.ts
├── generate-all-remaining-edutest-v2.ts
├── generate-all-remaining-nsw-selective-v2.ts
├── generate-all-remaining-year5-naplan-v2.ts
├── generate-all-remaining-year7-naplan-v2.ts
└── generate-all-remaining-vic-selective-v2.ts

src/data/
└── curriculumData.ts (5,000+ lines)
    ├── TEST_STRUCTURES - Test format definitions
    ├── UNIFIED_SUB_SKILLS - Skill descriptions
    ├── SECTION_TO_SUB_SKILLS - Mappings
    └── SUB_SKILL_VISUAL_MAPPING - Visual requirements
```

---

## Key Code Patterns

### 1. Prompt Building Pattern

```typescript
// Simplified example of buildQuestionPrompt structure
export async function buildQuestionPrompt(request: SingleQuestionRequest): Promise<string> {
  const { testType, sectionName, subSkill, difficulty, passageContent, generateVisual } = request;
  
  const prompt = `You are an expert designer of Australian educational assessments...

${getContextDiversityInstructions(generationContext, subSkill)}

${getMathematicalValidationRequirements(sectionName)}

${getVisualInstructions(generateVisual, subSkill, allowedVisualTypes)}

TEST SPECIFICATIONS:
- Test Type: ${testType}
- Section: ${sectionName}
- Sub-skill: ${subSkill}
- Difficulty Level: ${difficulty}

${getTestAuthenticityGuidance(testType)}

${getQuestionStructureGuidance(testType, sectionName)}

DISTRACTOR QUALITY REQUIREMENTS:
[800+ lines of detailed distractor guidance]

OUTPUT FORMAT:
Return ONLY a valid JSON object with these fields:
{
  "question_text": "...",
  "answer_options": ["A) ...", "B) ...", "C) ...", "D) ..."],
  "correct_answer": "A",
  "solution": "...",
  "has_visual": false,
  "visual_type": null,
  "visual_data": null,
  "visual_svg": null
}`;

  return prompt;
}
```

**Analysis:**
- Prompt is ~6,000-7,000 tokens
- Multiple levels of helper functions
- Extensive guidance sections
- JSON output format explicitly specified
- No system role specified (uses default)

### 2. API Call Pattern

```typescript
export async function callClaudeAPI(prompt: string): Promise<ClaudeAPIResponse> {
  const API_KEY = getClaudeAPIKey();
  
  const request: ClaudeAPIRequest = {
    model: "claude-sonnet-4-20250514",
    max_tokens: 6000,
    messages: [
      {
        role: "user",
        content: prompt
      }
    ]
  };

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data as ClaudeAPIResponse;
  } catch (error) {
    console.error('Claude API call failed:', error);
    throw error;
  }
}
```

**Issues:**
- No temperature specified (defaults to 1.0)
- No system message (all instruction in user message)
- Generic error handling
- No token counting before request

### 3. Validation Pattern

```typescript
export async function validateQuestion(questionData: any): Promise<ValidationResult> {
  // Stage 1: Hallucination detection
  const hallucinationCheck = checkForHallucinations(questionData.solution || '');
  
  if (hallucinationCheck.hasHallucinations) {
    return {
      isValid: false,
      hasHallucinations: true,
      answerIsCorrect: false,
      hallucinationIndicators: hallucinationCheck.indicators,
      answerValidationDetails: null,
      shouldRegenerate: true
    };
  }

  // Stage 2: Independent answer verification
  let answerValidation = null;
  let answerIsCorrect = true; // Default for non-MC

  if (questionData.answer_options && Array.isArray(questionData.answer_options)) {
    answerValidation = await verifyAnswerIndependently(questionData);
    answerIsCorrect = answerValidation.matches;
  }

  const isValid = !hallucinationCheck.hasHallucinations && answerIsCorrect;

  return {
    isValid,
    hasHallucinations: false,
    answerIsCorrect,
    hallucinationIndicators: [],
    answerValidationDetails: answerValidation,
    shouldRegenerate: !isValid
  };
}
```

**Two-Stage Approach:**
1. Check solution text for hallucination patterns
2. Call Claude API again to verify answer independently
3. Compare original answer with independent verification

### 4. Regeneration Pattern

```typescript
export async function validateAndRegenerateIfNeeded(
  questionData: any,
  regenerationFunction: () => Promise<any>,
  maxRetries: number = 5
): Promise<{ questionData: any; wasRegenerated: boolean; attempts: number }> {
  let currentQuestionData = questionData;
  let attempts = 0;

  while (attempts < maxRetries) {
    attempts++;
    
    const validation = await validateQuestion(currentQuestionData);
    
    if (validation.isValid) {
      console.log(`✅ Question validation passed on attempt ${attempts}`);
      return { questionData: currentQuestionData, wasRegenerated: attempts > 1, attempts };
    }

    if (attempts < maxRetries) {
      console.log(`🔄 Regenerating question (attempt ${attempts + 1}/${maxRetries})...`);
      try {
        currentQuestionData = await regenerationFunction();
        
        // Delay between regeneration
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`❌ Regeneration attempt ${attempts} failed:`, error);
        break;
      }
    }
  }

  if (attempts >= maxRetries) {
    throw new Error(`Question validation failed after ${maxRetries} attempts`);
  }

  return { questionData: currentQuestionData, wasRegenerated: true, attempts };
}
```

**Loop Logic:**
- Up to 5 attempts
- 2-second delay between attempts
- Throws error if all attempts fail
- Tracks attempt count

---

## Generation Flow Diagram

```
BATCH GENERATION FLOW:

1. getTestSections(testType)
   └─> Returns: ["Reading", "Mathematics", "Writing", ...]

2. FOR EACH SECTION:
    ├─> performGapAnalysis(testType, section)
    │   ├─> Query existing questions in Supabase
    │   ├─> Compare against curriculum requirements
    │   └─> Return: { questionGaps, passageGaps }
    │
    ├─> IF passage section:
    │   ├─> FOR EACH missing passage:
    │   │   ├─> determinePassageType() [with rotation]
    │   │   ├─> selectTopic() [from topic cycling system]
    │   │   ├─> buildPassagePrompt()
    │   │   ├─> callClaudeAPI()
    │   │   ├─> parseClaudeResponse()
    │   │   ├─> validatePassage()
    │   │   └─> storePassage() in Supabase
    │
    └─> FOR EACH missing question:
        ├─> selectDifficulty() [based on distribution]
        ├─> selectSubSkill() [from section]
        ├─> buildQuestionPrompt()
        ├─> callClaudeAPIWithRetry() [3 retries]
        ├─> parseClaudeResponse()
        ├─> validateQuestion() [2-stage]
        │   ├─> Stage 1: Hallucination detection
        │   └─> Stage 2: Independent answer verification
        ├─> IF invalid: regenerateQuestion() [up to 5 attempts]
        ├─> IF valid: storeQuestion() in Supabase
        └─> updateContextFromQuestion()

3. generateFinalReport()
   ├─> Summary statistics
   ├─> Validation metrics
   └─> Duration and performance
```

---

## Key Decision Points in Code

### 1. Difficulty Selection Logic

```typescript
function selectQuestionDifficulty(testType: string): number {
  const difficultyDistributions = {
    'Year 5 NAPLAN': [0.45, 0.45, 0.1],        // 45% easy, 45% medium, 10% hard
    'Year 7 NAPLAN': [0.35, 0.5, 0.15],
    'VIC Selective Entry (Year 9 Entry)': [0.1, 0.35, 0.55], // 10% easy, 35% medium, 55% hard
    'NSW Selective Entry (Year 7 Entry)': [0.15, 0.5, 0.35],
    'EduTest Scholarship (Year 7 Entry)': [0.2, 0.5, 0.3],
    'ACER Scholarship (Year 7 Entry)': [0.15, 0.45, 0.4]
  };
  
  const distribution = difficultyDistributions[testType as keyof typeof difficultyDistributions] || [0.3, 0.5, 0.2];
  const random = Math.random();
  
  if (random < distribution[0]) return 1; // Easy
  if (random < distribution[0] + distribution[1]) return 2; // Medium
  return 3; // Hard
}
```

**Pattern:**
- Hardcoded distributions per test type
- Random selection based on cumulative probabilities
- No weighting based on existing questions
- No dynamic adjustment

### 2. Hallucination Pattern Detection

```typescript
const HALLUCINATION_PATTERNS = [
  /\blet me\b/gi,
  /\bmy mistake\b/gi,
  /\bupon reflection\b/gi,
  /\bon second thought\b/gi
];

function checkForHallucinations(solution: string) {
  const foundIndicators: string[] = [];
  
  HALLUCINATION_PATTERNS.forEach(pattern => {
    const matches = solution.match(pattern);
    if (matches) {
      matches.forEach(match => {
        if (!foundIndicators.includes(match.toLowerCase())) {
          foundIndicators.push(match.toLowerCase());
        }
      });
    }
  });

  const isValid = foundIndicators.length === 0;
  return { isValid, hallucinationIndicators: foundIndicators };
}
```

**Limited Patterns:**
- Only 4 specific phrases checked
- No plural variations ("let us")
- No context-aware checks
- Fixed regex patterns

---

## API Costs & Token Estimates

### Per Question Generation:
- Prompt tokens: ~5,000-6,000
- Response tokens: ~500-800
- **Total: ~5,500-6,800 tokens per question**

### Validation (2-stage):
- Hallucination check: In-prompt (0 API calls)
- Answer verification: ~300 prompt + ~100 response = 400 tokens
- **Total per validation: 400 tokens**

### Worst Case (5 regenerations):
- Initial: 6,000 tokens
- 5x regenerations: 6,000 x 5 = 30,000 tokens
- 4x validations (assuming 4 fail): 400 x 4 = 1,600 tokens
- **Total: ~37,600 tokens worst case**

### Typical Cost per Test (100 questions):
- Initial generation: 600,000 tokens
- Validations (assume 10% regeneration): 60,000 tokens
- **Total: ~660,000 tokens per test**

At $3/1M input tokens (Sonnet 4):
- Cost per test: ~$2.00
- Cost per question: ~$0.02

---

## Curriculum Data Structure

```typescript
export const TEST_STRUCTURES = {
  "Year 5 NAPLAN": {
    "Writing": {
      "questions": 1,
      "time": 42,
      "format": "Written Response",
      "passages": 0,
      "words_per_passage": 0
    },
    "Reading": {
      "questions": 40,
      "time": 50,
      "format": "Multiple Choice",
      "passages": 8,        // 8 passages
      "words_per_passage": 150
    },
    // ... other sections
  }
};

export const UNIFIED_SUB_SKILLS = {
  "Literal Comprehension": {
    description: "Ability to identify information directly stated in text",
    visual_required: false,
    difficulty_progression: [...],
    sample_questions: [...]
  },
  // ... 100+ sub-skills
};

export const SECTION_TO_SUB_SKILLS = {
  "Year 5 NAPLAN - Reading": [
    "Literal Comprehension",
    "Inferential Comprehension",
    "Vocabulary Development",
    // ... typically 8-12 per section
  ]
};
```

---

## Common Regeneration Triggers

Based on code analysis:

1. **Hallucination Detected**
   - Phrase: "let me", "my mistake", "upon reflection"
   - Confidence < 75%

2. **Answer Verification Failed**
   - Independent solve differs from generated answer
   - Multiple valid answers detected

3. **Structure Validation**
   - Answer doesn't match any option
   - Duplicate options detected
   - Wrong number of options

4. **Confidence Analysis**
   - Solution contains uncertainty phrases
   - Linear scoring: 100 - (phrase_count × 20)

---

## Error Handling Strategy

```
API Call Failure
  ├─> Retry with exponential backoff (1s, 2s, 4s, 8s, 16s)
  ├─> Max 3 retries for generation
  └─> Max 5 retries for validation

JSON Parsing Failure
  ├─> Try to extract JSON using regex
  ├─> Clean up undefined values
  └─> Re-throw if still invalid

Validation Failure
  ├─> Log specific error
  ├─> Regenerate question
  ├─> Up to 5 attempts
  └─> Reject if all fail

Storage Failure
  ├─> Log error
  ├─> Don't retry
  └─> Continue with next question
```

---

## Summary of Execution

The EduCoach question generation engine is **comprehensive and production-grade** with:

- Sophisticated prompt engineering
- Multi-stage validation pipeline
- Automatic regeneration on failure
- Curriculum-based gap analysis
- Context-aware diversity management
- Supabase integration for persistence

However, it has notable opportunities for optimization in:
- Prompt length reduction (50% cost savings possible)
- Distractor validation (critical missing piece)
- Semantic diversity detection
- Temperature optimization
- Rate limiting and error recovery

