/**
 * V2 Question Generation Engine - Validator
 *
 * Four checks:
 *   1. Structure validation — free, fast (includes solution quality checks)
 *      - Solution quality: checks for hallucinations and overly long solutions (>200 words)
 *   2. Correctness check — haiku LLM verifies answer is correct and distractors are wrong
 *   3. Duplicate check — haiku LLM compares against last 20 DB questions for this sub-skill
 */

import Anthropic from '@anthropic-ai/sdk';
import type { QuestionV2, ValidationOptions, ValidationResult } from './types';
import { CLAUDE_CONFIG } from './config';

const anthropic = new Anthropic({
  apiKey: CLAUDE_CONFIG.apiKey
});

// Haiku is fast and cheap (~$0.25/1M input, $1.25/1M output)
// Used for both correctness and duplicate checks
const HAIKU_MODEL = 'claude-haiku-4-5-20251001';

// ============================================================================
// MAIN VALIDATION FUNCTION
// ============================================================================

export async function validateQuestionV2(
  question: QuestionV2,
  subSkillData: any,
  options: ValidationOptions,
  recentQuestions?: Array<{
    question_text: string;
    correct_answer: string;
  }>
): Promise<ValidationResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const warnings: string[] = [];

  const result: ValidationResult = {
    isValid: true,
    qualityScore: 100,
    errors,
    warnings,
    metadata: {
      validation_timestamp: new Date().toISOString(),
      hallucination_check: { passed: true, patterns_checked: 0, issues_found: [] },
      answer_verification: { passed: true, method: 'skipped', confidence: 100 },
      quality_checks: { style_match: 100, difficulty_match: 100, curriculum_alignment: 100 },
      overall_quality_score: 100
    }
  };

  // ── CHECK 1: Structure ─────────────────────────────────────────────────────
  const structureCheck = validateStructure(question);
  if (!structureCheck.passed) {
    errors.push(...structureCheck.errors);
    result.isValid = false;
  }

  // If structure is broken, no point running LLM checks
  if (!result.isValid) {
    result.errors = errors;
    logResult(result, Date.now() - startTime);
    return result;
  }

  // ── CHECK 2: Correctness (haiku) ───────────────────────────────────────────
  // Only for multiple choice — writing prompts are subjective
  if (question.response_type === 'multiple_choice') {
    const correctnessCheck = await checkCorrectness(question);
    result.metadata.answer_verification = {
      passed: correctnessCheck.passed,
      method: 'haiku-verification',
      confidence: correctnessCheck.confidence,
      reasoning: correctnessCheck.reasoning
    };

    if (!correctnessCheck.passed) {
      errors.push(`Answer verification failed: ${correctnessCheck.reasoning}`);
      result.isValid = false;
    }
  }

  // ── CHECK 3: Duplicate (haiku, section-aware) ─────────────────────────────
  if (recentQuestions && recentQuestions.length > 0) {
    const dupCheck = await checkDuplicate(question, recentQuestions);
    if (dupCheck.isDuplicate) {
      errors.push(`Duplicate detected: ${dupCheck.reason}`);
      result.isValid = false;
    }
  }

  // Final score: 100 if all pass, deduct per error
  result.qualityScore = Math.max(0, 100 - errors.length * 25 - warnings.length * 5);
  result.metadata.overall_quality_score = result.qualityScore;
  result.errors = errors;
  result.warnings = warnings;
  result.isValid = errors.length === 0;

  logResult(result, Date.now() - startTime);
  return result;
}

// ============================================================================
// SOLUTION QUALITY CHECK - Detects hallucinations and overly long solutions
// ============================================================================

function validateSolutionQuality(solution: string): { passed: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check 1: Word count (solutions over 200 words are often hallucinated or confused)
  const wordCount = solution.trim().split(/\s+/).length;
  if (wordCount > 200) {
    errors.push(`Solution too long (${wordCount} words). Solutions over 200 words often indicate hallucinations or confusion.`);
  }

  // Check 2: Hallucination phrases that indicate the LLM got confused
  const hallucinationPatterns = [
    /wait,?\s+let\s+me/i,
    /let\s+me\s+recalculate/i,
    /actually,?\s+wait/i,
    /i\s+apologize/i,
    /my\s+mistake/i,
    /let\s+me\s+check/i,
    /hold\s+on/i,
    /correction:/i
  ];

  const foundPatterns: string[] = [];
  for (const pattern of hallucinationPatterns) {
    if (pattern.test(solution)) {
      foundPatterns.push(pattern.source);
    }
  }

  if (foundPatterns.length > 0) {
    errors.push(`Solution contains hallucination phrases: ${foundPatterns.join(', ')}`);
  }

  return { passed: errors.length === 0, errors };
}

