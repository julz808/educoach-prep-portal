/**
 * CURRICULUM-BASED GAP ANALYSIS SYSTEM - FIXED WITH QUOTA LIMITS
 * 
 * This module analyzes what questions and passages are missing based on curriculum requirements
 * with PROPER quota distribution to prevent over-generation
 * 
 * CRITICAL: Previous version was generating 10x+ excess questions!
 */

import { supabase } from '../../integrations/supabase/client';
import { getTestSectionConfig, generateQuestionPlan } from './curriculumBasedConfiguration';
import { SECTION_TO_SUB_SKILLS, TEST_STRUCTURES } from '../../data/curriculumData';

// PROPER QUOTA DISTRIBUTION TO PREVENT OVER-GENERATION
// Based on curriculum requirements: Academic sections = 30 per sub-skill, Writing sections = 6 per sub-skill
const QUOTA_DISTRIBUTION = {
  'VIC Selective Entry (Year 9 Entry)': {
    'Reading Reasoning': {
      practice_1: 50, practice_2: 50, practice_3: 50, practice_4: 50, practice_5: 50,
      diagnostic: 50, drill: 240
    },
    'Mathematics Reasoning': {
      practice_1: 60, practice_2: 60, practice_3: 60, practice_4: 60, practice_5: 60,
      diagnostic: 60, drill: 180
    },
    'General Ability - Verbal': {
      practice_1: 60, practice_2: 60, practice_3: 60, practice_4: 60, practice_5: 60,
      diagnostic: 60, drill: 150
    },
    'General Ability - Quantitative': {
      practice_1: 50, practice_2: 50, practice_3: 50, practice_4: 50, practice_5: 50,
      diagnostic: 50, drill: 150
    },
    'Writing': {
      practice_1: 2, practice_2: 2, practice_3: 2, practice_4: 2, practice_5: 2,
      diagnostic: 2, drill: 12
    }
  },
  'NSW Selective Entry (Year 7 Entry)': {
    'Reading': {
      practice_1: 30, practice_2: 30, practice_3: 30, practice_4: 30, practice_5: 30,
      diagnostic: 30, drill: 240
    },
    'Mathematical Reasoning': {
      practice_1: 35, practice_2: 35, practice_3: 35, practice_4: 35, practice_5: 35,
      diagnostic: 35, drill: 210
    },
    'Thinking Skills': {
      practice_1: 40, practice_2: 40, practice_3: 40, practice_4: 40, practice_5: 40,
      diagnostic: 40, drill: 240
    },
    'Writing': {
      practice_1: 1, practice_2: 1, practice_3: 1, practice_4: 1, practice_5: 1,
      diagnostic: 1, drill: 24
    }
  },
  'Year 5 NAPLAN': {
    'Reading': {
      practice_1: 40, practice_2: 40, practice_3: 40, practice_4: 40, practice_5: 40,
      diagnostic: 40, drill: 210
    },
    'Language Conventions': {
      practice_1: 40, practice_2: 40, practice_3: 40, practice_4: 40, practice_5: 40,
      diagnostic: 40, drill: 180
    },
    'Numeracy No Calculator': {
      practice_1: 25, practice_2: 25, practice_3: 25, practice_4: 25, practice_5: 25,
      diagnostic: 25, drill: 210
    },
    'Numeracy Calculator': {
      practice_1: 25, practice_2: 25, practice_3: 25, practice_4: 25, practice_5: 25,
      diagnostic: 25, drill: 210
    },
    'Writing': {
      practice_1: 1, practice_2: 1, practice_3: 1, practice_4: 1, practice_5: 1,
      diagnostic: 1, drill: 12
    }
  },
  'Year 7 NAPLAN': {
    'Reading': {
      practice_1: 50, practice_2: 50, practice_3: 50, practice_4: 50, practice_5: 50,
      diagnostic: 50, drill: 240
    },
    'Language Conventions': {
      practice_1: 45, practice_2: 45, practice_3: 45, practice_4: 45, practice_5: 45,
      diagnostic: 45, drill: 180
    },
    'Numeracy No Calculator': {
      practice_1: 30, practice_2: 30, practice_3: 30, practice_4: 30, practice_5: 30,
      diagnostic: 30, drill: 240
    },
    'Numeracy Calculator': {
      practice_1: 35, practice_2: 35, practice_3: 35, practice_4: 35, practice_5: 35,
      diagnostic: 35, drill: 240
    },
    'Writing': {
      practice_1: 1, practice_2: 1, practice_3: 1, practice_4: 1, practice_5: 1,
      diagnostic: 1, drill: 12
    }
  },
  'EduTest Scholarship (Year 7 Entry)': {
    'Reading Comprehension': {
      practice_1: 50, practice_2: 50, practice_3: 50, practice_4: 50, practice_5: 50,
      diagnostic: 50, drill: 210
    },
    'Verbal Reasoning': {
      practice_1: 60, practice_2: 60, practice_3: 60, practice_4: 60, practice_5: 60,
      diagnostic: 60, drill: 240
    },
    'Numerical Reasoning': {
      practice_1: 50, practice_2: 50, practice_3: 50, practice_4: 50, practice_5: 50,
      diagnostic: 50, drill: 240
    },
    'Mathematics': {
      practice_1: 60, practice_2: 60, practice_3: 60, practice_4: 60, practice_5: 60,
      diagnostic: 60, drill: 240
    },
    'Written Expression': {
      practice_1: 2, practice_2: 2, practice_3: 2, practice_4: 2, practice_5: 2,
      diagnostic: 2, drill: 30
    }
  },
  'ACER Scholarship (Year 7 Entry)': {
    'Mathematics': {
      practice_1: 35, practice_2: 35, practice_3: 35, practice_4: 35, practice_5: 35,
      diagnostic: 35, drill: 210
    },
    'Humanities': {
      practice_1: 35, practice_2: 35, practice_3: 35, practice_4: 35, practice_5: 35,
      diagnostic: 35, drill: 210
    },
    'Written Expression': {
      practice_1: 1, practice_2: 1, practice_3: 1, practice_4: 1, practice_5: 1,
      diagnostic: 1, drill: 24
    }
  }
};

