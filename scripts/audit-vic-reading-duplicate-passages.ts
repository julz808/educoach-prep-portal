import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function auditVicReadingDuplicates() {
  console.log('Auditing VIC Selective Reading Reasoning questions for duplicate passages...\n');

  // Get all VIC Selective Reading Reasoning questions
  const { data: questions, error } = await supabase
    .from('questions_v2')
    .select('id, question_text, passage_id, test_type, section_name, sub_skill')
    .eq('test_type', 'vic-selective-entry-year-9-entry-')
    .eq('section_name', 'Reading Reasoning')
    .order('id');

  if (error) {
    console.error('Error fetching questions:', error);
    return;
  }

  console.log(`Found ${questions?.length || 0} VIC Selective Reading Reasoning questions\n`);

  const questionsWithDuplicates = [];
  const passageIds = new Set<string>();

  for (const question of questions || []) {
    if (question.passage_id) {
      passageIds.add(question.passage_id);

      // Check if question_text contains what looks like a full passage
      // (long text before the actual question)
      const questionText = question.question_text;

      // Look for patterns that suggest a passage is embedded:
      // - Very long question_text (>500 chars)
      // - Contains "Read the following passage:" or similar
      // - Contains "Title:" followed by passage text
      const hasEmbeddedPassage =
        questionText.includes('Read the following passage:') ||
        questionText.includes('Title:') ||
        (questionText.length > 500 && question.passage_id);

      if (hasEmbeddedPassage) {
        questionsWithDuplicates.push({
          id: question.id,
          passage_id: question.passage_id,
          sub_skill: question.sub_skill,
          question_text_length: questionText.length,
          preview: questionText.substring(0, 200) + '...'
        });
      }
    }
  }

  console.log(`\n=== AUDIT RESULTS ===`);
  console.log(`Questions with duplicate passages: ${questionsWithDuplicates.length}`);
  console.log(`Unique passages referenced: ${passageIds.size}\n`);

  if (questionsWithDuplicates.length > 0) {
    console.log('Questions with embedded passages:');
    for (const q of questionsWithDuplicates) {
      console.log(`\nID: ${q.id}`);
      console.log(`Passage ID: ${q.passage_id}`);
      console.log(`Sub-skill: ${q.sub_skill}`);
      console.log(`Text length: ${q.question_text_length} chars`);
      console.log(`Preview: ${q.preview}`);
    }

    // Save to file for processing
    const fs = require('fs');
    fs.writeFileSync(
      'vic-reading-duplicate-passages.json',
      JSON.stringify(questionsWithDuplicates, null, 2)
    );
    console.log(`\n✓ Results saved to vic-reading-duplicate-passages.json`);
  }
}

auditVicReadingDuplicates();
