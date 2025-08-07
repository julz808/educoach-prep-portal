/**
 * PASSAGE SHARING SYSTEM
 * 
 * Implements correct passage-to-question ratios for reading sections
 * based on curriculum requirements
 */

import { TEST_STRUCTURES } from '../../data/curriculumData.ts';
import { generateMiniPassage, generatePassage } from './passageGeneration.ts';

// Define passage sharing configuration from curriculum data
const PASSAGE_CONFIGS = {
  "EduTest Scholarship (Year 7 Entry)": {
    "Reading Comprehension": { passages: 5, questions: 50, words_per_passage: 200 }
  },
  "VIC Selective Entry (Year 9 Entry)": {
    "Reading Reasoning": { passages: 5, questions: 50, words_per_passage: 300 }
  },
  "NSW Selective Entry (Year 7 Entry)": {
    "Reading": { passages: 6, questions: 30, words_per_passage: 250 }
  },
  "Year 5 NAPLAN": {
    "Reading": { passages: 8, questions: 40, words_per_passage: 150 }
  },
  "Year 7 NAPLAN": {
    "Reading": { passages: 8, questions: 50, words_per_passage: 200 }
  },
  "ACER Scholarship (Year 7 Entry)": {
    "Humanities": { passages: 4, questions: 35, words_per_passage: 250 }
  }
} as const;

interface PassageGenerationContext {
  testType: string;
  sectionName: string;
  testMode: string;
  difficulty: number;
  subSkill: string;
  generationContext: any;
}

interface SharedPassage {
  id: string;
  content: string;
  title: string;
  passage_type: string;
  word_count: number;
  difficulty: number;
}

/**
 * Global passage cache to ensure passages are shared correctly
 */
const passageCache = new Map<string, SharedPassage>();

/**
 * Get the passage configuration for a test type and section
 */
function getPassageConfig(testType: string, sectionName: string) {
  const testConfig = PASSAGE_CONFIGS[testType as keyof typeof PASSAGE_CONFIGS];
  if (!testConfig) {
    throw new Error(`No passage configuration found for test type: ${testType}`);
  }
  
  const sectionConfig = testConfig[sectionName as keyof typeof testConfig];
  if (!sectionConfig) {
    throw new Error(`No passage configuration found for section: ${sectionName} in test: ${testType}`);
  }
  
  return sectionConfig;
}

/**
 * Determine if this section requires passages
 */
