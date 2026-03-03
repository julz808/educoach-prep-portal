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
🎯 EXAMPLES — These show STYLE, FORMAT, and DIFFICULTY LEVEL only:

${formatExamples(selectedExamples)}

⚠️ CRITICAL INSTRUCTIONS - READ CAREFULLY:

1. **Examples are STYLE GUIDES, not templates!**
   - DO NOT replicate the exact patterns, numbers, or operations shown
   - The examples show PRESENTATION FORMAT only

2. **CHALLENGE YOURSELF - Go harder than the examples!**
   - VIC Selective is for HIGH-ACHIEVING Year 9 students (top 10-15% of cohort)
   - These students can handle: exponential patterns (n²,n³), Fibonacci sequences, prime numbers, multi-step logic
   - Basic +5 or -3 patterns are TOO EASY - push the difficulty!

3. **Pattern Innovation Required:**
   - If examples show addition, try exponential or multiplication
   - If examples show simple sequences, try compound patterns (rows multiply, columns add)
   - Use mathematical concepts these students know: squares, cubes, primes, Fibonacci

4. **Number Range Freedom:**
   - Don't cluster around small numbers (10-30)
   - Try: 1-20 for Fibonacci, 50-150 for subtraction, 100-200 for advanced patterns
   - Use the full range Year 9 students can calculate

Pattern Guidelines:
- ${pattern.key_characteristics.slice(0, 3).join('\n- ')}
- Difficulty ${difficulty}: ${pattern.difficulty_progression[difficulty.toString() as '1' | '2' | '3']}
- Distractors: ${pattern.distractor_strategies.slice(0, 3).join('; ')}

CREATIVE FREEDOM: With ${context.recentQuestions?.length || 0} existing questions in this sub-skill, you MUST innovate:
- Use fresh number combinations never seen in existing questions
- Experiment with different mathematical operations and relationships
- Try more complex (but solvable) patterns that Year 9 students can figure out
- Vary the position of the missing value
- Challenge students while keeping problems logically discoverable

⚠️ CRITICAL: RANDOMIZE CORRECT ANSWER POSITION
- The correct answer should appear in DIFFERENT positions across questions
- Do NOT always put the correct answer in position B
- Vary between A, B, C, D, E positions randomly
- This is essential for test validity and preventing answer pattern bias

${subSkillGuidance}${recentQuestionsBlock}${previousFailuresBlock}
Return ONLY valid JSON, no markdown:

${buildOutputFormat(false, !!context.passage)}

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

  // Check if any failures were due to duplicates
  const hasDuplicateFailures = previousFailures.some(f =>
    f.reason.toLowerCase().includes('duplicate')
  );

  const duplicateGuidance = hasDuplicateFailures ? `

🚨 CRITICAL ANTI-DUPLICATE INSTRUCTIONS:
Your previous attempts were rejected as duplicates. This means you MUST:
1. Use a COMPLETELY DIFFERENT example sentence context (different people, places, activities, objects)
2. If testing grammar, you can test the SAME grammar rule but with TOTALLY NEW sentence examples
3. For grammar/punctuation questions: "Which sentence is correct?" is the standard format - that's OK!
4. The uniqueness comes from the ANSWER OPTIONS (the actual sentences), not the question stem
5. Change the scenario entirely: if you used school → try sports, nature, travel, technology, home life
6. Use different proper nouns: different names, different places, different specific items
` : '';

  return `

⚠️ PREVIOUS ATTEMPTS THAT FAILED — Learn from these and pivot your approach:
${lines.join('\n\n')}

You MUST generate something clearly different from the failed attempts above. If the failure was a duplicate, choose a completely different topic/scenario/concept. If the failure was an incorrect answer, ensure your logic is sound.${duplicateGuidance}
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

function buildOutputFormat(visualRequired: boolean, hasPassage: boolean = false): string {
  // Visual requirement is now always false - all data must be in question_text
  const questionTextGuidance = hasPassage
    ? '"The question ONLY - do NOT include the passage content. The passage is stored separately and will be displayed to students."'
    : '"Complete question text with ALL data and information needed to answer (tables in markdown, all measurements, all values)"';

  return `{
  "question_text": ${questionTextGuidance},
  "answer_options": ["Option 1 text", "Option 2 text", "Option 3 text", "Option 4 text", "Option 5 text"],
  "correct_answer": "C",
  "solution": "• [step 1]\\n• [step 2]\\n• Therefore, the answer is C because [reason]"
}

