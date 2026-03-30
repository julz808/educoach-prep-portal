import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// IDs of the 30 questions already reviewed
const reviewedIds = [
  '2b9ab0c0-01e9-4852-baa1-418c03c70180', '96de6ddc-9e1a-4ba3-a7fb-63140987e552',
  '92e86ad2-0418-46f8-9420-4bdbf5a55c20', '75328ee0-8046-46a2-9b08-75a589899de1',
  'cc50b408-fbb4-43c7-8363-f8db2d05f536', '509240e9-aad0-411a-b9eb-b895800f7db7',
  '08993ec8-2ef4-4b8e-97ad-458e713aa73f', '674f8f8a-177c-4422-9705-f87cca391e34',
  'b6938786-8a83-455e-9e71-575a5491eece', 'd26dfd18-7ef3-47e6-9fd8-cde218c3b21e',
  '28d08ce6-062a-48b8-84bf-459e0d118fa8', '67a9d301-82f4-41d6-bf7d-0d92b795cd46',
  'c7d18051-9142-45e9-b614-d976c8f16963', 'a3ba09be-49ce-4fc1-89e5-81cfcb15fa48',
  '696bc8bd-13f0-4723-bafd-f30196b32cbc', 'fc29a2d6-d701-4c25-b351-fcc65b130901',
  '7466374a-f591-4e90-a087-209ddf93a088', '8f886027-39eb-42dc-a145-b0b0d0f3c7d4',
  '96ddb13c-432a-4b5b-8f61-9b3d7d732c7d', '518f2370-f938-4ae1-91d8-446f7b7bca9f',
  '329630ed-74ed-42b8-a0b4-31920473d7e2', '0daef4cb-42b6-4f82-9151-77d0e111c147',
  'f68e2581-62a9-4e4e-be39-c3c2b951696b', '455913c9-53f8-41be-b886-0087e334b0f6',
  'b7fc9827-aa39-418e-9e55-808eb4fb3824', '3edf6568-e19a-48ef-9a0f-f37a11692692',
  '59855f8a-ceca-4d85-9d8b-4d66f9ec2286', '6986f8be-155a-4a37-a28e-2961c830eeda',
  '4ac03ca0-c69e-4f77-a9f6-ae5820dfd595', 'c31551fc-b832-40ed-8ac4-ad2557c72abf'
];

async function main() {
  const { data } = await supabase
    .from('questions_v2')
    .select('*')
    .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
    .eq('sub_skill', 'Fractions, Decimals & Percentages')
    .not('id', 'in', `(${reviewedIds.join(',')})`)
    .order('test_mode')
    .order('question_number');

  console.log(`\nFRACTIONS - REMAINING ${data?.length} Questions\n`);
  console.log('='.repeat(80));

  data?.forEach((q: any, idx: number) => {
    console.log(`Q${idx + 31}: ${q.test_mode} Q${q.question_number || 'N/A'}`);
    console.log('='.repeat(80));
    console.log(`Question: ${q.question_text}`);
    if (q.options && Array.isArray(q.options)) {
      console.log(`Options: ${q.options.join(', ')}`);
    } else {
      console.log(`Options: [No MC options]`);
    }
    console.log(`Correct: ${q.correct_answer}`);
    console.log(`ID: ${q.id}`);
    console.log();
  });
}

main();