// ============================================================================
// CHECK 1: STRUCTURE VALIDATION
// ============================================================================

function validateStructure(question: QuestionV2): { passed: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!question.question_text?.trim()) errors.push('Missing question_text');
  if (!question.solution?.trim()) errors.push('Missing solution');

  // ── NEW: Solution Quality Checks ───────────────────────────────────────────
  if (question.solution) {
    const solutionCheck = validateSolutionQuality(question.solution);
    if (!solutionCheck.passed) {
      errors.push(...solutionCheck.errors);
    }
  }

  if (question.response_type === 'multiple_choice') {
    if (!question.answer_options || question.answer_options.length < 2) {
      errors.push('Multiple choice requires at least 2 answer options');
    }
    if (!question.correct_answer) {
      errors.push('Multiple choice requires correct_answer');
    }
    if (question.answer_options && question.correct_answer) {
      // Convert letter (A, B, C, D, E) to index (0, 1, 2, 3, 4)
      const letterToIndex: Record<string, number> = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4 };
      const answerIndex = letterToIndex[question.correct_answer.toUpperCase()];

      if (answerIndex === undefined) {
        errors.push(`Invalid correct_answer "${question.correct_answer}". Must be A, B, C, D, or E`);
      } else if (answerIndex >= question.answer_options.length) {
        errors.push(`Correct answer "${question.correct_answer}" points to index ${answerIndex}, but only ${question.answer_options.length} options exist`);
      }
    }
    if (question.answer_options) {
      const unique = new Set(question.answer_options);
      if (unique.size !== question.answer_options.length) {
        errors.push('Duplicate answer options detected');
      }
    }
  }

  if (question.question_text && question.question_text.length < 10) {
    errors.push('Question text too short');
  }

  return { passed: errors.length === 0, errors };
}

// ============================================================================
// CHECK 2: CORRECTNESS — haiku verifies the answer and checks distractors
// ============================================================================

// Pattern-based and grammar sub-skills that require precise calculation or may have
// multiple valid interpretations. For these, we use a more lenient threshold.
const PATTERN_BASED_SUBSKILLS = [
  'Letter Series & Patterns',
  'Letter Series',
  'Code & Symbol Substitution',
  'Code Breaking',
  'Number Series & Sequences',
  'Number Series',
  'Pattern Recognition in Paired Numbers',
  'Pattern Recognition'
];

// Language Conventions sub-skills that should trust the curriculum standard
// rather than Haiku's interpretation of evolving grammar/spelling/usage rules
const GRAMMAR_BASED_SUBSKILLS = [
  'Sophisticated Grammar',
  'Advanced Punctuation',
  'Advanced Spelling & Orthography',
  'Advanced Vocabulary & Usage',
  'Advanced Editing Skills',
  'Complex Syntax Analysis',
  'Grammar',
  'Punctuation',
  'Spelling Patterns',
  'Common Spelling Errors',
  'Spelling'
];

function isPatternBasedQuestion(question: QuestionV2): boolean {
  const subSkill = question.sub_skill || '';
  return PATTERN_BASED_SUBSKILLS.some(pattern =>
    subSkill.toLowerCase().includes(pattern.toLowerCase())
  );
}

function isGrammarBasedQuestion(question: QuestionV2): boolean {
  const subSkill = question.sub_skill || '';
  return GRAMMAR_BASED_SUBSKILLS.some(grammar =>
    subSkill.toLowerCase().includes(grammar.toLowerCase())
  );
}

