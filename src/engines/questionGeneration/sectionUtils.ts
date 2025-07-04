// ============================================================================
// SECTION UTILITY FUNCTIONS
// ============================================================================
// Helper functions to determine section types and apply appropriate generation rules

/**
 * Determines if a section is a writing/written expression section
 */
export function isWritingSection(sectionName: string): boolean {
  const writingSections = [
    'Writing',
    'Written Expression'
  ];
  
  return writingSections.some(section => 
    sectionName.toLowerCase().includes(section.toLowerCase())
  );
}

/**
 * Determines if a section requires reading passages
 */
export function isReadingSection(sectionName: string): boolean {
  const readingSections = [
    'Reading',
    'Reading Reasoning', 
    'Reading Comprehension',
    'Humanities' // ACER Humanities is treated as reading comprehension
  ];
  
  return readingSections.some(section => 
    sectionName.toLowerCase().includes(section.toLowerCase())
  );
}

/**
 * Determines if a section is mathematics/numerical/quantitative
 */
export function isMathSection(sectionName: string): boolean {
  const mathSections = [
    'Mathematics',
    'Mathematical',
    'Numerical',
    'Numeracy',
    'Quantitative'
  ];
  
  return mathSections.some(section => 
    sectionName.toLowerCase().includes(section.toLowerCase())
  );
}

/**
 * Determines if a section is verbal reasoning/language conventions
 */
export function isLanguageSection(sectionName: string): boolean {
  const languageSections = [
    'Language Conventions',
    'Verbal Reasoning',
    'General Ability - Verbal',
    'Thinking Skills'
  ];
  
  return languageSections.some(section => 
    sectionName.toLowerCase().includes(section.toLowerCase())
  );
}

/**
 * Gets the appropriate drill question count per sub-skill based on section type
 */
export function getDrillQuestionsPerSubSkill(sectionName: string): number {
  if (isWritingSection(sectionName)) {
    return 6; // 2 Easy + 2 Medium + 2 Hard
  }
  return 30; // 10 Easy + 10 Medium + 10 Hard
}

/**
 * Gets the drill questions per difficulty level based on section type
 */
export function getDrillQuestionsPerDifficulty(sectionName: string): number {
  if (isWritingSection(sectionName)) {
    return 2; // 2 questions per difficulty level
  }
  return 10; // 10 questions per difficulty level
}

/**
 * Determines if a section requires passages for the given test mode
 */
export function requiresPassages(sectionName: string, testMode: string): boolean {
  // Writing sections never require passages
  if (isWritingSection(sectionName)) {
    return false;
  }
  
  // Reading sections always require passages
  if (isReadingSection(sectionName)) {
    return true;
  }
  
  // Math and language sections don't require passages
  return false;
}

/**
 * Determines the passage type for drill questions vs practice/diagnostic
 */
export function getPassageType(testMode: string): 'full-passage' | 'mini-passage' {
  if (testMode === 'drill') {
    return 'mini-passage';
  }
  return 'full-passage';
}

/**
 * Gets appropriate word count for passages based on section and test mode
 */
export function getPassageWordCount(sectionName: string, testMode: string, baseWordCount: number): number {
  if (testMode === 'drill' && isReadingSection(sectionName)) {
    // Mini-passages for drill questions
    return Math.min(150, Math.max(50, Math.floor(baseWordCount * 0.3)));
  }
  
  // Full passages for diagnostic and practice tests
  return baseWordCount;
}

/**
 * Determines if questions should be shared across a passage or individual
 */
export function getQuestionsPerPassage(testMode: string): number {
  if (testMode === 'drill') {
    return 1; // 1 question per mini-passage for drills
  }
  
  // Multiple questions per passage for diagnostic and practice tests
  return 5; // This will be overridden by actual calculation based on total questions/passages
}

/**
 * Gets section-specific response type
 */
export function getSectionResponseType(sectionName: string): 'multiple_choice' | 'extended_response' {
  if (isWritingSection(sectionName)) {
    return 'extended_response';
  }
  return 'multiple_choice';
}

/**
 * Determines if Australian context should be included (not mandatory)
 * Note: UK/Australian spelling is always enforced regardless of this function
 */
export function preferAustralianContext(sectionName: string, testType: string): boolean {
  // NAPLAN tests benefit from some Australian context but it's not mandatory
  if (testType.includes('NAPLAN')) {
    return true; // Prefer but don't require
  }
  
  // Some mathematics word problems may benefit from Australian context
  if (isMathSection(sectionName)) {
    return true; // Prefer but don't require
  }
  
  // All other sections can use international content freely
  return false;
}

/**
 * @deprecated Use preferAustralianContext instead
 * Determines if Australian context is mandatory for the section
 */
export function requiresAustralianContext(sectionName: string, testType: string): boolean {
  // No sections require mandatory Australian context anymore
  // Only UK/Australian spelling is mandatory
  return false;
}

/**
 * Gets the section category for diversity tracking
 */
export function getSectionCategory(sectionName: string): 'reading' | 'writing' | 'mathematics' | 'language' | 'reasoning' {
  if (isReadingSection(sectionName)) {
    return 'reading';
  }
  if (isWritingSection(sectionName)) {
    return 'writing';
  }
  if (isMathSection(sectionName)) {
    return 'mathematics';
  }
  if (isLanguageSection(sectionName)) {
    return 'language';
  }
  return 'reasoning';
}

/**
 * Gets special handling requirements for specific sections
 */
export function getSpecialRequirements(productType: string, sectionName: string): {
  isSpecialCase: boolean;
  requirements: string[];
} {
  const requirements: string[] = [];
  let isSpecialCase = false;
  
  // ACER Humanities special case
  if (productType.includes('ACER') && sectionName === 'Humanities') {
    isSpecialCase = true;
    requirements.push('Treat as reading comprehension section');
    requirements.push('Require passages for all test modes');
    requirements.push('Focus on historical and cultural content');
  }
  
  // Writing sections special case
  if (isWritingSection(sectionName)) {
    isSpecialCase = true;
    requirements.push('Only 6 drill questions per sub-skill');
    requirements.push('Extended response format');
    requirements.push('No passages required');
    requirements.push('Diverse writing prompts required');
  }
  
  // Reading sections for drills
  if (isReadingSection(sectionName)) {
    isSpecialCase = true;
    requirements.push('Mini-passages for drill questions (1:1 ratio)');
    requirements.push('Full passages for diagnostic and practice tests');
    requirements.push('High diversity across practice tests');
  }
  
  return { isSpecialCase, requirements };
}