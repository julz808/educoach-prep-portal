import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * These two questions have inline options that need a special pattern
 * Pattern: "text: A) option B) option C) option" (colon before A)
 */
const manualFixes = [
  {
    id: "fbc08706-a564-4061-881b-69a978b9f392",
    cleanedText: "The warning on the map was written in:",
    options: [
      "iridescent ink",
      "Kofi's distinctive script",
      "crimson",
      "Both B and C",
      "All of the above"
    ]
  },
  {
    id: "cb96197c-da94-401c-872f-9ca2bd726e38",
    cleanedText: "The author compares helmets to seatbelts to show that:",
    options: [
      "Both are uncomfortable to wear",
      "Both are required by law everywhere",
      "Both should be accepted as necessary safety measures",
      "Both prevent all injuries in accidents",
      "Both are equally effective at saving lives"
    ]
  }
];

async function fixFinalInlineQuestions() {
  console.log('Fixing final 2 questions with inline options...\n');

  let successCount = 0;

  for (const fix of manualFixes) {
    console.log(`Fixing question ${fix.id}...`);
    console.log(`  Cleaned text: ${fix.cleanedText}`);
    console.log(`  Options: ${JSON.stringify(fix.options)}`);

    const { error } = await supabase
      .from('questions_v2')
      .update({
        question_text: fix.cleanedText,
        answer_options: fix.options,
      })
      .eq('id', fix.id);

    if (error) {
      console.error(`  ❌ Error: ${error.message}`);
    } else {
      console.log(`  ✅ Fixed successfully`);
      successCount++;
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Successfully fixed: ${successCount}/2 questions`);
}

fixFinalInlineQuestions();
