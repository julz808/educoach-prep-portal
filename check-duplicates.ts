import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://mcxxiunseawojmojikvb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jeHhpdW5zZWF3b2ptb2ppa3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNDEwODUsImV4cCI6MjA2MzcxNzA4NX0.TNpEFgSITMB1ZBIfhQkmkpgudf5bfxH3vVqJPgHPLjY'
);

async function checkForDuplicates() {
  console.log('🔍 Checking for duplicate writing questions by difficulty...\n');
  
  const { data: allWriting, error } = await supabase
    .from('questions')
    .select('product_type, section_name, sub_skill, difficulty')
    .eq('test_mode', 'drill')
    .or('section_name.eq.Writing,section_name.eq.Written Expression');
    
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  if (!allWriting) {
    console.log('No writing questions found');
    return;
  }
  
  // Group by product_type, section_name, sub_skill, difficulty
  const grouped = allWriting.reduce((acc, q) => {
    const key = `${q.product_type}|${q.section_name}|${q.sub_skill}|${q.difficulty}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const duplicates = Object.entries(grouped).filter(([key, count]) => count > 1);
  
  console.log(`📊 Total writing questions: ${allWriting.length}`);
  console.log(`🔍 Groups with duplicates: ${duplicates.length}\n`);
  
  if (duplicates.length > 0) {
    console.log('❗ Found duplicate groups:');
    duplicates.forEach(([key, count]) => {
      const [product, section, subSkill, difficulty] = key.split('|');
      console.log(`- ${product} | ${section} | ${subSkill} | Difficulty ${difficulty}: ${count} questions`);
    });
    console.log(`\n✅ SQL script is needed to clean up ${duplicates.length} duplicate groups`);
  } else {
    console.log('✅ No duplicates found! Each writing sub-skill already has unique questions per difficulty.');
  }
  
  // Show difficulty distribution
  const difficulties = [...new Set(allWriting.map(q => q.difficulty))].sort();
  console.log(`\n📊 Difficulty levels present: ${difficulties.join(', ')}`);
  
  difficulties.forEach(diff => {
    const count = allWriting.filter(q => q.difficulty === diff).length;
    console.log(`   Difficulty ${diff}: ${count} questions`);
  });
}

checkForDuplicates().catch(console.error);