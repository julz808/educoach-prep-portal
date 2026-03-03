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
  passage_id: string;
}

interface Passage {
  id: string;
  content: string;
  title: string;
}

// Function to extract just the question from text that includes passage
function extractQuestionOnly(questionText: string, passageContent: string, passageTitle: string): string {
  // Common patterns where the actual question starts:
  // 1. After "Passage: [title]" and the passage content
  // 2. After "Read the passage and answer the question."
  // 3. Question usually ends with "?"

  let cleanedText = questionText;

  // Remove "Read the passage and answer the question." prefix
  cleanedText = cleanedText.replace(/^Read the passage and answer the question\.\s*/i, '');
  cleanedText = cleanedText.replace(/^Read the passage and answer\.\s*/i, '');

  // Try to find where passage content starts
  const passageStartPatterns = [
    /Passage:\s*\n/i,
    /Passage:\s*Title:/i,
    /\nPassage:/i,
  ];

  for (const pattern of passageStartPatterns) {
    if (pattern.test(cleanedText)) {
      // Find the actual question after the passage
      // Usually the question comes after the passage content

      // Try to find a sentence that ends with "?" after some content
      const lines = cleanedText.split('\n');
      let foundPassageEnd = false;
      let questionLines: string[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Skip passage header lines
        if (line.match(/^Passage:/i) || line.match(/^Title:/i)) {
          continue;
        }

        // Check if this line might be part of the passage content
        if (!foundPassageEnd && passageContent.includes(line.substring(0, 50))) {
          continue;
        }

        // If we've moved past passage content, start collecting question
        foundPassageEnd = true;
        if (line.length > 0) {
          questionLines.push(line);
        }

        // If we found a line ending with ?, likely the end of the question
        if (line.endsWith('?')) {
          break;
        }
      }

      if (questionLines.length > 0) {
        return questionLines.join(' ').trim();
      }
    }
  }

  // Alternative approach: If passage content is directly in the text, remove it
  if (passageContent.length > 100) {
    const passageStart = passageContent.substring(0, 100);
    const passageIndex = cleanedText.indexOf(passageStart);

    if (passageIndex !== -1) {
      // Find where passage ends (approximately)
      const afterPassage = cleanedText.substring(passageIndex + passageContent.length);

      // The question is what comes after the passage
      const questionMatch = afterPassage.match(/([A-Z].*?\?)/);
      if (questionMatch) {
        return questionMatch[1].trim();
      }

      // Otherwise take the first substantial sentence after passage
      const sentences = afterPassage.split(/[.!?]\s+/);
      for (const sent of sentences) {
        if (sent.trim().length > 20) {
          return sent.trim();
        }
      }
    }
  }

  // If all else fails, try to find the last question sentence
  const sentences = cleanedText.split(/[.!?]\s+/);
  for (let i = sentences.length - 1; i >= 0; i--) {
    const sent = sentences[i].trim();
    if (sent.length > 10 && !passageContent.includes(sent.substring(0, 30))) {
      return sent + (sent.endsWith('?') ? '' : '?');
    }
  }

  // Last resort: return the original text
  return questionText;
}

async function fixDuplicatePassages(dryRun: boolean = true) {
  console.log('FIX DUPLICATE PASSAGES IN QUESTION TEXT');
  console.log('='.repeat(80));
  console.log(`Mode: ${dryRun ? 'DRY RUN (preview only)' : 'LIVE (will apply changes)'}\n`);

  // Load the audit report
  const reportPath = 'comprehensive-audit-report.json';

  if (!fs.existsSync(reportPath)) {
    console.error('Error: comprehensive-audit-report.json not found!');
    console.error('Please run: npx tsx scripts/comprehensive-all-questions-audit.ts first');
    return;
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
  const questionIds = report.duplicatePassageQuestionIds;

  console.log(`Found ${questionIds.length} questions with duplicate passages\n`);

  if (questionIds.length === 0) {
    console.log('No questions to fix!');
    return;
  }

  // Get unique passage IDs first
  const batchSize = 100;
  const passageIds = new Set<string>();

  for (let i = 0; i < questionIds.length; i += batchSize) {
    const batch = questionIds.slice(i, i + batchSize);

    const { data: questions } = await supabase
      .from('questions_v2')
      .select('passage_id')
      .in('id', batch);

    if (questions) {
      questions.forEach((q: any) => {
        if (q.passage_id) passageIds.add(q.passage_id);
      });
    }
  }

  // Fetch all needed passages
  console.log(`Fetching ${passageIds.size} unique passages...\n`);

  const passageMap = new Map<string, Passage>();
  const passageIdArray = Array.from(passageIds);

  for (let i = 0; i < passageIdArray.length; i += batchSize) {
    const batch = passageIdArray.slice(i, i + batchSize);

    const { data: passages } = await supabase
      .from('passages_v2')
      .select('id, content, title')
      .in('id', batch);

    if (passages) {
      passages.forEach((p: any) => {
        passageMap.set(p.id, p);
      });
    }
  }

  console.log(`Loaded ${passageMap.size} passages\n`);

  // Now process questions
  const allUpdates: Array<{ id: string; oldText: string; newText: string; passageTitle: string }> = [];

  console.log('Processing questions...\n');

  for (let i = 0; i < questionIds.length; i += batchSize) {
    const batch = questionIds.slice(i, i + batchSize);

    const { data: questions, error } = await supabase
      .from('questions_v2')
      .select('id, question_text, passage_id')
      .in('id', batch);

    if (error) {
      console.error('Error fetching questions:', error);
      continue;
    }

    for (const q of questions as Question[]) {
      const passage = passageMap.get(q.passage_id);

      if (!passage) continue;

      const cleanedText = extractQuestionOnly(q.question_text, passage.content, passage.title);

      // Only update if we successfully extracted a shorter question
      if (cleanedText !== q.question_text && cleanedText.length < q.question_text.length * 0.5 && cleanedText.length > 10) {
        allUpdates.push({
          id: q.id,
          oldText: q.question_text,
          newText: cleanedText,
          passageTitle: passage.title
        });
      }
    }

    if ((i + batchSize) % 500 === 0) {
      console.log(`Progress: Processed ${i + batchSize}/${questionIds.length} questions...`);
    }
  }

  console.log(`\nPrepared ${allUpdates.length} updates\n`);

  // Show preview
  console.log('PREVIEW OF CHANGES (first 5):');
  console.log('='.repeat(80));

  for (let i = 0; i < Math.min(5, allUpdates.length); i++) {
    const update = allUpdates[i];
    console.log(`\nQuestion ID: ${update.id}`);
    console.log(`Passage: ${update.passageTitle}`);
    console.log('\nOLD (length: ' + update.oldText.length + ' chars):');
    console.log('-'.repeat(80));
    console.log(update.oldText.substring(0, 300));
    if (update.oldText.length > 300) console.log('...');

    console.log('\nNEW (length: ' + update.newText.length + ' chars):');
    console.log('-'.repeat(80));
    console.log(update.newText);
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
      newText: u.newText,
      passageTitle: u.passageTitle
    }))
  };

  fs.writeFileSync('backup-duplicate-passages-fix.json', JSON.stringify(backupData, null, 2));
  console.log('✓ Backup saved to: backup-duplicate-passages-fix.json\n');

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
    console.log('  npx tsx scripts/fix-all-duplicate-passages.ts --apply');
    console.log('='.repeat(80));
  }

  console.log(`\nTotal questions to fix: ${allUpdates.length}`);
}

// Check for --apply flag
const applyChanges = process.argv.includes('--apply');
fixDuplicatePassages(!applyChanges);
