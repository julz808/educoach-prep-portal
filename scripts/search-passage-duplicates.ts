import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function searchDuplicates() {
  console.log('Searching for questions with duplicate passages...\n');

  // Get all questions that have a passage_id
  const { data: questions, error } = await supabase
    .from('questions_v2')
    .select('id, question_text, passage_id, test_type, section_name, sub_skill')
    .not('passage_id', 'is', null)
    .order('id')
    .limit(500);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${questions?.length || 0} questions with passages\n`);

  const duplicates = [];

  for (const q of questions || []) {
    const text = q.question_text;

    // Check if question_text contains patterns that suggest embedded passage
    const hasTitle = text.includes('Title:');
    const hasReadFollowing = text.includes('Read the following');
    const isVeryLong = text.length > 800;

    if (hasTitle || hasReadFollowing || isVeryLong) {
      duplicates.push({
        id: q.id,
        test_type: q.test_type,
        section_name: q.section_name,
        sub_skill: q.sub_skill,
        passage_id: q.passage_id,
        text_length: text.length,
        has_title: hasTitle,
        has_read_following: hasReadFollowing,
        preview: text.substring(0, 300)
      });
    }
  }

  console.log(`\nQuestions with potential duplicate passages: ${duplicates.length}\n`);

  for (const d of duplicates.slice(0, 10)) {
    console.log(`\n=== ${d.id} ===`);
    console.log(`Test: ${d.test_type}`);
    console.log(`Section: ${d.section_name}`);
    console.log(`Sub-skill: ${d.sub_skill}`);
    console.log(`Length: ${d.text_length}`);
    console.log(`Has Title: ${d.has_title}`);
    console.log(`Has "Read the following": ${d.has_read_following}`);
    console.log(`\nPreview:\n${d.preview}...\n`);
  }

  fs.writeFileSync('duplicate-passages-found.json', JSON.stringify(duplicates, null, 2));
  console.log(`\nResults saved to duplicate-passages-found.json (${duplicates.length} total)`);
}

searchDuplicates();
