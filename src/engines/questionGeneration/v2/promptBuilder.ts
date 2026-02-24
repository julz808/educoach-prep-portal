/**
 * V2 Question Generation Engine - Prompt Builder
 * Lean, non-repetitive prompts using curriculum examples + recent DB questions for diversity
 */

import type { PromptContext, BuiltPrompt } from './types';
import type { SubSkillExample } from '@/data/curriculumData_v2/types';
import { GENERATION_CONFIG, getDifficultyDescriptor } from './config';

// ============================================================================
// PASSAGE DIFFICULTY GUIDANCE
// Concrete, calibrated guidance per difficulty level so the LLM knows exactly
// what vocabulary complexity, sentence structure, and concept depth to use.
// Anchored to year level so Year 5 difficulty 2 ≠ Year 9 difficulty 2.
// ============================================================================

function getPassageDifficultyGuidance(difficulty: number, yearLevel: number): string {
  const base: Record<number, { vocab: string; sentences: string; concepts: string }> = {
    1: {
      vocab: 'common everyday words, no technical jargon, any unusual word is explained in context',
      sentences: 'short to medium sentences (8–15 words average), simple clause structure',
      concepts: 'concrete, familiar topics with clear cause-and-effect; no abstract reasoning required'
    },
    2: {
      vocab: 'mix of familiar and moderately advanced vocabulary; some subject-specific terms used naturally',
      sentences: 'varied sentence length (10–20 words average), some subordinate clauses',
      concepts: 'requires some inference and connecting ideas across paragraphs; moderate abstraction'
    },
    3: {
      vocab: 'advanced vocabulary including technical or domain-specific terms; figurative language used',
      sentences: 'complex, varied syntax; longer sentences with multiple clauses common',
      concepts: 'nuanced ideas, implicit meaning, requires critical reading and synthesis across sections'
    }
  };

  // Year-level calibration: Year 5 difficulty 2 should be easier than Year 7 difficulty 2
  const yearAdjustment: Record<number, string> = {
    5: `Calibrated for Year 5 students (age 10–11). Even at higher difficulty, keep vocabulary within the range of a strong primary school reader.`,
    7: `Calibrated for Year 7 students (age 12–13). Vocabulary and sentence complexity appropriate for high school entry level.`,
    9: `Calibrated for Year 9 students (age 14–15). Sophisticated vocabulary and complex syntax expected even at lower difficulty levels.`
  };

  const level = base[difficulty] || base[2];
  const yearNote = yearAdjustment[yearLevel] || yearAdjustment[7];

  return `Difficulty ${difficulty} passage requirements:
- Vocabulary: ${level.vocab}
- Sentence structure: ${level.sentences}
- Conceptual depth: ${level.concepts}
${yearNote}`;
}

// ============================================================================
// MAIN PROMPT BUILDING FUNCTION
// ============================================================================

