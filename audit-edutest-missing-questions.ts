import { supabase } from './src/integrations/supabase/client.ts';

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
    'Reading Comprehension': 210, // 7 sub-skills × 30 questions
    'Verbal Reasoning': 240, // 8 sub-skills × 30 questions
    'Numerical Reasoning': 240, // 8 sub-skills × 30 questions  
    'Mathematics': 240, // 8 sub-skills × 30 questions
    'Written Expression': 30 // 5 sub-skills × 6 questions
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

interface MissingQuestion {
  test_mode: string;
  section_name: string;
  sub_skill?: string;
  difficulty?: number;
  current_count: number;
  required_count: number;
  missing_count: number;
}

async function auditEduTestMissingQuestions() {
  const testType = 'EduTest Scholarship (Year 7 Entry)';
  console.log(`🔍 AUDITING MISSING QUESTIONS FOR ${testType}`);
  console.log(`After running balanced removal scripts\n`);
  console.log('='.repeat(100));
  
  const missingQuestions: MissingQuestion[] = [];
  let totalMissing = 0;
  
  // 1. AUDIT PRACTICE TESTS
  console.log('📊 PRACTICE TESTS AUDIT');
  console.log('='.repeat(100));
  
  for (let i = 1; i <= 5; i++) {
    const testMode = `practice_${i}`;
    console.log(`\n📝 ${testMode.toUpperCase()}`);
    
    for (const [section, required] of Object.entries(EDUTEST_REQUIREMENTS.practice)) {
      const { count, error } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('test_type', testType)
        .eq('test_mode', testMode)
        .eq('section_name', section);
      
      if (error) {
        console.error(`Error checking ${testMode} ${section}:`, error);
        continue;
      }
      
      const current = count || 0;
      const missing = required - current;
      
      if (missing > 0) {
        missingQuestions.push({
          test_mode: testMode,
          section_name: section,
          current_count: current,
          required_count: required,
          missing_count: missing
        });
        totalMissing += missing;
        console.log(`  ❌ ${section}: ${current}/${required} (${missing} MISSING)`);
      } else {
        console.log(`  ✅ ${section}: ${current}/${required} (Complete)`);
      }
    }
  }
  
  // 2. AUDIT DIAGNOSTIC TEST
  console.log('\n\n📊 DIAGNOSTIC TEST AUDIT');
  console.log('='.repeat(100));
  
  for (const [section, required] of Object.entries(EDUTEST_REQUIREMENTS.diagnostic)) {
    const { count, error } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('test_type', testType)
      .eq('test_mode', 'diagnostic')
      .eq('section_name', section);
    
    if (error) {
      console.error(`Error checking diagnostic ${section}:`, error);
      continue;
    }
    
    const current = count || 0;
    const missing = required - current;
    
    if (missing > 0) {
      missingQuestions.push({
        test_mode: 'diagnostic',
        section_name: section,
        current_count: current,
        required_count: required,
        missing_count: missing
      });
      totalMissing += missing;
      console.log(`  ❌ ${section}: ${current}/${required} (${missing} MISSING)`);
    } else {
      console.log(`  ✅ ${section}: ${current}/${required} (Complete)`);
    }
  }
  
  // 3. AUDIT DRILL TESTS (detailed by sub-skill and difficulty)
  console.log('\n\n📊 DRILL TESTS AUDIT');
  console.log('='.repeat(100));
  
  for (const [section, requiredTotal] of Object.entries(EDUTEST_REQUIREMENTS.drill)) {
    console.log(`\n🎯 ${section} Drills`);
    
    const subSkills = SUB_SKILLS[section as keyof typeof SUB_SKILLS] || [];
    const isWriting = section === 'Written Expression';
    const questionsPerSubSkill = isWriting ? 6 : 30;
    const questionsPerDifficulty = isWriting ? 2 : 10;
    
    console.log(`  Target: ${requiredTotal} total (${questionsPerSubSkill} per sub-skill, ${questionsPerDifficulty} per difficulty)`);
    
    let sectionMissing = 0;
    
    for (const subSkill of subSkills) {
      console.log(`\n  📋 ${subSkill}`);
      
      // Check each difficulty level
      for (const difficulty of [1, 2, 3]) {
        const { count, error } = await supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('test_type', testType)
          .eq('test_mode', 'drill')
          .eq('section_name', section)
          .eq('sub_skill', subSkill)
          .eq('difficulty', difficulty);
        
        if (error) {
          console.error(`Error checking ${subSkill} difficulty ${difficulty}:`, error);
          continue;
        }
        
        const current = count || 0;
        const missing = questionsPerDifficulty - current;
        
        if (missing > 0) {
          missingQuestions.push({
            test_mode: 'drill',
            section_name: section,
            sub_skill: subSkill,
            difficulty: difficulty,
            current_count: current,
            required_count: questionsPerDifficulty,
            missing_count: missing
          });
          sectionMissing += missing;
          totalMissing += missing;
          console.log(`    ❌ Difficulty ${difficulty}: ${current}/${questionsPerDifficulty} (${missing} MISSING)`);
        } else {
          console.log(`    ✅ Difficulty ${difficulty}: ${current}/${questionsPerDifficulty} (Complete)`);
        }
      }
    }
    
    if (sectionMissing === 0) {
      console.log(`  ✅ ${section} drills complete - no missing questions`);
    } else {
      console.log(`  ❌ ${section} drills missing ${sectionMissing} questions total`);
    }
  }
  
  // 4. SUMMARY OF MISSING QUESTIONS
  console.log('\n\n📊 MISSING QUESTIONS SUMMARY');
  console.log('='.repeat(100));
  
  if (totalMissing === 0) {
    console.log('🎉 PERFECT! No missing questions found. EduTest question bank is complete!');
    return;
  }
  
  console.log(`❌ Total missing questions: ${totalMissing}`);
  
  // Group by test mode
  const missingByMode: Record<string, number> = {};
  missingQuestions.forEach(q => {
    missingByMode[q.test_mode] = (missingByMode[q.test_mode] || 0) + q.missing_count;
  });
  
  console.log('\n📋 Missing questions by test mode:');
  Object.entries(missingByMode).forEach(([mode, count]) => {
    console.log(`  ${mode}: ${count} missing questions`);
  });
  
  // Group by section
  const missingBySection: Record<string, number> = {};
  missingQuestions.forEach(q => {
    missingBySection[q.section_name] = (missingBySection[q.section_name] || 0) + q.missing_count;
  });
  
  console.log('\n📋 Missing questions by section:');
  Object.entries(missingBySection).forEach(([section, count]) => {
    console.log(`  ${section}: ${count} missing questions`);
  });
  
  console.log('\n📋 DETAILED MISSING QUESTIONS LIST:');
  console.log('='.repeat(100));
  
  missingQuestions.forEach(q => {
    if (q.sub_skill && q.difficulty) {
      console.log(`${q.test_mode} | ${q.section_name} | ${q.sub_skill} | Difficulty ${q.difficulty}: ${q.missing_count} missing`);
    } else {
      console.log(`${q.test_mode} | ${q.section_name}: ${q.missing_count} missing`);
    }
  });
  
  // 5. GENERATION RECOMMENDATIONS
  console.log('\n\n🔧 GENERATION RECOMMENDATIONS');
  console.log('='.repeat(100));
  
  if (missingByMode['practice_1'] || missingByMode['practice_2'] || missingByMode['practice_3'] || missingByMode['practice_4'] || missingByMode['practice_5']) {
    console.log('📝 Practice Tests: Run practice test generation for missing sections');
  }
  
  if (missingByMode['diagnostic']) {
    console.log('🔍 Diagnostic Test: Run diagnostic generation for missing sections');
  }
  
  if (missingByMode['drill']) {
    console.log('🎯 Drill Tests: Run drill generation for specific sub-skills and difficulties');
  }
  
  return missingQuestions;
}

auditEduTestMissingQuestions().catch(console.error);