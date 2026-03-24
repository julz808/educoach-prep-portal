/**
 * Show flagged negative keywords
 */

import { db } from '../shared/database';

async function main() {
  const searchTerms = await db.getSearchTerms();

  const flagged = searchTerms.filter((term: any) => term.flagged_as_negative);

  console.log(`\n🚨 Flagged Negative Keywords (${flagged.length} total)\n`);
  console.log('─'.repeat(80));

  flagged
    .sort((a: any, b: any) => b.clicks - a.clicks)
    .slice(0, 30)
    .forEach((term: any) => {
      const costAud = (term.cost_micros / 1_000_000).toFixed(2);
      console.log(`\n📍 "${term.search_term}"`);
      console.log(`   Reason: ${term.flagged_reason}`);
      console.log(`   Stats: ${term.clicks} clicks, ${term.conversions} conversions, $${costAud} spent`);
    });

  console.log('\n' + '─'.repeat(80));
  console.log(`\n💡 These are search terms you should consider adding as negative keywords`);
  console.log(`   They're either wasteful or getting clicks without conversions.\n`);
}

main();
