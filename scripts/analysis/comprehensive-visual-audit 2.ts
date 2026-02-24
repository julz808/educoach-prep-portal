import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Question {
  id: string;
  question_text: string;
  test_type: string;
  section_name: string;
  sub_skill: string;
  test_mode: string;
  visual_type: string | null;
  visual_svg: string | null;
  visual_data: any;
  answer_options: string[];
  correct_answer: string;
  solution: string;
  difficulty: number;
}

interface AuditResult {
  canAnswerWithoutVisual: Question[];
  needsVisualSupport: Question[];
  tableQuestionsWithTextData: Question[];
  tableQuestionsNeedingSVG: Question[];
  gridQuestionsWithData: Question[];
  gridQuestionsNeedingSVG: Question[];
  geometryQuestionsComplete: Question[];
  geometryQuestionsMissingData: Question[];
  chartGraphQuestions: Question[];
  otherVisualTypes: Question[];
}

// Helper function to check if text contains a markdown table
function hasMarkdownTable(text: string): boolean {
  const lines = text.split('\n');
  let pipeCount = 0;

  for (const line of lines) {
    if (line.includes('|')) {
      pipeCount++;
    }
  }

  return pipeCount >= 2; // At least 2 lines with pipes suggests a table
}

// Helper function to extract table data from text
function extractTableData(text: string): { rows: number; cols: number; hasData: boolean } {
  if (!hasMarkdownTable(text)) {
    return { rows: 0, cols: 0, hasData: false };
  }

  const lines = text.split('\n').filter(line => line.includes('|'));
  const rows = lines.length;

  if (lines.length === 0) return { rows: 0, cols: 0, hasData: false };

  const cols = lines[0].split('|').filter(cell => cell.trim().length > 0).length;

  // Check if table has numerical data
  const hasData = lines.some(line => /\d+/.test(line));

  return { rows, cols, hasData };
}

// Helper function to check if geometry question has all needed measurements
function hasCompleteMeasurements(text: string, visualType: string): boolean {
  const lowerText = text.toLowerCase();

  // Count measurement instances
  const measurementPattern = /\d+\s*(cm|mm|m|km|metres?|centimetres?|millimetres?|kilometers?)/gi;
  const measurements = text.match(measurementPattern) || [];

  // Expected measurements by shape type
  const expectedMeasurements: Record<string, number> = {
    'triangle': 3, // 3 sides or base + height
    'rectangle': 2, // length + width
    'square': 1,
    'circle': 1, // radius or diameter
    'cylinder': 2, // radius + height
    'sphere': 1, // radius
    '3d_rectangular_prism': 3, // length + width + height
    'rectangular_prism': 3,
    'prism': 3,
    'trapezoid': 4, // 2 parallel sides + height
    'trapezium': 4,
    'composite_shape': 4, // varies, use 4 as minimum
  };

  // Determine expected count
  let expected = 2; // default

  for (const [shape, count] of Object.entries(expectedMeasurements)) {
    if (lowerText.includes(shape) || visualType.toLowerCase().includes(shape)) {
      expected = count;
      break;
    }
  }

  return measurements.length >= expected;
}

// Helper function to analyze grid/pattern questions
function analyzeGridQuestion(q: Question): { hasCompleteData: boolean; reason: string } {
  const text = q.question_text;
  const desc = q.visual_data?.description || '';

  // Check if grid data is in question text
  const hasGridInText = hasMarkdownTable(text);

  // Check if description contains complete grid data
  const descHasRows = desc.toLowerCase().includes('row');
  const descHasPattern = /row \d+.*:\s*\d+/i.test(desc);
  const descHasCompleteGrid = descHasPattern && (desc.match(/row/gi) || []).length >= 3;

  if (hasGridInText) {
    return { hasCompleteData: true, reason: 'Grid data in question text as table' };
  }

  if (descHasCompleteGrid) {
    return { hasCompleteData: true, reason: 'Complete grid data in visual description' };
  }

  if (descHasRows) {
    return { hasCompleteData: true, reason: 'Grid data in description (partial)' };
  }

  return { hasCompleteData: false, reason: 'No grid data found in text or description' };
}

