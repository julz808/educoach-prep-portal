# Step-by-Step Implementation Guide
## Improving Your Question Generation Engine with Real Examples

**Goal**: Reduce errors and hallucinations by 90% using your existing example questions
**Timeline**: 1-2 weeks
**Complexity**: Low - enhancing existing system, not rebuilding

---

## Phase 1: Extract and Organize Example Questions (Days 1-2)

### Step 1.1: Create Example JSON Files

You already analyzed 60 EduTest Verbal questions. Now extract 3-5 representative examples per sub-skill.

**Create this file structure**:
```
/src/data/exampleQuestions/
├── edutest-verbal-examples.json
├── acer-mathematics-examples.json (later)
├── nsw-selective-reading-examples.json (later)
└── loader.ts
```

### Step 1.2: Example JSON Format

**File**: `/src/data/exampleQuestions/edutest-verbal-examples.json`

```json
{
  "vocabulary-synonyms": [
    {
      "question_text": "Which of the following words is similar to REPAIR?",
      "answer_options": ["broken", "mend", "detach", "remove", "smash"],
      "correct_answer": "mend",
      "explanation": "Both 'repair' and 'mend' mean to fix something that is broken.",
      "difficulty": 1,
      "year_level": 7,
      "source": "EduTest Practice Papers Year 7 Q1"
    },
    {
      "question_text": "Which of the following words is similar to CHANGE?",
      "answer_options": ["keep", "alter", "remain", "stay", "new"],
      "correct_answer": "alter",
      "explanation": "Both 'change' and 'alter' mean to make something different.",
      "difficulty": 2,
      "year_level": 8,
      "source": "EduTest Practice Papers Year 8 Q5"
    },
    {
      "question_text": "Which of the following words is similar to DOCUMENT?",
      "answer_options": ["book", "record", "literature", "words", "documentary"],
      "correct_answer": "record",
      "explanation": "Both 'document' and 'record' mean a written account of information.",
      "difficulty": 3,
      "year_level": 9,
      "source": "EduTest Practice Papers Year 9 Q12"
    }
  ],

  "vocabulary-antonyms": [
    {
      "question_text": "Which of the following words is opposite in meaning to INSUFFICIENT?",
      "answer_options": ["scarce", "adequate", "lacking", "hopeless", "subjective"],
      "correct_answer": "adequate",
      "explanation": "'Insufficient' means not enough, therefore the opposite is 'adequate' which means enough or satisfactory.",
      "difficulty": 1,
      "year_level": 7,
      "source": "EduTest Practice Papers Year 7 Q3"
    }
  ],

  "word-relationships-analogies": [
    {
      "question_text": "BLACK is to WHITE as DAY is to:",
      "answer_options": ["night", "sun", "light", "morning", "time"],
      "correct_answer": "night",
      "explanation": "Black and white are opposites, just as day and night are opposites.",
      "difficulty": 2,
      "year_level": 8,
      "source": "EduTest Practice Papers Year 8 Q7"
    },
    {
      "question_text": "HOSPITAL is to DOCTOR as GARAGE is to:",
      "answer_options": ["car", "mechanic", "tools", "repair", "building"],
      "correct_answer": "mechanic",
      "explanation": "A doctor works in a hospital, just as a mechanic works in a garage.",
      "difficulty": 2,
      "year_level": 8,
      "source": "EduTest Practice Papers Year 8 Q14"
    }
  ],

  "pattern-recognition-foreign-language": [
    {
      "question_text": "BODO ET FUMY means CAN YOU COME TO MY HOUSE?\nYAM EO FUMY BODO means YES I CAN COME TO THE HOUSE\nSY EO FUMY means NO I CANNOT COME\n\nWhich word means HOUSE?",
      "answer_options": ["BODO", "ET", "FUMY", "YAM", "EO"],
      "correct_answer": "BODO",
      "explanation": "Process of elimination.",
      "difficulty": 1,
      "year_level": 7,
      "source": "EduTest Practice Papers Year 7 Q10"
    }
  ],

  "logical-reasoning-deduction": [
    {
      "question_text": "Please select TWO options which together most strongly suggest: THE CAKE IS READY TO COME OUT OF THE OVEN\n\n1: The cake takes 15 minutes to cook\n2: The clock is 15 minutes fast; it says 12:15pm\n3: The cake is golden brown\n4: At 11:45am mum said cake ready in 15 minutes\n5: The cake is hot",
      "answer_options": ["1 & 2", "1 & 4", "2 & 4", "3 & 5", "4 & 5"],
      "correct_answer": "2 & 4",
      "explanation": "If the clock is 15 minutes fast and says 12:15pm, the real time is 12:00pm. The cake was going to be ready at 12:00pm (11:45am + 15 minutes).",
      "difficulty": 1,
      "year_level": 7,
      "source": "EduTest Practice Papers Year 7 Q15"
    }
  ]
}
```