export function buildPromptWithExamples(context: PromptContext): BuiltPrompt {
  const {
    testType,
    section,
    subSkill,
    difficulty,
    subSkillData,
    examples,
    pattern
  } = context;

  // Select examples closest to target difficulty
  // Pattern-based sub-skills need more examples due to variety of patterns
  const exampleCount = getExampleCountForSubSkill(subSkill);
  const selectedExamples = selectExamplesForDifficulty(examples, difficulty, exampleCount);

  // Format the recent questions block (up to 20, from DB)
  const recentQuestionsBlock = formatRecentQuestions(context.recentQuestions);

  // NEW: Format previous failures from this session
  const previousFailuresBlock = formatPreviousFailures(context.previousFailures);

  // Passage block (only for reading comprehension)
  const passageBlock = context.passage ? buildPassageContext(context.passage) : '';

  // Sub-skill specific guidance
  const subSkillGuidance = getSubSkillSpecificGuidance(subSkill);

  const prompt = `You are an expert question writer for ${testType}.

Generate ONE ${section} question for the sub-skill: "${subSkill}"
Difficulty: ${difficulty} (${getDifficultyDescriptor(difficulty)})

CRITICAL: This question MUST be answerable from the text alone. NO VISUAL AIDS WILL BE PROVIDED TO STUDENTS.
- If the question involves a table: Include complete table data in markdown format in question_text
- If the question involves a grid/pattern: Include ALL grid values as text (e.g., "Row 1: 2, 4, 6. Row 2: 3, 6, 9...")
- If the question involves geometry: Include ALL measurements and dimensions in question_text
- If the question involves data/charts: Include ALL necessary data values in question_text
- Use clear, complete textual descriptions. The student will NOT see any diagram or visual.

DESCRIPTION: ${subSkillData.description}
FORMAT: ${subSkillData.question_format}
${passageBlock}
EXAMPLES — study these for style, difficulty level, and format. Your question must feel like it belongs in the same test:

${formatExamples(selectedExamples)}

Pattern:
- ${pattern.key_characteristics.slice(0, 3).join('\n- ')}
- Difficulty ${difficulty}: ${pattern.difficulty_progression[difficulty.toString() as '1' | '2' | '3']}
- Distractors: ${pattern.distractor_strategies.slice(0, 3).join('; ')}

Be creative with scenarios — use varied contexts (sports, nature, technology, history, everyday life, etc). Never reuse a scenario from the examples above.

⚠️ CRITICAL: RANDOMIZE CORRECT ANSWER POSITION
- The correct answer should appear in DIFFERENT positions across questions
- Do NOT always put the correct answer in position B
- Vary between A, B, C, D, E positions randomly
- This is essential for test validity and preventing answer pattern bias

${subSkillGuidance}${recentQuestionsBlock}${previousFailuresBlock}
Return ONLY valid JSON, no markdown:

${buildOutputFormat(false)}

Generate the question now:`;

  return {
    prompt,
    metadata: {
      examples_included: selectedExamples.length,
      prompt_length: prompt.length,
      pattern_type: subSkill,
      difficulty_guidance: pattern.difficulty_progression[difficulty.toString() as '1' | '2' | '3'] || 'Standard'
    }
  };
}

// ============================================================================
// EXAMPLE COUNT — pattern-based sub-skills need more examples
// ============================================================================

function getExampleCountForSubSkill(subSkill: string): number {
  const subSkillLower = subSkill.toLowerCase();

  // Letter Series: most variety, show 4-5 examples
  if (subSkillLower.includes('letter series') || subSkillLower.includes('letter pattern')) {
    return 5;
  }

  // Number Series: multiple pattern types, show 3 examples
  if (subSkillLower.includes('number series') ||
      subSkillLower.includes('number pattern') ||
      subSkillLower.includes('pattern recognition')) {
    return 3;
  }

  // Punctuation: many punctuation types, show 3 examples
  if (subSkillLower.includes('punctuation')) {
    return 3;
  }

  // Grid/Matrix patterns: complex 2D patterns, show 3 examples
  if (subSkillLower.includes('matrix') ||
      subSkillLower.includes('grid pattern')) {
    return 3;
  }

  // Default: 2 examples
  return 2;
}

// ============================================================================
// EXAMPLE SELECTION — prefer exact difficulty match
// ============================================================================

function selectExamplesForDifficulty(
  examples: SubSkillExample[],
  targetDifficulty: number,
  max: number = 2
): SubSkillExample[] {
  const sorted = [...examples].sort((a, b) =>
    Math.abs(a.difficulty - targetDifficulty) - Math.abs(b.difficulty - targetDifficulty)
  );
  return sorted.slice(0, max);
}

// ============================================================================
// FORMAT EXAMPLES — compact, no redundant labels
// ============================================================================