// Helper function to analyze chart/graph questions
function analyzeChartQuestion(q: Question): { needsVisual: boolean; reason: string } {
  const text = q.question_text.toLowerCase();
  const desc = q.visual_data?.description || '';

  // Charts typically need visual representation
  const chartTypes = ['bar_chart', 'bar_graph', 'line_graph', 'pie_chart', 'histogram'];
  const isChartType = chartTypes.some(type => q.visual_type?.toLowerCase().includes(type));

  if (!isChartType) {
    return { needsVisual: false, reason: 'Not a chart/graph type' };
  }

  // Check if data is provided in text format
  const hasDataTable = hasMarkdownTable(q.question_text);
  const hasDataInDesc = /data.*:.*\d+/i.test(desc);

  if (hasDataTable) {
    return { needsVisual: false, reason: 'Chart data provided as table in text' };
  }

  if (hasDataInDesc && desc.length > 100) {
    return { needsVisual: false, reason: 'Chart data described in detail' };
  }

  // Check if question asks about visual interpretation (needs visual)
  const asksAboutVisual =
    text.includes('according to the graph') ||
    text.includes('as shown in') ||
    text.includes('from the chart') ||
    text.includes('the graph shows');

  if (asksAboutVisual) {
    return { needsVisual: true, reason: 'Question explicitly references visual element' };
  }

  return { needsVisual: true, reason: 'Chart/graph typically requires visual representation' };
}

// Helper function to analyze number line questions
function analyzeNumberLineQuestion(q: Question): { hasCompleteData: boolean; reason: string } {
  const text = q.question_text;

  // Check for explicit positions
  const hasPositions =
    /position.*\d+/i.test(text) ||
    /at.*\d+/i.test(text) ||
    /from.*\d+.*to.*\d+/i.test(text) ||
    /between.*\d+.*and.*\d+/i.test(text);

  // Check for range
  const hasRange = /from\s+\d+\s+to\s+\d+/.test(text);

  if (hasPositions && hasRange) {
    return { hasCompleteData: true, reason: 'Number line range and positions clearly stated' };
  }

  if (hasPositions) {
    return { hasCompleteData: true, reason: 'Positions stated (may need to infer range)' };
  }

  return { hasCompleteData: false, reason: 'Missing position or range information' };
}

