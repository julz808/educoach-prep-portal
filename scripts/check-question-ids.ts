import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkQuestionIds() {
  console.log('\n🔍 CHECKING QUESTION IDs\n');

  // Get a sample session with question_order
  const { data: session } = await supabase
    .from('user_test_sessions')
    .select('id, product_type, test_mode, section_name, question_order')
    .eq('user_id', '320cf4a6-8914-4a25-8b1c-1007477d9adc')
    .eq('status', 'completed')
    .not('question_order', 'is', null)
    .limit(1)
    .single();

  if (!session) {
    console.log('No session found');
    return;
  }

  const questionOrder = session.question_order as string[];
  console.log(`📊 Session: ${session.id.substring(0, 8)}...`);
  console.log(`   Product: ${session.product_type}`);
  console.log(`   Test Mode: ${session.test_mode}`);
  console.log(`   Section: ${session.section_name}`);
  console.log(`   Question IDs in session: ${questionOrder.length}`);
  console.log(`   First few IDs: ${questionOrder.slice(0, 3).map(id => id.substring(0, 8) + '...').join(', ')}\n`);

  // Check if these questions exist
  const { data: existingQuestions } = await supabase
    .from('questions')
    .select('id')
    .in('id', questionOrder.slice(0, 10));

  console.log(`❓ Questions found in database: ${existingQuestions?.length || 0} out of ${questionOrder.slice(0, 10).length} checked\n`);

  // Check what questions DO exist for this product/test_mode
  const { data: actualQuestions } = await supabase
    .from('questions')
    .select('id, section_name, sub_skill')
    .eq('product_type', session.product_type)
    .eq('test_mode', session.test_mode)
    .limit(5);

  console.log(`📚 Questions that DO exist for ${session.product_type} / ${session.test_mode}:`);
  actualQuestions?.forEach((q, i) => {
    console.log(`   ${i + 1}. ID: ${q.id.substring(0, 8)}..., Section: ${q.section_name}, Sub-skill: ${q.sub_skill}`);
  });

  // Count total questions
  const { count } = await supabase
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .eq('product_type', session.product_type)
    .eq('test_mode', session.test_mode);

  console.log(`\n📊 Total questions in database: ${count || 0}`);

  // Check if question_order IDs match ANY questions at all
  console.log(`\n🔍 Checking if session question IDs exist ANYWHERE...`);
  for (const qId of questionOrder.slice(0, 3)) {
    const { data: anyMatch } = await supabase
      .from('questions')
      .select('id, product_type, test_mode, section_name')
      .eq('id', qId)
      .single();

    if (anyMatch) {
      console.log(`   ✓ ${qId.substring(0, 8)}... exists: ${anyMatch.product_type} / ${anyMatch.test_mode} / ${anyMatch.section_name}`);
    } else {
      console.log(`   ✗ ${qId.substring(0, 8)}... DOES NOT EXIST`);
    }
  }
}

checkQuestionIds().catch(console.error);
