import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

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

// Function to remove embedded options from question text
function removeEmbeddedOptions(questionText: string): string {
  // Patterns that indicate where options start
  const optionStartPatterns = [
    /\n\n[aA]\)\s+/,  // Double newline then a)
    /\n[aA]\)\s+/,    // Single newline then a)
    /\n\n[aA]\.\s+/,  // Double newline then a.
    /\n[aA]\.\s+/,    // Single newline then a.
  ];

  let earliestIndex = questionText.length;

  // Find the earliest position where options start
  for (const pattern of optionStartPatterns) {
    const match = questionText.match(pattern);
    if (match && match.index !== undefined && match.index < earliestIndex) {
      earliestIndex = match.index;
    }
  }

  // If we found options, trim the text there
  if (earliestIndex < questionText.length) {
    return questionText.substring(0, earliestIndex).trim();
  }

  return questionText.trim();
}

async function fixEmbeddedOptions(dryRun: boolean = true) {
  console.log(`Running in ${dryRun ? 'DRY RUN' : 'LIVE'} mode...\n`);

  // Question IDs from our analysis
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

  console.log(`Found ${questions?.length || 0} questions to fix\n`);

  const updates: Array<{ id: string; oldText: string; newText: string }> = [];

  // Process each question
  for (const q of questions as Question[]) {
    const cleanedText = removeEmbeddedOptions(q.question_text);

    if (cleanedText !== q.question_text) {
      updates.push({
        id: q.id,
        oldText: q.question_text,
        newText: cleanedText
      });
    }
  }

  // Show preview of changes
  console.log('Preview of changes:');
  console.log('===================\n');

  for (let i = 0; i < Math.min(5, updates.length); i++) {
    const update = updates[i];
    console.log(`Question ID: ${update.id}`);
    console.log('\nOLD TEXT:');
    console.log('─'.repeat(80));
    console.log(update.oldText);
    console.log('\nNEW TEXT:');
    console.log('─'.repeat(80));
    console.log(update.newText);
    console.log('\n' + '═'.repeat(80) + '\n');
  }

  if (updates.length > 5) {
    console.log(`... and ${updates.length - 5} more questions\n`);
  }

  // Save to backup file
  const backupData = updates.map(u => ({
    id: u.id,
    oldText: u.oldText,
    newText: u.newText
  }));

  fs.writeFileSync(
    'embedded-options-backup.json',
    JSON.stringify(backupData, null, 2)
  );
  console.log('Backup saved to: embedded-options-backup.json\n');

  // Apply updates if not dry run
  if (!dryRun) {
    console.log('Applying updates to Supabase...\n');

    let successCount = 0;
    let errorCount = 0;

    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('questions_v2')
        .update({ question_text: update.newText })
        .eq('id', update.id);

      if (updateError) {
        console.error(`Error updating ${update.id}:`, updateError);
        errorCount++;
      } else {
        successCount++;
      }
    }

    console.log(`\nResults:`);
    console.log(`✓ Successfully updated: ${successCount} questions`);
    if (errorCount > 0) {
      console.log(`✗ Errors: ${errorCount} questions`);
    }
  } else {
    console.log('DRY RUN - No changes were made to the database.');
    console.log('To apply these changes, run: npx tsx scripts/fix-embedded-options.ts --apply');
  }

  console.log(`\nTotal questions to update: ${updates.length}`);
}

// Check for --apply flag
const applyChanges = process.argv.includes('--apply');
fixEmbeddedOptions(!applyChanges);
