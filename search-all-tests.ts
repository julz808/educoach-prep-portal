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

async function searchAllTests() {
  // Get unique test_type values
  const { data, error } = await supabase
    .from('questions')
    .select('test_type')
    .limit(10000);

  if (error) {
    console.error('Error:', error);
    return;
  }

  // Count by test_type
  const counts = new Map<string, number>();
  
  for (const row of data || []) {
    counts.set(row.test_type, (counts.get(row.test_type) || 0) + 1);
  }

  console.log('ALL TEST TYPES IN DATABASE:\n');
  console.log('Test Type'.padEnd(50) + 'Count');
  console.log('='.repeat(60));
  
  const testTypes = Array.from(counts.keys()).sort();
  for (const testType of testTypes) {
    console.log(testType.padEnd(50) + counts.get(testType));
  }
  
  console.log('\nTotal unique test types: ' + testTypes.length);
  console.log('Total questions: ' + (data?.length || 0));
  
  // Search for specific patterns
  console.log('\n\nSEARCHING FOR SPECIFIC PATTERNS:');
  
  const patterns = ['NAPLAN', 'NSW', 'VIC', 'Year 5', 'Year 7', 'Selective'];
  for (const pattern of patterns) {
    const matchCount = data?.filter(d => d.test_type.includes(pattern)).length || 0;
    console.log(`Contains "${pattern}": ${matchCount} questions`);
  }
  
  process.exit(0);
}

searchAllTests().catch(console.error);