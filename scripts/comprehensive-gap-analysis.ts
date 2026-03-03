import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { SECTION_CONFIGURATIONS } from '../src/data/curriculumData_v2/sectionConfigurations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface QuestionCount {
  test_type: string;
  section_name: string;
  test_mode: string;
  sub_skill: string;
  count: number;
}

interface PassageInfo {
  id: string;
  test_type: string;
  section_name: string;
  title: string;
  question_count: number;
}

interface GapAnalysis {
  testProduct: string;
  testSection: string;
  testMode: string;
  subskill: string;
  currentCount: number;
  targetCount: number;
  gap: number;
  status: 'missing' | 'adequate' | 'overgenerated';
}

async function loadCurriculumTargets() {
  console.log('  Loading targets from SECTION_CONFIGURATIONS...');

  const targets = new Map<string, number>();

  // Product-level configuration
  const PRODUCT_CONFIGS: Record<string, { diagnostic: number; practice_tests: number; drills_per_subskill: number }> = {
    "Year 5 NAPLAN": { diagnostic: 1, practice_tests: 5, drills_per_subskill: 30 },
    "Year 7 NAPLAN": { diagnostic: 1, practice_tests: 5, drills_per_subskill: 30 },
    "EduTest Scholarship (Year 7 Entry)": { diagnostic: 1, practice_tests: 5, drills_per_subskill: 30 },
    "NSW Selective Entry (Year 7 Entry)": { diagnostic: 1, practice_tests: 5, drills_per_subskill: 30 },
    "VIC Selective Entry (Year 9 Entry)": { diagnostic: 1, practice_tests: 5, drills_per_subskill: 30 },
    "ACER Scholarship (Year 7 Entry)": { diagnostic: 1, practice_tests: 5, drills_per_subskill: 30 }
  };

  // Process each section configuration
  for (const [key, config] of Object.entries(SECTION_CONFIGURATIONS)) {
    const testType = config.test_type;
    const sectionName = config.section_name;
    const totalQuestions = config.total_questions;

    const productConfig = PRODUCT_CONFIGS[testType];
    if (!productConfig) {
      console.warn(`  ⚠️  No product config for: ${testType}`);
      continue;
    }

    // Get subskills for this section
    let subskills: string[] = [];
    if (config.section_structure.generation_strategy === 'balanced' && config.section_structure.balanced_distribution) {
      subskills = config.section_structure.balanced_distribution.sub_skills;
    } else if (config.section_structure.generation_strategy === 'hybrid' && config.section_structure.hybrid_distribution) {
      subskills = config.section_structure.hybrid_distribution.standalone_sub_skills || [];
    } else if (config.section_structure.generation_strategy === 'passage_based' && config.section_structure.passage_based_distribution) {
      subskills = config.section_structure.passage_based_distribution.question_types || [];
    }

    // Calculate targets for each mode
    // Diagnostic: 1 test with totalQuestions
    targets.set(`${testType}|${sectionName}|diagnostic`, totalQuestions);

    // Practice tests: 5 tests, each with totalQuestions
    for (let i = 1; i <= productConfig.practice_tests; i++) {
      targets.set(`${testType}|${sectionName}|practice_${i}`, totalQuestions);
    }

    // Drills: drills_per_subskill * number of subskills
    const drillTarget = productConfig.drills_per_subskill * subskills.length;
    targets.set(`${testType}|${sectionName}|drill`, drillTarget);
  }

  console.log(`  ✅ Loaded ${targets.size} target configurations`);
  return targets;
}