function formatExamples(examples: SubSkillExample[]): string {
  return examples.map((ex, i) => {
    let text = `Example ${i + 1} (Difficulty ${ex.difficulty}):\nQ: ${ex.question_text}`;
    if (ex.answer_options?.length) {
      text += `\n${ex.answer_options.join('  ')}`;
    }
    if (ex.correct_answer) {
      text += `\nAnswer: ${ex.correct_answer}`;
    }
    if (ex.explanation) {
      text += `\nNote: ${ex.explanation}`;
    }
    return text;
  }).join('\n\n');
}

// ============================================================================
// RECENT QUESTIONS — the primary diversity mechanism
// Shows the 20 most recent questions (out of potentially hundreds) in the prompt.
// Claude sees these and avoids repeating them.
// The duplicate validator checks against ALL questions loaded from DB.
// ============================================================================

function formatRecentQuestions(recentQuestions?: Array<{
  question_text: string;
  answer_options: string[];
  correct_answer: string;
  solution: string;
  test_mode: string;
  created_at: string;
}>): string {
  if (!recentQuestions || recentQuestions.length === 0) return '';

  // Show ALL existing questions in the prompt so the LLM has complete context
  // This prevents duplicate generation entirely
  const lines = recentQuestions.map((q, i) => {
    const preview = q.question_text.length > 120
      ? q.question_text.slice(0, 120) + '...'
      : q.question_text;
    return `${i + 1}. "${preview}" → ${q.correct_answer}`;
  });

  const total = recentQuestions.length;

  return `
ALREADY GENERATED FOR THIS SUB-SKILL (${total} total questions) — do NOT repeat ANY of these. Different wording of the same concept also counts as a repeat:
${lines.join('\n')}
`;
}

// ============================================================================
// PREVIOUS FAILURES — learning from mistakes in the current session
// Shows questions that failed validation (duplicates, incorrect answers, etc.)
// Claude can learn from these and pivot to avoid the same mistakes.
// ============================================================================

function formatPreviousFailures(previousFailures?: Array<{
  question: string;
  reason: string;
}>): string {
  if (!previousFailures || previousFailures.length === 0) return '';

  const lines = previousFailures.map((f, i) => {
    return `${i + 1}. "${f.question}"\n   ❌ REASON: ${f.reason}`;
  });

  return `

⚠️ PREVIOUS ATTEMPTS THAT FAILED — Learn from these and pivot your approach:
${lines.join('\n\n')}

You MUST generate something clearly different from the failed attempts above. If the failure was a duplicate, choose a completely different topic/scenario/concept. If the failure was an incorrect answer, ensure your logic is sound.
`;
}

// ============================================================================
// PASSAGE CONTEXT (reading comprehension only)
// ============================================================================

import type { PassageV2 } from './types';

function buildPassageContext(passage: PassageV2): string {
  return `
PASSAGE — your question must be answerable from this text only:
Title: ${passage.title}
${passage.content}

`;
}

// ============================================================================
// VISUAL INSTRUCTION (only when required)
// ============================================================================

function buildVisualInstruction(subSkillData: any): string {
  return `
VISUAL REQUIRED — include a "visual_spec" in your JSON:
{
  "type": "geometry|chart|graph|number_line|grid|html_table|pattern",
  "description": "Detailed description of what to draw",
  "parameters": { ... specific values, labels, dimensions }
}
Rules: Use "html_table" for any data tables. If a chart asks students to calculate a value, do NOT show that value directly in the chart — show the raw data only.
`;
}

// ============================================================================
// OUTPUT FORMAT
// ============================================================================

function buildOutputFormat(visualRequired: boolean): string {
  // Visual requirement is now always false - all data must be in question_text
  return `{
  "question_text": "Complete question text with ALL data and information needed to answer (tables in markdown, all measurements, all values)",
  "answer_options": ["A) ...", "B) ...", "C) ...", "D) ...", "E) ..."],
  "correct_answer": "B",
  "solution": "• [step 1]\\n• [step 2]\\n• Therefore, the answer is B because [reason]"
}`;
}

// ============================================================================
// WRITING PROMPT (extended response questions)
// ============================================================================

