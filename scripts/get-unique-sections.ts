import * as dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

async function getUnique() {
  const { data, error } = await supabase
    .from('questions_v2')
    .select('test_type, section_name');

  if (error) {
    console.error('Error:', error);
    return;
  }

  const unique = new Map<string, Set<string>>();

  for (const row of data) {
    if (!unique.has(row.test_type)) {
      unique.set(row.test_type, new Set());
    }
    unique.get(row.test_type)!.add(row.section_name);
  }

  console.log('\n📊 UNIQUE TEST TYPES AND SECTIONS:\n');

  const sorted = Array.from(unique.entries()).sort();
  for (const [testType, sections] of sorted) {
    console.log(`\n${testType}:`);
    Array.from(sections).sort().forEach(section => {
      console.log(`  - ${section}`);
    });
  }

  console.log(`\n\nTotal test types: ${unique.size}`);
  console.log(`Total sections: ${Array.from(unique.values()).reduce((sum, s) => sum + s.size, 0)}`);
}

getUnique();
