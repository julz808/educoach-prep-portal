import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function queryVicStructure() {
  // Get section/mode breakdown
  const { data: questions, error } = await supabase
    .from('questions_v2')
    .select('section_name, test_mode, sub_skill, response_type, id, passage_id, has_visual')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)');

  if (error) {
    console.error('Error fetching questions:', error);
    return;
  }

  console.log(`\n📊 VIC SELECTIVE TEST STRUCTURE`);
  console.log(`Total Questions: ${questions.length}\n`);

  // Group by section and mode
  const structure: Record<string, Record<string, any>> = {};
  let visualCount = 0;
  let passageCount = 0;

  questions.forEach((q) => {
    const section = q.section_name;
    const mode = q.test_mode;

    if (!structure[section]) {
      structure[section] = {};
    }
    if (!structure[section][mode]) {
      structure[section][mode] = {
        count: 0,
        subskills: new Set(),
        responseTypes: new Set(),
      };
    }
    structure[section][mode].count++;
    if (q.sub_skill) structure[section][mode].subskills.add(q.sub_skill);
    structure[section][mode].responseTypes.add(q.response_type);
    if (q.has_visual) visualCount++;
    if (q.passage_id) passageCount++;
  });

  // Sort sections (Numerical first) - using actual database section names
  const sectionOrder = Object.keys(structure).sort((a, b) => {
    // Prioritize math/numerical sections first
    if (a.includes('Numerical') || a.includes('Maths')) return -1;
    if (b.includes('Numerical') || b.includes('Maths')) return 1;
    if (a.includes('Verbal')) return -1;
    if (b.includes('Verbal')) return 1;
    if (a.includes('Reading')) return -1;
    if (b.includes('Reading')) return 1;
    return a.localeCompare(b);
  });

  sectionOrder.forEach((section) => {

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📝 ${section.toUpperCase()}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    // Sort modes (practice_1 first, then diagnostic, then drills)
    const modes = Object.keys(structure[section]).sort((a, b) => {
      const order = ['practice_1', 'practice_2', 'practice_3', 'practice_4', 'practice_5', 'diagnostic'];
      const aIndex = order.indexOf(a) !== -1 ? order.indexOf(a) : 999;
      const bIndex = order.indexOf(b) !== -1 ? order.indexOf(b) : 999;
      if (aIndex !== bIndex) return aIndex - bIndex;
      return a.localeCompare(b);
    });

    modes.forEach((mode) => {
      const modeData = structure[section][mode];
      console.log(`\n  ${mode}:`);
      console.log(`    Questions: ${modeData.count}`);
      console.log(`    Sub-skills: ${modeData.subskills.size}`);
      console.log(`    Response Types: ${Array.from(modeData.responseTypes).join(', ')}`);
      console.log(`    Sub-skills List: ${Array.from(modeData.subskills).join(', ')}`);
    });
  });

  console.log(`\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🎨 VISUAL QUESTIONS`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Total Visual Questions: ${visualCount}`);

  console.log(`\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📖 PASSAGE-BASED QUESTIONS`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Questions with Passages: ${passageCount}`);

  // Get reading comprehension passages
  const { data: passages } = await supabase
    .from('passages_v2')
    .select('id, topic, difficulty_level')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)');

  console.log(`Unique Passages: ${passages?.length || 0}`);
}

queryVicStructure();
