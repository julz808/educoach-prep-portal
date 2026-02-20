/**
 * Check production database for duplicate vocabulary questions
 */

import { supabase } from '@/integrations/supabase/client';

async function checkProductionDuplicates() {
  console.log('\n🔍 Checking production database for duplicates...\n');

  // First, check if we can connect
  const { count, error: countError } = await supabase
    .from('questions_v2')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Connection error:', countError);
    process.exit(1);
  }

  console.log(`✅ Connected to production. Total questions in questions_v2: ${count}\n`);

  // Get the specific IDs
  const { data: specificQuestions, error: specificError } = await supabase
    .from('questions_v2')
    .select('id, question_text, correct_answer, sub_skill, test_type, section_name, test_mode, created_at')
    .in('id', [
      'f9d89cbd-c775-4acd-a812-62d61436273c',
      '6d817aa7-bca4-473f-b397-dc626d313731',
      '28cac31f-4f4d-4a00-be8c-f417b9dc36f2',
      '4a7d3fa3-4660-4584-82ec-4342349be6d5'
    ])
    .order('created_at', { ascending: true });

  if (specificError) {
    console.error('❌ Query error:', specificError);
    process.exit(1);
  }

  console.log(`📋 Found ${specificQuestions.length} questions with those specific IDs\n`);

  if (specificQuestions.length === 0) {
    console.log('⚠️  No questions found with those IDs. They may have been deleted.\n');

    // Try to find any vocabulary questions
    const { data: vocabQuestions, error: vocabError } = await supabase
      .from('questions_v2')
      .select('id, question_text, correct_answer, sub_skill, test_type, section_name, test_mode, created_at')
      .ilike('sub_skill', '%vocab%')
      .order('created_at', { ascending: false })
      .limit(50);

    if (vocabError) {
      console.error('❌ Query error:', vocabError);
      process.exit(1);
    }

    console.log(`\nFound ${vocabQuestions.length} vocabulary-related questions. Checking for duplicates...\n`);

    // Group by question text
    const textMap = new Map<string, typeof vocabQuestions>();
    vocabQuestions.forEach(q => {
      const normalized = q.question_text.trim().toLowerCase();
      if (!textMap.has(normalized)) {
        textMap.set(normalized, []);
      }
      textMap.get(normalized)!.push(q);
    });

    let duplicateCount = 0;
    textMap.forEach((questions, text) => {
      if (questions.length > 1) {
        duplicateCount++;
        console.log('━'.repeat(80));
        console.log(`🔴 DUPLICATE SET #${duplicateCount} (${questions.length} instances):`);
        console.log(`\nTest: ${questions[0].test_type}`);
        console.log(`Section: ${questions[0].section_name}`);
        console.log(`Sub-skill: ${questions[0].sub_skill}`);
        console.log(`\nQuestion text:\n${questions[0].question_text.slice(0, 400)}`);
        console.log(`\nInstances:`);
        questions.forEach((q, i) => {
          console.log(`  ${i + 1}. ID: ${q.id}`);
          console.log(`     Mode: ${q.test_mode}`);
          console.log(`     Answer: ${q.correct_answer}`);
          console.log(`     Created: ${q.created_at}`);
        });
        console.log('');
      }
    });

    if (duplicateCount === 0) {
      console.log('✅ No duplicates found in vocabulary questions\n');
    } else {
      console.log(`\n🔴 Total duplicate sets found: ${duplicateCount}\n`);
    }

  } else {
    // Show the specific questions
    console.log('━'.repeat(80));
    console.log('PAIR 1: f9d89cbd... vs 6d817aa7...');
    console.log('━'.repeat(80));

    const q1 = specificQuestions.find(q => q.id === 'f9d89cbd-c775-4acd-a812-62d61436273c');
    const q2 = specificQuestions.find(q => q.id === '6d817aa7-bca4-473f-b397-dc626d313731');

    if (q1) {
      console.log('\n📄 Question 1:');
      console.log(`ID: ${q1.id}`);
      console.log(`Test: ${q1.test_type}`);
      console.log(`Section: ${q1.section_name}`);
      console.log(`Sub-skill: ${q1.sub_skill}`);
      console.log(`Mode: ${q1.test_mode}`);
      console.log(`Created: ${q1.created_at}`);
      console.log(`\nQuestion:\n${q1.question_text}`);
      console.log(`\nAnswer: ${q1.correct_answer}`);
    }

    if (q2) {
      console.log('\n📄 Question 2:');
      console.log(`ID: ${q2.id}`);
      console.log(`Test: ${q2.test_type}`);
      console.log(`Section: ${q2.section_name}`);
      console.log(`Sub-skill: ${q2.sub_skill}`);
      console.log(`Mode: ${q2.test_mode}`);
      console.log(`Created: ${q2.created_at}`);
      console.log(`\nQuestion:\n${q2.question_text}`);
      console.log(`\nAnswer: ${q2.correct_answer}`);
    }

    if (q1 && q2) {
      const identical = q1.question_text === q2.question_text;
      console.log('\n' + '━'.repeat(80));
      console.log(identical ? '🔴 EXACT MATCH - Identical question text' : '⚠️  Different question text');
      console.log('━'.repeat(80));
    }

    console.log('\n\n');
    console.log('━'.repeat(80));
    console.log('PAIR 2: 28cac31f... vs 4a7d3fa3...');
    console.log('━'.repeat(80));

    const q3 = specificQuestions.find(q => q.id === '28cac31f-4f4d-4a00-be8c-f417b9dc36f2');
    const q4 = specificQuestions.find(q => q.id === '4a7d3fa3-4660-4584-82ec-4342349be6d5');

    if (q3) {
      console.log('\n📄 Question 3:');
      console.log(`ID: ${q3.id}`);
      console.log(`Test: ${q3.test_type}`);
      console.log(`Section: ${q3.section_name}`);
      console.log(`Sub-skill: ${q3.sub_skill}`);
      console.log(`Mode: ${q3.test_mode}`);
      console.log(`Created: ${q3.created_at}`);
      console.log(`\nQuestion:\n${q3.question_text}`);
      console.log(`\nAnswer: ${q3.correct_answer}`);
    }

    if (q4) {
      console.log('\n📄 Question 4:');
      console.log(`ID: ${q4.id}`);
      console.log(`Test: ${q4.test_type}`);
      console.log(`Section: ${q4.section_name}`);
      console.log(`Sub-skill: ${q4.sub_skill}`);
      console.log(`Mode: ${q4.test_mode}`);
      console.log(`Created: ${q4.created_at}`);
      console.log(`\nQuestion:\n${q4.question_text}`);
      console.log(`\nAnswer: ${q4.correct_answer}`);
    }

    if (q3 && q4) {
      const identical = q3.question_text === q4.question_text;
      console.log('\n' + '━'.repeat(80));
      console.log(identical ? '🔴 EXACT MATCH - Identical question text' : '⚠️  Different question text');
      console.log('━'.repeat(80));
    }
  }

  console.log('\n');
}

checkProductionDuplicates()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
  });
