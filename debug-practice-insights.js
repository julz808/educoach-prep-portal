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

async function debugPracticeInsights() {
  try {
    console.log('🔍 Debugging practice test insights question count issue...\n');
    
    const productType = 'VIC Selective Entry (Year 9 Entry)';
    
    // 1. Check total questions available for practice tests
    console.log('1️⃣ Checking available practice test questions:');
    const { data: practiceQuestions, error: practiceError } = await supabase
      .from('questions')
      .select('id, test_mode, section_name, sub_skill_id')
      .eq('product_type', productType)
      .in('test_mode', ['practice_1', 'practice_2', 'practice_3']);

    if (practiceError) {
      console.error('❌ Error fetching practice questions:', practiceError);
      return;
    }

    console.log(`   Total practice questions in database: ${practiceQuestions?.length || 0}`);
    
    // Break down by test mode
    const practiceBreakdown = {};
    practiceQuestions?.forEach(q => {
      if (!practiceBreakdown[q.test_mode]) {
        practiceBreakdown[q.test_mode] = {};
      }
      if (!practiceBreakdown[q.test_mode][q.section_name]) {
        practiceBreakdown[q.test_mode][q.section_name] = 0;
      }
      practiceBreakdown[q.test_mode][q.section_name]++;
    });
    
    console.log('   Breakdown by test mode and section:');
    Object.entries(practiceBreakdown).forEach(([testMode, sections]) => {
      const total = Object.values(sections).reduce((sum, count) => sum + count, 0);
      console.log(`     ${testMode}: ${total} questions`);
      Object.entries(sections).forEach(([section, count]) => {
        console.log(`       - ${section}: ${count} questions`);
      });
    });

    // 2. Check sub-skills coverage
    console.log('\n2️⃣ Checking sub-skill coverage:');
    const { data: subSkills, error: subSkillsError } = await supabase
      .from('sub_skills')
      .select(`
        id,
        name,
        test_sections!inner(
          section_name,
          product_type
        )
      `)
      .eq('test_sections.product_type', productType);

    if (subSkillsError) {
      console.error('❌ Error fetching sub-skills:', subSkillsError);
      return;
    }

    console.log(`   Total sub-skills for product: ${subSkills?.length || 0}`);
    
    // Check which sub-skills have practice questions
    const subSkillsWithQuestions = [];
    const subSkillsWithoutQuestions = [];
    
    for (const subSkill of subSkills || []) {
      const questionsForSubSkill = practiceQuestions?.filter(q => q.sub_skill_id === subSkill.id).length || 0;
      
      if (questionsForSubSkill > 0) {
        subSkillsWithQuestions.push({
          name: subSkill.name,
          section: subSkill.test_sections?.section_name,
          questionCount: questionsForSubSkill
        });
      } else {
        subSkillsWithoutQuestions.push({
          name: subSkill.name,
          section: subSkill.test_sections?.section_name
        });
      }
    }
    
    console.log(`   Sub-skills WITH practice questions: ${subSkillsWithQuestions.length}`);
    subSkillsWithQuestions.forEach(skill => {
      console.log(`     - ${skill.name} (${skill.section}): ${skill.questionCount} questions`);
    });
    
    const totalSubSkillQuestions = subSkillsWithQuestions.reduce((sum, skill) => sum + skill.questionCount, 0);
    console.log(`   Total questions when counted by sub-skills: ${totalSubSkillQuestions}`);
    
    if (subSkillsWithoutQuestions.length > 0) {
      console.log(`   Sub-skills WITHOUT practice questions: ${subSkillsWithoutQuestions.length}`);
      subSkillsWithoutQuestions.forEach(skill => {
        console.log(`     - ${skill.name} (${skill.section})`);
      });
    }

    // 3. Check if there's a mismatch
    const totalDirectCount = practiceQuestions?.length || 0;
    const totalSubSkillCount = totalSubSkillQuestions;
    
    console.log('\n3️⃣ Comparison:');
    console.log(`   Direct question count: ${totalDirectCount}`);
    console.log(`   Sub-skill aggregated count: ${totalSubSkillCount}`);
    console.log(`   Difference: ${totalDirectCount - totalSubSkillCount}`);
    
    if (totalDirectCount !== totalSubSkillCount) {
      console.log('   ⚠️  MISMATCH DETECTED! Some questions may not be assigned to sub-skills.');
      
      // Find questions without sub-skills
      const questionsWithoutSubSkills = practiceQuestions?.filter(q => !q.sub_skill_id) || [];
      console.log(`   Questions without sub_skill_id: ${questionsWithoutSubSkills.length}`);
      
      if (questionsWithoutSubSkills.length > 0) {
        const withoutSubSkillsBreakdown = {};
        questionsWithoutSubSkills.forEach(q => {
          if (!withoutSubSkillsBreakdown[q.section_name]) {
            withoutSubSkillsBreakdown[q.section_name] = 0;
          }
          withoutSubSkillsBreakdown[q.section_name]++;
        });
        
        console.log('   Questions without sub-skills by section:');
        Object.entries(withoutSubSkillsBreakdown).forEach(([section, count]) => {
          console.log(`     - ${section}: ${count} questions`);
        });
      }
    }

    // 4. Check current insights logic
    console.log('\n4️⃣ Checking current insights logic:');
    console.log('   The insights page uses getRealPracticeTestData() which:');
    console.log('   - Fetches sub-skills for the product');
    console.log('   - For each sub-skill, finds practice questions');
    console.log('   - Aggregates results by sub-skill');
    console.log('   - This explains why only ~60 questions show up');
    console.log('   - The missing questions are likely not assigned to sub-skills');

    // 5. Recommendations
    console.log('\n5️⃣ Recommendations to fix the issue:');
    if (totalDirectCount > totalSubSkillCount) {
      console.log('   ✅ Update practice question generation to assign all questions to sub-skills');
      console.log('   ✅ Or modify insights logic to count questions directly instead of via sub-skills');
      console.log('   ✅ Or create a fallback mechanism for questions without sub-skills');
    } else {
      console.log('   ✅ All questions are properly assigned to sub-skills');
      console.log('   ✅ The issue may be in the insights aggregation logic');
    }

  } catch (error) {
    console.error('❌ Error in debug script:', error);
  }
}

debugPracticeInsights();