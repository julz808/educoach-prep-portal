/**
 * Weekly Google Ads AI Agent (Optimized Architecture)
 *
 * Runs every Monday at 6 AM AEST
 *
 * ARCHITECTURE:
 * 1. Deterministic data collection → Supabase
 * 2. AI analysis reads from Supabase (no Google Ads API calls)
 *
 * This separation allows:
 * - Re-running AI analysis without re-fetching data
 * - JSON backups for debugging
 * - Data validation before AI sees it
 * - Independent testing of each component
 */

import { WeeklySnapshotCollector } from './collect-weekly-snapshots';
import { AIAnalyzer } from './analyze-with-ai';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('🤖 Google Ads Weekly AI Agent');
  console.log('═══════════════════════════════════════════\n');

  try {
    // Step 1: Collect weekly snapshots (deterministic)
    console.log('━━━ STEP 1: DATA COLLECTION (Deterministic) ━━━\n');
    const collector = new WeeklySnapshotCollector();
    await collector.collect();

    // Step 2: AI Analysis (reads from Supabase only)
    console.log('\n━━━ STEP 2: AI ANALYSIS (Claude API) ━━━\n');
    const analyzer = new AIAnalyzer();
    await analyzer.analyze();

    // Final summary
    console.log('\n═══════════════════════════════════════════');
    console.log('✅ Weekly Agent Complete!');
    console.log('═══════════════════════════════════════════\n');

    console.log('What happened:');
    console.log('  ✓ Scraped all Google Ads data for last week');
    console.log('  ✓ Validated data quality');
    console.log('  ✓ Saved snapshots to Supabase');
    console.log('  ✓ Exported JSON backup');
    console.log('  ✓ AI analyzed current + prior week');
    console.log('  ✓ Calculated attribution for last week\'s actions');
    console.log('  ✓ Sent recommendations to Telegram');
    console.log('  ✓ Saved recommendations for approval\n');

    console.log('Next steps:');
    console.log('  1. Check Telegram for recommendations');
    console.log('  2. Approve/reject each recommendation');
    console.log('  3. Agent will execute approved actions');
    console.log('  4. Next Monday: See attribution results\n');
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the agent
main();
