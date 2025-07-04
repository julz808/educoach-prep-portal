// ============================================================================
// BATCH QUESTION GENERATION ENGINE
// ============================================================================
// Generates complete practice tests with multiple sections and questions
// Integrates with passage generation, question generation, and storage engines

import { 
  TEST_STRUCTURES, 
  SECTION_TO_SUB_SKILLS 
} from '../../data/curriculumData.ts';
import { buildQuestionPrompt, callClaudeAPIWithRetry, parseClaudeResponse } from './claudePrompts.ts';
import { generatePassages, generatePassage, generatePassagesWithDifficulties } from './passageGeneration.ts';
import { 
  storePassage, 
  storeQuestion, 
  storePassages, 
  storeQuestions,
  analyzeTestGaps,
  printTestCompletionReport,
  getExistingQuestionCounts,
  getExistingPassageCounts,
  getExistingPassages
} from './supabaseStorage.ts';
import { updateContextFromQuestion } from './questionGeneration.ts';
import { generateQuestion } from './questionGeneration.ts';
import { 
  isWritingSection, 
  isReadingSection, 
  getDrillQuestionsPerSubSkill, 
  requiresPassages, 
  getPassageType, 
  getSectionResponseType,
  getQuestionsPerPassage
} from './sectionUtils.ts';
import { generateMiniPassage } from './passageGeneration.ts';

// Define types inline to avoid runtime import issues with TypeScript interfaces
type ResponseType = 'multiple_choice' | 'extended_response';
type PassageType = 'narrative' | 'informational' | 'persuasive';

interface BatchGenerationRequest {
  testType: string;
  testMode: string;
  yearLevel?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  generatePassages?: boolean;
}

interface SectionGenerationConfig {
  totalQuestions: number;
  timeLimit: number;
  format: 'Multiple Choice' | 'Written Response';
  passages: number;
  wordsPerPassage: number;
  subSkills: string[];
  questionsPerSubSkill: number;
  isWritingSection: boolean;
  requiresPassages?: boolean;
}

interface TestStructureInfo {
  testType: string;
  sections: Record<string, SectionGenerationConfig>;
  totalQuestions: number;
  metadata: {
    sourceTimestamp: string;
    dataSource: string;
  };
}

interface GeneratedQuestion {
  id?: string;
  question_text: string;
  answer_options: string[] | null;
  correct_answer: string | null;
  solution: string;
  has_visual: boolean;
  visual_type: string | null;
  visual_data: any;
  visual_svg: string | null;
  test_type: string;
  section_name: string;
  sub_skill: string;
  difficulty: number;
  response_type: ResponseType;
  passage_reference: boolean;
  australian_context: boolean;
  generation_metadata: {
    generation_timestamp: string;
    attempt_number?: number;
    prompt_length?: number;
    response_time_ms?: number;
  };
  created_at?: string;
}

interface SingleQuestionRequest {
  testType: string;
  sectionName: string;
  subSkill: string;
  difficulty: number;
  responseType: ResponseType;
  generateVisual: boolean;
  generationContext: GenerationContext;
  passageContent?: string;
}

interface GenerationContext {
  sessionId?: string;
  testType?: string;
  usedTopics: Set<string>;
  usedNames: Set<string>;
  usedLocations: Set<string>;
  usedScenarios: Set<string>;
  passageBank?: any[];
  questionBank?: any[];
  generatedQuestions?: any[];
  questionsBySubSkill?: Record<string, any[]>; // Track questions by sub-skill for smarter diversity
  currentDifficulty?: number;
  difficultyDistribution?: {
    easy: number;
    medium: number;
    hard: number;
  };
  visualsGenerated?: number;
  lastUpdate?: string;
  generatedPassages?: any[];
  usedPassageTypes?: PassageType[];
  recentPassageThemes?: string[];
  recentPassageSettings?: string[];
  recentPassageCharacters?: string[];
  passageTypeRotation?: number;
}

interface SectionGenerationResult {
  sectionName: string;
  questionsGenerated: number;
  questionIds: string[];
  passageIds?: string[];
  errors: string[];
  subSkillResults: SubSkillGenerationResult[];
}

interface SubSkillGenerationResult {
  subSkill: string;
  questionsRequested: number;
  questionsGenerated: number;
  questionIds: string[];
  errors: string[];
}

interface BatchGenerationResult {
  testType: string;
  testMode: string;
  totalQuestions: number;
  sectionsGenerated: SectionGenerationResult[];
  questionIds: string[];
  metadata: {
    startTime: string;
    endTime: string;
    duration: number;
    sourceStructure?: {
      sourceTimestamp: string;
      dataSource: string;
    };
  };
  errors: string[];
}

/**
 * Converts string difficulty to numeric difficulty for engine functions
 */
function convertDifficultyToNumber(difficulty?: 'Easy' | 'Medium' | 'Hard'): number {
  switch (difficulty) {
    case 'Easy': return 1;
    case 'Medium': return 2;
    case 'Hard': return 3;
    default: return 2; // Default to medium
  }
}