IMPORTANT:
- answer_options must be an array of 4-5 strings (the actual option text WITHOUT letter prefixes)
- correct_answer should be a single letter (A, B, C, D, or E) matching the position in the array
- Do NOT include A), B), C) etc. in the answer_options text - just the option content itself${hasPassage ? '\n\n⚠️ CRITICAL FOR PASSAGE-BASED QUESTIONS:\n- The passage is provided above and stored separately in the database\n- Your question_text should ONLY contain the question itself (e.g., "What is the main idea of this passage?")\n- DO NOT include "Read the following passage:" or the passage title or content in question_text\n- The passage will be displayed separately to students' : ''}`;
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
    description: `A fictional narrative passage. IMPORTANT: Narratives can take many forms — NOT just character-driven stories. Choose from these varied types:

NARRATIVE TYPES (mix these across passages):
1. CHARACTER-DRIVEN STORY (30% of passages): Traditional story with characters, dialogue, conflict, and resolution
2. DESCRIPTIVE SETTING (25%): Rich, atmospheric description of a place (haunted mansion, alien planet, bustling market, underwater cave) with NO characters needed
3. GENRE EXCERPTS (25%): Fantasy world-building, mystery/crime scene setup, science fiction scenario, historical fiction atmosphere, horror/suspense mood-setting
4. DIARY/JOURNAL ENTRY (10%): First-person reflection or observation WITHOUT dialogue
5. DREAMSCAPE/SURREAL (10%): Abstract, imaginative narrative focused on imagery and mood

GENRE VARIETY (age-appropriate):
- Fantasy: magical realms, mythical creatures, enchanted objects
- Mystery/Crime: discovering clues, solving puzzles, investigating strange events
- Science Fiction: futuristic technology, space exploration, alternate realities
- Historical Fiction: past eras brought to life through sensory detail
- Adventure: exploration, survival, discovery
- Contemporary Realistic: everyday moments with emotional depth
- Horror/Suspense (mild): eerie atmosphere, tension, the unknown

WRITING TECHNIQUES TO VARY:
- Sensory language (sight, sound, smell, touch, taste)
- Figurative language (metaphor, simile, personification)
- Mood and atmosphere
- Time manipulation (flashback, flash-forward, slow-motion moment)
- Stream of consciousness
- Detailed observation without plot`,
    subSkillsServed: 'literary analysis, inference, theme identification, literary devices (imagery, symbolism, foreshadowing), mood/tone, narrative comprehension, sensory language interpretation',
    topicIdeas: 'Descriptive: abandoned space station, midnight forest, Victorian London street, coral reef, post-apocalyptic ruins. Character: moral dilemmas, cultural experiences, overcoming obstacles. Genre: fantasy quests, mystery investigations, sci-fi scenarios, historical moments, survival situations',
    avoid: 'statistics, data, arguments, persuasive language — this is fiction/creative writing, not factual reporting or opinion'
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

  // Narrative variety block (narrative passages only)
  const narrativeVarietyBlock = passageType === 'narrative'
    ? `\n🚨 NARRATIVE VARIETY REQUIREMENTS:
NOT ALL NARRATIVES NEED CHARACTERS! Choose from:
- DESCRIPTIVE SETTING (40%): Atmospheric place description with NO characters (haunted mansion, alien planet, enchanted forest)
- CHARACTER-DRIVEN STORY (30%): Traditional narrative with characters and dialogue
- GENRE EXCERPT (20%): Fantasy world-building, mystery scene, sci-fi scenario, historical atmosphere
- DIARY/JOURNAL or DREAMSCAPE (10%): First-person reflection or surreal imagery

When using characters: Use UNIQUE, CULTURALLY DIVERSE names. AVOID: Maya, Arjun, Liam, Sophie, Emma, Jack, Tariq.
Use diverse backgrounds: Asian (Kenji, Priya, Akari), European (Astrid, Mateo, Sven), Middle Eastern (Leila, Amina), African (Kofi, Zuri), Indigenous (Kaia, Tane), Latin American (Diego, Lucia).
\n`
    : '';

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
${topicDiversityBlock}${narrativeVarietyBlock}
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

  // Narrative variety and character diversity block (narrative passages only)
  const narrativeVarietyBlock = passageType === 'narrative'
    ? `\n🚨 NARRATIVE VARIETY REQUIREMENTS:

CRITICAL: NOT ALL NARRATIVES NEED CHARACTERS!
Vary your approach across these narrative types:

