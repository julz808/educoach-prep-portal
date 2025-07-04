#!/usr/bin/env tsx

// ============================================================================
// GENERATION SYSTEM VALIDATION SCRIPT
// ============================================================================
// Validates that all test products and sections will generate correctly
// without actually running the full generation

import { config } from 'dotenv';
config();

import { TEST_STRUCTURES, SECTION_TO_SUB_SKILLS } from '../src/data/curriculumData.ts';
import { 
  isWritingSection, 
  isReadingSection, 
  getDrillQuestionsPerSubSkill,
  getSectionResponseType 
} from '../src/engines/questionGeneration/sectionUtils.ts';

interface ValidationResult {
  testType: string;
  sectionName: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  issues: string[];
  expectedQuestions: {
    practice_1: number;
    practice_2: number;
    practice_3: number;
    practice_4: number;
    practice_5: number;
    diagnostic: number;
    drill: number;
    total: number;
  };
  subSkills: string[];
  passageRequirements: {
    required: boolean;
    count: number;
    wordsPerPassage: number;
  };
  specialHandling: string[];
}

function calculateExpectedDistribution(testType: string, sectionName: string) {
  const testStructure = TEST_STRUCTURES[testType as keyof typeof TEST_STRUCTURES];
  const sectionStructure = testStructure?.[sectionName as keyof typeof testStructure];
  
  if (!sectionStructure || typeof sectionStructure !== 'object' || !('questions' in sectionStructure)) {
    throw new Error(`Invalid section structure for ${testType} - ${sectionName}`);
  }
  
  const authoritativeQuestions = (sectionStructure as any).questions;
  const authoritativePassages = (sectionStructure as any).passages || 0;
  const authoritativeWordsPerPassage = (sectionStructure as any).words_per_passage || 0;
  
  // Get sub-skills
  const compoundKey = `${testType} - ${sectionName}` as keyof typeof SECTION_TO_SUB_SKILLS;
  const subSkills = SECTION_TO_SUB_SKILLS[compoundKey] || 
                   SECTION_TO_SUB_SKILLS[sectionName as keyof typeof SECTION_TO_SUB_SKILLS] || [];
  
  // Calculate diagnostic and drill based on section type
  let diagnosticQuestions: number;
  let drillQuestions: number;
  
  if (isWritingSection(sectionName)) {
    diagnosticQuestions = Math.max(1, Math.round(authoritativeQuestions * 0.5));
    drillQuestions = subSkills.length * 6; // 6 questions per sub-skill
  } else {
    diagnosticQuestions = Math.round(authoritativeQuestions * 0.8);
    drillQuestions = subSkills.length * 30; // 30 questions per sub-skill
  }
  
  return {
    practice_1: authoritativeQuestions,
    practice_2: authoritativeQuestions,
    practice_3: authoritativeQuestions,
    practice_4: authoritativeQuestions,
    practice_5: authoritativeQuestions,
    diagnostic: diagnosticQuestions,
    drill: drillQuestions,
    total: authoritativeQuestions * 5 + diagnosticQuestions + drillQuestions,
    subSkills,
    passageInfo: {
      required: isReadingSection(sectionName),
      count: authoritativePassages,
      wordsPerPassage: authoritativeWordsPerPassage
    }
  };
}