/**
 * Gets difficulty distribution based on test mode
 * Special handling for reading sections: difficulty applies to passages, not questions
 */
function getDifficultyDistribution(
  testMode: string,
  sectionName: string,
  subSkill: string,
  totalQuestions: number
): Array<{ difficulty: number; count: number }> {
  // Special case: Reading sections - difficulty handling depends on test mode
  if (isReadingSection(sectionName)) {
    if (testMode === 'drill') {
      // For reading drills: 10 easy + 10 medium + 10 hard mini-passages
      // Difficulty is applied to the mini-passages, not the questions
      return [
        { difficulty: 1, count: 10 }, // Easy mini-passages
        { difficulty: 2, count: 10 }, // Medium mini-passages  
        { difficulty: 3, count: 10 }  // Hard mini-passages
      ];
    } else {
      // For practice/diagnostic tests: questions are Level 2, difficulty comes from passages
      return [
        { difficulty: 2, count: totalQuestions } // All questions are standard difficulty
      ];
    }
  }
  
  if (testMode === 'diagnostic') {
    // Enhanced Diagnostic: 2 questions per difficulty level per sub-skill
    return [
      { difficulty: 1, count: 2 },
      { difficulty: 2, count: 2 },
      { difficulty: 3, count: 2 }
    ];
  }
  
  if (testMode === 'drill') {
    if (isWritingSection) {
      // Writing sections in drill: 2 questions per difficulty level
      return [
        { difficulty: 1, count: 2 },
        { difficulty: 2, count: 2 },
        { difficulty: 3, count: 2 }
      ];
    } else {
      // Non-writing sections in drill: 10 questions per difficulty level
      return [
        { difficulty: 1, count: 10 },
        { difficulty: 2, count: 10 },
        { difficulty: 3, count: 10 }
      ];
    }
  }
  
  // Practice tests: even distribution across difficulties 1-3
  const questionsPerDifficulty = Math.floor(totalQuestions / 3);
  const remainder = totalQuestions % 3;
  
  return [
    { difficulty: 1, count: questionsPerDifficulty + (remainder > 0 ? 1 : 0) },
    { difficulty: 2, count: questionsPerDifficulty + (remainder > 1 ? 1 : 0) },
    { difficulty: 3, count: questionsPerDifficulty }
  ];
}

/**
 * Recalculates section configuration based on test mode difficulty requirements
 */
function adjustSectionConfigForTestMode(
  sectionName: string,
  sectionConfig: SectionGenerationConfig,
  testMode: string
): SectionGenerationConfig {
  if (testMode === 'diagnostic') {
    // Enhanced Diagnostic: 2 questions per sub-skill per difficulty (6 total per sub-skill)
    // Writing: 2 questions total (1 per selected sub-skill)
    const questionsPerSubSkill = isWritingSection(sectionName) ? 
      1 : // 1 question per sub-skill for writing (2 sub-skills selected = 2 total)
      6; // 2 per difficulty for non-writing (2×3 difficulties = 6 per sub-skill)
    
    const totalQuestions = isWritingSection(sectionName) ?
      2 : // Enhanced specification: 2 writing questions total
      sectionConfig.subSkills.length * questionsPerSubSkill; // All sub-skills for non-writing
    
    return {
      ...sectionConfig,
      questionsPerSubSkill,
      totalQuestions
    };
  }
  
  if (testMode === 'drill') {
    const questionsPerSubSkill = getDrillQuestionsPerSubSkill(sectionName);
    
    return {
      ...sectionConfig,
      questionsPerSubSkill,
      totalQuestions: sectionConfig.subSkills.length * questionsPerSubSkill
    };
  }
  
  // Practice tests: use original configuration
  return sectionConfig;
}

/**
 * Gets authoritative test structure for any test type
 * This ensures we never use hardcoded structures that can get out of sync
 */
