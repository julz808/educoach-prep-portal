import { TEST_STRUCTURES } from '@/data/curriculumData';

/**
 * Unified time lookup function that all components should use
 * This ensures consistent time limits across diagnostic cards, test instructions, and test taking
 */
export function getUnifiedTimeLimit(testType: string, sectionName: string): number {

  const testStructure = TEST_STRUCTURES[testType as keyof typeof TEST_STRUCTURES];

  if (!testStructure) {

    console.log(`🔥 UNIFIED TIME ERROR: Available test types:`, Object.keys(TEST_STRUCTURES));
    return 30; // Default fallback
  }

  console.log(`🔥 UNIFIED TIME: Available sections:`, Object.keys(testStructure));

  // Try exact match first
  const exactMatch = (testStructure as any)[sectionName];

  if (exactMatch && typeof exactMatch === 'object' && exactMatch.time) {

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
        console.log(`🔥 UNIFIED TIME SUCCESS: Partial match found (${key}): ${matchedSection.time} min`);
        return matchedSection.time;
      }
    }
  }

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
 */
export function getSectionQuestionCount(testType: string, sectionName: string): number {
  const testStructure = TEST_STRUCTURES[testType as keyof typeof TEST_STRUCTURES];

  if (!testStructure) {
    return 0;
  }

  // Try exact match first
  const exactMatch = (testStructure as any)[sectionName];
  if (exactMatch && typeof exactMatch === 'object' && exactMatch.questions) {
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
        return matchedSection.questions;
      }
    }
  }

  return 0;
}
