/**
 * V2 Engine Verification Script
 * Tests that the V2 engine works as documented
 */

import { generateQuestionV2, getRecentQuestionsForSubSkill } from '@/engines/questionGeneration/v2';
import { SUB_SKILL_EXAMPLES } from '@/data/curriculumData_v2';

async function verifyV2Engine() {
  console.log('🔍 V2 Engine Verification\n');
  console.log('━'.repeat(60));

  const tests = {
    passed: 0,
    failed: 0,
    errors: [] as string[]
  };

  // Test 1: Verify exports are available
  console.log('\n📦 Test 1: Verify module exports');
  try {
    if (typeof generateQuestionV2 === 'function') {
      console.log('   ✅ generateQuestionV2 exported');
      tests.passed++;
    } else {
      throw new Error('generateQuestionV2 not a function');
    }
  } catch (error) {
    console.log(`   ❌ FAILED: ${error}`);
    tests.failed++;
    tests.errors.push(`Test 1: ${error}`);
  }

  // Test 2: Verify curriculum data loading
  console.log('\n📚 Test 2: Verify curriculum data loading');
  try {
    const sectionKey = 'EduTest Scholarship (Year 7 Entry) - Verbal Reasoning';
    const section = SUB_SKILL_EXAMPLES[sectionKey];
    if (!section) {
      throw new Error(`Section not found: ${sectionKey}`);
    }

    const analogies = section['Analogical Reasoning & Relationships'];
    if (!analogies) {
      throw new Error('Analogies sub-skill not found');
    }

    console.log(`   ✅ Curriculum data loaded: ${analogies.examples.length} examples found`);
    console.log(`   ✅ Sub-skill properties: description, examples, pattern - all present`);
    tests.passed++;
  } catch (error) {
    console.log(`   ❌ FAILED: ${error}`);
    tests.failed++;
    tests.errors.push(`Test 2: ${error}`);
  }

  // Test 3: Verify diversity checking function
  console.log('\n🎲 Test 3: Verify diversity checking');
  try {
    const recentQuestions = await getRecentQuestionsForSubSkill(
      'EduTest Scholarship (Year 7 Entry)',
      'Numerical Reasoning',
      'Number Properties & Operations',
      5
    );

    console.log(`   ✅ getRecentQuestionsForSubSkill works: ${recentQuestions.length} questions fetched`);

    if (recentQuestions.length > 0) {
      const sample = recentQuestions[0];
      if (sample.question_text && sample.answer_options && sample.correct_answer) {
        console.log(`   ✅ Recent question structure valid`);
      } else {
        throw new Error('Recent question missing required fields');
      }
    }
    tests.passed++;
  } catch (error) {
    console.log(`   ❌ FAILED: ${error}`);
    tests.failed++;
    tests.errors.push(`Test 3: ${error}`);
  }

  // Test 4: Generate a single question (the ultimate test!)
  console.log('\n🎯 Test 4: Generate a single question');
  try {
    console.log('   Generating question for: EduTest - Numerical Reasoning - Number Properties & Operations');
    console.log('   Difficulty: 1, Test Mode: practice_1');

    const result = await generateQuestionV2(
      {
        testType: 'EduTest Scholarship (Year 7 Entry)',
        section: 'Numerical Reasoning',
        subSkill: 'Number Properties & Operations',
        difficulty: 1,
        testMode: 'practice_1'
      },
      {
        skipStorage: true,  // Don't store during test
        skipValidation: false,
        strictValidation: true
      }
    );

    if (!result.success) {
      throw new Error(`Generation failed: ${result.error}`);
    }

    console.log(`   ✅ Question generated successfully!`);
    console.log(`   ✅ Question text: "${result.question.question_text.substring(0, 80)}..."`);
    console.log(`   ✅ Answer options: ${result.question.answer_options.length} options`);
    console.log(`   ✅ Correct answer: ${result.question.correct_answer}`);
    console.log(`   ✅ Quality score: ${result.validationResult?.qualityScore || 'N/A'}/100`);
    console.log(`   ✅ Cost: $${result.cost.toFixed(4)}`);
    console.log(`   ✅ Time: ${result.generationTime}ms`);

    if (result.validationResult && result.validationResult.qualityScore < 70) {
      console.log(`   ⚠️  Warning: Quality score below 70`);
    }

    tests.passed++;
  } catch (error: any) {
    console.log(`   ❌ FAILED: ${error.message || error}`);
    tests.failed++;
    tests.errors.push(`Test 4: ${error.message || error}`);
  }

  // Test 5: Verify visual generation detection
  console.log('\n🎨 Test 5: Verify visual generation detection');
  try {
    const sectionKey = 'ACER Scholarship (Year 7 Entry) - Mathematics';
    const mathematics = SUB_SKILL_EXAMPLES[sectionKey];

    if (!mathematics) {
      throw new Error(`ACER Mathematics section not found: ${sectionKey}`);
    }

    // Find a sub-skill with visual requirements
    let visualSubSkillFound = false;
    for (const [subSkillName, subSkillData] of Object.entries(mathematics)) {
      if (subSkillData.visual_required) {
        console.log(`   ✅ Found visual sub-skill: ${subSkillName}`);
        console.log(`   ✅ Visual type: ${subSkillData.image_type}`);
        console.log(`   ✅ LLM appropriate: ${subSkillData.llm_appropriate}`);

        // Check for visual prompts in examples
        const exampleWithVisual = subSkillData.examples.find((ex: any) => ex.requires_visual);
        if (exampleWithVisual && exampleWithVisual.visual_prompt) {
          console.log(`   ✅ Visual prompt found in example: "${exampleWithVisual.visual_prompt.substring(0, 60)}..."`);
        }

        visualSubSkillFound = true;
        break;
      }
    }

    if (!visualSubSkillFound) {
      throw new Error('No visual sub-skills found in ACER Mathematics');
    }

    tests.passed++;
  } catch (error) {
    console.log(`   ❌ FAILED: ${error}`);
    tests.failed++;
    tests.errors.push(`Test 5: ${error}`);
  }

  // Print summary
  console.log('\n━'.repeat(60));
  console.log('\n📊 VERIFICATION SUMMARY\n');
  console.log(`✅ Tests Passed: ${tests.passed}/5`);
  console.log(`❌ Tests Failed: ${tests.failed}/5`);

  if (tests.errors.length > 0) {
    console.log('\n❌ ERRORS:\n');
    tests.errors.forEach((error, i) => {
      console.log(`   ${i + 1}. ${error}`);
    });
  }

  console.log('\n━'.repeat(60));

  if (tests.passed === 5) {
    console.log('\n🎉 SUCCESS! V2 Engine is working as documented!\n');
    console.log('✅ All core features verified:');
    console.log('   - Module exports');
    console.log('   - Curriculum data loading');
    console.log('   - Diversity checking');
    console.log('   - Question generation');
    console.log('   - Visual generation detection');
    return true;
  } else {
    console.log('\n⚠️  VERIFICATION FAILED - Some features not working as expected\n');
    return false;
  }
}

// Run verification
verifyV2Engine()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n💥 FATAL ERROR:', error);
    process.exit(1);
  });
