// ============================================================================
// QUESTION DISTRIBUTION LOGIC
// ============================================================================

import { SECTION_TO_SUB_SKILLS } from '../../data/curriculumData.ts';
import { getAvailableSubSkills } from './questionGeneration.ts';

/**
 * Distributes questions across sub-skills for a section
 */
export function distributeQuestions(
  testType: string,
  sectionName: string,
  totalQuestions: number
): Record<string, number> {
  const availableSubSkills = getAvailableSubSkills(testType, sectionName);
  const distribution: Record<string, number> = {};
  
  if (availableSubSkills.length === 0) {
    return distribution;
  }
  
  // Initialize all sub-skills with 0
  availableSubSkills.forEach(subSkill => {
    distribution[subSkill] = 0;
  });
  
  // Distribute questions as evenly as possible
  const baseQuestionsPerSubSkill = Math.floor(totalQuestions / availableSubSkills.length);
  const remainder = totalQuestions % availableSubSkills.length;
  
  // Give base amount to each sub-skill
  availableSubSkills.forEach(subSkill => {
    distribution[subSkill] = baseQuestionsPerSubSkill;
  });
  
  // Distribute remainder questions randomly
  for (let i = 0; i < remainder; i++) {
    const randomSubSkill = availableSubSkills[Math.floor(Math.random() * availableSubSkills.length)];
    distribution[randomSubSkill]++;
  }
  
  return distribution;
}

/**
 * Gets weighted distribution based on sub-skill importance
 */
export function getWeightedDistribution(
  testType: string,
  sectionName: string,
  totalQuestions: number
): Record<string, number> {
  const availableSubSkills = getAvailableSubSkills(testType, sectionName);
  const distribution: Record<string, number> = {};
  
  if (availableSubSkills.length === 0) {
    return distribution;
  }
  
  // Sub-skill weights (higher = more important)
  const weights: Record<string, number> = {
    // Reading comprehension skills (high priority)
    'Literal Comprehension': 3,
    'Inferential Reasoning': 4,
    'Critical Analysis & Evaluation': 3,
    'Vocabulary in Context': 3,
    
    // Mathematical skills (high priority)
    'Number Operations & Problem Solving': 4,
    'Algebraic Reasoning': 3,
    'Geometric & Spatial Reasoning': 3,
    'Data Interpretation': 3,
    
    // Writing skills (medium priority)
    'Narrative Writing': 2,
    'Persuasive Writing': 2,
    'Expository Writing': 2,
    
    // Language conventions (medium priority)
    'Grammar & Parts of Speech': 2,
    'Spelling Patterns & Orthographic Knowledge': 2,
    'Punctuation Usage & Application': 2
  };
  
  // Calculate total weight
  let totalWeight = 0;
  availableSubSkills.forEach(subSkill => {
    const weight = weights[subSkill] || 1; // Default weight is 1
    totalWeight += weight;
  });
  
  // Distribute questions based on weights
  availableSubSkills.forEach(subSkill => {
    const weight = weights[subSkill] || 1;
    const proportion = weight / totalWeight;
    distribution[subSkill] = Math.round(totalQuestions * proportion);
  });
  
  // Adjust for rounding errors
  const allocatedQuestions = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  const difference = totalQuestions - allocatedQuestions;
  
  if (difference !== 0) {
    // Find sub-skill with highest weight to adjust
    const highestWeightSubSkill = availableSubSkills.reduce((max, subSkill) => {
      return (weights[subSkill] || 1) > (weights[max] || 1) ? subSkill : max;
    });
    
    distribution[highestWeightSubSkill] += difference;
  }
  
  return distribution;
}

/**
 * Validates distribution totals
 */
export function validateDistribution(
  distribution: Record<string, number>,
  expectedTotal: number
): { isValid: boolean; actualTotal: number; errors: string[] } {
  const actualTotal = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  const errors: string[] = [];
  
  if (actualTotal !== expectedTotal) {
    errors.push(`Distribution total ${actualTotal} does not match expected ${expectedTotal}`);
  }
  
  // Check for negative values
  Object.entries(distribution).forEach(([subSkill, count]) => {
    if (count < 0) {
      errors.push(`Negative question count for sub-skill: ${subSkill}`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    actualTotal,
    errors
  };
} 