#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface Question {
  id: string;
  test_type: string;
  test_mode: string;
  section_name: string;
  sub_skill?: string;
  question_order: number;
  question_text: string;
  answer_options: string[];
  correct_answer: string;
  solution: string;
  passage_id?: string;
  year_level?: number;
}

interface Passage {
  id: string;
  passage_text: string;
  passage_title?: string;
}

interface AuditIssue {
  question_id: string;
  test_mode: string;
  question_order: number;
  question_text: string;
  my_answer: string;
  stored_answer: string;
  issue_type: string;
  details: string;
  sql_fix?: string;
}

const auditResults: {
  progress: string[];
  flagged_issues: AuditIssue[];
  sql_fixes: string[];
} = {
  progress: [],
  flagged_issues: [],
  sql_fixes: []
};

// Save progress periodically
function saveProgress() {
  const outputPath = path.join(__dirname, '../docs/04-analysis/VIC_VERBAL_READING_AUDIT.json');
  fs.writeFileSync(outputPath, JSON.stringify(auditResults, null, 2));
  console.log(`Progress saved to ${outputPath}`);
}

async function getPassage(passageId: string): Promise<Passage | null> {
  const { data, error } = await supabase
    .from('passages_v2')
    .select('*')
    .eq('id', passageId)
    .single();

  if (error) {
    console.error(`Error fetching passage ${passageId}:`, error);
    return null;
  }

  return data;
}

async function fetchQuestions() {
  console.log('Fetching questions...');

  const { data, error } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
    .in('section_name', ['General Ability - Verbal', 'Reading Reasoning'])
    .in('test_mode', ['practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5'])
    .order('test_mode', { ascending: true })
    .order('question_order', { ascending: true });

  if (error) {
    console.error('Error fetching questions:', error);
    return [];
  }

  console.log(`Found ${data?.length || 0} questions`);
  return data as Question[];
}

async function auditQuestion(question: Question, passage: Passage | null) {
  console.log(`\n--- Auditing ${question.test_mode} Q${question.question_order} ---`);
  console.log(`Question: ${question.question_text.substring(0, 100)}...`);

  // Log passage if available
  if (passage) {
    console.log(`Passage: ${passage.passage_text.substring(0, 100)}...`);
  }

  // Here I will manually analyze each question
  // For now, return null to indicate no issue found
  return null;
}

async function main() {
  console.log('Starting VIC Selective Verbal & Reading Audit...\n');

  const questions = await fetchQuestions();

  if (questions.length === 0) {
    console.log('No questions found!');
    return;
  }

  console.log(`\nTotal questions to audit: ${questions.length}\n`);

  // Group by test mode
  const byTestMode: { [key: string]: Question[] } = {};
  questions.forEach(q => {
    const tm = q.test_mode;
    if (!byTestMode[tm]) {
      byTestMode[tm] = [];
    }
    byTestMode[tm].push(q);
  });

  console.log('Questions by test mode:');
  Object.keys(byTestMode).sort().forEach(tm => {
    console.log(`  ${tm}: ${byTestMode[tm].length} questions`);
  });

  // Start auditing
  for (const tm of Object.keys(byTestMode).sort()) {
    const tmQuestions = byTestMode[tm];

    console.log(`\n\n========== ${tm.toUpperCase()} ==========`);
    console.log(`Total questions: ${tmQuestions.length}\n`);

    for (const question of tmQuestions) {
      let passage: Passage | null = null;

      // Fetch passage if exists
      if (question.passage_id) {
        passage = await getPassage(question.passage_id);
      }

      // Display the question for manual audit
      console.log(`\n${'='.repeat(80)}`);
      console.log(`${question.test_mode.toUpperCase()} - QUESTION ${question.question_order}`);
      console.log(`Section: ${question.section_name}`);
      if (question.sub_skill) {
        console.log(`Sub-skill: ${question.sub_skill}`);
      }
      console.log(`${'='.repeat(80)}`);

      if (passage) {
        console.log(`\n📖 PASSAGE:`);
        console.log(passage.passage_text);
        console.log('');
      }

      console.log(`\n❓ QUESTION:`);
      console.log(question.question_text);

      console.log(`\n📝 OPTIONS:`);
      question.answer_options.forEach((opt) => {
        console.log(`  ${opt}`);
      });

      console.log(`\n✅ STORED ANSWER: ${question.correct_answer}`);
      console.log(`\n💡 STORED SOLUTION:`);
      console.log(question.solution);

      console.log(`\n${'='.repeat(80)}`);
      console.log(`Question ID: ${question.id}`);
      console.log(`${'='.repeat(80)}\n`);

      // Mark progress
      auditResults.progress.push(
        `${question.test_mode} Q${question.question_order} - ${question.section_name}`
      );

      // Save progress every 5 questions
      if (auditResults.progress.length % 5 === 0) {
        saveProgress();
      }
    }
  }

  console.log('\n\n========== AUDIT COMPLETE ==========');
  console.log(`Total questions audited: ${auditResults.progress.length}`);
  console.log(`Total issues flagged: ${auditResults.flagged_issues.length}`);

  saveProgress();
}

main().catch(console.error);
