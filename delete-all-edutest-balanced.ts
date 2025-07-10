import { supabase } from './src/integrations/supabase/client.ts';
import { writeFileSync } from 'fs';

// EduTest Requirements from curriculumData.ts
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
    'Reading Comprehension': 210, // 7 sub-skills × 30 questions (10 Easy + 10 Medium + 10 Hard)
    'Verbal Reasoning': 240, // 8 sub-skills × 30 questions
    'Numerical Reasoning': 240, // 8 sub-skills × 30 questions  
    'Mathematics': 240, // 8 sub-skills × 30 questions
    'Written Expression': 30 // 5 sub-skills × 6 questions (2 Easy + 2 Medium + 2 Hard)
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
  sub_skill: string;
  difficulty: number;
  created_at: string;
  reason: string;
}

async function createComprehensiveBalancedRemoval() {
  const testType = 'EduTest Scholarship (Year 7 Entry)';
  
  console.log(`🎯 Creating Comprehensive Balanced Removal Script for All EduTest Modes`);
  console.log(`Strategy: Remove older questions while maintaining sub-skill and difficulty balance\n`);
  console.log('='.repeat(100));
  
  const allQuestionsToRemove: QuestionToRemove[] = [];
  
  // 1. PRACTICE TESTS (practice_2 through practice_5)
  console.log('📊 PRACTICE TESTS (practice_2 through practice_5)');
  console.log('='.repeat(100));
  
  for (let i = 2; i <= 5; i++) {
    const testMode = `practice_${i}`;
    console.log(`\n📝 ${testMode.toUpperCase()}`);
    
    for (const [section, targetTotal] of Object.entries(EDUTEST_REQUIREMENTS.practice)) {
      const questionsToRemove = await processSection(testType, testMode, section, targetTotal, 'practice');
      allQuestionsToRemove.push(...questionsToRemove);
    }
  }
  
  // 2. DIAGNOSTIC TEST
  console.log('\n\n📊 DIAGNOSTIC TEST');
  console.log('='.repeat(100));
  
  for (const [section, targetTotal] of Object.entries(EDUTEST_REQUIREMENTS.diagnostic)) {
    const questionsToRemove = await processSection(testType, 'diagnostic', section, targetTotal, 'diagnostic');
    allQuestionsToRemove.push(...questionsToRemove);
  }
  
  // 3. DRILL TESTS
  console.log('\n\n📊 DRILL TESTS');
  console.log('='.repeat(100));
  
  for (const [section, targetTotal] of Object.entries(EDUTEST_REQUIREMENTS.drill)) {
    const questionsToRemove = await processDrillSection(testType, section, targetTotal);
    allQuestionsToRemove.push(...questionsToRemove);
  }
  
  // Generate comprehensive removal summary
  console.log('\n\n📊 COMPREHENSIVE REMOVAL SUMMARY');
  console.log('='.repeat(100));
  console.log(`Total questions to remove: ${allQuestionsToRemove.length}`);
  
  // Group by test mode
  const removalByMode: Record<string, number> = {};
  allQuestionsToRemove.forEach(q => {
    removalByMode[q.test_mode] = (removalByMode[q.test_mode] || 0) + 1;
  });
  
  console.log('\nRemovals by test mode:');
  Object.entries(removalByMode).forEach(([mode, count]) => {
    console.log(`  ${mode}: ${count} questions`);
  });
  
  // Generate SQL script
  if (allQuestionsToRemove.length === 0) {
    console.log('\n✅ No questions need to be removed - all counts are perfect!');
    return;
  }
  
  const questionIds = allQuestionsToRemove.map(q => q.id);
  const batchSize = 200; // Larger batches for efficiency
  
  let sqlScript = `-- EduTest Comprehensive Balanced Removal Script\n`;
  sqlScript += `-- Generated on ${new Date().toISOString()}\n`;
  sqlScript += `-- Strategy: Remove older questions while maintaining sub-skill and difficulty balance\n`;
  sqlScript += `-- Total questions to remove: ${allQuestionsToRemove.length}\n\n`;
  
  // Add detailed breakdown
  sqlScript += `-- REMOVAL BREAKDOWN BY TEST MODE:\n`;
  Object.entries(removalByMode).forEach(([mode, count]) => {
    sqlScript += `-- ${mode}: ${count} questions\n`;
  });
  sqlScript += `\n`;
  
  // Generate batched DELETE statements
  for (let i = 0; i < questionIds.length; i += batchSize) {
    const batch = questionIds.slice(i, i + batchSize);
    sqlScript += `-- Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} questions\n`;
    sqlScript += `DELETE FROM questions WHERE id IN (\n`;
    sqlScript += batch.map(id => `  '${id}'`).join(',\n');
    sqlScript += `\n);\n\n`;
  }
  
  // Add comprehensive verification queries
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
  sqlScript += `ORDER BY section_name, sub_skill, difficulty;\n\n`;
  
  sqlScript += `-- Final totals verification\n`;
  sqlScript += `SELECT \n`;
  sqlScript += `  COUNT(CASE WHEN test_mode LIKE 'practice_%' THEN 1 END) as practice_total,\n`;
  sqlScript += `  COUNT(CASE WHEN test_mode = 'diagnostic' THEN 1 END) as diagnostic_total,\n`;
  sqlScript += `  COUNT(CASE WHEN test_mode = 'drill' THEN 1 END) as drill_total,\n`;
  sqlScript += `  COUNT(*) as grand_total\n`;
  sqlScript += `FROM questions \n`;
  sqlScript += `WHERE test_type = 'EduTest Scholarship (Year 7 Entry)';\n`;
  
  // Write to file
  writeFileSync('delete-all-edutest-balanced.sql', sqlScript);
  
  console.log('\n✅ Comprehensive SQL script generated: delete-all-edutest-balanced.sql');
  console.log('\n📋 SAMPLE REMOVAL LIST (first 10):');
  console.log('='.repeat(100));
  
  allQuestionsToRemove.slice(0, 10).forEach(q => {
    const createdDate = new Date(q.created_at).toLocaleDateString();
    console.log(`${q.test_mode} | ${q.section_name} | ${q.sub_skill} | Difficulty ${q.difficulty} | Created: ${createdDate}`);
  });
  
  if (allQuestionsToRemove.length > 10) {
    console.log(`... and ${allQuestionsToRemove.length - 10} more questions`);
  }
  
  return allQuestionsToRemove;
}

