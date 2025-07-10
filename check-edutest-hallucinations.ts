import { supabase } from './src/integrations/supabase/client.ts';
import { writeFileSync } from 'fs';

// Hallucination indicators in solution explanations
const HALLUCINATION_PATTERNS = [
  'recalculate',
  'wait let me',
  'let me recalculate',
  'actually, let me',
  'wait, I need to',
  'let me check',
  'I need to recalculate',
  'hold on',
  'let me think again',
  'wait, that\'s not right',
  'let me correct',
  'I made an error',
  'wait, I miscalculated',
  'let me redo',
  'actually, I need to',
  'wait, let me double-check',
  'I need to check',
  'let me verify',
  'wait, I think I made a mistake'
];

interface HallucinatedQuestion {
  id: string;
  test_mode: string;
  section_name: string;
  sub_skill?: string;
  difficulty?: number;
  question_text: string;
  solution: string;
  hallucination_indicator: string;
  created_at: string;
}

async function checkEduTestHallucinations() {
  const testType = 'EduTest Scholarship (Year 7 Entry)';
  console.log(`🔍 Checking for Hallucinations in ${testType} Questions\n`);
  
  const hallucinatedQuestions: HallucinatedQuestion[] = [];
  
  // Get all EduTest questions
  const { data: questions, error } = await supabase
    .from('questions')
    .select('id, test_mode, section_name, sub_skill, difficulty, question_text, solution, created_at')
    .eq('test_type', testType)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching questions:', error);
    return;
  }
  
  if (!questions || questions.length === 0) {
    console.log('No questions found for EduTest');
    return;
  }
  
  console.log(`📊 Scanning ${questions.length} EduTest questions for hallucinations...`);
  console.log('='.repeat(70));
  
  // Check each question's solution for hallucination patterns
  questions.forEach(question => {
    const solution = (question.solution || '').toLowerCase();
    
    for (const pattern of HALLUCINATION_PATTERNS) {
      if (solution.includes(pattern.toLowerCase())) {
        hallucinatedQuestions.push({
          id: question.id,
          test_mode: question.test_mode,
          section_name: question.section_name,
          sub_skill: question.sub_skill,
          difficulty: question.difficulty,
          question_text: question.question_text,
          solution: question.solution,
          hallucination_indicator: pattern,
          created_at: question.created_at
        });
        break; // Only record one pattern per question
      }
    }
  });
  
  console.log(`\n📊 HALLUCINATION ANALYSIS RESULTS`);
  console.log('='.repeat(70));
  console.log(`Questions scanned: ${questions.length}`);
  console.log(`Hallucinated questions found: ${hallucinatedQuestions.length}`);
  console.log(`Hallucination rate: ${((hallucinatedQuestions.length / questions.length) * 100).toFixed(2)}%`);
  
  if (hallucinatedQuestions.length === 0) {
    console.log('✅ No hallucinations detected in EduTest questions!');
    return;
  }
  
  // Group by test mode
  const hallucinationsByMode: Record<string, number> = {};
  hallucinatedQuestions.forEach(q => {
    hallucinationsByMode[q.test_mode] = (hallucinationsByMode[q.test_mode] || 0) + 1;
  });
  
  console.log('\n📊 Hallucinations by test mode:');
  Object.entries(hallucinationsByMode).forEach(([mode, count]) => {
    const modeTotal = questions.filter(q => q.test_mode === mode).length;
    const percentage = ((count / modeTotal) * 100).toFixed(1);
    console.log(`  ${mode}: ${count}/${modeTotal} (${percentage}%)`);
  });
  
  // Group by section
  const hallucinationsBySection: Record<string, number> = {};
  hallucinatedQuestions.forEach(q => {
    hallucinationsBySection[q.section_name] = (hallucinationsBySection[q.section_name] || 0) + 1;
  });
  
  console.log('\n📊 Hallucinations by section:');
  Object.entries(hallucinationsBySection).forEach(([section, count]) => {
    const sectionTotal = questions.filter(q => q.section_name === section).length;
    const percentage = ((count / sectionTotal) * 100).toFixed(1);
    console.log(`  ${section}: ${count}/${sectionTotal} (${percentage}%)`);
  });
  
  // Show most common hallucination patterns
  const patternCounts: Record<string, number> = {};
  hallucinatedQuestions.forEach(q => {
    patternCounts[q.hallucination_indicator] = (patternCounts[q.hallucination_indicator] || 0) + 1;
  });
  
  console.log('\n📊 Most common hallucination patterns:');
  Object.entries(patternCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .forEach(([pattern, count]) => {
      console.log(`  "${pattern}": ${count} occurrences`);
    });
  
  console.log('\n📋 SAMPLE HALLUCINATED QUESTIONS:');
  console.log('='.repeat(70));
  
  // Show first 5 examples
  hallucinatedQuestions.slice(0, 5).forEach((q, index) => {
    console.log(`\n${index + 1}. Question ID: ${q.id}`);
    console.log(`   Test Mode: ${q.test_mode} | Section: ${q.section_name} | Sub-skill: ${q.sub_skill || 'N/A'}`);
    console.log(`   Difficulty: ${q.difficulty || 'N/A'} | Pattern: "${q.hallucination_indicator}"`);
    console.log(`   Created: ${new Date(q.created_at).toLocaleDateString()}`);
    console.log(`   Solution excerpt: ${q.solution.substring(0, 200)}...`);
  });
  
  if (hallucinatedQuestions.length > 5) {
    console.log(`\n... and ${hallucinatedQuestions.length - 5} more hallucinated questions`);
  }
  
  // Generate removal SQL for hallucinated questions
  const hallucinationIds = hallucinatedQuestions.map(q => q.id);
  
  let sqlScript = `-- EduTest Hallucinated Questions Removal Script\n`;
  sqlScript += `-- Generated on ${new Date().toISOString()}\n`;
  sqlScript += `-- Total hallucinated questions: ${hallucinatedQuestions.length}\n\n`;
  
  sqlScript += `-- HALLUCINATION BREAKDOWN:\n`;
  Object.entries(hallucinationsByMode).forEach(([mode, count]) => {
    sqlScript += `-- ${mode}: ${count} questions\n`;
  });
  sqlScript += `\n`;
  
  if (hallucinationIds.length > 0) {
    sqlScript += `-- Remove all hallucinated questions\n`;
    sqlScript += `DELETE FROM questions WHERE id IN (\n`;
    sqlScript += hallucinationIds.map(id => `  '${id}'`).join(',\n');
    sqlScript += `\n);\n\n`;
  }
  
  sqlScript += `-- VERIFICATION QUERY:\n`;
  sqlScript += `-- Check remaining question counts after hallucination removal\n`;
  sqlScript += `SELECT test_mode, section_name, COUNT(*) as question_count\n`;
  sqlScript += `FROM questions \n`;
  sqlScript += `WHERE test_type = 'EduTest Scholarship (Year 7 Entry)'\n`;
  sqlScript += `GROUP BY test_mode, section_name\n`;
  sqlScript += `ORDER BY test_mode, section_name;\n`;
  
  // Write hallucination removal script
  writeFileSync('delete-edutest-hallucinations.sql', sqlScript);
  
  console.log('\n✅ Hallucination removal script generated: delete-edutest-hallucinations.sql');
  
  return hallucinatedQuestions;
}

checkEduTestHallucinations().catch(console.error);