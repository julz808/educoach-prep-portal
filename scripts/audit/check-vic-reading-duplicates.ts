/**
 * Check VIC Reading for duplicate questions
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDuplicates() {
  const { data, error } = await supabase
    .from('questions_v2')
    .select('id, question_text, correct_answer, sub_skill, test_mode, created_at')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
    .eq('section_name', 'Reading Reasoning')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('❌ Query error:', error);
    process.exit(1);
  }

  console.log(`\n📋 Found ${data.length} VIC Reading questions\n`);

  // Group by question text to find duplicates
  const questionMap = new Map<string, Array<typeof data[0]>>();

  data.forEach(q => {
    const key = q.question_text.trim();
    if (!questionMap.has(key)) {
      questionMap.set(key, []);
    }
    questionMap.get(key)!.push(q);
  });

  // Show duplicates
  let duplicateCount = 0;
  questionMap.forEach((questions, text) => {
    if (questions.length > 1) {
      duplicateCount++;
      console.log('━'.repeat(80));
      console.log(`🔴 DUPLICATE #${duplicateCount} (${questions.length} instances):`);
      console.log('');
      console.log(`Question text (first 200 chars):`);
      console.log(text.slice(0, 200) + (text.length > 200 ? '...' : ''));
      console.log('');
      console.log(`Instances:`);
      questions.forEach((q, i) => {
        console.log(`  ${i + 1}. ID: ${q.id}`);
        console.log(`     Sub-skill: ${q.sub_skill}`);
        console.log(`     Mode: ${q.test_mode}`);
        console.log(`     Answer: ${q.correct_answer}`);
        console.log(`     Created: ${q.created_at}`);
        console.log('');
      });
    }
  });

  if (duplicateCount === 0) {
    console.log('✅ No duplicates found');
  } else {
    console.log('━'.repeat(80));
    console.log(`\n🔴 Total duplicates found: ${duplicateCount}\n`);
  }

  // Also show all questions for context
  console.log('\n📋 All VIC Reading questions (newest first):\n');
  data.forEach((q, i) => {
    console.log(`${i + 1}. ${q.id.slice(0, 8)}... | ${q.sub_skill} | ${q.test_mode}`);
    console.log(`   ${q.question_text.slice(0, 100)}...`);
    console.log('');
  });
}

checkDuplicates()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
  });
