import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface QuestionToFix {
  id: string;
  question_text: string;
  passage_id: string;
  test_type: string;
  section_name: string;
  sub_skill: string;
}

async function fixDuplicatePassages() {
  console.log('Fixing duplicate passages in questions_v2...\n');

  // Get all questions that have a passage_id and potentially embedded content
  const { data: questions, error } = await supabase
    .from('questions_v2')
    .select('id, question_text, passage_id, test_type, section_name, sub_skill')
    .not('passage_id', 'is', null);

  if (error) {
    console.error('Error fetching questions:', error);
    return;
  }

  console.log(`Found ${questions?.length || 0} questions with passages\n`);

  const questionsToFix: QuestionToFix[] = [];
  const backupData: any[] = [];

  for (const q of questions || []) {
    const text = q.question_text;

    // Check if question_text contains patterns that suggest embedded passage
    const hasTitle = text.includes('Title:');
    const hasReadFollowing = text.includes('Read the following');
    const hasReadPoem = text.includes('Read the poem');
    const hasReadThisPassage = text.includes('Read this passage');
    const isVeryLong = text.length > 800;

    if (hasTitle || hasReadFollowing || hasReadPoem || hasReadThisPassage || isVeryLong) {
      questionsToFix.push(q);
      backupData.push({
        id: q.id,
        original_question_text: text,
        passage_id: q.passage_id,
        test_type: q.test_type,
        section_name: q.section_name
      });
    }
  }

  console.log(`Questions to fix: ${questionsToFix.length}\n`);

  // Save backup
  fs.writeFileSync('backup-duplicate-passages.json', JSON.stringify(backupData, null, 2));
  console.log('✓ Backup saved to backup-duplicate-passages.json\n');

  // Process each question
  const updates: { id: string; new_text: string; old_length: number; new_length: number }[] = [];

  for (const q of questionsToFix) {
    const text = q.question_text;
    let extractedQuestion = text;

    // Strategy 1: Look for question patterns after passage content
    // Pattern: "Read the following passage:\n\nTitle: ...\n\n[passage content]\n\n[actual question]"
    if (text.includes('Read the following passage:')) {
      // Find where the actual question starts
      // Usually after the passage, look for question markers
      const lines = text.split('\n');
      let questionStartIndex = -1;

      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        // Question usually starts with "What", "Which", "How", "Why", "Based on", etc.
        if (
          line.match(/^(What|Which|How|Why|Who|When|Where|Based on|According to|In the passage)/i) ||
          line.includes('can be inferred') ||
          line.includes('best describes') ||
          line.includes('most likely') ||
          line.includes('suggests that')
        ) {
          questionStartIndex = i;
          break;
        }
      }

      if (questionStartIndex > 0) {
        extractedQuestion = lines.slice(questionStartIndex).join('\n').trim();
      }
    }

    // Strategy 2: For "Read the poem" or similar short introductions
    else if (text.includes('Read the poem') || text.includes('Read this passage')) {
      const lines = text.split('\n');
      let questionStartIndex = -1;

      // Look for the actual question (usually at the end)
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (
          line.match(/^(What|Which|How|Why|Who|When|Where|Based on|According to)/i) ||
          line.includes('can be inferred') ||
          line.includes('best describes')
        ) {
          questionStartIndex = i;
          break;
        }
      }

      if (questionStartIndex > 0) {
        extractedQuestion = lines.slice(questionStartIndex).join('\n').trim();
      }
    }

    // Strategy 3: For questions that start with the question but include full passage
    // Example: "Based on the passage 'Title', what can be inferred... [full passage text]"
    else if (text.match(/^(What|Which|How|Based on the passage)/i)) {
      // Look for where passage content starts (usually after a line break and long text)
      const paragraphs = text.split('\n\n');
      if (paragraphs.length > 1) {
        // First paragraph is likely the question
        const firstPara = paragraphs[0];
        // If second paragraph looks like passage content (very long), keep only first
        if (paragraphs[1].length > 200) {
          extractedQuestion = firstPara.trim();
        }
      }
    }

    // Only update if we actually extracted something different and shorter
    if (extractedQuestion !== text && extractedQuestion.length < text.length && extractedQuestion.length > 20) {
      updates.push({
        id: q.id,
        new_text: extractedQuestion,
        old_length: text.length,
        new_length: extractedQuestion.length
      });
    }
  }

  console.log(`\nProcessed ${updates.length} questions for update\n`);

  // Show sample updates
  console.log('Sample updates (first 5):');
  for (const update of updates.slice(0, 5)) {
    console.log(`\nID: ${update.id}`);
    console.log(`Old length: ${update.old_length} → New length: ${update.new_length}`);
    console.log(`New text: ${update.new_text.substring(0, 200)}${update.new_text.length > 200 ? '...' : ''}`);
  }

  // Save update plan
  fs.writeFileSync('passage-fix-plan.json', JSON.stringify(updates, null, 2));
  console.log(`\n✓ Update plan saved to passage-fix-plan.json`);

  console.log('\n=== READY TO APPLY ===');
  console.log(`${updates.length} questions will be updated`);
  console.log('To apply updates, uncomment the update code below and run again.');

  // Uncomment to apply updates:
  /*
  console.log('\nApplying updates...');
  for (const update of updates) {
    const { error } = await supabase
      .from('questions_v2')
      .update({ question_text: update.new_text })
      .eq('id', update.id);

    if (error) {
      console.error(`Error updating ${update.id}:`, error);
    } else {
      console.log(`✓ Updated ${update.id}`);
    }
  }
  console.log('\n✓ All updates applied!');
  */
}

fixDuplicatePassages();
