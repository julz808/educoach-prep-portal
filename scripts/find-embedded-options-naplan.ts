import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function findEmbeddedOptions() {
  console.log('🔍 Searching for NAPLAN Language Conventions questions with embedded options...\n');

  // Query Year 5 and Year 7 NAPLAN Language Conventions questions
  const { data: year5, error: error5 } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('test_type', 'Year 5 NAPLAN')
    .eq('section_name', 'Language Conventions');

  const { data: year7, error: error7 } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('test_type', 'Year 7 NAPLAN')
    .eq('section_name', 'Language Conventions');

  if (error5 || error7) {
    console.error('Error fetching questions:', error5 || error7);
    return;
  }

  const allQuestions = [...(year5 || []), ...(year7 || [])];

  console.log(`📊 Found ${allQuestions.length} total Language Conventions questions`);
  console.log(`  - Year 5: ${year5?.length || 0}`);
  console.log(`  - Year 7: ${year7?.length || 0}\n`);

  // Find questions that have "A:" "B:" "C:" "D:" pattern in question_text
  const questionsWithEmbeddedOptions = allQuestions.filter(q => {
    const text = q.question_text || '';
    // Look for patterns like "A: " or "A)" followed by text
    // Must have multiple options to be considered embedded
    const hasA = /[^\w]A[:\)]\s+/g.test(text);
    const hasB = /[^\w]B[:\)]\s+/g.test(text);
    const hasC = /[^\w]C[:\)]\s+/g.test(text);
    const hasD = /[^\w]D[:\)]\s+/g.test(text);

    // Need at least 3 options to consider it embedded options
    const optionCount = [hasA, hasB, hasC, hasD].filter(Boolean).length;
    return optionCount >= 3;
  });

  console.log(`🎯 Found ${questionsWithEmbeddedOptions.length} questions with embedded options\n`);

  // Group by test type
  const byTestType = questionsWithEmbeddedOptions.reduce((acc, q) => {
    const key = q.test_type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(q);
    return acc;
  }, {} as Record<string, any[]>);

  for (const [testType, qs] of Object.entries(byTestType)) {
    console.log(`📝 ${testType}: ${qs.length} questions`);
  }

  // Show first few examples
  console.log('\n📋 Sample questions with embedded options:\n');
  questionsWithEmbeddedOptions.slice(0, 3).forEach((q, idx) => {
    console.log(`${'='.repeat(80)}`);
    console.log(`Example ${idx + 1} (ID: ${q.id})`);
    console.log(`Test Type: ${q.test_type}`);
    console.log(`Sub-skill: ${q.sub_skill_id}`);
    console.log(`\nQuestion Text:`);
    console.log(q.question_text);
    console.log(`\nStored Options:`);
    console.log(`A: ${q.option_a}`);
    console.log(`B: ${q.option_b}`);
    console.log(`C: ${q.option_c}`);
    console.log(`D: ${q.option_d}`);
    console.log(`\nCorrect Answer: ${q.correct_answer}`);
    console.log(`${'='.repeat(80)}\n`);
  });

  // Export full list to JSON
  const exportData = questionsWithEmbeddedOptions.map(q => ({
    id: q.id,
    test_type: q.test_type,
    section_name: q.section_name,
    sub_skill_id: q.sub_skill_id,
    question_text: q.question_text,
    option_a: q.option_a,
    option_b: q.option_b,
    option_c: q.option_c,
    option_d: q.option_d,
    correct_answer: q.correct_answer
  }));

  console.log(`💾 Exporting ${exportData.length} questions to embedded-options-naplan.json`);

  const fs = await import('fs');
  fs.writeFileSync(
    'embedded-options-naplan.json',
    JSON.stringify(exportData, null, 2)
  );

  console.log('\n✅ Analysis complete!');
  console.log(`\nSummary:`);
  console.log(`- Total Language Conventions questions: ${allQuestions.length}`);
  console.log(`- Questions with embedded options: ${questionsWithEmbeddedOptions.length}`);
  console.log(`- Percentage: ${((questionsWithEmbeddedOptions.length / allQuestions.length) * 100).toFixed(1)}%`);
  console.log(`- Export file: embedded-options-naplan.json`);
}

findEmbeddedOptions();
