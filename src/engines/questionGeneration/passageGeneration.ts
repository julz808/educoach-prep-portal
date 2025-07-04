// ============================================================================
// PASSAGE GENERATION ENGINE
// ============================================================================

import { TEST_STRUCTURES } from '../../data/curriculumData.ts';
import { buildPassagePrompt, callClaudeAPIWithRetry, parseClaudeResponse } from './claudePrompts.ts';
import { validatePassage } from './validators.ts';
import { isReadingSection, getPassageWordCount, getPassageType, requiresPassages } from './sectionUtils.ts';

// Define types inline to avoid runtime import issues with TypeScript interfaces
type PassageType = 'narrative' | 'informational' | 'persuasive';

interface PassageGenerationRequest {
  testType: string;
  sectionName: string;
  testMode: string;
  wordCount: number;
  difficulty: number;
  passageType: PassageType;
  generationContext: GenerationContext;
  isMiniPassage?: boolean;
  subSkill?: string;
}

interface GeneratedPassage {
  id?: string;
  test_type: string;
  year_level: number;
  section_name: string;
  title: string;
  content: string;
  passage_type: PassageType;
  word_count: number;
  australian_context: boolean;
  difficulty: number;
  main_themes: string[];
  key_characters: string[];
  setting: string;
  potential_question_topics: string[];
  generation_metadata: {
    test_type: string;
    section_name: string;
    difficulty: number;
    passage_type: PassageType;
    target_word_count: number;
    generation_timestamp: string;
    attempt_number: number;
  };
  created_at?: string;
}

interface GenerationContext {
  sessionId?: string;
  testType?: string;
  testMode?: string;
  usedTopics: Set<string>;
  usedNames: Set<string>;
  usedLocations: Set<string>;
  usedScenarios: Set<string>;
  passageBank?: any[];
  questionBank?: any[];
  generatedQuestions?: any[];
  currentDifficulty?: number;
  difficultyDistribution?: {
    easy: number;
    medium: number;
    hard: number;
  };
  visualsGenerated?: number;
  lastUpdate?: string;
  lastPassageType?: PassageType;
  passageTypeRotation?: number;
  generatedPassages?: {
    title: string;
    content: string;
    passage_type: PassageType;
    main_themes: string[];
    key_characters: string[];
    setting: string;
  }[];
  usedPassageTypes?: PassageType[];
  recentPassageThemes?: string[];
  recentPassageSettings?: string[];
  recentPassageCharacters?: string[];
  // Enhanced diversity tracking
  practiceTestDiversity?: {
    [testMode: string]: {
      themes: Set<string>;
      settings: Set<string>;
      characters: Set<string>;
      textTypes: Set<PassageType>;
      topics: Set<string>;
      culturalContexts: Set<string>;
    };
  };
  miniPassageTopics?: Set<string>;
  globalDiversityState?: {
    allUsedThemes: Set<string>;
    allUsedSettings: Set<string>;
    allUsedCharacters: Set<string>;
    themesPerProduct: { [product: string]: Set<string> };
  };
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score?: number;
}

/**
 * Gets the appropriate year level for a test type
 */
function getYearLevel(testType: string): number {
  if (testType.includes('Year 5')) return 5;
  if (testType.includes('Year 7')) return 7;
  if (testType.includes('Year 9')) return 9;
  return 7; // Default fallback
}

/**
 * Determines appropriate passage type based on test requirements with systematic diversity
 * Ensures we cycle through different types and don't repeat the same type consecutively
 */
function determinePassageType(testType: string, sectionName: string, passageIndex: number = 0, generationContext?: GenerationContext): PassageType {
  // Test-specific passage type preferences
  const typePreferences = {
    'Year 5 NAPLAN': ['narrative', 'informational'],
    'Year 7 NAPLAN': ['narrative', 'informational', 'persuasive'],
    'VIC Selective Entry (Year 9 Entry)': ['narrative', 'informational', 'persuasive'],
    'NSW Selective Entry (Year 7 Entry)': ['informational', 'narrative', 'persuasive'],
    'EduTest Scholarship (Year 7 Entry)': ['informational', 'narrative'],
    'ACER Scholarship (Year 7 Entry)': ['informational', 'persuasive', 'narrative']
  };

  const preferences = typePreferences[testType as keyof typeof typePreferences] || ['informational', 'narrative'];
  
  // If we have generation context, use smart cycling to avoid repetition
  if (generationContext) {
    const lastType = generationContext.lastPassageType;
    const typeRotation = generationContext.passageTypeRotation || 0;
    
    // If last passage was the same type as what we'd normally pick, choose the next one
    const normalChoice = preferences[passageIndex % preferences.length];
    
    if (lastType === normalChoice && preferences.length > 1) {
      // Find a different type from preferences
      const availableTypes = preferences.filter(type => type !== lastType);
      const rotatedIndex = typeRotation % availableTypes.length;
      return availableTypes[rotatedIndex] as PassageType;
    }
    
    return normalChoice as PassageType;
  }
  
  // Fallback: Systematically cycle through types for diversity (rather than random)
  return preferences[passageIndex % preferences.length] as PassageType;
}