/**
 * Get proper quota for a specific test mode and section
 */
function getQuotaForTestMode(testType: string, sectionName: string, testMode: string): number {
  const testQuotas = QUOTA_DISTRIBUTION[testType as keyof typeof QUOTA_DISTRIBUTION];
  if (!testQuotas) {
    throw new Error(`No quota distribution defined for test type: ${testType}`);
  }
  
  const sectionQuotas = testQuotas[sectionName as keyof typeof testQuotas];
  if (!sectionQuotas) {
    throw new Error(`No quota distribution defined for section: ${sectionName} in ${testType}`);
  }
  
  const quota = sectionQuotas[testMode as keyof typeof sectionQuotas];
  if (quota === undefined) {
    throw new Error(`No quota defined for test mode: ${testMode} in ${sectionName}`);
  }
  
  return quota;
}

export interface GapAnalysisResult {
  testType: string;
  sectionName: string;
  totalGaps: number;
  
  passageGaps: PassageGap[];
  questionGaps: QuestionGap[];
  
  summary: {
    passagesNeeded: number;
    questionsNeeded: number;
    gapsByTestMode: Record<string, number>;
    gapsByDifficulty: Record<string, number>;
    gapsBySubSkill: Record<string, number>;
  };
}

export interface PassageGap {
  passageId?: string; // Optional - will be generated during actual passage creation
  testMode: 'practice_1' | 'practice_2' | 'practice_3' | 'practice_4' | 'practice_5' | 'diagnostic' | 'drill';
  difficulty: 1 | 2 | 3;
  wordCount: number;
  questionsExpected: number;
  questionsActual: number;
  isSharedPassage: boolean;
  passageIndex: number; // Track which passage this is for the test mode
}

export interface QuestionGap {
  testMode: 'practice_1' | 'practice_2' | 'practice_3' | 'practice_4' | 'practice_5' | 'diagnostic' | 'drill';
  subSkill: string;
  difficulty: 1 | 2 | 3;
  questionsNeeded: number;
  passageId?: string;
  needsPassage: boolean;
}

