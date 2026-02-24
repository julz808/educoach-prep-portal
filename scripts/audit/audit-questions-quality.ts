import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface Question {
  id: string;
  test_type: string;
  test_mode: string;
  section_name: string;
  sub_skill: string;
  response_type: string;
  difficulty: string;
  question_text: string;
  answer_options?: string[];
  correct_answer?: string;
  solution?: string;
  passage_id?: string;
  created_at: string;
}

interface Passage {
  id: string;
  content: string;
  title?: string;
}

interface AuditResult {
  test_type: string;
  test_mode: string;
  section_name: string;
  sub_skill: string;
  response_type: string;
  total_questions: number;
  sampled_questions: QuestionAudit[];
  issues: string[];
}

interface QuestionAudit {
  question_id: string;
  question_text: string;
  passage_text?: string;
  options?: string[];
  correct_answer?: string;
  solution?: string;
  verdict: 'PASS' | 'FAIL' | 'WARNING' | 'REVIEW';
  issues: string[];
  notes: string[];
}

// Get all unique test_type-test_mode-section-subskill combinations
async function getProductSubskillCombinations() {
  const { data, error } = await supabase
    .from('questions_v2')
    .select('test_type, test_mode, section_name, sub_skill, response_type')
    .order('test_type', { ascending: true });

  if (error) {
    console.error('Error fetching combinations:', error);
    return [];
  }

  // Get unique combinations
  const combinations = new Map<string, { test_type: string; test_mode: string; section_name: string; sub_skill: string; response_type: string }>();
  data?.forEach(item => {
    const key = `${item.test_type}|${item.test_mode}|${item.section_name}|${item.sub_skill}|${item.response_type}`;
    if (!combinations.has(key)) {
      combinations.set(key, item);
    }
  });

  return Array.from(combinations.values());
}

// Get random sample of questions for a test combination
async function sampleQuestions(
  testType: string,
  testMode: string,
  sectionName: string,
  subSkill: string,
  responseType: string,
  sampleSize: number = 5
) {
  // First, get total count
  const { count, error: countError } = await supabase
    .from('questions_v2')
    .select('*', { count: 'exact', head: true })
    .eq('test_type', testType)
    .eq('test_mode', testMode)
    .eq('section_name', sectionName)
    .eq('sub_skill', subSkill)
    .eq('response_type', responseType);

  if (countError) {
    console.error('Error counting questions:', countError);
    return { questions: [], total: 0 };
  }

  // Get all questions (we'll sample randomly)
  const { data, error } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('test_type', testType)
    .eq('test_mode', testMode)
    .eq('section_name', sectionName)
    .eq('sub_skill', subSkill)
    .eq('response_type', responseType);

  if (error || !data) {
    console.error('Error fetching questions:', error);
    return { questions: [], total: count || 0 };
  }

  // Random sample
  const shuffled = [...data].sort(() => 0.5 - Math.random());
  const sampled = shuffled.slice(0, Math.min(sampleSize, shuffled.length));

  return { questions: sampled as Question[], total: count || 0 };
}

// Get passage by ID
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

  return data as Passage;
}