/**
 * Gets appropriate word count for passage based on test type, section, and test mode
 */
function getWordCountForPassage(testType: string, sectionName: string, testMode: string): number {
  const testStructure = TEST_STRUCTURES[testType as keyof typeof TEST_STRUCTURES];
  const sectionStructure = testStructure?.[sectionName as keyof typeof testStructure];
  
  if (sectionStructure && typeof sectionStructure === 'object' && 'words_per_passage' in sectionStructure) {
    const baseWords = (sectionStructure as any).words_per_passage;
    if (baseWords > 0) {
      // Use sectionUtils function for proper word count calculation
      return getPassageWordCount(sectionName, testMode, baseWords);
    }
  }
  
  // Fallback word counts based on test type (only if not found in curriculum data)
  const fallbackWordCounts = {
    'Year 5 NAPLAN': 150,
    'Year 7 NAPLAN': 200,
    'VIC Selective Entry (Year 9 Entry)': 300,
    'NSW Selective Entry (Year 7 Entry)': 250,
    'EduTest Scholarship (Year 7 Entry)': 200,
    'ACER Scholarship (Year 7 Entry)': 300
  };
  
  const baseWords = fallbackWordCounts[testType as keyof typeof fallbackWordCounts] || 200;
  return getPassageWordCount(sectionName, testMode, baseWords);
}

/**
 * Selects appropriate difficulty level for passage
 */
function selectPassageDifficulty(testType: string): number {
  // Distribution of difficulties based on test type
  const difficultyDistributions = {
    'Year 5 NAPLAN': [0.4, 0.5, 0.1], // 40% easy, 50% medium, 10% hard
    'Year 7 NAPLAN': [0.3, 0.5, 0.2], // 30% easy, 50% medium, 20% hard
    'VIC Selective Entry (Year 9 Entry)': [0.1, 0.4, 0.5], // 10% easy, 40% medium, 50% hard
    'NSW Selective Entry (Year 7 Entry)': [0.2, 0.5, 0.3], // 20% easy, 50% medium, 30% hard
    'EduTest Scholarship (Year 7 Entry)': [0.2, 0.5, 0.3],
    'ACER Scholarship (Year 7 Entry)': [0.15, 0.45, 0.4]
  };
  
  const distribution = difficultyDistributions[testType as keyof typeof difficultyDistributions] || [0.3, 0.5, 0.2];
  const random = Math.random();
  
  if (random < distribution[0]) return 1; // Easy
  if (random < distribution[0] + distribution[1]) return 2; // Medium
  return 3; // Hard
}

/**
 * Updates generation context with passage-specific elements for enhanced diversity tracking
 */