async function comprehensiveAudit() {
  console.log('\n🔍 COMPREHENSIVE VISUAL DEPENDENCY AUDIT\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('This analysis will identify ALL questions that cannot be answered');
  console.log('without visual support based on current question text.\n');
  console.log('Starting analysis...\n');

  // Fetch all visual questions
  const { data: questions, error } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('has_visual', true)
    .order('test_type', { ascending: true });

  if (error || !questions) {
    console.error('Error fetching questions:', error);
    return;
  }

  console.log(`Total visual questions to analyze: ${questions.length}\n`);

  const results: AuditResult = {
    canAnswerWithoutVisual: [],
    needsVisualSupport: [],
    tableQuestionsWithTextData: [],
    tableQuestionsNeedingSVG: [],
    gridQuestionsWithData: [],
    gridQuestionsNeedingSVG: [],
    geometryQuestionsComplete: [],
    geometryQuestionsMissingData: [],
    chartGraphQuestions: [],
    otherVisualTypes: []
  };

  const detailedAnalysis: Array<{
    question: Question;
    category: string;
    canAnswer: boolean;
    reason: string;
    actionNeeded: string;
  }> = [];

  // Analyze each question
  for (const q of questions) {
    const visualType = q.visual_type?.toLowerCase() || '';
    let canAnswer = false;
    let reason = '';
    let category = '';
    let actionNeeded = '';

    // TABLE QUESTIONS
    if (visualType.includes('table') || visualType.includes('text_table')) {
      category = 'Table';
      const tableData = extractTableData(q.question_text);

      if (tableData.hasData && tableData.rows >= 2) {
        canAnswer = true;
        reason = `Table with ${tableData.rows} rows and ${tableData.cols} columns in text`;
        actionNeeded = 'Convert text table to HTML table rendering';
        results.canAnswerWithoutVisual.push(q);
        results.tableQuestionsWithTextData.push(q);
      } else {
        canAnswer = false;
        reason = 'Table structure mentioned but data not in text';
        actionNeeded = 'ADD: Complete table data to question text OR keep SVG';
        results.needsVisualSupport.push(q);
        results.tableQuestionsNeedingSVG.push(q);
      }
    }

    // GRID/PATTERN QUESTIONS
    else if (visualType.includes('grid') || visualType.includes('3x3')) {
      category = 'Grid/Pattern';
      const gridAnalysis = analyzeGridQuestion(q);

      if (gridAnalysis.hasCompleteData) {
        canAnswer = true;
        reason = gridAnalysis.reason;
        actionNeeded = gridAnalysis.reason.includes('table')
          ? 'Convert text table to HTML or keep as formatted text'
          : 'Add grid data from visual description to question text';
        results.canAnswerWithoutVisual.push(q);
        results.gridQuestionsWithData.push(q);
      } else {
        canAnswer = false;
        reason = gridAnalysis.reason;
        actionNeeded = 'ADD: Complete grid data to question text (e.g., Row 1: 2, 4, 6...)';
        results.needsVisualSupport.push(q);
        results.gridQuestionsNeedingSVG.push(q);
      }
    }

    // GEOMETRY QUESTIONS
    else if (
      visualType.includes('triangle') ||
      visualType.includes('rectangle') ||
      visualType.includes('circle') ||
      visualType.includes('geometric') ||
      visualType.includes('3d') ||
      visualType.includes('prism') ||
      visualType.includes('cylinder') ||
      visualType.includes('sphere') ||
      visualType.includes('trapez') ||
      visualType.includes('shape')
    ) {
      category = 'Geometry';
      const hasComplete = hasCompleteMeasurements(q.question_text, visualType);

      if (hasComplete) {
        canAnswer = true;
        reason = 'All measurements provided in question text';
        actionNeeded = 'No action needed - question is self-contained';
        results.canAnswerWithoutVisual.push(q);
        results.geometryQuestionsComplete.push(q);
      } else {
        canAnswer = false;
        reason = 'Missing some measurements in text';
        actionNeeded = 'ADD: All shape measurements to question text';
        results.needsVisualSupport.push(q);
        results.geometryQuestionsMissingData.push(q);
      }
    }

    // NUMBER LINE QUESTIONS
    else if (visualType.includes('number_line')) {
      category = 'Number Line';
      const nlAnalysis = analyzeNumberLineQuestion(q);

      if (nlAnalysis.hasCompleteData) {
        canAnswer = true;
        reason = nlAnalysis.reason;
        actionNeeded = 'No action needed - positions clearly stated';
        results.canAnswerWithoutVisual.push(q);
      } else {
        canAnswer = false;
        reason = nlAnalysis.reason;
        actionNeeded = 'ADD: Clear position information to question text';
        results.needsVisualSupport.push(q);
      }
    }

    // CHART/GRAPH QUESTIONS
    else if (
      visualType.includes('chart') ||
      visualType.includes('graph') ||
      visualType.includes('histogram')
    ) {
      category = 'Chart/Graph';
      const chartAnalysis = analyzeChartQuestion(q);

      if (!chartAnalysis.needsVisual) {
        canAnswer = true;
        reason = chartAnalysis.reason;
        actionNeeded = 'Convert data to HTML table if not already formatted';
        results.canAnswerWithoutVisual.push(q);
        results.chartGraphQuestions.push(q);
      } else {
        canAnswer = false;
        reason = chartAnalysis.reason;
        actionNeeded = 'CONSIDER: Add data table to text OR keep visual for interpretation';
        results.needsVisualSupport.push(q);
        results.chartGraphQuestions.push(q);
      }
    }

    // DIAGRAM/OTHER
    else {
      category = 'Diagram/Other';
      const desc = q.visual_data?.description || '';

      // Check if description is detailed enough
      const hasDetailedDesc = desc.length > 80;
      const hasNumericalData = /\d+/.test(desc);
      const descHasStructure =
        desc.toLowerCase().includes('showing') ||
        desc.toLowerCase().includes('labeled') ||
        desc.toLowerCase().includes('marked');

      if (hasDetailedDesc && hasNumericalData && descHasStructure) {
        canAnswer = true;
        reason = 'Detailed visual description with data provided';
        actionNeeded = 'REVIEW: Consider moving description content to question text';
        results.canAnswerWithoutVisual.push(q);
        results.otherVisualTypes.push(q);
      } else {
        canAnswer = false;
        reason = 'Visual description too vague or missing data';
        actionNeeded = 'ADD: Complete visual information to question text OR keep SVG';
        results.needsVisualSupport.push(q);
        results.otherVisualTypes.push(q);
      }
    }

    detailedAnalysis.push({
      question: q,
      category,
      canAnswer,
      reason,
      actionNeeded
    });
  }

  // Print Summary
  console.log('\n📊 AUDIT SUMMARY\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log(`Total questions analyzed: ${questions.length}\n`);
  console.log(`✅ Can answer WITHOUT visual: ${results.canAnswerWithoutVisual.length} (${((results.canAnswerWithoutVisual.length / questions.length) * 100).toFixed(1)}%)`);
  console.log(`❌ NEEDS visual support: ${results.needsVisualSupport.length} (${((results.needsVisualSupport.length / questions.length) * 100).toFixed(1)}%)\n`);

  console.log('\n📋 BREAKDOWN BY CATEGORY:\n');
  console.log(`TABLE Questions:`);
  console.log(`  ✅ With text data: ${results.tableQuestionsWithTextData.length}`);
  console.log(`  ❌ Needs SVG: ${results.tableQuestionsNeedingSVG.length}\n`);

  console.log(`GRID/PATTERN Questions:`);
  console.log(`  ✅ With data: ${results.gridQuestionsWithData.length}`);
  console.log(`  ❌ Needs SVG: ${results.gridQuestionsNeedingSVG.length}\n`);

  console.log(`GEOMETRY Questions:`);
  console.log(`  ✅ Complete measurements: ${results.geometryQuestionsComplete.length}`);
  console.log(`  ❌ Missing data: ${results.geometryQuestionsMissingData.length}\n`);

  console.log(`CHART/GRAPH Questions: ${results.chartGraphQuestions.length} total\n`);
  console.log(`OTHER Visual Types: ${results.otherVisualTypes.length} total\n`);

  // Generate detailed reports
  console.log('\n📝 Generating detailed reports...\n');

  // Report 1: Questions that need flagging/editing
  const flagReport = {
    summary: {
      totalNeedingAttention: results.needsVisualSupport.length,
      byCategory: {
        tables: results.tableQuestionsNeedingSVG.length,
        grids: results.gridQuestionsNeedingSVG.length,
        geometry: results.geometryQuestionsMissingData.length,
        other: results.needsVisualSupport.length -
               results.tableQuestionsNeedingSVG.length -
               results.gridQuestionsNeedingSVG.length -
               results.geometryQuestionsMissingData.length
      }
    },
    questionsNeedingFlag: detailedAnalysis
      .filter(a => !a.canAnswer)
      .map(a => ({
        id: a.question.id,
        test_type: a.question.test_type,
        section_name: a.question.section_name,
        sub_skill: a.question.sub_skill,
        test_mode: a.question.test_mode,
        visual_type: a.question.visual_type,
        category: a.category,
        reason: a.reason,
        actionNeeded: a.actionNeeded,
        question_text: a.question.question_text,
        visual_description: a.question.visual_data?.description,
        answer_options: a.question.answer_options,
        correct_answer: a.question.correct_answer,
        solution: a.question.solution
      }))
  };

  fs.writeFileSync(
    'REPORT-questions-needing-visual-support.json',
    JSON.stringify(flagReport, null, 2)
  );

  // Report 2: Table questions conversion plan
  const tableConversionReport = {
    summary: {
      totalTableQuestions: results.tableQuestionsWithTextData.length,
      conversionStrategy: 'Convert markdown tables in question_text to HTML tables'
    },
    questions: results.tableQuestionsWithTextData.map(q => {
      const tableData = extractTableData(q.question_text);
      return {
        id: q.id,
        test_type: q.test_type,
        section_name: q.section_name,
        test_mode: q.test_mode,
        tableInfo: tableData,
        question_text: q.question_text,
        currentSVG: q.visual_svg ? 'Has SVG (will be replaced)' : 'No SVG',
        actionPlan: 'Parse markdown table from question_text and render as HTML'
      };
    })
  };

  fs.writeFileSync(
    'REPORT-table-conversion-plan.json',
    JSON.stringify(tableConversionReport, null, 2)
  );

  // Report 3: Complete audit results
  const completeReport = {
    summary: {
      totalQuestions: questions.length,
      canAnswerWithoutVisual: results.canAnswerWithoutVisual.length,
      needsVisualSupport: results.needsVisualSupport.length,
      percentageCanAnswer: ((results.canAnswerWithoutVisual.length / questions.length) * 100).toFixed(1)
    },
    categoryBreakdown: {
      tables: {
        withTextData: results.tableQuestionsWithTextData.length,
        needsSVG: results.tableQuestionsNeedingSVG.length
      },
      grids: {
        withData: results.gridQuestionsWithData.length,
        needsSVG: results.gridQuestionsNeedingSVG.length
      },
      geometry: {
        complete: results.geometryQuestionsComplete.length,
        missingData: results.geometryQuestionsMissingData.length
      },
      chartsGraphs: results.chartGraphQuestions.length,
      other: results.otherVisualTypes.length
    },
    detailedAnalysis: detailedAnalysis.map(a => ({
      id: a.question.id,
      test_type: a.question.test_type,
      section_name: a.question.section_name,
      visual_type: a.question.visual_type,
      category: a.category,
      canAnswer: a.canAnswer,
      reason: a.reason,
      actionNeeded: a.actionNeeded
    }))
  };

  fs.writeFileSync(
    'REPORT-complete-visual-audit.json',
    JSON.stringify(completeReport, null, 2)
  );

  console.log('✅ Reports generated:\n');
  console.log('   1. REPORT-questions-needing-visual-support.json');
  console.log('      → Questions that MUST be flagged/edited (cannot answer without visual)\n');
  console.log('   2. REPORT-table-conversion-plan.json');
  console.log('      → Table questions ready for SVG→HTML conversion\n');
  console.log('   3. REPORT-complete-visual-audit.json');
  console.log('      → Complete audit of all visual questions\n');

  // Print sample questions needing attention
  console.log('\n⚠️  SAMPLE QUESTIONS NEEDING ATTENTION:\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  detailedAnalysis
    .filter(a => !a.canAnswer)
    .slice(0, 10)
    .forEach((a, i) => {
      console.log(`${i + 1}. [${a.question.test_type}] ${a.question.section_name}`);
      console.log(`   Category: ${a.category}`);
      console.log(`   Visual Type: ${a.question.visual_type}`);
      console.log(`   Issue: ${a.reason}`);
      console.log(`   Action: ${a.actionNeeded}`);
      console.log(`   Question: ${a.question.question_text.substring(0, 150)}...`);
      console.log('');
    });

  console.log('\n✅ Audit complete!\n');
}

comprehensiveAudit().catch(console.error);