1. DESCRIPTIVE SETTING (NO characters needed - 40% of passages):
   - Atmospheric description of a place: haunted library, futuristic city, enchanted forest, abandoned subway
   - Focus on SENSORY DETAILS (sounds, smells, textures, visual imagery)
   - Create MOOD and ATMOSPHERE through descriptive language
   - Examples: "The Abandoned Observatory at Midnight", "Inside the Ice Cavern", "The Floating Gardens of Neo-Tokyo"

2. CHARACTER-DRIVEN STORY (30% of passages):
   - Traditional narrative with characters, dialogue, conflict
   - When using characters, follow diversity rules below

3. GENRE EXCERPT (20% of passages):
   - Fantasy world-building WITHOUT characters (describe magic system, enchanted location)
   - Mystery/crime scene description (clues, atmosphere, tension)
   - Sci-fi scenario (alien technology, space station, future world)
   - Historical fiction atmosphere (Victorian street, ancient temple)

4. DIARY/JOURNAL ENTRY or DREAMSCAPE (10% of passages):
   - First-person reflection, observation, or surreal imagery
   - Focus on internal experience and sensory impressions

🚨 CHARACTER NAME DIVERSITY (when characters ARE used):

MANDATORY CHARACTER NAMING RULES:
1. Use UNIQUE, CULTURALLY DIVERSE character names
2. DO NOT use overused names like: Maya, Arjun, Liam, Sophie, Emma, Jack, Olivia, Tariq
3. Draw from diverse cultural backgrounds:
   - Asian: Kenji, Priya, Mei-Lin, Hassan, Farah, Nguyen, Akari, Yuki
   - European: Astrid, Mateo, Zara, Finn, Iliana, Sven, Ines
   - Middle Eastern: Leila, Amina, Jamal, Yasmin, Omar, Rania
   - African: Kofi, Amara, Zuri, Kwame, Ayanna, Zahara
   - Indigenous: Kaia, Tane, Bindi, Jarrah, Marlee, Koa
   - Latin American: Diego, Lucia, Alejandra, Rafael, Matias
4. Avoid teacher names: Mrs Smith, Mrs Chen, Mr Brown, Ms Wilson
`
    : '';

  return `You are generating a mini-passage for a skill drill question.

DRILL SUB-SKILL: "${subSkill}"
PASSAGE TYPE: ${passageType} — ${guidance.description}
WORD COUNT: 60–120 words (a single focused paragraph or two short paragraphs)
SPELLING: Australian spelling

DIFFICULTY & READING LEVEL:
${difficultyGuidance}
${topicDiversityBlock}${narrativeVarietyBlock}
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
DESCRIPTIVE/ATMOSPHERIC:
- "The Abandoned Observatory at Midnight"
- "Inside the Ice Cavern"
- "The Whispering Library"
- "Beneath the Neon Streets"

GENRE/FANTASY/SCI-FI:
- "The Last Dragon's Hoard"
- "Station Omega: Life in Zero Gravity"
- "The Detective's Desk, 1922"
- "The Enchanted Clockwork Garden"