function updateContextFromPassage(context: GenerationContext, passage: GeneratedPassage): GenerationContext {
  const updated = { ...context };
  
  // Initialize passage-specific arrays if they don't exist
  if (!updated.generatedPassages) updated.generatedPassages = [];
  if (!updated.usedPassageTypes) updated.usedPassageTypes = [];
  if (!updated.recentPassageThemes) updated.recentPassageThemes = [];
  if (!updated.recentPassageSettings) updated.recentPassageSettings = [];
  if (!updated.recentPassageCharacters) updated.recentPassageCharacters = [];
  
  // Add this passage to the generated passages (keep last 10 for diversity checking)
  updated.generatedPassages.push({
    title: passage.title,
    content: passage.content,
    passage_type: passage.passage_type,
    main_themes: passage.main_themes,
    key_characters: passage.key_characters,
    setting: passage.setting
  });
  if (updated.generatedPassages.length > 10) {
    updated.generatedPassages = updated.generatedPassages.slice(-10);
  }
  
  // Track passage type for smart cycling
  updated.lastPassageType = passage.passage_type;
  updated.usedPassageTypes.push(passage.passage_type);
  if (updated.usedPassageTypes.length > 5) {
    updated.usedPassageTypes = updated.usedPassageTypes.slice(-5);
  }
  
  // Increment passage type rotation counter
  updated.passageTypeRotation = (updated.passageTypeRotation || 0) + 1;
  
  // Track themes for diversity (keep last 10)
  if (passage.main_themes) {
    passage.main_themes.forEach(theme => {
      updated.usedTopics.add(theme); // For overall topic tracking
      updated.recentPassageThemes.push(theme); // For passage-specific diversity
    });
    if (updated.recentPassageThemes.length > 10) {
      updated.recentPassageThemes = updated.recentPassageThemes.slice(-10);
    }
  }
  
  // Track character types for diversity (keep last 8)
  if (passage.key_characters) {
    passage.key_characters.forEach(character => {
      updated.usedNames.add(character); // For overall name tracking
      // Extract character type/demographic info for diversity
      const characterType = extractCharacterType(character);
      if (characterType) {
        updated.recentPassageCharacters.push(characterType);
      }
    });
    if (updated.recentPassageCharacters.length > 8) {
      updated.recentPassageCharacters = updated.recentPassageCharacters.slice(-8);
    }
  }
  
  // Track settings for diversity (keep last 8)
  if (passage.setting) {
    // Extract setting information for diversity tracking
    const settingInfo = extractSettingInfo(passage.setting);
    updated.recentPassageSettings.push(settingInfo);
    if (updated.recentPassageSettings.length > 8) {
      updated.recentPassageSettings = updated.recentPassageSettings.slice(-8);
    }
    
    // Try to extract location from setting for overall location tracking
    const locationMatch = passage.setting.match(/\b(Sydney|Melbourne|Brisbane|Perth|Adelaide|Darwin|Canberra|Australia|NSW|VIC|QLD|WA|SA|NT|ACT)\b/i);
    if (locationMatch) {
      updated.usedLocations.add(locationMatch[0]);
    }
  }
  
  // Add potential question topics as scenarios for overall tracking
  if (passage.potential_question_topics) {
    passage.potential_question_topics.forEach(topic => updated.usedScenarios.add(topic));
  }
  
  // Initialize mini-passage topics tracking if not exists
  if (!updated.miniPassageTopics) {
    updated.miniPassageTopics = new Set();
  }
  
  // Initialize global diversity state if not exists
  if (!updated.globalDiversityState) {
    updated.globalDiversityState = {
      allUsedThemes: new Set(),
      allUsedSettings: new Set(),
      allUsedCharacters: new Set(),
      themesPerProduct: {}
    };
  }
  
  // Update global diversity tracking
  if (passage.main_themes) {
    passage.main_themes.forEach(theme => {
      updated.globalDiversityState!.allUsedThemes.add(theme);
    });
  }
  
  if (passage.setting) {
    updated.globalDiversityState!.allUsedSettings.add(extractSettingInfo(passage.setting));
  }
  
  if (passage.key_characters) {
    passage.key_characters.forEach(character => {
      updated.globalDiversityState!.allUsedCharacters.add(character);
    });
  }
  
  return updated;
}

/**
 * Extracts character type/demographic information for diversity tracking
 */
function extractCharacterType(characterName: string): string {
  // Simple character type extraction based on name patterns
  // This is a basic implementation - could be enhanced with more sophisticated analysis
  const name = characterName.toLowerCase();
  
  if (name.includes('dr') || name.includes('doctor')) return 'medical professional';
  if (name.includes('prof') || name.includes('professor')) return 'academic';
  if (name.includes('ms') || name.includes('mr') || name.includes('mrs')) return 'adult professional';
  if (name.length < 8 && /^[a-z]+$/.test(name)) return 'young person'; // Simple first names
  if (name.includes('researcher') || name.includes('scientist')) return 'researcher';
  if (name.includes('teacher') || name.includes('educator')) return 'educator';
  
  return 'character'; // Generic fallback
}

/**
 * Extracts setting information for diversity tracking
 */