async function getQuestionCounts(): Promise<QuestionCount[]> {
  // Fetch ALL questions in batches
  let allQuestions: any[] = [];
  let from = 0;
  const batchSize = 1000;

  console.log('  Fetching all questions...');
  while (true) {
    const { data, error } = await supabase
      .from('questions_v2')
      .select('test_type, section_name, test_mode, sub_skill')
      .range(from, from + batchSize - 1);

    if (error) {
      console.error('Error fetching questions:', error);
      return [];
    }

    if (!data || data.length === 0) break;
    allQuestions = allQuestions.concat(data);
    console.log(`    Fetched ${allQuestions.length} questions so far...`);

    if (data.length < batchSize) break;
    from += batchSize;
  }

  console.log(`  ✅ Total questions fetched: ${allQuestions.length}`);

  // Group by test_type, section_name, test_mode, sub_skill
  const counts = new Map<string, number>();

  allQuestions.forEach(q => {
    const key = `${q.test_type}|${q.section_name}|${q.test_mode}|${q.sub_skill || 'none'}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return Array.from(counts.entries()).map(([key, count]) => {
    const [test_type, section_name, test_mode, sub_skill] = key.split('|');
    return { test_type, section_name, test_mode, sub_skill, count };
  });
}

async function getSectionTotals() {
  // Fetch ALL questions in batches
  let allQuestions: any[] = [];
  let from = 0;
  const batchSize = 1000;

  console.log('  Fetching all questions for section totals...');
  while (true) {
    const { data, error } = await supabase
      .from('questions_v2')
      .select('test_type, section_name')
      .range(from, from + batchSize - 1);

    if (error) {
      console.error('Error fetching questions:', error);
      return new Map();
    }

    if (!data || data.length === 0) break;
    allQuestions = allQuestions.concat(data);

    if (data.length < batchSize) break;
    from += batchSize;
  }

  const totals = new Map<string, number>();
  allQuestions.forEach(q => {
    const key = `${q.test_type}|${q.section_name}`;
    totals.set(key, (totals.get(key) || 0) + 1);
  });

  return totals;
}

async function getPassageInfo(): Promise<PassageInfo[]> {
  // Get all passages in batches
  let allPassages: any[] = [];
  let from = 0;
  const batchSize = 1000;

  console.log('  Fetching all passages...');
  while (true) {
    const { data: passages, error: passageError } = await supabase
      .from('passages_v2')
      .select('id, test_type, section_name, title')
      .range(from, from + batchSize - 1);

    if (passageError) {
      console.error('Error fetching passages:', passageError);
      return [];
    }

    if (!passages || passages.length === 0) break;
    allPassages = allPassages.concat(passages);

    if (passages.length < batchSize) break;
    from += batchSize;
  }

  console.log(`  ✅ Total passages fetched: ${allPassages.length}`);

  // Get question counts for all passages in batches
  let allQuestionCounts: any[] = [];
  from = 0;

  console.log('  Fetching passage-question mappings...');
  while (true) {
    const { data: questionCounts, error: countError } = await supabase
      .from('questions_v2')
      .select('passage_id')
      .not('passage_id', 'is', null)
      .range(from, from + batchSize - 1);

    if (countError) {
      console.error('Error fetching question counts:', countError);
      return [];
    }

    if (!questionCounts || questionCounts.length === 0) break;
    allQuestionCounts = allQuestionCounts.concat(questionCounts);

    if (questionCounts.length < batchSize) break;
    from += batchSize;
  }

  // Build a map of passage_id -> question count
  const countMap = new Map<string, number>();
  allQuestionCounts.forEach(q => {
    if (q.passage_id) {
      countMap.set(q.passage_id, (countMap.get(q.passage_id) || 0) + 1);
    }
  });

  // Build passage info with counts
  const passageInfo: PassageInfo[] = allPassages.map(passage => ({
    ...passage,
    question_count: countMap.get(passage.id) || 0
  }));

  return passageInfo;
}

async function analyzeGaps() {
  console.log('Loading curriculum targets...');
  const targets = await loadCurriculumTargets();

  console.log('Fetching question counts...');
  const questionCounts = await getQuestionCounts();

  console.log('Fetching section totals...');
  const sectionTotals = await getSectionTotals();

  console.log('Analyzing passages...');
  const passages = await getPassageInfo();

  // Build gap analysis
  const gaps: GapAnalysis[] = [];
  const seenKeys = new Set<string>();

  // Build section-level totals first (sum across all subskills for each test/section/mode)
  const sectionModeTotals = new Map<string, number>();
  for (const qc of questionCounts) {
    const key = `${qc.test_type}|${qc.section_name}|${qc.test_mode}`;
    sectionModeTotals.set(key, (sectionModeTotals.get(key) || 0) + qc.count);
  }

  // Check existing questions against targets at SECTION level (not subskill level)
  for (const [key, currentTotal] of sectionModeTotals.entries()) {
    const [testType, sectionName, testMode] = key.split('|');
    const targetKey = `${testType}|${sectionName}|${testMode}`;
    const target = targets.get(targetKey) || 0;

    const gap = target - currentTotal;
    let status: 'missing' | 'adequate' | 'overgenerated' = 'adequate';
    if (gap > 0) status = 'missing';
    if (gap < 0) status = 'overgenerated';

    if (gap !== 0 || target > 0) { // Only show if there's a gap or a target exists
      gaps.push({
        testProduct: testType,
        testSection: sectionName,
        testMode: testMode,
        subskill: 'SECTION TOTAL',
        currentCount: currentTotal,
        targetCount: target,
        gap,
        status
      });
    }
  }

  // Check for missing sections/modes that have no questions
  for (const [key, target] of targets.entries()) {
    const [testType, sectionName, testMode] = key.split('|');

    // Check if we have any questions for this combination
    const sectionKey = `${testType}|${sectionName}|${testMode}`;
    if (!sectionModeTotals.has(sectionKey)) {
      gaps.push({
        testProduct: testType,
        testSection: sectionName,
        testMode: testMode,
        subskill: 'SECTION TOTAL',
        currentCount: 0,
        targetCount: target,
        gap: target,
        status: 'missing'
      });
    }
  }

  // Analyze section-level totals
  const sectionAnalysis = new Map<string, { current: number; target: number }>();
  for (const [key, current] of sectionTotals.entries()) {
    const [testType, sectionName] = key.split('|');

    // Sum up targets for this section across all modes
    let totalTarget = 0;
    for (const [targetKey, target] of targets.entries()) {
      if (targetKey.startsWith(`${testType}|${sectionName}|`)) {
        totalTarget += target;
      }
    }

    sectionAnalysis.set(key, { current, target: totalTarget });
  }

  // Orphaned passages
  const orphanedPassages = passages.filter(p => p.question_count === 0);

  // Passage count by section
  const passageCountBySection = new Map<string, number>();
  passages.forEach(p => {
    const key = `${p.test_type}|${p.section_name}`;
    passageCountBySection.set(key, (passageCountBySection.get(key) || 0) + 1);
  });

  return {
    gaps: gaps.sort((a, b) => b.gap - a.gap),
    sectionAnalysis,
    orphanedPassages,
    passageCountBySection,
    totalQuestions: questionCounts.reduce((sum, qc) => sum + qc.count, 0),
    totalPassages: passages.length
  };
}

async function generateReport() {
  const analysis = await analyzeGaps();

  let report = '# COMPREHENSIVE GAP ANALYSIS REPORT\n\n';
  report += `Generated: ${new Date().toISOString()}\n\n`;
  report += '---\n\n';

  // Summary
  report += '## SUMMARY\n\n';
  report += `- **Total Questions in Database**: ${analysis.totalQuestions}\n`;
  report += `- **Total Passages in Database**: ${analysis.totalPassages}\n`;
  report += `- **Orphaned Passages**: ${analysis.orphanedPassages.length}\n`;
  report += `- **Sections with Missing Questions**: ${analysis.gaps.filter(g => g.status === 'missing').length}\n`;
  report += `- **Sections with Overgeneration**: ${analysis.gaps.filter(g => g.status === 'overgenerated').length}\n\n`;

  // Missing Questions (Gaps)
  report += '---\n\n## MISSING QUESTIONS (PRIORITY GENERATION NEEDED)\n\n';
  const missingGaps = analysis.gaps.filter(g => g.status === 'missing' && g.gap > 0);

  if (missingGaps.length === 0) {
    report += '*No gaps detected - all targets met!*\n\n';
  } else {
    // Group by test product
    const byProduct = new Map<string, typeof missingGaps>();
    missingGaps.forEach(gap => {
      if (!byProduct.has(gap.testProduct)) {
        byProduct.set(gap.testProduct, []);
      }
      byProduct.get(gap.testProduct)!.push(gap);
    });

    for (const [product, gaps] of byProduct.entries()) {
      report += `### ${product}\n\n`;
      report += '| Section | Mode | Subskill | Current | Target | Gap |\n';
      report += '|---------|------|----------|---------|--------|-----|\n';

      for (const gap of gaps) {
        report += `| ${gap.testSection} | ${gap.testMode} | ${gap.subskill} | ${gap.currentCount} | ${gap.targetCount} | **${gap.gap}** |\n`;
      }
      report += '\n';
    }
  }

  // Overgenerated Sections
  report += '---\n\n## OVERGENERATED SECTIONS\n\n';
  const overgenerated = analysis.gaps.filter(g => g.status === 'overgenerated');

  if (overgenerated.length === 0) {
    report += '*No overgenerated sections detected.*\n\n';
  } else {
    const byProduct = new Map<string, typeof overgenerated>();
    overgenerated.forEach(gap => {
      if (!byProduct.has(gap.testProduct)) {
        byProduct.set(gap.testProduct, []);
      }
      byProduct.get(gap.testProduct)!.push(gap);
    });

    for (const [product, gaps] of byProduct.entries()) {
      report += `### ${product}\n\n`;
      report += '| Section | Mode | Subskill | Current | Target | Excess |\n';
      report += '|---------|------|----------|---------|--------|--------|\n';

      for (const gap of gaps.sort((a, b) => a.gap - b.gap)) {
        report += `| ${gap.testSection} | ${gap.testMode} | ${gap.subskill} | ${gap.currentCount} | ${gap.targetCount} | ${Math.abs(gap.gap)} |\n`;
      }
      report += '\n';
    }
  }

  // Section-level Analysis
  report += '---\n\n## SECTION-LEVEL TOTALS\n\n';
  report += '| Test Product | Section | Current Total | Target Total | Status |\n';
  report += '|--------------|---------|---------------|--------------|--------|\n';

  for (const [key, sectionData] of Array.from(analysis.sectionAnalysis.entries()).sort()) {
    const [product, section] = key.split('|');
    const status = sectionData.current >= sectionData.target ? '✅' : '⚠️';
    const statusText = sectionData.current >= sectionData.target ? 'Complete' : `Need ${sectionData.target - sectionData.current} more`;
    report += `| ${product} | ${section} | ${sectionData.current} | ${sectionData.target} | ${status} ${statusText} |\n`;
  }
  report += '\n';

  // Passage Analysis
  report += '---\n\n## PASSAGE ANALYSIS\n\n';
  report += '### Passages by Section\n\n';
  report += '| Test Product | Section | Passage Count |\n';
  report += '|--------------|---------|---------------|\n';

  for (const [key, count] of Array.from(analysis.passageCountBySection.entries()).sort()) {
    const [product, section] = key.split('|');
    report += `| ${product} | ${section} | ${count} |\n`;
  }
  report += '\n';

  // Orphaned Passages
  report += '### Orphaned Passages (Can be Deleted)\n\n';
  if (analysis.orphanedPassages.length === 0) {
    report += '*No orphaned passages found - all passages have associated questions!*\n\n';
  } else {
    report += `Found ${analysis.orphanedPassages.length} orphaned passages:\n\n`;
    report += '| ID | Test Product | Section | Title |\n';
    report += '|----|--------------|---------|-------|\n';

    for (const passage of analysis.orphanedPassages) {
      report += `| ${passage.id} | ${passage.test_type} | ${passage.section_name} | ${passage.title || 'Untitled'} |\n`;
    }
    report += '\n';

    // Generate SQL to delete orphaned passages
    report += '#### SQL to Delete Orphaned Passages\n\n';
    report += '```sql\n';
    report += 'DELETE FROM passages_v2 WHERE id IN (\n';
    report += analysis.orphanedPassages.map(p => `  '${p.id}'`).join(',\n');
    report += '\n);\n';
    report += '```\n\n';
  }

  // Recommendations
  report += '---\n\n## RECOMMENDATIONS\n\n';

  if (missingGaps.length > 0) {
    report += '### Priority Generation Tasks\n\n';
    const topGaps = missingGaps.sort((a, b) => b.gap - a.gap).slice(0, 10);
    report += 'Top 10 gaps to address:\n\n';
    topGaps.forEach((gap, i) => {
      report += `${i + 1}. **${gap.testProduct}** - ${gap.testSection} (${gap.testMode})\n`;
      report += `   - Subskill: ${gap.subskill}\n`;
      report += `   - Need ${gap.gap} more questions\n\n`;
    });
  }

  if (overgenerated.length > 0) {
    report += '### Overgeneration Notes\n\n';
    report += 'The following sections have more questions than configured targets. This may be intentional for variety, but review if needed:\n\n';
    const topOver = overgenerated.sort((a, b) => a.gap - b.gap).slice(0, 5);
    topOver.forEach((gap, i) => {
      report += `${i + 1}. ${gap.testProduct} - ${gap.testSection} (${gap.testMode}): ${Math.abs(gap.gap)} excess questions\n`;
    });
    report += '\n';
  }

  if (analysis.orphanedPassages.length > 0) {
    report += '### Database Cleanup\n\n';
    report += `- Delete ${analysis.orphanedPassages.length} orphaned passages to clean up database\n`;
    report += '- Use the SQL query provided in the Passage Analysis section\n\n';
  }

  // Save report
  const reportPath = path.join(__dirname, '..', 'GAP_ANALYSIS_REPORT.md');
  fs.writeFileSync(reportPath, report);

  console.log('\n✅ Gap analysis complete!');
  console.log(`📄 Report saved to: ${reportPath}`);
  console.log(`\n📊 Quick Summary:`);
  console.log(`   - Total Questions: ${analysis.totalQuestions}`);
  console.log(`   - Total Passages: ${analysis.totalPassages}`);
  console.log(`   - Gaps to Fill: ${missingGaps.length}`);
  console.log(`   - Orphaned Passages: ${analysis.orphanedPassages.length}`);
}

// Run the analysis
generateReport().catch(console.error);
