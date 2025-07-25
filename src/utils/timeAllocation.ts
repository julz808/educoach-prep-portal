// ============================================================================
// TIME ALLOCATION UTILITY
// ============================================================================
// Handles time allocation logic for different test modes across all products

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
 * @param diagnosticQuestionCount - Number of questions in diagnostic (for pro-rating)
 * @returns TimeAllocationResult with time in minutes and reasoning
 */
export function calculateTimeAllocation(
  productType: string,
  sectionName: string,
  testMode: string,
  diagnosticQuestionCount?: number
): TimeAllocationResult {
  console.log('⏰ TIME CALC: Product:', productType, 'Section:', sectionName, 'Mode:', testMode);
  
  // DRILL MODE: No timer
  if (testMode === 'drill') {
    console.log('⏰ DRILL: No timer for drill mode');
    return {
      timeMinutes: null,
      reason: 'Drill mode has no time limit - immediate answer feedback'
    };
  }
  
  // Get test structure
  const testStructure = TEST_STRUCTURES[productType as keyof typeof TEST_STRUCTURES];
  if (!testStructure) {
    console.log('⏰ ERROR: No test structure found for product:', productType);
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
    console.log('⏰ ERROR: No valid section data found for:', sectionName);
    return {
      timeMinutes: 30,
      reason: 'Default fallback - section not found'
    };
  }
  
  const practiceTimeMinutes = sectionData.time;
  const practiceQuestionCount = sectionData.questions;
  
  console.log('⏰ FOUND: Section:', matchedSectionName, 'Practice time:', practiceTimeMinutes, 'min, Questions:', practiceQuestionCount);
  
  // PRACTICE MODE: Use curriculum data as-is
  if (testMode.startsWith('practice')) {
    console.log('⏰ PRACTICE: Using curriculum time:', practiceTimeMinutes, 'minutes');
    return {
      timeMinutes: practiceTimeMinutes,
      reason: `Practice test time from curriculum data`
    };
  }
  
  // DIAGNOSTIC MODE: Pro-rate from practice test time
  if (testMode === 'diagnostic') {
    if (!diagnosticQuestionCount) {
      console.log('⏰ DIAGNOSTIC: No question count provided, using 80% of practice time');
      const diagnosticTime = Math.ceil(practiceTimeMinutes * 0.8);
      const roundedTime = Math.ceil(diagnosticTime / 5) * 5; // Round up to nearest 5
      
      return {
        timeMinutes: roundedTime,
        reason: `Diagnostic time (80% of practice, rounded up to nearest 5 min)`
      };
    }
    
    // Calculate pro-rated time: (diagnostic_questions / practice_questions) * practice_time
    const timePerQuestion = practiceTimeMinutes / practiceQuestionCount;
    const proratedTime = timePerQuestion * diagnosticQuestionCount;
    const roundedTime = Math.ceil(proratedTime / 5) * 5; // Round up to nearest 5 minutes
    
    console.log('⏰ DIAGNOSTIC: Pro-rated calculation:');
    console.log('  - Time per question:', timePerQuestion.toFixed(2), 'min');
    console.log('  - Raw pro-rated time:', proratedTime.toFixed(2), 'min');
    console.log('  - Rounded up to nearest 5:', roundedTime, 'min');
    
    return {
      timeMinutes: roundedTime,
      reason: `Diagnostic time pro-rated from practice (${diagnosticQuestionCount}/${practiceQuestionCount} × ${practiceTimeMinutes}min = ${proratedTime.toFixed(1)}min → ${roundedTime}min)`
    };
  }
  
  // Fallback for unknown test modes
  console.log('⏰ UNKNOWN: Unknown test mode:', testMode, 'using practice time');
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