function extractSettingInfo(setting: string): string {
  const settingLower = setting.toLowerCase();
  
  // Extract key setting types for diversity tracking
  if (settingLower.includes('school') || settingLower.includes('classroom')) return 'educational setting';
  if (settingLower.includes('hospital') || settingLower.includes('medical')) return 'healthcare setting';
  if (settingLower.includes('forest') || settingLower.includes('nature') || settingLower.includes('park')) return 'natural environment';
  if (settingLower.includes('city') || settingLower.includes('urban') || settingLower.includes('street')) return 'urban environment';
  if (settingLower.includes('home') || settingLower.includes('house') || settingLower.includes('family')) return 'domestic setting';
  if (settingLower.includes('lab') || settingLower.includes('research') || settingLower.includes('university')) return 'research facility';
  if (settingLower.includes('ocean') || settingLower.includes('beach') || settingLower.includes('coastal')) return 'marine environment';
  if (settingLower.includes('farm') || settingLower.includes('rural') || settingLower.includes('countryside')) return 'rural setting';
  if (settingLower.includes('space') || settingLower.includes('astronomy') || settingLower.includes('cosmic')) return 'space/astronomy';
  if (settingLower.includes('historical') || settingLower.includes('past') || settingLower.includes('ancient')) return 'historical context';
  
  return 'general setting'; // Generic fallback
}

/**
 * Validates that passage meets content requirements
 */