export function buildWritingPrompt(context: PromptContext): BuiltPrompt {
  const { testType, section, subSkill, difficulty, subSkillData, examples } = context;

  const selectedExamples = selectExamplesForDifficulty(examples, difficulty, 2);

  // NEW: Include previous failures for learning
  const previousFailuresBlock = formatPreviousFailures(context.previousFailures);

  const prompt = `You are an expert question writer for ${testType}.

Generate ONE ${subSkill} writing prompt for the ${section} section, difficulty ${difficulty}.

DESCRIPTION: ${subSkillData.description}

EXAMPLES — match this style and complexity:

${selectedExamples.map((ex, i) => `Example ${i + 1}:\n${ex.question_text}\nAssessment focus: ${ex.explanation}`).join('\n\n')}

Use Australian spelling. Be creative with the topic — topics can draw from anywhere in the world.${previousFailuresBlock}

Return ONLY valid JSON:
{
  "question_text": "The complete writing prompt with all instructions",
  "answer_options": null,
  "correct_answer": null,
  "solution": "Marking criteria: [key criteria for a strong response]"
}`;

  return {
    prompt,
    metadata: {
      examples_included: selectedExamples.length,
      prompt_length: prompt.length,
      pattern_type: 'writing',
      difficulty_guidance: `Difficulty ${difficulty}`
    }
  };
}

// ============================================================================
// PASSAGE GENERATION PROMPT
// ============================================================================

// Detailed guidance per passage type — what to write, what sub-skills it serves,
// what topics are appropriate, what to avoid.
const PASSAGE_TYPE_GUIDANCE: Record<string, {
  description: string;
  subSkillsServed: string;
  topicIdeas: string;
  avoid: string;
}> = {
  narrative: {
    description: 'A story with characters, setting, plot arc, conflict and resolution. Use dialogue, descriptive language, and show character motivation.',
    subSkillsServed: 'character analysis, inference about feelings/motivation, theme identification, literary devices, narrative comprehension',
    topicIdeas: 'coming-of-age moments, friendship or family challenges, overcoming a personal obstacle, discovery or adventure, moral dilemmas, cultural experiences, historical fiction, science fiction, mystery',
    avoid: 'statistics, data, arguments, persuasive language — this is fiction, not opinion or fact'
  },
  informational: {
    description: 'An expository or explanatory text. Clear topic sentences, well-organised paragraphs, factual content with examples, academic but accessible tone.',
    subSkillsServed: 'main idea & supporting details, text structure & organisation, vocabulary in context, literal comprehension, author\'s purpose (to inform)',
    topicIdeas: 'science phenomena (space, biology, climate, physics), technology and innovation, history and civilisations, geography and ecosystems, social issues, health and medicine, archaeology, economics basics, mathematics in real life',
    avoid: 'character arcs, emotional narrative, personal opinion or bias — this is factual explanation, not story or argument'
  },
  persuasive: {
    description: 'An opinion or argument piece. Clear position, supporting evidence, rhetorical techniques (repetition, rhetorical questions, emotive language, statistics), logical structure.',
    subSkillsServed: 'author\'s purpose & perspective, persuasive techniques, evaluating arguments & evidence, bias detection, inference & interpretation',
    topicIdeas: 'environmental debates, technology in schools, animal rights, urban development, social media effects, sports and health policy, climate action, cultural preservation, economic inequality, space exploration funding',
    avoid: 'neutral tone, balanced "both sides" analysis — take a clear position and argue it'
  },
  poetry: {
    description: 'A poem with deliberate structure, imagery, and sound devices. Can be rhyming or free verse. Should contain rich figurative language, varied line lengths, and layers of meaning.',
    subSkillsServed: 'poetry analysis, literary devices (metaphor, simile, alliteration, onomatopoeia, personification), figurative language, theme identification, tone and mood',
    topicIdeas: 'nature and seasons, identity and belonging, loss and memory, wonder and curiosity, human connection, the passage of time, urban vs rural life, conflict and peace',
    avoid: 'prose-like structure — this must read as a poem, not a short story or paragraph'
  },
  visual: {
    description: 'A short caption or contextual description accompanying a visual (poster, infographic, advertisement, diagram, photograph). The text is minimal — the visual is the primary content.',
    subSkillsServed: 'visual literacy, interpreting meaning from images, multimodal analysis, author\'s purpose',
    topicIdeas: 'public health campaign, environmental awareness poster, historical photograph, infographic about statistics, advertisement, political cartoon description, data visualisation',
    avoid: 'long prose — keep to 0–100 words of caption/context text only'
  },
  multimodal: {
    description: 'A text that combines written content with references to visual elements (graphs, images, maps, tables). Written component is 200–500 words and explicitly references the visuals.',
    subSkillsServed: 'synthesising information across modes, visual literacy, data interpretation, text structure, vocabulary in context',
    topicIdeas: 'news report with infographic, science report with diagram, travel article with map, data analysis with charts, historical report with photograph',
    avoid: 'purely text-based content — must reference or integrate visual elements'
  },
  micro: {
    description: 'A very short passage (50–150 words) — a single paragraph or two. Dense enough to contain one clear idea and 1–2 testable vocabulary items or inferences.',
    subSkillsServed: 'vocabulary in context, a single inference, literal comprehension',
    topicIdeas: 'any topic — keep it simple and self-contained. A brief scene, a single fact, a short description, a product label, a sign, a brief biographical note',
    avoid: 'complex arguments or multi-strand narratives — this is a single idea only'
  },
  medium: {
    description: 'A focused passage (200–350 words) with a clear structure. Enough content to support 2–4 questions across different sub-skills.',
    subSkillsServed: 'comprehension, main idea, inference, vocabulary in context',
    topicIdeas: 'any appropriate topic for the test type — balance across science, history, social issues, human interest',
    avoid: 'overly complex multi-strand content that cannot be tested in 2–4 questions'
  },
  long: {
    description: 'A substantive passage (400–600 words) with full development — introduction, body paragraphs, conclusion. Rich enough to support 4–6 questions at varying difficulty levels.',
    subSkillsServed: 'literary analysis, theme & author\'s purpose, critical reading, text structure, character analysis, evaluating arguments',
    topicIdeas: 'complex topics deserving full exploration — historical events, scientific breakthroughs, social policy, literary narrative, philosophical questions',
    avoid: 'thin content that cannot sustain 4+ distinct questions'
  }
};