async function processSection(testType: string, testMode: string, section: string, targetTotal: number, mode: string): Promise<QuestionToRemove[]> {
  console.log(`\n🎯 ${section} Section`);
  
  const questionsToRemove: QuestionToRemove[] = [];
  
  // Get all questions for this section
  const { data: allQuestions, error } = await supabase
    .from('questions')
    .select('id, sub_skill, difficulty, created_at')
    .eq('test_type', testType)
    .eq('test_mode', testMode)
    .eq('section_name', section)
    .order('created_at', { ascending: true }); // Oldest first
  
  if (error || !allQuestions) {
    console.error(`Error fetching ${section} questions:`, error);
    return [];
  }
  
  const currentTotal = allQuestions.length;
  const excessTotal = currentTotal - targetTotal;
  
  console.log(`  Current: ${currentTotal} | Target: ${targetTotal} | Excess: ${excessTotal}`);
  
  if (excessTotal <= 0) {
    console.log(`  ✅ ${section} is at target - no removal needed`);
    return [];
  }
  
  // Calculate ideal distribution per sub-skill
  const subSkills = SUB_SKILLS[section as keyof typeof SUB_SKILLS] || [];
  const questionsPerSubSkill = Math.floor(targetTotal / subSkills.length);
  const remainder = targetTotal % subSkills.length;
  
  console.log(`  Sub-skills: ${subSkills.length} | Questions per sub-skill: ${questionsPerSubSkill} (+${remainder} extra)`);
  
  // Group current questions by sub-skill
  const questionsBySubSkill: Record<string, any[]> = {};
  allQuestions.forEach(q => {
    if (!questionsBySubSkill[q.sub_skill]) questionsBySubSkill[q.sub_skill] = [];
    questionsBySubSkill[q.sub_skill].push(q);
  });
  
  // Calculate target distribution
  const targetDistribution: Record<string, number> = {};
  subSkills.forEach((subSkill, index) => {
    targetDistribution[subSkill] = questionsPerSubSkill + (index < remainder ? 1 : 0);
  });
  
  // For each sub-skill, remove excess questions (oldest first)
  subSkills.forEach(subSkill => {
    const targetForSubSkill = targetDistribution[subSkill];
    const currentQuestions = questionsBySubSkill[subSkill] || [];
    const currentCount = currentQuestions.length;
    const excessForSubSkill = currentCount - targetForSubSkill;
    
    console.log(`    ${subSkill}: ${currentCount}/${targetForSubSkill} (${excessForSubSkill > 0 ? `${excessForSubSkill} excess` : 'OK'})`);
    
    if (excessForSubSkill > 0) {
      // Sort by creation date (oldest first)
      const sortedQuestions = currentQuestions.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      // Remove oldest questions
      for (let i = 0; i < excessForSubSkill && i < sortedQuestions.length; i++) {
        const question = sortedQuestions[i];
        questionsToRemove.push({
          id: question.id,
          test_mode: testMode,
          section_name: section,
          sub_skill: question.sub_skill,
          difficulty: question.difficulty,
          created_at: question.created_at,
          reason: `${mode} balance: keeping ${targetForSubSkill} newest questions for ${subSkill}`
        });
      }
    }
  });
  
  return questionsToRemove;
}

