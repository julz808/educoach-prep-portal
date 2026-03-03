/**
 * V2 Question Generation Engine - Passage Generator
 * Generates reading passages and their associated questions
 *
 * Created: 2026-02-09
 * Updated: 2026-02-18 — topic diversity, mini-passages for drills
 */

import Anthropic from '@anthropic-ai/sdk';
import type { PassageV2, QuestionV2 } from './types';
import type { PassageDistributionSpec } from '@/data/curriculumData_v2/types';
import { CLAUDE_CONFIG, getYearLevel } from './config';
import { buildPassagePrompt, buildMiniPassagePrompt } from './promptBuilder';
import { generateQuestionV2 } from './generator';
import { storePassageV2, getExistingPassageTopics, getExistingCharacterNames } from './supabaseStorage';

const anthropic = new Anthropic({
  apiKey: CLAUDE_CONFIG.apiKey
});

// ============================================================================
// DUPLICATE CHECKING HELPERS
// ============================================================================

/**
 * Extract character names from narrative passages
 * Returns array of potential character names (proper nouns that aren't common words)
 */
function extractCharacterNames(content: string): string[] {
  const namePattern = /\b([A-Z][a-z]+(?:'s)?)\b/g;
  const matches = content.match(namePattern) || [];

  // Common words to exclude (sentence starters, places, generic terms, pronouns)
  const commonWords = new Set([
    'The', 'When', 'After', 'Before', 'While', 'If', 'As', 'For', 'With',
    'In', 'On', 'At', 'By', 'To', 'From', 'Of', 'A', 'An', 'This', 'That',
    'These', 'Those', 'He', 'She', 'It', 'They', 'We', 'You', 'I', 'But',
    'However', 'What', 'How', 'Why', 'Where', 'Which', 'Who', 'Some', 'Many',
    'Every', 'Each', 'Then', 'Now', 'Today', 'Other', 'Instead', 'Even',
    'Great', 'Over', 'During', 'Maybe', 'Because', 'Could', 'And', 'Nothing',
    'Deep', 'Despite', 'Let', 'Single', 'Now', 'Map', 'North', 'Graph',
    'Table', 'Sleep', 'Others', 'Think', 'Are', 'Later', 'One', 'Only',
    'Not', 'Remember', 'Just', 'Behind', 'Their', 'War', 'Major', 'Sound',
    'Consider', 'Yet', 'Beneath', 'Making', 'Notice', 'Would', 'Research',
    'Slowly', 'Paper', 'Scientists', 'Researchers', 'Students', 'Teachers',
    'Parents', 'Teenagers', 'His', 'Her', 'Him', 'Them', 'Around', 'Across',
    'Perhaps', 'Through', 'Inside', 'Outside', 'Without', 'Within', 'Mrs',
    'Mr', 'Ms', 'Dr', 'Professor', 'Taking', 'Nervousness', 'Feel', 'Gradually'
  ]);

  const characterNames: string[] = [];
  const seenNames = new Set<string>();

  matches.forEach(name => {
    const cleanName = name.replace("'s", '');

    // Include if: not common word, length > 2, not already seen
    if (!commonWords.has(cleanName) &&
        cleanName.length > 2 &&
        !seenNames.has(cleanName)) {
      characterNames.push(cleanName);
      seenNames.add(cleanName);
    }
  });

  return characterNames;
}

/**
 * Check if narrative passage uses overused character names
 * Returns the overused character name if found, null otherwise
 */
function checkForOverusedCharacterNames(
  candidate: PassageV2,
  usedCharacterNames: string[]
): string | null {
  // Only check narrative passages
  if (candidate.passage_type !== 'narrative') {
    return null;
  }

  const candidateNames = extractCharacterNames(candidate.content);

  // Count occurrences of each name in existing passages
  const nameCounts: Record<string, number> = {};
  usedCharacterNames.forEach(name => {
    nameCounts[name] = (nameCounts[name] || 0) + 1;
  });

  // Check if any character name in candidate is overused
  // Threshold: name appears 2+ times in existing passages (stricter to ensure real diversity)
  for (const name of candidateNames) {
    if (nameCounts[name] && nameCounts[name] >= 2) {
      return name; // Return the overused name
    }
  }

  return null;
}

/**
 * Check if a passage is too similar to existing passages
 * Used topics are in format: "Title - content preview..."
 */
function checkIfPassageIsDuplicate(candidate: PassageV2, usedTopics: string[]): boolean {
  const candidateTitle = candidate.title.toLowerCase();
  const candidateContent = candidate.content.toLowerCase();

  for (const used of usedTopics) {
    // Extract title from format: "Title - content..."
    const titleMatch = used.match(/^"?([^"-]+)"?\s*-/);
    const title = titleMatch ? titleMatch[1].toLowerCase() : '';

    // Check 1: Exact title match
    if (title && candidateTitle === title) {
      return true;
    }

    // Check 2: Title word overlap (>50%)
    const candidateTitleWords = candidateTitle.split(/\s+/).filter(w => w.length > 3);
    const usedTitleWords = title.split(/\s+/).filter(w => w.length > 3);
    const titleOverlap = candidateTitleWords.filter(w => usedTitleWords.includes(w)).length;
    const titleSimilarity = titleOverlap / Math.max(candidateTitleWords.length, usedTitleWords.length, 1);
    if (titleSimilarity > 0.5) {
      return true;
    }

    // Check 3: Title pattern match ("The Mystery of...", "The Birth of...")
    const extractPattern = (t: string) => {
      const match = t.match(/^the\s+(\w+)\s+(of|alarm|messengers?|sentinels?)/i);
      return match ? match[1] + ' ' + match[2] : null;
    };
    const candPattern = extractPattern(candidateTitle);
    const usedPattern = extractPattern(title);
    if (candPattern && usedPattern && candPattern === usedPattern) {
      return true;
    }

    // Check 4: Content overlap (>40% - stricter than validator)
    const candidateWords = new Set(candidateContent.split(/\s+/).filter(w => w.length > 3));
    const usedWords = new Set(used.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    const contentOverlap = [...candidateWords].filter(w => usedWords.has(w)).length;
    const totalUnique = candidateWords.size + usedWords.size - contentOverlap;
    const contentSimilarity = contentOverlap / Math.max(totalUnique, 1);
    if (contentSimilarity > 0.4) {
      return true;
    }
  }

  return false;
}

// ============================================================================
// PASSAGE GENERATION
// ============================================================================

/**
 * Generate a reading passage
 */
export async function generatePassageV2(
  testType: string,
  sectionName: string,
  passageType: string,
  wordCountRange: [number, number],
  difficulty: number,
  usedTopics: string[] = []
): Promise<PassageV2> {

  const targetWordCount = Math.floor((wordCountRange[0] + wordCountRange[1]) / 2);

  const prompt = buildPassagePrompt(
    testType,
    sectionName,
    passageType,
    targetWordCount,
    difficulty,
    usedTopics
  );

  // Call Claude to generate passage
  const response = await anthropic.messages.create({
    model: CLAUDE_CONFIG.model,
    max_tokens: CLAUDE_CONFIG.maxTokens,
    temperature: CLAUDE_CONFIG.temperature,
    messages: [{
      role: 'user',
      content: prompt
    }]
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  // Parse JSON response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse passage response - no JSON found');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  // Count actual words in content
  const actualWordCount = parsed.content.split(/\s+/).length;

  const passage: PassageV2 = {
    id: crypto.randomUUID(),
    title: parsed.title,
    content: parsed.content,
    passage_type: passageType as any,
    word_count: actualWordCount,
    difficulty,
    test_type: testType,
    year_level: getYearLevel(testType),
    section_name: sectionName,
    metadata: {
      main_themes: parsed.main_themes || [],
      key_characters: parsed.key_characters || [],
      setting: parsed.setting || '',
      potential_question_topics: parsed.potential_question_topics || [],
      generation_timestamp: new Date().toISOString()
    }
  };

  return passage;
}

// ============================================================================
// PASSAGE + QUESTIONS GENERATION
// ============================================================================

export interface PassageWithQuestionsResult {
  passage: PassageV2;
  questions: QuestionV2[];
  passageId: string;
  metadata: {
    total_questions_generated: number;
    successful_questions: number;
    failed_questions: number;
    generation_time_ms: number;
    total_cost: number;
  };
}

/**
 * Generate a passage and all its associated questions
 * This is the main function for passage-based question generation
 *
 * @example
 * const result = await generatePassageWithQuestions({
 *   testType: "NSW Selective Entry (Year 7 Entry)",
 *   sectionName: "Reading",
 *   passageSpec: {
 *     passage_type: "narrative",
 *     count: 1,
 *     word_count_range: [300, 400],
 *     questions_per_passage: 5,
 *     sub_skills: ["Narrative Comprehension", "Character Analysis"]
 *   },
 *   difficulty: 2,
 *   testMode: "practice_1"
 * });
 */
export async function generatePassageWithQuestions(params: {
  testType: string;
  sectionName: string;
  passageSpec: PassageDistributionSpec;
  difficulty: number;
  testMode: string;
  skipStorage?: boolean;
  usedTopics?: string[];
}): Promise<PassageWithQuestionsResult> {

  const { testType, sectionName, passageSpec, difficulty, testMode, skipStorage = false, usedTopics = [] } = params;
  const startTime = Date.now();

  console.log(`\n📖 Generating passage: ${passageSpec.passage_type} (${passageSpec.word_count_range[0]}-${passageSpec.word_count_range[1]} words)`);

  // Step 1: Generate the passage (with topic diversity context)
  const passage = await generatePassageV2(
    testType,
    sectionName,
    passageSpec.passage_type,
    passageSpec.word_count_range,
    difficulty,
    usedTopics
  );

  console.log(`   ✅ Passage generated: "${passage.title}" (${passage.word_count} words)`);

  // Step 2: Store passage (if not skipping storage)
  let passageId = passage.id;
  if (!skipStorage) {
    try {
      passageId = await storePassageV2(passage);
      console.log(`   ✅ Passage stored with ID: ${passageId}`);
    } catch (error) {
      console.warn(`   ⚠️  Failed to store passage: ${error}`);
      // Continue anyway with generated ID
    }
  }

  // Step 3: Determine number of questions to generate
  const questionCount = Array.isArray(passageSpec.questions_per_passage)
    ? Math.floor((passageSpec.questions_per_passage[0] + passageSpec.questions_per_passage[1]) / 2)
    : passageSpec.questions_per_passage;

  console.log(`   📝 Generating ${questionCount} questions for this passage...`);

  // Step 4: Generate questions
  const questions: QuestionV2[] = [];
  let successfulQuestions = 0;
  let failedQuestions = 0;
  let totalCost = 0;

  for (let i = 0; i < questionCount; i++) {
    // Rotate through sub-skills for variety
    const subSkill = passageSpec.sub_skills[i % passageSpec.sub_skills.length];

    console.log(`      Q${i + 1}/${questionCount}: ${subSkill}...`);

    try {
      const result = await generateQuestionV2(
        {
          testType,
          section: sectionName,
          subSkill,
          difficulty,
          testMode,
          passageId  // ← Link question to passage
        },
        {
          skipValidation: false,
          skipStorage: skipStorage,
          strictValidation: true
        }
      );

      if (result.success && result.question) {
        questions.push(result.question);
        successfulQuestions++;
        totalCost += result.cost;
        console.log(`      ✅ Q${i + 1} generated (${result.validationResult?.qualityScore}/100 quality)`);
      } else {
        failedQuestions++;
        console.log(`      ❌ Q${i + 1} failed: ${result.error}`);
      }
    } catch (error) {
      failedQuestions++;
      console.log(`      ❌ Q${i + 1} error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  const totalTime = Date.now() - startTime;

  console.log(`   ✅ Passage complete: ${successfulQuestions}/${questionCount} questions generated`);
  console.log(`   💰 Total cost: $${totalCost.toFixed(4)}`);
  console.log(`   ⏱️  Total time: ${(totalTime / 1000).toFixed(1)}s`);

  return {
    passage,
    questions,
    passageId,
    metadata: {
      total_questions_generated: questionCount,
      successful_questions: successfulQuestions,
      failed_questions: failedQuestions,
      generation_time_ms: totalTime,
      total_cost: totalCost
    }
  };
}

// ============================================================================
// BATCH PASSAGE GENERATION
// ============================================================================

/**
 * Generate multiple passages with their questions (for passage-based sections)
 * Loads existing passage topics from DB first to ensure no topic repetition
 */
export async function generateMultiplePassagesWithQuestions(params: {
  testType: string;
  sectionName: string;
  passageSpecs: PassageDistributionSpec[];
  difficulty: number;
  testMode: string;
  skipStorage?: boolean;
}): Promise<{
  passages: PassageV2[];
  questions: QuestionV2[];
  metadata: {
    total_passages: number;
    total_questions: number;
    total_cost: number;
    total_time_ms: number;
  };
}> {

  const { testType, sectionName, passageSpecs, difficulty, testMode, skipStorage = false } = params;
  const startTime = Date.now();

  const allPassages: PassageV2[] = [];
  const allQuestions: QuestionV2[] = [];
  let totalCost = 0;

  console.log(`\n${'='.repeat(80)}`);
  console.log(`📚 BATCH PASSAGE GENERATION`);
  console.log(`${'='.repeat(80)}`);
  console.log(`Test: ${testType}`);
  console.log(`Section: ${sectionName}`);
  console.log(`Total passage types: ${passageSpecs.length}`);
  console.log(`${'='.repeat(80)}\n`);

  // Load existing passage topics from DB to prevent repetition across all test modes
  console.log(`🔍 Loading existing passage topics for diversity...`);
  const existingTopics = await getExistingPassageTopics(testType, sectionName);
  console.log(`   Found ${existingTopics.length} existing passage topics\n`);

  // usedTopics accumulates as we generate — grows with each new passage in this batch
  const usedTopics = [...existingTopics];

  // Generate passages for each spec
  for (const spec of passageSpecs) {
    for (let i = 0; i < spec.count; i++) {
      const result = await generatePassageWithQuestions({
        testType,
        sectionName,
        passageSpec: spec,
        difficulty,
        testMode,
        skipStorage,
        usedTopics
      });

      allPassages.push(result.passage);
      allQuestions.push(...result.questions);
      totalCost += result.metadata.total_cost;

      // Add this passage's title and themes to usedTopics so the next passage avoids the same topic
      const themes = result.passage.metadata.main_themes?.join(', ') || '';
      usedTopics.push(`"${result.passage.title}" [${result.passage.passage_type}]${themes ? ` — ${themes}` : ''}`);
    }
  }

  const totalTime = Date.now() - startTime;

  console.log(`\n${'='.repeat(80)}`);
  console.log(`✅ BATCH GENERATION COMPLETE`);
  console.log(`${'='.repeat(80)}`);
  console.log(`📖 Passages generated: ${allPassages.length}`);
  console.log(`📝 Questions generated: ${allQuestions.length}`);
  console.log(`💰 Total cost: $${totalCost.toFixed(4)}`);
  console.log(`⏱️  Total time: ${(totalTime / 1000).toFixed(1)}s`);
  console.log(`${'='.repeat(80)}\n`);

  return {
    passages: allPassages,
    questions: allQuestions,
    metadata: {
      total_passages: allPassages.length,
      total_questions: allQuestions.length,
      total_cost: totalCost,
      total_time_ms: totalTime
    }
  };
}

// ============================================================================
// MINI-PASSAGE GENERATION FOR SKILL DRILLS
// ============================================================================

export interface MiniPassageWithQuestionResult {
  passage: PassageV2;
  question: QuestionV2 | null;
  passageId: string;
  metadata: {
    generation_time_ms: number;
    total_cost: number;
    success: boolean;
  };
}

/**
 * Generate a mini-passage (60-120 words) and a single question for a skill drill.
 * Each drill question gets its own self-contained mini-passage rather than sharing
 * a full-length passage. This lets drill questions be independently usable.
 *
 * @example
 * const result = await generateMiniPassageWithQuestion({
 *   testType: "EduTest Scholarship (Year 7 Entry)",
 *   sectionName: "Reading Comprehension",
 *   subSkill: "Identifying Main Idea & Author's Purpose",
 *   passageType: "informational",
 *   difficulty: 2,
 *   testMode: "drill"
 * });
 */
export async function generateMiniPassageWithQuestion(params: {
  testType: string;
  sectionName: string;
  subSkill: string;
  passageType: string;
  difficulty: number;
  testMode: string;
  skipStorage?: boolean;
  usedTopics?: string[];
}): Promise<MiniPassageWithQuestionResult> {

  const { testType, sectionName, subSkill, passageType, difficulty, testMode, skipStorage = false, usedTopics = [] } = params;
  const startTime = Date.now();

  // Load existing passages from passages_v2 table (same system as practice tests!)
  const existingPassageTopics = await getExistingPassageTopics(testType, sectionName);

  // Load existing character names for narrative passages
  const existingCharacterNames = passageType === 'narrative'
    ? await getExistingCharacterNames(testType, sectionName)
    : [];

  // Combine with session-level usedTopics
  const allUsedTopics = [...existingPassageTopics, ...usedTopics];

  console.log(`   📚 Loaded ${existingPassageTopics.length} existing passages + ${usedTopics.length} from session = ${allUsedTopics.length} total for duplicate prevention`);
  if (passageType === 'narrative') {
    console.log(`   👥 Loaded ${existingCharacterNames.length} existing character names for diversity check`);
  }

  let passage: PassageV2 | null = null;
  let attempts = 0;
  const maxAttempts = 3;

  // Step 1: Generate mini-passage with retry on duplicates
  while (attempts < maxAttempts && !passage) {
    attempts++;

    const prompt = buildMiniPassagePrompt(
      testType,
      sectionName,
      subSkill,
      passageType,
      difficulty,
      allUsedTopics  // Use combined database + session topics
    );

    const response = await anthropic.messages.create({
      model: CLAUDE_CONFIG.model,
      max_tokens: 800,
      temperature: CLAUDE_CONFIG.temperature,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.warn(`   ⚠️  Attempt ${attempts}: Failed to parse mini-passage response`);
      continue;
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const wordCount = parsed.content.split(/\s+/).length;

    const candidatePassage: PassageV2 = {
      id: crypto.randomUUID(),
      title: parsed.title,
      content: parsed.content,
      passage_type: passageType as any,
      word_count: wordCount,
      difficulty,
      test_type: testType,
      year_level: getYearLevel(testType),
      section_name: sectionName,
      metadata: {
        main_themes: parsed.main_themes || [],
        key_characters: parsed.key_characters || [],
        setting: parsed.setting || '',
        potential_question_topics: parsed.potential_question_topics || [subSkill],
        generation_timestamp: new Date().toISOString()
      }
    };

    // Check for duplicate against allUsedTopics
    const isDuplicate = checkIfPassageIsDuplicate(candidatePassage, allUsedTopics);

    if (isDuplicate) {
      console.warn(`   ⚠️  Attempt ${attempts}: Passage "${candidatePassage.title}" is too similar to existing passages`);
      // Add this failed attempt so next iteration avoids it
      allUsedTopics.push(`"${candidatePassage.title}" - ${candidatePassage.content.substring(0, 100)}...`);
      continue;
    }

    // Check for overused character names (narrative passages only)
    const overusedName = checkForOverusedCharacterNames(candidatePassage, existingCharacterNames);

    if (overusedName) {
      console.warn(`   ⚠️  Attempt ${attempts}: Character name "${overusedName}" is overused (appears 3+ times in existing passages)`);
      // Add this failed attempt so next iteration avoids it
      allUsedTopics.push(`"${candidatePassage.title}" - ${candidatePassage.content.substring(0, 100)}...`);
      // Track that this character name was rejected
      existingCharacterNames.push(overusedName);
      continue;
    }

    // Passage is unique!
    passage = candidatePassage;
    console.log(`   📄 Mini-passage generated: "${passage.title}" (${passage.word_count} words)`);
  }

  if (!passage) {
    throw new Error(`Failed to generate unique mini-passage after ${maxAttempts} attempts`);
  }

  // Step 2: Store mini-passage
  let passageId = passage.id;
  if (!skipStorage) {
    try {
      passageId = await storePassageV2(passage);
    } catch (error) {
      console.warn(`   ⚠️  Failed to store mini-passage: ${error}`);
    }
  }

  // Step 3: Generate the linked question
  let question: QuestionV2 | null = null;
  let totalCost = 0;

  try {
    const result = await generateQuestionV2(
      {
        testType,
        section: sectionName,
        subSkill,
        difficulty,
        testMode,
        passageId
      },
      {
        skipValidation: false,
        skipStorage,
        strictValidation: true
      }
    );

    if (result.success && result.question) {
      question = result.question;
      totalCost += result.cost;
      console.log(`   ✅ Drill question generated (${result.validationResult?.qualityScore}/100 quality)`);
    } else {
      console.log(`   ❌ Drill question failed: ${result.error}`);
    }
  } catch (error) {
    console.log(`   ❌ Drill question error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }

  const totalTime = Date.now() - startTime;

  return {
    passage,
    question,
    passageId,
    metadata: {
      generation_time_ms: totalTime,
      total_cost: totalCost,
      success: question !== null
    }
  };
}
