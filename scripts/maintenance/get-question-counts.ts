import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function getQuestionCounts() {
  console.log('Fetching question counts from Supabase...\n');

  // First, let's get a sample to see the column names
  const { data: sample, error: sampleError } = await supabase
    .from('questions')
    .select('*')
    .limit(1);

  if (sampleError) {
    console.error('Error fetching sample:', sampleError);
    return;
  }

  console.log('Sample question columns:', Object.keys(sample[0] || {}));
  console.log('Sample question:', sample[0]);

  // Get all questions - need to handle pagination for large datasets
  let allData: any[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: pageData, error } = await supabase
      .from('questions')
      .select('test_type, section_name, test_mode')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error('Error fetching questions:', error);
      return;
    }

    if (pageData && pageData.length > 0) {
      allData = allData.concat(pageData);
      page++;
      console.log(`Fetched page ${page}, total so far: ${allData.length}`);
    }

    if (!pageData || pageData.length < pageSize) {
      hasMore = false;
    }
  }

  console.log(`\nTotal questions fetched: ${allData.length}\n`);
  const data = allData;

  // Group and count by test_type and test_mode
  const counts: { [test: string]: { [mode: string]: { [section: string]: number } } } = {};

  data.forEach((q: any) => {
    const test = q.test_type || 'Unknown';
    const mode = q.test_mode || 'Unknown';
    const section = q.section_name || 'Unknown';

    if (!counts[test]) counts[test] = {};
    if (!counts[test][mode]) counts[test][mode] = {};
    if (!counts[test][mode][section]) counts[test][mode][section] = 0;

    counts[test][mode][section]++;
  });

  // Display results
  for (const [test, types] of Object.entries(counts)) {
    console.log(`\n=== ${test} ===`);

    let totalQuestions = 0;
    let drillCount = 0;
    let practiceCount = 0;
    let diagnosticCount = 0;

    for (const [type, sections] of Object.entries(types)) {
      const typeTotal = Object.values(sections).reduce((sum, count) => sum + count, 0);
      console.log(`\n  ${type}: ${typeTotal} questions`);

      for (const [section, count] of Object.entries(sections)) {
        console.log(`    ${section}: ${count}`);
      }

      totalQuestions += typeTotal;

      if (type === 'drill') drillCount += typeTotal;
      else if (type === 'practice_test') practiceCount += typeTotal;
      else if (type === 'diagnostic') diagnosticCount += typeTotal;
    }

    console.log(`\n  TOTALS:`);
    console.log(`    Total Questions: ${totalQuestions}`);
    console.log(`    Drill Questions: ${drillCount}`);
    console.log(`    Practice Test Questions: ${practiceCount}`);
    console.log(`    Diagnostic Questions: ${diagnosticCount}`);
  }
}

getQuestionCounts();
