import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function analyzeText(text: string) {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceCount = sentences.length;

  const avgWordsPerSentence = sentenceCount > 0 ? (wordCount / sentenceCount) : 0;

  // Count complex words (3+ vowel groups = rough syllable count)
  const complexWords = words.filter(w => {
    const vowelGroups = w.toLowerCase().match(/[aeiouy]+/g);
    return vowelGroups && vowelGroups.length >= 3;
  }).length;

  const complexWordPct = wordCount > 0 ? (complexWords / wordCount) * 100 : 0;

  // Flesch-Kincaid Grade Level
  const gradeLevel = (0.39 * avgWordsPerSentence) + (11.8 * (complexWordPct / 100)) - 15.59;

  return {
    wordCount,
    sentenceCount,
    avgWordsPerSentence,
    complexWords,
    complexWordPct,
    gradeLevel
  };
}

async function analyzePassageCalibration() {
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('PASSAGE DIFFICULTY CALIBRATION BY YEAR LEVEL');
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');

  // Get all passages
  const { data: allPassages } = await supabase
    .from('passages_v2')
    .select('*');

  if (!allPassages || allPassages.length === 0) {
    console.log('No passages found');
    return;
  }

  console.log(`Total passages found: ${allPassages.length}\n`);

  // Group by test_type (which includes year level info)
  const byProduct: Record<string, any[]> = {};
  allPassages.forEach(p => {
    const key = p.test_type || 'Unknown';
    if (!byProduct[key]) byProduct[key] = [];
    byProduct[key].push(p);
  });

  const results: any[] = [];

  for (const [product, passages] of Object.entries(byProduct)) {
    console.log('▓'.repeat(80));
    console.log(product.toUpperCase());
    console.log('▓'.repeat(80));
    console.log(`Found ${passages.length} passages\n`);

    // Analyze up to 10 sample passages
    const samples = passages.slice(0, Math.min(10, passages.length));
    const analyses = samples.map(p => analyzeText(p.content || ''));

    // Calculate averages
    const avgWordCount = analyses.reduce((sum, a) => sum + a.wordCount, 0) / analyses.length;
    const avgWordsPerSent = analyses.reduce((sum, a) => sum + a.avgWordsPerSentence, 0) / analyses.length;
    const avgComplexPct = analyses.reduce((sum, a) => sum + a.complexWordPct, 0) / analyses.length;
    const avgGradeLevel = analyses.reduce((sum, a) => sum + a.gradeLevel, 0) / analyses.length;

    console.log('AVERAGE METRICS (from sample passages):');
    console.log('─'.repeat(80));
    console.log(`Word Count: ${avgWordCount.toFixed(0)} words`);
    console.log(`Words per Sentence: ${avgWordsPerSent.toFixed(1)}`);
    console.log(`Complex Word %: ${avgComplexPct.toFixed(1)}%`);
    console.log(`Reading Grade Level: ${avgGradeLevel.toFixed(1)}`);

    // Extract target year from product name
    let targetYear = 0;
    if (product.includes('Year 5')) targetYear = 5;
    else if (product.includes('Year 7')) targetYear = 7;
    else if (product.includes('Year 9')) targetYear = 9;

    // Also check year_level column
    if (targetYear === 0 && passages[0].year_level) {
      targetYear = passages[0].year_level;
    }

    console.log(`\nTarget Year Level: ${targetYear}`);
    if (targetYear > 0) {
      const diff = avgGradeLevel - targetYear;
      if (Math.abs(diff) <= 1) {
        console.log(`✅ Calibration: GOOD (within ±1 grade level)`);
      } else if (diff > 1) {
        console.log(`⬆️ Calibration: HARDER than target (${diff.toFixed(1)} grades above)`);
      } else {
        console.log(`⬇️ Calibration: EASIER than target (${Math.abs(diff).toFixed(1)} grades below)`);
      }
    }

    // Show sample passage
    const sample = passages[0];
    console.log('\n\nSAMPLE PASSAGE:');
    console.log('─'.repeat(80));
    if (sample.title) {
      console.log(`Title: ${sample.title}\n`);
    }
    console.log((sample.content || '').substring(0, 400) + '...\n\n');

    results.push({
      product,
      targetYear,
      passageCount: passages.length,
      avgWordCount: avgWordCount.toFixed(0),
      avgWordsPerSent: avgWordsPerSent.toFixed(1),
      avgComplexPct: avgComplexPct.toFixed(1),
      avgGradeLevel: avgGradeLevel.toFixed(1)
    });
  }

  // Summary table
  console.log('\n' + '═'.repeat(90));
  console.log('SUMMARY: PASSAGE CALIBRATION COMPARISON');
  console.log('═'.repeat(90) + '\n');

  console.log('Product'.padEnd(40) + ' | Year | Count | Words | Sent | Cplx% | Grade | Status');
  console.log('─'.repeat(100));

  results
    .sort((a, b) => a.targetYear - b.targetYear)
    .forEach(r => {
      const diff = parseFloat(r.avgGradeLevel) - r.targetYear;
      let status = '';
      if (r.targetYear === 0) {
        status = '❓ unknown';
      } else if (Math.abs(diff) <= 1) {
        status = '✅ good';
      } else if (diff > 1) {
        status = `⬆️ +${diff.toFixed(1)}`;
      } else {
        status = `⬇️ ${diff.toFixed(1)}`;
      }

      console.log(
        r.product.padEnd(40) + ' | ' +
        (r.targetYear || '-').toString().padStart(4) + ' | ' +
        r.passageCount.toString().padStart(5) + ' | ' +
        r.avgWordCount.toString().padStart(5) + ' | ' +
        r.avgWordsPerSent.toString().padStart(4) + ' | ' +
        (r.avgComplexPct + '%').padStart(5) + ' | ' +
        r.avgGradeLevel.toString().padStart(5) + ' | ' +
        status
      );
    });

  console.log('\n' + '═'.repeat(90));
  console.log('KEY INSIGHTS');
  console.log('═'.repeat(90));
  console.log(`
1. YEAR-TO-YEAR PROGRESSION:
   Check if passages get progressively harder from Year 5 → Year 7 → Year 9

2. CALIBRATION STATUS:
   ✅ good = Reading level within ±1 grade of target year
   ⬆️ harder = Reading level 1+ grades above target (may be challenging)
   ⬇️ easier = Reading level 1+ grades below target (may be too simple)

3. ANSWER TO YOUR QUESTION:
   Look at the "Grade" column for each year level.
   - Year 5 passages should score ~5-6
   - Year 7 passages should score ~7-8
   - Year 9 passages should score ~9-10

   If Year 9 scores HIGHER than Year 7, passages ARE calibrated for difficulty.
   If scores are similar, passages are NOT calibrated by year level.
  `);
}

analyzePassageCalibration()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
