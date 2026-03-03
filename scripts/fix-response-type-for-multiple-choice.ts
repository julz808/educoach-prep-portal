import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const questionIds = [
  "ce80f1a6-98c9-42f3-bdc1-d084cf8b34e8",
  "fbc08706-a564-4061-881b-69a978b9f392",
  "e17fcb85-f34c-44bd-8b70-162c80effcd4",
  "d72b71b2-58c5-422a-8a90-22d7cde64fd6",
  "780d1277-7b9a-41bd-b829-2fe83c413f6f",
  "060134ea-cc05-4050-acb8-af744c2962e0",
  "44dc8b02-04c4-4f3e-817f-6303ae03dba5",
  "01a3aec1-20f3-4c8c-9475-10c654c79340",
  "d814b0dc-90fd-41dc-ba9c-bfa400190e23",
  "6acd70f0-59ae-4c21-b8ab-33bb07e01ce1",
  "194fcb61-172f-40ae-81f0-9c5133379287",
  "e002c3b0-521f-4a86-ae7c-e64f30fe27fc",
  "2710bf36-ffde-44a9-8d88-1f9415278210",
  "8c75b14e-fb9b-4ed6-8308-0ef5032d02af",
  "d0624fdb-4aeb-4e4f-beb9-da56284981c0",
  "0a77c2bf-ca4c-460a-aa0c-9af5d7f63fcf",
  "ebda76c4-e86e-4a35-9417-6d8441dd1f44",
  "45a1c0af-626b-4d4c-b36e-62751581182b",
  "b763f582-2294-4920-b738-41795a9fd9a4",
  "53cd8f70-c631-423d-be5e-0e805707de06",
  "83062405-933a-40de-aa9d-31bb7ff651ab",
  "6f081c21-ac6d-4d2d-a655-eef5abb0c114",
  "c004abdb-c6df-4f6e-83f5-28850871b7e8",
  "c3f2a957-c178-471d-bed2-b2c2f2858d6c",
  "c3d7f5ea-c02b-42ba-b816-806a4f558212",
  "95b73e5c-5cc9-4ed9-b98e-4f7c1f7d26e6",
  "9f9b5894-2f6a-41e3-b915-932168081f57",
  "021fe3e3-1379-4d20-8505-c1b43d89ecf6",
  "283fea6c-8458-4848-b308-165a0c7f4adf",
  "b27cd301-9193-4a6e-8ce2-bf77d470f93d",
  "4609fb04-0a0b-45b9-83e9-56ee62f790b4",
  "fb4d16b4-a22d-4cad-beaf-e500519a5908",
  "cb96197c-da94-401c-872f-9ca2bd726e38"
];

async function fixResponseType() {
  console.log('=== FIXING RESPONSE_TYPE FOR 33 MULTIPLE CHOICE QUESTIONS ===\n');
  console.log('These questions have answer_options but are incorrectly marked as extended_response\n');

  let successCount = 0;
  let errorCount = 0;

  for (const id of questionIds) {
    // Fetch current state
    const { data: question } = await supabase
      .from('questions_v2')
      .select('test_type, section_name, sub_skill, response_type, answer_options')
      .eq('id', id)
      .single();

    if (question) {
      console.log(`Updating: ${question.test_type} - ${question.section_name} - ${question.sub_skill}`);
      console.log(`  Current: response_type="${question.response_type}", has ${Array.isArray(question.answer_options) ? question.answer_options.length : 0} options`);
    }

    // Update response_type to multiple_choice
    const { error } = await supabase
      .from('questions_v2')
      .update({ response_type: 'multiple_choice' })
      .eq('id', id);

    if (error) {
      console.error(`  ❌ Error: ${error.message}\n`);
      errorCount++;
    } else {
      console.log(`  ✅ Updated to: response_type="multiple_choice"\n`);
      successCount++;
    }
  }

  console.log('\n=== UPDATE SUMMARY ===');
  console.log(`✅ Successfully updated: ${successCount}/${questionIds.length}`);
  console.log(`❌ Failed to update: ${errorCount}/${questionIds.length}`);

  if (successCount === questionIds.length) {
    console.log('\n✅ SUCCESS: All 33 questions now have correct response_type="multiple_choice"');
  }
}

fixResponseType();
