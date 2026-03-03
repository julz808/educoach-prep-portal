import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const allProblematicIds = [
  // From original report
  "2ab99c4b-cdb1-4cf8-a98c-f001821012db",
  "fbc08706-a564-4061-881b-69a978b9f392",
  "194fcb61-172f-40ae-81f0-9c5133379287",
  "4e934542-441e-4aff-bf94-3228008e4fed",
  "707254ef-c227-44fb-9004-219b67fb7a0d",
  "56509e2d-9d09-4dfd-acb4-571aafe1717c",
  "e002c3b0-521f-4a86-ae7c-e64f30fe27fc",
  "cb96197c-da94-401c-872f-9ca2bd726e38",
  "2710bf36-ffde-44a9-8d88-1f9415278210",
  "b27cd301-9193-4a6e-8ce2-bf77d470f93d",
  "4609fb04-0a0b-45b9-83e9-56ee62f790b4",
  "8c75b14e-fb9b-4ed6-8308-0ef5032d02af",
  "ce80f1a6-98c9-42f3-bdc1-d084cf8b34e8",
  "d0624fdb-4aeb-4e4f-beb9-da56284981c0",
  "fb4d16b4-a22d-4cad-beaf-e500519a5908",
  "e17fcb85-f34c-44bd-8b70-162c80effcd4",
  "0a77c2bf-ca4c-460a-aa0c-9af5d7f63fcf",
  "d72b71b2-58c5-422a-8a90-22d7cde64fd6",
  "ebda76c4-e86e-4a35-9417-6d8441dd1f44",
  "45a1c0af-626b-4d4c-b36e-62751581182b",
  "b763f582-2294-4920-b738-41795a9fd9a4",
  "780d1277-7b9a-41bd-b829-2fe83c413f6f",
  "53cd8f70-c631-423d-be5e-0e805707de06",
  "060134ea-cc05-4050-acb8-af744c2962e0",
  "83062405-933a-40de-aa9d-31bb7ff651ab",
  "6f081c21-ac6d-4d2d-a655-eef5abb0c114",
  "c004abdb-c6df-4f6e-83f5-28850871b7e8",
  "c3f2a957-c178-471d-bed2-b2c2f2858d6c",
  "c3d7f5ea-c02b-42ba-b816-806a4f558212",
  "95b73e5c-5cc9-4ed9-b98e-4f7c1f7d26e6",
  "44dc8b02-04c4-4f3e-817f-6303ae03dba5",
  "01a3aec1-20f3-4c8c-9475-10c654c79340",
  "9f9b5894-2f6a-41e3-b915-932168081f57",
  "021fe3e3-1379-4d20-8505-c1b43d89ecf6",
  "d814b0dc-90fd-41dc-ba9c-bfa400190e23",
  "283fea6c-8458-4848-b308-165a0c7f4adf",
  "6acd70f0-59ae-4c21-b8ab-33bb07e01ce1",
  "48c1a39a-b75f-4875-b38e-d6b4791ca33e",
  "6db49112-92ba-4ade-91cd-4aebf8c4a9f8",
  "ae321a4d-2b5e-4aaf-9ce6-c229723da83b",
  "f9feb86f-8a0a-4e53-8523-76a6f9c29b3c",
  "fcbfa39d-c352-4f3a-90be-fca5e51250bf",
  "c3f8c9ec-6ee5-4d98-8cd6-43d15f2463ef",
  "1c013a8f-ecbc-4b74-acab-0b05cdc8b6b0"
];

const incompleteQuestions = [
  "48c1a39a-b75f-4875-b38e-d6b4791ca33e",
  "6db49112-92ba-4ade-91cd-4aebf8c4a9f8",
  "ae321a4d-2b5e-4aaf-9ce6-c229723da83b",
  "f9feb86f-8a0a-4e53-8523-76a6f9c29b3c",
  "fcbfa39d-c352-4f3a-90be-fca5e51250bf",
  "c3f8c9ec-6ee5-4d98-8cd6-43d15f2463ef",
  "1c013a8f-ecbc-4b74-acab-0b05cdc8b6b0"
];

