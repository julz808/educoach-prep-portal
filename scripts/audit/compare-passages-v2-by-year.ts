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

  // Count complex words (rough syllable heuristic: 3+ vowel groups)
  const complexWords = words.filter(w => {
    const vowelGroups = w.toLowerCase().match(/[aeiouy]+/g);
    return vowelGroups && vowelGroups.length >= 3;
  }).length;

  const complexWordPct = wordCount > 0 ? (complexWords / wordCount) * 100 : 0;

  // Flesch-Kincaid Grade Level approximation
  const gradeLevel = (0.39 * avgWordsPerSentence) + (11.8 * (complexWordPct / 100)) - 15.59;

  return {
    wordCount,
    sentenceCount,
    avgWordsPerSentence: avgWordsPerSentence.toFixed(1),
    complexWords,
    complexWordPct: complexWordPct.toFixed(1),
    gradeLevel: gradeLevel.toFixed(1)
  };
}

async function comparePassages() {
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('PASSAGES_V2: READING PASSAGE COMPLEXITY BY YEAR LEVEL');
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');

  const comparisons = [
    { product: 'Year 5 NAPLAN', targetYear: 5 },
    { product: 'Year 7 NAPLAN', targetYear: 7 },
    { product: 'ACER Scholarship (Year 7 Entry)', targetYear: 7 },
    { product: 'NSW Selective Entry (Year 7 Entry)', targetYear: 7 },
    { product: 'EduTest Scholarship (Year 7 Entry)', targetYear: 7 },
    { product: 'VIC Selective Entry (Year 9 Entry)', targetYear: 9 }
  ];

  const results: any[] = [];

  for (const { product, targetYear } of comparisons) {
    const { data: passages } = await supabase
      .from('passages_v2')
      .select('*')
      .eq('product_type', product)
      .limit(5);

    if (!passages || passages.length === 0) {
      console.log(`❌ No passages found for ${product}\n`);
      continue;
    }

    console.log('▓'.repeat(80));
    console.log(`${product.toUpperCase()} (Target: Year ${targetYear})`);
    console.log('▓'.repeat(80));
    console.log(`Found ${passages.length} sample passages\n`);

    // Analyze each passage
    const analyses = passages.map(p => {
      const content = p.content || p.text || '';
      return analyzeText(content);
    });

    // Calculate averages
    const avgMetrics = {
      wordCount: (analyses.reduce((sum, a) => sum + a.wordCount, 0) / analyses.length).toFixed(0),
      avgWordsPerSentence: (analyses.reduce((sum, a) => sum + parseFloat(a.avgWordsPerSentence), 0) / analyses.length).toFixed(1),
      complexWordPct: (analyses.reduce((sum, a) => sum + parseFloat(a.complexWordPct), 0) / analyses.length).toFixed(1),
      gradeLevel: (analyses.reduce((sum, a) => sum + parseFloat(a.gradeLevel), 0) / analyses.length).toFixed(1)
    };

    console.log('AVERAGE PASSAGE METRICS:');
    console.log('─'.repeat(80));
    console.log(`Average Word Count: ${avgMetrics.wordCount} words`);
    console.log(`Average Words per Sentence: ${avgMetrics.avgWordsPerSentence}`);
    console.log(`Average Complex Word %: ${avgMetrics.complexWordPct}%`);
    console.log(`Estimated Reading Grade Level: ${avgMetrics.gradeLevel}`);

    // Show first passage sample
    const firstPassage = passages[0];
    const passageContent = firstPassage.content || firstPassage.text || '';

    console.log('\n\nSAMPLE PASSAGE:');
    console.log('─'.repeat(80));
    if (firstPassage.title) {
      console.log(`Title: ${firstPassage.title}\n`);
    }
    console.log(passageContent.substring(0, 500) + (passageContent.length > 500 ? '...' : ''));
    console.log('\n');

    results.push({
      product,
      targetYear,
      ...avgMetrics,
      passageCount: passages.length
    });
  }

  // Summary comparison table
  console.log('\n' + '═'.repeat(80));
  console.log('SUMMARY COMPARISON TABLE');
  console.log('═'.repeat(80) + '\n');

  console.log('Product'.padEnd(38) + ' | Year | Words | Sent Len | Complex% | Grade | Diff?');
  console.log('─'.repeat(95));

  results.forEach(r => {
    const expectedGrade = r.targetYear;
    const actualGrade = parseFloat(r.gradeLevel);
    const diff = (actualGrade - expectedGrade).toFixed(1);
    const diffSymbol = parseFloat(diff) > 1 ? '⬆️ harder' : parseFloat(diff) < -1 ? '⬇️ easier' : '✅ match';

    console.log(
      r.product.padEnd(38) + ' | ' +
      r.targetYear.toString().padStart(4) + ' | ' +
      r.wordCount.toString().padStart(5) + ' | ' +
      r.avgWordsPerSentence.toString().padStart(8) + ' | ' +
      (r.complexWordPct + '%').padStart(8) + ' | ' +
      r.gradeLevel.toString().padStart(5) + ' | ' +
      diffSymbol
    );
  });

  console.log('\n' + '═'.repeat(80));
  console.log('CALIBRATION ANALYSIS');
  console.log('═'.repeat(80));
  console.log(`
KEY FINDINGS:

1. GRADE LEVEL MATCH:
   - Passages should be at or slightly above target year level
   - Grade level = Flesch-Kincaid readability score
   - Example: Year 7 passages should score ~7-8 grade level

2. PROGRESSION CHECK:
   - Year 5 passages should be EASIER than Year 7
   - Year 7 passages should be EASIER than Year 9
   - Look for increasing: sentence length, complex words, grade level

3. INTERPRETATION:
   ✅ Grade level within ±1 of target = Good calibration
   ⬆️ Grade level 2+ above target = Passages too hard
   ⬇️ Grade level 2+ below target = Passages too easy

EXPECTED BENCHMARKS:
   Year 5: ~150-200 words, ~12-15 words/sentence, ~12-15% complex, Grade 5-6
   Year 7: ~200-300 words, ~15-18 words/sentence, ~15-20% complex, Grade 7-8
   Year 9: ~250-350 words, ~18-22 words/sentence, ~20-25% complex, Grade 9-10
  `);
}

comparePassages()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
