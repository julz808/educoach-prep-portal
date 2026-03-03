import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Extract question from quoted passage format
// Format: Read the following passage:\n\n"[passage content in quotes]"\n\n[Question]
function extractQuestionFromQuotedFormat(fullText: string, passageContent: string): string {
  // The question comes after the closing quote
  // Pattern: "...passage..." \n\n Question?

  // Find the end of the quoted passage
  // The passage is in quotes, so we look for the closing quote followed by the question

  // Try to find where the actual question starts
  // Usually after the quoted passage ends

  // Check if passage is quoted
  const quotedPassageMatch = fullText.match(/"([^"]{100,}[^"]*)"/s);

  if (quotedPassageMatch) {
    // Find what comes after the closing quote
    const afterQuote = fullText.substring(quotedPassageMatch.index! + quotedPassageMatch[0].length);

    // The question is usually after some whitespace
    const questionMatch = afterQuote.match(/\s*(.+\?)\s*$/s);

    if (questionMatch && questionMatch[1]) {
      return questionMatch[1].trim();
    }
  }

  // Alternative: Look for the question at the end
  // Questions typically end with "?"
  const lines = fullText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // The question is usually the last line or last substantial text
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];

    // Skip if this line contains passage content
    if (passageContent.includes(line.substring(0, 50))) {
      continue;
    }

    // If it ends with "?" and is reasonably long, it's likely the question
    if (line.endsWith('?') && line.length > 10 && line.length < 200) {
      return line;
    }
  }

  // Last resort: return original
  return fullText;
}

async function fixQuotedPassages(dryRun: boolean = true) {
  console.log('FIX QUESTIONS WITH QUOTED PASSAGE FORMAT');
  console.log('='.repeat(100));
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}\n`);

  // Fetch all questions with passages
  console.log('Fetching all questions with passages...');

  let allQuestions: any[] = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data } = await supabase
      .from('questions_v2')
      .select('id, question_text, passage_id')
      .not('passage_id', 'is', null)
      .range(from, from + pageSize - 1);

    if (data && data.length > 0) {
      allQuestions = allQuestions.concat(data);
      from += pageSize;
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
  }

  console.log(`Fetched ${allQuestions.length} questions\n`);

  // Get unique passage IDs
  const uniquePassageIds = [...new Set(allQuestions.map((q: any) => q.passage_id))];
  console.log(`Fetching ${uniquePassageIds.length} unique passages...\n`);

  // Fetch passages in batches
  const passageMap = new Map();
  const batchSize = 100;

  for (let i = 0; i < uniquePassageIds.length; i += batchSize) {
    const batch = uniquePassageIds.slice(i, i + batchSize);
    const { data: passages } = await supabase
      .from('passages_v2')
      .select('id, content, title')
      .in('id', batch);

    if (passages) {
      passages.forEach((p: any) => passageMap.set(p.id, p));
    }
  }

  console.log(`Loaded ${passageMap.size} passages\n`);

  // Find questions with quoted passage format that still have duplicates
  console.log('Identifying questions with quoted passage format...\n');

  const questionsToFix: any[] = [];

  for (const q of allQuestions) {
    const passage = passageMap.get(q.passage_id);
    if (!passage) continue;

    const questionText = q.question_text || '';
    const passageContent = passage.content || '';

    // Check if this uses the quoted format AND has embedded passage
    const hasQuotedPassage = questionText.includes('"') &&
                            questionText.startsWith('Read the following passage:');
    const passageStart = passageContent.substring(0, 150).trim();
    const hasPassageEmbedded = passageStart.length > 50 && questionText.includes(passageStart);

    if (hasQuotedPassage && hasPassageEmbedded) {
      const extractedQuestion = extractQuestionFromQuotedFormat(questionText, passageContent);

      // Only update if we successfully extracted a much shorter question
      if (extractedQuestion !== questionText &&
          extractedQuestion.length < 300 &&
          extractedQuestion.length > 10 &&
          extractedQuestion.includes('?')) {
        questionsToFix.push({
          id: q.id,
          oldText: questionText,
          newText: extractedQuestion,
          passageTitle: passage.title
        });
      }
    }
  }

  console.log(`Found ${questionsToFix.length} questions to fix\n`);

  if (questionsToFix.length === 0) {
    console.log('No questions need fixing!');
    return;
  }

  // Show preview
  console.log('PREVIEW (first 10):');
  console.log('='.repeat(100));

  for (let i = 0; i < Math.min(10, questionsToFix.length); i++) {
    const q = questionsToFix[i];
    console.log(`\nID: ${q.id}`);
    console.log(`Passage: ${q.passageTitle}`);
    console.log(`\nOLD (${q.oldText.length} chars):`);
    console.log('-'.repeat(80));
    console.log(q.oldText.substring(0, 200) + '...');
    console.log(`\nNEW (${q.newText.length} chars):`);
    console.log('-'.repeat(80));
    console.log(q.newText);
    console.log('='.repeat(100));
  }

  if (questionsToFix.length > 10) {
    console.log(`\n... and ${questionsToFix.length - 10} more\n`);
  }

  // Save backup
  fs.writeFileSync(
    'backup-quoted-passages-fix.json',
    JSON.stringify({
      timestamp: new Date().toISOString(),
      total: questionsToFix.length,
      updates: questionsToFix
    }, null, 2)
  );
  console.log('✓ Backup saved to: backup-quoted-passages-fix.json\n');

  // Apply if not dry run
  if (!dryRun) {
    console.log('Applying updates...\n');

    let successCount = 0;
    let errorCount = 0;

    for (const q of questionsToFix) {
      const { error } = await supabase
        .from('questions_v2')
        .update({ question_text: q.newText })
        .eq('id', q.id);

      if (error) {
        console.error(`Error updating ${q.id}:`, error.message);
        errorCount++;
      } else {
        successCount++;
        if (successCount % 20 === 0) {
          console.log(`Progress: ${successCount}/${questionsToFix.length}...`);
        }
      }
    }

    console.log('\n' + '='.repeat(100));
    console.log(`✓ Success: ${successCount}`);
    console.log(`✗ Errors: ${errorCount}`);
    console.log('='.repeat(100));
  } else {
    console.log('='.repeat(100));
    console.log('DRY RUN - No changes made.');
    console.log('To apply: npx tsx scripts/fix-final-quoted-passages.ts --apply');
    console.log('='.repeat(100));
  }
}

const applyChanges = process.argv.includes('--apply');
fixQuotedPassages(!applyChanges);