export function buildPassagePrompt(
  testType: string,
  section: string,
  passageType: string,
  wordCount: number,
  difficulty: number,
  usedTopics: string[] = []
): string {
  const guidance = PASSAGE_TYPE_GUIDANCE[passageType] || PASSAGE_TYPE_GUIDANCE['informational'];

  const topicDiversityBlock = usedTopics.length > 0
    ? `\nALREADY USED TOPICS — do NOT repeat these subjects or themes:
${usedTopics.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Choose a FRESH topic that is clearly different from all of the above.\n`
    : '';

  const yearLevel = testType.includes('Year 5') ? 5
    : testType.includes('Year 9') ? 9
    : 7;

  const difficultyGuidance = getPassageDifficultyGuidance(difficulty, yearLevel);

  return `You are an expert educational content writer for ${testType}. Generate a reading passage for the ${section} section.

PASSAGE TYPE: ${passageType}
${guidance.description}

TARGET WORD COUNT: ${wordCount} words (±15% is acceptable)
SPELLING: Use Australian spelling (e.g. colour, organisation, recognise)

DIFFICULTY & READING LEVEL:
${difficultyGuidance}

SUB-SKILLS THIS PASSAGE WILL TEST:
${guidance.subSkillsServed}

TOPIC IDEAS — choose one of these broad areas and be creative within it:
${guidance.topicIdeas}

WHAT TO AVOID:
${guidance.avoid}
${topicDiversityBlock}
QUALITY REQUIREMENTS:
- The topic and content must be engaging and age-appropriate for Year ${yearLevel}
- Topics can be from anywhere in the world — do not limit to Australia
- The passage must be rich enough to generate meaningful questions on the sub-skills listed above

Return ONLY valid JSON, no markdown:
{
  "title": "Engaging, specific title (not generic)",
  "content": "The complete passage text",
  "main_themes": ["theme1", "theme2"],
  "key_characters": [],
  "setting": "Brief description of setting or context",
  "potential_question_topics": ["topic1", "topic2", "topic3", "topic4", "topic5"]
}`;
}

