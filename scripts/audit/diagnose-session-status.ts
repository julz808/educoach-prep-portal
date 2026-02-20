import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseSessions() {
  console.log('🔍 DIAGNOSTIC: Checking session status issues\n');
  console.log('=' .repeat(80));

  // 1. Check all diagnostic sessions
  console.log('\n📊 1. ALL DIAGNOSTIC SESSIONS:');
  console.log('-'.repeat(80));
  const { data: allSessions, error: allError } = await supabase
    .from('user_test_sessions')
    .select('id, user_id, product_type, test_mode, section_name, status, current_question_index, total_questions, questions_answered, created_at, updated_at')
    .eq('test_mode', 'diagnostic')
    .order('product_type')
    .order('section_name')
    .order('updated_at', { ascending: false });

  if (allError) {
    console.error('❌ Error:', allError);
  } else if (allSessions) {
    console.log(`Found ${allSessions.length} diagnostic sessions\n`);
    allSessions.forEach(session => {
      const shortId = session.id.substring(0, 8);
      const shortUserId = session.user_id.substring(0, 8);
      console.log(`  ${shortId}... | ${shortUserId}... | ${session.product_type.padEnd(35)} | ${session.section_name.padEnd(25)} | ${session.status.padEnd(10)} | Q${session.current_question_index}/${session.total_questions} | Answered:${session.questions_answered}`);
    });
  }

  // 2. Check product type variations
  console.log('\n📦 2. PRODUCT TYPE VARIATIONS:');
  console.log('-'.repeat(80));
  const { data: productTypes, error: productError } = await supabase
    .from('user_test_sessions')
    .select('product_type, test_mode');

  if (!productError && productTypes) {
    const groupedByProduct = productTypes.reduce((acc, row) => {
      const key = `${row.product_type}|${row.test_mode}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(groupedByProduct)
      .sort()
      .forEach(([key, count]) => {
        const [product, mode] = key.split('|');
        console.log(`  ${product.padEnd(40)} | ${mode.padEnd(15)} | ${count} sessions`);
      });
  }

  // 3. Check section name variations
  console.log('\n📝 3. SECTION NAME VARIATIONS PER PRODUCT:');
  console.log('-'.repeat(80));
  const { data: sections, error: sectionError } = await supabase
    .from('user_test_sessions')
    .select('product_type, section_name, status')
    .eq('test_mode', 'diagnostic');

  if (!sectionError && sections) {
    const groupedBySectionProduct = sections.reduce((acc, row) => {
      const key = `${row.product_type}|${row.section_name}`;
      if (!acc[key]) {
        acc[key] = { count: 0, statuses: new Set<string>() };
      }
      acc[key].count++;
      acc[key].statuses.add(row.status);
      return acc;
    }, {} as Record<string, { count: number; statuses: Set<string> }>);

    Object.entries(groupedBySectionProduct)
      .sort()
      .forEach(([key, data]) => {
        const [product, section] = key.split('|');
        const statusesStr = Array.from(data.statuses).join(', ');
        console.log(`  ${product.padEnd(35)} | ${section.padEnd(30)} | ${data.count} sessions | Statuses: ${statusesStr}`);
      });
  }

  // 4. Find active sessions that should show as "In Progress"
  console.log('\n🟢 4. ACTIVE SESSIONS (should show as "In Progress"):');
  console.log('-'.repeat(80));
  const { data: activeSessions, error: activeError } = await supabase
    .from('user_test_sessions')
    .select('product_type, section_name, status, current_question_index, total_questions, questions_answered, updated_at')
    .eq('test_mode', 'diagnostic')
    .eq('status', 'active')
    .order('product_type')
    .order('section_name')
    .order('updated_at', { ascending: false });

  if (activeError) {
    console.error('❌ Error:', activeError);
  } else if (activeSessions && activeSessions.length > 0) {
    console.log(`Found ${activeSessions.length} active sessions\n`);
    activeSessions.forEach(session => {
      const progress = session.total_questions > 0
        ? `${Math.round((session.current_question_index / session.total_questions) * 100)}%`
        : '0%';
      console.log(`  ${session.product_type.padEnd(35)} | ${session.section_name.padEnd(25)} | Progress: ${progress.padEnd(5)} | Q${session.current_question_index}/${session.total_questions} | Answered:${session.questions_answered} | Updated: ${session.updated_at}`);
    });
  } else {
    console.log('  No active sessions found');
  }

  // 5. Check status distribution
  console.log('\n📊 5. STATUS DISTRIBUTION:');
  console.log('-'.repeat(80));
  const { data: statusData, error: statusError } = await supabase
    .from('user_test_sessions')
    .select('status')
    .eq('test_mode', 'diagnostic');

  if (!statusError && statusData) {
    const statusCounts = statusData.reduce((acc, row) => {
      acc[row.status] = (acc[row.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(statusCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([status, count]) => {
        const total = statusData.length;
        const percentage = ((count / total) * 100).toFixed(1);
        console.log(`  ${status.padEnd(15)} | ${count.toString().padStart(3)} sessions | ${percentage}%`);
      });
  }

  // 6. Check for potential naming mismatches
  console.log('\n⚠️  6. CHECKING FOR POTENTIAL ISSUES:');
  console.log('-'.repeat(80));

  const expectedProductTypes = [
    'Year 5 NAPLAN',
    'Year 7 NAPLAN',
    'ACER Scholarship (Year 7 Entry)',
    'EduTest Scholarship (Year 7 Entry)',
    'VIC Selective Entry (Year 9 Entry)',
    'NSW Selective Entry (Year 7 Entry)'
  ];

  const { data: actualProducts, error: actualError } = await supabase
    .from('user_test_sessions')
    .select('product_type');

  if (!actualError && actualProducts) {
    const uniqueProducts = [...new Set(actualProducts.map(p => p.product_type))];
    const unexpectedProducts = uniqueProducts.filter(p => !expectedProductTypes.includes(p));

    if (unexpectedProducts.length > 0) {
      console.log('  ❌ Unexpected product types found:');
      unexpectedProducts.forEach(p => console.log(`     - "${p}"`));
    } else {
      console.log('  ✅ All product types match expected values');
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Diagnostic complete\n');
}

diagnoseSessions().catch(console.error);
