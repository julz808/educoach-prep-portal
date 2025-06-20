import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAnalyticsLogic() {
  try {
    console.log('🔍 Debugging the exact analytics logic that causes 60 vs 222 question count...\n');
    
    const productType = 'VIC Selective Entry (Year 9 Entry)';
    const testNumber = 1; // Practice test 1
    const practiceTestMode = `practice_${testNumber}`;
    
    console.log(`📊 Simulating getRealPracticeTestData for ${practiceTestMode}:`);
    
    // Step 1: Get all sub-skills (same as analytics service)
    const { data: subSkillsData, error: subSkillsError } = await supabase
      .from('sub_skills')
      .select(`
        id,
        name,
        test_sections!inner(
          id,
          section_name,
          product_type
        )
      `)
      .eq('test_sections.product_type', productType);

    if (subSkillsError) {
      console.error('❌ Error fetching sub-skills:', subSkillsError);
      return;
    }

    console.log(`   Found ${subSkillsData?.length || 0} sub-skills for ${productType}`);

    // Step 2: For each sub-skill, get practice questions (same logic as analytics service)
    const subSkillPerformance = [];
    let totalQuestionsFound = 0;
    
    console.log(`\n🔍 Processing each sub-skill (this is where the issue occurs):`);
    
    for (const subSkill of subSkillsData || []) {
      // EXACT same query as analytics service line 93-98
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('id, section_name, correct_answer, test_mode')
        .eq('sub_skill_id', subSkill.id)
        .in('test_mode', [practiceTestMode, 'practice'])
        .eq('product_type', productType);

      if (questionsError) {
        console.error(`❌ Error fetching questions for sub-skill ${subSkill.name}:`, questionsError);
        continue;
      }

      const totalQuestions = questions?.length || 0;
      totalQuestionsFound += totalQuestions;
      
      if (totalQuestions > 0) {
        console.log(`     ${subSkill.name} (${subSkill.test_sections?.section_name}): ${totalQuestions} questions`);
        
        // Add to performance tracking (simplified)
        subSkillPerformance.push({
          subSkill: subSkill.name,
          sectionName: subSkill.test_sections?.section_name,
          questionsTotal: totalQuestions
        });
      }
    }
    
    console.log(`\n📊 Results from sub-skill loop:`);
    console.log(`   Total questions found across all sub-skills: ${totalQuestionsFound}`);
    console.log(`   Number of sub-skills with questions: ${subSkillPerformance.length}`);
    
    // Step 3: Show section breakdown
    const sectionStats = new Map();
    subSkillPerformance.forEach(skill => {
      const sectionName = skill.sectionName;
      if (!sectionStats.has(sectionName)) {
        sectionStats.set(sectionName, 0);
      }
      sectionStats.set(sectionName, sectionStats.get(sectionName) + skill.questionsTotal);
    });

    console.log(`\n📊 Section breakdown from sub-skill aggregation:`);
    for (const [sectionName, count] of sectionStats) {
      console.log(`     ${sectionName}: ${count} questions`);
    }
    
    // Step 4: Compare with direct question count
    console.log(`\n🔍 Comparison with direct question count:`);
    const { data: directQuestions, error: directError } = await supabase
      .from('questions')
      .select('id, section_name')
      .eq('test_mode', practiceTestMode)
      .eq('product_type', productType);

    if (!directError && directQuestions) {
      console.log(`   Direct query for ${practiceTestMode}: ${directQuestions.length} questions`);
      
      const directSectionStats = new Map();
      directQuestions.forEach(q => {
        const section = q.section_name;
        directSectionStats.set(section, (directSectionStats.get(section) || 0) + 1);
      });
      
      console.log(`   Direct section breakdown:`);
      for (const [sectionName, count] of directSectionStats) {
        console.log(`     ${sectionName}: ${count} questions`);
      }
      
      // Compare the two approaches
      console.log(`\n📊 COMPARISON:`);
      console.log(`   Sub-skill aggregation: ${totalQuestionsFound} questions`);
      console.log(`   Direct query: ${directQuestions.length} questions`);
      console.log(`   Difference: ${directQuestions.length - totalQuestionsFound}`);
      
      if (totalQuestionsFound < directQuestions.length) {
        console.log(`   ❌ ISSUE CONFIRMED: Sub-skill aggregation undercounts by ${directQuestions.length - totalQuestionsFound} questions`);
        
        // Find out why
        console.log(`\n🔍 Investigating the undercount:`);
        
        // Check if all questions have sub_skill_id
        const { data: questionsWithoutSubSkill, error: noSubSkillError } = await supabase
          .from('questions')
          .select('id, section_name')
          .eq('test_mode', practiceTestMode)
          .eq('product_type', productType)
          .is('sub_skill_id', null);
          
        if (!noSubSkillError) {
          console.log(`   Questions without sub_skill_id: ${questionsWithoutSubSkill?.length || 0}`);
        }
        
        // Check for duplicate counting
        const questionIdsSeen = new Set();
        let duplicates = 0;
        
        for (const subSkill of subSkillsData || []) {
          const { data: questions } = await supabase
            .from('questions')
            .select('id')
            .eq('sub_skill_id', subSkill.id)
            .eq('test_mode', practiceTestMode)
            .eq('product_type', productType);
            
          questions?.forEach(q => {
            if (questionIdsSeen.has(q.id)) {
              duplicates++;
            } else {
              questionIdsSeen.add(q.id);
            }
          });
        }
        
        console.log(`   Unique questions found via sub-skills: ${questionIdsSeen.size}`);
        console.log(`   Duplicate counts: ${duplicates}`);
        
        if (questionIdsSeen.size < directQuestions.length) {
          console.log(`   ❌ ROOT CAUSE: Some questions are not being found through sub-skill queries`);
          console.log(`   This explains why insights show ~60 questions instead of ~222`);
        }
      } else {
        console.log(`   ✅ Question counts match - issue may be elsewhere`);
      }
    }

  } catch (error) {
    console.error('❌ Error in debug script:', error);
  }
}

debugAnalyticsLogic();