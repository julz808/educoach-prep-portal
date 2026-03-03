/**
 * Fix VIC Selective Reading Reasoning Over-generation
 *
 * Problem: practice_2, practice_3, practice_4, practice_5, diagnostic all have:
 * - 12 passage-based "Vocabulary in Context" questions (should be 6)
 * - This causes total to be 50/50 even though other sub-skills are under-generated
 *
 * Solution: Delete the 6 newest passage-based Vocabulary questions from each mode
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
);

const testType = 'VIC Selective Entry (Year 9 Entry)';
const sectionName = 'Reading Reasoning';
const modes = ['practice_2', 'practice_3', 'practice_4', 'practice_5', 'diagnostic'];

console.log(`\n🔧 Fixing VIC Selective Reading Reasoning Over-generation\n`);

for (const mode of modes) {
  console.log(`\n📝 Processing ${mode}...`);

  // Get passage-based Vocabulary in Context questions (newest first)
  const { data, error } = await supabase
    .from('questions_v2')
    .select('id, question_text, created_at')
    .eq('test_type', testType)
    .eq('section_name', sectionName)
    .eq('test_mode', mode)
    .eq('sub_skill', 'Vocabulary in Context')
    .not('passage_id', 'is', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`   ❌ Error fetching questions: ${error.message}`);
    continue;
  }

  if (!data || data.length === 0) {
    console.log(`   ℹ️  No passage-based Vocabulary questions found`);
    continue;
  }

  console.log(`   📊 Found ${data.length} passage-based Vocabulary questions`);

  if (data.length <= 6) {
    console.log(`   ✅ Already at or below target (6). No deletion needed.`);
    continue;
  }

  // Delete the newest 6 questions (keeping the oldest 6)
  const toDelete = data.slice(0, 6);  // First 6 are newest due to DESC order
  const toKeep = data.slice(6);

  console.log(`   🗑️  Will delete ${toDelete.length} newest questions (keeping ${toKeep.length})`);
  console.log(`   Questions to delete:`);
  toDelete.forEach((q, i) => {
    const preview = q.question_text.length > 60
      ? q.question_text.slice(0, 60) + '...'
      : q.question_text;
    console.log(`      ${i + 1}. ${preview}`);
  });

  // Delete the questions
  const idsToDelete = toDelete.map(q => q.id);
  const { error: deleteError } = await supabase
    .from('questions_v2')
    .delete()
    .in('id', idsToDelete);

  if (deleteError) {
    console.error(`   ❌ Error deleting questions: ${deleteError.message}`);
  } else {
    console.log(`   ✅ Deleted ${toDelete.length} questions`);
  }
}

console.log(`\n✅ Cleanup complete! Re-run generation script to fill gaps.\n`);
