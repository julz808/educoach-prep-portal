/**
 * Check Vocabulary in Context for duplicates
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVocabDuplicates() {
  const { data, error } = await supabase
    .from('questions_v2')
    .select('id, question_text, correct_answer, sub_skill, test_type, section_name, test_mode, created_at')
    .eq('sub_skill', 'Vocabulary in Context')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('❌ Query error:', error);
    process.exit(1);
  }

  console.log(`\n📋 Found ${data.length} "Vocabulary in Context" questions\n`);

  if (data.length === 0) {
    console.log('No questions found.');
    process.exit(0);
  }

  // Group by test + section
  const byTestSection = new Map<string, typeof data>();
  data.forEach(q => {
    const key = `${q.test_type} - ${q.section_name}`;
    if (!byTestSection.has(key)) {
      byTestSection.set(key, []);
    }
    byTestSection.get(key)!.push(q);
  });

  console.log(`Found questions in ${byTestSection.size} test/section combinations:\n`);

  let totalDuplicates = 0;

  byTestSection.forEach((questions, testSection) => {
    console.log('━'.repeat(80));
    console.log(`${testSection} (${questions.length} questions)`);
    console.log('━'.repeat(80));

    // Find duplicates by exact text match
    const textMap = new Map<string, typeof data>();
    questions.forEach(q => {
      const normalizedText = q.question_text.trim().toLowerCase();
      if (!textMap.has(normalizedText)) {
        textMap.set(normalizedText, []);
      }
      textMap.get(normalizedText)!.push(q);
    });

    // Show duplicates
    let duplicatesInThisSection = 0;
    textMap.forEach((qs, text) => {
      if (qs.length > 1) {
        duplicatesInThisSection++;
        totalDuplicates++;
        console.log(`\n🔴 DUPLICATE #${duplicatesInThisSection} (${qs.length} instances):`);
        console.log(`\nQuestion text (first 300 chars):`);
        console.log(qs[0].question_text.slice(0, 300) + (qs[0].question_text.length > 300 ? '...' : ''));
        console.log(`\nInstances:`);
        qs.forEach((q, i) => {
          console.log(`  ${i + 1}. ID: ${q.id}`);
          console.log(`     Mode: ${q.test_mode}`);
          console.log(`     Answer: ${q.correct_answer}`);
          console.log(`     Created: ${q.created_at}`);
        });
        console.log('');
      }
    });

    if (duplicatesInThisSection === 0) {
      console.log('✅ No duplicates found in this section\n');
    }
  });

  console.log('━'.repeat(80));
  console.log(`\n📊 Total duplicates found: ${totalDuplicates}\n`);

  // Also show all questions for context
  if (data.length <= 20) {
    console.log('\n📋 All Vocabulary in Context questions:\n');
    data.forEach((q, i) => {
      console.log(`${i + 1}. ${q.id.slice(0, 8)}... | ${q.test_type} - ${q.section_name}`);
      console.log(`   Mode: ${q.test_mode} | Answer: ${q.correct_answer}`);
      console.log(`   ${q.question_text.slice(0, 100)}...`);
      console.log('');
    });
  }
}

checkVocabDuplicates()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
  });