// Audit a single question
async function auditQuestion(question: Question): Promise<QuestionAudit> {
  const audit: QuestionAudit = {
    question_id: question.id,
    question_text: question.question_text,
    options: question.answer_options,
    correct_answer: question.correct_answer,
    solution: question.solution,
    verdict: 'PASS',
    issues: [],
    notes: []
  };

  // If question has passage, fetch it
  if (question.passage_id) {
    const passage = await getPassage(question.passage_id);
    if (passage) {
      audit.passage_text = passage.content;
      audit.notes.push(`Passage: "${passage.title || 'Untitled'}" (${passage.content.length} chars)`);
    } else {
      audit.issues.push(`Passage ID ${question.passage_id} not found`);
      audit.verdict = 'FAIL';
    }
  }

  // Check for writing/extended response questions
  if (question.response_type === 'writing' || question.response_type === 'extended_response') {
    // For writing/extended response questions, just verify the task is appropriate
    if (!question.question_text || question.question_text.length < 20) {
      audit.issues.push('Writing task is too short or missing');
      audit.verdict = 'FAIL';
    } else {
      audit.notes.push('Writing/extended response task appears appropriate (manual review recommended)');
    }

    // Some extended_response questions might actually be MCQs with options in the text
    // Check if there's a correct_answer but no answer_options (data quality issue)
    if (question.correct_answer && (!question.answer_options || question.answer_options.length === 0)) {
      audit.issues.push('Question has correct_answer but no answer_options array - possible mislabeling as extended_response');
      audit.verdict = 'FAIL';
    }

    return audit;
  }

  // For MCQ questions, check structure
  if (question.response_type === 'multiple_choice') {
    // Check options exist
    if (!question.answer_options || question.answer_options.length === 0) {
      audit.issues.push('No options provided for MCQ question');
      audit.verdict = 'FAIL';
    } else {
      // Check for reasonable number of options (typically 4)
      if (question.answer_options.length < 3 || question.answer_options.length > 5) {
        audit.issues.push(`Unusual number of options: ${question.answer_options.length}`);
        audit.verdict = 'WARNING';
      }

      // Check for empty options
      const emptyOptions = question.answer_options.filter(opt => !opt || opt.trim() === '');
      if (emptyOptions.length > 0) {
        audit.issues.push(`${emptyOptions.length} empty option(s)`);
        audit.verdict = 'FAIL';
      }

      // Check for duplicate options
      const uniqueOptions = new Set(question.answer_options);
      if (uniqueOptions.size !== question.answer_options.length) {
        audit.issues.push('Duplicate options detected');
        audit.verdict = 'FAIL';
      }
    }

    // Check correct answer exists
    if (!question.correct_answer) {
      audit.issues.push('No correct answer specified');
      audit.verdict = 'FAIL';
    } else {
      // Verify correct answer is in options
      // The correct_answer might be just the letter (e.g., "B") or the full text
      // Options are formatted as "A) text", "B) text", etc.
      const answerFound = question.answer_options && (
        question.answer_options.includes(question.correct_answer) || // Exact match
        question.answer_options.some(opt =>
          opt.startsWith(question.correct_answer + ')') || // Matches "B)" at start of "B) text"
          opt.startsWith(question.correct_answer + ' ') || // Matches "B " at start
          opt === question.correct_answer // Exact match again for safety
        )
      );

      if (!answerFound) {
        audit.issues.push('Correct answer not found in options');
        audit.verdict = 'FAIL';
        audit.notes.push(`Correct answer: "${question.correct_answer}"`);
        audit.notes.push(`Options: ${question.answer_options?.map(o => `"${o}"`).join(', ')}`);
      }
    }

    // Check solution explanation
    if (!question.solution || question.solution.length < 20) {
      audit.issues.push('Solution explanation is too short or missing');
      audit.verdict = 'WARNING';
    }
  }

  // Check for potential hallucinations (very basic heuristics)
  const hallucationPatterns = [
    /\[citation needed\]/i,
    /\[source\]/i,
    /according to (?:the|a) (?:study|research|article) that/i,
    /I (?:think|believe|assume)/i,
    /(?:probably|maybe|might be|could be) correct/i
  ];

  const fullText = `${question.question_text} ${question.solution || ''}`;
  hallucationPatterns.forEach(pattern => {
    if (pattern.test(fullText)) {
      audit.issues.push(`Potential hallucination indicator: ${pattern.source}`);
      audit.verdict = 'REVIEW';
    }
  });

  return audit;
}

// Check for duplicate questions
async function checkDuplicates() {
  const { data, error } = await supabase
    .from('questions_v2')
    .select('id, test_type, test_mode, sub_skill, question_text');

  if (error || !data) {
    console.error('Error fetching questions for duplicate check:', error);
    return [];
  }

  const duplicates: Array<{ question_text: string; ids: string[]; test_types: string[] }> = [];
  const questionMap = new Map<string, { ids: string[]; test_types: string[] }>();

  data.forEach(q => {
    const normalized = q.question_text.trim().toLowerCase();
    if (!questionMap.has(normalized)) {
      questionMap.set(normalized, { ids: [q.id], test_types: [`${q.test_type}/${q.test_mode}`] });
    } else {
      const entry = questionMap.get(normalized)!;
      entry.ids.push(q.id);
      entry.test_types.push(`${q.test_type}/${q.test_mode}`);
    }
  });

  // Find duplicates
  questionMap.forEach((value, key) => {
    if (value.ids.length > 1) {
      duplicates.push({
        question_text: key.substring(0, 100) + '...',
        ids: value.ids,
        test_types: value.test_types
      });
    }
  });

  return duplicates;
}

