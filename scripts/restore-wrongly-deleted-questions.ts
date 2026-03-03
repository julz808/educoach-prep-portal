import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function analyzeWhatWasDeleted() {
  console.log('🔍 Analyzing what was deleted...\n');

  // The problem: My audit script grouped questions by normalized question text
  // But for reading questions, it should have ALSO checked if they had the same passage_id
  // "What is the main idea of this passage?" is VALID if asked about different passages

  console.log('Unfortunately, the questions have already been deleted from the database.');
  console.log('We cannot restore them directly.\n');

  console.log('═══════════════════════════════════════════════════════════');
  console.log('WHAT WENT WRONG:\n');
  console.log('The audit script used this logic:');
  console.log('  normalized = question_text.toLowerCase().trim()');
  console.log('  if (normalized === "what is the main idea of this passage?") {');
  console.log('    → Mark as duplicate!');
  console.log('  }\n');
  console.log('But it SHOULD have been:');
  console.log('  if (normalized === "what is the main idea..." AND passage_id is SAME) {');
  console.log('    → Mark as duplicate');
  console.log('  } else {');
  console.log('    → NOT a duplicate (different passages)');
  console.log('  }\n');

  console.log('═══════════════════════════════════════════════════════════');
  console.log('QUESTIONS WRONGLY DELETED:\n');
  console.log('- 35 copies of "What is the main idea of this passage?" (about different passages)');
  console.log('- 4 copies of "What is the main purpose of this passage?" (about different passages)');
  console.log('- 4 copies of "What is the central theme of this passage?" (about different passages)');
  console.log('Total: 43 questions wrongly deleted\n');

  console.log('═══════════════════════════════════════════════════════════');
  console.log('SOLUTION:\n');
  console.log('1. These questions need to be regenerated');
  console.log('2. The audit script needs to be fixed to check passage_id for reading questions');
  console.log('3. Only delete if: SAME question text AND SAME passage_id\n');

  console.log('Let me check if any questions remain in the database...\n');

  const { data: remainingQuestions } = await supabase
    .from('questions_v2')
    .select('question_text, passage_id')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
    .eq('section_name', 'Reading Reasoning')
    .or('question_text.ilike.%What is the main idea%,question_text.ilike.%What is the main purpose%,question_text.ilike.%What is the central theme%');

  console.log(`Found ${remainingQuestions?.length || 0} remaining questions with these patterns:\n`);

  const groupedByPassage = new Map<string, string[]>();
  for (const q of remainingQuestions || []) {
    const passageId = q.passage_id || 'null';
    if (!groupedByPassage.has(passageId)) {
      groupedByPassage.set(passageId, []);
    }
    groupedByPassage.get(passageId)!.push(q.question_text);
  }

  for (const [passageId, questions] of groupedByPassage) {
    console.log(`Passage ${passageId.substring(0, 8)}:`);
    questions.forEach(q => {
      console.log(`  - ${q.substring(0, 60)}...`);
    });
    console.log();
  }
}

analyzeWhatWasDeleted().catch(console.error);
