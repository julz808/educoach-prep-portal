/**
 * Find all vocabulary-related questions
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function findVocabQuestions() {
  console.log('\n🔍 Searching for vocabulary questions...\n');

  // First, get all distinct sub-skills that contain "vocab"
  const { data: allQuestions, error: allError } = await supabase
    .from('questions_v2')
    .select('sub_skill')
    .ilike('sub_skill', '%vocab%')
    .limit(1000);

  if (allError) {
    console.error('❌ Query error:', allError);
    process.exit(1);
  }

  const uniqueSubSkills = [...new Set(allQuestions?.map(q => q.sub_skill) || [])];
  console.log(`Found ${uniqueSubSkills.length} sub-skill(s) containing "vocab":`);
  uniqueSubSkills.forEach(s => console.log(`  - "${s}"`));
  console.log('');

  // Now get all questions for those specific IDs mentioned
  const { data: specificQuestions, error: specificError } = await supabase
    .from('questions_v2')
    .select('id, question_text, correct_answer, sub_skill, test_type, section_name, test_mode, created_at')
    .in('id', [
      'f9d89cbd-c775-4acd-a812-62d61436273c',
      '6d817aa7-bca4-473f-b397-dc626d313731',
      '28cac31f-4f4d-4a00-be8c-f417b9dc36f2',
      '4a7d3fa3-4660-4584-82ec-4342349be6d5'
    ]);

  if (specificError) {
    console.error('❌ Query error:', specificError);
  } else {
    console.log(`\n📋 Found ${specificQuestions?.length || 0} questions with those specific IDs\n`);

    specificQuestions?.forEach(q => {
      console.log('━'.repeat(80));
      console.log(`ID: ${q.id}`);
      console.log(`Test: ${q.test_type}`);
      console.log(`Section: ${q.section_name}`);
      console.log(`Sub-skill: ${q.sub_skill}`);
      console.log(`Mode: ${q.test_mode}`);
      console.log(`Created: ${q.created_at}`);
      console.log(`\nQuestion:\n${q.question_text.slice(0, 500)}`);
      console.log(`\nAnswer: ${q.correct_answer}`);
      console.log('');
    });
  }

  // Also try getting recent questions from questions_v2 in general
  const { data: recentQuestions, error: recentError } = await supabase
    .from('questions_v2')
    .select('id, sub_skill, test_type, section_name, created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  if (recentError) {
    console.error('❌ Query error:', recentError);
  } else {
    console.log(`\n📋 Last 20 questions in questions_v2 table:\n`);
    recentQuestions?.forEach((q, i) => {
      console.log(`${i + 1}. ${q.id.slice(0, 8)}... | ${q.test_type} - ${q.section_name} - ${q.sub_skill}`);
      console.log(`   Created: ${q.created_at}`);
    });
  }
}

findVocabQuestions()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
  });