// ============================================================================
// MINI-PASSAGE PROMPT (for skill drills)
// ============================================================================
// Drills test ONE sub-skill at a time. Rather than a full-length passage,
// each drill question gets a short self-contained mini-passage (50-150 words)
// that gives just enough context to test that specific sub-skill.
// ============================================================================

export function buildMiniPassagePrompt(
  testType: string,
  section: string,
  subSkill: string,
  passageType: string,
  difficulty: number,
  usedTopics: string[] = []
): string {
  const guidance = PASSAGE_TYPE_GUIDANCE[passageType] || PASSAGE_TYPE_GUIDANCE['micro'];

  const topicDiversityBlock = usedTopics.length > 0
    ? `\n🚨 CRITICAL: ALREADY GENERATED PASSAGES — DO NOT DUPLICATE OR USE SIMILAR:
${usedTopics.slice(0, 20).map((t, i) => `${i + 1}. ${t}`).join('\n')}

MANDATORY ANTI-DUPLICATION RULES:
1. Your TITLE must be completely different from all titles above
2. Your TOPIC/SUBJECT must be clearly distinct from all topics above
3. Examples of what NOT to do:
   - If "lighthouses" appears above → NO lighthouses, beacons, navigation systems
   - If "elephants" appears above → NO elephants, large mammals, animal communication
   - If "basketball" appears above → NO basketball, court sports, or James Naismith
4. Choose a topic from a DIFFERENT category entirely
5. If in doubt, pick something totally unrelated to anything listed above
`
    : '';

  const yearLevel = testType.includes('Year 5') ? 5
    : testType.includes('Year 9') ? 9
    : 7;

  const difficultyGuidance = getPassageDifficultyGuidance(difficulty, yearLevel);

  return `You are generating a mini-passage for a skill drill question.

DRILL SUB-SKILL: "${subSkill}"
PASSAGE TYPE: ${passageType} — ${guidance.description}
WORD COUNT: 60–120 words (a single focused paragraph or two short paragraphs)
SPELLING: Australian spelling

DIFFICULTY & READING LEVEL:
${difficultyGuidance}
${topicDiversityBlock}
CRITICAL TOPIC DIVERSITY REQUIREMENTS:
- You will see curriculum examples showing questions about specific topics (e.g., platypuses, koalas, etc.)
- These examples show the QUESTION PATTERN and DIFFICULTY LEVEL — NOT the topics you should use
- DO NOT copy topics from curriculum examples — they are just showing the format
- Choose diverse, varied topics: science, technology, history, culture, sports, arts, nature (NOT just animals), geography, human achievements, etc.
- Topics can be from ANYWHERE in the world — Australia, Asia, Europe, Africa, Americas, global topics
- Vary your subject matter: if previous passages were about animals, choose technology or history or culture
- Be creative and think globally — avoid clustering around one theme (like Australian animals)

FORBIDDEN TITLE PATTERNS (do NOT use these):
- "The Mystery of..." (overused pattern)
- "The Birth of..." (overused pattern)
- "The Silent..." (overused pattern)
- "The Secret of..." (overused pattern)
- "The Invention of..." (overused pattern)

GOOD TITLE EXAMPLES (varied and creative):
- "Hidden Treasures in City Gardens"
- "When Computers Learned to See"
- "Floating Markets of Southeast Asia"
- "Racing Against Time: Emergency Response Teams"
- "Crystal Caves and Their Secrets"

PASSAGE REQUIREMENTS:
- The mini-passage must be rich enough to support ONE question testing "${subSkill}"
- It should be self-contained — a student can answer the question without any other context
- Choose an engaging, age-appropriate topic for Year ${yearLevel} students

Return ONLY valid JSON:
{
  "title": "Brief title",
  "content": "The 60-120 word mini-passage",
  "main_themes": ["theme1"],
  "key_characters": [],
  "setting": "Brief setting description",
  "potential_question_topics": ["${subSkill}"]
}`;
}