/**
 * Perform comprehensive gap analysis for a test section - FIXED WITH QUOTAS
 */
export async function performGapAnalysis(
  testType: string,
  sectionName: string
): Promise<GapAnalysisResult> {
  console.log(`🔍 QUOTA-AWARE GAP ANALYSIS: ${sectionName}`);
  
  const sectionKey = `${testType} - ${sectionName}`;
  const subSkills = SECTION_TO_SUB_SKILLS[sectionKey] || [];
  
  const passageGaps: PassageGap[] = [];
  const questionGaps: QuestionGap[] = [];
  
  // Check quota distribution is available
  if (!QUOTA_DISTRIBUTION[testType as keyof typeof QUOTA_DISTRIBUTION]) {
    throw new Error(`❌ No quota distribution defined for: ${testType}`);
  }
  
  // Analyze each test mode with PROPER QUOTAS
  const testModes = ['practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5', 'diagnostic', 'drill'] as const;
  
  for (const testMode of testModes) {
    const quota = getQuotaForTestMode(testType, sectionName, testMode);
    
    // Skip if quota is 0
    if (quota === 0) {
      console.log(`   ⏭️  Skipping ${testMode}: Quota is 0`);
      continue;
    }
    
    const modeGaps = await analyzeTestModeGapsWithQuota(testType, sectionName, testMode, subSkills, quota);
    passageGaps.push(...modeGaps.passageGaps);
    questionGaps.push(...modeGaps.questionGaps);
  }
  
  // Calculate summary statistics
  const summary = {
    passagesNeeded: passageGaps.length,
    questionsNeeded: questionGaps.reduce((sum, gap) => sum + gap.questionsNeeded, 0),
    gapsByTestMode: {} as Record<string, number>,
    gapsByDifficulty: {} as Record<string, number>,
    gapsBySubSkill: {} as Record<string, number>
  };
  
  // Calculate gaps by test mode
  questionGaps.forEach(gap => {
    summary.gapsByTestMode[gap.testMode] = (summary.gapsByTestMode[gap.testMode] || 0) + gap.questionsNeeded;
  });
  
  // Calculate gaps by difficulty
  questionGaps.forEach(gap => {
    const difficultyKey = `difficulty_${gap.difficulty}`;
    summary.gapsByDifficulty[difficultyKey] = (summary.gapsByDifficulty[difficultyKey] || 0) + gap.questionsNeeded;
  });
  
  // Calculate gaps by sub-skill
  questionGaps.forEach(gap => {
    summary.gapsBySubSkill[gap.subSkill] = (summary.gapsBySubSkill[gap.subSkill] || 0) + gap.questionsNeeded;
  });
  
  return {
    testType,
    sectionName,
    totalGaps: summary.questionsNeeded,
    passageGaps,
    questionGaps,
    summary
  };
}

/**
 * Analyze gaps for a specific test mode - FIXED WITH QUOTA LIMITS
 */
