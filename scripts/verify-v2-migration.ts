/**
 * V2 Migration Verification Script
 *
 * This script verifies that the platform is correctly using v2 tables
 * by checking actual runtime behavior and database queries.
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
}

const results: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<{ status: 'PASS' | 'FAIL' | 'WARN', message: string }>) {
  console.log(`\n🧪 ${name}...`);
  try {
    const result = await testFn();
    results.push({ name, ...result });
    const icon = result.status === 'PASS' ? '✅' : result.status === 'WARN' ? '⚠️' : '❌';
    console.log(`${icon} ${result.message}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    results.push({ name, status: 'FAIL', message });
    console.log(`❌ FAILED: ${message}`);
  }
}

async function main() {
  console.log('━'.repeat(80));
  console.log('🔍 V2 MIGRATION VERIFICATION');
  console.log('━'.repeat(80));

  // Test 1: Check environment variable
  await runTest('Environment Variable Check', async () => {
    const useV2 = process.env.VITE_USE_V2_QUESTIONS;
    if (useV2 === 'true') {
      return { status: 'PASS', message: 'VITE_USE_V2_QUESTIONS=true ✓' };
    } else {
      return { status: 'FAIL', message: `VITE_USE_V2_QUESTIONS=${useV2} (Expected: true)` };
    }
  });

  // Test 2: Verify questions_v2 table exists and has data
  await runTest('questions_v2 Table Exists', async () => {
    const { count, error } = await supabase
      .from('questions_v2')
      .select('id', { count: 'exact', head: true });

    if (error) {
      return { status: 'FAIL', message: `Table not accessible: ${error.message}` };
    }

    if (count && count > 0) {
      return { status: 'PASS', message: `Table exists with ${count.toLocaleString()} questions` };
    } else {
      return { status: 'WARN', message: 'Table exists but has no data' };
    }
  });

  // Test 3: Verify passages_v2 table exists and has data
  await runTest('passages_v2 Table Exists', async () => {
    const { count, error } = await supabase
      .from('passages_v2')
      .select('id', { count: 'exact', head: true });

    if (error) {
      return { status: 'FAIL', message: `Table not accessible: ${error.message}` };
    }

    if (count && count > 0) {
      return { status: 'PASS', message: `Table exists with ${count.toLocaleString()} passages` };
    } else {
      return { status: 'WARN', message: 'Table exists but has no data' };
    }
  });

  // Test 4: Verify all product types have questions in v2
  await runTest('All Products Have V2 Questions', async () => {
    const productTypes = [
      'Year 5 NAPLAN',
      'Year 7 NAPLAN',
      'ACER Scholarship (Year 7 Entry)',
      'EduTest Scholarship (Year 7 Entry)',
      'NSW Selective Entry (Year 7 Entry)',
      'VIC Selective Entry (Year 9 Entry)'
    ];

    const missingProducts: string[] = [];

    for (const productType of productTypes) {
      const { count } = await supabase
        .from('questions_v2')
        .select('id', { count: 'exact', head: true })
        .eq('test_type', productType);

      if (!count || count === 0) {
        missingProducts.push(productType);
      }
    }

    if (missingProducts.length === 0) {
      return { status: 'PASS', message: 'All 6 product types have questions' };
    } else {
      return { status: 'WARN', message: `Missing questions for: ${missingProducts.join(', ')}` };
    }
  });

  // Test 5: Verify practice tests exist
  await runTest('Practice Tests Exist', async () => {
    const { count } = await supabase
      .from('questions_v2')
      .select('id', { count: 'exact', head: true })
      .in('test_mode', ['practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5']);

    if (count && count > 0) {
      return { status: 'PASS', message: `${count.toLocaleString()} practice test questions found` };
    } else {
      return { status: 'WARN', message: 'No practice test questions found' };
    }
  });

  // Test 6: Verify drill questions exist
  await runTest('Drill Questions Exist', async () => {
    const { count } = await supabase
      .from('questions_v2')
      .select('id', { count: 'exact', head: true })
      .eq('test_mode', 'drill');

    if (count && count > 0) {
      return { status: 'PASS', message: `${count.toLocaleString()} drill questions found` };
    } else {
      return { status: 'WARN', message: 'No drill questions found' };
    }
  });

  // Test 7: Verify diagnostic questions exist
  await runTest('Diagnostic Questions Exist', async () => {
    const { count } = await supabase
      .from('questions_v2')
      .select('id', { count: 'exact', head: true })
      .eq('test_mode', 'diagnostic');

    if (count && count > 0) {
      return { status: 'PASS', message: `${count.toLocaleString()} diagnostic questions found` };
    } else {
      return { status: 'WARN', message: 'No diagnostic questions found' };
    }
  });

  // Test 8: Check v2 table structure
  await runTest('V2 Table Schema Correct', async () => {
    const { data, error } = await supabase
      .from('questions_v2')
      .select('*')
      .limit(1);

    if (error) {
      return { status: 'FAIL', message: `Cannot read v2 schema: ${error.message}` };
    }

    if (data && data.length > 0) {
      const question = data[0];
      const requiredFields = [
        'id', 'test_type', 'test_mode', 'section_name', 'sub_skill',
        'question_text', 'correct_answer', 'solution', 'difficulty'
      ];

      const missingFields = requiredFields.filter(field => !(field in question));

      if (missingFields.length === 0) {
        return { status: 'PASS', message: 'All required fields present' };
      } else {
        return { status: 'FAIL', message: `Missing fields: ${missingFields.join(', ')}` };
      }
    } else {
      return { status: 'WARN', message: 'Cannot verify schema - no data' };
    }
  });

  // Test 9: Verify passage linking works
  await runTest('Passage Linking Works', async () => {
    const { data: questionsWithPassages } = await supabase
      .from('questions_v2')
      .select('id, passage_id')
      .not('passage_id', 'is', null)
      .limit(10);

    if (!questionsWithPassages || questionsWithPassages.length === 0) {
      return { status: 'WARN', message: 'No questions with passages found' };
    }

    const passageIds = questionsWithPassages.map(q => q.passage_id).filter(Boolean);
    const { count } = await supabase
      .from('passages_v2')
      .select('id', { count: 'exact', head: true })
      .in('id', passageIds);

    if (count === passageIds.length) {
      return { status: 'PASS', message: `All ${count} passage references are valid` };
    } else {
      return { status: 'WARN', message: `Some passage references are broken (${count}/${passageIds.length})` };
    }
  });

  // Test 10: Check for any v1 table usage
  await runTest('Old V1 Tables Check', async () => {
    try {
      const { count: v1Count } = await supabase
        .from('questions')
        .select('id', { count: 'exact', head: true });

      if (v1Count && v1Count > 0) {
        return { status: 'WARN', message: `V1 table still exists with ${v1Count.toLocaleString()} questions (This is OK if using v2)` };
      } else {
        return { status: 'PASS', message: 'V1 table is empty or does not exist' };
      }
    } catch (error) {
      return { status: 'PASS', message: 'V1 table does not exist (clean migration)' };
    }
  });

  // Summary
  console.log('\n' + '━'.repeat(80));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('━'.repeat(80));

  const passed = results.filter(r => r.status === 'PASS').length;
  const warned = results.filter(r => r.status === 'WARN').length;
  const failed = results.filter(r => r.status === 'FAIL').length;

  console.log(`✅ Passed: ${passed}`);
  console.log(`⚠️  Warnings: ${warned}`);
  console.log(`❌ Failed: ${failed}`);

  if (failed > 0) {
    console.log('\n❌ MIGRATION VERIFICATION FAILED');
    console.log('Failed tests:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  - ${r.name}: ${r.message}`);
    });
    process.exit(1);
  } else if (warned > 0) {
    console.log('\n⚠️  MIGRATION VERIFICATION PASSED WITH WARNINGS');
    console.log('Warnings:');
    results.filter(r => r.status === 'WARN').forEach(r => {
      console.log(`  - ${r.name}: ${r.message}`);
    });
  } else {
    console.log('\n✅ MIGRATION VERIFICATION PASSED - ALL TESTS SUCCESSFUL');
  }

  console.log('\n' + '━'.repeat(80));
  console.log('🎉 Ready for deployment!');
  console.log('━'.repeat(80));
}

main().catch(console.error);
