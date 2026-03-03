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
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  test_type: string;
  sub_skill_id: string | null;
}

function extractOptionsAndCleanText(questionText: string): {
  cleanedText: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
} | null {
  // Try to match pattern: "A: text B: text C: text D: text"
  const colonPattern = /([^\n]*?)\s*A:\s*([^\n]+?)\s*B:\s*([^\n]+?)\s*C:\s*([^\n]+?)\s*D:\s*([^\n]+?)$/s;
  const colonMatch = questionText.match(colonPattern);

  if (colonMatch) {
    return {
      cleanedText: colonMatch[1].trim(),
      option_a: colonMatch[2].trim(),
      option_b: colonMatch[3].trim(),
      option_c: colonMatch[4].trim(),
      option_d: colonMatch[5].trim()
    };
  }

  // Try to match pattern: "A) text B) text C) text D) text"
  const parenPattern = /([^\n]*?)\s*A\)\s*([^\n]+?)\s*B\)\s*([^\n]+?)\s*C\)\s*([^\n]+?)\s*D\)\s*([^\n]+?)$/s;
  const parenMatch = questionText.match(parenPattern);

  if (parenMatch) {
    return {
      cleanedText: parenMatch[1].trim(),
      option_a: parenMatch[2].trim(),
      option_b: parenMatch[3].trim(),
      option_c: parenMatch[4].trim(),
      option_d: parenMatch[5].trim()
    };
  }

  // Try line-by-line pattern
  const lines = questionText.split('\n');
  const optionLines: { [key: string]: string } = {};
  let lastNonOptionLine = -1;

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    const optionMatch = trimmed.match(/^([A-D])[:\)]\s*(.+)$/);
    if (optionMatch) {
      optionLines[optionMatch[1]] = optionMatch[2].trim();
    } else if (trimmed) {
      lastNonOptionLine = idx;
    }
  });

  if (optionLines['A'] && optionLines['B'] && optionLines['C'] && optionLines['D']) {
    const cleanedLines = lines.slice(0, lastNonOptionLine + 1);
    return {
      cleanedText: cleanedLines.join('\n').trim(),
      option_a: optionLines['A'],
      option_b: optionLines['B'],
      option_c: optionLines['C'],
      option_d: optionLines['D']
    };
  }

  return null;
}

async function fixEmbeddedOptions(dryRun = true) {
  console.log('🔧 Fixing NAPLAN Language Conventions questions with embedded options...\n');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE (will update database)'}\n`);

  // Read the exported questions
  if (!fs.existsSync('embedded-options-naplan.json')) {
    console.error('❌ Error: embedded-options-naplan.json not found. Run find-embedded-options-naplan.ts first.');
    return;
  }

  const questionsData = JSON.parse(fs.readFileSync('embedded-options-naplan.json', 'utf-8'));
  console.log(`📊 Processing ${questionsData.length} questions with embedded options\n`);

  const fixes: QuestionFix[] = [];
  const failed: any[] = [];

  for (const q of questionsData) {
    const extracted = extractOptionsAndCleanText(q.question_text);

    if (extracted) {
      fixes.push({
        id: q.id,
        original_question_text: q.question_text,
        new_question_text: extracted.cleanedText,
        option_a: extracted.option_a,
        option_b: extracted.option_b,
        option_c: extracted.option_c,
        option_d: extracted.option_d,
        test_type: q.test_type,
        sub_skill_id: q.sub_skill_id
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
      console.log(`Question: ${q.question_text.substring(0, 200)}...`);
    });
  }

  // Show sample fixes
  console.log('\n📋 Sample fixes:\n');
  fixes.slice(0, 3).forEach((fix, idx) => {
    console.log(`${'='.repeat(80)}`);
    console.log(`Example ${idx + 1} (ID: ${fix.id})`);
    console.log(`\nORIGINAL question_text:`);
    console.log(fix.original_question_text);
    console.log(`\nNEW question_text:`);
    console.log(fix.new_question_text);
    console.log(`\nExtracted options:`);
    console.log(`A: ${fix.option_a}`);
    console.log(`B: ${fix.option_b}`);
    console.log(`C: ${fix.option_c}`);
    console.log(`D: ${fix.option_d}`);
    console.log(`${'='.repeat(80)}\n`);
  });

  // Save backup
  console.log(`💾 Saving backup to embedded-options-backup.json`);
  fs.writeFileSync('embedded-options-backup.json', JSON.stringify(fixes, null, 2));

  if (!dryRun) {
    console.log('\n🚀 Applying fixes to database...\n');

    let successCount = 0;
    let errorCount = 0;

    for (const fix of fixes) {
      const { error } = await supabase
        .from('questions_v2')
        .update({
          question_text: fix.new_question_text,
          option_a: fix.option_a,
          option_b: fix.option_b,
          option_c: fix.option_c,
          option_d: fix.option_d
        })
        .eq('id', fix.id);

      if (error) {
        console.error(`❌ Error updating ${fix.id}:`, error.message);
        errorCount++;
      } else {
        successCount++;
        if (successCount % 10 === 0) {
          console.log(`  Updated ${successCount}/${fixes.length} questions...`);
        }
      }
    }

    console.log(`\n✅ Successfully updated: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
  } else {
    console.log('\n⚠️  DRY RUN MODE - No changes were made to the database');
    console.log('To apply these fixes, run: npx tsx scripts/fix-embedded-options-naplan.ts --live');
  }

  console.log('\n📊 Summary:');
  console.log(`- Questions processed: ${questionsData.length}`);
  console.log(`- Successfully parsed: ${fixes.length}`);
  console.log(`- Failed to parse: ${failed.length}`);
  console.log(`- Backup saved to: embedded-options-backup.json`);
}

// Check command line args
const isLive = process.argv.includes('--live');
fixEmbeddedOptions(!isLive);
