#!/usr/bin/env tsx

/**
 * Comprehensive audit of the questions table for VIC Selective Entry
 * This script analyzes:
 * 1. Questions per sub-skill for VIC Selective Entry
 * 2. Questions per test section
 * 3. Passage usage and recycling across tests
 * 4. Overall data quality
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get current directory in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface QuestionRecord {
  id: string;
  test_type: string;
  test_mode: string;
  section_name: string;
  sub_skill: string;
  sub_skill_id: string;
  passage_id: string | null;
  difficulty: number;
  question_text: string;
  answer_options: any;
  response_type: string;
}

interface PassageRecord {
  id: string;
  title: string;
  content: string;
  difficulty: number;
  word_count: number;
  test_type: string;
}

async function auditQuestionsTable() {
  console.log('🔍 Starting comprehensive questions table audit...\n');

  try {
    // 1. Get all questions for VIC Selective Entry
    console.log('📊 Fetching VIC Selective Entry questions...');
    const { data: vicQuestions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('test_type', 'VIC Selective Entry (Year 9 Entry)');

    if (questionsError) {
      console.error('❌ Error fetching questions:', questionsError);
      return;
    }

    console.log(`✅ Found ${vicQuestions?.length || 0} VIC Selective Entry questions\n`);

    // 2. Get all passages
    console.log('📖 Fetching all passages...');
    const { data: allPassages, error: passagesError } = await supabase
      .from('passages')
      .select('*');

    if (passagesError) {
      console.error('❌ Error fetching passages:', passagesError);
      return;
    }

    console.log(`✅ Found ${allPassages?.length || 0} total passages\n`);

    // 3. Get all questions (for passage usage analysis)
    console.log('📋 Fetching all questions for passage analysis...');
    const { data: allQuestions, error: allQuestionsError } = await supabase
      .from('questions')
      .select('id, test_type, test_mode, section_name, passage_id');

    if (allQuestionsError) {
      console.error('❌ Error fetching all questions:', allQuestionsError);
      return;
    }

    console.log(`✅ Found ${allQuestions?.length || 0} total questions across all tests\n`);

    // 4. Analyze VIC Selective Entry questions by sub-skill
    console.log('=' .repeat(80));
    console.log('📈 VIC SELECTIVE ENTRY - QUESTIONS PER SUB-SKILL');
    console.log('=' .repeat(80));

    const subSkillCounts = new Map<string, number>();
    const sectionSubSkills = new Map<string, Map<string, number>>();

    vicQuestions?.forEach(q => {
      const subSkill = q.sub_skill || 'Unknown';
      const section = q.section_name || 'Unknown';
      
      // Count by sub-skill
      subSkillCounts.set(subSkill, (subSkillCounts.get(subSkill) || 0) + 1);
      
      // Count by section -> sub-skill
      if (!sectionSubSkills.has(section)) {
        sectionSubSkills.set(section, new Map());
      }
      const sectionMap = sectionSubSkills.get(section)!;
      sectionMap.set(subSkill, (sectionMap.get(subSkill) || 0) + 1);
    });

    // Sort and display sub-skill counts
    const sortedSubSkills = Array.from(subSkillCounts.entries())
      .sort((a, b) => b[1] - a[1]);

    sortedSubSkills.forEach(([subSkill, count]) => {
      console.log(`${subSkill.padEnd(40)} ${count.toString().padStart(6)} questions`);
    });

    // 5. Analyze by test section
    console.log('\n' + '=' .repeat(80));
    console.log('📊 VIC SELECTIVE ENTRY - QUESTIONS PER TEST SECTION');
    console.log('=' .repeat(80));

    sectionSubSkills.forEach((subSkillMap, sectionName) => {
      const totalForSection = Array.from(subSkillMap.values()).reduce((sum, count) => sum + count, 0);
      console.log(`\n🎯 ${sectionName}: ${totalForSection} total questions`);
      
      const sortedSectionSubSkills = Array.from(subSkillMap.entries())
        .sort((a, b) => b[1] - a[1]);
      
      sortedSectionSubSkills.forEach(([subSkill, count]) => {
        console.log(`   • ${subSkill.padEnd(35)} ${count.toString().padStart(4)} questions`);
      });
    });

    // 6. Analyze test modes
    console.log('\n' + '=' .repeat(80));
    console.log('🎮 VIC SELECTIVE ENTRY - QUESTIONS PER TEST MODE');
    console.log('=' .repeat(80));

    const testModeCounts = new Map<string, number>();
    vicQuestions?.forEach(q => {
      const testMode = q.test_mode || 'Unknown';
      testModeCounts.set(testMode, (testModeCounts.get(testMode) || 0) + 1);
    });

    const sortedTestModes = Array.from(testModeCounts.entries())
      .sort((a, b) => b[1] - a[1]);

    sortedTestModes.forEach(([testMode, count]) => {
      console.log(`${testMode.padEnd(20)} ${count.toString().padStart(6)} questions`);
    });

    // 7. Passage usage analysis
    console.log('\n' + '=' .repeat(80));
    console.log('📖 PASSAGE USAGE ANALYSIS');
    console.log('=' .repeat(80));

    // Group passages by test type
    const passagesByTestType = new Map<string, any[]>();
    allPassages?.forEach(passage => {
      const testType = passage.test_type || 'Unknown';
      if (!passagesByTestType.has(testType)) {
        passagesByTestType.set(testType, []);
      }
      passagesByTestType.get(testType)!.push(passage);
    });

    console.log(`📊 Total Passages: ${allPassages?.length || 0}`);
    console.log('\nPassages by Test Type:');
    passagesByTestType.forEach((passages, testType) => {
      console.log(`   • ${testType.padEnd(40)} ${passages.length.toString().padStart(4)} passages`);
    });

    // 8. Passage recycling analysis
    console.log('\n📄 Passage Recycling Analysis:');
    
    const passageUsage = new Map<string, {
      testTypes: Set<string>,
      testModes: Set<string>,
      sections: Set<string>,
      questionCount: number
    }>();

    allQuestions?.forEach(q => {
      if (q.passage_id) {
        if (!passageUsage.has(q.passage_id)) {
          passageUsage.set(q.passage_id, {
            testTypes: new Set(),
            testModes: new Set(),
            sections: new Set(),
            questionCount: 0
          });
        }
        const usage = passageUsage.get(q.passage_id)!;
        usage.testTypes.add(q.test_type);
        usage.testModes.add(q.test_mode);
        usage.sections.add(q.section_name);
        usage.questionCount++;
      }
    });

    // Find passages used across multiple test types or modes
    const recycledPassages = Array.from(passageUsage.entries())
      .filter(([_, usage]) => usage.testTypes.size > 1 || usage.testModes.size > 1)
      .sort((a, b) => b[1].questionCount - a[1].questionCount);

    if (recycledPassages.length > 0) {
      console.log(`\n⚠️  Found ${recycledPassages.length} passages used across multiple tests/modes:`);
      recycledPassages.forEach(([passageId, usage]) => {
        console.log(`\n   📖 Passage ID: ${passageId}`);
        console.log(`      Questions: ${usage.questionCount}`);
        console.log(`      Test Types: ${Array.from(usage.testTypes).join(', ')}`);
        console.log(`      Test Modes: ${Array.from(usage.testModes).join(', ')}`);
        console.log(`      Sections: ${Array.from(usage.sections).join(', ')}`);
      });
    } else {
      console.log('✅ No passage recycling detected - each passage is used within one test type/mode');
    }

    // 9. Data quality analysis
    console.log('\n' + '=' .repeat(80));
    console.log('🔍 DATA QUALITY ANALYSIS - VIC SELECTIVE ENTRY');
    console.log('=' .repeat(80));

    const qualityIssues = {
      missingSubSkill: 0,
      missingText: 0,
      missingOptions: 0,
      invalidDifficulty: 0,
      missingCorrectAnswer: 0
    };

    vicQuestions?.forEach(q => {
      if (!q.sub_skill) qualityIssues.missingSubSkill++;
      if (!q.question_text) qualityIssues.missingText++;
      if (!q.answer_options) qualityIssues.missingOptions++;
      if (!q.difficulty || q.difficulty < 1 || q.difficulty > 3) qualityIssues.invalidDifficulty++;
      if (!q.correct_answer) qualityIssues.missingCorrectAnswer++;
    });

    console.log('Data Quality Issues:');
    Object.entries(qualityIssues).forEach(([issue, count]) => {
      const status = count === 0 ? '✅' : '⚠️ ';
      console.log(`${status} ${issue.padEnd(25)} ${count.toString().padStart(4)} questions`);
    });

    // 10. Summary
    console.log('\n' + '=' .repeat(80));
    console.log('📋 SUMMARY');
    console.log('=' .repeat(80));
    
    console.log(`📊 VIC Selective Entry Questions: ${vicQuestions?.length || 0}`);
    console.log(`🎯 Test Sections: ${sectionSubSkills.size}`);
    console.log(`🔧 Sub-Skills: ${subSkillCounts.size}`);
    console.log(`📖 Total Passages (all tests): ${allPassages?.length || 0}`);
    console.log(`♻️  Recycled Passages: ${recycledPassages.length}`);
    
    const avgQuestionsPerSubSkill = Math.round((vicQuestions?.length || 0) / subSkillCounts.size);
    console.log(`📈 Average Questions per Sub-Skill: ${avgQuestionsPerSubSkill}`);

  } catch (error) {
    console.error('❌ Error during audit:', error);
  }
}

// Run the audit
auditQuestionsTable().then(() => {
  console.log('\n✅ Audit complete!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Audit failed:', error);
  process.exit(1);
});