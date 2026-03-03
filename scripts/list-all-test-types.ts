import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkAllTestTypes() {
  console.log('Checking all test types in questions_v2...\n');

  const { data: questions, error } = await supabase
    .from('questions_v2')
    .select('test_type, section_name')
    .order('test_type');

  if (error) {
    console.error('Error:', error);
    return;
  }

  const testTypes = new Map<string, Set<string>>();

  for (const q of questions || []) {
    if (!testTypes.has(q.test_type)) {
      testTypes.set(q.test_type, new Set());
    }
    testTypes.get(q.test_type)!.add(q.section_name);
  }

  console.log('All test types and sections:');
  for (const [testType, sections] of Array.from(testTypes.entries()).sort()) {
    if (testType.toLowerCase().includes('vic')) {
      console.log(`\n${testType}:`);
      for (const section of Array.from(sections).sort()) {
        const { count } = await supabase
          .from('questions_v2')
          .select('*', { count: 'exact', head: true })
          .eq('test_type', testType)
          .eq('section_name', section);

        console.log(`  - ${section}: ${count} questions`);
      }
    }
  }
}

checkAllTestTypes();
