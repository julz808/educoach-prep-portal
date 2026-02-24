import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function findPassages() {
  console.log('Looking for passages in the database...\n');

  // Check if passages_v2 table exists and has any data
  const { data: passagesV2, error: errorV2 } = await supabase
    .from('passages_v2')
    .select('*')
    .limit(5);

  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('PASSAGES_V2 TABLE');
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');

  if (errorV2) {
    console.log(`Error: ${errorV2.message}`);
  } else if (!passagesV2 || passagesV2.length === 0) {
    console.log('Table exists but is EMPTY (0 passages)');
  } else {
    console.log(`Found ${passagesV2.length} passages (showing first 5)`);
    console.log('\nSample passage structure:');
    console.log('─'.repeat(80));
    const sample = passagesV2[0];
    Object.keys(sample).forEach(key => {
      const value = sample[key];
      if (value === null) {
        console.log(`${key}: null`);
      } else if (typeof value === 'object') {
        console.log(`${key}: [object]`);
      } else {
        console.log(`${key}: ${typeof value} (${String(value).substring(0, 50)}...)`);
      }
    });
  }

  // Count total passages_v2
  const { count } = await supabase
    .from('passages_v2')
    .select('*', { count: 'exact', head: true });

  console.log(`\nTotal passages in passages_v2: ${count || 0}\n`);

  // Check questions_v2 for passage references
  console.log('\n═══════════════════════════════════════════════════════════════════════════════');
  console.log('QUESTIONS_V2 - PASSAGE REFERENCES');
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');

  const { data: questionsWithPassages } = await supabase
    .from('questions_v2')
    .select('product_type, section_name, passage_id, question_text')
    .not('passage_id', 'is', null)
    .limit(10);

  if (questionsWithPassages && questionsWithPassages.length > 0) {
    console.log(`Found ${questionsWithPassages.length} questions with passage_id (showing first 10)\n`);

    // Group by product
    const byProduct: Record<string, number> = {};
    questionsWithPassages.forEach(q => {
      byProduct[q.product_type] = (byProduct[q.product_type] || 0) + 1;
    });

    console.log('Questions with passage_id by product:');
    Object.entries(byProduct).forEach(([product, count]) => {
      console.log(`  ${product}: ${count} questions`);
    });

    console.log('\n\nSample question with passage:');
    console.log('─'.repeat(80));
    const sample = questionsWithPassages[0];
    console.log(`Product: ${sample.product_type}`);
    console.log(`Section: ${sample.section_name}`);
    console.log(`Passage ID: ${sample.passage_id}`);
    console.log(`\nQuestion text (first 500 chars):`);
    console.log(sample.question_text.substring(0, 500) + '...');
  } else {
    console.log('No questions found with passage_id references');
  }

  // Count total questions with passage_id
  const { count: passageQuestionCount } = await supabase
    .from('questions_v2')
    .select('*', { count: 'exact', head: true })
    .not('passage_id', 'is', null);

  console.log(`\n\nTotal questions with passage_id: ${passageQuestionCount || 0}`);

  // Look for passage text embedded in question_text
  const { data: allQuestions } = await supabase
    .from('questions_v2')
    .select('product_type, question_text')
    .limit(1000);

  if (allQuestions) {
    const withPassageKeyword = allQuestions.filter(q =>
      q.question_text && (
        q.question_text.includes('Passage:') ||
        q.question_text.includes('Read the passage')
      )
    );

    console.log(`\n\nQuestions with "Passage:" or "Read the passage" in text: ${withPassageKeyword.length} / 1000 sampled`);

    // Count by product
    const embeddedByProduct: Record<string, number> = {};
    withPassageKeyword.forEach(q => {
      embeddedByProduct[q.product_type] = (embeddedByProduct[q.product_type] || 0) + 1;
    });

    console.log('\nEmbedded passages by product:');
    Object.entries(embeddedByProduct).forEach(([product, count]) => {
      console.log(`  ${product}: ${count} questions`);
    });
  }

  console.log('\n═══════════════════════════════════════════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log(`
Passages are stored in TWO ways:
1. passages_v2 table: ${count || 0} total passages (separate table)
2. Embedded in question_text: Questions contain "Passage:" or "Read the passage"

Questions reference passages via passage_id: ${passageQuestionCount || 0} questions
  `);
}

findPassages()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