**Action**: Using your analysis from `EDUTEST_VERBAL_REASONING_PATTERN_ANALYSIS.md`, extract 3-5 real examples per sub-skill and format as above.

---

## Phase 2: Create Example Loader System (Day 3)

### Step 2.1: Create the Loader

**File**: `/src/data/exampleQuestions/loader.ts`

```typescript
import edutestVerbalExamples from './edutest-verbal-examples.json';
// Add more as you build them:
// import acerMathExamples from './acer-mathematics-examples.json';
// import nswSelectiveReadingExamples from './nsw-selective-reading-examples.json';

export interface ExampleQuestion {
  question_text: string;
  answer_options: string[];
  correct_answer: string;
  explanation: string;
  difficulty: number;
  year_level: number;
  source: string;
}

/**
 * Load example questions for a specific test type and sub-skill
 */
export function loadExampleQuestions(
  testType: string,
  subSkill: string,
  difficulty?: number,
  limit: number = 3
): ExampleQuestion[] {
  // Map test types to example JSON files
  const exampleSets: Record<string, any> = {
    'EduTest Scholarship (Year 7 Entry)': edutestVerbalExamples,
    // Add more as you create them:
    // 'ACER Scholarship (Year 7 Entry)': acerMathExamples,
    // 'NSW Selective Entry (Year 7 Entry)': nswSelectiveReadingExamples,
  };

  // Get examples for this test type
  const examples = exampleSets[testType];
  if (!examples) {
    console.warn(`No examples found for test type: ${testType}`);
    return [];
  }

  // Get examples for this sub-skill
  let questions = examples[subSkill];
  if (!questions || !Array.isArray(questions)) {
    console.warn(`No examples found for sub-skill: ${subSkill} in ${testType}`);
    return [];
  }

  // Filter by difficulty if specified
  if (difficulty !== undefined) {
    const filtered = questions.filter((q: ExampleQuestion) => q.difficulty === difficulty);
    // If no matches at this difficulty, fall back to all difficulties
    questions = filtered.length > 0 ? filtered : questions;
  }

  // Return up to `limit` examples
  return questions.slice(0, limit);
}

/**
 * Format examples for inclusion in prompts
 */
export function formatExamplesForPrompt(examples: ExampleQuestion[]): string {
  if (examples.length === 0) {
    return 'No examples available for this question type.';
  }

  return examples.map((ex, idx) => `
EXAMPLE ${idx + 1} (Difficulty ${ex.difficulty}, Year ${ex.year_level}):
Question: "${ex.question_text}"
Options: ${ex.answer_options.join(', ')}
Correct Answer: ${ex.correct_answer}
Explanation: "${ex.explanation}"
Source: ${ex.source}
`).join('\n');
}
```

**Action**: Create this file and test it:

```bash
# Test the loader
tsx -e "
import { loadExampleQuestions } from './src/data/exampleQuestions/loader';
const examples = loadExampleQuestions('EduTest Scholarship (Year 7 Entry)', 'vocabulary-synonyms', 1, 3);
console.log('Found examples:', examples.length);
console.log(examples);
"
```

---

## Phase 3: Enhance Prompt System (Day 4)

### Step 3.1: Modify `buildQuestionPrompt()`

**File**: `/src/engines/questionGeneration/claudePrompts.ts`

**Add import at top** (around line 10):
```typescript
import { loadExampleQuestions, formatExamplesForPrompt } from '../../data/exampleQuestions/loader';
```

**Modify `buildQuestionPrompt()` function** (around line 655):

Find this section:
```typescript
export async function buildQuestionPrompt(request: SingleQuestionRequest): Promise<string> {
  const {
    testType,
    sectionName,
    subSkill,
    difficulty,
    passageContent,
    generateVisual,
    generationContext,
    existingQuestions
  } = request;

  const yearLevel = getYearLevel(testType);
  // ... existing code ...
```

