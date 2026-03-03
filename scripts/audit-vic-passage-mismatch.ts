import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function auditPassageMismatch() {
  console.log('Auditing VIC Selective Reading Reasoning for passage mismatches...\n');

  const { data: questions, error } = await supabase
    .from('questions_v2')
    .select('id, question_text, passage_id, test_type, section_name, sub_skill')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
    .eq('section_name', 'Reading Reasoning')
    .not('passage_id', 'is', null);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${questions?.length || 0} VIC Reading Reasoning questions with passages\n`);

  const mismatches = [];

  for (const q of questions || []) {
    // Extract title from question_text if it exists
    const titleMatch = q.question_text.match(/Title:\s*([^\n]+)/);
    const embeddedTitle = titleMatch ? titleMatch[1].trim() : null;

    if (embeddedTitle) {
      // Get the passage from database
      const { data: passage } = await supabase
        .from('passages_v2')
        .select('id, title')
        .eq('id', q.passage_id)
        .single();

      if (passage && passage.title !== embeddedTitle) {
        mismatches.push({
          question_id: q.id,
          sub_skill: q.sub_skill,
          embedded_title: embeddedTitle,
          passage_id_title: passage.title,
          passage_id: q.passage_id,
          has_duplicate_content: true
        });

        console.log(`\nMISMATCH FOUND:`);
        console.log(`Question ID: ${q.id}`);
        console.log(`Embedded title: "${embeddedTitle}"`);
        console.log(`Passage ID title: "${passage.title}"`);
        console.log(`Sub-skill: ${q.sub_skill}`);
      }
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Total questions checked: ${questions?.length || 0}`);
  console.log(`Mismatches found: ${mismatches.length}`);

  fs.writeFileSync('vic-passage-mismatch-audit.json', JSON.stringify(mismatches, null, 2));
  console.log(`\n✓ Audit results saved to vic-passage-mismatch-audit.json`);
}

auditPassageMismatch();
