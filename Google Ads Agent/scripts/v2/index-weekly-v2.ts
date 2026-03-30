/**
 * Google Ads Weekly Agent V2
 *
 * Runs every Monday at 6 AM AEST
 *
 * PHILOSOPHY:
 * - STRATEGIC decisions (budget allocation) = automated from weekly_budget_allocation table
 * - TACTICAL decisions (keywords, ads, bids) = AI recommends → human approves
 *
 * WORKFLOW:
 * 1. Collect performance data (deterministic)
 * 2. Auto-execute budget changes (NO approval needed)
 * 3. AI analyzes for tactical opportunities
 * 4. Send Telegram report (budget execution + tactical recommendations)
 */

import { BudgetExecutor } from './budget-executor';
import { TacticalAnalyzer } from './tactical-analyzer';
import { sendTelegramReport } from './telegram-notifier';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('🤖 GOOGLE ADS WEEKLY AGENT V2');
  console.log('═'.repeat(60));
  console.log('Strategic automation + Tactical AI recommendations');
  console.log('═'.repeat(60));
  console.log('');

  const startTime = Date.now();

  try {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 1: DATA COLLECTION (Deterministic)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    console.log('━━━ PHASE 1: DATA COLLECTION ━━━\n');
    console.log('Skipping data collection for now (not yet ported to V2)...\n');

    // TODO: Port data collection to V2
    // const collector = new WeeklySnapshotCollector();
    // await collector.collect();

    console.log('✅ Data collection skipped (using existing data)\n');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 2: BUDGET EXECUTION (Automated - NO Approval)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    console.log('━━━ PHASE 2: BUDGET EXECUTION ━━━\n');
    console.log('Auto-executing preset budget strategy...\n');

    const executor = new BudgetExecutor();
    const budgetChanges = await executor.execute();

    console.log('✅ Budget execution complete\n');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 3: AI TACTICAL ANALYSIS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    console.log('━━━ PHASE 3: AI TACTICAL ANALYSIS ━━━\n');
    console.log('AI analyzing performance for tactical opportunities...\n');

    const analyzer = new TacticalAnalyzer();
    const tacticalRecommendations = await analyzer.analyze();

    console.log('✅ AI analysis complete\n');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 4: TELEGRAM REPORT
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    console.log('━━━ PHASE 4: TELEGRAM REPORT ━━━\n');
    console.log('Generating weekly report...\n');

    await sendTelegramReport(budgetChanges, tacticalRecommendations);

    console.log('✅ Telegram report sent\n');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SUMMARY
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const duration = Math.round((Date.now() - startTime) / 1000);

    console.log('═'.repeat(60));
    console.log('✅ WEEKLY AGENT V2 COMPLETE!');
    console.log('═'.repeat(60));
    console.log('');
    console.log('What happened:');
    console.log('  ⏭️  Skipped data collection (using existing data)');
    console.log('  ⏭️  (Data collection will be ported to V2 later)');
    console.log(`  ✓ Auto-executed ${budgetChanges.filter(c => c.status === 'success').length} budget changes`);
    console.log(`  ✓ Generated ${tacticalRecommendations.length} tactical recommendations`);
    console.log('  ✓ Sent Telegram report\n');
    console.log('Next steps:');
    console.log('  1. Check Telegram for report');
    console.log('  2. Review tactical recommendations');
    console.log('  3. Approve/reject recommendations via Telegram');
    console.log('  4. Next Monday: See performance results\n');
    console.log(`Completed in ${duration}s\n`);

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Telegram report is now handled by telegram-notifier.ts
// No need for this function anymore

// Run the agent
main();
