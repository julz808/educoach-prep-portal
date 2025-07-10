import { supabase } from './src/integrations/supabase/client.ts';
import { writeFileSync } from 'fs';

// EduTest Scholarship Requirements from curriculumData.ts
const EDUTEST_REQUIREMENTS = {
  practice: {
    'Reading Comprehension': 50,
    'Verbal Reasoning': 60,
    'Numerical Reasoning': 50,
    'Mathematics': 60,
    'Written Expression': 2
  },
  diagnostic: {
    'Reading Comprehension': 50,
    'Verbal Reasoning': 60,
    'Numerical Reasoning': 50,
    'Mathematics': 60,
    'Written Expression': 2
  },
  drill: {
    // Sub-skills × questions per sub-skill
    'Reading Comprehension': 7 * 30, // 210 total: 7 sub-skills × 30 questions (10 Easy + 10 Medium + 10 Hard)
    'Verbal Reasoning': 8 * 30, // 240 total: 8 sub-skills × 30 questions
    'Numerical Reasoning': 8 * 30, // 240 total: 8 sub-skills × 30 questions  
    'Mathematics': 8 * 30, // 240 total: 8 sub-skills × 30 questions
    'Written Expression': 5 * 6 // 30 total: 5 sub-skills × 6 questions (2 Easy + 2 Medium + 2 Hard)
  }
};

const SUB_SKILLS = {
  'Reading Comprehension': [
    "Literal Comprehension & Detail Extraction",
    "Inferential Reasoning & Implied Meaning", 
    "Main Idea & Theme Identification",
    "Vocabulary in Context & Word Meaning",
    "Author's Purpose & Intent Analysis",
    "Text Structure & Organisation",
    "Cross-Textual Connections"
  ],
  'Verbal Reasoning': [
    "Analogical Reasoning & Word Relationships",
    "Vocabulary & Semantic Knowledge",
    "Logical Deduction & Conditional Reasoning", 
    "Classification and Categorisation",
    "Code Breaking & Pattern Recognition",
    "Word Manipulation & Transformation",
    "Sequential Reasoning & Order",
    "Abstract Thinking & Concept Formation"
  ],
  'Numerical Reasoning': [
    "Number Sequence & Pattern Recognition",
    "Data Interpretation",
    "Proportional Reasoning & Ratios",
    "Logical Problem Solving with Numbers",
    "Mathematical Operations & Calculations",
    "Spatial-Numerical Reasoning",
    "Financial Literacy & Practical Applications",
    "Statistical Reasoning & Probability"
  ],
  'Mathematics': [
    "Arithmetic Operations & Number Sense",
    "Algebraic Thinking & Problem Solving",
    "Geometry and Spatial Reasoning",
    "Measurement & Unit Conversion",
    "Fractions, Decimals & Percentages",
    "Statistical Analysis",
    "Word Problem Solving & Application",
    "Time, Money & Practical Mathematics"
  ],
  'Written Expression': [
    "Narrative Writing",
    "Persuasive Writing", 
    "Expository Writing",
    "Creative Writing",
    "Descriptive Writing"
  ]
};

interface QuestionToRemove {
  id: string;
  test_mode: string;
  section_name: string;
  sub_skill?: string;
  difficulty?: number;
  created_at: string;
  reason: string;
}

