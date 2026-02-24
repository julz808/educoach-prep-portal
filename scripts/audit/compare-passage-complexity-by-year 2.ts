import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function extractPassage(questionText: string): string | null {
  // Look for "Passage:" or similar markers
  const passageMatch = questionText.match(/Passage:\s*([\s\S]+?)(?=\n\n|Question:|$)/i);
  if (passageMatch) {
    return passageMatch[1].trim();
  }

  // Look for "Read the passage" pattern
  const readMatch = questionText.match(/Read the (?:passage|text)[\s\S]+?\n\n([\s\S]+?)(?=\n\n[A-Z]|$)/i);
  if (readMatch) {
    return readMatch[1].trim();
  }

  return null;
}

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

async function comparePassageComplexity() {
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('READING PASSAGE COMPLEXITY COMPARISON ACROSS YEAR LEVELS');
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');

  const comparisons = [
    {
      product: 'Year 5 NAPLAN',
      targetYear: 'Year 5',
      section: 'Reading'
    },
    {
      product: 'ACER Scholarship (Year 7 Entry)',
      targetYear: 'Year 7',
      section: 'Humanities'
    },
    {
      product: 'NSW Selective Entry (Year 7 Entry)',
      targetYear: 'Year 7',
      section: 'Reading'
    },
    {
      product: 'EduTest Scholarship (Year 7 Entry)',
      targetYear: 'Year 7',
      section: 'Reading'
    },
    {
      product: 'VIC Selective Entry (Year 9 Entry)',
      targetYear: 'Year 9',
      section: 'Reading'
    }
  ];

  const results: any[] = [];

  for (const { product, targetYear, section } of comparisons) {
    // Get questions with passages
    const { data: questions } = await supabase
      .from('questions_v2')
      .select('question_text, passage_id')
      .eq('product_type', product)
      .eq('section_name', section)
      .not('passage_id', 'is', null)
      .limit(20);

    if (!questions || questions.length === 0) {
      console.log(`❌ No passages found for ${product} (${section})\n`);
      continue;
    }

    // Extract unique passages
    const passageMap = new Map<string, string>();
    questions.forEach(q => {
      const passage = extractPassage(q.question_text);
      if (passage && q.passage_id) {
        passageMap.set(q.passage_id, passage);
      }
    });

    if (passageMap.size === 0) {
      console.log(`❌ Could not extract passages for ${product}\n`);
      continue;
    }

    // Analyze first 3 passages
    const passages = Array.from(passageMap.values()).slice(0, 3);
    const analyses = passages.map(p => analyzeText(p));

    // Calculate averages
    const avgMetrics = {
      wordCount: (analyses.reduce((sum, a) => sum + a.wordCount, 0) / analyses.length).toFixed(0),
      avgWordsPerSentence: (analyses.reduce((sum, a) => sum + parseFloat(a.avgWordsPerSentence), 0) / analyses.length).toFixed(1),
      complexWordPct: (analyses.reduce((sum, a) => sum + parseFloat(a.complexWordPct), 0) / analyses.length).toFixed(1),
      gradeLevel: (analyses.reduce((sum, a) => sum + parseFloat(a.gradeLevel), 0) / analyses.length).toFixed(1)
    };

    results.push({
      product,
      targetYear,
      ...avgMetrics,
      samplePassage: passages[0].substring(0, 300)
    });

    console.log('▓'.repeat(80));
    console.log(`${product.toUpperCase()} (Target: ${targetYear})`);
    console.log('▓'.repeat(80) + '\n');

    console.log('AVERAGE PASSAGE METRICS (from 3 sample passages):');
    console.log('─'.repeat(80));
    console.log(`Word Count: ${avgMetrics.wordCount}`);
    console.log(`Avg Words per Sentence: ${avgMetrics.avgWordsPerSentence}`);
    console.log(`Complex Word %: ${avgMetrics.complexWordPct}%`);
    console.log(`Estimated Grade Level: ${avgMetrics.gradeLevel}`);

    console.log('\n\nSAMPLE PASSAGE EXCERPT:');
    console.log('─'.repeat(80));
    console.log(passages[0].substring(0, 400) + '...\n\n');
  }

  // Summary comparison table
  console.log('\n' + '═'.repeat(80));
  console.log('SUMMARY COMPARISON TABLE');
  console.log('═'.repeat(80) + '\n');

  console.log('Product'.padEnd(38) + ' | Target | Words | Sent Len | Complex% | Grade');
  console.log('─'.repeat(88));

  results.forEach(r => {
    console.log(
      r.product.padEnd(38) + ' | ' +
      r.targetYear.padEnd(6) + ' | ' +
      r.wordCount.toString().padStart(5) + ' | ' +
      r.avgWordsPerSentence.toString().padStart(8) + ' | ' +
      (r.complexWordPct + '%').padStart(8) + ' | ' +
      r.gradeLevel.toString().padStart(5)
    );
  });

  console.log('\n' + '═'.repeat(80));
  console.log('INTERPRETATION');
  console.log('═'.repeat(80));
  console.log(`
EXPECTED PROGRESSION:
  Year 5: Grade level ~5-6, shorter sentences (~12-15 words), simpler vocab (~10-15% complex)
  Year 7: Grade level ~7-8, moderate sentences (~15-18 words), intermediate vocab (~15-20% complex)
  Year 9: Grade level ~9-10, longer sentences (~18-22 words), advanced vocab (~20-25% complex)

WHAT TO LOOK FOR:
  ✅ Grade level should match or slightly exceed target year
  ✅ Sentence length and complexity should increase with year level
  ❌ If Year 9 passages are easier than Year 7, calibration is off
  `);
}

comparePassageComplexity()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
