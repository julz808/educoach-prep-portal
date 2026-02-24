import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

(async () => {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(' ANALYZING PROBLEMATIC SUB-SKILLS');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  // Problem sub-skills identified
  const problemSubSkills = [
    {
      test: 'VIC Selective Entry (Year 9 Entry)',
      section: 'General Ability - Verbal',
      subSkill: 'Letter Series & Patterns',
      successRate: 35
    },
    {
      test: 'Year 5 NAPLAN',
      section: 'Language Conventions',
      subSkill: 'Punctuation',
      successRate: 54
    },
    {
      test: 'EduTest Scholarship (Year 7 Entry)',
      section: 'Numerical Reasoning',
      subSkill: 'Number Series & Pattern Recognition',
      successRate: 71
    },
    {
      test: 'EduTest Scholarship (Year 7 Entry)',
      section: 'Numerical Reasoning',
      subSkill: 'Number Matrices & Grid Patterns',
      successRate: 58
    }
  ];

  for (const problem of problemSubSkills) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(` ${problem.test}`);
    console.log(` ${problem.section} - ${problem.subSkill}`);
    console.log(` Success Rate: ${problem.successRate}%`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    // Get successful questions
    const { data: successQuestions } = await supabase
      .from('questions_v2')
      .select('question_text, answer_options, correct_answer, generation_metadata')
      .eq('test_type', problem.test)
      .eq('section_name', problem.section)
      .eq('sub_skill', problem.subSkill)
      .limit(3);

    console.log(`✅ Sample SUCCESSFUL questions:\n`);

    if (successQuestions && successQuestions.length > 0) {
      successQuestions.forEach((q, idx) => {
        console.log(`Example ${idx + 1}:`);
        console.log(`Question: ${q.question_text.substring(0, 200)}${q.question_text.length > 200 ? '...' : ''}`);
        if (q.answer_options && q.answer_options.length > 0) {
          console.log(`Options: ${q.answer_options.slice(0, 2).join(' | ')}`);
        }
        console.log(`Correct: ${q.correct_answer}`);

        if (q.generation_metadata) {
          const meta = q.generation_metadata as any;
          if (meta.attempt_number) {
            console.log(`Attempts needed: ${meta.attempt_number}`);
          }
        }
        console.log();
      });
    } else {
      console.log('   No successful questions found\n');
    }

    // Check if there are any common patterns in generation metadata
    const { data: allQuestions } = await supabase
      .from('questions_v2')
      .select('generation_metadata')
      .eq('test_type', problem.test)
      .eq('section_name', problem.section)
      .eq('sub_skill', problem.subSkill);

    if (allQuestions && allQuestions.length > 0) {
      const attemptCounts: Record<number, number> = {};
      let totalAttempts = 0;

      allQuestions.forEach(q => {
        if (q.generation_metadata) {
          const meta = q.generation_metadata as any;
          if (meta.attempt_number) {
            attemptCounts[meta.attempt_number] = (attemptCounts[meta.attempt_number] || 0) + 1;
            totalAttempts += meta.attempt_number;
          }
        }
      });

      console.log(`📊 Generation Attempts Distribution:`);
      Object.entries(attemptCounts)
        .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
        .forEach(([attempts, count]) => {
          console.log(`   ${attempts} attempt(s): ${count} questions`);
        });

      const avgAttempts = totalAttempts / allQuestions.length;
      console.log(`   Average attempts: ${avgAttempts.toFixed(2)}\n`);
    }
  }

  console.log('═══════════════════════════════════════════════════════════════════\n');
})();
