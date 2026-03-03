import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const { data } = await supabase
  .from('questions_v2')
  .select('id, sub_skill, sub_skill_id, section_name, test_mode')
  .eq('product_type', 'Year 5 NAPLAN')
  .eq('test_mode', 'practice_1')
  .limit(20);

console.log('Sample questions from practice_1:');
data?.forEach(q => {
  console.log(`  ${q.section_name}: sub_skill="${q.sub_skill}" | sub_skill_id=${q.sub_skill_id || 'NULL'}`);
});

const withSubSkillId = data?.filter(q => q.sub_skill_id).length || 0;
const total = data?.length || 0;
console.log(`\n${withSubSkillId}/${total} questions have sub_skill_id`);

if (withSubSkillId === 0) {
  console.log('\n❌ NO QUESTIONS HAVE sub_skill_id!');
  console.log('This is why Insights shows 0/0 - it queries by sub_skill_id but none are set!');
}
