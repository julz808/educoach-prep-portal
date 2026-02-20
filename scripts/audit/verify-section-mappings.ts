/**
 * Verify that all test sections are correctly mapped to validation categories
 */

import { SECTION_CONFIGURATIONS } from '@/data/curriculumData_v2/sectionConfigurations';

// Copy of the mapping from validator.ts
const SECTION_CATEGORIES: Record<string, 'maths' | 'verbal' | 'reading' | 'writing'> = {
  // Maths / Numerical
  'Mathematics':                        'maths',
  'Numerical Reasoning':                'maths',
  'Mathematical Reasoning':             'maths',
  'Numeracy':                           'maths',
  'Numeracy No Calculator':             'maths',
  'Numeracy Calculator':                'maths',
  'General Ability - Quantitative':     'maths',
  'Mathematics Reasoning':              'maths',

  // Verbal / Vocabulary
  'Verbal Reasoning':                   'verbal',
  'Thinking Skills':                    'verbal',
  'Language Conventions':               'verbal',
  'General Ability - Verbal':           'verbal',

  // Reading
  'Reading':                            'reading',
  'Reading Comprehension':              'reading',
  'Reading Reasoning':                  'reading',
  'Humanities':                         'reading',

  // Writing
  'Writing':                            'writing',
  'Written Expression':                 'writing',
};

function getSectionCategory(sectionName: string): 'maths' | 'verbal' | 'reading' | 'writing' {
  // Exact match first
  if (SECTION_CATEGORIES[sectionName]) return SECTION_CATEGORIES[sectionName];

  // Fallback: keyword scan
  const lower = sectionName.toLowerCase();
  if (lower.includes('math') || lower.includes('numer') || lower.includes('quantit')) return 'maths';
  if (lower.includes('verbal') || lower.includes('language') || lower.includes('thinking')) return 'verbal';
  if (lower.includes('reading') || lower.includes('humanit') || lower.includes('comprehension')) return 'reading';
  if (lower.includes('writ')) return 'writing';
  return 'verbal'; // safe default
}

async function verifySectionMappings() {
  console.log('\n🔍 Verifying Section → Validation Category Mappings\n');
  console.log('━'.repeat(80));

  const allSections = Object.keys(SECTION_CONFIGURATIONS);

  console.log(`Total sections configured: ${allSections.length}\n`);

  // Group by test type
  const byTestType = new Map<string, string[]>();
  allSections.forEach(key => {
    const config = SECTION_CONFIGURATIONS[key];
    const testType = config.test_type;
    if (!byTestType.has(testType)) {
      byTestType.set(testType, []);
    }
    byTestType.get(testType)!.push(config.section_name);
  });

  // Check each section
  const mappings: Array<{
    test: string;
    section: string;
    category: string;
    method: 'exact' | 'fallback';
    isCorrect: boolean;
    suggestion?: string;
  }> = [];

  byTestType.forEach((sections, testType) => {
    console.log(`\n${testType}:`);
    console.log('─'.repeat(80));

    sections.forEach(sectionName => {
      const exactMatch = SECTION_CATEGORIES[sectionName];
      const category = getSectionCategory(sectionName);
      const method = exactMatch ? 'exact' : 'fallback';

      // Verify if the mapping seems correct
      let isCorrect = true;
      let suggestion: string | undefined;

      // Validation rules
      if (sectionName.toLowerCase().includes('math') || sectionName.toLowerCase().includes('numer')) {
        if (category !== 'maths') {
          isCorrect = false;
          suggestion = 'Should be "maths"';
        }
      } else if (sectionName.toLowerCase().includes('verbal') || sectionName.toLowerCase().includes('vocabulary')) {
        if (category !== 'verbal') {
          isCorrect = false;
          suggestion = 'Should be "verbal"';
        }
      } else if (sectionName.toLowerCase().includes('reading') || sectionName.toLowerCase().includes('comprehension')) {
        if (category !== 'reading') {
          isCorrect = false;
          suggestion = 'Should be "reading"';
        }
      } else if (sectionName.toLowerCase().includes('writing') || sectionName.toLowerCase().includes('expression')) {
        if (category !== 'writing') {
          isCorrect = false;
          suggestion = 'Should be "writing"';
        }
      }

      const status = isCorrect ? '✅' : '⚠️ ';
      const methodLabel = method === 'exact' ? 'EXACT' : 'FALLBACK';

      console.log(`  ${status} ${sectionName}`);
      console.log(`      → ${category.toUpperCase()} (${methodLabel})`);

      if (!isCorrect && suggestion) {
        console.log(`      💡 ${suggestion}`);
      }

      mappings.push({
        test: testType,
        section: sectionName,
        category,
        method,
        isCorrect,
        suggestion
      });
    });
  });

  console.log('\n\n');
  console.log('━'.repeat(80));
  console.log('SUMMARY:');
  console.log('━'.repeat(80));

  const byCategory = mappings.reduce((acc, m) => {
    if (!acc[m.category]) acc[m.category] = [];
    acc[m.category].push(m);
    return acc;
  }, {} as Record<string, typeof mappings>);

  console.log('');
  Object.entries(byCategory).forEach(([category, sections]) => {
    const exactCount = sections.filter(s => s.method === 'exact').length;
    const fallbackCount = sections.filter(s => s.method === 'fallback').length;
    console.log(`${category.toUpperCase()}: ${sections.length} sections (${exactCount} exact, ${fallbackCount} fallback)`);
  });

  const incorrectMappings = mappings.filter(m => !m.isCorrect);
  if (incorrectMappings.length > 0) {
    console.log('\n');
    console.log('━'.repeat(80));
    console.log('⚠️  POTENTIAL ISSUES:');
    console.log('━'.repeat(80));
    console.log('');
    incorrectMappings.forEach(m => {
      console.log(`${m.test} - ${m.section}`);
      console.log(`  Current: ${m.category} (${m.method})`);
      console.log(`  ${m.suggestion}`);
      console.log('');
    });
  } else {
    console.log('\n✅ All sections correctly mapped!\n');
  }

  const fallbackSections = mappings.filter(m => m.method === 'fallback');
  if (fallbackSections.length > 0) {
    console.log('━'.repeat(80));
    console.log('💡 RECOMMENDATION - Add exact mappings for fallback sections:');
    console.log('━'.repeat(80));
    console.log('');
    console.log('Add these to SECTION_CATEGORIES in validator.ts:');
    console.log('');
    fallbackSections.forEach(m => {
      console.log(`  '${m.section}': '${m.category}',`);
    });
    console.log('');
  }

  console.log('━'.repeat(80));
  console.log('\n');
}

verifySectionMappings()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
  });
