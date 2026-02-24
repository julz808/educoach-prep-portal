import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkStructure() {
  const { data, error } = await supabase
    .from('questions_v2')
    .select('product_type, test_mode, section_name');

  if (error) {
    console.error('Error:', error);
    return;
  }

  const grouped: Record<string, Record<string, Set<string>>> = {};

  data?.forEach(q => {
    if (!grouped[q.product_type]) grouped[q.product_type] = {};
    if (!grouped[q.product_type][q.test_mode]) grouped[q.product_type][q.test_mode] = new Set();
    grouped[q.product_type][q.test_mode].add(q.section_name);
  });

  console.log('\nDatabase Structure:');
  console.log('==================\n');

  for (const [product, modes] of Object.entries(grouped)) {
    console.log(`📦 ${product}`);
    for (const [mode, sections] of Object.entries(modes)) {
      console.log(`  📝 ${mode}`);
      Array.from(sections).forEach(section => {
        const count = data?.filter(q =>
          q.product_type === product &&
          q.test_mode === mode &&
          q.section_name === section
        ).length;
        console.log(`    - ${section}: ${count} questions`);
      });
    }
    console.log('');
  }
}

checkStructure().then(() => process.exit(0));
