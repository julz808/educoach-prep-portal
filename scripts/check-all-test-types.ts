import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkTestTypes() {
  console.log('🔍 Checking all test types in questions_v2...\n');

  const { data: questions, error } = await supabase
    .from('questions_v2')
    .select('test_type, section_name')
    .limit(1000);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${questions?.length || 0} questions\n`);

  // Get unique test types
  const uniqueTestTypes = new Set(questions?.map(q => q.test_type) || []);

  console.log('Unique test_type values:');
  Array.from(uniqueTestTypes).sort().forEach(testType => {
    const count = questions?.filter(q => q.test_type === testType).length || 0;
    console.log(`  ${testType} (${count} questions)`);
  });

  // Show unique section names for each test type
  console.log('\n\nSection names by test type:');
  Array.from(uniqueTestTypes).sort().forEach(testType => {
    const sections = new Set(
      questions?.filter(q => q.test_type === testType).map(q => q.section_name) || []
    );
    console.log(`\n${testType}:`);
    Array.from(sections).sort().forEach(section => {
      const count = questions?.filter(q => q.test_type === testType && q.section_name === section).length || 0;
      console.log(`  - ${section} (${count} questions)`);
    });
  });
}

checkTestTypes();
