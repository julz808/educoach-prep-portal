#!/usr/bin/env tsx
/**
 * Google Ads Marketing Agent - Entry Point
 *
 * This agent runs weekly to optimize Google Ads campaigns with the goal of
 * lowering Customer Acquisition Cost (CAC) and increasing sales.
 *
 * Usage:
 *   npm run agents:google-ads              # Run for real
 *   npm run agents:google-ads:dry-run      # Simulate without making changes
 */

import { db } from '../shared/database';
import { GENERAL_CONFIG } from '../shared/config';
import { SeasonalityEngine } from './seasonality-engine';
import { DataCollector } from './data-collector';
import { BudgetOptimizer } from './budget-optimizer';
import { KeywordOptimizer } from './keyword-optimizer';
import { BiddingOptimizer } from './bidding-optimizer';
import { AdCopyOptimizer } from './ad-copy-optimizer';

// Campaign to Product mapping
const CAMPAIGN_PRODUCT_MAP = new Map<string, string>([
  ['22929687344', 'vic-selective'],        // VIC Selective Entry
  ['22973507747', 'edutest-scholarship'],  // EduTest Scholarship
  ['22971231259', 'acer-scholarship'],     // ACER Scholarship
  ['22971222193', 'nsw-selective'],        // NSW Selective Entry
  ['22960959318', 'year-5-naplan'],        // Year 5 NAPLAN
  ['22967300355', 'year-7-naplan'],        // Year 7 NAPLAN
  // Note: Other campaigns (Scholarship Test Preparation, NAPLAN Test Preparation, Search_Campaign) not mapped
]);

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const startTime = Date.now();

  console.log('🚀 Google Ads Marketing Agent');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE'}`);
  console.log(`Daily Budget Cap: $${GENERAL_CONFIG.DAILY_BUDGET_CAP_AUD} AUD`);
  console.log('─'.repeat(60));

  const summary = {
    total_budget_changes: 0,
    total_bidding_changes: 0,
    total_negative_keywords_flagged: 0,
    total_campaigns_paused: 0,
    errors: [] as string[],
  };

  try {
    // STEP 1: Verify database and check pending approvals
    console.log('\n📊 Step 1: Verifying database connection...');
    const testCalendar = await db.getTestCalendar();
    console.log(`  ✓ Connected! Found ${testCalendar.length} products`);

    const pendingApprovals = await db.getPendingApprovals();
    if (pendingApprovals.length > 0) {
      console.log(`  ⚠️  ${pendingApprovals.length} pending approvals need review`);
    }

    // STEP 2: Check if Google Ads API is configured
    console.log('\n📡 Step 2: Checking Google Ads API configuration...');
    const hasGoogleAdsConfig =
      process.env.GOOGLE_ADS_CLIENT_ID &&
      process.env.GOOGLE_ADS_CLIENT_SECRET &&
      process.env.GOOGLE_ADS_DEVELOPER_TOKEN &&
      process.env.GOOGLE_ADS_REFRESH_TOKEN &&
      process.env.GOOGLE_ADS_CUSTOMER_ID;

    if (!hasGoogleAdsConfig) {
      console.log('  ⚠️  Google Ads API not configured');
      console.log('  ℹ️  Running in test mode with database-only operations');

      // Test mode: just verify seasonality engine
      console.log('\n🧠 Step 3: Testing seasonality engine...');
      const seasonality = new SeasonalityEngine();
      await seasonality.initialize();
      console.log(seasonality.getSummary());

      console.log('\n✅ Test completed successfully!');
      console.log('\n📚 To enable full optimization:');
      console.log('  1. Add Google Ads API credentials to .env');
      console.log('  2. Configure CAMPAIGN_PRODUCT_MAP in this file');
      console.log('  3. Run again to start live optimization');

      process.exit(0);
    }

    // STEP 3: Collect data from Google Ads
    console.log('\n📡 Step 3: Collecting data from Google Ads...');
    const today = new Date().toISOString().split('T')[0];
    const dataCollector = new DataCollector(CAMPAIGN_PRODUCT_MAP);
    const { budgets } = await dataCollector.collectAllData(today);

    // STEP 4: Initialize seasonality engine and calculate budget recommendations
    console.log('\n🧠 Step 4: Calculating budget recommendations...');
    const seasonality = new SeasonalityEngine();
    await seasonality.initialize();
    console.log('  Seasonality analysis:');
    console.log(seasonality.getSummary());

    const currentBudgets = new Map(
      Array.from(budgets.entries()).map(([slug, info]) => [slug, info.amount])
    );
    const recommendations = await seasonality.calculateBudgetRecommendations(currentBudgets);
    console.log(`  ✓ Generated ${recommendations.length} recommendations`);

    // STEP 5: Execute budget changes
    console.log('\n💰 Step 5: Executing budget changes...');
    const budgetOptimizer = new BudgetOptimizer();
    const budgetResults = await budgetOptimizer.executeBudgetChanges(
      recommendations,
      budgets,
      dryRun
    );
    summary.total_budget_changes = budgetResults.filter((r) => r.success).length;

    // Pause underperforming campaigns
    const pausedCount = await budgetOptimizer.pauseUnderperformingCampaigns(
      recommendations,
      CAMPAIGN_PRODUCT_MAP,
      dryRun
    );
    summary.total_campaigns_paused = pausedCount;

    // STEP 6: Analyze search terms for negative keywords
    console.log('\n🔍 Step 6: Analyzing search terms...');
    const keywordOptimizer = new KeywordOptimizer();
    const keywordAnalysis = await keywordOptimizer.analyzeSearchTerms();
    summary.total_negative_keywords_flagged = keywordAnalysis.negativeKeywordsFlagged;
    console.log(`  ✓ Flagged ${keywordAnalysis.negativeKeywordsFlagged} negative keywords`);
    console.log(`  ✓ Found ${keywordAnalysis.highPerformersFound} high performers`);

    // STEP 7: Evaluate bidding strategies
    console.log('\n🎯 Step 7: Evaluating bidding strategies...');
    const biddingOptimizer = new BiddingOptimizer();
    const graduationEvals = await biddingOptimizer.evaluateCampaignsForGraduation(
      CAMPAIGN_PRODUCT_MAP
    );
    const eligibleForGraduation = graduationEvals.filter((e) => e.eligible);

    if (eligibleForGraduation.length > 0) {
      console.log(`  ✓ ${eligibleForGraduation.length} campaigns eligible for graduation`);
      const graduatedCount = await biddingOptimizer.graduateCampaigns(
        graduationEvals,
        dryRun
      );
      summary.total_bidding_changes = graduatedCount;
    } else {
      console.log('  ℹ️  No campaigns eligible for graduation yet');
    }

    // STEP 8: Analyze ad copy performance
    console.log('\n📝 Step 8: Analyzing ad copy performance...');
    const adCopyOptimizer = new AdCopyOptimizer();
    const endDate = today;
    const startDateObj = new Date(today);
    startDateObj.setDate(startDateObj.getDate() - 30);
    const startDate = startDateObj.toISOString().split('T')[0];

    const adAnalysis = await adCopyOptimizer.analyzeAdPerformance(
      startDate,
      endDate,
      CAMPAIGN_PRODUCT_MAP
    );

    console.log(`  ✓ ${adAnalysis.lowPerformers.length} low-performing ads flagged`);
    console.log(`  ✓ ${adAnalysis.highPerformers.length} high-performing ads identified`);
    console.log(`  ✓ ${adAnalysis.recommendations.length} ad recommendations generated`);

    // STEP 9: Save weekly summary
    console.log('\n📝 Step 9: Saving weekly summary...');
    const executionDuration = Math.round((Date.now() - startTime) / 1000);
    const weekStartDate = new Date();
    weekStartDate.setDate(weekStartDate.getDate() - weekStartDate.getDay());

    await db.saveWeeklySummary({
      week_start_date: weekStartDate.toISOString().split('T')[0],
      total_budget_changes: summary.total_budget_changes,
      total_bidding_changes: summary.total_bidding_changes,
      total_negative_keywords_flagged: summary.total_negative_keywords_flagged,
      total_campaigns_paused: summary.total_campaigns_paused,
      performance_summary: {
        recommendations,
        budgetResults,
        keywordAnalysis,
      },
      dry_run: dryRun,
      execution_duration_seconds: executionDuration,
      errors: summary.errors.length > 0 ? summary.errors : undefined,
    });
    console.log('  ✓ Summary saved');

    // Success summary
    console.log('\n' + '─'.repeat(60));
    console.log('✅ Agent execution completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`  • Budget changes: ${summary.total_budget_changes}`);
    console.log(`  • Campaigns paused: ${summary.total_campaigns_paused}`);
    console.log(`  • Negative keywords flagged: ${summary.total_negative_keywords_flagged}`);
    console.log(`  • Bidding strategy changes: ${summary.total_bidding_changes}`);
    console.log(`  • Execution time: ${executionDuration}s`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Agent execution failed:');
    console.error(error);

    summary.errors.push(error instanceof Error ? error.message : String(error));

    // Try to log the failure
    try {
      await db.logAgentAction({
        action_type: 'weekly_execution',
        details: {
          dry_run: dryRun,
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        },
        execution_status: 'failed',
      });
    } catch (logError) {
      console.error('Failed to log error to database:', logError);
    }

    process.exit(1);
  }
}

main();
