import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '', 
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

(async () => {
  console.log('Checking questions_v2 table...\n');
  
  const { data, error, count } = await supabase
    .from('questions_v2')
    .select('test_type, section_name', { count: 'exact' })
    .limit(10);
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`Total questions in database: ${count}`);
  console.log('\nFirst 10 rows:');
  console.log(JSON.stringify(data, null, 2));
  
  // Get distinct test types
  const { data: types } = await supabase
    .from('questions_v2')
    .select('test_type')
    .limit(1000);
  
  const uniqueTypes = [...new Set(types?.map(t => t.test_type))];
  console.log('\n\nDistinct test types in database:');
  uniqueTypes.forEach(t => console.log(`  - "${t}"`));
  
  // Get count by test type
  console.log('\n\nCount by test type:');
  for (const type of uniqueTypes) {
    const { count } = await supabase
      .from('questions_v2')
      .select('*', { count: 'exact', head: true })
      .eq('test_type', type);
    console.log(`  ${type}: ${count} questions`);
  }
})();
