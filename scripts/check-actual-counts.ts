import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCounts() {
  console.log('Checking actual database counts...\n');

  // Count questions_v2
  const { count: questionsCount, error: questionsError } = await supabase
    .from('questions_v2')
    .select('*', { count: 'exact', head: true });

  if (questionsError) {
    console.error('Error counting questions_v2:', questionsError);
  } else {
    console.log(`✅ questions_v2 table: ${questionsCount} rows`);
  }

  // Count passages_v2
  const { count: passagesCount, error: passagesError } = await supabase
    .from('passages_v2')
    .select('*', { count: 'exact', head: true });

  if (passagesError) {
    console.error('Error counting passages_v2:', passagesError);
  } else {
    console.log(`✅ passages_v2 table: ${passagesCount} rows`);
  }

  // Get breakdown by product
  console.log('\n📊 Questions by Product:');
  const { data: products, error: productsError } = await supabase
    .from('questions_v2')
    .select('product_type');

  if (!productsError && products) {
    const productCounts = new Map<string, number>();
    products.forEach(q => {
      productCounts.set(q.product_type, (productCounts.get(q.product_type) || 0) + 1);
    });

    for (const [product, count] of Array.from(productCounts.entries()).sort()) {
      console.log(`  - ${product}: ${count}`);
    }
  }

  // Get breakdown by test_mode
  console.log('\n📊 Questions by Test Mode:');
  const { data: modes, error: modesError } = await supabase
    .from('questions_v2')
    .select('test_mode');

  if (!modesError && modes) {
    const modeCounts = new Map<string, number>();
    modes.forEach(q => {
      modeCounts.set(q.test_mode, (modeCounts.get(q.test_mode) || 0) + 1);
    });

    for (const [mode, count] of Array.from(modeCounts.entries()).sort()) {
      console.log(`  - ${mode}: ${count}`);
    }
  }
}

checkCounts().catch(console.error);
