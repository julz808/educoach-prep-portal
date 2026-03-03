import * as dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

async function debug() {
  console.log('\n🔍 Debugging unique sections query...\n');

  // Method 1: Get ALL questions and aggregate locally
  console.log('Method 1: Loading ALL questions and aggregating locally...');
  const { data: allQuestions, error } = await supabase
    .from('questions_v2')
    .select('test_type, section_name');

  console.log(`  Loaded: ${allQuestions?.length || 0} questions`);
  console.log(`  Error: ${error?.message || 'none'}`);

  if (allQuestions) {
    const uniqueSet = new Set<string>();
    for (const q of allQuestions) {
      uniqueSet.add(`${q.test_type}|||${q.section_name}`);
    }

    console.log(`  Unique combinations: ${uniqueSet.size}`);
    console.log('\n  Sections found:');
    Array.from(uniqueSet).sort().forEach(s => {
      const [test_type, section_name] = s.split('|||');
      console.log(`    ${test_type} - ${section_name}`);
    });
  }
}

debug();
