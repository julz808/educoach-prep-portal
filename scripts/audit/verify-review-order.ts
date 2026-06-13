import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Mirrors the answer-text matching used in TestTaking review (exact + trimmed + case-insensitive + prefix strip)
function matchesOption(stored: string, options: string[]): boolean {
  if (options.includes(stored)) return true;
  const s = stored.trim().toLowerCase();
  if (options.some(o => o.trim().toLowerCase() === s)) return true;
  const cleaned = stored.replace(/^[A-Z]\)\s*/, '').trim().toLowerCase();
  if (options.some(o => o.trim().toLowerCase() === cleaned)) return true;
  if (options.some((o, i) => `${String.fromCharCode(65 + i)}) ${o}`.trim().toLowerCase() === s)) return true;
  return false;
}

async function main() {
  const { data: sessions } = await supabase
    .from('user_test_sessions')
    .select('id, product_type, test_mode, section_name, answers_data, question_order')
    .like('test_mode', 'practice_%')
    .eq('status', 'completed')
    .not('question_order', 'is', null)
    .order('created_at', { ascending: false })
    .limit(25);

  let totalAnswers = 0, totalMatched = 0, sessionsAllMatched = 0;

  for (const s of sessions || []) {
    const order: string[] = Array.isArray(s.question_order) ? s.question_order : [];
    const answers = s.answers_data || {};
    if (order.length === 0 || Object.keys(answers).length === 0) continue;

    // Fetch the options for each question UUID in the saved order
    const { data: qrows } = await supabase
      .from('questions_v2')
      .select('id, answer_options')
      .in('id', order);
    const optById = new Map((qrows || []).map((q: any) => [q.id, q.answer_options || []]));

    let matched = 0, answered = 0, missingQ = 0;
    for (const [idxStr, storedRaw] of Object.entries(answers)) {
      const idx = parseInt(idxStr);
      const stored = String(storedRaw);
      answered++;
      totalAnswers++;
      const uuid = order[idx];
      const opts = uuid ? optById.get(uuid) : undefined;
      if (!opts) { missingQ++; continue; }
      const optStrs: string[] = opts.map((o: any) => (typeof o === 'string' ? o : (o?.text ?? String(o))));
      if (matchesOption(stored, optStrs)) { matched++; totalMatched++; }
    }
    if (matched === answered) sessionsAllMatched++;
    const flag = matched === answered ? '✅' : '⚠️';
    console.log(`${flag} ${s.product_type} | ${s.test_mode} | "${s.section_name}" -> ${matched}/${answered} answers map (order len=${order.length}${missingQ ? `, ${missingQ} q-uuid not found` : ''})`);
  }

  console.log(`\nSessions fully aligned: ${sessionsAllMatched}/${(sessions || []).length}`);
  console.log(`Answers matched overall: ${totalMatched}/${totalAnswers} (${totalAnswers ? Math.round(100*totalMatched/totalAnswers) : 0}%)`);
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
