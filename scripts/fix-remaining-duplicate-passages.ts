import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Improved extraction - looks for the actual question after passage content
function extractQuestionFromText(fullText: string, passageContent: string): string {
  // The pattern is usually:
  // "Read the passage and answer the question.\n\nPassage:\n[Title]\n[Content]\n\n[Actual Question]"

  // Remove the passage content from the text
  let cleaned = fullText;

  // Find where passage content starts and ends
  const passageContentStart = fullText.indexOf(passageContent.substring(0, 50));

  if (passageContentStart !== -1) {
    // Everything after the passage content
    const afterPassage = fullText.substring(passageContentStart + passageContent.length);

    // The question is typically after the passage content
    // Clean up whitespace and get the question
    const lines = afterPassage.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    if (lines.length > 0) {
      // Usually the question is the first substantial line after the passage
      const question = lines[0];
      if (question.length > 10) {
        return question;
      }
    }
  }

  // Alternative: Look for common question patterns at the end
  const questionPatterns = [
    /What is the main (idea|theme|purpose|argument|message) of (this|the) passage\?/i,
    /What (can be inferred|is implied|is suggested)/i,
    /According to the passage,/i,
    /Why does the author/i,
    /Which of the following best/i,
    /What does the (author|passage|text)/i,
    /How does the (author|passage|text)/i,
  ];

  for (const pattern of questionPatterns) {
    const match = fullText.match(pattern);
    if (match && match.index !== undefined) {
      // Get from this point to the end (usually just one sentence)
      const fromMatch = fullText.substring(match.index);
      const endOfSentence = fromMatch.search(/[.!?]\s*$/);
      if (endOfSentence !== -1) {
        return fromMatch.substring(0, endOfSentence + 1).trim();
      }
      // If no end punctuation found, take the whole thing
      return fromMatch.trim();
    }
  }

  // Last resort: return original
  return fullText;
}

async function fixRemainingDuplicates(dryRun: boolean = true) {
  console.log('FIX REMAINING DUPLICATE PASSAGES');
  console.log('='.repeat(100));
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}\n`);

  // Fetch ALL questions with passages
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

  // Find questions that still have duplicate passages
  console.log('Identifying questions with embedded passages...\n');

  const questionsToFix: any[] = [];

  for (const q of allQuestions) {
    const passage = passageMap.get(q.passage_id);
    if (!passage) continue;

    const questionText = q.question_text || '';
    const passageContent = passage.content || '';

    // Check if passage is embedded
    const passageStart = passageContent.substring(0, 150).trim();
    const hasPassageEmbedded = passageStart.length > 50 && questionText.includes(passageStart);

    const hasPassageKeyword = /Passage:|Read the passage and answer/i.test(questionText);
    const isLong = questionText.length > 600;

    if (hasPassageEmbedded || (hasPassageKeyword && isLong)) {
      const extractedQuestion = extractQuestionFromText(questionText, passageContent);

      // Only update if we successfully extracted a shorter question
      if (extractedQuestion !== questionText &&
          extractedQuestion.length < questionText.length * 0.3 &&
          extractedQuestion.length > 10) {
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
  console.log('PREVIEW (first 5):');
  console.log('='.repeat(100));

  for (let i = 0; i < Math.min(5, questionsToFix.length); i++) {
    const q = questionsToFix[i];
    console.log(`\nID: ${q.id}`);
    console.log(`Passage: ${q.passageTitle}`);
    console.log(`\nOLD (${q.oldText.length} chars):`);
    console.log('-'.repeat(80));
    console.log(q.oldText.substring(0, 300) + '...');
    console.log(`\nNEW (${q.newText.length} chars):`);
    console.log('-'.repeat(80));
    console.log(q.newText);
    console.log('='.repeat(100));
  }

  console.log(`\n... and ${questionsToFix.length - 5} more\n`);

  // Save backup
  fs.writeFileSync(
    'backup-remaining-passages-fix.json',
    JSON.stringify({
      timestamp: new Date().toISOString(),
      total: questionsToFix.length,
      updates: questionsToFix
    }, null, 2)
  );
  console.log('✓ Backup saved to: backup-remaining-passages-fix.json\n');

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
        if (successCount % 50 === 0) {
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
    console.log('To apply: npx tsx scripts/fix-remaining-duplicate-passages.ts --apply');
    console.log('='.repeat(100));
  }
}

const applyChanges = process.argv.includes('--apply');
fixRemainingDuplicates(!applyChanges);