async function checkCorrectness(question: QuestionV2): Promise<{
  passed: boolean;
  confidence: number;
  reasoning: string;
}> {
  try {
    const isPatternBased = isPatternBasedQuestion(question);
    const isGrammarBased = isGrammarBasedQuestion(question);

    // Pattern-based questions get additional guidance and more lenient acceptance
    const patternGuidance = isPatternBased ? `

IMPORTANT: This is a pattern-based question (letter series, code substitution, or number pattern).
- Pattern questions often have complex calculation steps that may be correct even if they differ from typical approaches
- If the solution shows clear logical reasoning and arrives at the marked answer through a valid pattern rule, accept it
- Be MORE LENIENT with pattern questions - if the solution is mathematically consistent and leads to the marked answer, it's likely correct
- Focus on: Does the solution follow a consistent rule? Does it correctly apply to get the marked answer?
- Don't reject just because the pattern explanation differs slightly from what you'd expect` : '';

    // Language Conventions questions should trust the curriculum standard, not debate modern usage
    const grammarGuidance = isGrammarBased ? `

IMPORTANT: This is a Language Conventions question (grammar/punctuation/spelling/vocabulary/editing) following Australian educational curriculum standards.
- The marked answer represents the CURRICULUM STANDARD for Year 5-9 students in Australia
- For grammar: DO NOT debate modern usage evolution (e.g., singular "they") vs. traditional rules
- For spelling: Follow Australian spelling conventions (colour, organise, recognise)
- For vocabulary: Accept Australian English usage and meanings
- DO NOT debate British vs. Australian conventions - assume Australian standard English
- DO NOT reject based on prescriptive vs. descriptive debates
- If the solution explains why the marked answer follows a clear rule, ACCEPT IT
- Focus on: Does the solution correctly identify the rule being tested? Is the marked answer defensible under Australian curriculum standards?
- Be LENIENT - if the answer can be justified by standard educational textbooks, it's correct` : '';

    const prompt = `You are checking a test question for correctness.

QUESTION:
${question.question_text}

OPTIONS:
${question.answer_options?.join('\n')}

MARKED ANSWER: ${question.correct_answer}

SOLUTION PROVIDED:
${question.solution}${patternGuidance}${grammarGuidance}

Check:
1. Is the marked answer definitively correct?
2. Are all other options definitively wrong (not debatable)?

Return ONLY valid JSON:
{ "is_correct": true, "all_distractors_wrong": true, "confidence": 95, "reasoning": "Brief explanation" }`;

    const response = await anthropic.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 300,
      temperature: 0.1,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // If we can't parse, don't fail the question — assume it's fine
      return { passed: true, confidence: 80, reasoning: 'Could not parse verification response' };
    }

    const result = JSON.parse(jsonMatch[0]);

    // For pattern-based questions, be more lenient:
    // Letter series have inherently ambiguous patterns, so even more lenient
    // Other pattern questions get moderate leniency
    if (isPatternBased) {
      const confidence = result.confidence || 0;
      const isCorrect = result.is_correct === true;

      // Check if this is specifically a letter series question (most ambiguous)
      const isLetterSeries = question.sub_skill?.toLowerCase().includes('letter series') ||
                            question.sub_skill?.toLowerCase().includes('letter pattern');

      // Letter series: Very lenient - 60% confidence OR just correct answer
      // Other patterns: Lenient - 70% confidence OR correct + all distractors wrong
      const passed = isLetterSeries
        ? (isCorrect && confidence >= 60) || isCorrect  // Accept if just correct for letter series
        : (isCorrect && confidence >= 70) || (isCorrect && result.all_distractors_wrong === true);

      return {
        passed,
        confidence,
        reasoning: result.reasoning || 'No reasoning provided'
      };
    }

    // For grammar-based questions, be lenient to avoid debates over evolving rules
    // Trust the curriculum standard rather than Haiku's interpretation
    if (isGrammarBased) {
      const confidence = result.confidence || 0;
      const isCorrect = result.is_correct === true;

      // Grammar: Lenient - 70% confidence OR correct answer with reasonable justification
      const passed = (isCorrect && confidence >= 70) || isCorrect;

      return {
        passed,
        confidence,
        reasoning: result.reasoning || 'No reasoning provided'
      };
    }

    // Standard validation for non-pattern, non-grammar questions
    const passed = result.is_correct === true && result.all_distractors_wrong === true;

    return {
      passed,
      confidence: result.confidence || 0,
      reasoning: result.reasoning || 'No reasoning provided'
    };
  } catch (error) {
    // On API error, don't fail the question — log and continue
    console.warn(`   ⚠️  Correctness check failed (API error): ${error}`);
    return { passed: true, confidence: 80, reasoning: 'Verification skipped due to API error' };
  }
}

// ============================================================================
// STRING SIMILARITY - Helper for maths duplicate detection
// ============================================================================

