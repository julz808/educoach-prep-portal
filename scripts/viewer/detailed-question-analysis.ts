import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function detailedAnalysis() {
  console.log('\n🔍 DETAILED QUESTION ANALYSIS - Testing Hypothesis\n');
  console.log('═══════════════════════════════════════════════════════\n');

  const { data: questions } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('has_visual', true)
    .order('created_at', { ascending: false });

  if (!questions) {
    console.error('No questions found');
    return;
  }

  let canAnswerWithoutSVG = 0;
  let needsSVG = 0;
  let unclear = 0;

  const categories = {
    sufficientDescription: [] as any[],
    needsVisual: [] as any[],
    unclear: [] as any[]
  };

  questions.forEach(q => {
    const text = q.question_text.toLowerCase();
    const visualDesc = q.visual_data?.description || '';

    // Check if question has sufficient textual information
    const hasNumericalData = /\d+/.test(q.question_text);
    const hasDataStructure =
      q.question_text.includes('|') || // Has table
      q.question_text.includes('grid') ||
      q.question_text.includes('pattern') ||
      /dimensions?\s*\d+/.test(text) || // Has dimensions
      /radius.*\d+|diameter.*\d+|length.*\d+|width.*\d+|height.*\d+/.test(text) || // Has measurements
      /position.*\d+|at\s+\d+|from\s+\d+\s+to\s+\d+/.test(text) || // Has positions
      text.includes('distance') && hasNumericalData;

    // Questions that describe the visual clearly in text
    const hasTextualDescription =
      text.includes('shows') ||
      text.includes('displays') ||
      text.includes('illustrated') ||
      text.includes('diagram') ||
      text.includes('graph') ||
      text.includes('table') ||
      text.includes('chart');

    // Geometric questions with all measurements
    const isGeometryWithMeasurements =
      (text.includes('triangle') || text.includes('rectangle') || text.includes('circle') ||
       text.includes('prism') || text.includes('cylinder') || text.includes('sphere')) &&
      /\d+\s*(cm|mm|m|km)/.test(text);

    // Pattern/grid questions
    const isPatternQuestion =
      text.includes('pattern') ||
      text.includes('sequence') ||
      text.includes('grid');

    if (q.question_text.includes('|') && q.question_text.includes('\n')) {
      // Has a text table
      canAnswerWithoutSVG++;
      categories.sufficientDescription.push({ ...q, reason: 'Has text table with data' });
    } else if (isGeometryWithMeasurements && /(\d+\s*cm.*){2,}/.test(text)) {
      // Geometry with multiple measurements provided
      canAnswerWithoutSVG++;
      categories.sufficientDescription.push({ ...q, reason: 'Geometry with all measurements in text' });
    } else if (isPatternQuestion && hasNumericalData && q.question_text.length > 100) {
      // Pattern question with data described
      unclear++;
      categories.unclear.push({ ...q, reason: 'Pattern question - need to check if description is sufficient' });
    } else if (q.visual_type === 'number_line' && /from\s+\d+\s+to\s+\d+/.test(text) && /position.*\d+/.test(text)) {
      // Number line with positions clearly stated
      canAnswerWithoutSVG++;
      categories.sufficientDescription.push({ ...q, reason: 'Number line with positions in text' });
    } else {
      // Likely needs the visual
      needsSVG++;
      categories.needsVisual.push({ ...q, reason: 'Visual likely required' });
    }
  });

  console.log('📊 REVISED ANALYSIS RESULTS:\n');
  console.log(`✅ Can answer WITHOUT SVG: ${canAnswerWithoutSVG} (${((canAnswerWithoutSVG / questions.length) * 100).toFixed(1)}%)`);
  console.log(`❌ Likely NEEDS SVG: ${needsSVG} (${((needsSVG / questions.length) * 100).toFixed(1)}%)`);
  console.log(`⚠️  Unclear (needs manual check): ${unclear} (${((unclear / questions.length) * 100).toFixed(1)}%)`);

  // Show examples from each category
  console.log('\n\n✅ EXAMPLES THAT CAN WORK WITHOUT SVG:\n');
  console.log('═══════════════════════════════════════════════════════\n');
  categories.sufficientDescription.slice(0, 5).forEach((q, i) => {
    console.log(`${i + 1}. [${q.test_type}] ${q.section_name}`);
    console.log(`   Reason: ${q.reason}`);
    console.log(`   Visual Type: ${q.visual_type}`);
    console.log(`   Question: ${q.question_text.substring(0, 250)}...`);
    console.log('');
  });

  console.log('\n\n❌ EXAMPLES THAT LIKELY NEED SVG:\n');
  console.log('═══════════════════════════════════════════════════════\n');
  categories.needsVisual.slice(0, 5).forEach((q, i) => {
    console.log(`${i + 1}. [${q.test_type}] ${q.section_name}`);
    console.log(`   Visual Type: ${q.visual_type}`);
    console.log(`   Question: ${q.question_text.substring(0, 250)}...`);
    console.log(`   Visual Description: ${q.visual_data?.description?.substring(0, 150) || 'N/A'}...`);
    console.log('');
  });

  // Now let's manually check some "needsVisual" questions to see if description is actually sufficient
  console.log('\n\n🔍 DEEP DIVE: Checking if "needs visual" questions have sufficient descriptions:\n');
  console.log('═══════════════════════════════════════════════════════\n');

  let actuallyNeedsSVG = 0;
  let descriptionSufficient = 0;

  categories.needsVisual.slice(0, 20).forEach((q, i) => {
    const desc = q.visual_data?.description || '';
    const hasDetailedDescription = desc.length > 50;
    const hasNumericalDataInDesc = /\d+/.test(desc);

    console.log(`${i + 1}. Visual Type: ${q.visual_type}`);
    console.log(`   Question Length: ${q.question_text.length} chars`);
    console.log(`   Description Length: ${desc.length} chars`);
    console.log(`   Full Question Text: ${q.question_text}`);
    console.log(`   Visual Description: ${desc}`);

    if (hasDetailedDescription && (hasNumericalDataInDesc || desc.includes('showing') || desc.includes('marked'))) {
      console.log(`   ✅ VERDICT: Description likely sufficient to answer`);
      descriptionSufficient++;
    } else {
      console.log(`   ❌ VERDICT: SVG likely required`);
      actuallyNeedsSVG++;
    }
    console.log('');
  });

  console.log('\n\n📈 DEEP DIVE RESULTS (from 20 sample "needs visual" questions):\n');
  console.log(`Description sufficient: ${descriptionSufficient}`);
  console.log(`Actually needs SVG: ${actuallyNeedsSVG}`);

  // Save detailed report
  const report = {
    summary: {
      total: questions.length,
      canAnswerWithoutSVG,
      needsSVG,
      unclear
    },
    examples: {
      sufficientDescription: categories.sufficientDescription.slice(0, 20).map(q => ({
        id: q.id,
        test_type: q.test_type,
        section_name: q.section_name,
        visual_type: q.visual_type,
        reason: q.reason,
        question_text: q.question_text,
        visual_description: q.visual_data?.description
      })),
      needsVisual: categories.needsVisual.slice(0, 20).map(q => ({
        id: q.id,
        test_type: q.test_type,
        section_name: q.section_name,
        visual_type: q.visual_type,
        reason: q.reason,
        question_text: q.question_text,
        visual_description: q.visual_data?.description
      }))
    }
  };

  fs.writeFileSync('detailed-question-analysis.json', JSON.stringify(report, null, 2));
  console.log('\n📄 Full report saved to: detailed-question-analysis.json\n');
}

detailedAnalysis().catch(console.error);
