import { supabase } from '../src/integrations/supabase/client';

async function checkQuestions() {
  console.log('🔍 Checking question counts for VIC Selective Practice Test 3...\n');

  const { data, error } = await supabase
    .from('questions')
    .select('test_mode, section_name, id')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
    .eq('test_mode', 'practice_3')
    .order('section_name');

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  // Group by section
  const sections: Record<string, number> = {};
  data.forEach(q => {
    sections[q.section_name] = (sections[q.section_name] || 0) + 1;
  });

  console.log('📊 Question counts for Practice Test 3:');
  Object.entries(sections).forEach(([section, count]) => {
    console.log(`  ${section}: ${count} questions`);
  });
  console.log(`\n✅ Total: ${data.length} questions`);

  // Also check all practice tests
  console.log('\n🔍 Checking ALL practice tests...\n');

  const { data: allData, error: allError } = await supabase
    .from('questions')
    .select('test_mode, section_name, id')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
    .in('test_mode', ['practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5'])
    .order('test_mode, section_name');

  if (allError) {
    console.error('❌ Error:', allError);
    return;
  }

  // Group by test mode and section
  const allSections: Record<string, Record<string, number>> = {};
  allData.forEach(q => {
    if (!allSections[q.test_mode]) {
      allSections[q.test_mode] = {};
    }
    allSections[q.test_mode][q.section_name] = (allSections[q.test_mode][q.section_name] || 0) + 1;
  });

  Object.entries(allSections).forEach(([testMode, sections]) => {
    console.log(`\n📋 ${testMode}:`);
    Object.entries(sections).forEach(([section, count]) => {
      console.log(`  ${section}: ${count} questions`);
    });
    const total = Object.values(sections).reduce((sum, count) => sum + count, 0);
    console.log(`  Total: ${total} questions`);
  });
}

checkQuestions().then(() => process.exit(0)).catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