async function createBalancedRemovalScript() {
  const testType = 'EduTest Scholarship (Year 7 Entry)';
  console.log(`🎯 Creating Balanced Question Removal Script for ${testType}\n`);
  
  const questionsToRemove: QuestionToRemove[] = [];
  
  // 1. PRACTICE TESTS - Remove excess questions while maintaining sub-skill balance
  console.log('📊 ANALYZING PRACTICE TESTS');
  console.log('='.repeat(70));
  
  for (let i = 1; i <= 5; i++) {
    const testMode = `practice_${i}`;
    console.log(`\n📝 ${testMode.toUpperCase()}`);
    
    for (const [section, targetCount] of Object.entries(EDUTEST_REQUIREMENTS.practice)) {
      // Get all questions for this section/mode
      const { data: questions, error } = await supabase
        .from('questions')
        .select('id, sub_skill, difficulty, created_at')
        .eq('test_type', testType)
        .eq('test_mode', testMode)
        .eq('section_name', section)
        .order('created_at', { ascending: false }); // Newest first for removal
      
      if (error || !questions) {
        console.error(`Error fetching ${section} questions:`, error);
        continue;
      }
      
      const currentCount = questions.length;
      const excessCount = currentCount - targetCount;
      
      console.log(`  ${section}: ${currentCount}/${targetCount} (${excessCount > 0 ? `${excessCount} excess` : 'OK'})`);
      
      if (excessCount > 0) {
        // For practice tests, maintain sub-skill balance when removing
        const subSkillCounts: Record<string, number> = {};
        questions.forEach(q => {
          if (q.sub_skill) {
            subSkillCounts[q.sub_skill] = (subSkillCounts[q.sub_skill] || 0) + 1;
          }
        });
        
        // Remove newest questions while trying to maintain balance
        const sortedQuestions = [...questions].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        for (let j = 0; j < excessCount && j < sortedQuestions.length; j++) {
          const question = sortedQuestions[j];
          questionsToRemove.push({
            id: question.id,
            test_mode: testMode,
            section_name: section,
            sub_skill: question.sub_skill,
            difficulty: question.difficulty,
            created_at: question.created_at,
            reason: `Practice test excess - removing newest questions to reach target of ${targetCount}`
          });
        }
      }
    }
  }
  
  // 2. DIAGNOSTIC TEST - Remove excess questions while maintaining sub-skill balance
  console.log('\n\n📊 ANALYZING DIAGNOSTIC TEST');
  console.log('='.repeat(70));
  
  for (const [section, targetCount] of Object.entries(EDUTEST_REQUIREMENTS.diagnostic)) {
    const { data: questions, error } = await supabase
      .from('questions')
      .select('id, sub_skill, difficulty, created_at')
      .eq('test_type', testType)
      .eq('test_mode', 'diagnostic')
      .eq('section_name', section)
      .order('created_at', { ascending: false });
    
    if (error || !questions) {
      console.error(`Error fetching diagnostic ${section} questions:`, error);
      continue;
    }
    
    const currentCount = questions.length;
    const excessCount = currentCount - targetCount;
    
    console.log(`  ${section}: ${currentCount}/${targetCount} (${excessCount > 0 ? `${excessCount} excess` : 'OK'})`);
    
    if (excessCount > 0) {
      // Remove newest questions
      const sortedQuestions = [...questions].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      for (let j = 0; j < excessCount && j < sortedQuestions.length; j++) {
        const question = sortedQuestions[j];
        questionsToRemove.push({
          id: question.id,
          test_mode: 'diagnostic',
          section_name: section,
          sub_skill: question.sub_skill,
          difficulty: question.difficulty,
          created_at: question.created_at,
          reason: `Diagnostic excess - removing newest questions to reach target of ${targetCount}`
        });
      }
    }
  }
  
  // 3. DRILL TESTS - Remove excess while maintaining perfect sub-skill and difficulty balance
  console.log('\n\n📊 ANALYZING DRILL TESTS');
  console.log('='.repeat(70));
  
  for (const [section, targetTotal] of Object.entries(EDUTEST_REQUIREMENTS.drill)) {
    console.log(`\n🎯 ${section} Drills`);
    
    const subSkills = SUB_SKILLS[section as keyof typeof SUB_SKILLS] || [];
    const isWriting = section === 'Written Expression';
    const questionsPerSubSkill = isWriting ? 6 : 30;
    const questionsPerDifficulty = isWriting ? 2 : 10;
    
    for (const subSkill of subSkills) {
      console.log(`\n  📋 ${subSkill}`);
      
      // Analyze each difficulty level
      for (const difficulty of [1, 2, 3]) {
        const { data: questions, error } = await supabase
          .from('questions')
          .select('id, created_at')
          .eq('test_type', testType)
          .eq('test_mode', 'drill')
          .eq('section_name', section)
          .eq('sub_skill', subSkill)
          .eq('difficulty', difficulty)
          .order('created_at', { ascending: false });
        
        if (error || !questions) {
          console.error(`Error fetching ${subSkill} difficulty ${difficulty}:`, error);
          continue;
        }
        
        const currentCount = questions.length;
        const excessCount = currentCount - questionsPerDifficulty;
        
        console.log(`    Difficulty ${difficulty}: ${currentCount}/${questionsPerDifficulty} (${excessCount > 0 ? `${excessCount} excess` : 'OK'})`);
        
        if (excessCount > 0) {
          // Remove newest questions to maintain target count
          const sortedQuestions = [...questions].sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          
          for (let j = 0; j < excessCount && j < sortedQuestions.length; j++) {
            const question = sortedQuestions[j];
            questionsToRemove.push({
              id: question.id,
              test_mode: 'drill',
              section_name: section,
              sub_skill: subSkill,
              difficulty: difficulty,
              created_at: question.created_at,
              reason: `Drill excess - removing newest questions to reach target of ${questionsPerDifficulty} per difficulty`
            });
          }
        }
      }
    }
  }
  
  // 4. GENERATE SUMMARY AND SQL SCRIPT
  console.log('\n\n📊 REMOVAL SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total questions to remove: ${questionsToRemove.length}`);
  
  // Group by test mode
  const removalByMode: Record<string, number> = {};
  questionsToRemove.forEach(q => {
    removalByMode[q.test_mode] = (removalByMode[q.test_mode] || 0) + 1;
  });
  
  console.log('\nRemovals by test mode:');
  Object.entries(removalByMode).forEach(([mode, count]) => {
    console.log(`  ${mode}: ${count} questions`);
  });
  
  // Generate SQL script
  console.log('\n\n📋 GENERATING SQL REMOVAL SCRIPT');
  console.log('='.repeat(70));
  
  if (questionsToRemove.length === 0) {
    console.log('✅ No questions need to be removed - all counts are correct!');
    return;
  }
  
  const questionIds = questionsToRemove.map(q => q.id);
  const batchSize = 100; // Process in batches to avoid query limits
  
  let sqlScript = `-- EduTest Question Removal Script\n`;
  sqlScript += `-- Generated on ${new Date().toISOString()}\n`;
  sqlScript += `-- Total questions to remove: ${questionsToRemove.length}\n\n`;
  
  // Add detailed breakdown
  sqlScript += `-- REMOVAL BREAKDOWN:\n`;
  Object.entries(removalByMode).forEach(([mode, count]) => {
    sqlScript += `-- ${mode}: ${count} questions\n`;
  });
  sqlScript += `\n`;
  
  // Generate batched DELETE statements
  for (let i = 0; i < questionIds.length; i += batchSize) {
    const batch = questionIds.slice(i, i + batchSize);
    sqlScript += `-- Batch ${Math.floor(i / batchSize) + 1} (${batch.length} questions)\n`;
    sqlScript += `DELETE FROM questions WHERE id IN (\n`;
    sqlScript += batch.map(id => `  '${id}'`).join(',\n');
    sqlScript += `\n);\n\n`;
  }
  
  // Add verification queries
  sqlScript += `-- VERIFICATION QUERIES:\n`;
  sqlScript += `-- Check final counts by test mode and section\n`;
  sqlScript += `SELECT test_mode, section_name, COUNT(*) as question_count\n`;
  sqlScript += `FROM questions \n`;
  sqlScript += `WHERE test_type = 'EduTest Scholarship (Year 7 Entry)'\n`;
  sqlScript += `GROUP BY test_mode, section_name\n`;
  sqlScript += `ORDER BY test_mode, section_name;\n\n`;
  
  sqlScript += `-- Check drill questions by sub-skill and difficulty\n`;
  sqlScript += `SELECT section_name, sub_skill, difficulty, COUNT(*) as question_count\n`;
  sqlScript += `FROM questions \n`;
  sqlScript += `WHERE test_type = 'EduTest Scholarship (Year 7 Entry)' AND test_mode = 'drill'\n`;
  sqlScript += `GROUP BY section_name, sub_skill, difficulty\n`;
  sqlScript += `ORDER BY section_name, sub_skill, difficulty;\n`;
  
  // Write to file
  writeFileSync('delete-edutest-excess-questions.sql', sqlScript);
  
  console.log('✅ SQL script generated: delete-edutest-excess-questions.sql');
  console.log('\n📋 DETAILED REMOVAL LIST:');
  console.log('='.repeat(70));
  
  // Show sample of what will be removed
  questionsToRemove.slice(0, 20).forEach(q => {
    console.log(`${q.test_mode} | ${q.section_name} | ${q.sub_skill || 'N/A'} | Difficulty ${q.difficulty || 'N/A'} | ${q.reason}`);
  });
  
  if (questionsToRemove.length > 20) {
    console.log(`... and ${questionsToRemove.length - 20} more questions`);
  }
  
  return questionsToRemove;
}

createBalancedRemovalScript().catch(console.error);