import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

async function checkPassageVariety() {
  console.log('\n📊 Analyzing passage variety for Year 5 NAPLAN Reading drills:\n');

  const { data: passages } = await supabase
    .from('passages_v2')
    .select('title, content, passage_type')
    .eq('test_type', 'Year 5 NAPLAN')
    .eq('section_name', 'Reading')
    .order('created_at', { ascending: false })
    .limit(20);

  if (!passages) return;

  const analyzeContentType = (content: string) => {
    const lower = content.toLowerCase();

    // Narrative indicators
    if (lower.match(/once upon|story|character|plot|adventure|journey|protagonist/i)) {
      return 'narrative';
    }

    // Persuasive indicators
    if (lower.match(/should|must|believe|convince|argue|opinion|important to|we need to/i)) {
      return 'persuasive';
    }

    // Informational (default - explains, describes, informs)
    return 'informational';
  };

  console.log('Recent passages:\n');
  const types: Record<string, number> = {};

  passages.forEach((p, i) => {
    const contentType = analyzeContentType(p.content);
    types[contentType] = (types[contentType] || 0) + 1;

    console.log((i + 1) + '. "' + p.title + '"');
    console.log('   Type: ' + contentType);
    console.log('   Preview: ' + p.content.substring(0, 100) + '...');
    console.log();
  });

  console.log('\n📊 VARIETY BREAKDOWN:\n');
  Object.entries(types).forEach(([type, count]) => {
    const pct = ((count / passages.length) * 100).toFixed(1);
    console.log('   ' + type + ': ' + count + '/' + passages.length + ' (' + pct + '%)');
  });
}

checkPassageVariety();
