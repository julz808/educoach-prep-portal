import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = 'https://mcxxiunseawojmojikvb.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

async function checkActualData() {
  console.log('Checking actual data in database...\n');
  
  // Get unique test_type values
  const { data: testTypes } = await supabase
    .from('questions')
    .select('test_type')
    .limit(1000);
    
  const uniqueTestTypes = [...new Set(testTypes?.map(q => q.test_type))].sort();
  console.log('Unique test_type values in database:');
  uniqueTestTypes.forEach(t => console.log(`  - "${t}"`));
  
  // Get unique section_name values for each test type
  console.log('\nSections by test type:');
  for (const testType of uniqueTestTypes) {
    const { data: sections } = await supabase
      .from('questions')
      .select('section_name')
      .eq('test_type', testType)
      .limit(1000);
      
    const uniqueSections = [...new Set(sections?.map(s => s.section_name))].sort();
    console.log(`\n${testType}:`);
    uniqueSections.forEach(s => console.log(`  - "${s}"`));
  }
  
  // Get unique test_mode values
  const { data: testModes } = await supabase
    .from('questions')
    .select('test_mode')
    .limit(1000);
    
  const uniqueTestModes = [...new Set(testModes?.map(q => q.test_mode))].sort();
  console.log('\nUnique test_mode values in database:');
  uniqueTestModes.forEach(m => console.log(`  - "${m}"`));
  
  // Get actual counts for some specific combinations
  console.log('\n=== Sample Counts ===\n');
  
  const sampleQueries = [
    { test_type: 'Year 5 NAPLAN', section_name: 'Reading' },
    { test_type: 'Year 7 NAPLAN', section_name: 'Reading' },
    { test_type: 'NSW Selective Entry (Year 7 Entry)', section_name: 'Reading' },
  ];
  
  for (const query of sampleQueries) {
    const { data, count } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('test_type', query.test_type)
      .eq('section_name', query.section_name);
      
    console.log(`${query.test_type} - ${query.section_name}: ${count} questions`);
  }
  
  process.exit(0);
}

checkActualData().catch(console.error);