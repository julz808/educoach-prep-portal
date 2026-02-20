/**
 * Check V1 questions table for duplicates
 */

import { supabase } from '@/integrations/supabase/client';

async function checkV1Table() {
  console.log('\n🔍 Checking V1 questions table...\n');

  // Check questions table
  const { count, error: countError } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Error accessing questions table:', countError);
  } else {
    console.log(`✅ questions table: ${count} total questions\n`);
  }

  // Get the specific IDs from V1 table
  const { data: specificQuestions, error: specificError } = await supabase
    .from('questions')
    .select('id, question_text, correct_answer, sub_skill, test_type, section_name, created_at')
    .in('id', [
      'f9d89cbd-c775-4acd-a812-62d61436273c',
      '6d817aa7-bca4-473f-b397-dc626d313731',
      '28cac31f-4f4d-4a00-be8c-f417b9dc36f2',
      '4a7d3fa3-4660-4584-82ec-4342349be6d5'
    ])
    .order('created_at', { ascending: true });

  if (specificError) {
    console.error('❌ Query error:', specificError);
  } else {
    console.log(`📋 Found ${specificQuestions.length} questions with those IDs in V1 table\n`);

    if (specificQuestions.length > 0) {
      specificQuestions.forEach((q, i) => {
        console.log('━'.repeat(80));
        console.log(`Question ${i + 1}:`);
        console.log(`ID: ${q.id}`);
        console.log(`Test: ${q.test_type}`);
        console.log(`Section: ${q.section_name}`);
        console.log(`Sub-skill: ${q.sub_skill}`);
        console.log(`Created: ${q.created_at}`);
        console.log(`\nQuestion:\n${q.question_text.slice(0, 500)}`);
        console.log(`\nAnswer: ${q.correct_answer}`);
        console.log('');
      });

      // Check for duplicates
      if (specificQuestions.length >= 2) {
        console.log('━'.repeat(80));
        console.log('DUPLICATE ANALYSIS:');
        console.log('━'.repeat(80));

        const q1 = specificQuestions[0];
        const q2 = specificQuestions[1];
        const identical = q1?.question_text === q2?.question_text;
        console.log(`\nPair 1 & 2: ${identical ? '🔴 EXACT DUPLICATES' : '✅ Different questions'}`);

        if (specificQuestions.length >= 4) {
          const q3 = specificQuestions[2];
          const q4 = specificQuestions[3];
          const identical2 = q3?.question_text === q4?.question_text;
          console.log(`Pair 3 & 4: ${identical2 ? '🔴 EXACT DUPLICATES' : '✅ Different questions'}`);
        }
      }
    }
  }

  console.log('\n');
}

checkV1Table()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
  });
