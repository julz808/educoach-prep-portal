import { createClient } from '@supabase/supabase-js';
import { generateV2Question } from '../src/engines/questionGeneration/v2/generator.js';

(async () => {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log('🎯 Testing harder question generation for Number Grids & Matrices...\n');

  try {
    const result = await generateV2Question({
      testType: 'VIC Selective Entry (Year 9 Entry)',
      section: 'General Ability - Quantitative',
      subSkill: 'Number Grids & Matrices',
      difficulty: 2,
      testMode: 'practice_1'
    });

    if (result.success && result.question) {
      console.log('✅ Question generated successfully!\n');
      console.log('Question:');
      console.log(result.question.question_text);
      console.log('\nAnswer Options:', result.question.answer_options);
      console.log('Correct Answer:', result.question.correct_answer);
      console.log('\nSolution:');
      console.log(result.question.solution);
      console.log('\n📊 Quality Score:', result.question.quality_score);
    } else {
      console.log('❌ Generation failed:', result.error);
    }
  } catch (error) {
    console.error('Error:', error);
  }
})();
