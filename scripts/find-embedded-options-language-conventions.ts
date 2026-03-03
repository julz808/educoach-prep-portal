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
  const { data: questions, error } = await supabase
    .from('questions_v2')
    .select('*')
    .in('test_type', ['year-5-naplan', 'year-7-naplan'])
    .ilike('section_name', '%language%conventions%')
    .order('id');

  if (error) {
    console.error('Error fetching questions:', error);
    return;
  }

  console.log(`📊 Found ${questions.length} total Language Conventions questions\n`);

  // Find questions that have "A:" "B:" "C:" "D:" pattern in question_text
  const questionsWithEmbeddedOptions = questions.filter(q => {
    const text = q.question_text || '';
    // Look for patterns like "A: " or "A)" or "A." followed by text
    const hasOptionsPattern = /[A-D]:\s+/g.test(text) || /[A-D]\)\s+/g.test(text);
    return hasOptionsPattern;
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
    console.log(`\n📝 ${testType}: ${qs.length} questions`);
  }

  // Show first few examples
  console.log('\n📋 Sample questions with embedded options:\n');
  questionsWithEmbeddedOptions.slice(0, 5).forEach((q, idx) => {
    console.log(`--- Example ${idx + 1} (ID: ${q.id}) ---`);
    console.log(`Test Type: ${q.test_type}`);
    console.log(`Sub-skill: ${q.sub_skill_id}`);
    console.log(`Question Text (first 500 chars):`);
    console.log(q.question_text.substring(0, 500));
    console.log(`\nOptions:`);
    console.log(`A: ${q.option_a}`);
    console.log(`B: ${q.option_b}`);
    console.log(`C: ${q.option_c}`);
    console.log(`D: ${q.option_d}`);
    console.log('\n' + '='.repeat(80) + '\n');
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

  console.log(`💾 Exporting ${exportData.length} questions to embedded-options-questions.json`);

  const fs = await import('fs');
  fs.writeFileSync(
    'embedded-options-questions.json',
    JSON.stringify(exportData, null, 2)
  );

  console.log('\n✅ Analysis complete!');
  console.log(`\nSummary:`);
  console.log(`- Total questions analyzed: ${questions.length}`);
  console.log(`- Questions with embedded options: ${questionsWithEmbeddedOptions.length}`);
  console.log(`- Export file: embedded-options-questions.json`);
}

findEmbeddedOptions();