INFORMATIONAL (non-narrative):
- "When Computers Learned to See"
- "Floating Markets of Southeast Asia"
- "Racing Against Time: Emergency Response Teams"

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

  // Grammar
  if (subSkillLower.includes('grammar') && !subSkillLower.includes('punctuation')) {
    return `

GRAMMAR GUIDANCE (Sophisticated Grammar):
- Each question tests a specific grammar rule through 4 sentence variations
- The question stem is ALWAYS "Which sentence is correct?" (this is standard format)
- What makes each question UNIQUE is the example sentences, NOT the grammar rule being tested
- Grammar topics to vary: subject-verb agreement (plural/singular, collective nouns, neither/nor, there is/are), pronoun usage (I/me in different positions, who/whom, they/them, possessive pronouns), verb tenses (past/present/future consistency, irregular verbs), common errors (could of/could have, should of/should have), comparative/superlative forms (more/most, less/least, -er/-est)
- CRITICAL DIVERSITY REQUIREMENT: Use completely different example SENTENCES from recent questions
  - If recent questions used school/classroom contexts, use sports, nature, technology, or travel contexts
  - If recent questions focused on pronouns, test subject-verb agreement or verb tenses
  - Vary the sentence topics: people's names, places, activities, objects - make each sentence scenario unique
- Ensure only ONE option is grammatically correct according to Australian curriculum standards
- Distractors should have clear, teachable errors that Year 7 students commonly make
- Keep sentence complexity appropriate for Year 7 (12-13 year olds)
`;
  }

  // Punctuation
  if (subSkillLower.includes('punctuation')) {
    return `

PUNCTUATION GUIDANCE:
- Each question tests a specific punctuation rule through 4 sentence variations
- The question stem is typically "Which sentence uses punctuation correctly?" (this is standard format)
- What makes each question UNIQUE is the example sentences, NOT the punctuation rule being tested
- Cover various punctuation types: apostrophes (possessive singular/plural), commas (series, introductory phrases, clauses), quotation marks, periods, question marks, exclamation marks
- CRITICAL DIVERSITY REQUIREMENT: Use completely different example SENTENCES from recent questions
  - If recent questions used dialogue/quotations, use apostrophes or commas
  - If recent questions had possessive apostrophes, use commas in lists or introductory phrases
  - Vary sentence topics: use different names, places, activities, scenarios
- Make ONE option clearly correct with only ONE valid interpretation
- Incorrect options should have obvious errors: missing punctuation, misplaced apostrophes, wrong comma placement
- For possessive apostrophes: singular (dog's), plural not ending in s (children's), plural ending in s (dogs')
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
      subSkillLower.includes('grid') ||
      subSkillLower.includes('grid pattern')) {
    return `

🎨 GRID PATTERN GUIDANCE - CREATIVE FREEDOM WITH LOGICAL RIGOR:

⚠️ CRITICAL: The examples above are STYLE GUIDES ONLY, showing format and difficulty level.
DO NOT feel constrained to use similar patterns or number ranges to the examples!

PATTERN VARIETY (choose different patterns from examples - GO HARDER!):

BASIC PATTERNS (use sparingly):
- Addition patterns: constant increment per row/column (e.g., +3, +5, +7)
- Subtraction patterns: decreasing sequences (e.g., -4, -6, -9)

INTERMEDIATE PATTERNS (good balance):
- Multiplication patterns: each cell = previous × constant (e.g., ×2, ×3)
- Division patterns: each cell = previous ÷ constant (e.g., ÷2, ÷4)
- Row/column relationships: third = sum/difference of first two (e.g., A + B = C or A - B = C)
- Mixed operations: rows use one rule, columns use another (rows: +3, columns: ×2)
- Varying increments: +2, +4, +6 progression or -9, -8, -7 pattern

ADVANCED PATTERNS (prefer these for Year 9):
- Exponential patterns: n, n², n³ (e.g., 4, 16, 64 / 5, 25, 125)
- Fibonacci-style: each cell = sum of previous two in row/column (1, 1, 2 / 2, 3, 5)
- Prime number sequences combined with operations (17, 23, 31 in column 1)
- Dual pattern validation: pattern works both horizontally AND vertically
- Multiplicative columns with additive rows (or vice versa)
- Working backwards: given result and operation, find missing intermediate value
- Products and differences: third = first × second, or first ÷ second

NUMBER RANGE VARIETY:
- Use DIFFERENT number ranges from the examples: 1-20, 20-50, 50-100, or even 100-200
- Mix odd and even numbers creatively
- Try prime numbers, multiples of specific numbers, or square numbers
- Don't avoid larger numbers - Year 9 students can handle 2-digit and 3-digit arithmetic

COMPLEXITY LEVELS (all must be logically solvable - aim for Moderate to Challenge):
- Simple: One consistent operation across all rows/columns (e.g., +5 everywhere)
- Moderate: Different operations in rows vs columns (rows: +3, columns: ×2)
- Advanced: Exponential patterns (n²), varying increments (+2,+4,+6), prime sequences
- Challenge: Multi-step reasoning (A - B = C), Fibonacci patterns, dual-validation patterns
- Expert: Combinations like "columns multiply by 3, rows add first two cells to get third"

🎯 TARGET: Aim for 60% Advanced, 30% Challenge, 10% Moderate for Year 9 selective entry
These students are high-performers who can handle sophisticated mathematical reasoning!

MANDATORY REQUIREMENTS:
✓ The pattern MUST be discoverable from the given information
✓ Only ONE answer should be correct - test this by working through your solution
✓ The solution must show clear, logical steps to reach the answer
✓ Avoid ambiguous patterns where multiple rules could apply
✓ The grid should have sufficient complete rows/columns to establish the pattern (at least 2)

Grid format (use consistent spacing):
5     10    15
8     16    24
11    ?     33

ANTI-DUPLICATION REQUIREMENTS:
1. Use COMPLETELY DIFFERENT number combinations than recent questions shown above
2. Choose a DIFFERENT pattern type (if recent used +2, try ×3 or row-sum relationships)
3. Position the missing value in a DIFFERENT location (top-left, middle, bottom-right, etc.)
4. Vary your grid starting numbers widely - don't cluster around the same ranges
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
