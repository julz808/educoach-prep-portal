import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import { SECTION_CONFIGURATIONS } from '../src/data/curriculumData_v2/sectionConfigurations.js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface ProductBreakdown {
  product: string;
  totalQuestions: number;
  totalPassages: number;
  sections: Map<string, SectionBreakdown>;
}

interface SectionBreakdown {
  sectionName: string;
  totalQuestions: number;
  targetQuestions: number;
  passageCount: number;
  modes: Map<string, ModeBreakdown>;
}

interface ModeBreakdown {
  mode: string;
  current: number;
  target: number;
  gap: number;
  subskills: Map<string, number>;
}

async function generateProductBreakdowns() {
  console.log('📊 GENERATING DETAILED PRODUCT BREAKDOWNS\n');

  // Fetch all questions
  console.log('Fetching questions...');
  let allQuestions: any[] = [];
  let from = 0;
  const batchSize = 1000;

  while (true) {
    const { data } = await supabase
      .from('questions_v2')
      .select('product_type, test_type, test_mode, sub_skill')
      .range(from, from + batchSize - 1);

    if (!data || data.length === 0) break;
    allQuestions = allQuestions.concat(data);
    if (data.length < batchSize) break;
    from += batchSize;
  }

  // Fetch all passages
  console.log('Fetching passages...');
  let allPassages: any[] = [];
  from = 0;

  while (true) {
    const { data } = await supabase
      .from('passages_v2')
      .select('test_type, section_name')
      .range(from, from + batchSize - 1);

    if (!data || data.length === 0) break;
    allPassages = allPassages.concat(data);
    if (data.length < batchSize) break;
    from += batchSize;
  }

  // Build product breakdowns
  const products = new Map<string, ProductBreakdown>();

  for (const q of allQuestions) {
    if (!products.has(q.product_type)) {
      products.set(q.product_type, {
        product: q.product_type,
        totalQuestions: 0,
        totalPassages: 0,
        sections: new Map()
      });
    }

    const product = products.get(q.product_type)!;
    product.totalQuestions++;

    if (!product.sections.has(q.test_type)) {
      product.sections.set(q.test_type, {
        sectionName: q.test_type,
        totalQuestions: 0,
        targetQuestions: 0,
        passageCount: 0,
        modes: new Map()
      });
    }

    const section = product.sections.get(q.test_type)!;
    section.totalQuestions++;

    if (!section.modes.has(q.test_mode)) {
      section.modes.set(q.test_mode, {
        mode: q.test_mode,
        current: 0,
        target: 0,
        gap: 0,
        subskills: new Map()
      });
    }

    const mode = section.modes.get(q.test_mode)!;
    mode.current++;

    const subskillKey = q.sub_skill || 'unknown';
    mode.subskills.set(subskillKey, (mode.subskills.get(subskillKey) || 0) + 1);
  }

  // Add passage counts
  for (const p of allPassages) {
    for (const product of products.values()) {
      if (product.sections.has(p.section_name)) {
        product.sections.get(p.section_name)!.passageCount++;
        product.totalPassages++;
      }
    }
  }

  // Load targets
  const PRODUCT_CONFIGS: Record<string, { diagnostic: number; practice_tests: number; drills_per_subskill: number }> = {
    "Year 5 NAPLAN": { diagnostic: 1, practice_tests: 5, drills_per_subskill: 30 },
    "Year 7 NAPLAN": { diagnostic: 1, practice_tests: 5, drills_per_subskill: 30 },
    "EduTest Scholarship (Year 7 Entry)": { diagnostic: 1, practice_tests: 5, drills_per_subskill: 30 },
    "NSW Selective Entry (Year 7 Entry)": { diagnostic: 1, practice_tests: 5, drills_per_subskill: 30 },
    "VIC Selective Entry (Year 9 Entry)": { diagnostic: 1, practice_tests: 5, drills_per_subskill: 30 },
    "ACER Scholarship (Year 7 Entry)": { diagnostic: 1, practice_tests: 5, drills_per_subskill: 30 }
  };

  for (const [key, config] of Object.entries(SECTION_CONFIGURATIONS)) {
    const testType = config.test_type;
    const sectionName = config.section_name;
    const totalQuestions = config.total_questions;

    const productConfig = PRODUCT_CONFIGS[testType];
    if (!productConfig) continue;

    const product = products.get(testType);
    if (!product) continue;

    const section = product.sections.get(sectionName);
    if (!section) continue;

    // Calculate section target (diagnostic + 5 practice tests + drills)
    let subskillCount = 0;
    if (config.section_structure.generation_strategy === 'balanced' && config.section_structure.balanced_distribution) {
      subskillCount = config.section_structure.balanced_distribution.sub_skills.length;
    }

    const drillTarget = productConfig.drills_per_subskill * subskillCount;
    section.targetQuestions = totalQuestions + (totalQuestions * productConfig.practice_tests) + drillTarget;

    // Set mode targets
    if (section.modes.has('diagnostic')) {
      section.modes.get('diagnostic')!.target = totalQuestions;
      section.modes.get('diagnostic')!.gap = totalQuestions - section.modes.get('diagnostic')!.current;
    }

    for (let i = 1; i <= productConfig.practice_tests; i++) {
      const practiceKey = `practice_${i}`;
      if (section.modes.has(practiceKey)) {
        section.modes.get(practiceKey)!.target = totalQuestions;
        section.modes.get(practiceKey)!.gap = totalQuestions - section.modes.get(practiceKey)!.current;
      }
    }

    if (section.modes.has('drill')) {
      section.modes.get('drill')!.target = drillTarget;
      section.modes.get('drill')!.gap = drillTarget - section.modes.get('drill')!.current;
    }
  }

  // Generate reports
  for (const [productName, product] of Array.from(products.entries()).sort()) {
    let report = `# ${productName} - DETAILED BREAKDOWN\n\n`;
    report += `Generated: ${new Date().toISOString()}\n\n`;
    report += `---\n\n`;

    // Summary
    report += `## SUMMARY\n\n`;
    report += `- **Total Questions**: ${product.totalQuestions}\n`;
    report += `- **Total Passages**: ${product.totalPassages}\n`;
    report += `- **Sections**: ${product.sections.size}\n\n`;

    // Calculate total target
    let totalTarget = 0;
    for (const section of product.sections.values()) {
      totalTarget += section.targetQuestions;
    }

    const completionPct = totalTarget > 0 ? ((product.totalQuestions / totalTarget) * 100).toFixed(1) : '0.0';
    report += `- **Expected Total Questions**: ${totalTarget}\n`;
    report += `- **Completion**: ${completionPct}%\n\n`;

    // Section by section
    for (const [sectionName, section] of Array.from(product.sections.entries()).sort()) {
      report += `---\n\n## ${sectionName}\n\n`;
      report += `- **Current Questions**: ${section.totalQuestions}\n`;
      report += `- **Target Questions**: ${section.targetQuestions}\n`;
      report += `- **Gap**: ${section.targetQuestions - section.totalQuestions}\n`;
      report += `- **Passages**: ${section.passageCount}\n\n`;

      const sectionCompletionPct = section.targetQuestions > 0 ? ((section.totalQuestions / section.targetQuestions) * 100).toFixed(1) : '0.0';
      report += `**Completion**: ${sectionCompletionPct}%\n\n`;

      // Modes
      report += `### By Test Mode\n\n`;
      report += `| Mode | Current | Target | Gap | Status |\n`;
      report += `|------|---------|--------|-----|--------|\n`;

      for (const [modeName, mode] of Array.from(section.modes.entries()).sort()) {
        const status = mode.gap === 0 ? '✅' : mode.gap < 0 ? '⚠️ Over' : '❌ Missing';
        report += `| ${modeName} | ${mode.current} | ${mode.target} | ${mode.gap} | ${status} |\n`;
      }
      report += `\n`;

      // Subskills for each mode
      for (const [modeName, mode] of Array.from(section.modes.entries()).sort()) {
        if (mode.subskills.size > 0) {
          report += `#### ${modeName} - Subskill Breakdown\n\n`;
          report += `| Subskill | Questions |\n`;
          report += `|----------|----------|\n`;

          for (const [subskill, count] of Array.from(mode.subskills.entries()).sort((a, b) => b[1] - a[1])) {
            report += `| ${subskill} | ${count} |\n`;
          }
          report += `\n`;
        }
      }
    }

    // Recommendations
    report += `---\n\n## RECOMMENDATIONS\n\n`;

    const missingSections: string[] = [];
    const completeSections: string[] = [];

    for (const [sectionName, section] of product.sections.entries()) {
      const gap = section.targetQuestions - section.totalQuestions;
      if (gap > 0) {
        missingSections.push(`- **${sectionName}**: Need ${gap} more questions`);
      } else if (gap === 0) {
        completeSections.push(`- **${sectionName}**: Complete ✅`);
      }
    }

    if (missingSections.length > 0) {
      report += `### Priority Generation\n\n`;
      report += missingSections.join('\n');
      report += `\n\n`;
    }

    if (completeSections.length > 0) {
      report += `### Complete Sections\n\n`;
      report += completeSections.join('\n');
      report += `\n\n`;
    }

    // Save report
    const filename = productName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const reportPath = `PRODUCT_BREAKDOWN_${filename}.md`;
    fs.writeFileSync(reportPath, report);

    console.log(`✅ Generated: ${reportPath}`);
  }

  console.log(`\n✅ All product breakdowns generated!`);
}

generateProductBreakdowns().catch(console.error);