export function getAuthoritativeTestStructure(testType: string): TestStructureInfo {
  const testStructure = TEST_STRUCTURES[testType as keyof typeof TEST_STRUCTURES];
  if (!testStructure) {
    throw new Error(`Test type "${testType}" not found in authoritative curriculum data. Available types: ${Object.keys(TEST_STRUCTURES).join(', ')}`);
  }
  
  const sections: Record<string, SectionGenerationConfig> = {};
  
  // Convert curriculum data format to generation format
  Object.entries(testStructure).forEach(([sectionName, sectionData]) => {
    if (typeof sectionData === 'object' && 'questions' in sectionData) {
      // Try compound key first (testType - sectionName), then fallback to section name only
      const compoundKey = `${testType} - ${sectionName}` as keyof typeof SECTION_TO_SUB_SKILLS;
      const subSkills = SECTION_TO_SUB_SKILLS[compoundKey] || 
                       SECTION_TO_SUB_SKILLS[sectionName as keyof typeof SECTION_TO_SUB_SKILLS] || [];
      
      if (subSkills.length === 0) {
        console.warn(`⚠️  No sub-skills defined for section "${sectionName}" in SECTION_TO_SUB_SKILLS`);
      }
      
      sections[sectionName] = {
        totalQuestions: sectionData.questions,
        timeLimit: sectionData.time,
        format: sectionData.format as 'Multiple Choice' | 'Written Response',
        passages: sectionData.passages || 0,
        wordsPerPassage: sectionData.words_per_passage || 0,
        subSkills: Array.from(subSkills),
        questionsPerSubSkill: subSkills.length > 0 ? Math.floor(sectionData.questions / subSkills.length) : 0,
        isWritingSection: sectionData.format === 'Written Response',
        requiresPassages: (sectionData.passages || 0) > 0 && sectionName.toLowerCase().includes('reading')
      };
    }
  });
  
  const totalQuestions = Object.values(sections).reduce((sum, section) => sum + section.totalQuestions, 0);
  
  return {
    testType,
    sections,
    totalQuestions,
    metadata: {
      sourceTimestamp: new Date().toISOString(),
      dataSource: 'authoritative_curriculum_data'
    }
  };
}

/**
 * Validates that a test structure is complete and consistent
 */