async function analyzeTestModeGapsWithQuota(
  testType: string,
  sectionName: string,
  testMode: 'practice_1' | 'practice_2' | 'practice_3' | 'practice_4' | 'practice_5' | 'diagnostic' | 'drill',
  subSkills: string[],
  quota: number
): Promise<{ passageGaps: PassageGap[]; questionGaps: QuestionGap[] }> {
  const passageGaps: PassageGap[] = [];
  const questionGaps: QuestionGap[] = [];
  
  // Get existing questions for this specific test mode
  const existingQuestions = await getExistingQuestions(testType, sectionName, testMode);
  const currentCount = existingQuestions.length;
  
  console.log(`   ${testMode}: ${currentCount}/${quota} questions`);
  
  // Check if we're already at or over quota
  if (currentCount >= quota) {
    console.log(`   ⏭️  Skipping ${testMode}: Already at/over quota (${currentCount}/${quota})`);
    return { passageGaps, questionGaps };
  }
  
  const questionsNeeded = quota - currentCount;
  console.log(`   📝 Need ${questionsNeeded} questions for ${testMode}`);
  
  // For sections that require passages, calculate passage needs
  // NEW: ALL reading passages are now stored in the passages table (including drills)
  const config = getTestSectionConfig(testType, sectionName);
  if (config.requiresPassages) {
    if (testMode === 'drill') {
      // DRILLS: 1:1 ratio with mini-passages, distributed across difficulties
      // Questions per difficulty level varies by section type (1 for writing, 10 for others)
      const questionsPerDifficulty = config.drillTestConfig.questionsPerDifficulty;
      
      for (let difficulty = 1; difficulty <= 3; difficulty++) {
        for (let i = 0; i < questionsPerDifficulty; i++) {
          passageGaps.push({
            testMode,
            difficulty: difficulty as 1 | 2 | 3,
            wordCount: 120, // Mini-passage word count for drills
            questionsExpected: 1, // 1:1 ratio for drills
            questionsActual: 0,
            isSharedPassage: false,
            passageIndex: (difficulty - 1) * questionsPerDifficulty + i + 1
          });
        }
      }
    } else {
      // PRACTICE/DIAGNOSTIC: Multiple questions per passage
      const questionsPerPassage = config.questionsPerPassage;
      const passagesNeeded = Math.ceil(questionsNeeded / questionsPerPassage);
      
      // Generate passage gaps without pre-generating IDs
      for (let i = 0; i < passagesNeeded; i++) {
        const difficulty = ((i % 3) + 1) as 1 | 2 | 3; // Distribute across difficulties
        
        passageGaps.push({
          testMode,
          difficulty,
          wordCount: config.wordsPerPassage,
          questionsExpected: Math.min(questionsPerPassage, questionsNeeded - (i * questionsPerPassage)),
          questionsActual: 0,
          isSharedPassage: true,
          passageIndex: i + 1
        });
      }
    }
  }
  
  // Generate question gaps distributed across sub-skills
  if (testMode === 'drill') {
    // For drills: Check existing questions by sub-skill and difficulty before creating gaps
    for (const subSkill of subSkills) {
      for (let difficulty = 1; difficulty <= 3; difficulty++) {
        // Check how many questions already exist for this sub-skill + difficulty
        const existingCount = existingQuestions.filter(q => 
          q.sub_skill === subSkill && q.difficulty === difficulty
        ).length;
        
        const targetCount = config.drillTestConfig.questionsPerDifficulty;
        const neededCount = Math.max(0, targetCount - existingCount);
        
        if (neededCount > 0) {
          questionGaps.push({
            testMode,
            subSkill,
            difficulty: difficulty as 1 | 2 | 3,
            questionsNeeded: neededCount,
            needsPassage: config.requiresPassages
          });
        }
      }
    }
  } else {
    // For practice/diagnostic: Distribute evenly across sub-skills
    const questionsPerSubSkill = Math.ceil(questionsNeeded / subSkills.length);
    
    for (let i = 0; i < subSkills.length && questionGaps.length * questionsPerSubSkill < questionsNeeded; i++) {
      const subSkill = subSkills[i];
      const questionsForThisSubSkill = Math.min(questionsPerSubSkill, questionsNeeded - (questionGaps.length * questionsPerSubSkill));
      
      if (questionsForThisSubSkill > 0) {
        questionGaps.push({
          testMode,
          subSkill,
          difficulty: 2, // Default to medium difficulty for practice/diagnostic
          questionsNeeded: questionsForThisSubSkill,
          needsPassage: config.requiresPassages
        });
      }
    }
  }
  
  return { passageGaps, questionGaps };
}

/**
 * Analyze passage gaps for practice/diagnostic tests
 */
