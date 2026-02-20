/**
 * Check production database using service role key (bypasses RLS)
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!serviceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env');
  process.exit(1);
}

// Create client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkWithServiceRole() {
  console.log('\n🔍 Checking production database with service role key...\n');

  // Check total count
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
    console.log('⚠️  No questions found with those IDs.\n');

    // Search for vocabulary questions
    const { data: vocabQuestions, error: vocabError } = await supabase
      .from('questions_v2')
      .select('id, question_text, correct_answer, sub_skill, test_type, section_name, test_mode, created_at')
      .ilike('sub_skill', '%vocab%')
      .order('created_at', { ascending: false })
      .limit(100);

    if (vocabError) {
      console.error('❌ Query error:', vocabError);
      process.exit(1);
    }

    console.log(`Found ${vocabQuestions.length} vocabulary-related questions.\n`);

    // Group by exact question text to find duplicates
    const textMap = new Map<string, typeof vocabQuestions>();
    vocabQuestions.forEach(q => {
      const normalized = q.question_text.trim();
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
        console.log(`\nQuestion text (first 500 chars):\n${questions[0].question_text.slice(0, 500)}`);
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
    // Show the specific questions found
    specificQuestions.forEach((q, i) => {
      console.log('━'.repeat(80));
      console.log(`Question ${i + 1}:`);
      console.log(`ID: ${q.id}`);
      console.log(`Test: ${q.test_type}`);
      console.log(`Section: ${q.section_name}`);
      console.log(`Sub-skill: ${q.sub_skill}`);
      console.log(`Mode: ${q.test_mode}`);
      console.log(`Created: ${q.created_at}`);
      console.log(`\nQuestion:\n${q.question_text}`);
      console.log(`\nAnswer: ${q.correct_answer}`);
      console.log('');
    });

    // Check pairs for duplicates
    if (specificQuestions.length >= 2) {
      console.log('━'.repeat(80));
      console.log('DUPLICATE ANALYSIS:');
      console.log('━'.repeat(80));

      for (let i = 0; i < specificQuestions.length - 1; i += 2) {
        const q1 = specificQuestions[i];
        const q2 = specificQuestions[i + 1];
        const identical = q1.question_text === q2.question_text;
        console.log(`\nPair ${i/2 + 1}: ${identical ? '🔴 EXACT DUPLICATES' : '✅ Different questions'}`);
        if (identical) {
          console.log(`  Both IDs: ${q1.id} & ${q2.id}`);
        }
      }
    }
  }

  console.log('\n');
}

checkWithServiceRole()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
  });