export function requiresPassages(testType: string, sectionName: string): boolean {
  try {
    getPassageConfig(testType, sectionName);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the correct passage for a question based on curriculum requirements
 */
export async function getPassageForQuestion(
  context: PassageGenerationContext,
  questionIndex: number,
  supabase: any
): Promise<{ passageId: string; passageContent: string } | null> {
  
  // Check if this section requires passages
  if (!requiresPassages(context.testType, context.sectionName)) {
    return null;
  }
  
  // For drill questions, always generate a new mini-passage (1:1 ratio)
  if (context.testMode === 'drill') {
    return await generateDrillPassage(context, supabase);
  }
  
  // For practice and diagnostic tests, use shared passages
  return await getSharedPassage(context, questionIndex, supabase);
}

/**
 * Generate a new mini-passage for drill questions (1:1 ratio)
 */
async function generateDrillPassage(
  context: PassageGenerationContext,
  supabase: any
): Promise<{ passageId: string; passageContent: string }> {
  
  console.log(`   📖 Generating mini-passage for drill question (1:1 ratio)...`);
  
  const passageRequest = {
    testType: context.testType,
    sectionName: context.sectionName,
    testMode: context.testMode,
    wordCount: 120, // Mini-passages for drills
    difficulty: context.difficulty,
    // Let the passage generation system determine the appropriate type
    // based on topic cycling and test requirements (narrative/informational/persuasive)
    generationContext: context.generationContext,
    isMiniPassage: true,
    subSkill: context.subSkill
  };
  
  const passage = await generateMiniPassage(passageRequest);
  
  // Store the passage
  const { data: passageData } = await supabase
    .from('passages')
    .insert({
      title: passage.title,
      content: passage.content,
      word_count: passage.word_count,
      difficulty: passage.difficulty,
      australian_context: true,
      passage_type: passage.passage_type,
      section_name: context.sectionName,
      test_type: context.testType,
      year_level: getYearLevel(context.testType)
    })
    .select('id')
    .single();
  
  return {
    passageId: passageData?.id || '',
    passageContent: passage.content
  };
}

/**
 * Get or create a shared passage for practice/diagnostic questions
 */
async function getSharedPassage(
  context: PassageGenerationContext,
  questionIndex: number,
  supabase: any
): Promise<{ passageId: string; passageContent: string }> {
  
  const config = getPassageConfig(context.testType, context.sectionName);
  const questionsPerPassage = Math.ceil(config.questions / config.passages);
  
  // Calculate which passage this question should use
  const passageNumber = Math.floor(questionIndex / questionsPerPassage) + 1;
  const actualPassageNumber = Math.min(passageNumber, config.passages);
  
  const passageKey = `${context.testType}_${context.sectionName}_${context.testMode}_passage_${actualPassageNumber}`;
  
  console.log(`   📚 Using shared passage ${actualPassageNumber}/${config.passages} (${questionsPerPassage} questions per passage)`);
  
  // Check if we already have this passage in cache
  if (passageCache.has(passageKey)) {
    const cachedPassage = passageCache.get(passageKey)!;
    return {
      passageId: cachedPassage.id,
      passageContent: cachedPassage.content
    };
  }
  
  // Check if passage already exists in database
  const { data: existingPassage } = await supabase
    .from('passages')
    .select('*')
    .eq('test_type', context.testType)
    .eq('section_name', context.sectionName)
    .ilike('title', `%${context.testMode}%passage%${actualPassageNumber}%`)
    .single();
  
  if (existingPassage) {
    const passage = {
      id: existingPassage.id,
      content: existingPassage.content,
      title: existingPassage.title,
      passage_type: existingPassage.passage_type,
      word_count: existingPassage.word_count,
      difficulty: existingPassage.difficulty
    };
    passageCache.set(passageKey, passage);
    
    return {
      passageId: passage.id,
      passageContent: passage.content
    };
  }
  
  // Generate new shared passage
  console.log(`   🆕 Generating new shared passage: ${passageKey}`);
  
  const passageRequest = {
    testType: context.testType,
    sectionName: context.sectionName,
    testMode: context.testMode,
    wordCount: config.words_per_passage,
    difficulty: context.difficulty,
    // Let the passage generation system determine the appropriate type
    // based on topic cycling and test requirements (narrative/informational/persuasive)
    generationContext: context.generationContext,
    isMiniPassage: false,
    subSkill: context.subSkill
  };
  
  const generatedPassage = await generatePassage(passageRequest);
  
  // Store the passage with identifiable title
  const { data: passageData } = await supabase
    .from('passages')
    .insert({
      title: `${generatedPassage.title} (${context.testMode} passage ${actualPassageNumber})`,
      content: generatedPassage.content,
      word_count: generatedPassage.word_count,
      difficulty: generatedPassage.difficulty,
      australian_context: true,
      passage_type: generatedPassage.passage_type,
      section_name: context.sectionName,
      test_type: context.testType,
      year_level: getYearLevel(context.testType)
    })
    .select('id')
    .single();
  
  const passage = {
    id: passageData?.id || '',
    content: generatedPassage.content,
    title: generatedPassage.title,
    passage_type: generatedPassage.passage_type,
    word_count: generatedPassage.word_count,
    difficulty: generatedPassage.difficulty
  };
  
  // Cache the passage
  passageCache.set(passageKey, passage);
  
  return {
    passageId: passage.id,
    passageContent: passage.content
  };
}

/**
 * Extract year level from test type
 */
function getYearLevel(testType: string): number {
  if (testType.includes('Year 5')) return 5;
  if (testType.includes('Year 7')) return 7;
  if (testType.includes('Year 9')) return 9;
  return 7; // Default
}

/**
 * Clear the passage cache (useful for testing)
 */
export function clearPassageCache(): void {
  passageCache.clear();
}

/**
 * Get cache statistics for debugging
 */
export function getPassageCacheStats(): { size: number; keys: string[] } {
  return {
    size: passageCache.size,
    keys: Array.from(passageCache.keys())
  };
}