// Main audit function
async function runAudit() {
  console.log('🔍 Starting Question Quality Audit...\n');

  const combinations = await getProductSubskillCombinations();
  console.log(`Found ${combinations.length} unique product-subskill-type combinations\n`);

  const results: AuditResult[] = [];
  let totalQuestionsChecked = 0;
  let totalIssues = 0;
  let failedQuestions = 0;
  let warningQuestions = 0;

  // Audit each combination
  for (const combo of combinations) {
    console.log(`Auditing: ${combo.test_type}/${combo.test_mode} / ${combo.section_name} / ${combo.sub_skill} / ${combo.response_type}`);

    const { questions, total } = await sampleQuestions(
      combo.test_type,
      combo.test_mode,
      combo.section_name,
      combo.sub_skill,
      combo.response_type,
      5
    );

    const sampledAudits: QuestionAudit[] = [];
    const comboIssues: string[] = [];

    for (const question of questions) {
      const audit = await auditQuestion(question);
      sampledAudits.push(audit);
      totalQuestionsChecked++;

      if (audit.verdict === 'FAIL') {
        failedQuestions++;
        totalIssues += audit.issues.length;
      } else if (audit.verdict === 'WARNING') {
        warningQuestions++;
        totalIssues += audit.issues.length;
      }

      if (audit.issues.length > 0) {
        comboIssues.push(...audit.issues);
      }
    }

    results.push({
      test_type: combo.test_type,
      test_mode: combo.test_mode,
      section_name: combo.section_name,
      sub_skill: combo.sub_skill,
      response_type: combo.response_type,
      total_questions: total,
      sampled_questions: sampledAudits,
      issues: comboIssues
    });

    console.log(`  ✓ Checked ${questions.length}/${total} questions\n`);
  }

  // Check for duplicates
  console.log('🔍 Checking for duplicate questions...\n');
  const duplicates = await checkDuplicates();

  // Generate report
  const reportPath = path.join(process.cwd(), 'docs', `question-quality-audit-${new Date().toISOString().split('T')[0]}.md`);

  let report = '# Question Quality Audit Report\n\n';
  report += `**Generated:** ${new Date().toISOString()}\n\n`;
  report += '## Executive Summary\n\n';
  report += `- **Total Combinations Audited:** ${combinations.length}\n`;
  report += `- **Total Questions Checked:** ${totalQuestionsChecked}\n`;
  report += `- **Failed Questions:** ${failedQuestions}\n`;
  report += `- **Warning Questions:** ${warningQuestions}\n`;
  report += `- **Total Issues Found:** ${totalIssues}\n`;
  report += `- **Duplicate Questions Found:** ${duplicates.length}\n\n`;

  // Summary by verdict
  const passRate = ((totalQuestionsChecked - failedQuestions - warningQuestions) / totalQuestionsChecked * 100).toFixed(1);
  report += `**Pass Rate:** ${passRate}%\n\n`;

  // Duplicates section
  if (duplicates.length > 0) {
    report += '## ⚠️ Duplicate Questions\n\n';
    duplicates.slice(0, 20).forEach((dup, idx) => {
      report += `### Duplicate ${idx + 1}\n`;
      report += `**Question:** ${dup.question_text}\n`;
      report += `**Found in:** ${dup.test_types.join(', ')}\n`;
      report += `**IDs:** ${dup.ids.join(', ')}\n\n`;
    });
    if (duplicates.length > 20) {
      report += `_... and ${duplicates.length - 20} more duplicates_\n\n`;
    }
  }

  // Detailed results
  report += '## Detailed Audit Results\n\n';

  results.forEach(result => {
    report += `### ${result.test_type}/${result.test_mode} - ${result.section_name} - ${result.sub_skill} - ${result.response_type}\n\n`;
    report += `**Total Questions in DB:** ${result.total_questions}\n`;
    report += `**Sampled Questions:** ${result.sampled_questions.length}\n\n`;

    result.sampled_questions.forEach((audit, idx) => {
      const statusEmoji = audit.verdict === 'PASS' ? '✅' : audit.verdict === 'FAIL' ? '❌' : audit.verdict === 'WARNING' ? '⚠️' : '🔍';
      report += `#### Question ${idx + 1} ${statusEmoji} (${audit.verdict})\n\n`;
      report += `**ID:** \`${audit.question_id}\`\n\n`;

      if (audit.passage_text) {
        report += `**Passage:**\n> ${audit.passage_text.substring(0, 200)}${audit.passage_text.length > 200 ? '...' : ''}\n\n`;
      }

      report += `**Question:**\n> ${audit.question_text}\n\n`;

      if (audit.options && audit.options.length > 0) {
        report += '**Options:**\n';
        audit.options.forEach((opt, i) => {
          const marker = opt === audit.correct_answer ? '✓' : ' ';
          report += `${i + 1}. [${marker}] ${opt}\n`;
        });
        report += '\n';
      }

      if (audit.solution) {
        report += `**Solution:**\n> ${audit.solution}\n\n`;
      }

      if (audit.issues.length > 0) {
        report += '**Issues:**\n';
        audit.issues.forEach(issue => {
          report += `- ❌ ${issue}\n`;
        });
        report += '\n';
      }

      if (audit.notes.length > 0) {
        report += '**Notes:**\n';
        audit.notes.forEach(note => {
          report += `- ℹ️ ${note}\n`;
        });
        report += '\n';
      }

      report += '---\n\n';
    });
  });

  // Write report
  fs.writeFileSync(reportPath, report);
  console.log(`\n✅ Audit complete! Report saved to: ${reportPath}`);
  console.log(`\n📊 Summary:`);
  console.log(`   - Questions Checked: ${totalQuestionsChecked}`);
  console.log(`   - Failed: ${failedQuestions}`);
  console.log(`   - Warnings: ${warningQuestions}`);
  console.log(`   - Pass Rate: ${passRate}%`);
  console.log(`   - Duplicates Found: ${duplicates.length}`);
}

// Run the audit
runAudit().catch(console.error);
