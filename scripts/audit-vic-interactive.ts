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
  section_name: string;
  sub_skill?: string;
  question_text_preview: string;
  my_answer: string;
  my_reasoning: string;
  stored_answer: string;
  stored_solution: string;
  issue_type: 'wrong_answer' | 'missing_option' | 'bad_solution' | 'nonsensical_question' | 'other';
  details: string;
  proposed_fix?: {
    correct_answer?: string;
    new_solution?: string;
    new_options?: string[];
  };
}

// Load or initialize audit file
const outputPath = path.join(__dirname, '../docs/04-analysis/VIC_VERBAL_READING_AUDIT.json');

let auditData: {
  last_audited_index: number;
  total_questions: number;
  progress: string[];
  flagged_issues: AuditIssue[];
  sql_fixes: string[];
  audit_completed: boolean;
} = {
  last_audited_index: -1,
  total_questions: 0,
  progress: [],
  flagged_issues: [],
  sql_fixes: [],
  audit_completed: false
};

function loadProgress() {
  if (fs.existsSync(outputPath)) {
    const data = fs.readFileSync(outputPath, 'utf-8');
    auditData = JSON.parse(data);
    console.log(`\n✅ Loaded progress: ${auditData.progress.length}/${auditData.total_questions} questions audited`);
    console.log(`   ${auditData.flagged_issues.length} issues flagged\n`);
  }
}

function saveProgress() {
  fs.writeFileSync(outputPath, JSON.stringify(auditData, null, 2));
  console.log(`\n💾 Progress saved: ${auditData.progress.length}/${auditData.total_questions} audited, ${auditData.flagged_issues.length} issues flagged\n`);
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

  return data as Question[];
}

async function main() {
  console.log('🔍 VIC Selective Verbal & Reading Reasoning Audit\n');
  console.log('=' .repeat(80));

  loadProgress();

  const questions = await fetchQuestions();

  if (questions.length === 0) {
    console.log('No questions found!');
    return;
  }

  auditData.total_questions = questions.length;
  console.log(`\nTotal questions: ${questions.length}`);
  console.log(`Starting from index: ${auditData.last_audited_index + 1}\n`);

  // Display all questions for manual review
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];

    // Skip if already audited
    if (i <= auditData.last_audited_index) {
      continue;
    }

    let passage: Passage | null = null;

    if (question.passage_id) {
      passage = await getPassage(question.passage_id);
    }

    console.log('\n' + '='.repeat(80));
    console.log(`📋 QUESTION ${i + 1}/${questions.length}`);
    console.log(`   ${question.test_mode.toUpperCase()} - Q${question.question_order}`);
    console.log(`   Section: ${question.section_name}`);
    if (question.sub_skill) {
      console.log(`   Sub-skill: ${question.sub_skill}`);
    }
    console.log('='.repeat(80));

    if (passage) {
      console.log(`\n📖 PASSAGE:`);
      console.log(passage.passage_text);
      console.log('');
    }

    console.log(`\n❓ QUESTION:`);
    console.log(question.question_text);

    console.log(`\n📝 OPTIONS:`);
    question.answer_options.forEach((opt) => {
      const marker = opt.startsWith(question.correct_answer + ')') ? ' ✓' : '';
      console.log(`  ${opt}${marker}`);
    });

    console.log(`\n💡 STORED SOLUTION:`);
    console.log(question.solution);

    console.log(`\n🆔 Question ID: ${question.id}`);
    console.log('='.repeat(80));

    // Update progress
    auditData.last_audited_index = i;
    auditData.progress.push(`${question.test_mode} Q${question.question_order}`);

    // Save every 10 questions
    if ((i + 1) % 10 === 0) {
      saveProgress();
    }
  }

  console.log('\n\n' + '='.repeat(80));
  console.log('🎉 ALL QUESTIONS DISPLAYED');
  console.log('='.repeat(80));
  console.log(`Total: ${questions.length} questions`);
  console.log(`Flagged issues: ${auditData.flagged_issues.length}`);

  auditData.audit_completed = true;
  saveProgress();

  console.log('\n📄 Review the output above and use the add-issue.ts script to flag problems');
}

main().catch(console.error);