async function processDrillSection(testType: string, section: string, targetTotal: number): Promise<QuestionToRemove[]> {
  console.log(`\n🎯 ${section} Drills`);
  
  const questionsToRemove: QuestionToRemove[] = [];
  const subSkills = SUB_SKILLS[section as keyof typeof SUB_SKILLS] || [];
  const isWriting = section === 'Written Expression';
  const questionsPerSubSkill = isWriting ? 6 : 30;
  const questionsPerDifficulty = isWriting ? 2 : 10;
  
  console.log(`  Target: ${targetTotal} total (${questionsPerSubSkill} per sub-skill, ${questionsPerDifficulty} per difficulty)`);
  
  for (const subSkill of subSkills) {
    console.log(`\n  📋 ${subSkill}`);
    
    // For each difficulty level
    for (const difficulty of [1, 2, 3]) {
      const { data: questions, error } = await supabase
        .from('questions')
        .select('id, created_at')
        .eq('test_type', testType)
        .eq('test_mode', 'drill')
        .eq('section_name', section)
        .eq('sub_skill', subSkill)
        .eq('difficulty', difficulty)
        .order('created_at', { ascending: true }); // Oldest first
      
      if (error || !questions) {
        console.error(`Error fetching ${subSkill} difficulty ${difficulty}:`, error);
        continue;
      }
      
      const currentCount = questions.length;
      const excessCount = currentCount - questionsPerDifficulty;
      
      console.log(`    Difficulty ${difficulty}: ${currentCount}/${questionsPerDifficulty} (${excessCount > 0 ? `${excessCount} excess` : 'OK'})`);
      
      if (excessCount > 0) {
        // Remove oldest questions
        for (let i = 0; i < excessCount && i < questions.length; i++) {
          const question = questions[i];
          questionsToRemove.push({
            id: question.id,
            test_mode: 'drill',
            section_name: section,
            sub_skill: subSkill,
            difficulty: difficulty,
            created_at: question.created_at,
            reason: `Drill balance: keeping ${questionsPerDifficulty} newest questions for ${subSkill} difficulty ${difficulty}`
          });
        }
      }
    }
  }
  
  return questionsToRemove;
}

createComprehensiveBalancedRemoval().catch(console.error);