**Add after the variable declarations** (around line 668):
```typescript
  // NEW: Load real example questions for this test type and sub-skill
  const exampleQuestions = loadExampleQuestions(testType, subSkill, difficulty, 3);
  const hasExamples = exampleQuestions.length > 0;

  const examplesSection = hasExamples ? `
========================================
📚 REAL ${testType} EXAMPLES - CRITICAL REFERENCE
========================================

Your generated question MUST match the exact style, format, and quality of these authentic ${testType} questions.
Study these carefully - they show you EXACTLY what a real ${testType} question looks like for this sub-skill.

${formatExamplesForPrompt(exampleQuestions)}

🎯 MANDATORY STYLE MATCHING REQUIREMENTS:

1. **EXACT QUESTION FORMAT**:
   - Your question MUST use the same sentence structure as the examples
   - Match the phrasing, vocabulary level, and complexity precisely
   - Follow the same format pattern (notice how questions are asked)

2. **DISTRACTOR STRATEGIES** (Study the wrong answers):
   - Notice which types of wrong answers are used in examples
   - Replicate similar distractor strategies
   - Examples show you what makes a plausible but wrong answer

3. **EXPLANATION STYLE**:
   - Match the explanation length (typically 1-2 sentences)
   - Follow the same structure and tone
   - Use similar phrasing and clarity level

4. **AUTHENTICITY CHECK**:
   - Before finalizing, ask yourself: "Could this question appear in the same test as the examples above?"
   - If NO: Revise until it matches the authentic ${testType} style

⚠️  CRITICAL: Your question should be indistinguishable from the real examples above.
` : `
⚠️  Note: No example questions available for ${subSkill} yet. Generate based on general ${testType} requirements.
`;
```

**Then in the main prompt** (around line 690), add the examples section early:

Find this line:
```typescript
  const prompt = `You are an expert designer of Australian educational assessments with deep knowledge of ${testType}. Your task is to generate an authentic question that precisely replicates the difficulty, style, and format of real ${testType} examinations.

${getContextDiversityInstructions(generationContext, subSkill)}
```

**Change to**:
```typescript
  const prompt = `You are an expert designer of Australian educational assessments with deep knowledge of ${testType}. Your task is to generate an authentic question that precisely replicates the difficulty, style, and format of real ${testType} examinations.

${examplesSection}

${getContextDiversityInstructions(generationContext, subSkill)}
```

**That's it!** The examples will now be injected into every prompt.

---

## Phase 4: Expand Hallucination Detection (Day 5)

### Step 4.1: Enhanced Hallucination Patterns

**File**: `/src/engines/questionGeneration/questionValidator.ts`

**Replace the existing `hallucinationPatterns` array** (line 29-37):

```typescript
/**
 * Stage 1: Check for hallucination indicators in solution
 */
function checkForHallucinations(solution: string): { hasHallucinations: boolean; indicators: string[] } {
  // Expanded hallucination patterns - catches 25+ issues
  const hallucinationPatterns = [
    // Original "let me" patterns
    /\blet me\b/gi,
    /\bwait,?\s*let me\b/gi,
    /\bactually,?\s*let me\b/gi,
    /\blet me recalculate\b/gi,
    /\blet me check\b/gi,
    /\blet me verify\b/gi,
    /\blet me calculate\b/gi,
    /\blet me think\b/gi,
    /\blet me see\b/gi,

    // Self-correction patterns
    /\bwait,?\s*I\s+(think|realize|notice|see)/gi,
    /\boops\b/gi,
    /\bmy\s+mistake\b/gi,
    /\bI\s+apologize\b/gi,
    /\bto\s+clarify\b/gi,
    /\bupon\s+reflection\b/gi,
    /\bI\s+was\s+wrong\b/gi,
    /\bI\s+made\s+an\s+error\b/gi,

    // Uncertainty patterns (should be confident in answers)
    /\bI\s+think\b/gi,
    /\bI\s+believe\b/gi,
    /\bprobably\b/gi,
    /\bmight\s+be\b/gi,
    /\bcould\s+be\b/gi,
    /\bI'm\s+not\s+sure\b/gi,

    // Calculation doubt patterns
    /\bactually,?\s*the\s+answer/gi,
    /\bcorrecting\s+myself\b/gi,
    /\bre-?calculating\b/gi,
    /\bre-?checking\b/gi,
    /\btrying\s+again\b/gi,

    // Meta-commentary (should never appear in student-facing text)
    /\bas\s+an\s+AI\b/gi,
    /\bI'm\s+a\s+(language\s+)?model\b/gi,
    /\bClaude\b/gi,  // Model shouldn't refer to itself
    /\bAnthrop(ic)?\b/gi,

    // Incomplete or confused calculations
    /\.\.\.\s*wait/gi,
    /\.\.\.\s*actually/gi,
    /\.\.\.\s*no/gi,
  ];

  const foundIndicators: string[] = [];

  hallucinationPatterns.forEach(pattern => {
    const matches = solution.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const normalizedMatch = match.toLowerCase().trim();
        if (!foundIndicators.includes(normalizedMatch)) {
          foundIndicators.push(normalizedMatch);
        }
      });
    }
  });

  return {
    hasHallucinations: foundIndicators.length > 0,
    indicators: foundIndicators
  };
}
```

