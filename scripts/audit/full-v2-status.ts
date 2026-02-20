import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

(async () => {
  console.log('\n═════════════════════════════════════════════════════════════════════════');
  console.log(' V2 GENERATION ENGINE - FULL STATUS REPORT');
  console.log('═════════════════════════════════════════════════════════════════════════\n');

  // Get counts for each test type
  const testTypes = [
    'ACER Scholarship (Year 7 Entry)',
    'EduTest Scholarship (Year 7 Entry)',
    'NSW Selective Entry (Year 7 Entry)',
    'VIC Selective Entry (Year 9 Entry)',
    'Year 5 NAPLAN',
    'Year 7 NAPLAN'
  ];

  let grandTotal = 0;

  for (const testType of testTypes) {
    const { count } = await supabase
      .from('questions_v2')
      .select('*', { count: 'exact', head: true })
      .eq('test_type', testType);

    const questionCount = count || 0;
    console.log(`📝 ${testType}: ${questionCount} questions`);
    grandTotal += questionCount;

    // Get section breakdown
    const { data: sections } = await supabase
      .from('questions_v2')
      .select('section_name')
      .eq('test_type', testType);

    if (sections && sections.length > 0) {
      const sectionCounts: Record<string, number> = {};
      sections.forEach(s => {
        sectionCounts[s.section_name] = (sectionCounts[s.section_name] || 0) + 1;
      });

      Object.entries(sectionCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([section, sectionCount]) => {
          console.log(`   - ${section}: ${sectionCount}`);
        });
    }
    console.log();
  }

  console.log(`\n${'═'.repeat(77)}`);
  console.log(`📊 GRAND TOTAL: ${grandTotal} questions in questions_v2 table`);
  console.log(`${'═'.repeat(77)}\n`);

  // Check for extended_response (writing) questions
  const { count: writingResult } = await supabase
    .from('questions_v2')
    .select('*', { count: 'exact', head: true })
    .eq('response_type', 'extended_response');

  const writingCount = writingResult || 0;
  console.log(`✍️  Writing Questions (extended_response): ${writingCount}`);

  // Check for visual questions
  const { count: visualResult } = await supabase
    .from('questions_v2')
    .select('*', { count: 'exact', head: true })
    .eq('has_visual', true);

  const visualCount = visualResult || 0;
  console.log(`🎨 Visual Questions (has_visual=true): ${visualCount}`);

  console.log(`\n${'═'.repeat(77)}\n`);
})();
