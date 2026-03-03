import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkVicSections() {
  console.log('Checking VIC Selective test types and sections...\n');

  // Get all distinct test_type and section_name combinations for VIC
  const { data: questions, error } = await supabase
    .from('questions_v2')
    .select('test_type, section_name')
    .like('test_type', '%vic%')
    .order('test_type, section_name');

  if (error) {
    console.error('Error:', error);
    return;
  }

  const combinations = new Map<string, Set<string>>();

  for (const q of questions || []) {
    if (!combinations.has(q.test_type)) {
      combinations.set(q.test_type, new Set());
    }
    combinations.get(q.test_type)!.add(q.section_name);
  }

  console.log('Test types and sections found:');
  for (const [testType, sections] of combinations) {
    console.log(`\n${testType}:`);
    for (const section of sections) {
      const { count } = await supabase
        .from('questions_v2')
        .select('*', { count: 'exact', head: true })
        .eq('test_type', testType)
        .eq('section_name', section);

      console.log(`  - ${section}: ${count} questions`);
    }
  }
}

checkVicSections();
