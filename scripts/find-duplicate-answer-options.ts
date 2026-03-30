import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface Question {
  id: number;
  sub_skill: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  test_type: string;
  test_mode: string;
  question_number: number;
}

async function findDuplicateOptions() {
  console.log('🔍 Searching for questions with duplicate answer options...\n');

  // Fetch all questions
  const { data: questions, error } = await supabase
    .from('questions_v2')
    .select('*')
    .order('id');

  if (error) {
    console.error('Error fetching questions:', error);
    return;
  }

  if (!questions || questions.length === 0) {
    console.log('No questions found.');
    return;
  }

  console.log(`✅ Fetched ${questions.length} questions\n`);

  const problematicQuestions: {
    question: Question;
    duplicates: string[];
  }[] = [];

  // Check each question for duplicate options
  for (const question of questions) {
    if (!question.options || question.options.length === 0) {
      continue;
    }

    const options = question.options;

    // Find duplicates
    const seen = new Set<string>();
    const duplicates = new Set<string>();

    for (const option of options) {
      const normalized = option.trim().toLowerCase();
      if (seen.has(normalized)) {
        duplicates.add(option);
      }
      seen.add(normalized);
    }

    if (duplicates.size > 0) {
      problematicQuestions.push({
        question,
        duplicates: Array.from(duplicates)
      });
    }
  }

  // Report findings
  console.log('=' .repeat(80));
  console.log(`📊 SUMMARY: Found ${problematicQuestions.length} questions with duplicate answer options`);
  console.log('='.repeat(80));
  console.log();

  if (problematicQuestions.length > 0) {
    console.log('🚨 PROBLEMATIC QUESTIONS:\n');

    for (const item of problematicQuestions) {
      const q = item.question;
      console.log(`ID: ${q.id}`);
      console.log(`Test: ${q.test_type} - ${q.test_mode} Q${q.question_number}`);
      console.log(`Sub-skill: ${q.sub_skill}`);
      console.log(`Question: ${q.question_text.substring(0, 100)}${q.question_text.length > 100 ? '...' : ''}`);
      console.log(`Options:`);
      q.options.forEach((opt, idx) => {
        console.log(`  ${String.fromCharCode(65 + idx)}) ${opt}`);
      });
      console.log(`Correct Answer: ${q.correct_answer}`);
      console.log(`⚠️  Duplicate values: ${item.duplicates.join(', ')}`);
      console.log('-'.repeat(80));
      console.log();
    }

    // Group by sub-skill
    const bySkill = new Map<string, number>();
    for (const item of problematicQuestions) {
      const key = item.question.sub_skill;
      bySkill.set(key, (bySkill.get(key) || 0) + 1);
    }

    console.log('\n📈 BREAKDOWN BY SKILL:');
    console.log('='.repeat(80));
    for (const [skill, count] of Array.from(bySkill.entries()).sort((a, b) => b[1] - a[1])) {
      console.log(`${skill}: ${count} question(s)`);
    }

    // Save to JSON file
    const report = {
      timestamp: new Date().toISOString(),
      total_questions: questions.length,
      problematic_count: problematicQuestions.length,
      questions: problematicQuestions.map(item => ({
        id: item.question.id,
        test_type: item.question.test_type,
        test_mode: item.question.test_mode,
        question_number: item.question.question_number,
        sub_skill: item.question.sub_skill,
        question_text: item.question.question_text,
        options: item.question.options,
        correct_answer: item.question.correct_answer,
        duplicates: item.duplicates
      }))
    };

    const fs = require('fs');
    const filename = `duplicate-options-report-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    console.log(`\n💾 Full report saved to: ${filename}`);
  } else {
    console.log('✅ No questions with duplicate answer options found!');
  }
}

findDuplicateOptions();