### Step 4.2: Add Solution Quality Checks

**Add this new function** after `checkForHallucinations()` (around line 56):

```typescript
/**
 * Check solution quality for completeness and clarity
 */
function checkSolutionQuality(solution: string, questionData: any): { hasIssues: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check length (too short = incomplete, too long = rambling)
  if (solution.length < 30) {
    issues.push('Solution too short (< 30 chars) - may be incomplete');
  }
  if (solution.length > 1000) {
    issues.push('Solution too long (> 1000 chars) - should be concise');
  }

  // Check for required elements in explanation
  if (!solution.match(/correct|right|answer/i)) {
    issues.push('Solution doesn\'t clearly explain why answer is correct');
  }

  // Check for vague language that suggests uncertainty
  const vagueTerms = ['basically', 'essentially', 'generally', 'somewhat', 'kind of', 'sort of'];
  vagueTerms.forEach(term => {
    if (solution.toLowerCase().includes(term)) {
      issues.push(`Uses vague term: "${term}"`);
    }
  });

  // For multiple choice questions, check if options are mentioned in explanation
  if (questionData.answer_options && Array.isArray(questionData.answer_options)) {
    // Good explanations should explain why correct answer is right
    // Ideally also mention why others are wrong
    const correctAnswer = questionData.correct_answer;
    if (correctAnswer && !solution.includes(correctAnswer)) {
      issues.push('Solution doesn\'t reference the correct answer letter');
    }
  }

  // Check for incomplete sentences
  if (solution.match(/\.\s*$/) === null && !solution.match(/\?$/) && solution.length > 20) {
    issues.push('Solution doesn\'t end with proper punctuation');
  }

  return {
    hasIssues: issues.length > 0,
    issues
  };
}
```

### Step 4.3: Integrate Quality Checks

**Modify `validateQuestion()` function** (around line 135):

Find:
```typescript
export async function validateQuestion(questionData: any): Promise<ValidationResult> {
  console.log(`🔍 Validating question...`);

  // Stage 1: Check for hallucinations
  const hallucinationCheck = checkForHallucinations(questionData.solution || '');

  if (hallucinationCheck.hasHallucinations) {
    console.log(`❌ Hallucinations detected: ${hallucinationCheck.indicators.join(', ')}`);
    return {
      isValid: false,
      // ...
    };
  }

  console.log(`✅ No hallucinations detected`);
```

**Change to**:
```typescript
export async function validateQuestion(questionData: any): Promise<ValidationResult> {
  console.log(`🔍 Validating question...`);

  // Stage 1A: Check for hallucinations
  const hallucinationCheck = checkForHallucinations(questionData.solution || '');

  // Stage 1B: Check solution quality
  const qualityCheck = checkSolutionQuality(questionData.solution || '', questionData);

  // Combine issues
  const allIssues = [
    ...hallucinationCheck.indicators,
    ...qualityCheck.issues
  ];

  if (hallucinationCheck.hasHallucinations || qualityCheck.hasIssues) {
    console.log(`❌ Validation issues detected:`);
    allIssues.forEach(issue => console.log(`   - ${issue}`));

    return {
      isValid: false,
      hasHallucinations: hallucinationCheck.hasHallucinations || qualityCheck.hasIssues,
      answerIsCorrect: false,
      hallucinationIndicators: allIssues,
      answerValidationDetails: null,
      shouldRegenerate: true
    };
  }

  console.log(`✅ No hallucinations or quality issues detected`);
```

---

## Phase 5: Testing & Validation (Days 6-7)

