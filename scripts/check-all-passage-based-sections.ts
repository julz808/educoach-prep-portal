import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkAllPassageBasedSections() {
  console.log('Checking all passage-based questions for duplicate issues...\n');

  const { data: questions, error } = await supabase
    .from('questions_v2')
    .select('test_type, section_name, id, question_text, passage_id')
    .not('passage_id', 'is', null);

  if (error) {
    console.error('Error:', error);
    return;
  }

  const sections = new Map<string, { total: number; long: number; withTitle: number; withRead: number }>();

  for (const q of questions || []) {
    const key = `${q.test_type} - ${q.section_name}`;
    
    if (!sections.has(key)) {
      sections.set(key, { total: 0, long: 0, withTitle: 0, withRead: 0 });
    }
    
    const stats = sections.get(key)!;
    stats.total++;
    
    if (q.question_text.length > 500) stats.long++;
    if (q.question_text.includes('Title:')) stats.withTitle++;
    if (q.question_text.includes('Read the following')) stats.withRead++;
  }

  console.log('=== PASSAGE-BASED SECTIONS ANALYSIS ===\n');
  
  for (const [section, stats] of Array.from(sections.entries()).sort()) {
    const hasPotentialIssue = stats.long > 0 || stats.withTitle > 0 || stats.withRead > 0;
    
    if (hasPotentialIssue) {
      console.log(`\n${section}:`);
      console.log(`  Total questions: ${stats.total}`);
      console.log(`  Long questions (>500 chars): ${stats.long}`);
      console.log(`  With "Title:": ${stats.withTitle}`);
      console.log(`  With "Read the following": ${stats.withRead}`);
      
      if (stats.long > stats.total * 0.1) {
        console.log(`  ⚠️  High percentage of long questions - may need review`);
      }
    }
  }
}

checkAllPassageBasedSections();
