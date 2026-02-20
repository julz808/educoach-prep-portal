import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVisualQuestions() {
  console.log('🔍 Checking for visual questions...\n');

  // Check questions with has_visual = true
  const { data: hasVisualTrue, error: error1 } = await supabase
    .from('questions')
    .select('id, test_type, visual_type, has_visual, visual_svg')
    .eq('has_visual', true)
    .limit(5);

  console.log(`Questions with has_visual=true: ${hasVisualTrue?.length || 0}`);
  if (hasVisualTrue && hasVisualTrue.length > 0) {
    console.log('\nSample:');
    hasVisualTrue.forEach((q, i) => {
      console.log(`${i + 1}. ${q.test_type} - visual_type: ${q.visual_type}, has SVG: ${!!q.visual_svg}`);
    });
  }

  // Check questions with visual_svg not null
  const { data: hasSvg, error: error2 } = await supabase
    .from('questions')
    .select('id, test_type, visual_type, has_visual, visual_svg')
    .not('visual_svg', 'is', null)
    .limit(5);

  console.log(`\nQuestions with visual_svg not null: ${hasSvg?.length || 0}`);
  if (hasSvg && hasSvg.length > 0) {
    console.log('\nSample with SVG:');
    hasSvg.forEach((q, i) => {
      const svgPreview = q.visual_svg ? q.visual_svg.substring(0, 100) + '...' : 'null';
      console.log(`${i + 1}. ${q.test_type} - visual_type: ${q.visual_type}`);
      console.log(`   SVG preview: ${svgPreview}\n`);
    });
  }

  // Check questions with visual_type not null
  const { data: hasVisualType, error: error3 } = await supabase
    .from('questions')
    .select('id, test_type, visual_type, has_visual, visual_svg')
    .not('visual_type', 'is', null)
    .limit(5);

  console.log(`\nQuestions with visual_type not null: ${hasVisualType?.length || 0}`);
  if (hasVisualType && hasVisualType.length > 0) {
    console.log('\nSample with visual_type:');
    hasVisualType.forEach((q, i) => {
      console.log(`${i + 1}. ${q.test_type} - visual_type: ${q.visual_type}, has_visual: ${q.has_visual}, has SVG: ${!!q.visual_svg}`);
    });
  }

  // Total count
  const { count, error: error4 } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true });

  console.log(`\n📊 Total questions in database: ${count || 0}`);
}

checkVisualQuestions().catch(console.error);
