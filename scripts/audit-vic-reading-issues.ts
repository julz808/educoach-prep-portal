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
  passage_id: string | null;
  sub_skill_id: string;
  answer_options: any;
}

interface Passage {
  id: string;
  passage_text: string;
}

async function auditVicReadingIssues() {
  console.log('🔍 Auditing VIC Selective Entry Reading Reasoning questions...\n');

  // Get all VIC Reading questions
  const { data: questions, error: questionsError } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
    .eq('section_name', 'Reading Reasoning');

  if (questionsError) {
    console.error('❌ Error fetching questions:', questionsError);
    return;
  }

  console.log(`📊 Total VIC Reading questions: ${questions.length}\n`);

  // Get all passages
  const { data: passages, error: passagesError } = await supabase
    .from('passages_v2')
    .select('*')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
    .eq('section_name', 'Reading Reasoning');

  if (passagesError) {
    console.error('❌ Error fetching passages:', passagesError);
    return;
  }

  const passageMap = new Map<string, Passage>();
  passages.forEach(p => passageMap.set(p.id, p));

  // ISSUE 1: Questions with full passage text in question_text
  console.log('═══════════════════════════════════════════════════════════');
  console.log('ISSUE 1: Questions with passage text embedded in question_text');
  console.log('═══════════════════════════════════════════════════════════\n');

  const questionsWithEmbeddedPassage: Array<{
    id: string;
    passage_id: string | null;
    question_text_length: number;
    passage_text_length: number;
    similarity: number;
  }> = [];

  for (const q of questions) {
    if (!q.passage_id) continue;

    const passage = passageMap.get(q.passage_id);
    if (!passage) continue;

    // Check if question_text contains a large portion of the passage text
    const questionTextLength = q.question_text?.length || 0;
    const passageTextLength = passage.passage_text?.length || 0;

    // If question text is very long (>200 chars) and contains significant portion of passage
    if (questionTextLength > 200 && passage.passage_text) {
      // Check if passage text is contained in question text
      const passageSnippet = passage.passage_text.substring(0, Math.min(100, passage.passage_text.length));
      const passageInQuestion = q.question_text.includes(passageSnippet);

      if (passageInQuestion || questionTextLength > 500) {
        questionsWithEmbeddedPassage.push({
          id: q.id,
          passage_id: q.passage_id,
          question_text_length: questionTextLength,
          passage_text_length: passageTextLength,
          similarity: passageInQuestion ? 1 : 0.5
        });

        console.log(`❌ Question ID: ${q.id}`);
        console.log(`   Passage ID: ${q.passage_id}`);
        console.log(`   Question text length: ${questionTextLength} chars`);
        console.log(`   Passage text length: ${passageTextLength} chars`);
        console.log(`   First 150 chars of question_text: ${q.question_text.substring(0, 150)}...`);
        console.log('');
      }
    }
  }

  console.log(`\n📊 Found ${questionsWithEmbeddedPassage.length} questions with embedded passages\n`);

  // ISSUE 2: Duplicate questions (same question text and target word)
  console.log('═══════════════════════════════════════════════════════════');
  console.log('ISSUE 2: Duplicate questions');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Group questions by normalized question text
  const questionGroups = new Map<string, Question[]>();

  for (const q of questions) {
    // Normalize: lowercase, remove extra whitespace, remove punctuation variations
    let normalized = q.question_text
      ?.toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[""]/g, '"')
      .trim() || '';

    // Also extract the key word being asked about (e.g., "undeterred")
    const match = normalized.match(/what (?:does|is) [""](.+?)[""] mean/);
    if (match) {
      // Use combination of question pattern + target word as key
      const targetWord = match[1];
      const pattern = 'what_does_mean';
      normalized = `${pattern}:${targetWord}:${q.passage_id}`;
    }

    if (!questionGroups.has(normalized)) {
      questionGroups.set(normalized, []);
    }
    questionGroups.get(normalized)!.push(q);
  }

  const duplicateGroups: Array<{
    normalizedText: string;
    count: number;
    questions: Question[];
  }> = [];

  for (const [normalizedText, groupQuestions] of questionGroups) {
    if (groupQuestions.length > 1) {
      duplicateGroups.push({
        normalizedText,
        count: groupQuestions.length,
        questions: groupQuestions
      });

      console.log(`❌ Duplicate group (${groupQuestions.length} copies):`);
      console.log(`   Normalized key: ${normalizedText}`);
      console.log(`   Question IDs: ${groupQuestions.map(q => q.id).join(', ')}`);
      console.log(`   Sample question text: ${groupQuestions[0].question_text.substring(0, 100)}...`);
      console.log(`   Passage IDs: ${groupQuestions.map(q => q.passage_id).join(', ')}`);
      console.log('');
    }
  }

  console.log(`\n📊 Found ${duplicateGroups.length} duplicate groups affecting ${duplicateGroups.reduce((sum, g) => sum + g.count, 0)} total questions\n`);

  // Generate summary report
  const report = {
    timestamp: new Date().toISOString(),
    totalQuestions: questions.length,
    issue1_embeddedPassages: {
      count: questionsWithEmbeddedPassage.length,
      questionIds: questionsWithEmbeddedPassage.map(q => q.id)
    },
    issue2_duplicates: {
      groupCount: duplicateGroups.length,
      totalDuplicateQuestions: duplicateGroups.reduce((sum, g) => sum + g.count, 0),
      groups: duplicateGroups.map(g => ({
        normalizedText: g.normalizedText,
        count: g.count,
        questionIds: g.questions.map(q => q.id),
        keepFirst: g.questions[0].id,
        deleteIds: g.questions.slice(1).map(q => q.id)
      }))
    }
  };

  // Save report
  fs.writeFileSync(
    'vic-reading-issues-report.json',
    JSON.stringify(report, null, 2)
  );

  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Total questions: ${questions.length}`);
  console.log(`Issue 1 (embedded passages): ${questionsWithEmbeddedPassage.length}`);
  console.log(`Issue 2 (duplicate groups): ${duplicateGroups.length}`);
  console.log(`Issue 2 (total duplicates to delete): ${report.issue2_duplicates.groups.reduce((sum, g) => sum + g.deleteIds.length, 0)}`);
  console.log(`\n✅ Report saved to: vic-reading-issues-report.json`);
}

auditVicReadingIssues().catch(console.error);
