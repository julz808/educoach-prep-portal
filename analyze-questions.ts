import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://mcxxiunseawojmojikvb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jeHhpdW5zZWF3b2ptb2ppa3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNDEwODUsImV4cCI6MjA2MzcxNzA4NX0.TNpEFgSITMB1ZBIfhQkmkpgudf5bfxH3vVqJPgHPLjY'
);

async function analyzeWritingQuestions() {
  console.log('🔍 Analyzing questions table structure and writing questions...\n');
  
  // First, get all drill questions to see the data structure
  const { data: allDrillQuestions, error } = await supabase
    .from('questions')
    .select('*')
    .eq('test_mode', 'drill')
    .limit(3);
    
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log('📊 Sample drill question structure:');
  if (allDrillQuestions && allDrillQuestions.length > 0) {
    console.log('Columns:', Object.keys(allDrillQuestions[0]));
    console.log('Sample question:', JSON.stringify(allDrillQuestions[0], null, 2));
  }
  
  console.log('\n🔍 Looking for writing-related questions in drill mode...\n');
  
  // Find potential writing questions - try different approaches
  const { data: writingQuestions1, error: writingError1 } = await supabase
    .from('questions')
    .select('id, product_type, section_name, sub_skill, sub_skill_id, difficulty, question_text, created_at')
    .eq('test_mode', 'drill')
    .ilike('section_name', '%writing%');
    
  const { data: writingQuestions2, error: writingError2 } = await supabase
    .from('questions')
    .select('id, product_type, section_name, sub_skill, sub_skill_id, difficulty, question_text, created_at')
    .eq('test_mode', 'drill')
    .ilike('section_name', '%written%');
    
  const { data: writingQuestions3, error: writingError3 } = await supabase
    .from('questions')
    .select('id, product_type, section_name, sub_skill, sub_skill_id, difficulty, question_text, created_at')
    .eq('test_mode', 'drill')
    .ilike('sub_skill', '%writing%');
    
  console.log('📝 Section name contains "writing":', writingQuestions1?.length || 0);
  writingQuestions1?.forEach(q => {
    console.log(`- ID: ${q.id}, Product: ${q.product_type}, Section: "${q.section_name}", Sub-skill: "${q.sub_skill}", Difficulty: ${q.difficulty}`);
  });
  
  console.log('\n📝 Section name contains "written":', writingQuestions2?.length || 0);
  writingQuestions2?.forEach(q => {
    console.log(`- ID: ${q.id}, Product: ${q.product_type}, Section: "${q.section_name}", Sub-skill: "${q.sub_skill}", Difficulty: ${q.difficulty}`);
  });
  
  console.log('\n📝 Sub-skill contains "writing":', writingQuestions3?.length || 0);
  writingQuestions3?.forEach(q => {
    console.log(`- ID: ${q.id}, Product: ${q.product_type}, Section: "${q.section_name}", Sub-skill: "${q.sub_skill}", Difficulty: ${q.difficulty}`);
  });
  
  // Get all distinct sections for drill mode
  const { data: sections, error: sectionsError } = await supabase
    .from('questions')
    .select('section_name')
    .eq('test_mode', 'drill');
    
  const { data: subSkills, error: subSkillsError } = await supabase
    .from('questions')
    .select('sub_skill')
    .eq('test_mode', 'drill');
    
  if (sections && !sectionsError) {
    const uniqueSections = [...new Set(sections.map(s => s.section_name))].sort();
    console.log('\n📋 All drill sections:', uniqueSections);
  }
  
  if (subSkills && !subSkillsError) {
    const uniqueSubSkills = [...new Set(subSkills.map(s => s.sub_skill))].sort();
    console.log('\n🎯 All drill sub-skills containing writing terms:');
    const writingSubSkills = uniqueSubSkills.filter(s => 
      s && (
        s.toLowerCase().includes('writing') || 
        s.toLowerCase().includes('written') || 
        s.toLowerCase().includes('narrative') || 
        s.toLowerCase().includes('persuasive') ||
        s.toLowerCase().includes('expression')
      )
    );
    writingSubSkills.forEach(skill => console.log(`- "${skill}"`));
  }
  
  // Count duplicates by section and sub-skill
  console.log('\n📊 Counting drill questions by section/sub-skill/difficulty...');
  const { data: counts, error: countsError } = await supabase
    .rpc('count_drill_questions_by_group');
    
  if (countsError) {
    console.log('Creating manual count...');
    // Manual count since RPC doesn't exist
    const { data: allQuestions } = await supabase
      .from('questions')
      .select('product_type, section_name, sub_skill, difficulty')
      .eq('test_mode', 'drill');
      
    if (allQuestions) {
      const grouped = allQuestions.reduce((acc, q) => {
        const key = `${q.product_type}|${q.section_name}|${q.sub_skill}|${q.difficulty}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log('\nGroups with multiple questions:');
      Object.entries(grouped)
        .filter(([key, count]) => count > 1)
        .forEach(([key, count]) => {
          const [product, section, subSkill, difficulty] = key.split('|');
          console.log(`- ${product} | "${section}" | "${subSkill}" | Difficulty ${difficulty}: ${count} questions`);
        });
    }
  }
}

analyzeWritingQuestions().catch(console.error);