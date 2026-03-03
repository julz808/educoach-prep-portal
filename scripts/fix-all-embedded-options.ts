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
}

// Function to remove embedded options from question text
function removeEmbeddedOptions(questionText: string): string {
  // Remove patterns like:
  // A) text
  // B) text
  // C) text
  // D) text
  // E) text

  // Find where options start (usually after a blank line or at the start of option A)
  const patterns = [
    /\n\n[A-E]\)\s+/,  // Double newline before options
    /\n[A-E]\)\s+/,    // Single newline before options
  ];

  let earliestIndex = questionText.length;

  // Find the earliest position where "A)" appears (start of options)
  const optionAMatch = questionText.match(/\n\s*A\)\s+/);
  if (optionAMatch && optionAMatch.index !== undefined) {
    earliestIndex = optionAMatch.index;
  }

  // If we found the start of options, trim everything from there
  if (earliestIndex < questionText.length) {
    return questionText.substring(0, earliestIndex).trim();
  }

  return questionText.trim();
}

async function fixEmbeddedOptions(dryRun: boolean = true) {
  console.log('FIX EMBEDDED OPTIONS IN QUESTION TEXT');
  console.log('='.repeat(80));
  console.log(`Mode: ${dryRun ? 'DRY RUN (preview only)' : 'LIVE (will apply changes)'}\n`);

  // Load the audit report to get question IDs
  const reportPath = 'comprehensive-audit-report.json';

  if (!fs.existsSync(reportPath)) {
    console.error('Error: comprehensive-audit-report.json not found!');
    console.error('Please run: npx tsx scripts/comprehensive-all-questions-audit.ts first');
    return;
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
  const questionIds = report.embeddedOptionsQuestionIds;

  console.log(`Found ${questionIds.length} questions with embedded options\n`);

  if (questionIds.length === 0) {
    console.log('No questions to fix!');
    return;
  }

  // Fetch these questions in batches
  const batchSize = 100;
  const allUpdates: Array<{ id: string; oldText: string; newText: string }> = [];

  for (let i = 0; i < questionIds.length; i += batchSize) {
    const batch = questionIds.slice(i, i + batchSize);

    const { data: questions, error } = await supabase
      .from('questions_v2')
      .select('id, question_text, answer_options')
      .in('id', batch);

    if (error) {
      console.error('Error fetching questions:', error);
      continue;
    }

    for (const q of questions as Question[]) {
      const cleanedText = removeEmbeddedOptions(q.question_text);

      if (cleanedText !== q.question_text && cleanedText.length > 10) {
        allUpdates.push({
          id: q.id,
          oldText: q.question_text,
          newText: cleanedText
        });
      }
    }
  }

  console.log(`Prepared ${allUpdates.length} updates\n`);

  // Show preview
  console.log('PREVIEW OF CHANGES (first 5):');
  console.log('='.repeat(80));

  for (let i = 0; i < Math.min(5, allUpdates.length); i++) {
    const update = allUpdates[i];
    console.log(`\nQuestion ID: ${update.id}`);
    console.log('\nOLD (length: ' + update.oldText.length + ' chars):');
    console.log('-'.repeat(80));
    console.log(update.oldText.substring(0, 400));
    if (update.oldText.length > 400) console.log('...');

    console.log('\nNEW (length: ' + update.newText.length + ' chars):');
    console.log('-'.repeat(80));
    console.log(update.newText.substring(0, 400));
    if (update.newText.length > 400) console.log('...');
    console.log('\n' + '='.repeat(80));
  }

  if (allUpdates.length > 5) {
    console.log(`\n... and ${allUpdates.length - 5} more questions\n`);
  }

  // Save backup
  const backupData = {
    timestamp: new Date().toISOString(),
    totalUpdates: allUpdates.length,
    updates: allUpdates.map(u => ({
      id: u.id,
      oldText: u.oldText,
      newText: u.newText
    }))
  };

  fs.writeFileSync('backup-embedded-options-fix.json', JSON.stringify(backupData, null, 2));
  console.log('✓ Backup saved to: backup-embedded-options-fix.json\n');

  // Apply updates if not dry run
  if (!dryRun) {
    console.log('Applying updates to database...\n');

    let successCount = 0;
    let errorCount = 0;

    for (const update of allUpdates) {
      const { error } = await supabase
        .from('questions_v2')
        .update({ question_text: update.newText })
        .eq('id', update.id);

      if (error) {
        console.error(`Error updating ${update.id}:`, error.message);
        errorCount++;
      } else {
        successCount++;
        if (successCount % 50 === 0) {
          console.log(`Progress: ${successCount}/${allUpdates.length} questions updated...`);
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('RESULTS:');
    console.log('='.repeat(80));
    console.log(`✓ Successfully updated: ${successCount} questions`);
    if (errorCount > 0) {
      console.log(`✗ Errors: ${errorCount} questions`);
    }
    console.log('='.repeat(80));
  } else {
    console.log('='.repeat(80));
    console.log('DRY RUN COMPLETE - No changes were made to the database.');
    console.log('To apply these changes, run:');
    console.log('  npx tsx scripts/fix-all-embedded-options.ts --apply');
    console.log('='.repeat(80));
  }

  console.log(`\nTotal questions to fix: ${allUpdates.length}`);
}

// Check for --apply flag
const applyChanges = process.argv.includes('--apply');
fixEmbeddedOptions(!applyChanges);
