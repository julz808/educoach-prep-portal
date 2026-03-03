import { TEST_STRUCTURES } from '@/data/curriculumData';
import { getSectionConfig } from '@/data/curriculumData_v2/sectionConfigurations';

/**
 * Unified time lookup function that all components should use
 * This ensures consistent time limits across diagnostic cards, test instructions, and test taking
 *
 * SOURCE OF TRUTH: sectionConfigurations.ts (V2)
 * Falls back to curriculumData.ts (V1) for backward compatibility
 */
export function getUnifiedTimeLimit(testType: string, sectionName: string): number {
  // PRIORITY 1: Try V2 sectionConfigurations (SOURCE OF TRUTH)
  const sectionConfig = getSectionConfig(testType, sectionName);

  if (sectionConfig && sectionConfig.time_limit_minutes) {
    console.log(`✅ TIME (V2): ${testType} - ${sectionName} = ${sectionConfig.time_limit_minutes} min`);
    return sectionConfig.time_limit_minutes;
  }

  // PRIORITY 2: Fall back to V1 curriculumData for backward compatibility
  console.log(`⚠️  TIME FALLBACK: Using V1 curriculumData for ${testType} - ${sectionName}`);
  const testStructure = TEST_STRUCTURES[testType as keyof typeof TEST_STRUCTURES];

  if (!testStructure) {
    console.log(`❌ UNIFIED TIME ERROR: Test type not found in V1 or V2. Available test types:`, Object.keys(TEST_STRUCTURES));
    return 30; // Default fallback
  }

  console.log(`🔍 UNIFIED TIME: Searching V1 sections:`, Object.keys(testStructure));

  // Try exact match first
  const exactMatch = (testStructure as any)[sectionName];

  if (exactMatch && typeof exactMatch === 'object' && exactMatch.time) {
    console.log(`✅ TIME (V1 exact): ${sectionName} = ${exactMatch.time} min`);
    return exactMatch.time;
  }

  // Try partial match (case-insensitive)
  const sectionKeys = Object.keys(testStructure);
  const sectionLower = sectionName.toLowerCase();

  for (const key of sectionKeys) {
    const keyLower = key.toLowerCase();

    if (keyLower === sectionLower ||
        keyLower.includes(sectionLower) ||
        sectionLower.includes(keyLower)) {
      const matchedSection = (testStructure as any)[key];

      if (matchedSection && typeof matchedSection === 'object' && matchedSection.time) {
        console.log(`✅ TIME (V1 partial): Matched ${key} = ${matchedSection.time} min`);
        return matchedSection.time;
      }
    }
  }

  console.log(`❌ TIME ERROR: No match found for ${testType} - ${sectionName}`);
  return 30; // Default fallback
}

/**
 * Get section format from curriculum data
 */
export function getSectionFormat(testType: string, sectionName: string): 'Multiple Choice' | 'Written Response' {
  const testStructure = TEST_STRUCTURES[testType as keyof typeof TEST_STRUCTURES];

  if (!testStructure) {
    return 'Multiple Choice';
  }

  // Try exact match first
  const exactMatch = (testStructure as any)[sectionName];
  if (exactMatch && typeof exactMatch === 'object' && exactMatch.format) {
    return exactMatch.format;
  }

  // Try partial match
  const sectionKeys = Object.keys(testStructure);
  const sectionLower = sectionName.toLowerCase();

  for (const key of sectionKeys) {
    const keyLower = key.toLowerCase();
    if (keyLower === sectionLower || 
        keyLower.includes(sectionLower) || 
        sectionLower.includes(keyLower)) {
      const matchedSection = (testStructure as any)[key];
      if (matchedSection && typeof matchedSection === 'object' && matchedSection.format) {
        return matchedSection.format;
      }
    }
  }

  return 'Multiple Choice';
}

/**
 * Get section question count from curriculum data
 * SOURCE OF TRUTH: sectionConfigurations.ts (V2)
 * Falls back to curriculumData.ts (V1) for backward compatibility
 */
export function getSectionQuestionCount(testType: string, sectionName: string): number {
  // PRIORITY 1: Try V2 sectionConfigurations (SOURCE OF TRUTH)
  const sectionConfig = getSectionConfig(testType, sectionName);

  if (sectionConfig && sectionConfig.total_questions) {
    console.log(`✅ QUESTION COUNT (V2): ${testType} - ${sectionName} = ${sectionConfig.total_questions} questions`);
    return sectionConfig.total_questions;
  }

  // PRIORITY 2: Fall back to V1 curriculumData for backward compatibility
  console.log(`⚠️  QUESTION COUNT FALLBACK: Using V1 curriculumData for ${testType} - ${sectionName}`);
  const testStructure = TEST_STRUCTURES[testType as keyof typeof TEST_STRUCTURES];

  if (!testStructure) {
    return 0;
  }

  // Try exact match first
  const exactMatch = (testStructure as any)[sectionName];
  if (exactMatch && typeof exactMatch === 'object' && exactMatch.questions) {
    console.log(`✅ QUESTION COUNT (V1 exact): ${sectionName} = ${exactMatch.questions} questions`);
    return exactMatch.questions;
  }

  // Try partial match
  const sectionKeys = Object.keys(testStructure);
  const sectionLower = sectionName.toLowerCase();

  for (const key of sectionKeys) {
    const keyLower = key.toLowerCase();
    if (keyLower === sectionLower ||
        keyLower.includes(sectionLower) ||
        sectionLower.includes(keyLower)) {
      const matchedSection = (testStructure as any)[key];
      if (matchedSection && typeof matchedSection === 'object' && matchedSection.questions) {
        console.log(`✅ QUESTION COUNT (V1 partial): Matched ${key} = ${matchedSection.questions} questions`);
        return matchedSection.questions;
      }
    }
  }

  console.log(`❌ QUESTION COUNT ERROR: No match found for ${testType} - ${sectionName}`);
  return 0;
}
