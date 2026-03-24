#!/usr/bin/env tsx
/**
 * Google Ads AI Agent - Intelligent Weekly Optimization
 *
 * This version uses Claude AI for strategic analysis instead of rigid rules.
 *
 * Flow:
 * 1. Collect 7-day, 14-day, and 30-day performance data
 * 2. Send to Claude API for intelligent analysis
 * 3. Claude returns strategic recommendations with reasoning
 * 4. Validate recommendations against safety rules
 * 5. Send to Telegram with interactive approve/reject buttons
 * 6. Save to database for approval workflow
 *
 * Usage:
 *   npm run agents:google-ads:ai              # Run AI agent
 *   npm run agents:google-ads:ai:dry-run      # Simulate without sending to Telegram
 */

import { db } from '../shared/database';
import { GENERAL_CONFIG } from '../shared/config';
import { DataCollector } from './data-collector';
import { AIStrategicAdvisor } from './ai-strategic-advisor';
import { TelegramNotifier } from './telegram-notifier';

// Campaign to Product mapping
const CAMPAIGN_PRODUCT_MAP = new Map<string, string>([
  ['22929687344', 'vic-selective'],        // VIC Selective Entry
  ['22973507747', 'edutest-scholarship'],  // EduTest Scholarship
  ['22971231259', 'acer-scholarship'],     // ACER Scholarship
  ['22971222193', 'nsw-selective'],        // NSW Selective Entry
  ['22960959318', 'year-5-naplan'],        // Year 5 NAPLAN
  ['22967300355', 'year-7-naplan'],        // Year 7 NAPLAN
]);

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const startTime = Date.now();

  console.log('🧠 Google Ads AI Strategic Agent');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no Telegram)' : 'LIVE'}`);
  console.log(`Daily Budget Cap: $${GENERAL_CONFIG.DAILY_BUDGET_CAP_AUD} AUD`);
  console.log('─'.repeat(60));

  try {
    // Step 1: Collect multi-timeframe data
    console.log('\n📊 Step 1: Collecting performance data...');
    const dataCollector = new DataCollector(CAMPAIGN_PRODUCT_MAP);

    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Collect recent data for context
    await dataCollector.collectAllData(today);

    console.log('  ✓ Data collection complete');

    // Step 2: AI Strategic Analysis
    console.log('\n🧠 Step 2: AI Strategic Analysis...');
    const aiAdvisor = new AIStrategicAdvisor(db.client);
    const analysis = await aiAdvisor.analyzeAndRecommend();

    console.log('\n  📈 Analysis Summary:');
    console.log(`    - Executive Summary: ${analysis.executive_summary.substring(0, 100)}...`);
    console.log(`    - Key Insights: ${analysis.key_insights.length}`);
    console.log(`    - Recommendations: ${analysis.recommendations.length}`);
    console.log(`      • High Priority: ${analysis.recommendations.filter(r => r.priority === 'high').length}`);
    console.log(`      • Medium Priority: ${analysis.recommendations.filter(r => r.priority === 'medium').length}`);
    console.log(`      • Low Priority: ${analysis.recommendations.filter(r => r.priority === 'low').length}`);

    // Step 3: Save recommendations to database for approval workflow
    console.log('\n💾 Step 3: Saving recommendations to database...');
    let savedCount = 0;

    for (const rec of analysis.recommendations) {
      const { error } = await db.client
        .from('google_ads_agent_actions')
        .insert({
          action_type: rec.type,
          campaign_id: rec.campaign_id,
          details: {
            ...rec.details,
            action: rec.action,
            reasoning: rec.reasoning,
            expected_impact: rec.expected_impact,
            confidence: rec.confidence,
            priority: rec.priority,
            ai_generated: true,
          },
          requires_approval: true,
          ai_confidence: rec.confidence,
        });

      if (!error) {
        savedCount++;
      } else {
        console.error(`    ✗ Failed to save recommendation: ${rec.action}`);
      }
    }

    console.log(`  ✓ Saved ${savedCount}/${analysis.recommendations.length} recommendations`);

    // Step 4: Get performance data for Telegram summary
    console.log('\n📊 Step 4: Preparing performance data...');

    // Get the actual performance data that was analyzed
    const { data: last7DaysSnapshots } = await db.client
      .from('google_ads_campaign_performance')
      .select('*')
      .gte('date', sevenDaysAgo.toISOString().split('T')[0])
      .lte('date', today);

    const { data: previous7DaysSnapshots } = await db.client
      .from('google_ads_campaign_performance')
      .select('*')
      .gte('date', fourteenDaysAgo.toISOString().split('T')[0])
      .lt('date', sevenDaysAgo.toISOString().split('T')[0]);

    const aggregateLast7 = aggregateSnapshots(last7DaysSnapshots || []);
    const aggregatePrevious7 = aggregateSnapshots(previous7DaysSnapshots || []);

    const performanceData = {
      last7Days: { summary: aggregateLast7, campaigns: [] },
      previous7Days: { summary: aggregatePrevious7, campaigns: [] },
    };

    // Step 5: Send to Telegram
    if (!dryRun) {
      console.log('\n📱 Step 5: Sending Telegram notification...');
      const telegram = new TelegramNotifier(db.client);
      await telegram.sendWeeklyAnalysis(analysis, performanceData);
      console.log('  ✓ Telegram notifications sent');
    } else {
      console.log('\n📱 Step 5: Skipping Telegram (dry run)');
      console.log('\n  Preview of what would be sent:');
      console.log(`  - Weekly analysis message with performance comparison`);
      console.log(`  - ${analysis.recommendations.filter(r => r.priority === 'high').length} high priority recommendations with buttons`);
      console.log(`  - ${analysis.recommendations.filter(r => r.priority === 'medium').length} medium priority recommendations`);
    }

    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('\n─'.repeat(60));
    console.log('✅ AI Agent execution completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`  - Analysis generated: ✓`);
    console.log(`  - Recommendations: ${analysis.recommendations.length} (saved to database)`);
    console.log(`  - Telegram: ${dryRun ? 'Skipped (dry run)' : 'Sent'}`);
    console.log(`  - Duration: ${duration}s`);
    console.log('\n📅 Next steps:');
    console.log('  1. Check Telegram for recommendations');
    console.log('  2. Tap ✅ Approve or ❌ Reject for each');
    console.log('  3. Approved actions execute next Monday');
    console.log('\n💡 View recommendations in Supabase:');
    console.log('  SELECT * FROM google_ads_agent_actions');
    console.log('  WHERE requires_approval = true AND approved_at IS NULL');

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

/**
 * Aggregate snapshot data for performance summary
 */
function aggregateSnapshots(snapshots: any[]) {
  // Convert cost_micros to dollars (micros / 1,000,000)
  const total_spend = snapshots.reduce((sum, s) => sum + (s.cost_micros / 1000000), 0);
  const total_conversions = snapshots.reduce((sum, s) => sum + s.conversions, 0);
  const total_clicks = snapshots.reduce((sum, s) => sum + s.clicks, 0);
  const total_impressions = snapshots.reduce((sum, s) => sum + s.impressions, 0);

  return {
    total_spend,
    total_conversions,
    average_cac: total_conversions > 0 ? total_spend / total_conversions : 0,
    average_ctr: total_impressions > 0 ? (total_clicks / total_impressions) * 100 : 0,
  };
}

// Run
main();
