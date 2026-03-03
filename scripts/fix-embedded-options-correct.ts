import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface QuestionFix {
  id: string;
  original_question_text: string;
  new_question_text: string;
  answer_options: string[];
  test_type: string;
}

function removeEmbeddedOptions(questionText: string): string | null {
  // Try to remove pattern: "A: text B: text C: text D: text" at the end
  let cleaned = questionText;

  // Pattern 1: Remove "A: ... B: ... C: ... D: ..." on one line
  cleaned = cleaned.replace(/\s*[A-D]:\s+[^\n]+?\s+[A-D]:\s+[^\n]+?\s+[A-D]:\s+[^\n]+?\s+[A-D]:\s+[^\n]+?$/s, '');

  // Pattern 2: Remove "A) ... B) ... C) ... D) ..." on one line
  cleaned = cleaned.replace(/\s*[A-D]\)\s+[^\n]+?\s+[A-D]\)\s+[^\n]+?\s+[A-D]\)\s+[^\n]+?\s+[A-D]\)\s+[^\n]+?$/s, '');

  // Pattern 3: Remove line-by-line options at the end
  const lines = cleaned.split('\n');
  let lastNonOptionLine = lines.length - 1;

  // Find where options start (from the end)
  for (let i = lines.length - 1; i >= 0; i--) {
    const trimmed = lines[i].trim();
    // Check if this line is an option line
    if (/^[A-D][:\)]\s+/.test(trimmed)) {
      continue; // This is an option line, keep looking
    } else if (trimmed) {
      // Found a non-option line
      lastNonOptionLine = i;
      break;
    }
  }

  // Reconstruct without the option lines
  const cleanedLines = lines.slice(0, lastNonOptionLine + 1);
  cleaned = cleanedLines.join('\n').trim();

  // Only return if we actually removed something
  if (cleaned !== questionText.trim()) {
    return cleaned;
  }

  return null;
}

async function fixEmbeddedOptions(dryRun = true) {
  console.log('🔧 Fixing NAPLAN Language Conventions questions with embedded options...\n');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE (will update database)'}\n`);

  // Query questions with embedded options
  const { data: year5, error: error5 } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('test_type', 'Year 5 NAPLAN')
    .eq('section_name', 'Language Conventions');

  const { data: year7, error: error7 } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('test_type', 'Year 7 NAPLAN')
    .eq('section_name', 'Language Conventions');

  if (error5 || error7) {
    console.error('Error fetching questions:', error5 || error7);
    return;
  }

  const allQuestions = [...(year5 || []), ...(year7 || [])];

  // Find questions that have "A:" "B:" "C:" "D:" pattern in question_text
  const questionsWithEmbeddedOptions = allQuestions.filter(q => {
    const text = q.question_text || '';
    const hasA = /[^\w]A[:\)]\s+/g.test(text);
    const hasB = /[^\w]B[:\)]\s+/g.test(text);
    const hasC = /[^\w]C[:\)]\s+/g.test(text);
    const hasD = /[^\w]D[:\)]\s+/g.test(text);
    const optionCount = [hasA, hasB, hasC, hasD].filter(Boolean).length;
    return optionCount >= 3;
  });

  console.log(`📊 Found ${questionsWithEmbeddedOptions.length} questions with embedded options\n`);

  const fixes: QuestionFix[] = [];
  const failed: any[] = [];

  for (const q of questionsWithEmbeddedOptions) {
    const cleaned = removeEmbeddedOptions(q.question_text);

    if (cleaned) {
      fixes.push({
        id: q.id,
        original_question_text: q.question_text,
        new_question_text: cleaned,
        answer_options: q.answer_options,
        test_type: q.test_type
      });
    } else {
      failed.push(q);
    }
  }

  console.log(`✅ Successfully parsed: ${fixes.length}`);
  console.log(`❌ Failed to parse: ${failed.length}\n`);

  if (failed.length > 0) {
    console.log('Failed questions:');
    failed.forEach((q, idx) => {
      console.log(`\n${idx + 1}. ID: ${q.id}`);
      console.log(`Question: ${q.question_text}`);
    });
  }

  // Show sample fixes
  console.log('\n📋 Sample fixes:\n');
  fixes.slice(0, 5).forEach((fix, idx) => {
    console.log(`${'='.repeat(80)}`);
    console.log(`Example ${idx + 1} (ID: ${fix.id})`);
    console.log(`Test Type: ${fix.test_type}`);
    console.log(`\nORIGINAL question_text:`);
    console.log(fix.original_question_text);
    console.log(`\nNEW question_text:`);
    console.log(fix.new_question_text);
    console.log(`\nExisting answer_options (unchanged):`);
    fix.answer_options.forEach(opt => console.log(`  ${opt}`));
    console.log(`${'='.repeat(80)}\n`);
  });

  // Save backup
  console.log(`💾 Saving backup to embedded-options-backup-v2.json`);
  fs.writeFileSync('embedded-options-backup-v2.json', JSON.stringify(fixes, null, 2));

  if (!dryRun) {
    console.log('\n🚀 Applying fixes to database...\n');

    let successCount = 0;
    let errorCount = 0;

    for (const fix of fixes) {
      const { error } = await supabase
        .from('questions_v2')
        .update({
          question_text: fix.new_question_text
        })
        .eq('id', fix.id);

      if (error) {
        console.error(`❌ Error updating ${fix.id}:`, error.message);
        errorCount++;
      } else {
        successCount++;
        if (successCount % 20 === 0) {
          console.log(`  Updated ${successCount}/${fixes.length} questions...`);
        }
      }
    }

    console.log(`\n✅ Successfully updated: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
  } else {
    console.log('\n⚠️  DRY RUN MODE - No changes were made to the database');
    console.log('To apply these fixes, run: npx tsx scripts/fix-embedded-options-correct.ts --live');
  }

  console.log('\n📊 Summary:');
  console.log(`- Total Language Conventions questions: ${allQuestions.length}`);
  console.log(`- Questions with embedded options: ${questionsWithEmbeddedOptions.length}`);
  console.log(`- Successfully parsed: ${fixes.length}`);
  console.log(`- Failed to parse: ${failed.length}`);
  console.log(`- Backup saved to: embedded-options-backup-v2.json`);
}

// Check command line args
const isLive = process.argv.includes('--live');
fixEmbeddedOptions(!isLive);
