import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

async function checkDrillStructure() {
  // Check 1: Sample drill question
  console.log('\n📝 Checking a sample drill question structure:\n');
  const { data: drillQ, error: dError } = await supabase
    .from('questions_v2')
    .select('id, question_text, passage_id, test_mode')
    .eq('test_type', 'Year 5 NAPLAN')
    .eq('section_name', 'Reading')
    .eq('test_mode', 'drill')
    .limit(1)
    .single();

  if (dError) {
    console.log('❌ Error:', dError.message);
  } else if (drillQ) {
    console.log('Drill Question Fields:');
    console.log('- question_text length:', drillQ.question_text?.length || 0, 'chars');
    console.log('- passage_id:', drillQ.passage_id || 'NULL');
    console.log('- Has "Read this passage" in text:', drillQ.question_text?.includes('Read this passage') ? 'YES' : 'NO');
    console.log('\nFirst 300 chars of question_text:');
    console.log(drillQ.question_text?.substring(0, 300));

    // Check 2: Check if passage_id links to passages_v2
    if (drillQ.passage_id) {
      console.log('\n\n📖 Checking if passage_id links to passages_v2:\n');
      const { data: passage, error: pError } = await supabase
        .from('passages_v2')
        .select('id, title, content, test_type, passage_type')
        .eq('id', drillQ.passage_id)
        .single();

      if (pError) {
        console.log('❌ No passage found in passages_v2 for this passage_id');
        console.log('   This means passage is embedded in question_text only');
      } else {
        console.log('✅ Found passage in passages_v2:');
        console.log('   Title:', passage.title);
        console.log('   Content length:', passage.content?.length, 'chars');
        console.log('   Test type:', passage.test_type);
        console.log('   Passage type:', passage.passage_type);
        console.log('\n   Content preview:', passage.content?.substring(0, 150) + '...');
      }
    } else {
      console.log('\n⚠️  passage_id is NULL - passage is embedded in question_text');
    }
  } else {
    console.log('⚠️  No drill questions found');
  }

  // Check 3: Count passages in passages_v2 for drills
  console.log('\n\n📊 Checking passages_v2 for drill-related passages:\n');
  const { data: passages, error: pListError } = await supabase
    .from('passages_v2')
    .select('id, title, passage_type, word_count, test_type')
    .eq('test_type', 'Year 5 NAPLAN')
    .eq('section_name', 'Reading')
    .order('created_at', { ascending: false })
    .limit(10);

  if (pListError) {
    console.log('❌ Error:', pListError.message);
  } else if (passages && passages.length > 0) {
    console.log('Found', passages.length, 'passages in passages_v2 for Year 5 NAPLAN Reading:');
    passages.forEach((p, i) => {
      console.log('  ' + (i + 1) + '.', '"' + p.title + '"', '(' + p.word_count, 'words, type:', p.passage_type + ')');
    });
  } else {
    console.log('⚠️  No passages found in passages_v2 for Year 5 NAPLAN Reading');
    console.log('   This confirms drills store passages IN question_text, not passages_v2');
  }
}

checkDrillStructure();