async function analyzePracticeOrDiagnosticPassageGaps(
  testType: string,
  sectionName: string,
  testMode: 'practice_1' | 'practice_2' | 'practice_3' | 'practice_4' | 'practice_5' | 'diagnostic',
  config: any,
  existingPassages: any[],
  existingQuestions: any[],
  subSkills: string[]
): Promise<{ passageGaps: PassageGap[]; questionGaps: QuestionGap[] }> {
  const passageGaps: PassageGap[] = [];
  const questionGaps: QuestionGap[] = [];
  
  const testConfig = testMode.startsWith('practice') ? config.practiceTestConfig : config.diagnosticTestConfig;
  
  // Validate test configuration
  if (!testConfig) {
    throw new Error(`Test config is undefined for mode: ${testMode}`);
  }
  
  if (!testConfig.passageDifficulties) {
    throw new Error(`passageDifficulties is undefined in testConfig for mode: ${testMode}`);
  }
  
  const questionsPerPassage = testConfig.questionsPerPassage;
  
  // Analyze each difficulty level
  for (let difficulty = 1; difficulty <= 3; difficulty++) {
    const difficultyKey = `difficulty_${difficulty}`;
    const expectedPassages = testConfig.passageDifficulties[difficulty === 1 ? 'easy' : difficulty === 2 ? 'medium' : 'hard'];
    const actualPassages = existingPassages.filter(p => p.difficulty === difficulty);
    
    // Check if we need more passages
    const passagesNeeded = Math.max(0, expectedPassages - actualPassages.length);
    
    for (let i = 0; i < passagesNeeded; i++) {
      passageGaps.push({
        testMode,
        difficulty: difficulty as 1 | 2 | 3,
        wordCount: config.wordsPerPassage,
        questionsExpected: questionsPerPassage,
        questionsActual: 0,
        isSharedPassage: true,
        passageIndex: actualPassages.length + i + 1
      });
    }
    
    // Check existing passages for question gaps
    for (const passage of actualPassages) {
      const questionsFromPassage = existingQuestions.filter(q => q.passage_id === passage.id);
      const questionsNeeded = Math.max(0, questionsPerPassage - questionsFromPassage.length);
      
      if (questionsNeeded > 0) {
        // We need more questions for this existing passage
        // Distribute questions across sub-skills
        const subSkillsInPassage = await getSubSkillsForPassage(passage.id);
        const subSkillsNeeded = subSkillsInPassage.length > 0 ? subSkillsInPassage : [subSkills[0]];
        
        for (const subSkill of subSkillsNeeded) {
          questionGaps.push({
            testMode,
            subSkill,
            difficulty: difficulty as 1 | 2 | 3,
            questionsNeeded: Math.ceil(questionsNeeded / subSkillsNeeded.length),
            passageId: passage.id,
            needsPassage: false
          });
        }
      }
    }
  }
  
  return { passageGaps, questionGaps };
}

/**
 * Get existing questions for a test section and mode
 */
async function getExistingQuestions(
  testType: string,
  sectionName: string,
  testMode: string
): Promise<any[]> {
  const { data: questions, error } = await supabase
    .from('questions')
    .select('id, sub_skill, difficulty, test_mode, passage_id')
    .eq('test_type', testType)
    .eq('section_name', sectionName)
    .eq('test_mode', testMode);
  
  if (error) {
    console.error('Error fetching existing questions:', error);
    return [];
  }
  
  return questions || [];
}

/**
 * Get existing passages for a test section
 */
async function getExistingPassages(
  testType: string,
  sectionName: string
): Promise<any[]> {
  const { data: passages, error } = await supabase
    .from('passages')
    .select('id, difficulty, word_count')
    .eq('test_type', testType)
    .eq('section_name', sectionName);
  
  if (error) {
    console.error('Error fetching existing passages:', error);
    return [];
  }
  
  return passages || [];
}

/**
 * Get sub-skills that have questions for a specific passage
 */
async function getSubSkillsForPassage(passageId: string): Promise<string[]> {
  const { data: questions, error } = await supabase
    .from('questions')
    .select('sub_skill')
    .eq('passage_id', passageId);
  
  if (error) {
    console.error('Error fetching sub-skills for passage:', error);
    return [];
  }
  
  const subSkills = [...new Set(questions?.map(q => q.sub_skill) || [])];
  return subSkills;
}

/**
 * Generate detailed gap report
 */
