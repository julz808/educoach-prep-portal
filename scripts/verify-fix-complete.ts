import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyFixes() {
  console.log('🔍 Verifying embedded options fix...\n');

  // Read the backup to get the IDs we fixed
  const backup = JSON.parse(fs.readFileSync('embedded-options-backup-v2.json', 'utf-8'));
  console.log(`📊 Checking ${backup.length} fixed questions...\n`);

  // Get the first few fixed questions to verify
  const sampleIds = backup.slice(0, 5).map((q: any) => q.id);

  const { data: verifyQuestions, error } = await supabase
    .from('questions_v2')
    .select('id, test_type, question_text, answer_options, correct_answer')
    .in('id', sampleIds);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('✅ Sample verified questions:\n');

  verifyQuestions?.forEach((q, idx) => {
    console.log(`${'='.repeat(80)}`);
    console.log(`Question ${idx + 1} (ID: ${q.id})`);
    console.log(`Test Type: ${q.test_type}`);
    console.log(`\nQuestion Text:`);
    console.log(q.question_text);
    console.log(`\nAnswer Options:`);
    q.answer_options.forEach((opt: string) => console.log(`  ${opt}`));
    console.log(`\nCorrect Answer: ${q.correct_answer}`);

    // Check if embedded options are still present
    const hasEmbeddedOptions = /[A-D][:\)]\s+\w+.*[A-D][:\)]\s+\w+/.test(q.question_text);
    console.log(`\n❌ Still has embedded options: ${hasEmbeddedOptions ? 'YES (PROBLEM!)' : 'NO ✓'}`);
    console.log(`${'='.repeat(80)}\n`);
  });

  // Now check if there are ANY remaining questions with embedded options
  console.log('🔍 Checking for any remaining questions with embedded options...\n');

  const { data: year5 } = await supabase
    .from('questions_v2')
    .select('id, question_text, test_type')
    .eq('test_type', 'Year 5 NAPLAN')
    .eq('section_name', 'Language Conventions');

  const { data: year7 } = await supabase
    .from('questions_v2')
    .select('id, question_text, test_type')
    .eq('test_type', 'Year 7 NAPLAN')
    .eq('section_name', 'Language Conventions');

  const allQuestions = [...(year5 || []), ...(year7 || [])];

  const stillHasEmbedded = allQuestions.filter(q => {
    const text = q.question_text || '';
    const hasA = /[^\w]A[:\)]\s+/g.test(text);
    const hasB = /[^\w]B[:\)]\s+/g.test(text);
    const hasC = /[^\w]C[:\)]\s+/g.test(text);
    const hasD = /[^\w]D[:\)]\s+/g.test(text);
    const optionCount = [hasA, hasB, hasC, hasD].filter(Boolean).length;
    return optionCount >= 3;
  });

  console.log(`📊 Total Language Conventions questions: ${allQuestions.length}`);
  console.log(`❌ Questions still with embedded options: ${stillHasEmbedded.length}`);

  if (stillHasEmbedded.length > 0) {
    console.log('\n⚠️  WARNING: Found questions that still have embedded options:');
    stillHasEmbedded.slice(0, 3).forEach((q, idx) => {
      console.log(`\n${idx + 1}. ID: ${q.id} (${q.test_type})`);
      console.log(`Question: ${q.question_text.substring(0, 200)}...`);
    });
  } else {
    console.log('\n✅ SUCCESS! No questions have embedded options in question_text anymore.');
  }

  console.log('\n📊 Summary:');
  console.log(`- Questions fixed: ${backup.length}`);
  console.log(`- Questions verified: ${verifyQuestions?.length || 0}`);
  console.log(`- Remaining issues: ${stillHasEmbedded.length}`);
  console.log(`- Fix successful: ${stillHasEmbedded.length === 0 ? '✅ YES' : '❌ NO'}`);
}

verifyFixes();
