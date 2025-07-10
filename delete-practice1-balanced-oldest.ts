import { supabase } from './src/integrations/supabase/client.ts';
import { writeFileSync } from 'fs';

// Practice_1 targets from curriculumData.ts
const PRACTICE_1_TARGETS = {
  'Reading Comprehension': 50,
  'Verbal Reasoning': 60,
  'Numerical Reasoning': 50,
  'Mathematics': 60,
  'Written Expression': 2
};

// Sub-skills from curriculumData.ts
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
  section_name: string;
  sub_skill: string;
  difficulty: number;
  created_at: string;
  reason: string;
}

async function createBalancedPractice1Removal() {
  const testType = 'EduTest Scholarship (Year 7 Entry)';
  const testMode = 'practice_1';
  
  console.log(`🎯 Creating Balanced Practice Test 1 Removal Script (Older Questions, Balanced Distribution)\n`);
  
  const questionsToRemove: QuestionToRemove[] = [];
  
  console.log('📊 ANALYZING PRACTICE TEST 1 WITH SUB-SKILL BALANCE');
  console.log('='.repeat(80));
  
  for (const [section, targetTotal] of Object.entries(PRACTICE_1_TARGETS)) {
    console.log(`\n🎯 ${section} Section`);
    
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
      continue;
    }
    
    const currentTotal = allQuestions.length;
    const excessTotal = currentTotal - targetTotal;
    
    console.log(`  Current: ${currentTotal} | Target: ${targetTotal} | Excess: ${excessTotal}`);
    
    if (excessTotal <= 0) {
      console.log(`  ✅ ${section} is at target - no removal needed`);
      continue;
    }
    
    // Calculate ideal distribution per sub-skill
    const subSkills = SUB_SKILLS[section as keyof typeof SUB_SKILLS] || [];
    const questionsPerSubSkill = Math.floor(targetTotal / subSkills.length);
    const remainder = targetTotal % subSkills.length;
    
    console.log(`  Sub-skills: ${subSkills.length} | Questions per sub-skill: ${questionsPerSubSkill} (+${remainder} extra)`);
    
    // Group current questions by sub-skill and difficulty
    const questionsBySubSkill: Record<string, Record<number, any[]>> = {};
    allQuestions.forEach(q => {
      if (!questionsBySubSkill[q.sub_skill]) {
        questionsBySubSkill[q.sub_skill] = { 1: [], 2: [], 3: [] };
      }
      if (q.difficulty && questionsBySubSkill[q.sub_skill][q.difficulty]) {
        questionsBySubSkill[q.sub_skill][q.difficulty].push(q);
      }
    });
    
    // Calculate target distribution
    const targetDistribution: Record<string, number> = {};
    subSkills.forEach((subSkill, index) => {
      // Give extra questions to first few sub-skills if there's a remainder
      targetDistribution[subSkill] = questionsPerSubSkill + (index < remainder ? 1 : 0);
    });
    
    // For each sub-skill, remove excess questions (oldest first)
    subSkills.forEach(subSkill => {
      const targetForSubSkill = targetDistribution[subSkill];
      const currentQuestions = Object.values(questionsBySubSkill[subSkill] || {}).flat();
      const currentCount = currentQuestions.length;
      const excessForSubSkill = currentCount - targetForSubSkill;
      
      console.log(`    ${subSkill}: ${currentCount}/${targetForSubSkill} (${excessForSubSkill > 0 ? `${excessForSubSkill} excess` : 'OK'})`);
      
      if (excessForSubSkill > 0) {
        // Sort all questions for this sub-skill by creation date (oldest first)
        const sortedQuestions = currentQuestions.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        // Remove oldest questions while trying to maintain difficulty balance
        for (let i = 0; i < excessForSubSkill && i < sortedQuestions.length; i++) {
          const question = sortedQuestions[i];
          questionsToRemove.push({
            id: question.id,
            section_name: section,
            sub_skill: question.sub_skill,
            difficulty: question.difficulty,
            created_at: question.created_at,
            reason: `Maintaining sub-skill balance: keeping ${targetForSubSkill} newest questions for ${subSkill}`
          });
        }
      }
    });
    
    // Show final target distribution
    console.log(`\n  📋 Target Distribution for ${section}:`);
    subSkills.forEach(subSkill => {
      console.log(`    ${subSkill}: ${targetDistribution[subSkill]} questions`);
    });
  }
  
  console.log(`\n\n📊 REMOVAL SUMMARY`);
  console.log('='.repeat(80));
  console.log(`Total questions to remove from practice_1: ${questionsToRemove.length}`);
  
  // Group by section for summary
  const removalBySection: Record<string, number> = {};
  questionsToRemove.forEach(q => {
    removalBySection[q.section_name] = (removalBySection[q.section_name] || 0) + 1;
  });
  
  console.log('\nRemovals by section:');
  Object.entries(removalBySection).forEach(([section, count]) => {
    const target = PRACTICE_1_TARGETS[section as keyof typeof PRACTICE_1_TARGETS];
    console.log(`  ${section}: removing ${count} oldest questions (target: ${target})`);
  });
  
  if (questionsToRemove.length === 0) {
    console.log('✅ No questions need to be removed from practice_1!');
    return;
  }
  
  // Generate SQL script
  const questionIds = questionsToRemove.map(q => q.id);
  
  let sqlScript = `-- EduTest Practice Test 1 Balanced Removal Script\n`;
  sqlScript += `-- Generated on ${new Date().toISOString()}\n`;
  sqlScript += `-- Strategy: Remove older questions while maintaining sub-skill and difficulty balance\n`;
  sqlScript += `-- Total questions to remove: ${questionsToRemove.length}\n\n`;
  
  // Add detailed breakdown
  sqlScript += `-- REMOVAL BREAKDOWN BY SECTION:\n`;
  Object.entries(removalBySection).forEach(([section, count]) => {
    const target = PRACTICE_1_TARGETS[section as keyof typeof PRACTICE_1_TARGETS];
    sqlScript += `-- ${section}: removing ${count} older questions (keeping balanced ${target})\n`;
  });
  sqlScript += `\n`;
  
  // Generate DELETE statement
  sqlScript += `-- Remove excess questions from practice_1 (maintaining balance)\n`;
  sqlScript += `DELETE FROM questions WHERE id IN (\n`;
  sqlScript += questionIds.map(id => `  '${id}'`).join(',\n');
  sqlScript += `\n);\n\n`;
  
  // Add verification queries
  sqlScript += `-- VERIFICATION QUERIES:\n`;
  sqlScript += `-- Check final counts for practice_1\n`;
  sqlScript += `SELECT section_name, COUNT(*) as question_count\n`;
  sqlScript += `FROM questions \n`;
  sqlScript += `WHERE test_type = 'EduTest Scholarship (Year 7 Entry)' AND test_mode = 'practice_1'\n`;
  sqlScript += `GROUP BY section_name\n`;
  sqlScript += `ORDER BY section_name;\n\n`;
  
  sqlScript += `-- Check sub-skill distribution\n`;
  sqlScript += `SELECT section_name, sub_skill, difficulty, COUNT(*) as count\n`;
  sqlScript += `FROM questions \n`;
  sqlScript += `WHERE test_type = 'EduTest Scholarship (Year 7 Entry)' AND test_mode = 'practice_1'\n`;
  sqlScript += `GROUP BY section_name, sub_skill, difficulty\n`;
  sqlScript += `ORDER BY section_name, sub_skill, difficulty;\n`;
  
  // Write to file
  writeFileSync('delete-practice1-balanced-oldest.sql', sqlScript);
  
  console.log('\n✅ SQL script generated: delete-practice1-balanced-oldest.sql');
  console.log('\n📋 SAMPLE REMOVAL LIST (first 10):');
  console.log('='.repeat(80));
  
  questionsToRemove.slice(0, 10).forEach(q => {
    const createdDate = new Date(q.created_at).toLocaleDateString();
    console.log(`${q.section_name} | ${q.sub_skill} | Difficulty ${q.difficulty} | Created: ${createdDate}`);
  });
  
  if (questionsToRemove.length > 10) {
    console.log(`... and ${questionsToRemove.length - 10} more questions`);
  }
  
  return questionsToRemove;
}

createBalancedPractice1Removal().catch(console.error);