export async function generateGapReport(
  testType: string,
  sectionName: string
): Promise<string> {
  const gapAnalysis = await performGapAnalysis(testType, sectionName);
  const config = getTestSectionConfig(testType, sectionName);
  
  let report = `\n📊 GAP ANALYSIS REPORT\n`;
  report += `Test Type: ${testType}\n`;
  report += `Section: ${sectionName}\n`;
  report += `Requires Passages: ${config.requiresPassages ? 'Yes' : 'No'}\n`;
  report += `Is Reading Section: ${config.isReadingSection ? 'Yes' : 'No'}\n`;
  report += `====================================\n\n`;
  
  if (gapAnalysis.totalGaps === 0) {
    report += `✅ No gaps found - section is complete!\n`;
    return report;
  }
  
  report += `📋 SUMMARY:\n`;
  report += `Total Questions Needed: ${gapAnalysis.summary.questionsNeeded}\n`;
  report += `Total Passages Needed: ${gapAnalysis.summary.passagesNeeded}\n\n`;
  
  if (Object.keys(gapAnalysis.summary.gapsByTestMode).length > 0) {
    report += `📈 GAPS BY TEST MODE:\n`;
    Object.entries(gapAnalysis.summary.gapsByTestMode).forEach(([mode, count]) => {
      report += `   ${mode}: ${count} questions\n`;
    });
    report += `\n`;
  }
  
  if (Object.keys(gapAnalysis.summary.gapsByDifficulty).length > 0) {
    report += `📊 GAPS BY DIFFICULTY:\n`;
    Object.entries(gapAnalysis.summary.gapsByDifficulty).forEach(([difficulty, count]) => {
      report += `   ${difficulty}: ${count} questions\n`;
    });
    report += `\n`;
  }
  
  if (Object.keys(gapAnalysis.summary.gapsBySubSkill).length > 0) {
    report += `🎯 GAPS BY SUB-SKILL:\n`;
    Object.entries(gapAnalysis.summary.gapsBySubSkill).forEach(([subSkill, count]) => {
      report += `   ${subSkill}: ${count} questions\n`;
    });
    report += `\n`;
  }
  
  if (gapAnalysis.passageGaps.length > 0) {
    report += `📝 PASSAGE GAPS:\n`;
    gapAnalysis.passageGaps.forEach((gap, index) => {
      report += `   ${index + 1}. Passage ${gap.passageIndex} for ${gap.testMode}\n`;
      report += `      Mode: ${gap.testMode} | Difficulty: ${gap.difficulty} | Words: ${gap.wordCount}\n`;
      report += `      Questions Expected: ${gap.questionsExpected} | Shared: ${gap.isSharedPassage ? 'Yes' : 'No'}\n`;
    });
    report += `\n`;
  }
  
  if (gapAnalysis.questionGaps.length > 0) {
    report += `❓ QUESTION GAPS:\n`;
    gapAnalysis.questionGaps.forEach((gap, index) => {
      report += `   ${index + 1}. ${gap.subSkill}\n`;
      report += `      Mode: ${gap.testMode} | Difficulty: ${gap.difficulty} | Needed: ${gap.questionsNeeded}\n`;
      report += `      Passage ID: ${gap.passageId || 'N/A'} | Needs Passage: ${gap.needsPassage ? 'Yes' : 'No'}\n`;
    });
  }
  
  return report;
}

/**
 * Validate gap analysis results
 */
export function validateGapAnalysis(gapAnalysis: GapAnalysisResult): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check for inconsistencies
  if (gapAnalysis.passageGaps.length > 0 && gapAnalysis.questionGaps.length === 0) {
    warnings.push('Passage gaps exist but no question gaps - this might indicate a configuration issue');
  }
  
  if (gapAnalysis.questionGaps.length > 0 && gapAnalysis.passageGaps.length === 0) {
    const needsPassages = gapAnalysis.questionGaps.some(gap => gap.needsPassage);
    if (needsPassages) {
      errors.push('Questions need passages but no passage gaps were identified');
    }
  }
  
  // Check for duplicate passage indices within same test mode
  const passageKeys = gapAnalysis.passageGaps.map(gap => `${gap.testMode}_${gap.passageIndex}`);
  const uniquePassageKeys = [...new Set(passageKeys)];
  if (passageKeys.length !== uniquePassageKeys.length) {
    errors.push('Duplicate passage indices found in gap analysis');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}