function validatePassageContent(passage: GeneratedPassage, request: PassageGenerationRequest): ValidationResult {
  const validation = validatePassage(passage);
  
  // Additional request-specific validation
  const errors = [...validation.errors];
  const warnings = [...validation.warnings];
  
  // Check word count accuracy with ±25% tolerance for flexibility
  const targetWords = request.wordCount;
  const actualWords = passage.word_count;
  const wordCountTolerance = Math.ceil(targetWords * 0.25); // 25% tolerance for more flexibility
  
  if (Math.abs(actualWords - targetWords) > wordCountTolerance) {
    errors.push(`Word count ${actualWords} is outside acceptable range (${targetWords} ± ${wordCountTolerance})`);
  }
  
  // Check passage type consistency
  if (passage.content) {
    const contentLower = passage.content.toLowerCase();
    
    if (request.passageType === 'narrative') {
      if (!contentLower.includes('said') && !contentLower.includes('told') && !contentLower.includes('thought')) {
        warnings.push('Narrative passage should include dialogue or character thoughts');
      }
    } else if (request.passageType === 'persuasive') {
      if (!contentLower.includes('should') && !contentLower.includes('must') && !contentLower.includes('because')) {
        warnings.push('Persuasive passage should include persuasive language');
      }
    } else if (request.passageType === 'informational') {
      if (!contentLower.includes('research') && !contentLower.includes('study') && !contentLower.includes('found')) {
        warnings.push('Informational passage should include factual language');
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    score: Math.max(0, 100 - (errors.length * 20) - (warnings.length * 5))
  };
}

/**
 * Generates a mini-passage for drill questions (1:1 ratio)
 */
export async function generateMiniPassage(request: PassageGenerationRequest): Promise<GeneratedPassage> {
  const maxAttempts = 3;
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Build a specialized prompt for mini-passages
      const miniPassageRequest = {
        ...request,
        wordCount: Math.min(150, Math.max(50, request.wordCount)), // Clamp to mini-passage range
        isMiniPassage: true
      };
      
      const prompt = buildPassagePrompt(miniPassageRequest);
      
      // Call Claude API
      const response = await callClaudeAPIWithRetry(prompt);
      
      // Parse the response
      const parsedPassage = parseClaudeResponse(response);
      
      // Create passage object with mini-passage specific settings
      const passage: GeneratedPassage = {
        test_type: request.testType,
        year_level: getYearLevel(request.testType),
        section_name: request.sectionName,
        passage_type: request.passageType,
        title: parsedPassage.title || `Mini-Passage for ${request.subSkill || 'Reading'}`,
        content: parsedPassage.content || '',
        word_count: parsedPassage.word_count || 0,
        australian_context: true,
        difficulty: request.difficulty,
        main_themes: parsedPassage.main_themes || [],
        key_characters: parsedPassage.key_characters || [],
        setting: parsedPassage.setting || '',
        potential_question_topics: parsedPassage.potential_question_topics || [],
        generation_metadata: {
          test_type: request.testType,
          section_name: request.sectionName,
          difficulty: request.difficulty,
          passage_type: request.passageType,
          target_word_count: miniPassageRequest.wordCount,
          generation_timestamp: new Date().toISOString(),
          attempt_number: attempt
        }
      };
      
      // Validate the passage with mini-passage specific rules
      const validation = validatePassageContent(passage, miniPassageRequest);
      
      if (validation.isValid) {
        // Track this mini-passage topic to ensure diversity
        if (request.generationContext.miniPassageTopics) {
          passage.main_themes.forEach(theme => {
            request.generationContext.miniPassageTopics?.add(theme);
          });
        }
        
        return passage;
      } else {
        console.warn(`Mini-passage validation failed on attempt ${attempt}:`, validation.errors);
        if (attempt === maxAttempts) {
          throw new Error(`Mini-passage validation failed after ${maxAttempts} attempts: ${validation.errors.join(', ')}`);
        }
      }
      
    } catch (error) {
      lastError = error as Error;
      console.error(`Mini-passage generation attempt ${attempt} failed:`, error);
      
      if (attempt === maxAttempts) {
        break;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  throw new Error(`Failed to generate mini-passage after ${maxAttempts} attempts. Last error: ${lastError?.message}`);
}

/**
 * Generates a single reading passage
 */
export async function generatePassage(request: PassageGenerationRequest): Promise<GeneratedPassage> {
  const maxAttempts = 3;
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Build the prompt
      const prompt = buildPassagePrompt(request);
      
      // Call Claude API
      const response = await callClaudeAPIWithRetry(prompt);
      
      // Parse the response
      const parsedPassage = parseClaudeResponse(response);
      
      // Create passage object
      const passage: GeneratedPassage = {
        test_type: request.testType,
        year_level: getYearLevel(request.testType),
        section_name: request.sectionName,
        passage_type: request.passageType,
        title: parsedPassage.title || 'Untitled Passage',
        content: parsedPassage.content || '',
        word_count: parsedPassage.word_count || 0,
        australian_context: true,
        difficulty: request.difficulty,
        main_themes: parsedPassage.main_themes || [],
        key_characters: parsedPassage.key_characters || [],
        setting: parsedPassage.setting || '',
        potential_question_topics: parsedPassage.potential_question_topics || [],
        generation_metadata: {
          test_type: request.testType,
          section_name: request.sectionName,
          difficulty: request.difficulty,
          passage_type: request.passageType,
          target_word_count: request.wordCount,
          generation_timestamp: new Date().toISOString(),
          attempt_number: attempt
        }
      };
      
      // Validate the passage content
      const validation = validatePassageContent(passage, request);
      
      // Check passage diversity
      const diversityCheck = validatePassageDiversity(passage, request.generationContext, request.testMode);
      
      if (validation.isValid && diversityCheck.isValid) {
        return passage;
      } else {
        const allErrors = [...validation.errors];
        if (!diversityCheck.isValid) {
          allErrors.push(`Low diversity score: ${diversityCheck.diversityScore}`);
          allErrors.push(...diversityCheck.warnings);
        }
        
        console.warn(`Passage validation failed on attempt ${attempt}:`, allErrors);
        if (attempt === maxAttempts) {
          // If it's a diversity issue and we're on the last attempt, still return the passage with warnings
          if (validation.isValid && !diversityCheck.isValid && diversityCheck.diversityScore >= 50) {
            console.warn('Accepting passage with low diversity due to max attempts reached');
            return passage;
          }
          throw new Error(`Passage validation failed after ${maxAttempts} attempts: ${allErrors.join(', ')}`);
        }
      }
      
    } catch (error) {
      lastError = error as Error;
      console.error(`Passage generation attempt ${attempt} failed:`, error);
      
      if (attempt === maxAttempts) {
        break;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  throw new Error(`Failed to generate passage after ${maxAttempts} attempts. Last error: ${lastError?.message}`);
}

/**
 * Generates multiple passages for a test section with specific difficulties
 */
export async function generatePassagesWithDifficulties(
  testType: string,
  sectionName: string,
  difficulties: number[],
  generationContext: GenerationContext
): Promise<{ passages: GeneratedPassage[]; updatedContext: GenerationContext }> {
  const passages: GeneratedPassage[] = [];
  let currentContext = { ...generationContext };
  
  for (let i = 0; i < difficulties.length; i++) {
    try {
      // Create passage generation request with specific difficulty
      const request: PassageGenerationRequest = {
        testType,
        sectionName,
        testMode: 'practice_test', // Default for generatePassagesWithDifficulties
        wordCount: getPassageWordCount(testType, sectionName, 'practice_test'),
        difficulty: difficulties[i], // Use the specified difficulty
        passageType: determinePassageType(testType, sectionName, i, currentContext),
        generationContext: currentContext
      };
      
      // Generate the passage
      const passage = await generatePassage(request);
      passages.push(passage);
      
      // Update context with elements from this passage
      currentContext = updateContextFromPassage(currentContext, passage);
      
      // Update practice test diversity tracking
      currentContext = updatePracticeTestDiversity(currentContext, passage, 'practice_test');
      
      // Small delay between passages to avoid rate limiting
      if (i < difficulties.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
    } catch (error) {
      console.error(`Failed to generate passage ${i + 1}/${difficulties.length} with difficulty ${difficulties[i]}:`, error);
      throw error;
    }
  }
  
  return {
    passages,
    updatedContext: currentContext
  };
}

/**
 * Generates multiple passages for a test section
 */
export async function generatePassages(
  testType: string,
  sectionName: string,
  count: number,
  generationContext: GenerationContext
): Promise<{ passages: GeneratedPassage[]; updatedContext: GenerationContext }> {
  const passages: GeneratedPassage[] = [];
  let currentContext = { ...generationContext };
  
  for (let i = 0; i < count; i++) {
    try {
      // Create passage generation request
      const request: PassageGenerationRequest = {
        testType,
        sectionName,
        testMode: 'practice_test', // Default for generatePassages
        wordCount: getPassageWordCount(testType, sectionName, 'practice_test'),
        difficulty: selectPassageDifficulty(testType),
        passageType: determinePassageType(testType, sectionName, i, currentContext),
        generationContext: currentContext
      };
      
      // Generate the passage
      const passage = await generatePassage(request);
      passages.push(passage);
      
      // Update context with elements from this passage
      currentContext = updateContextFromPassage(currentContext, passage);
      
      // Update practice test diversity tracking
      currentContext = updatePracticeTestDiversity(currentContext, passage, 'practice_test');
      
      // Small delay between passages to avoid rate limiting
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
    } catch (error) {
      console.error(`Failed to generate passage ${i + 1}/${count}:`, error);
      throw error;
    }
  }
  
  return {
    passages,
    updatedContext: currentContext
  };
}

/**
 * Gets passage generation statistics for a test type
 */
export function getPassageRequirements(testType: string, sectionName: string): {
  requiresPassages: boolean;
  passageCount: number;
  wordsPerPassage: number;
  typicalTypes: PassageType[];
} {
  const testStructure = TEST_STRUCTURES[testType as keyof typeof TEST_STRUCTURES];
  const sectionStructure = testStructure?.[sectionName as keyof typeof testStructure];
  
  if (sectionStructure && typeof sectionStructure === 'object' && 'passages' in sectionStructure) {
    const passageCount = (sectionStructure as any).passages || 0;
    const wordsPerPassage = (sectionStructure as any).words_per_passage || 0;
    
    return {
      requiresPassages: passageCount > 0,
      passageCount,
      wordsPerPassage,
      typicalTypes: ['narrative', 'informational', 'persuasive']
    };
  }
  
  return {
    requiresPassages: false,
    passageCount: 0,
    wordsPerPassage: 0,
    typicalTypes: []
  };
}

/**
 * Estimates passage generation time
 */
export function estimatePassageGenerationTime(count: number): number {
  // Rough estimate: 30 seconds per passage including API calls and validation
  return count * 30;
}

/**
 * Creates a passage preview for validation
 */
export function createPassagePreview(passage: GeneratedPassage): string {
  const preview = passage.content.substring(0, 200);
  const ellipsis = passage.content.length > 200 ? '...' : '';
  
  return `**${passage.title}**\n\n${preview}${ellipsis}\n\n*${passage.word_count} words | ${passage.main_themes.join(', ')}*`;
}

/**
 * Gets passage complexity score
 */
export function getPassageComplexity(passage: GeneratedPassage): {
  score: number;
  factors: string[];
} {
  const factors: string[] = [];
  let score = 50; // Base score
  
  // Word count factor
  if (passage.word_count > 300) {
    score += 15;
    factors.push('Long passage');
  } else if (passage.word_count < 150) {
    score -= 10;
    factors.push('Short passage');
  }
  
  // Theme complexity
  if (passage.main_themes.length > 3) {
    score += 10;
    factors.push('Multiple themes');
  }
  
  // Character complexity
  if (passage.key_characters.length > 2) {
    score += 10;
    factors.push('Multiple characters');
  }
  
  // Vocabulary complexity (rough estimate)
  const complexWords = passage.content.split(' ').filter(word => word.length > 8).length;
  const complexWordRatio = complexWords / passage.word_count;
  
  if (complexWordRatio > 0.15) {
    score += 15;
    factors.push('Complex vocabulary');
  } else if (complexWordRatio < 0.05) {
    score -= 5;
    factors.push('Simple vocabulary');
  }
  
  // Sentence complexity (rough estimate)
  const sentences = passage.content.split(/[.!?]+/).length;
  const avgSentenceLength = passage.word_count / sentences;
  
  if (avgSentenceLength > 20) {
    score += 10;
    factors.push('Long sentences');
  } else if (avgSentenceLength < 10) {
    score -= 5;
    factors.push('Short sentences');
  }
  
  return {
    score: Math.max(0, Math.min(100, score)),
    factors
  };
}

/**
 * Gets diverse context themes to prevent similar passages
 */
function getDiverseContext(passageIndex: number): {
  setting: string;
  theme: string;
  characters: string;
} {
  const contexts = [
    { setting: 'rural/countryside environments', theme: 'environmental/wildlife conservation', characters: 'local communities/researchers' },
    { setting: 'urban/metropolitan areas', theme: 'technology/innovation', characters: 'diverse young people/professionals' },
    { setting: 'coastal/marine environments', theme: 'conservation/marine science', characters: 'scientists/activists' },
    { setting: 'educational institutions', theme: 'learning/discovery', characters: 'students/educators' },
    { setting: 'historical/cultural settings', theme: 'heritage/tradition', characters: 'historical figures/families' },
    { setting: 'sports/recreational venues', theme: 'achievement/teamwork', characters: 'athletes/coaches' },
    { setting: 'agricultural/farming areas', theme: 'sustainability/innovation', characters: 'farmers/scientists' },
    { setting: 'arts/entertainment venues', theme: 'creativity/expression', characters: 'artists/performers' },
    { setting: 'mountainous/wilderness areas', theme: 'adventure/exploration', characters: 'explorers/guides' },
    { setting: 'international/multicultural contexts', theme: 'global cooperation/understanding', characters: 'diverse international groups' },
    { setting: 'medical/healthcare facilities', theme: 'health/medical advancement', characters: 'doctors/patients/researchers' },
    { setting: 'space/astronomy contexts', theme: 'space exploration/discovery', characters: 'astronauts/scientists' }
  ];
  
  return contexts[passageIndex % contexts.length];
}

/**
 * Validates passage diversity against generation context to prevent repetition
 */
export function validatePassageDiversity(
  passage: GeneratedPassage, 
  context: GenerationContext, 
  testMode: string
): { isValid: boolean; warnings: string[]; diversityScore: number } {
  const warnings: string[] = [];
  let diversityScore = 100;
  
  // Check against recently generated passages
  if (context.generatedPassages && context.generatedPassages.length > 0) {
    const recentPassages = context.generatedPassages.slice(-5); // Check last 5 passages
    
    // Check theme repetition
    const recentThemes = recentPassages.flatMap(p => p.main_themes);
    const overlappingThemes = passage.main_themes.filter(theme => 
      recentThemes.some(recent => recent.toLowerCase().includes(theme.toLowerCase()))
    );
    
    if (overlappingThemes.length > 0) {
      warnings.push(`Theme repetition detected: ${overlappingThemes.join(', ')}`);
      diversityScore -= 15 * overlappingThemes.length;
    }
    
    // Check setting repetition
    const recentSettings = recentPassages.map(p => extractSettingInfo(p.setting));
    const currentSetting = extractSettingInfo(passage.setting);
    
    if (recentSettings.includes(currentSetting)) {
      warnings.push(`Setting repetition detected: ${currentSetting}`);
      diversityScore -= 20;
    }
    
    // Check character type repetition
    const recentCharacterTypes = recentPassages.flatMap(p => 
      p.key_characters.map(char => extractCharacterType(char))
    );
    const currentCharacterTypes = passage.key_characters.map(char => extractCharacterType(char));
    
    const overlappingCharacterTypes = currentCharacterTypes.filter(type => 
      recentCharacterTypes.includes(type)
    );
    
    if (overlappingCharacterTypes.length > 0) {
      warnings.push(`Character type repetition: ${overlappingCharacterTypes.join(', ')}`);
      diversityScore -= 10 * overlappingCharacterTypes.length;
    }
    
    // Check passage type repetition (only for practice tests)
    if (testMode.startsWith('practice_')) {
      const recentTypes = recentPassages.map(p => p.passage_type);
      if (recentTypes.filter(type => type === passage.passage_type).length >= 2) {
        warnings.push(`Passage type overuse: ${passage.passage_type}`);
        diversityScore -= 15;
      }
    }
  }
  
  // Enhanced diversity checking for practice tests
  if (testMode.startsWith('practice_') && context.practiceTestDiversity) {
    const practiceData = context.practiceTestDiversity[testMode];
    
    if (practiceData) {
      // Check for theme diversity across practice tests
      const themeOverlap = passage.main_themes.filter(theme => practiceData.themes.has(theme));
      if (themeOverlap.length > 0) {
        warnings.push(`Cross-practice theme repetition: ${themeOverlap.join(', ')}`);
        diversityScore -= 25 * themeOverlap.length;
      }
      
      // Check for setting diversity
      const settingInfo = extractSettingInfo(passage.setting);
      if (practiceData.settings.has(settingInfo)) {
        warnings.push(`Cross-practice setting repetition: ${settingInfo}`);
        diversityScore -= 30;
      }
      
      // Check for character diversity
      const characterOverlap = passage.key_characters.filter(char => practiceData.characters.has(char));
      if (characterOverlap.length > 0) {
        warnings.push(`Cross-practice character repetition: ${characterOverlap.join(', ')}`);
        diversityScore -= 20 * characterOverlap.length;
      }
    }
  }
  
  // Mini-passage diversity checking for drills
  if (testMode === 'drill' && context.miniPassageTopics) {
    const topicOverlap = passage.main_themes.filter(theme => context.miniPassageTopics?.has(theme));
    if (topicOverlap.length > 0) {
      warnings.push(`Mini-passage topic repetition: ${topicOverlap.join(', ')}`);
      diversityScore -= 15 * topicOverlap.length;
    }
  }
  
  return {
    isValid: diversityScore >= 70, // Pass if score is 70 or above
    warnings,
    diversityScore: Math.max(0, diversityScore)
  };
}

/**
 * Updates practice test diversity tracking
 */
export function updatePracticeTestDiversity(
  context: GenerationContext, 
  passage: GeneratedPassage, 
  testMode: string
): GenerationContext {
  const updated = { ...context };
  
  if (testMode.startsWith('practice_')) {
    if (!updated.practiceTestDiversity) {
      updated.practiceTestDiversity = {};
    }
    
    if (!updated.practiceTestDiversity[testMode]) {
      updated.practiceTestDiversity[testMode] = {
        themes: new Set(),
        settings: new Set(),
        characters: new Set(),
        textTypes: new Set(),
        topics: new Set(),
        culturalContexts: new Set()
      };
    }
    
    const practiceData = updated.practiceTestDiversity[testMode];
    
    // Track themes
    passage.main_themes.forEach(theme => practiceData.themes.add(theme));
    
    // Track settings
    const settingInfo = extractSettingInfo(passage.setting);
    practiceData.settings.add(settingInfo);
    
    // Track characters
    passage.key_characters.forEach(char => practiceData.characters.add(char));
    
    // Track text types
    practiceData.textTypes.add(passage.passage_type);
    
    // Track topics from potential question topics
    passage.potential_question_topics.forEach(topic => practiceData.topics.add(topic));
    
    // Extract cultural context (basic implementation)
    const content = passage.content.toLowerCase();
    if (content.includes('australia') || content.includes('sydney') || content.includes('melbourne')) {
      practiceData.culturalContexts.add('australian');
    } else {
      practiceData.culturalContexts.add('international');
    }
  }
  
  return updated;
} 