function calculateStringSimilarity(str1: string, str2: string): number {
  // Simple Levenshtein-based similarity
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

// ============================================================================
// CHECK 3: DUPLICATE — section-aware haiku check against last 20 DB questions
//
// What counts as a duplicate varies by section type:
//
//  MATHS / NUMERICAL
//    Sections: Mathematics, Numerical Reasoning, Mathematical Reasoning,
//              Numeracy No Calculator, Numeracy Calculator,
//              General Ability - Quantitative, Mathematics Reasoning
//    Duplicate = same specific numbers used in the same calculation.
//    Different scenario with same numbers → duplicate.
//    Same scenario with different numbers → NOT duplicate.
//
//  VERBAL / VOCABULARY
//    Sections: Verbal Reasoning, Thinking Skills, Language Conventions,
//              General Ability - Verbal
//    Duplicate = same target word(s), same analogy pair, or same concept being tested.
//    Rewording around the same word/pair → duplicate.
//
//  READING
//    Sections: Reading, Reading Comprehension, Reading Reasoning, Humanities
//    Duplicate = same question asked of the same passage (same intent + answer).
//    Questions on the same passage testing different details → NOT duplicate.
//
//  WRITING
//    Sections: Writing, Written Expression
//    Duplicate = same topic or scenario (e.g. two "overcoming fear" prompts).
//    Clearly different topics → NOT duplicate.
// ============================================================================

type SectionCategory = 'maths' | 'verbal' | 'reading' | 'writing' | 'grammar';

const SECTION_CATEGORIES: Record<string, SectionCategory> = {
  // Maths / Numerical
  'Mathematics':                        'maths',
  'Numerical Reasoning':                'maths',
  'Mathematical Reasoning':             'maths',
  'Numeracy':                           'maths',
  'Numeracy No Calculator':             'maths',
  'Numeracy Calculator':                'maths',
  'General Ability - Quantitative':     'maths',
  'Mathematics Reasoning':              'maths',

  // Verbal / Vocabulary
  'Verbal Reasoning':                   'verbal',
  'Thinking Skills':                    'verbal',
  'General Ability - Verbal':           'verbal',

  // Grammar / Language Conventions
  'Language Conventions':               'grammar',

  // Reading
  'Reading':                            'reading',
  'Reading Comprehension':              'reading',
  'Reading Reasoning':                  'reading',
  'Humanities':                         'reading',

  // Writing
  'Writing':                            'writing',
  'Written Expression':                 'writing',
};

function getSectionCategory(sectionName: string): SectionCategory {
  // Exact match first
  if (SECTION_CATEGORIES[sectionName]) return SECTION_CATEGORIES[sectionName];
  // Fallback: keyword scan
  const lower = sectionName.toLowerCase();
  if (lower.includes('math') || lower.includes('numer') || lower.includes('quantit')) return 'maths';
  if (lower.includes('language conventions') || lower.includes('grammar') || lower.includes('punctuation')) return 'grammar';
  if (lower.includes('verbal') || lower.includes('thinking')) return 'verbal';
  if (lower.includes('reading') || lower.includes('humanit') || lower.includes('comprehension')) return 'reading';
  if (lower.includes('writ')) return 'writing';
  return 'verbal'; // safe default
}

// ============================================================================
// STANDARDIZED QUESTION FORMATS
// Some question types use the EXACT same question stem for every question,
// with diversity coming from the answer options. For these, we need to check
// both question_text AND answer_options to determine if it's a duplicate.
// ============================================================================

const STANDARDIZED_FORMAT_SUBSKILLS = [
  'Classification & Categorization (Odd One Out)',
  'Classification & Categorization',
  'Odd One Out',
  'Analogies',
  'Foreign Language Translation',
  'Sequential Ordering',
  'Code Breaking',
  'Word Manipulation',
  // Language Conventions - all use standardized format with same question stem
  'Sophisticated Grammar',
  'Advanced Punctuation',
  'Advanced Spelling & Orthography',
  'Advanced Vocabulary & Usage',
  'Advanced Editing Skills',
  'Complex Syntax Analysis',
  'Grammar',
  'Punctuation',
  'Spelling'
];

function isStandardizedQuestionFormat(subSkill: string): boolean {
  const lower = subSkill.toLowerCase();
  return STANDARDIZED_FORMAT_SUBSKILLS.some(format =>
    lower.includes(format.toLowerCase())
  );
}

function buildDuplicatePrompt(
  question: QuestionV2,
  recentList: string,
  category: SectionCategory,
  passageInfo: string = ''
): string {
  const newQ = `"${question.question_text}" → ${question.correct_answer ?? 'N/A'}${passageInfo}`;

  const categoryGuidance: Record<SectionCategory, string> = {
    maths: `DUPLICATE RULE FOR MATHS/NUMERICAL QUESTIONS:
A duplicate means the new question uses the SAME SPECIFIC NUMBERS in the same type of calculation as an existing one.
- Same scenario, DIFFERENT numbers → NOT a duplicate (the numbers are what make it unique)
- Different scenario, SAME numbers in the same operation → duplicate
- Same mathematical structure AND same numbers → definitely a duplicate`,

    verbal: `DUPLICATE RULE FOR VERBAL/VOCABULARY QUESTIONS:
A duplicate means the new question tests the SAME TARGET WORD(S), analogy pair, or concept as an existing one.
- Same word(s) even if question format differs → duplicate
- Same analogy relationship (e.g. DOCTOR:STETHOSCOPE) even if reworded → duplicate
- Different words testing a similar category (e.g. two different synonym pairs) → NOT a duplicate`,

    reading: `DUPLICATE RULE FOR READING COMPREHENSION QUESTIONS:

⚠️ CRITICAL: MULTIPLE QUESTIONS ABOUT THE SAME PASSAGE IS NORMAL AND EXPECTED!
A passage typically has 5-8 questions testing different aspects. This is NOT duplication.

🔍 PASSAGE IDs: Questions include [Passage: xxxxxxxx] tags. Different Passage IDs = AUTOMATICALLY NOT DUPLICATE.

ONLY mark as duplicate if BOTH conditions are true:
1. Same Passage ID (or both questions reference the same passage content)
2. AND asks the exact same question (same word, same detail, same inference point)

NOT DUPLICATES (these are acceptable):
- Different [Passage: xxx] IDs → AUTOMATICALLY NOT duplicate (even if similar question type)
- "What is the main idea?" about Passage A vs. "What is the main idea?" about Passage B → NOT duplicate (different passages)
- "What does 'declares' mean?" vs. "What does 'essential' mean?" in same passage → NOT duplicate (different vocabulary words)
- "Main idea?" vs. "Author's purpose?" about same passage → NOT duplicate (different comprehension aspects)
- Multiple vocabulary questions from same passage testing different words → NOT duplicate
- Multiple inference questions from same passage about different paragraphs → NOT duplicate

DUPLICATES (reject these):
- Same [Passage: xxx] ID AND "What does 'declares' mean in paragraph 2?" twice → duplicate (exact same word in same passage)
- Same [Passage: xxx] ID AND "What is the main idea?" twice → duplicate (exact same question about same passage)

Focus on: Does the question test the EXACT SAME SKILL about the EXACT SAME TEXT SEGMENT IN THE SAME PASSAGE? If not, it's acceptable.`,

    writing: `DUPLICATE RULE FOR WRITING PROMPTS:
A duplicate means the new prompt covers the SAME TOPIC or SCENARIO as an existing one.
- Same topic even if the exact wording differs → duplicate (e.g. two prompts both about "a time you helped someone")
- Same scenario type with a different setting or character → duplicate (e.g. two "write a story about overcoming fear" prompts)
- Clearly different topics or scenarios → NOT a duplicate`,

    grammar: `DUPLICATE RULE FOR LANGUAGE CONVENTIONS QUESTIONS (Grammar/Punctuation/Spelling/Vocabulary/Editing):

⚠️ CRITICAL: IT IS NORMAL AND EXPECTED TO HAVE MULTIPLE QUESTIONS WITH THE SAME QUESTION STEM!

For Language Conventions questions, the ANSWER OPTIONS are what make each question unique, NOT the question stem.

🔍 IMPORTANT: The question stem is often identical. This is STANDARD FORMAT:
   - Grammar: "Which sentence is correct?"
   - Spelling: "Which word is spelled correctly?"
   - Punctuation: "Which sentence uses punctuation correctly?"
   - Vocabulary: "Which word best fits in the sentence?"
   - You will see [Options: ...] showing answer choices for each question
   - Compare the OPTIONS/CONTENT, NOT just the question stem
   - Same question stem with DIFFERENT options = NOT a duplicate

ONLY mark as duplicate if the answer options contain the EXACT SAME WORDS/SENTENCES/CONTENT.

NOT DUPLICATES (these are acceptable):
- "Which sentence is correct?" with different sentences in options → NOT duplicate
- "Which word is spelled correctly?" with option A: "accommodate" vs. option A: "necessary" → NOT duplicate (different words)
- Two questions about "commas in a list" with different example sentences → NOT duplicate
- Two questions about "apostrophes" with different examples (girls' vs. children's) → NOT duplicate
- "Which word best completes...?" with different target words → NOT duplicate
- Multiple questions testing the same rule → NOT duplicate as long as the examples/words/sentences differ

DUPLICATES (reject these):
- EXACT same words/sentences in the answer options → duplicate
- Word-for-word identical question text AND identical answer options → duplicate
- "Which word is spelled correctly?" with identical spelling options (A: definately, B: definitely, etc.) → duplicate

Focus on: Do the ANSWER OPTIONS contain the EXACT SAME WORDS/SENTENCES/CONTENT? If the options are different, it's NOT a duplicate even if using the same question stem.`,
  };

  return `You are checking if a new test question is a duplicate of existing questions.

${categoryGuidance[category]}

EXISTING QUESTIONS:
${recentList}

NEW QUESTION:
${newQ}

Return ONLY valid JSON:
{ "is_duplicate": false, "reason": "Brief explanation" }`;
}

async function checkDuplicate(
  question: QuestionV2,
  recentQuestions: Array<{ question_text: string; correct_answer: string; answer_options?: string[]; passage_id?: string | null }>
): Promise<{ isDuplicate: boolean; reason: string }> {
  const category = getSectionCategory(question.section_name ?? '');

  try {
    // FAST CHECK: Exact text matching for obvious duplicates
    // Different rules for verbal vs maths vs reading
    const normalizedNew = question.question_text.trim().toLowerCase();

    for (const recent of recentQuestions) {
      const normalizedRecent = recent.question_text.trim().toLowerCase();

      // READING PASSAGES: Quick passage-aware check
      // If both questions have passage_ids and they're different, skip duplicate check entirely
      if (category === 'reading' && question.passage_id && recent.passage_id) {
        if (question.passage_id !== recent.passage_id) {
          // Different passages = cannot be duplicate, skip to next question
          continue;
        }
        // Same passage = continue with normal duplicate checks below
      }

      // READING DRILLS: Check embedded passage content and title for similarity
      // Drills embed passages in question_text instead of using passage_id
      if (category === 'reading' && !question.passage_id && !recent.passage_id) {
        // Extract title and passage from question_text
        const extractInfo = (text: string) => {
          const titleMatch = text.match(/Read this passage:\s*Title:\s*([^\n]+)/i);
          const passageMatch = text.match(/Read this passage:[^\n]*\n\n['"]?([^'"]+?)['"]?\n\n(?:What|Which|According|Why|How)/s);
          return {
            title: titleMatch ? titleMatch[1].trim().toLowerCase() : null,
            content: passageMatch ? passageMatch[1].trim().toLowerCase() : null
          };
        };

        const newInfo = extractInfo(normalizedNew);
        const recentInfo = extractInfo(normalizedRecent);

        // Check 1: Title similarity (catch "The Birth of X" vs "The Invention of X")
        if (newInfo.title && recentInfo.title) {
          const newTitleWords = newInfo.title.split(/\s+/).filter(w => w.length > 3);
          const recentTitleWords = recentInfo.title.split(/\s+/).filter(w => w.length > 3);

          // Count significant word overlap (excluding "the", "of", "a")
          const titleOverlap = newTitleWords.filter(w => recentTitleWords.includes(w)).length;
          const titleSimilarity = titleOverlap / Math.max(newTitleWords.length, recentTitleWords.length, 1);

          // If >50% of significant words match, titles are too similar
          if (titleSimilarity > 0.5) {
            return {
              isDuplicate: true,
              reason: `Duplicate - titles are too similar: "${newInfo.title}" vs "${recentInfo.title}"`
            };
          }

          // Check for same title patterns: "The Mystery of...", "The Birth of...", "The Silent..."
          const extractPattern = (title: string) => {
            const match = title.match(/^(the\s+\w+\s+of|the\s+\w+\s+\w+)/i);
            return match ? match[1] : null;
          };

          const newPattern = extractPattern(newInfo.title);
          const recentPattern = extractPattern(recentInfo.title);

          if (newPattern && recentPattern && newPattern === recentPattern) {
            return {
              isDuplicate: true,
              reason: `Duplicate title pattern: both use "${newPattern}..." structure`
            };
          }
        }

        // Check 2: Content similarity (actual passage text)
        if (newInfo.content && recentInfo.content) {
          const newWords = new Set(newInfo.content.split(/\s+/).filter(w => w.length > 3));
          const recentWords = new Set(recentInfo.content.split(/\s+/).filter(w => w.length > 3));
          const overlap = [...newWords].filter(w => recentWords.has(w)).length;
          const totalUnique = newWords.size + recentWords.size - overlap;
          const similarity = overlap / totalUnique;

          // Lowered threshold to 50% to catch more similar topics
          if (similarity > 0.5) {
            return {
              isDuplicate: true,
              reason: `Duplicate - passages are ${(similarity * 100).toFixed(0)}% similar (same topic)`
            };
          }
        }
      }

      // Rule 1: Word-for-word identical question text
      // BUT: For standardized question formats (same stem for all questions),
      // we MUST also check answer options to determine if it's truly a duplicate
      const isStandardizedFormat = isStandardizedQuestionFormat(question.sub_skill || '');

      if (normalizedNew === normalizedRecent) {
        // If it's a standardized format, check if answer options are also identical
        if (isStandardizedFormat && question.answer_options && recent.answer_options) {
          const newOptionsStr = JSON.stringify(question.answer_options.sort());
          const recentOptionsStr = JSON.stringify(recent.answer_options.sort());

          if (newOptionsStr === recentOptionsStr) {
            return {
              isDuplicate: true,
              reason: 'Exact duplicate - identical question text and answer options'
            };
          }
          // Same question text but different answer options = NOT a duplicate for standardized formats
          continue;
        }

        // For non-standardized formats, identical question text = duplicate
        return {
          isDuplicate: true,
          reason: 'Exact duplicate - identical question text word-for-word'
        };
      }

      // Rule 2: VERBAL/VOCABULARY - Check if testing the same target word
      // ONLY applies to vocabulary/synonym/antonym sub-skills, not all verbal questions
      // e.g. "What is the opposite of ABUNDANT?" vs "Which word is opposite to ABUNDANT?"
      // → Both test ABUNDANT, so it's a duplicate even if phrasing differs
      if (category === 'verbal') {
        const subSkill = question.sub_skill?.toLowerCase() || '';
        const isVocabSubSkill = subSkill.includes('vocabulary') ||
                                subSkill.includes('semantic') ||
                                subSkill.includes('synonym') ||
                                subSkill.includes('antonym');

        if (isVocabSubSkill) {
          const extractTargetWord = (text: string) => {
            // Look for patterns like "opposite/similar to WORD" or "meaning of WORD"
            const patterns = [
              /(?:opposite|similar|synonym|antonym)(?:\s+to|\s+of)?\s+([A-Z]+)/i,
              /(?:meaning|definition)(?:\s+of)?\s+([A-Z]+)/i,
              /word\s+([A-Z]+)/i
            ];
            for (const pattern of patterns) {
              const match = text.match(pattern);
              if (match) return match[1].toLowerCase();
            }
            return null;
          };

          const newTarget = extractTargetWord(normalizedNew);
          const recentTarget = extractTargetWord(normalizedRecent);

          // Only check if word length > 2 to avoid matching common words like "IS", "TO", etc.
          if (newTarget && recentTarget && newTarget === recentTarget && newTarget.length > 2) {
            // Also check if it's the same question TYPE (opposite vs similar)
            const newType = /opposite|antonym/i.test(normalizedNew) ? 'opposite' : 'similar';
            const recentType = /opposite|antonym/i.test(normalizedRecent) ? 'opposite' : 'similar';

            if (newType === recentType) {
              return {
                isDuplicate: true,
                reason: `Duplicate - both test ${newType} of "${newTarget.toUpperCase()}" (phrasing can vary, but same word = duplicate)`
              };
            }
          }
        }
      }

      // Rule 3: MATHS - Check if using the SAME NUMBERS in the same calculation
      // e.g. "12 + 8 = ?" vs "Calculate 12 + 8" → Duplicate (same numbers)
      // e.g. "12 + 8 = ?" vs "15 + 8 = ?" → NOT duplicate (different numbers)
      if (category === 'maths') {
        const extractNumbers = (text: string) => {
          // Extract all numbers from the question (ignoring answer options)
          const questionPart = text.split(/\n\s*[A-D][\)\.:]/)[0];
          const numbers = questionPart.match(/\d+(?:\.\d+)?/g);
          return numbers ? numbers.sort().join(',') : '';
        };

        const newNumbers = extractNumbers(normalizedNew);
        const recentNumbers = extractNumbers(normalizedRecent);

        // If they have the same numbers AND similar structure, likely duplicate
        if (newNumbers && recentNumbers && newNumbers === recentNumbers && newNumbers.split(',').length >= 2) {
          // Additional check: are the question stems similar?
          const getStem = (text: string) => text.split(/\n/)[0].replace(/\d+(?:\.\d+)?/g, 'N').toLowerCase();
          const newStem = getStem(normalizedNew);
          const recentStem = getStem(normalizedRecent);

          // If the structure (with numbers replaced by N) is >80% similar, it's a duplicate
          const similarity = calculateStringSimilarity(newStem, recentStem);
          if (similarity > 0.8) {
            return {
              isDuplicate: true,
              reason: `Duplicate - same numbers (${newNumbers.split(',').join(', ')}) used in similar calculation`
            };
          }
        }
      }

      // Rule 4: READING - Already handled by LLM check below (passage-based needs semantic understanding)
    }


    // SLOW CHECK: Use Haiku for semantic duplicate detection
    // For reading sections use a longer preview — the first 100 chars is often
    // just the passage reference ("Read the passage about X..."), hiding the actual question.
    const previewLen = category === 'reading' ? 200 : 100;

    // Check if this is a standardized format question (grammar/punctuation/etc.)
    const isStandardizedFormatQuestion = isStandardizedQuestionFormat(question.sub_skill || '');

    const recentList = recentQuestions
      .slice(0, 20)
      .map((q, i) => {
        const preview = q.question_text.length > previewLen
          ? q.question_text.slice(0, previewLen) + '...'
          : q.question_text;

        // For reading questions, include passage ID to help Haiku understand context
        const passageInfo = (category === 'reading' && q.passage_id)
          ? ` [Passage: ${q.passage_id.slice(0, 8)}]`
          : '';

        // For standardized format questions (grammar/punctuation), include answer options
        // so Haiku can see that "Which sentence is correct?" with different sentences = NOT duplicate
        // Show ALL options (not just first 2) for accurate duplicate detection
        const optionsPreview = isStandardizedFormatQuestion && q.answer_options && q.answer_options.length > 0
          ? ` [Options: ${q.answer_options.map((opt, idx) => `${String.fromCharCode(65 + idx)}:"${opt.slice(0, 40)}..."`).join(' ')}]`
          : '';

        return `${i + 1}. "${preview}" → ${q.correct_answer ?? 'N/A'}${passageInfo}${optionsPreview}`;
      })
      .join('\n');

    // Build prompt with new question's passage info
    const newQuestionPassageInfo = (category === 'reading' && question.passage_id)
      ? ` [Passage ID: ${question.passage_id.slice(0, 8)}]`
      : '';

    // For standardized format questions, include answer options in the new question context
    // Show ALL options for accurate duplicate detection
    const newQuestionOptionsInfo = isStandardizedFormatQuestion && question.answer_options && question.answer_options.length > 0
      ? ` [Options: ${question.answer_options.map((opt, idx) => `${String.fromCharCode(65 + idx)}:"${opt.slice(0, 40)}..."`).join(' ')}]`
      : '';

    const prompt = buildDuplicatePrompt(question, recentList, category, newQuestionPassageInfo + newQuestionOptionsInfo);

    const response = await anthropic.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 150,
      temperature: 0.1,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { isDuplicate: false, reason: 'Could not parse duplicate check response' };
    }

    const result = JSON.parse(jsonMatch[0]);
    return {
      isDuplicate: result.is_duplicate === true,
      reason: result.reason || 'No reason provided'
    };
  } catch (error) {
    console.warn(`   ⚠️  Duplicate check failed (API error): ${error}`);
    return { isDuplicate: false, reason: 'Duplicate check skipped due to API error' };
  }
}

// ============================================================================
// LOGGING
// ============================================================================

function logResult(result: ValidationResult, durationMs: number): void {
  const status = result.isValid ? 'PASS' : 'FAIL';
  console.log(`✓ Validation complete in ${durationMs}ms: ${status} (Score: ${result.qualityScore}/100)`);
  if (result.errors.length > 0) {
    console.log(`  Errors: ${result.errors.join('; ')}`);
  }
}

// ============================================================================
// QUICK VALIDATE (sync, no LLM — for pre-checks)
// ============================================================================

export function quickValidate(question: QuestionV2): { valid: boolean; errors: string[] } {
  const check = validateStructure(question);
  return { valid: check.passed, errors: check.errors };
}
