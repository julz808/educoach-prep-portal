import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface FixRecord {
  question_id: string;
  old_question_text: string;
  new_question_text: string;
  embedded_title?: string;
  correct_passage_id?: string;
  needs_passage_id_fix: boolean;
}

async function fixVicDuplicatePassages() {
  console.log('Fixing VIC Selective Reading Reasoning duplicate passages...\n');

  // Get all VIC Reading Reasoning questions
  const { data: questions, error } = await supabase
    .from('questions_v2')
    .select('id, question_text, passage_id, test_type, section_name, sub_skill')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
    .eq('section_name', 'Reading Reasoning');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${questions?.length || 0} VIC Reading Reasoning questions\n`);

  const fixes: FixRecord[] = [];
  let count = 0;

  for (const q of questions || []) {
    const text = q.question_text;

    // Check if this question has embedded passage content
    const hasReadFollowing = text.includes('Read the following passage:');
    const hasTitle = text.includes('Title:');
    const isLong = text.length > 500;

    if (!hasReadFollowing && !hasTitle && !isLong) {
      continue; // This question is fine
    }

    count++;
    console.log(`\n[${count}] Processing question ${q.id.substring(0, 8)}...`);

    // Extract the embedded title if present
    const titleMatch = text.match(/Title:\s*([^\n]+)/);
    const embeddedTitle = titleMatch ? titleMatch[1].trim() : null;

    // Extract just the question part
    // The pattern is typically:
    // "Read the following passage:\n\nTitle: XYZ\n\n[passage content]\n\n[QUESTION]"
    // OR
    // "Read the following passage:\n\n[passage content without title]\n\n[QUESTION]"

    let extractedQuestion = '';
    const lines = text.split('\n');

    // Find where the actual question starts (usually near the end)
    // Questions typically start with: What, Which, How, Why, Who, When, Where, Based on, According to, In the passage
    let questionStartIndex = -1;

    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();

      if (line && (
        line.match(/^(What|Which|How|Why|Who|When|Where|Based on|According to|In the passage)/i) ||
        line.includes('can be inferred') ||
        line.includes('best describes') ||
        line.includes('most likely') ||
        line.includes('suggests that') ||
        line.includes('main idea') ||
        line.includes('author\'s purpose') ||
        line.includes('meaning of')
      )) {
        questionStartIndex = i;
        break;
      }
    }

    if (questionStartIndex > 0) {
      extractedQuestion = lines.slice(questionStartIndex).join('\n').trim();
    }

    // If we couldn't find a question, keep original (safety measure)
    if (!extractedQuestion || extractedQuestion.length < 20) {
      console.log(`  ⚠️  Could not extract question safely, skipping`);
      continue;
    }

    // Check if passage_id needs fixing
    let needsPassageIdFix = false;
    let correctPassageId = q.passage_id;

    if (embeddedTitle && q.passage_id) {
      const { data: currentPassage } = await supabase
        .from('passages_v2')
        .select('id, title')
        .eq('id', q.passage_id)
        .single();

      if (currentPassage && currentPassage.title !== embeddedTitle) {
        needsPassageIdFix = true;

        // Find the correct passage by title
        const { data: correctPassage } = await supabase
          .from('passages_v2')
          .select('id, title')
          .eq('title', embeddedTitle)
          .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
          .eq('section_name', 'Reading Reasoning')
          .single();

        if (correctPassage) {
          correctPassageId = correctPassage.id;
          console.log(`  → Passage ID mismatch: "${currentPassage.title}" -> "${embeddedTitle}"`);
        } else {
          console.log(`  ⚠️  Could not find passage with title "${embeddedTitle}"`);
        }
      }
    }

    fixes.push({
      question_id: q.id,
      old_question_text: text,
      new_question_text: extractedQuestion,
      embedded_title: embeddedTitle || undefined,
      correct_passage_id: needsPassageIdFix ? correctPassageId : undefined,
      needs_passage_id_fix: needsPassageIdFix
    });

    console.log(`  Old length: ${text.length} chars`);
    console.log(`  New length: ${extractedQuestion.length} chars`);
    console.log(`  New text: ${extractedQuestion.substring(0, 100)}...`);
  }

  console.log(`\n\n=== SUMMARY ===`);
  console.log(`Questions processed: ${count}`);
  console.log(`Questions to fix: ${fixes.length}`);
  console.log(`Questions needing passage_id fix: ${fixes.filter(f => f.needs_passage_id_fix).length}`);

  // Save backup and fix plan
  fs.writeFileSync('backup-vic-reading-passages.json', JSON.stringify(fixes, null, 2));
  console.log(`\n✓ Backup saved to backup-vic-reading-passages.json`);

  // Apply fixes
  console.log(`\n=== APPLYING FIXES ===`);

  let successCount = 0;
  let errorCount = 0;

  for (const fix of fixes) {
    const updateData: any = {
      question_text: fix.new_question_text
    };

    if (fix.needs_passage_id_fix && fix.correct_passage_id) {
      updateData.passage_id = fix.correct_passage_id;
    }

    const { error } = await supabase
      .from('questions_v2')
      .update(updateData)
      .eq('id', fix.question_id);

    if (error) {
      console.error(`✗ Error updating ${fix.question_id}:`, error.message);
      errorCount++;
    } else {
      successCount++;
      if ((successCount % 10) === 0) {
        console.log(`  ✓ ${successCount} questions updated...`);
      }
    }
  }

  console.log(`\n=== COMPLETE ===`);
  console.log(`✓ Successfully updated: ${successCount}`);
  console.log(`✗ Errors: ${errorCount}`);
}

fixVicDuplicatePassages();