function validateSectionConfiguration(testType: string, sectionName: string): ValidationResult {
  const result: ValidationResult = {
    testType,
    sectionName,
    status: 'PASS',
    issues: [],
    expectedQuestions: {
      practice_1: 0,
      practice_2: 0,
      practice_3: 0,
      practice_4: 0,
      practice_5: 0,
      diagnostic: 0,
      drill: 0,
      total: 0
    },
    subSkills: [],
    passageRequirements: {
      required: false,
      count: 0,
      wordsPerPassage: 0
    },
    specialHandling: []
  };
  
  try {
    // Calculate expected distribution
    const distribution = calculateExpectedDistribution(testType, sectionName);
    result.expectedQuestions = distribution;
    result.subSkills = distribution.subSkills;
    result.passageRequirements = distribution.passageInfo;
    
    // Validate sub-skills exist
    if (distribution.subSkills.length === 0) {
      result.issues.push('No sub-skills found for this section');
      result.status = 'FAIL';
    }
    
    // Validate writing section nuances
    if (isWritingSection(sectionName)) {
      result.specialHandling.push('Writing section: 6 drill questions per sub-skill');
      result.specialHandling.push('Writing section: Extended response format');
      result.specialHandling.push('Writing section: No passages required');
      
      const drillQuestionsPerSubSkill = getDrillQuestionsPerSubSkill(sectionName);
      if (drillQuestionsPerSubSkill !== 6) {
        result.issues.push(`Writing section should have 6 drill questions per sub-skill, got ${drillQuestionsPerSubSkill}`);
        result.status = 'FAIL';
      }
      
      const responseType = getSectionResponseType(sectionName);
      if (responseType !== 'extended_response') {
        result.issues.push(`Writing section should have extended_response format, got ${responseType}`);
        result.status = 'FAIL';
      }
    }
    
    // Validate reading section nuances
    if (isReadingSection(sectionName)) {
      result.specialHandling.push('Reading section: Shared passages for practice/diagnostic');
      result.specialHandling.push('Reading section: Mini-passages for drills (1:1 ratio)');
      
      if (distribution.passageInfo.count === 0) {
        result.issues.push('Reading section should have passages defined');
        result.status = 'FAIL';
      }
    }
    
    // Validate ACER Humanities special case
    if (testType.includes('ACER') && sectionName === 'Humanities') {
      result.specialHandling.push('ACER Humanities: Treated as reading comprehension');
      
      if (!isReadingSection(sectionName)) {
        result.issues.push('ACER Humanities should be treated as reading section');
        result.status = 'FAIL';
      }
    }
    
    // Validate question distribution balance
    const practiceTotal = distribution.practice_1 * 5;
    if (practiceTotal === 0) {
      result.issues.push('No practice questions calculated');
      result.status = 'FAIL';
    }
    
    // Check for reasonable totals
    if (distribution.total === 0) {
      result.issues.push('Total question count is 0');
      result.status = 'FAIL';
    } else if (distribution.total > 1000) {
      result.issues.push(`Total question count seems excessive: ${distribution.total}`);
      result.status = 'WARNING';
    }
    
    // Validate drill questions are appropriate
    if (!isWritingSection(sectionName)) {
      const expectedDrillPerSubSkill = getDrillQuestionsPerSubSkill(sectionName);
      const actualDrillPerSubSkill = distribution.drill / distribution.subSkills.length;
      
      if (Math.abs(expectedDrillPerSubSkill - actualDrillPerSubSkill) > 1) {
        result.issues.push(`Drill questions per sub-skill mismatch: expected ${expectedDrillPerSubSkill}, calculated ${actualDrillPerSubSkill}`);
        result.status = 'WARNING';
      }
    }
    
  } catch (error) {
    result.issues.push(`Configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    result.status = 'FAIL';
  }
  
  return result;
}

function validateAllProducts(): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  for (const [testType, sections] of Object.entries(TEST_STRUCTURES)) {
    console.log(`\n🔍 Validating ${testType}...`);
    
    for (const sectionName of Object.keys(sections)) {
      console.log(`   📋 Checking ${sectionName}...`);
      
      const result = validateSectionConfiguration(testType, sectionName);
      results.push(result);
      
      // Log immediate result
      if (result.status === 'PASS') {
        console.log(`      ✅ PASS - ${result.expectedQuestions.total} total questions expected`);
      } else if (result.status === 'WARNING') {
        console.log(`      ⚠️  WARNING - ${result.issues.length} issues found`);
        result.issues.forEach(issue => console.log(`         - ${issue}`));
      } else {
        console.log(`      ❌ FAIL - ${result.issues.length} critical issues`);
        result.issues.forEach(issue => console.log(`         - ${issue}`));
      }
    }
  }
  
  return results;
}

function generateSummaryReport(results: ValidationResult[]) {
  console.log(`\n🎯 VALIDATION SUMMARY REPORT`);
  console.log(`============================`);
  
  const passed = results.filter(r => r.status === 'PASS');
  const warnings = results.filter(r => r.status === 'WARNING');
  const failed = results.filter(r => r.status === 'FAIL');
  
  console.log(`✅ Passed: ${passed.length}`);
  console.log(`⚠️  Warnings: ${warnings.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  console.log(`📊 Total: ${results.length}`);
  
  if (failed.length > 0) {
    console.log(`\n❌ FAILED SECTIONS:`);
    failed.forEach(result => {
      console.log(`   ${result.testType} - ${result.sectionName}`);
      result.issues.forEach(issue => console.log(`      - ${issue}`));
    });
  }
  
  if (warnings.length > 0) {
    console.log(`\n⚠️  WARNING SECTIONS:`);
    warnings.forEach(result => {
      console.log(`   ${result.testType} - ${result.sectionName}`);
      result.issues.forEach(issue => console.log(`      - ${issue}`));
    });
  }
  
  // Calculate totals
  const totalQuestions = results.reduce((sum, r) => sum + r.expectedQuestions.total, 0);
  const totalPracticeQuestions = results.reduce((sum, r) => sum + (r.expectedQuestions.practice_1 * 5), 0);
  const totalDrillQuestions = results.reduce((sum, r) => sum + r.expectedQuestions.drill, 0);
  
  console.log(`\n📊 EXPECTED GENERATION TOTALS:`);
  console.log(`   Total Questions: ${totalQuestions.toLocaleString()}`);
  console.log(`   Practice Questions: ${totalPracticeQuestions.toLocaleString()}`);
  console.log(`   Drill Questions: ${totalDrillQuestions.toLocaleString()}`);
  console.log(`   Diagnostic Questions: ${(totalQuestions - totalPracticeQuestions - totalDrillQuestions).toLocaleString()}`);
  
  // Nuance verification
  console.log(`\n🎯 NUANCE VERIFICATION:`);
  
  const writingSections = results.filter(r => isWritingSection(r.sectionName));
  const readingSections = results.filter(r => isReadingSection(r.sectionName));
  const acerHumanities = results.find(r => r.testType.includes('ACER') && r.sectionName === 'Humanities');
  
  console.log(`   ✅ Writing sections with 6 drill questions: ${writingSections.length}`);
  console.log(`   ✅ Reading sections with passages: ${readingSections.length}`);
  console.log(`   ✅ ACER Humanities as reading: ${acerHumanities ? 'YES' : 'NO'}`);
  
  return {
    passed: passed.length,
    warnings: warnings.length,
    failed: failed.length,
    total: results.length,
    allValid: failed.length === 0
  };
}

async function main() {
  console.log(`🔍 QUESTION GENERATION SYSTEM VALIDATION`);
  console.log(`=======================================`);
  console.log(`Validating all test products and sections...`);
  
  const results = validateAllProducts();
  const summary = generateSummaryReport(results);
  
  console.log(`\n🎉 VALIDATION COMPLETE!`);
  
  if (summary.allValid) {
    console.log(`✅ All sections passed validation - system ready for generation!`);
    process.exit(0);
  } else {
    console.log(`❌ ${summary.failed} sections failed validation - fix issues before generation`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });
}