// ============================================================================
// SUB-SKILL SPECIFIC GUIDANCE
// ============================================================================

function getSubSkillSpecificGuidance(subSkill: string): string {
  const subSkillLower = subSkill.toLowerCase();

  // Letter Series & Patterns
  if (subSkillLower.includes('letter series') || subSkillLower.includes('letter pattern')) {
    return `

LETTER SERIES GUIDANCE:
- For VIC Selective, use this exact format: "The next [one/two] letter(s) in the series\\n[LETTER]    [LETTER]    [LETTER]    are:"
- Use clear, unambiguous patterns: constant increment (e.g., +3 each time), alternating (+3, -1), or accelerating (+2, +3, +4, +5)
- For two-letter patterns (e.g., BD EG HJ), both letters should follow the SAME rule consistently
- Always show the pattern progression in your solution using letter positions: A(1), B(2), ..., Z(26)
- Example solution format: "B(2)→E(5) is +3, E(5)→H(8) is +3, pattern is +3 each time"
- Ensure the marked answer is definitively correct by showing clear arithmetic
- Avoid ambiguous patterns where multiple rules could apply
`;
  }

  // Punctuation
  if (subSkillLower.includes('punctuation')) {
    return `

PUNCTUATION GUIDANCE:
- Cover various punctuation types: apostrophes (possessive singular/plural), commas (series, introductory phrases), quotation marks, periods, question marks
- Make ONE option clearly correct with only ONE valid interpretation
- Incorrect options should have obvious errors: missing punctuation, misplaced apostrophes, wrong comma placement
- For possessive apostrophes: singular (dog's), plural not ending in s (children's), plural ending in s (dogs')
- Format: "Which sentence has correct punctuation?" or "Which sentence uses [specific punctuation] correctly?"
- Ensure answer is unambiguous - punctuation rules should be clear-cut, not debatable
`;
  }

  // Number Series & Pattern Recognition
  if (subSkillLower.includes('number series') ||
      subSkillLower.includes('number pattern') ||
      subSkillLower.includes('pattern recognition')) {
    return `

NUMBER SERIES GUIDANCE:
- Pattern types: arithmetic (constant difference), geometric (constant ratio), quadratic (differences form a pattern), Fibonacci-type (sum of previous two)
- Show clear pattern in solution: "6 → 12 (+6), 12 → 18 (+6), pattern is +6 each time"
- Distractors should be plausible but wrong: off-by-one errors, alternative patterns, arithmetic mistakes
- Ensure pattern is unambiguous - only ONE rule should clearly produce the sequence
- Format: "What is the next number in the sequence? [numbers], ?"
`;
  }

  // Grid/Matrix Patterns
  if (subSkillLower.includes('matrix') ||
      subSkillLower.includes('grid pattern')) {
    return `

GRID PATTERN GUIDANCE:
- Use simple ASCII tables or clearly formatted grids
- Patterns can be: row sums, column products, diagonal patterns, or position-based rules
- Example grid format:
  | 2  | 4  | 6  |
  | 3  | 6  | 9  |
  | 4  | 8  | ?  |
- Make the pattern discoverable from at least 2 complete rows/columns
- Explain the pattern step-by-step in the solution
- Ensure only ONE pattern produces the answer
`;
  }

  // No specific guidance for other sub-skills
  return '';
}

// ============================================================================
// TOKEN ESTIMATION HELPER
// ============================================================================

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