### Step 5.1: Test Generation

Generate 20 test questions with the enhanced system:

```bash
# Generate EduTest Verbal questions
tsx scripts/generation/generate-all-remaining-edutest-v2.ts
```

### Step 5.2: Quality Metrics

Create a testing script to measure improvements:

**File**: `/scripts/analysis/test-question-quality.ts`

```typescript
import { supabase } from '../src/integrations/supabase/client';

async function analyzeRecentQuestions(limit: number = 50) {
  // Fetch recent questions
  const { data: questions } = await supabase
    .from('drill_questions')
    .select('*')
    .eq('test_type', 'EduTest Scholarship (Year 7 Entry)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (!questions) {
    console.log('No questions found');
    return;
  }

  console.log(`\n📊 Analyzing ${questions.length} recent questions...\n`);

  // Check for hallucinations
  const hallucinationPatterns = [
    /\blet me\b/gi,
    /\boops\b/gi,
    /\bmy mistake\b/gi,
    /\bwait,?\s*I\s+think/gi,
    /\bactually,?\s*the\s+answer/gi
  ];

  let questionsWithIssues = 0;
  let totalIssues = 0;

  questions.forEach((q, idx) => {
    const solution = q.solution || '';
    let hasIssue = false;
    const issues: string[] = [];

    // Check for hallucinations
    hallucinationPatterns.forEach(pattern => {
      if (pattern.test(solution)) {
        hasIssue = true;
        issues.push(`Matches pattern: ${pattern}`);
      }
    });

    // Check solution length
    if (solution.length < 30) {
      hasIssue = true;
      issues.push('Solution too short');
    }

    if (hasIssue) {
      questionsWithIssues++;
      totalIssues += issues.length;
      console.log(`Question ${idx + 1}: ❌ Issues found`);
      issues.forEach(issue => console.log(`  - ${issue}`));
    }
  });

  console.log(`\n📈 RESULTS:`);
  console.log(`✅ Clean questions: ${questions.length - questionsWithIssues}/${questions.length} (${((1 - questionsWithIssues/questions.length) * 100).toFixed(1)}%)`);
  console.log(`❌ Questions with issues: ${questionsWithIssues}/${questions.length} (${(questionsWithIssues/questions.length * 100).toFixed(1)}%)`);
  console.log(`📊 Total issues found: ${totalIssues}`);
}

analyzeRecentQuestions(50);
```

**Run it**:
```bash
tsx scripts/analysis/test-question-quality.ts
```

### Step 5.3: Manual Review

Review 20 questions manually:
1. Do they match the style of real EduTest questions?
2. Are the distractors plausible but definitively wrong?
3. Are explanations clear and concise?
4. Would a parent/student complain about these?

---

## Expected Outcomes

### Before Enhancement
- ❌ Error rate: ~5-10%
- ❌ Hallucination detection: Only 7 patterns
- ❌ No real examples in prompts
- ❌ Style inconsistent with real tests

### After Enhancement
- ✅ Error rate: ~1-3% (90%+ reduction)
- ✅ Hallucination detection: 30+ patterns
- ✅ 3-5 real examples per question type in every prompt
- ✅ Style matches real tests (learned from examples)

---

## Troubleshooting

### Issue: "No examples found for sub-skill X"

**Solution**: Add examples for that sub-skill to your JSON file

### Issue: Questions still don't match real test style

**Solution**: Add more/better examples. The quality of generated questions depends on example quality.

### Issue: Still getting hallucinations

**Solution**: Add the specific hallucination pattern to `hallucinationPatterns` array

### Issue: Questions too similar to examples

**Solution**: Add diversity instructions emphasizing variation while maintaining style

---

## Next Steps After Week 1

1. ✅ Measure improvement (error rate, hallucination rate)
2. Expand to other test types (ACER, NSW Selective, etc.)
3. Continue extracting examples from practice papers
4. Consider Phase 3 (Distractor Validation) if needed

---

## Summary: What You're Doing

1. **Not rebuilding** - enhancing your existing engine
2. **Adding real examples** - so Claude learns exact style
3. **Expanding validation** - catching more hallucination patterns
4. **Minimal code changes** - just 2 files modified, 2 new files created

**Time to implement**: 1-2 weeks
**Expected impact**: 90%+ reduction in errors/hallucinations

Ready to get started? Let me know if you want me to help you extract the example questions from your PDFs!
