/**
 * AUDIT EDUTEST "LET ME" HALLUCINATIONS
 * 
 * Scans the EduTest questions in Supabase to find any solutions
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
  question_text: string;
  solution: string;
  section_name: string;
  sub_skill: string;
  created_at: string;
  hallucinationMatch: string;
}

async function auditEduTestLetMeHallucinations(): Promise<void> {
  console.log('🔍 AUDITING EDUTEST QUESTIONS FOR "LET ME" HALLUCINATIONS');
  console.log('==============================================\n');

  try {
    // Query all EduTest questions
    const { data: questions, error } = await supabase
      .from('questions')
      .select('id, question_text, solution, section_name, sub_skill, created_at')
      .eq('test_type', 'EduTest');

    if (error) {
      console.error('❌ Error querying questions:', error);
      return;
    }

    if (!questions || questions.length === 0) {
      console.log('📋 No EduTest questions found in database');
      return;
    }

    console.log(`📊 Total EduTest questions: ${questions.length}\n`);

    // Search for "let me" hallucinations (case insensitive)
    const hallucinatedQuestions: HallucinatedQuestion[] = [];
    
    questions.forEach(question => {
      if (question.solution) {
        const solution = question.solution.toLowerCase();
        
        // Check for various "let me" patterns
        const patterns = [
          'let me',
          'let me recalculate',
          'let me check',
          'let me solve',
          'let me work',
          'let me try'
        ];

        for (const pattern of patterns) {
          if (solution.includes(pattern)) {
            hallucinatedQuestions.push({
              ...question,
              hallucinationMatch: pattern
            });
            break; // Only record once per question
          }
        }
      }
    });

    // Display results
    if (hallucinatedQuestions.length === 0) {
      console.log('🎉 EXCELLENT NEWS!');
      console.log('✅ No "let me" hallucinations found in EduTest questions');
      console.log('✅ All questions appear to have clean solutions');
      console.log('\n🌟 Your validation system is working perfectly!');
    } else {
      console.log(`🚨 HALLUCINATIONS DETECTED: ${hallucinatedQuestions.length} questions\n`);
      
      // Group by section
      const bySectionMap = new Map<string, HallucinatedQuestion[]>();
      hallucinatedQuestions.forEach(q => {
        const section = q.section_name || 'Unknown Section';
        if (!bySectionMap.has(section)) {
          bySectionMap.set(section, []);
        }
        bySectionMap.get(section)!.push(q);
      });

      // Display by section
      for (const [section, sectionQuestions] of bySectionMap.entries()) {
        console.log(`📂 ${section}: ${sectionQuestions.length} questions`);
        
        sectionQuestions.forEach((q, index) => {
          console.log(`   ${index + 1}. ID: ${q.id}`);
          console.log(`      Sub-skill: ${q.sub_skill || 'N/A'}`);
          console.log(`      Match: "${q.hallucinationMatch}"`);
          console.log(`      Created: ${new Date(q.created_at).toLocaleDateString()}`);
          
          // Show context around the hallucination
          const solution = q.solution.toLowerCase();
          const matchIndex = solution.indexOf(q.hallucinationMatch);
          if (matchIndex !== -1) {
            const start = Math.max(0, matchIndex - 50);
            const end = Math.min(solution.length, matchIndex + q.hallucinationMatch.length + 50);
            const context = q.solution.substring(start, end);
            console.log(`      Context: "...${context}..."`);
          }
          console.log('');
        });
      }

      // Summary by pattern
      console.log('\n📊 HALLUCINATION PATTERNS:');
      const patternCount = new Map<string, number>();
      hallucinatedQuestions.forEach(q => {
        const pattern = q.hallucinationMatch;
        patternCount.set(pattern, (patternCount.get(pattern) || 0) + 1);
      });

      for (const [pattern, count] of patternCount.entries()) {
        console.log(`   "${pattern}": ${count} occurrences`);
      }

      console.log('\n🛠️  RECOMMENDED ACTIONS:');
      console.log('1. Delete these hallucinated questions from the database');
      console.log('2. Regenerate new questions using the V2 scripts with validation');
      console.log('3. Run this audit again to confirm cleanup');

      // Export IDs for deletion script
      const questionIds = hallucinatedQuestions.map(q => q.id);
      console.log('\n📋 QUESTION IDS FOR DELETION:');
      console.log(JSON.stringify(questionIds, null, 2));
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
    await auditEduTestLetMeHallucinations();
  } catch (error) {
    console.error('💥 Audit failed:', error);
    process.exit(1);
  }
}

main();