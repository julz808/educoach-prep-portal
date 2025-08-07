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

async function runCountQuery() {
  // Get all questions for diagnostic and practice modes
  const { data, error } = await supabase
    .from('questions')
    .select('test_type, test_mode')
    .in('test_mode', ['diagnostic', 'practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5']);

  if (error) {
    console.error('Error:', error);
    return;
  }

  // Build counts
  const counts = new Map<string, Map<string, number>>();
  
  for (const row of data || []) {
    if (!counts.has(row.test_type)) {
      counts.set(row.test_type, new Map());
    }
    const testCounts = counts.get(row.test_type)!;
    testCounts.set(row.test_mode, (testCounts.get(row.test_mode) || 0) + 1);
  }

  // Display results
  console.log('QUESTION COUNTS BY TEST PRODUCT\n');
  console.log('Test Type'.padEnd(40) + 'Diagnostic  P1    P2    P3    P4    P5    Total');
  console.log('='.repeat(80));

  const testTypes = Array.from(counts.keys()).sort();
  
  for (const testType of testTypes) {
    const testCounts = counts.get(testType)!;
    const diagnostic = testCounts.get('diagnostic') || 0;
    const p1 = testCounts.get('practice_1') || 0;
    const p2 = testCounts.get('practice_2') || 0;
    const p3 = testCounts.get('practice_3') || 0;
    const p4 = testCounts.get('practice_4') || 0;
    const p5 = testCounts.get('practice_5') || 0;
    const total = diagnostic + p1 + p2 + p3 + p4 + p5;
    
    console.log(
      testType.padEnd(40) +
      diagnostic.toString().padEnd(12) +
      p1.toString().padEnd(6) +
      p2.toString().padEnd(6) +
      p3.toString().padEnd(6) +
      p4.toString().padEnd(6) +
      p5.toString().padEnd(6) +
      total.toString()
    );
  }
  
  console.log('\nGrand Total: ' + (data?.length || 0) + ' questions');
  
  process.exit(0);
}

runCountQuery().catch(console.error);