const writingSections = [
  'writing',
  'written expression',
  'written response',
  'creative writing',
  'persuasive writing',
  'narrative writing',
];

async function verifyAllFixes() {
  console.log('=== VERIFICATION OF ALL FIXES ===\n');
  console.log(`Total problematic questions identified: ${allProblematicIds.length}`);
  console.log(`Expected to fix: ${allProblematicIds.length - incompleteQuestions.length}`);
  console.log(`Incomplete questions (need regeneration): ${incompleteQuestions.length}\n`);

  let fixed = 0;
  let stillBroken = 0;
  let unexpected = 0;

  const brokenDetails: any[] = [];

  for (const id of allProblematicIds) {
    const { data, error } = await supabase
      .from('questions_v2')
      .select('id, question_text, answer_options, section_name, correct_answer')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching ${id}:`, error);
      continue;
    }

    const isWritingSection = writingSections.some(keyword =>
      data.section_name?.toLowerCase().includes(keyword)
    );

    const hasOptions = data.answer_options &&
      ((Array.isArray(data.answer_options) && data.answer_options.length > 0) ||
       (typeof data.answer_options === 'object' && Object.keys(data.answer_options).length > 0));

    // Check for embedded options
    const embeddedPattern = /[A-E]\)\s*\w+.*?[B-E]\)\s*\w+/i;
    const hasEmbedded = embeddedPattern.test(data.question_text);

    const isIncomplete = incompleteQuestions.includes(id);

    if (isIncomplete) {
      // These we expect to still be broken
      if (!hasOptions) {
        stillBroken++;
      } else {
        unexpected++;
        console.log(`⚠️  Unexpected fix for ${id} - was marked as incomplete but now has options`);
      }
    } else {
      // These we expect to be fixed
      if (hasOptions && !hasEmbedded) {
        fixed++;
      } else {
        unexpected++;
        brokenDetails.push({
          id,
          section: data.section_name,
          hasOptions,
          hasEmbedded,
          questionText: data.question_text.substring(0, 150)
        });
      }
    }
  }

  console.log('\n=== VERIFICATION RESULTS ===');
  console.log(`✅ Successfully fixed: ${fixed}/${allProblematicIds.length - incompleteQuestions.length}`);
  console.log(`⚠️  Still incomplete (expected): ${stillBroken}/${incompleteQuestions.length}`);
  console.log(`❌ Unexpected issues: ${unexpected}`);

  if (brokenDetails.length > 0) {
    console.log('\n=== UNEXPECTED ISSUES ===');
    brokenDetails.forEach((q, idx) => {
      console.log(`\n${idx + 1}. ID: ${q.id}`);
      console.log(`   Section: ${q.section}`);
      console.log(`   Has Options: ${q.hasOptions}`);
      console.log(`   Has Embedded: ${q.hasEmbedded}`);
      console.log(`   Text: ${q.questionText}...`);
    });
  }

  // Create final summary report
  const summary = {
    totalProblematic: allProblematicIds.length,
    fixed: fixed,
    incompleteNeedRegeneration: incompleteQuestions,
    status: fixed === (allProblematicIds.length - incompleteQuestions.length) ? 'SUCCESS' : 'PARTIAL',
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync(
    '/Users/julz88/Documents/educoach-prep-portal-2/question-fixes-summary.json',
    JSON.stringify(summary, null, 2)
  );

  console.log('\n✅ Summary saved to question-fixes-summary.json');

  // Save list of incomplete questions for deletion/regeneration
  if (incompleteQuestions.length > 0) {
    const incompleteReport: any[] = [];

    for (const id of incompleteQuestions) {
      const { data } = await supabase
        .from('questions_v2')
        .select('*')
        .eq('id', id)
        .single();

      if (data) {
        incompleteReport.push(data);
      }
    }

    fs.writeFileSync(
      '/Users/julz88/Documents/educoach-prep-portal-2/incomplete-questions-for-regeneration.json',
      JSON.stringify(incompleteReport, null, 2)
    );

    console.log('✅ Incomplete questions list saved to incomplete-questions-for-regeneration.json');
  }
}

verifyAllFixes();
