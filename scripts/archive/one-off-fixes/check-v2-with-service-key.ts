import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env');
  console.log('💡 This key is needed to bypass RLS and see the actual data');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkV2WithServiceKey() {
  console.log('🔍 Checking questions_v2 with SERVICE ROLE KEY (bypasses RLS)...\n');

  // Get total count
  const { count: totalCount, error: countError } = await supabaseAdmin
    .from('questions_v2')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 Total questions in V2: ${totalCount}`);
  if (countError) {
    console.error('Error:', countError);
    return;
  }

  // Get VIC Selective Practice Test 3
  const { data: practice3, error: p3Error } = await supabaseAdmin
    .from('questions_v2')
    .select('test_mode, section_name, id')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
    .eq('test_mode', 'practice_3');

  if (p3Error) {
    console.error('❌ Error:', p3Error);
  } else {
    console.log(`\n📋 Practice Test 3: ${practice3.length} questions`);

    const sections: Record<string, number> = {};
    practice3.forEach(q => {
      sections[q.section_name] = (sections[q.section_name] || 0) + 1;
    });

    Object.entries(sections).forEach(([section, count]) => {
      console.log(`  ${section}: ${count}`);
    });
  }
}

checkV2WithServiceKey().then(() => process.exit(0)).catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
