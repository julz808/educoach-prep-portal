import { supabase } from '../src/integrations/supabase/client';

async function checkV2RealData() {
  console.log('🔍 Checking REAL data in questions_v2 table...\n');

  // Get total count
  const { count: totalCount, error: countError } = await supabase
    .from('questions_v2')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 Total questions in V2: ${totalCount}`);
  if (countError) {
    console.error('Error:', countError);
  }

  // Get VIC Selective Practice Test 3 questions
  const { data: practice3Data, error: p3Error } = await supabase
    .from('questions_v2')
    .select('test_mode, section_name, id')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
    .eq('test_mode', 'practice_3');

  if (p3Error) {
    console.error('❌ Error fetching Practice Test 3:', p3Error);
  } else {
    console.log(`\n📋 Practice Test 3 questions found: ${practice3Data.length}`);

    const sections: Record<string, number> = {};
    practice3Data.forEach(q => {
      sections[q.section_name] = (sections[q.section_name] || 0) + 1;
    });

    console.log('\nSections:');
    Object.entries(sections).forEach(([section, count]) => {
      console.log(`  ${section}: ${count} questions`);
    });
  }

  // Get ALL VIC Selective questions to see all test modes
  const { data: allVicData, error: allError } = await supabase
    .from('questions_v2')
    .select('test_mode, section_name, id')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)');

  if (allError) {
    console.error('❌ Error fetching all VIC questions:', allError);
  } else {
    console.log(`\n📊 Total VIC Selective questions: ${allVicData.length}`);

    const byMode: Record<string, Record<string, number>> = {};
    allVicData.forEach(q => {
      if (!byMode[q.test_mode]) byMode[q.test_mode] = {};
      byMode[q.test_mode][q.section_name] = (byMode[q.test_mode][q.section_name] || 0) + 1;
    });

    console.log('\nBy test mode:');
    Object.entries(byMode).forEach(([mode, sections]) => {
      const total = Object.values(sections).reduce((sum, count) => sum + count, 0);
      console.log(`\n  ${mode}: ${total} total`);
      Object.entries(sections).forEach(([section, count]) => {
        console.log(`    - ${section}: ${count}`);
      });
    });
  }

  // Sample one question to see its structure
  const { data: sample, error: sampleError } = await supabase
    .from('questions_v2')
    .select('*')
    .limit(1);

  if (!sampleError && sample && sample.length > 0) {
    console.log('\n📋 Sample question columns:');
    console.log('  ', Object.keys(sample[0]).join(', '));
  }
}

checkV2RealData().then(() => process.exit(0)).catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
