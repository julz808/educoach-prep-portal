import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function listProducts() {
  console.log('Fetching all products from questions_v2...\n');

  const { data: allQuestions, error } = await supabase
    .from('questions_v2')
    .select('product_type, difficulty');

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (!allQuestions || allQuestions.length === 0) {
    console.log('No questions found!');
    return;
  }

  // Count by product
  const productCounts: Record<string, { total: number; easy: number; medium: number; hard: number }> = {};

  allQuestions.forEach(q => {
    if (!productCounts[q.product_type]) {
      productCounts[q.product_type] = { total: 0, easy: 0, medium: 0, hard: 0 };
    }
    productCounts[q.product_type].total++;
    if (q.difficulty === 1) productCounts[q.product_type].easy++;
    if (q.difficulty === 2) productCounts[q.product_type].medium++;
    if (q.difficulty === 3) productCounts[q.product_type].hard++;
  });

  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('ALL PRODUCTS IN QUESTIONS_V2 DATABASE');
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');

  console.log('Product'.padEnd(40) + ' | Total | Easy | Med | Hard');
  console.log('─'.repeat(80));

  for (const [product, counts] of Object.entries(productCounts).sort()) {
    const easyPct = ((counts.easy / counts.total) * 100).toFixed(0);
    const medPct = ((counts.medium / counts.total) * 100).toFixed(0);
    const hardPct = ((counts.hard / counts.total) * 100).toFixed(0);

    console.log(
      product.padEnd(40) + ' | ' +
      counts.total.toString().padStart(5) + ' | ' +
      `${counts.easy} (${easyPct}%)`.padStart(9) + ' | ' +
      `${counts.medium} (${medPct}%)`.padStart(9) + ' | ' +
      `${counts.hard} (${hardPct}%)`.padStart(9)
    );
  }

  console.log('\n' + '═'.repeat(80));
  console.log(`TOTAL QUESTIONS: ${allQuestions.length}`);
  console.log('═'.repeat(80));
}

listProducts()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
