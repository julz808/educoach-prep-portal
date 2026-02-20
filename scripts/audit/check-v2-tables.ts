import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkV2Tables() {
  console.log('🔍 Checking for V2 tables...\n');

  // Check questions_v2
  const { data: questionsV2, error: error1 } = await supabase
    .from('questions_v2')
    .select('id, test_type, visual_type, visual_svg')
    .limit(1);

  if (error1) {
    console.log('❌ questions_v2 table:', error1.message);
  } else {
    console.log('✅ questions_v2 table exists!');

    // Count total questions
    const { count } = await supabase
      .from('questions_v2')
      .select('*', { count: 'exact', head: true });

    console.log(`   Total questions: ${count || 0}`);

    // Count visual questions
    const { count: visualCount } = await supabase
      .from('questions_v2')
      .select('*', { count: 'exact', head: true })
      .not('visual_svg', 'is', null);

    console.log(`   Visual questions: ${visualCount || 0}`);

    if (visualCount && visualCount > 0) {
      const { data: samples } = await supabase
        .from('questions_v2')
        .select('test_type, visual_type, sub_skill')
        .not('visual_svg', 'is', null)
        .limit(5);

      console.log('\n📊 Sample visual questions:');
      samples?.forEach((q, i) => {
        console.log(`   ${i + 1}. ${q.test_type} - ${q.visual_type} - ${q.sub_skill}`);
      });
    }
  }

  // Check passages_v2
  const { data: passagesV2, error: error2 } = await supabase
    .from('passages_v2')
    .select('id')
    .limit(1);

  if (error2) {
    console.log('\n❌ passages_v2 table:', error2.message);
  } else {
    const { count } = await supabase
      .from('passages_v2')
      .select('*', { count: 'exact', head: true });
    console.log(`\n✅ passages_v2 table exists! (${count || 0} passages)`);
  }

  // Check sub_skills_v2
  const { data: subSkillsV2, error: error3 } = await supabase
    .from('sub_skills_v2')
    .select('id')
    .limit(1);

  if (error3) {
    console.log('❌ sub_skills_v2 table:', error3.message);
  } else {
    const { count } = await supabase
      .from('sub_skills_v2')
      .select('*', { count: 'exact', head: true });
    console.log(`✅ sub_skills_v2 table exists! (${count || 0} sub-skills)`);
  }
}

checkV2Tables().catch(console.error);