export function validateTestStructure(structure: TestStructureInfo): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!structure.testType) {
    errors.push('Test type is required');
  }
  
  if (Object.keys(structure.sections).length === 0) {
    errors.push('At least one section is required');
  }
  
  for (const [sectionName, config] of Object.entries(structure.sections)) {
    if (config.totalQuestions <= 0) {
      errors.push(`Section "${sectionName}" has invalid question count: ${config.totalQuestions}`);
    }
    
    if (config.subSkills.length === 0) {
      errors.push(`Section "${sectionName}" has no sub-skills defined`);
    }
    
    // For writing sections, questionsPerSubSkill can be 0 if there are more sub-skills than questions
    // The system will randomly select which sub-skills to use
    if (config.questionsPerSubSkill <= 0 && !config.isWritingSection) {
      errors.push(`Section "${sectionName}" has invalid questions per sub-skill: ${config.questionsPerSubSkill}`);
    }
    
    // Validate passage requirements
    if (config.requiresPassages) {
      if (config.passages <= 0) {
        errors.push(`Section "${sectionName}" requires passages but has passages count: ${config.passages}`);
      }
      if (config.wordsPerPassage <= 0) {
        errors.push(`Section "${sectionName}" requires passages but has invalid words per passage: ${config.wordsPerPassage}`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Generates questions for a complete practice test using authoritative data
 */
export async function generatePracticeTest(request: BatchGenerationRequest): Promise<BatchGenerationResult> {
  console.log(`🚀 Starting batch generation for ${request.testType}`);
  
  // Get authoritative test structure
  const testStructure = getAuthoritativeTestStructure(request.testType);
  
  // Validate structure
  const validation = validateTestStructure(testStructure);
  if (!validation.isValid) {
    throw new Error(`Invalid test structure: ${validation.errors.join(', ')}`);
  }

  // Check existing progress and analyze gaps
  await printTestCompletionReport(request.testType, request.testMode, testStructure);
  const gapAnalysis = await analyzeTestGaps(request.testType, request.testMode, testStructure);

  // If everything is complete, skip generation
  if (gapAnalysis.totalMissing === 0) {
    console.log('\n🎉 TEST ALREADY COMPLETE! No generation needed.');
    return {
      testType: request.testType,
      testMode: request.testMode,
      totalQuestions: 0,
      sectionsGenerated: [],
      questionIds: [],
      metadata: {
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        duration: 0,
        sourceStructure: testStructure.metadata
      },
      errors: []
    };
  }

  console.log('\n📋 Using authoritative test structure:');
  console.log(`   Total Target Questions: ${testStructure.totalQuestions}`);
  console.log(`   Missing Questions: ${gapAnalysis.totalMissing}`);
  console.log(`   Test Mode: ${request.testMode}`);
  
  // Apply test mode adjustments only to incomplete sections
  const adjustedSections: Record<string, SectionGenerationConfig> = {};
  gapAnalysis.incompleteSections.forEach(incompleteSection => {
    const sectionConfig = testStructure.sections[incompleteSection.sectionName];
    adjustedSections[incompleteSection.sectionName] = adjustSectionConfigForTestMode(
      incompleteSection.sectionName, 
      sectionConfig, 
      request.testMode
    );
  });
  
  console.log('\n📊 DIFFICULTY DISTRIBUTION BY TEST MODE:');
  if (request.testMode === 'practice_1' || request.testMode === 'practice_2' || request.testMode === 'practice_3' || 
      request.testMode === 'practice_4' || request.testMode === 'practice_5') {
    console.log('   🎯 Practice Test: Even distribution (Easy/Medium/Hard) across all sections and sub-skills');
    console.log('   📚 Reading Sections: Difficulty applied to passages (Level 1-3), all questions are Level 2');
  } else if (request.testMode === 'diagnostic') {
    console.log('   🔍 Diagnostic: 1 question per difficulty level per sub-skill');
    console.log('   📚 Reading Sections: Difficulty applied to passages (Level 1-3), all questions are Level 2');
  } else if (request.testMode === 'drill') {
    console.log('   💪 Drill: 10 questions per difficulty per sub-skill (2 for writing sections)');
    console.log('   📚 Reading Sections: Difficulty applied to passages (Level 1-3), all questions are Level 2');
  }

  console.log('\n🔄 SECTIONS TO GENERATE:');
  Object.entries(adjustedSections).forEach(([section, config]) => {
    const incompleteInfo = gapAnalysis.incompleteSections.find(s => s.sectionName === section);
    console.log(`   - ${section}: ${incompleteInfo?.missingQuestions || 0} questions needed, ${config.subSkills.length} sub-skills, ${config.format}`);
    if (config.requiresPassages) {
      console.log(`     📖 Requires ${config.passages} passages (${config.wordsPerPassage} words each)`);
    }
  });
  
  const results: BatchGenerationResult = {
    testType: request.testType,
    testMode: request.testMode,
    totalQuestions: 0,
    sectionsGenerated: [],
    questionIds: [],
    metadata: {
      startTime: new Date().toISOString(),
      endTime: '',
      duration: 0,
      sourceStructure: testStructure.metadata
    },
    errors: []
  };
  
  const startTime = Date.now();
  
  try {
    // Initialize generation context for diversity
    const generationContext: GenerationContext = {
      usedTopics: new Set(),
      usedNames: new Set(),
      usedLocations: new Set(),
      usedScenarios: new Set(),
      generatedQuestions: [],
      questionsBySubSkill: {},
      // Initialize passage-specific tracking for enhanced diversity
      generatedPassages: [],
      usedPassageTypes: [] as PassageType[],
      recentPassageThemes: [],
      recentPassageSettings: [],
      recentPassageCharacters: [],
      passageTypeRotation: 0
    };
    
    // Generate only incomplete sections
    for (const [sectionName, sectionConfig] of Object.entries(adjustedSections)) {
      console.log(`\n🔄 Generating ${sectionName} section...`);
      
      // Get the gap analysis for this specific section
      const sectionGapInfo = gapAnalysis.incompleteSections.find(s => s.sectionName === sectionName);
      
      const sectionResult = await generateSectionQuestions(
        sectionName, 
        sectionConfig, 
        request, 
        generationContext,
        sectionGapInfo
      );
      
      results.sectionsGenerated.push(sectionResult);
      results.questionIds.push(...sectionResult.questionIds);
      results.totalQuestions += sectionResult.questionsGenerated;
      
      if (sectionResult.errors.length > 0) {
        results.errors.push(...sectionResult.errors);
      }
    }
    
  } catch (error) {
    results.errors.push(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  const endTime = Date.now();
  results.metadata.endTime = new Date().toISOString();
  results.metadata.duration = Math.round((endTime - startTime) / 1000);
  
  console.log(`\n🎉 Batch generation completed!`);
  console.log(`✅ Generated ${results.totalQuestions} questions in ${results.metadata.duration} seconds`);
  
  if (results.errors.length > 0) {
    console.warn(`⚠️  ${results.errors.length} errors occurred during generation`);
    results.errors.forEach(error => console.warn(`   - ${error}`));
  }
  
  return results;
}

/**
 * Creates a fresh context variation for each question to prevent pattern clustering
 * and provide sub-skill specific recent questions for intelligent diversity
 */
function createContextVariation(
  baseContext: GenerationContext, 
  subSkill: string, 
  difficulty: number, 
  questionIndex: number
): GenerationContext {
  // DEBUG: Log the entire questionsBySubSkill structure
  console.log(`      🔍 DEBUG - baseContext.questionsBySubSkill:`, baseContext.questionsBySubSkill);
  console.log(`      🔍 DEBUG - Looking for subSkill: "${subSkill}"`);
  console.log(`      🔍 DEBUG - Available sub-skills:`, Object.keys(baseContext.questionsBySubSkill || {}));
  
  // Get recent questions for this specific sub-skill (last 5)
  const subSkillQuestions = baseContext.questionsBySubSkill?.[subSkill] || [];
  const recentSubSkillQuestions = subSkillQuestions.slice(-5);
  
  // DEBUG: Log how many recent questions we have for diversity
  console.log(`      🔍 Diversity check for "${subSkill}": ${recentSubSkillQuestions.length} recent questions available`);
  if (recentSubSkillQuestions.length > 0) {
    console.log(`      📝 Recent question samples: ${recentSubSkillQuestions.map(q => (q.question_text || q.text || '').substring(0, 50)).join(' | ')}`);
  }
  
  // Create fresh context with aggressive randomization
  const freshContext: GenerationContext = {
    ...baseContext,
    generatedQuestions: recentSubSkillQuestions, // Pass only recent questions for this sub-skill
    
    // Clear some context every 3rd question to prevent pattern lock-in
    usedTopics: questionIndex % 3 === 0 ? new Set() : new Set([...baseContext.usedTopics].slice(-10)),
    usedNames: questionIndex % 3 === 0 ? new Set() : new Set([...baseContext.usedNames].slice(-10)),
    usedLocations: questionIndex % 3 === 0 ? new Set() : new Set([...baseContext.usedLocations].slice(-10)),
    usedScenarios: questionIndex % 3 === 0 ? new Set() : new Set([...baseContext.usedScenarios].slice(-10)),
    
    // Include passage tracking fields for diversity
    generatedPassages: baseContext.generatedPassages || [],
    usedPassageTypes: baseContext.usedPassageTypes || [],
    recentPassageThemes: baseContext.recentPassageThemes || [],
    recentPassageSettings: baseContext.recentPassageSettings || [],
    recentPassageCharacters: baseContext.recentPassageCharacters || [],
    passageTypeRotation: baseContext.passageTypeRotation || 0
  } as any;
  
  // Add dynamic properties for prompt building
  (freshContext as any).currentSubSkill = subSkill;
  (freshContext as any).currentDifficulty = difficulty;
  (freshContext as any).questionIndex = questionIndex;
  (freshContext as any).randomizationSeed = Math.floor(Math.random() * 10000);
  (freshContext as any).preferredApproach = getVariedApproach(questionIndex);
  (freshContext as any).forceVariety = true;
  (freshContext as any).avoidRecent = true;
  
  return freshContext;
}

/**
 * Gets a varied approach that actively avoids clustering
 */
function getVariedApproach(questionIndex: number): string {
  // Use multiple randomization sources to avoid patterns
  const timeBasedSeed = Date.now() % 7;
  const indexBasedSeed = questionIndex % 5;
  const randomSeed = Math.floor(Math.random() * 4);
  
  const approaches = ['abstract', 'data_focused', 'minimal_context', 'real_world'];
  
  // Combine different seeds to create more unpredictable distribution
  const combinedSeed = (timeBasedSeed + indexBasedSeed + randomSeed) % approaches.length;
  
  return approaches[combinedSeed];
}

/**
 * Creates optimal question distribution across sub-skills to hit exact target total
 */
function getSubSkillQuestionDistribution(totalQuestions: number, subSkills: string[]): Record<string, number> {
  const distribution: Record<string, number> = {};
  
  if (subSkills.length === 0) return distribution;
  
  // Base questions per sub-skill
  const baseQuestionsPerSubSkill = Math.floor(totalQuestions / subSkills.length);
  const remainderQuestions = totalQuestions % subSkills.length;
  
  // Initialize all sub-skills with base amount
  subSkills.forEach(subSkill => {
    distribution[subSkill] = baseQuestionsPerSubSkill;
  });
  
  // Distribute remainder questions to the first N sub-skills
  for (let i = 0; i < remainderQuestions; i++) {
    distribution[subSkills[i]]++;
  }
  
  return distribution;
}

/**
 * Generates questions for a single section with passage support
 */
async function generateSectionQuestions(
  sectionName: string, 
  sectionConfig: SectionGenerationConfig,
  request: BatchGenerationRequest,
  generationContext: GenerationContext,
  sectionGapInfo?: any
): Promise<any> {
  console.log(`   Target: ${sectionConfig.totalQuestions} questions (${sectionConfig.subSkills.length} sub-skills)`);
  
  if (sectionConfig.requiresPassages) {
    console.log(`   📖 Passages required: ${sectionConfig.passages} (${sectionConfig.wordsPerPassage} words each)`);
  }

  // Check what we already have for this section
  const existingCounts = await getExistingQuestionCounts(request.testType, request.testMode);
  const existingSection = existingCounts.sectionCounts[sectionName];
  const existingPassageCounts = await getExistingPassageCounts(request.testType, request.testMode);
  const existingPassages = existingPassageCounts[sectionName] || 0;
  
  console.log(`   📊 Current progress: ${existingSection?.total || 0}/${sectionConfig.totalQuestions} questions`);
  if (sectionConfig.requiresPassages) {
    console.log(`   📖 Current passages: ${existingPassages}/${sectionConfig.passages}`);
  }
  
  const sectionResult = {
    sectionName,
    questionsGenerated: 0,
    questionIds: [],
    passageIds: [],
    errors: [],
    subSkillResults: []
  };
  
  try {
    // Handle sections that require passages (like Reading Reasoning)
    if (sectionConfig.requiresPassages && sectionConfig.passages > 0) {
      let passageResults;
      let passageIds;
      
      // Get all existing passages for this section first
      const existingPassages = await getExistingPassages(request.testType, sectionName);
      console.log(`  📖 Found ${existingPassages.length} existing passages`);
      
      // Check if we need to generate more passages
      const passagesNeeded = Math.max(0, sectionConfig.passages - existingPassages.length);
      
      if (passagesNeeded > 0) {
        console.log(`\n  📖 Generating ${passagesNeeded} additional reading passages...`);
        
        if (isReadingSection(sectionName)) {
          if (request.testMode === 'drill') {
            // For drill mode, we handle mini-passages differently
            // Don't pre-generate passages - create them during question generation for 1:1 ratio
            console.log(`  🎯 Reading Drill Section: Mini-passages will be generated per question (1:1 ratio)`);
            console.log(`  📚 Each question gets its own mini-passage (50-150 words)`);
            passageResults = { passages: [], updatedContext: generationContext };
          } else {
            console.log(`  🎯 Reading Section: Generating passages with varying difficulty (Level 1-3)`);
            console.log(`  📚 Questions will all be standard Level 2 difficulty`);
            
            // For reading sections, distribute additional passages across difficulty levels
            const passageDifficulties = [];
            const passagesPerDifficulty = Math.floor(passagesNeeded / 3);
            const remainder = passagesNeeded % 3;
            
            // Create difficulty distribution for additional passages
            for (let i = 0; i < passagesPerDifficulty + (remainder > 0 ? 1 : 0); i++) {
              passageDifficulties.push(1); // Easy passages
            }
            for (let i = 0; i < passagesPerDifficulty + (remainder > 1 ? 1 : 0); i++) {
              passageDifficulties.push(2); // Medium passages
            }
            for (let i = 0; i < passagesPerDifficulty; i++) {
              passageDifficulties.push(3); // Hard passages
            }
            
            console.log(`  📊 Additional passage difficulty distribution: ${passageDifficulties.filter(d => d === 1).length}x Level 1, ${passageDifficulties.filter(d => d === 2).length}x Level 2, ${passageDifficulties.filter(d => d === 3).length}x Level 3`);
            
            // Generate additional passages with specific difficulties
            passageResults = await generatePassagesWithDifficulties(
              request.testType,
              sectionName,
              passageDifficulties,
              generationContext
            );
          }
          
          if (passageResults.passages.length === 0 && request.testMode !== 'drill') {
            throw new Error(`Failed to generate additional passages for ${sectionName}`);
          }
          
          console.log(`  ✅ Generated ${passageResults.passages.length} additional passages with varying difficulty`);
          
          // Update context from passage generation
          generationContext = passageResults.updatedContext;
          
          // Store additional passages in database
          const newPassageIds = await storePassages(
            passageResults.passages,
            request.testType,
            request.testMode,
            sectionName
          );
          
          sectionResult.passageIds = newPassageIds;
        } else {
          // Standard passage generation for non-reading sections
          passageResults = await generatePassages(
            request.testType,
            sectionName,
            passagesNeeded,
            generationContext
          );
          
          if (passageResults.passages.length === 0) {
            throw new Error(`Failed to generate additional passages for ${sectionName}`);
          }
          
          console.log(`  ✅ Generated ${passageResults.passages.length} additional passages`);
          
          // Update context from passage generation
          generationContext = passageResults.updatedContext;
          
          // Store additional passages in database
          const newPassageIds = await storePassages(
            passageResults.passages,
            request.testType,
            request.testMode,
            sectionName
          );
          
          sectionResult.passageIds = newPassageIds;
        }
      } else {
        console.log(`  ✅ Sufficient passages already exist (${existingPassages}/${sectionConfig.passages})`);
      }
      
      // For passage-based sections, check what questions are missing for each sub-skill
      console.log(`  📝 Checking sub-skill gaps for questions...`);
      
      // Combine existing passages with newly generated ones
      let allPassages = [...existingPassages];
      if (passageResults && passageResults.passages.length > 0) {
        // Convert GeneratedPassage to DatabasePassage format for consistency
        const newPassagesAsDb = passageResults.passages.map((p, index) => ({
          id: sectionResult.passageIds[index],
          test_type: p.test_type,
          year_level: p.year_level,
          section_name: p.section_name,
          title: p.title,
          content: p.content,
          passage_type: p.passage_type,
          word_count: p.word_count,
          difficulty: p.difficulty,
          australian_context: p.australian_context,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        allPassages = [...allPassages, ...newPassagesAsDb];
      }
      
      console.log(`  📖 Total passages available: ${allPassages.length}`);
      
      // Calculate proper question distribution for this section to hit exact target
      const targetQuestionDistribution = getSubSkillQuestionDistribution(
        sectionConfig.totalQuestions, 
        sectionConfig.subSkills
      );
      
      console.log(`  📊 Target question distribution:`);
      Object.entries(targetQuestionDistribution).forEach(([subSkill, count]) => {
        console.log(`     - ${subSkill}: ${count} questions`);
      });
      
      // Generate questions only for sub-skills that need more questions
      for (const subSkill of sectionConfig.subSkills) {
        const existingSubSkillCount = existingSection?.subSkillCounts[subSkill] || 0;
        const targetSubSkillCount = targetQuestionDistribution[subSkill] || 0;
        const questionsNeeded = Math.max(0, targetSubSkillCount - existingSubSkillCount);
        
        if (questionsNeeded === 0) {
          console.log(`\n    ✅ "${subSkill}" already complete (${existingSubSkillCount}/${targetSubSkillCount})`);
          continue;
        }
        
        console.log(`\n    🎯 Processing "${subSkill}" (${questionsNeeded} more questions needed, ${existingSubSkillCount}/${targetSubSkillCount} complete)`);
        
        // Get difficulty distribution for the missing questions only
        const difficultyDistribution = getDifficultyDistribution(
          request.testMode,
          sectionName,
          subSkill,
          questionsNeeded  // Only generate the missing questions
        );
        
        console.log(`      📊 Difficulty distribution for missing questions: ${difficultyDistribution.map(d => `${d.count}x Level ${d.difficulty}`).join(', ')}`);
        
        // Distribute questions for this sub-skill across passages and difficulties
        let globalQuestionIndex = 0; // Track overall question index across all difficulties
        
        for (const { difficulty, count } of difficultyDistribution) {
          for (let i = 0; i < count; i++) {
            try {
              // Use round-robin across all available passages (existing + new) or generate mini-passage for drills
              let passageContent = '';
              let passageId = '';
              let passageDifficulty = difficulty; // Default to question difficulty
              
              if (request.testMode === 'drill' && isReadingSection(sectionName)) {
                // For drill mode reading sections, generate a mini-passage per question
                console.log(`        📖 Generating mini-passage for ${subSkill} drill question...`);
                
                try {
                  const miniPassageRequest = {
                    testType: request.testType,
                    sectionName,
                    testMode: request.testMode,
                    wordCount: 100, // Mini-passage target
                    difficulty: difficulty,
                    passageType: 'informational' as PassageType, // Default for drill questions
                    generationContext,
                    isMiniPassage: true,
                    subSkill
                  };
                  
                  const miniPassage = await generateMiniPassage(miniPassageRequest);
                  passageContent = miniPassage.content;
                  passageDifficulty = miniPassage.difficulty;
                  
                  // Store the mini-passage in the database
                  const storedPassageId = await storePassage(
                    miniPassage,
                    request.testType,
                    request.testMode,
                    sectionName
                  );
                  passageId = storedPassageId;
                  
                  console.log(`        ✅ Generated mini-passage "${miniPassage.title}" (${miniPassage.word_count} words)`);
                  
                } catch (error) {
                  console.warn(`        ⚠️ Failed to generate mini-passage, proceeding without: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
                
              } else if (allPassages.length > 0) {
                // For non-drill mode or non-reading sections, use existing passages
                const passageIndex = globalQuestionIndex % allPassages.length;
                const selectedPassage = allPassages[passageIndex];
                passageContent = selectedPassage.content;
                passageId = selectedPassage.id;
                passageDifficulty = selectedPassage.difficulty || 2; // Use passage difficulty, default to 2 if missing
                
                console.log(`        📖 Using passage "${selectedPassage.title}" (Difficulty: ${passageDifficulty})`);
              }
              
              const questionRequest: SingleQuestionRequest = {
                testType: request.testType,
                sectionName,
                subSkill,
                difficulty,
                responseType: sectionConfig.format === 'Written Response' ? 'extended_response' : 'multiple_choice',
                passageContent,
                generateVisual: false,
                generationContext
              };
              
              // Use the proper generateQuestion function instead of calling Claude directly
              const generatedQuestion = await generateQuestion(questionRequest);
              
              // CRITICAL: Update context IMMEDIATELY after generation so next question sees this one
              generationContext = updateContextFromQuestion(generationContext, generatedQuestion, subSkill);
              
              // Store question in database with passage difficulty for reading sections
              const questionId = await storeQuestion(
                generatedQuestion,
                request.testType,
                request.testMode,
                sectionName,
                subSkill,
                passageDifficulty,  // Use passage difficulty instead of question difficulty
                passageId  // Passage-based sections should have passageId
              );
              
              sectionResult.questionIds.push(questionId);
              sectionResult.questionsGenerated++;
              globalQuestionIndex++; // Increment global counter
              
              console.log(`        ✅ Generated Level ${difficulty} question ${globalQuestionIndex}/${questionsNeeded} (Global #${globalQuestionIndex})`);
              
              // Add delay to avoid rate limiting
              await new Promise(resolve => setTimeout(resolve, 1000));
              
            } catch (error) {
              const errorMessage = `Failed to generate question for ${subSkill} (difficulty ${difficulty}): ${error instanceof Error ? error.message : 'Unknown error'}`;
              sectionResult.errors.push(errorMessage);
              console.error(`        ❌ ${errorMessage}`);
            }
          }
        }
      }
    } else {
      // Standard section without passages - check sub-skill gaps
      
      // Calculate proper question distribution for this section to hit exact target
      const targetQuestionDistribution = getSubSkillQuestionDistribution(
        sectionConfig.totalQuestions, 
        sectionConfig.subSkills
      );
      
      console.log(`  📊 Target question distribution:`);
      Object.entries(targetQuestionDistribution).forEach(([subSkill, count]) => {
        console.log(`     - ${subSkill}: ${count} questions`);
      });
      
      for (const subSkill of sectionConfig.subSkills) {
        const existingSubSkillCount = existingSection?.subSkillCounts[subSkill] || 0;
        const targetSubSkillCount = targetQuestionDistribution[subSkill] || 0;
        const questionsNeeded = Math.max(0, targetSubSkillCount - existingSubSkillCount);
        
        if (questionsNeeded === 0) {
          console.log(`\n  ✅ "${subSkill}" already complete (${existingSubSkillCount}/${targetSubSkillCount})`);
          continue;
        }
        
        console.log(`\n  🎯 Processing "${subSkill}" (${questionsNeeded} more questions needed, ${existingSubSkillCount}/${targetSubSkillCount} complete)`);
        
        // Get difficulty distribution for missing questions only
        const difficultyDistribution = getDifficultyDistribution(
          request.testMode,
          sectionName,
          subSkill,
          questionsNeeded  // Only generate the missing questions
        );
        
        console.log(`    📊 Difficulty distribution for missing questions: ${difficultyDistribution.map(d => `${d.count}x Level ${d.difficulty}`).join(', ')}`);
        
        // Generate questions for each difficulty level
        let globalQuestionIndex = 0; // Track overall question index across all difficulties
        
        for (const { difficulty, count } of difficultyDistribution) {
          for (let i = 0; i < count; i++) {
            try {
              // Create a fresh context variation for each question to prevent pattern clustering
              // This will now include any questions generated previously in this sub-skill
              const contextVariation = createContextVariation(generationContext, subSkill, difficulty, globalQuestionIndex);
              
              // For writing sections, always use difficulty level 2
              const questionDifficulty = sectionConfig.isWritingSection ? 2 : difficulty;
              
              const questionRequest: SingleQuestionRequest = {
                testType: request.testType,
                sectionName,
                subSkill,
                difficulty: questionDifficulty,
                responseType: sectionConfig.format === 'Written Response' ? 'extended_response' : 'multiple_choice',
                generateVisual: false,
                generationContext: contextVariation
              };
              
              // Use the proper generateQuestion function instead of calling Claude directly
              const generatedQuestion = await generateQuestion(questionRequest);
              
              // CRITICAL: Update context IMMEDIATELY after generation so next question sees this one
              generationContext = updateContextFromQuestion(generationContext, generatedQuestion, subSkill);
              
              // Store question in database
              const questionId = await storeQuestion(
                generatedQuestion,
                request.testType,
                request.testMode,
                sectionName,
                subSkill,
                questionDifficulty,
                undefined  // Non-passage sections don't have a passageId
              );
              
              sectionResult.questionIds.push(questionId);
              sectionResult.questionsGenerated++;
              globalQuestionIndex++; // Increment global counter
              
              console.log(`      ✅ Generated Level ${difficulty} question ${i + 1}/${count} (Global #${globalQuestionIndex})`);
              
              // Add randomized delay to break patterns (1-3 seconds)
              const delay = 1000 + Math.random() * 2000;
              await new Promise(resolve => setTimeout(resolve, delay));
              
            } catch (error) {
              const errorMessage = `Failed to generate question for ${subSkill} (difficulty ${difficulty}): ${error instanceof Error ? error.message : 'Unknown error'}`;
              sectionResult.errors.push(errorMessage);
              console.error(`    ❌ ${errorMessage}`);
            }
          }
        }
      }
    }
    
  } catch (error) {
    const errorMessage = `Failed to generate ${sectionName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
    sectionResult.errors.push(errorMessage);
    console.error(`  ❌ ${errorMessage}`);
  }
  
  console.log(`\n✅ ${sectionName} section completed: ${sectionResult.questionsGenerated} questions generated`);
  return sectionResult;
}

/**
 * Lists all available test types from authoritative data
 */
export function getAvailableTestTypes(): string[] {
  return Object.keys(TEST_STRUCTURES);
}

/**
 * Gets detailed information about a test type
 */
export function getTestTypeInfo(testType: string) {
  try {
    const structure = getAuthoritativeTestStructure(testType);
    return {
      testType,
      totalQuestions: structure.totalQuestions,
      sections: Object.keys(structure.sections),
      sectionDetails: structure.sections
    };
  } catch (error) {
    return null;
  }
} 