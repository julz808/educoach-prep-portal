import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Question {
  id: string;
  question_text: string;
  answer_options: string[];
  test_type: string;
  section_name: string;
}

async function verifyFix() {
  console.log('Verifying embedded options fix...\n');

  // The 22 question IDs we fixed
  const questionIds = [
    '0a40b9fc-8e25-4e82-b27b-4cf5f35ae112',
    '152c7421-5a4a-4fd2-a213-d33e89d78119',
    '090da1bc-6e7d-4d31-b5b8-89615590f1b9',
    '9f9fee93-7747-4b6b-ac8e-83f947345b60',
    '7f410856-21cb-444c-9118-1d4a5aa6d8d2',
    '6db49112-92ba-4ade-91cd-4aebf8c4a9f8',
    '2d60c9fd-66f0-45ac-94e3-9815cd927d94',
    'b8088cbb-0682-40f7-aa7e-4f86caeef856',
    'f9feb86f-8a0a-4e53-8523-76a6f9c29b3c',
    'be33be72-c509-4f53-b014-a263b2b81315',
    'af174d70-b5f5-49ce-9dfc-ad19b0df1f62',
    '672f71b4-472a-4b9e-996c-4b5e0edd5459',
    '42b976cb-cacf-4e5c-912b-8403baac5bfd',
    'fcbfa39d-c352-4f3a-90be-fca5e51250bf',
    'afdeee9a-f621-4878-b93e-c25b7b114e99',
    '5f96a971-5176-4a8b-b348-59f2f97ce70e',
    'bf87c0f8-1566-4555-a44b-cd9398ae3013',
    'bf4aa950-d30f-4a84-bc71-3f7e93899467',
    'ae321a4d-2b5e-4aaf-9ce6-c229723da83b',
    '47359181-ab25-44de-9db7-5ee5e02693d9',
    'a3e0261a-a6e8-4989-9084-e3bdcaeecb9c',
    '48c1a39a-b75f-4875-b38e-d6b4791ca33e'
  ];

  // Fetch all these questions
  const { data: questions, error } = await supabase
    .from('questions_v2')
    .select('id, question_text, answer_options, test_type, section_name')
    .in('id', questionIds);

  if (error) {
    console.error('Error fetching questions:', error);
    return;
  }

  console.log(`Retrieved ${questions?.length || 0} questions\n`);

  // Patterns that indicate options are still embedded
  const patterns = [
    /\n[aA]\)/, // a) or A)
    /\n[aA]\./, // a. or A.
    /\([aA]\)/, // (a)
  ];

  let stillHasIssues = 0;
  let fixed = 0;
  const problematicOnes: Question[] = [];

  for (const q of questions as Question[]) {
    const text = q.question_text || '';

    // Check if any pattern matches
    const hasEmbeddedOptions = patterns.some(pattern => pattern.test(text));

    // Also check if the text contains what looks like multiple choice options
    const hasMultipleOptions = (text.match(/\n[aA-eE][\)\.]/g) || []).length >= 2;

    if (hasEmbeddedOptions || hasMultipleOptions) {
      stillHasIssues++;
      problematicOnes.push(q);
    } else {
      fixed++;
    }
  }

  console.log('VERIFICATION RESULTS:');
  console.log('='.repeat(60));
  console.log(`✓ Fixed successfully: ${fixed} questions`);
  console.log(`✗ Still have issues: ${stillHasIssues} questions`);
  console.log('='.repeat(60));
  console.log();

  if (stillHasIssues > 0) {
    console.log('⚠️  Questions that still have embedded options:\n');
    for (const q of problematicOnes) {
      console.log(`ID: ${q.id}`);
      console.log(`Test: ${q.test_type} - ${q.section_name}`);
      console.log(`Question text (first 300 chars):`);
      console.log(q.question_text.substring(0, 300));
      console.log('\n---\n');
    }
  } else {
    console.log('✅ ALL QUESTIONS FIXED SUCCESSFULLY!\n');
    console.log('Sample of fixed questions:');
    console.log('='.repeat(60));

    // Show a few examples
    for (let i = 0; i < Math.min(3, questions.length); i++) {
      const q = questions[i] as Question;
      console.log(`\n${i + 1}. ID: ${q.id}`);
      console.log(`   Test: ${q.test_type} - ${q.section_name}`);
      console.log(`\n   Question text:`);
      console.log(`   ${q.question_text.substring(0, 200)}${q.question_text.length > 200 ? '...' : ''}`);
      console.log(`\n   Answer options (${q.answer_options.length} options):`);
      console.log(`   ${q.answer_options.slice(0, 2).join(', ')}...`);
      console.log();
    }
  }

  // Also do a full database scan to make sure no other questions have this issue
  console.log('\n' + '='.repeat(60));
  console.log('Scanning entire database for any remaining issues...');
  console.log('='.repeat(60) + '\n');

  const { data: allQuestions, error: allError } = await supabase
    .from('questions_v2')
    .select('id, question_text, test_type, section_name');

  if (allError) {
    console.error('Error scanning all questions:', allError);
    return;
  }

  let otherIssues = 0;
  const otherProblematic: any[] = [];

  for (const q of allQuestions as any[]) {
    if (questionIds.includes(q.id)) continue; // Skip the ones we already fixed

    const text = q.question_text || '';
    const hasEmbeddedOptions = patterns.some(pattern => pattern.test(text));
    const hasMultipleOptions = (text.match(/\n[aA-eE][\)\.]/g) || []).length >= 2;

    if (hasEmbeddedOptions || hasMultipleOptions) {
      otherIssues++;
      if (otherProblematic.length < 3) {
        otherProblematic.push(q);
      }
    }
  }

  if (otherIssues > 0) {
    console.log(`⚠️  Found ${otherIssues} OTHER questions with embedded options!\n`);
    console.log('Examples:');
    for (const q of otherProblematic) {
      console.log(`\nID: ${q.id}`);
      console.log(`Test: ${q.test_type} - ${q.section_name}`);
      console.log(q.question_text.substring(0, 200));
      console.log('---');
    }
  } else {
    console.log('✅ No other questions found with embedded options in the entire database!');
  }

  console.log(`\nTotal questions in database: ${allQuestions.length}`);
}

verifyFix();
