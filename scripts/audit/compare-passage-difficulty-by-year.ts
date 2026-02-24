import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function comparePassages() {
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('READING PASSAGE DIFFICULTY CALIBRATION ACROSS YEAR LEVELS');
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');

  // Products to compare (different year levels)
  const products = [
    { name: 'Year 5 NAPLAN', year: 'Year 5', product: 'Year 5 NAPLAN' },
    { name: 'NSW Selective Entry (Year 7)', year: 'Year 7', product: 'NSW Selective Entry (Year 7 Entry)' },
    { name: 'EduTest Scholarship (Year 7)', year: 'Year 7', product: 'EduTest Scholarship (Year 7 Entry)' },
    { name: 'VIC Selective Entry (Year 9)', year: 'Year 9', product: 'VIC Selective Entry (Year 9 Entry)' },
  ];

  for (const { name, year, product } of products) {
    console.log('\n' + '▓'.repeat(80));
    console.log(`${name.toUpperCase()} (${year})`);
    console.log('▓'.repeat(80) + '\n');

    // Get a sample passage
    const { data: questions } = await supabase
      .from('questions_v2')
      .select('passage_data, passage_id, section_name')
      .eq('product_type', product)
      .not('passage_data', 'is', null)
      .limit(50);

    if (!questions || questions.length === 0) {
      console.log(`❌ No passages found for ${name}\n`);
      continue;
    }

    // Get unique passages
    const passageMap = new Map();
    questions.forEach(q => {
      if (q.passage_data && q.passage_id) {
        passageMap.set(q.passage_id, q.passage_data);
      }
    });

    if (passageMap.size === 0) {
      console.log(`❌ No valid passages found for ${name}\n`);
      continue;
    }

    // Pick the first passage
    const [passageId, passageData] = Array.from(passageMap.entries())[0];

    console.log(`Passage ID: ${passageId}`);
    console.log('─'.repeat(80));

    // Extract title and content
    let title = '';
    let content = '';

    if (typeof passageData === 'object' && passageData !== null) {
      title = (passageData as any).title || '';
      content = (passageData as any).content || (passageData as any).text || '';
    } else if (typeof passageData === 'string') {
      content = passageData;
    }

    if (title) {
      console.log(`\nTITLE: ${title}\n`);
    }

    // Show first 600 characters
    const preview = content.substring(0, 600);
    console.log('PASSAGE EXCERPT:');
    console.log('─'.repeat(80));
    console.log(preview + (content.length > 600 ? '...\n' : '\n'));

    // Calculate reading metrics
    const wordCount = content.split(/\s+/).length;
    const sentenceCount = content.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const avgWordsPerSentence = (wordCount / sentenceCount).toFixed(1);

    // Count complex words (3+ syllables - rough heuristic)
    const words = content.split(/\s+/);
    const complexWords = words.filter(w => {
      const vowelGroups = w.toLowerCase().match(/[aeiouy]+/g);
      return vowelGroups && vowelGroups.length >= 3;
    }).length;
    const complexWordPercentage = ((complexWords / wordCount) * 100).toFixed(1);

    console.log('PASSAGE METRICS:');
    console.log('─'.repeat(80));
    console.log(`Word Count: ${wordCount}`);
    console.log(`Sentence Count: ${sentenceCount}`);
    console.log(`Avg Words per Sentence: ${avgWordsPerSentence}`);
    console.log(`Complex Words (3+ syllables): ${complexWords} (${complexWordPercentage}%)`);
    console.log(`Estimated Reading Level: ${getReadingLevel(parseFloat(avgWordsPerSentence), parseFloat(complexWordPercentage))}`);
  }

  console.log('\n\n' + '═'.repeat(80));
  console.log('ANALYSIS SUMMARY');
  console.log('═'.repeat(80));
  console.log(`
This analysis shows:
1. Average sentence length (complexity indicator)
2. Complex word percentage (vocabulary difficulty)
3. Estimated reading level based on Flesch-Kincaid approximation

EXPECTED PROGRESSION:
- Year 5: Shorter sentences, simpler vocabulary, Grade 5-6 level
- Year 7: Moderate sentences, intermediate vocabulary, Grade 7-8 level
- Year 9: Longer sentences, advanced vocabulary, Grade 9-10 level

Compare the actual metrics above to see if passages are properly calibrated.
  `);
}

function getReadingLevel(avgWordsPerSentence: number, complexWordPct: number): string {
  // Simplified Flesch-Kincaid approximation
  // Higher values = harder to read
  const score = (0.39 * avgWordsPerSentence) + (11.8 * (complexWordPct / 100)) - 15.59;

  if (score < 5) return 'Grade 4-5 (Elementary)';
  if (score < 7) return 'Grade 6-7 (Middle School)';
  if (score < 9) return 'Grade 8-9 (High School)';
  if (score < 11) return 'Grade 10-11 (High School)';
  return 'Grade 12+ (Advanced)';
}

comparePassages()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
