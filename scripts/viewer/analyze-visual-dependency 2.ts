import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface AnalysisResult {
  totalVisualQuestions: number;
  hasTextTable: number;
  hasNoTextTable: number;
  visualTypes: Record<string, number>;
  sampleQuestions: {
    withTextTable: any[];
    withoutTextTable: any[];
  };
}

async function analyzeVisualDependency() {
  console.log('\n🔍 Analyzing Visual Question Dependency\n');
  console.log('═══════════════════════════════════════════════════════\n');

  // Fetch all visual questions
  const { data: questions, error } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('has_visual', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching questions:', error);
    return;
  }

  const analysis: AnalysisResult = {
    totalVisualQuestions: questions?.length || 0,
    hasTextTable: 0,
    hasNoTextTable: 0,
    visualTypes: {},
    sampleQuestions: {
      withTextTable: [],
      withoutTextTable: []
    }
  };

  // Analyze each question
  questions?.forEach(q => {
    // Count visual types
    if (q.visual_type) {
      analysis.visualTypes[q.visual_type] = (analysis.visualTypes[q.visual_type] || 0) + 1;
    }

    // Check if question text contains table-like data
    const hasTableMarkers =
      q.question_text.includes('|') ||
      q.question_text.includes('┌') ||
      q.question_text.includes('─') ||
      q.question_text.includes('│') ||
      q.question_text.toLowerCase().includes('table:') ||
      /\n\s*\w+\s*\|\s*\w+/.test(q.question_text);

    if (hasTableMarkers) {
      analysis.hasTextTable++;
      if (analysis.sampleQuestions.withTextTable.length < 5) {
        analysis.sampleQuestions.withTextTable.push(q);
      }
    } else {
      analysis.hasNoTextTable++;
      if (analysis.sampleQuestions.withoutTextTable.length < 5) {
        analysis.sampleQuestions.withoutTextTable.push(q);
      }
    }
  });

  // Print summary
  console.log('📊 SUMMARY:\n');
  console.log(`Total visual questions: ${analysis.totalVisualQuestions}`);
  console.log(`Questions with text tables/data: ${analysis.hasTextTable} (${((analysis.hasTextTable / analysis.totalVisualQuestions) * 100).toFixed(1)}%)`);
  console.log(`Questions without text tables: ${analysis.hasNoTextTable} (${((analysis.hasNoTextTable / analysis.totalVisualQuestions) * 100).toFixed(1)}%)`);

  console.log('\n\n📈 Visual Types Breakdown:\n');
  Object.entries(analysis.visualTypes)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

  // Sample questions WITH text tables
  console.log('\n\n✅ SAMPLE QUESTIONS WITH TEXT TABLES (Can work without SVG):\n');
  console.log('═══════════════════════════════════════════════════════\n');
  analysis.sampleQuestions.withTextTable.slice(0, 3).forEach((q, i) => {
    console.log(`\n${i + 1}. [${q.test_type}] - ${q.section_name}`);
    console.log(`   Visual Type: ${q.visual_type || 'N/A'}`);
    console.log(`   Question (first 300 chars):`);
    console.log(`   ${q.question_text.substring(0, 300)}...`);
    console.log(`   ---`);
  });

  // Sample questions WITHOUT text tables
  console.log('\n\n⚠️  SAMPLE QUESTIONS WITHOUT TEXT TABLES (May need SVG):\n');
  console.log('═══════════════════════════════════════════════════════\n');
  analysis.sampleQuestions.withoutTextTable.slice(0, 3).forEach((q, i) => {
    console.log(`\n${i + 1}. [${q.test_type}] - ${q.section_name}`);
    console.log(`   Visual Type: ${q.visual_type || 'N/A'}`);
    console.log(`   Question Text:`);
    console.log(`   ${q.question_text.substring(0, 300)}...`);
    console.log(`   Visual Description: ${q.visual_data?.description?.substring(0, 200) || 'N/A'}...`);
    console.log(`   ---`);
  });

  // Export detailed report
  const report = {
    summary: {
      total: analysis.totalVisualQuestions,
      withTextTable: analysis.hasTextTable,
      withoutTextTable: analysis.hasNoTextTable,
      visualTypes: analysis.visualTypes
    },
    samplesWithTextTable: analysis.sampleQuestions.withTextTable.slice(0, 10).map(q => ({
      id: q.id,
      test_type: q.test_type,
      section_name: q.section_name,
      visual_type: q.visual_type,
      question_text: q.question_text,
      visual_description: q.visual_data?.description,
      answer_options: q.answer_options,
      correct_answer: q.correct_answer
    })),
    samplesWithoutTextTable: analysis.sampleQuestions.withoutTextTable.slice(0, 10).map(q => ({
      id: q.id,
      test_type: q.test_type,
      section_name: q.section_name,
      visual_type: q.visual_type,
      question_text: q.question_text,
      visual_description: q.visual_data?.description,
      answer_options: q.answer_options,
      correct_answer: q.correct_answer
    }))
  };

  const reportPath = '/Users/julz88/Documents/educoach-prep-portal-2/visual-dependency-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n\n📄 Detailed report saved to: visual-dependency-report.json`);

  // Recommendations
  console.log('\n\n💡 RECOMMENDATIONS:\n');
  console.log('═══════════════════════════════════════════════════════\n');

  if (analysis.hasNoTextTable > 0) {
    console.log(`⚠️  WARNING: ${analysis.hasNoTextTable} questions (${((analysis.hasNoTextTable / analysis.totalVisualQuestions) * 100).toFixed(1)}%) do NOT have text-based data.`);
    console.log('   These questions rely ENTIRELY on the SVG visual to be answerable.');
    console.log('   Disabling visuals for these would make them UNANSWERABLE.\n');
  }

  if (analysis.hasTextTable > 0) {
    console.log(`✅ SAFE: ${analysis.hasTextTable} questions (${((analysis.hasTextTable / analysis.totalVisualQuestions) * 100).toFixed(1)}%) have text-based data.`);
    console.log('   These could potentially work without SVG if the text tables are formatted properly.\n');
  }

  console.log('OPTIONS:\n');
  console.log('1. Keep visuals enabled but improve validation');
  console.log('2. Disable visuals only for questions without text alternatives');
  console.log('3. Add a manual review process for visual questions');
  console.log('4. Regenerate visual questions with stricter validation');
  console.log('5. Convert SVG visuals to text-based representations where possible\n');
}

analyzeVisualDependency().catch(console.error);
