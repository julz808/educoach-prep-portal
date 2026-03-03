import * as dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

async function checkBothTables() {
  console.log('\n🔍 Checking both questions and questions_v2 tables...\n');

  // Check questions_v2
  const { data: v2Data, error: v2Error } = await supabase
    .from('questions_v2')
    .select('test_type', { count: 'exact', head: true });

  console.log('questions_v2 table:');
  if (v2Error) {
    console.log('  Error:', v2Error.message);
  } else {
    console.log(`  Total questions: ${v2Data?.length || 0}`);
  }

  // Get unique test types from v2
  const { data: v2Types } = await supabase
    .from('questions_v2')
    .select('test_type')
    .limit(10000);

  const v2UniqueTypes = new Set(v2Types?.map(r => r.test_type) || []);
  console.log('  Unique test types:', Array.from(v2UniqueTypes).sort());

  // Check questions (v1)
  const { count: v1Count, error: v1Error } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true });

  console.log('\nquestions table (v1):');
  if (v1Error) {
    console.log('  Error:', v1Error.message);
  } else {
    console.log(`  Total questions: ${v1Count || 0}`);
  }

  // Get unique test types from v1
  const { data: v1Types } = await supabase
    .from('questions')
    .select('test_type')
    .limit(10000);

  const v1UniqueTypes = new Set(v1Types?.map(r => r.test_type) || []);
  console.log('  Unique test types:', Array.from(v1UniqueTypes).sort());

  console.log('\n📊 Summary:');
  console.log(`  questions_v2: ${v2Data?.length || 0} questions, ${v2UniqueTypes.size} test types`);
  console.log(`  questions (v1): ${v1Count || 0} questions, ${v1UniqueTypes.size} test types`);

  // Check for NAPLAN specifically
  const { count: naplanV1Count } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .ilike('test_type', '%naplan%');

  const { count: naplanV2Count } = await supabase
    .from('questions_v2')
    .select('*', { count: 'exact', head: true })
    .ilike('test_type', '%naplan%');

  console.log('\n🔍 NAPLAN Questions:');
  console.log(`  questions (v1): ${naplanV1Count || 0} NAPLAN questions`);
  console.log(`  questions_v2: ${naplanV2Count || 0} NAPLAN questions`);

  if ((naplanV1Count || 0) > 0) {
    const { data: naplanV1Sections } = await supabase
      .from('questions')
      .select('test_type, section')
      .ilike('test_type', '%naplan%')
      .limit(1000);

    const naplanSections = new Map<string, Set<string>>();
    for (const row of naplanV1Sections || []) {
      if (!naplanSections.has(row.test_type)) {
        naplanSections.set(row.test_type, new Set());
      }
      naplanSections.get(row.test_type)!.add(row.section);
    }

    console.log('\n  NAPLAN in questions (v1) table:');
    for (const [testType, sections] of Array.from(naplanSections.entries()).sort()) {
      console.log(`    ${testType}:`);
      Array.from(sections).sort().forEach(section => {
        console.log(`      - ${section}`);
      });
    }
  }
}

checkBothTables();
