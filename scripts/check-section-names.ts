import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSectionNames() {
  console.log('Checking section names in database for Year 5 NAPLAN...\n');

  // Get distinct section names for Year 5 NAPLAN
  const { data: year5Sections, error: year5Error } = await supabase
    .from('questions')
    .select('section_name, test_mode')
    .eq('product_type', 'Year 5 NAPLAN')
    .order('section_name');

  if (year5Error) {
    console.error('Error fetching Year 5 sections:', year5Error);
    return;
  }

  // Get unique section names
  const uniqueSections = new Map<string, Set<string>>();
  year5Sections?.forEach(row => {
    if (!uniqueSections.has(row.section_name)) {
      uniqueSections.set(row.section_name, new Set());
    }
    uniqueSections.get(row.section_name)!.add(row.test_mode);
  });

  console.log('Year 5 NAPLAN - Section Names in Database:');
  uniqueSections.forEach((testModes, sectionName) => {
    console.log(`  - ${sectionName}`);
    console.log(`    Test modes: ${Array.from(testModes).join(', ')}`);
  });

  console.log('\n\nChecking completed sessions for a user...\n');

  // Get a sample user who has completed Year 5 NAPLAN
  const { data: sessions, error: sessionError } = await supabase
    .from('user_test_sessions')
    .select('user_id, section_name, test_mode, status')
    .eq('product_type', 'Year 5 NAPLAN')
    .eq('status', 'completed')
    .limit(10);

  if (sessionError) {
    console.error('Error fetching sessions:', sessionError);
    return;
  }

  if (sessions && sessions.length > 0) {
    console.log('Sample completed sessions:');
    sessions.forEach(session => {
      console.log(`  User: ${session.user_id.substring(0, 8)}... | Section: ${session.section_name} | Mode: ${session.test_mode}`);
    });
  } else {
    console.log('No completed sessions found');
  }
}

checkSectionNames().catch(console.error);
