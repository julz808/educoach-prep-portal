#!/usr/bin/env tsx
/**
 * Google Ads Agent - Data Collection Only
 *
 * Runs daily to collect performance data without making changes.
 * Use this for daily monitoring between weekly optimization runs.
 *
 * Usage:
 *   npm run agents:google-ads:collect-data
 */

import { db } from '../shared/database';
import { GENERAL_CONFIG } from '../shared/config';
import { DataCollector } from './data-collector';
import { KeywordOptimizer } from './keyword-optimizer';

// Campaign to Product mapping
const CAMPAIGN_PRODUCT_MAP = new Map<string, string>([
  ['22929687344', 'vic-selective'],
  ['22973507747', 'edutest-scholarship'],
  ['22971231259', 'acer-scholarship'],
  ['22971222193', 'nsw-selective'],
  ['22960959318', 'year-5-naplan'],
  ['22967300355', 'year-7-naplan'],
]);

async function main() {
  const startTime = Date.now();

  console.log('📊 Google Ads Agent - Data Collection');
  console.log('Mode: MONITORING ONLY (no changes)');
  console.log('─'.repeat(60));

  try {
    // Check API configuration
    const hasGoogleAdsConfig =
      process.env.GOOGLE_ADS_CLIENT_ID &&
      process.env.GOOGLE_ADS_CLIENT_SECRET &&
      process.env.GOOGLE_ADS_DEVELOPER_TOKEN &&
      process.env.GOOGLE_ADS_REFRESH_TOKEN &&
      process.env.GOOGLE_ADS_CUSTOMER_ID;

    if (!hasGoogleAdsConfig) {
      console.log('⚠️  Google Ads API not configured - skipping');
      process.exit(0);
    }

    // Collect data from Google Ads
    console.log('\n📡 Collecting data from Google Ads...');
    const today = new Date().toISOString().split('T')[0];
    const dataCollector = new DataCollector(CAMPAIGN_PRODUCT_MAP);
    await dataCollector.collectAllData(today);

    // Analyze search terms for negative keywords
    console.log('\n🔍 Analyzing search terms...');
    const keywordOptimizer = new KeywordOptimizer();
    const { negativeKeywordsFlagged, highPerformersFound } =
      await keywordOptimizer.analyzeSearchTerms();

    console.log(`  ✓ Flagged ${negativeKeywordsFlagged} new negative keywords`);
    console.log(`  ✓ Found ${highPerformersFound} high performers`);

    // Check for critical issues
    console.log('\n⚠️  Checking for critical issues...');
    const alerts = await checkCriticalIssues();

    if (alerts.length > 0) {
      console.log('  🚨 ALERTS:');
      alerts.forEach((alert) => console.log(`     ${alert}`));
    } else {
      console.log('  ✓ No critical issues detected');
    }

    const executionDuration = Math.round((Date.now() - startTime) / 1000);

    console.log('\n' + '─'.repeat(60));
    console.log('✅ Data collection completed!');
    console.log(`   Execution time: ${executionDuration}s`);
    console.log('\n📅 Next full optimization: Monday 6 AM AEST');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Data collection failed:');
    console.error(error);
    process.exit(1);
  }
}

/**
 * Check for critical issues that need immediate attention
 */
async function checkCriticalIssues(): Promise<string[]> {
  const alerts: string[] = [];

  // Check for CPA spikes
  const products = await db.getTestCalendar();
  for (const product of products) {
    const performance = await db.getCampaignPerformance(product.product_slug, 1);
    if (performance.length > 0) {
      const today = performance[0];
      if (today.cpa_aud && today.cpa_aud > product.pause_cpa_aud) {
        alerts.push(
          `${product.product_name}: CPA $${today.cpa_aud.toFixed(2)} exceeds threshold $${product.pause_cpa_aud}`
        );
      }
    }
  }

  // Check for zero conversions with high spend
  for (const product of products) {
    const performance = await db.getCampaignPerformance(product.product_slug, 7);
    let totalSpend = 0;
    let totalConversions = 0;
    performance.forEach((day: any) => {
      totalSpend += day.cost_aud;
      totalConversions += day.conversions;
    });

    if (totalSpend > 100 && totalConversions === 0) {
      alerts.push(
        `${product.product_name}: $${totalSpend.toFixed(2)} spent in last 7 days with 0 conversions`
      );
    }
  }

  return alerts;
}

main();
