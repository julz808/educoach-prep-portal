/**
 * Check specific question IDs for duplicates
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSpecificQuestions() {
  const ids = [
    'f9d89cbd-c775-4acd-a812-62d61436273c',
    '6d817aa7-bca4-473f-b397-dc626d313731',
    '28cac31f-4f4d-4a00-be8c-f417b9dc36f2',
    '4a7d3fa3-4660-4584-82ec-4342349be6d5'
  ];

  const { data, error } = await supabase
    .from('questions_v2')
    .select('id, question_text, correct_answer, sub_skill, test_type, section_name, test_mode, created_at')
    .in('id', ids)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Query error:', error);
    process.exit(1);
  }

  console.log(`\n📋 Found ${data.length} questions\n`);

  // Show pair 1
  console.log('━'.repeat(80));
  console.log('PAIR 1: Potential Duplicates');
  console.log('━'.repeat(80));

  const q1 = data.find(q => q.id === 'f9d89cbd-c775-4acd-a812-62d61436273c');
  const q2 = data.find(q => q.id === '6d817aa7-bca4-473f-b397-dc626d313731');

  if (q1) {
    console.log('\n📄 Question 1:');
    console.log(`ID: ${q1.id}`);
    console.log(`Test: ${q1.test_type}`);
    console.log(`Section: ${q1.section_name}`);
    console.log(`Sub-skill: ${q1.sub_skill}`);
    console.log(`Mode: ${q1.test_mode}`);
    console.log(`Created: ${q1.created_at}`);
    console.log(`\nQuestion Text:\n${q1.question_text}`);
    console.log(`\nCorrect Answer: ${q1.correct_answer}`);
  }

  if (q2) {
    console.log('\n📄 Question 2:');
    console.log(`ID: ${q2.id}`);
    console.log(`Test: ${q2.test_type}`);
    console.log(`Section: ${q2.section_name}`);
    console.log(`Sub-skill: ${q2.sub_skill}`);
    console.log(`Mode: ${q2.test_mode}`);
    console.log(`Created: ${q2.created_at}`);
    console.log(`\nQuestion Text:\n${q2.question_text}`);
    console.log(`\nCorrect Answer: ${q2.correct_answer}`);
  }

  if (q1 && q2) {
    const areIdentical = q1.question_text === q2.question_text;
    console.log('\n' + '━'.repeat(80));
    console.log(areIdentical ? '🔴 EXACT DUPLICATES - Identical text' : '⚠️  Similar but not identical');
    console.log('━'.repeat(80));
  }

  // Show pair 2
  console.log('\n\n');
  console.log('━'.repeat(80));
  console.log('PAIR 2: Potential Duplicates');
  console.log('━'.repeat(80));

  const q3 = data.find(q => q.id === '28cac31f-4f4d-4a00-be8c-f417b9dc36f2');
  const q4 = data.find(q => q.id === '4a7d3fa3-4660-4584-82ec-4342349be6d5');

  if (q3) {
    console.log('\n📄 Question 3:');
    console.log(`ID: ${q3.id}`);
    console.log(`Test: ${q3.test_type}`);
    console.log(`Section: ${q3.section_name}`);
    console.log(`Sub-skill: ${q3.sub_skill}`);
    console.log(`Mode: ${q3.test_mode}`);
    console.log(`Created: ${q3.created_at}`);
    console.log(`\nQuestion Text:\n${q3.question_text}`);
    console.log(`\nCorrect Answer: ${q3.correct_answer}`);
  }

  if (q4) {
    console.log('\n📄 Question 4:');
    console.log(`ID: ${q4.id}`);
    console.log(`Test: ${q4.test_type}`);
    console.log(`Section: ${q4.section_name}`);
    console.log(`Sub-skill: ${q4.sub_skill}`);
    console.log(`Mode: ${q4.test_mode}`);
    console.log(`Created: ${q4.created_at}`);
    console.log(`\nQuestion Text:\n${q4.question_text}`);
    console.log(`\nCorrect Answer: ${q4.correct_answer}`);
  }

  if (q3 && q4) {
    const areIdentical = q3.question_text === q4.question_text;
    console.log('\n' + '━'.repeat(80));
    console.log(areIdentical ? '🔴 EXACT DUPLICATES - Identical text' : '⚠️  Similar but not identical');
    console.log('━'.repeat(80));
  }

  console.log('\n');
}

checkSpecificQuestions()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
  });
