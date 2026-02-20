/**
 * AUDIT ALL TEST TYPES FOR "LET ME" HALLUCINATIONS
 * 
 * Scans all test products in Supabase to find any solutions
 * that contain "let me" phrases indicating hallucinations
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface HallucinatedQuestion {
  id: string;
  test_type: string;
  question_text: string;
  solution: string;
  section_name: string;
  sub_skill: string;
  created_at: string;
}

const TEST_TYPES = [
  'EduTest',
  'Year 5 NAPLAN',
  'Year 7 NAPLAN',
  'ACER Scholarship (Year 7 Entry)',
  'NSW Selective Entry (Year 7 Entry)',
  'VIC Selective Entry (Year 9 Entry)'
];

async function auditAllTestTypesForLetMeHallucinations(): Promise<void> {
  console.log('🔍 AUDITING ALL TEST TYPES FOR "LET ME" HALLUCINATIONS');
  console.log('===============================================\n');

  const allHallucinatedQuestions: HallucinatedQuestion[] = [];
  let totalQuestions = 0;

  try {
    for (const testType of TEST_TYPES) {
      console.log(`📋 Checking ${testType}...`);
      
      // Query questions for this test type
      const { data: questions, error } = await supabase
        .from('questions')
        .select('id, test_type, question_text, solution, section_name, sub_skill, created_at')
        .eq('test_type', testType);

      if (error) {
        console.error(`❌ Error querying ${testType}:`, error);
        continue;
      }

      if (!questions || questions.length === 0) {
        console.log(`   No questions found for ${testType}\n`);
        continue;
      }

      totalQuestions += questions.length;
      console.log(`   Found ${questions.length} questions`);

      // Search for "let me" hallucinations (case insensitive)
      const testTypeHallucinations: HallucinatedQuestion[] = [];
      
      questions.forEach(question => {
        if (question.solution) {
          const solution = question.solution.toLowerCase();
          
          // Only check for "let me" specifically
          if (solution.includes('let me')) {
            testTypeHallucinations.push(question);
          }
        }
      });

      if (testTypeHallucinations.length > 0) {
        console.log(`   🚨 Found ${testTypeHallucinations.length} hallucinated questions`);
        allHallucinatedQuestions.push(...testTypeHallucinations);
      } else {
        console.log(`   ✅ No hallucinations found`);
      }
      
      console.log('');
    }

    // Display summary results
    console.log('\n==============================================');
    console.log('📊 AUDIT SUMMARY');
    console.log('==============================================\n');
    
    console.log(`📋 Total questions scanned: ${totalQuestions}`);
    console.log(`🚨 Total hallucinated questions: ${allHallucinatedQuestions.length}\n`);

    if (allHallucinatedQuestions.length === 0) {
      console.log('🎉 EXCELLENT NEWS!');
      console.log('✅ No "let me" hallucinations found across all test types');
      console.log('✅ All questions appear to have clean solutions');
      console.log('\n🌟 Your validation system is working perfectly!');
    } else {
      // Group by test type
      const byTestType = new Map<string, HallucinatedQuestion[]>();
      allHallucinatedQuestions.forEach(q => {
        if (!byTestType.has(q.test_type)) {
          byTestType.set(q.test_type, []);
        }
        byTestType.get(q.test_type)!.push(q);
      });

      console.log('🚨 HALLUCINATIONS BY TEST TYPE:');
      for (const [testType, questions] of byTestType.entries()) {
        console.log(`   ${testType}: ${questions.length} questions`);
      }

      console.log('\n📂 DETAILED BREAKDOWN:');
      for (const [testType, questions] of byTestType.entries()) {
        console.log(`\n📋 ${testType} (${questions.length} questions):`);
        
        questions.forEach((q, index) => {
          console.log(`   ${index + 1}. ID: ${q.id}`);
          console.log(`      Section: ${q.section_name || 'N/A'}`);
          console.log(`      Sub-skill: ${q.sub_skill || 'N/A'}`);
          console.log(`      Created: ${new Date(q.created_at).toLocaleDateString()}`);
          
          // Show context around "let me"
          const solution = q.solution.toLowerCase();
          const matchIndex = solution.indexOf('let me');
          if (matchIndex !== -1) {
            const start = Math.max(0, matchIndex - 30);
            const end = Math.min(solution.length, matchIndex + 50);
            const context = q.solution.substring(start, end);
            console.log(`      Context: "...${context}..."`);
          }
          console.log('');
        });
      }

      // Export all question IDs
      const allQuestionIds = allHallucinatedQuestions.map(q => q.id);
      
      console.log('\n📋 ALL QUESTION IDS FOR DELETION:');
      console.log('=================================');
      console.log(JSON.stringify(allQuestionIds, null, 2));
      
      console.log('\n🛠️  RECOMMENDED ACTIONS:');
      console.log('1. Use the deletion script generated below');
      console.log('2. Regenerate questions using V2 scripts with validation');
      console.log('3. Run this audit again to confirm cleanup');
    }

    console.log('\n==============================================');
    console.log('🔍 Audit complete');

  } catch (error) {
    console.error('💥 Fatal error during audit:', error);
    throw error;
  }
}

async function main() {
  try {
    await auditAllTestTypesForLetMeHallucinations();
  } catch (error) {
    console.error('💥 Audit failed:', error);
    process.exit(1);
  }
}

main();