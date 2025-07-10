import { supabase } from './src/integrations/supabase/client.ts';

// Practice_1 targets and sub-skills
const PRACTICE_1_TARGETS = {
  'Reading Comprehension': 50,
  'Verbal Reasoning': 60,
  'Numerical Reasoning': 50,
  'Mathematics': 60,
  'Written Expression': 2
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

async function previewFinalDistribution() {
  const testType = 'EduTest Scholarship (Year 7 Entry)';
  const testMode = 'practice_1';
  
  console.log(`📊 PREDICTED FINAL DISTRIBUTION FOR PRACTICE TEST 1`);
  console.log(`After running the balanced removal script\n`);
  console.log('='.repeat(90));
  
  for (const [section, targetTotal] of Object.entries(PRACTICE_1_TARGETS)) {
    console.log(`\n🎯 ${section.toUpperCase()} SECTION (Target: ${targetTotal} questions)`);
    console.log('='.repeat(90));
    
    // Get current questions
    const { data: allQuestions, error } = await supabase
      .from('questions')
      .select('id, sub_skill, difficulty, created_at')
      .eq('test_type', testType)
      .eq('test_mode', testMode)
      .eq('section_name', section)
      .order('created_at', { ascending: false }); // Newest first (what we'll keep)
    
    if (error || !allQuestions) {
      console.error(`Error fetching ${section} questions:`, error);
      continue;
    }
    
    const subSkills = SUB_SKILLS[section as keyof typeof SUB_SKILLS] || [];
    
    if (allQuestions.length === targetTotal) {
      console.log(`✅ Already at target - no changes needed`);
      
      // Show current distribution
      const distribution: Record<string, Record<number, number>> = {};
      allQuestions.forEach(q => {
        if (!distribution[q.sub_skill]) distribution[q.sub_skill] = { 1: 0, 2: 0, 3: 0 };
        if (q.difficulty) distribution[q.sub_skill][q.difficulty]++;
      });
      
      subSkills.forEach(subSkill => {
        const counts = distribution[subSkill] || { 1: 0, 2: 0, 3: 0 };
        const total = counts[1] + counts[2] + counts[3];
        console.log(`  ${subSkill}: ${total} total (Easy: ${counts[1]}, Medium: ${counts[2]}, Hard: ${counts[3]})`);
      });
      continue;
    }
    
    // Calculate target distribution
    const questionsPerSubSkill = Math.floor(targetTotal / subSkills.length);
    const remainder = targetTotal % subSkills.length;
    
    console.log(`Sub-skills: ${subSkills.length} | Base per sub-skill: ${questionsPerSubSkill} | Extra: ${remainder}`);
    console.log(`Distribution: ${remainder} sub-skills get ${questionsPerSubSkill + 1}, ${subSkills.length - remainder} sub-skills get ${questionsPerSubSkill}\n`);
    
    // Group questions by sub-skill
    const questionsBySubSkill: Record<string, any[]> = {};
    allQuestions.forEach(q => {
      if (!questionsBySubSkill[q.sub_skill]) questionsBySubSkill[q.sub_skill] = [];
      questionsBySubSkill[q.sub_skill].push(q);
    });
    
    // Calculate what will remain after removal (keeping newest)
    let totalFinalQuestions = 0;
    
    subSkills.forEach((subSkill, index) => {
      const targetForSubSkill = questionsPerSubSkill + (index < remainder ? 1 : 0);
      const currentQuestions = questionsBySubSkill[subSkill] || [];
      const currentCount = currentQuestions.length;
      
      // Sort by creation date (newest first) and take the target amount
      const questionsToKeep = currentQuestions
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, targetForSubSkill);
      
      // Analyze difficulty distribution of questions we'll keep
      const difficultyDistribution = { 1: 0, 2: 0, 3: 0 };
      questionsToKeep.forEach(q => {
        if (q.difficulty) difficultyDistribution[q.difficulty]++;
      });
      
      const removing = currentCount - targetForSubSkill;
      totalFinalQuestions += targetForSubSkill;
      
      console.log(`  ${subSkill}:`);
      console.log(`    Current: ${currentCount} | Target: ${targetForSubSkill} | Removing: ${removing} oldest`);
      console.log(`    Final difficulty distribution: Easy: ${difficultyDistribution[1]}, Medium: ${difficultyDistribution[2]}, Hard: ${difficultyDistribution[3]}`);
      
      if (questionsToKeep.length > 0) {
        const oldestKept = new Date(Math.min(...questionsToKeep.map(q => new Date(q.created_at).getTime())));
        const newestKept = new Date(Math.max(...questionsToKeep.map(q => new Date(q.created_at).getTime())));
        console.log(`    Keeping questions from: ${oldestKept.toLocaleDateString()} to ${newestKept.toLocaleDateString()}`);
      }
      console.log('');
    });
    
    console.log(`📋 FINAL SECTION SUMMARY:`);
    console.log(`  Total questions after removal: ${totalFinalQuestions}/${targetTotal}`);
    console.log(`  Sub-skills covered: ${subSkills.length}`);
    
    // Calculate overall difficulty distribution
    let totalEasy = 0, totalMedium = 0, totalHard = 0;
    subSkills.forEach((subSkill, index) => {
      const targetForSubSkill = questionsPerSubSkill + (index < remainder ? 1 : 0);
      const currentQuestions = questionsBySubSkill[subSkill] || [];
      const questionsToKeep = currentQuestions
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, targetForSubSkill);
      
      questionsToKeep.forEach(q => {
        if (q.difficulty === 1) totalEasy++;
        else if (q.difficulty === 2) totalMedium++;
        else if (q.difficulty === 3) totalHard++;
      });
    });
    
    console.log(`  Overall difficulty distribution: Easy: ${totalEasy}, Medium: ${totalMedium}, Hard: ${totalHard}`);
  }
  
  console.log('\n\n🎯 SUMMARY OF ALL SECTIONS AFTER REMOVAL:');
  console.log('='.repeat(90));
  
  let grandTotal = 0;
  for (const [section, target] of Object.entries(PRACTICE_1_TARGETS)) {
    grandTotal += target;
    console.log(`${section}: ${target} questions`);
  }
  console.log(`\nTotal Practice Test 1: ${grandTotal} questions`);
}

previewFinalDistribution().catch(console.error);