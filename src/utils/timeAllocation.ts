// ============================================================================
// TIME ALLOCATION UTILITY
// ============================================================================
// Handles time allocation logic for different test modes across all products
// 
// Time allocation rules:
// - Practice tests: Use full time from curriculum data
// - Diagnostic tests: Use same time as practice tests (no pro-rating)
// - Drill mode: No time limit (immediate feedback)

import { TEST_STRUCTURES } from '@/data/curriculumData';

export interface TimeAllocationResult {
  timeMinutes: number | null; // null means no timer
  reason: string;
}

/**
 * Calculate time allocation for a test section based on test mode
 * 
 * @param productType - The test product (e.g., "Year 5 NAPLAN")
 * @param sectionName - The section name (e.g., "Reading")
 * @param testMode - The test mode ("practice", "diagnostic", "drill", or specific like "practice_1")
 * @param diagnosticQuestionCount - Number of questions in diagnostic (unused - kept for compatibility)
 * @returns TimeAllocationResult with time in minutes and reasoning
 */
export function calculateTimeAllocation(
  productType: string,
  sectionName: string,
  testMode: string,
  diagnosticQuestionCount?: number
): TimeAllocationResult {

  // DRILL MODE: No timer
  if (testMode === 'drill') {

    return {
      timeMinutes: null,
      reason: 'Drill mode has no time limit - immediate answer feedback'
    };
  }

  // Get test structure
  const testStructure = TEST_STRUCTURES[productType as keyof typeof TEST_STRUCTURES];
  if (!testStructure) {

    return {
      timeMinutes: 30,
      reason: 'Default fallback - product not found'
    };
  }

  // Find section data with flexible matching
  let sectionData: any = null;
  let matchedSectionName = '';

  // Try exact match first
  sectionData = (testStructure as any)[sectionName];
  if (sectionData) {
    matchedSectionName = sectionName;
  } else {
    // Try case-insensitive and partial matches
    const availableSections = Object.keys(testStructure);
    const sectionLower = sectionName.toLowerCase();

    for (const key of availableSections) {
      const keyLower = key.toLowerCase();
      if (keyLower === sectionLower || 
          keyLower.includes(sectionLower) || 
          sectionLower.includes(keyLower)) {
        sectionData = (testStructure as any)[key];
        matchedSectionName = key;
        break;
      }
    }
  }

  if (!sectionData || typeof sectionData.time !== 'number' || typeof sectionData.questions !== 'number') {

    return {
      timeMinutes: 30,
      reason: 'Default fallback - section not found'
    };
  }

  const practiceTimeMinutes = sectionData.time;
  const practiceQuestionCount = sectionData.questions;

  // PRACTICE MODE: Use curriculum data as-is
  if (testMode.startsWith('practice')) {

    return {
      timeMinutes: practiceTimeMinutes,
      reason: `Practice test time from curriculum data`
    };
  }

  // DIAGNOSTIC MODE: Use same time as practice test (no pro-rating)
  if (testMode === 'diagnostic') {

    return {
      timeMinutes: practiceTimeMinutes,
      reason: `Diagnostic test time matches practice test time from curriculum data`
    };
  }

  // Fallback for unknown test modes

  return {
    timeMinutes: practiceTimeMinutes,
    reason: `Unknown test mode - using practice time as fallback`
  };
}

/**
 * Determines if a test mode should show immediate answer feedback
 * 
 * @param testMode - The test mode
 * @returns true if answers should be revealed immediately after each question
 */
export function shouldShowImmediateAnswerFeedback(testMode: string): boolean {
  return testMode === 'drill';
}

/**
 * Determines if a test mode should have a timer
 * 
 * @param testMode - The test mode  
 * @returns true if the test should have a countdown timer
 */
export function shouldHaveTimer(testMode: string): boolean {
  return testMode !== 'drill';
}
