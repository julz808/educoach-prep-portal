/**
 * Collect Weekly Snapshots (Deterministic Data Scraper)
 *
 * Standalone script that:
 * 1. Fetches ALL Google Ads data for last week
 * 2. Validates data quality
 * 3. Saves to Supabase
 * 4. Exports JSON backup
 * 5. Generates summary report
 *
 * NO AI dependencies - pure data collection only
 */

import { GoogleAdsClient } from './google-ads-client';
import { db } from '../shared/database';
import { DataValidator } from './data-validator';
import { SnapshotExporter } from './snapshot-exporter';
import type {
  WeeklyCampaignSnapshot,
  WeeklyKeywordSnapshot,
  WeeklyAdCopySnapshot,
} from './weekly-data-collector';
import dotenv from 'dotenv';

dotenv.config();

// Campaign ID to Product Slug Mapping
const CAMPAIGN_PRODUCT_MAP = new Map<string, string>([
  ['22929687344', 'vic-selective-entry'],
  ['22971222193', 'nsw-selective'],
  ['22971231259', 'acer-scholarship'],
  ['22973507747', 'edutest-scholarship'],
  ['22960959318', 'year-5-naplan'],
  ['22967300355', 'year-7-naplan'],
]);

// Test calendar for seasonal context
interface TestCalendar {
  product_slug: string;
  test_date_primary: string;
  max_daily_budget_aud: number;
  min_daily_budget_aud: number;
}

export class WeeklySnapshotCollector {
  private adsClient: GoogleAdsClient;
  private validator: DataValidator;
  private exporter: SnapshotExporter;
  private testCalendar: Map<string, TestCalendar> = new Map();

  constructor() {
    this.adsClient = new GoogleAdsClient();
    this.validator = new DataValidator();
    this.exporter = new SnapshotExporter();
  }

  /**
   * Calculate week start/end dates (Monday to Sunday)
   */
  private getWeekDates(daysAgo: number = 7): { weekStart: string; weekEnd: string } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get last Monday
    const lastMonday = new Date(today);
    const dayOfWeek = today.getDay();
    const daysToLastMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0
    lastMonday.setDate(today.getDate() - daysToLastMonday - daysAgo);

    // Get last Sunday
    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);

    return {
      weekStart: lastMonday.toISOString().split('T')[0],
      weekEnd: lastSunday.toISOString().split('T')[0],
    };
  }

  /**
   * Load test calendar for seasonal context
   */
  private async loadTestCalendar(): Promise<void> {
    const { data: tests, error } = await db.client.from('test_calendar').select('*');

    if (error) {
      console.error('⚠️  Warning: Could not load test calendar:', error.message);
      return;
    }

    tests?.forEach((test: TestCalendar) => {
      this.testCalendar.set(test.product_slug, test);
    });

    console.log(`  ✓ Loaded ${tests?.length || 0} test calendar entries`);
  }

  /**
   * Calculate seasonal context for a product
   */
  private calculateSeasonalContext(productSlug: string) {
    const test = this.testCalendar.get(productSlug);
    if (!test) {
      return {
        test_date: null,
        weeks_until_test: null,
        seasonal_phase: null,
        recommended_budget_aud: null,
      };
    }

    const testDate = new Date(test.test_date_primary);
    const today = new Date();
    const daysUntil = Math.floor((testDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const weeksUntil = Math.floor(daysUntil / 7);

    const phase = this.getSeasonalPhase(weeksUntil, productSlug);
    const recommendedBudget = this.calculateSeasonalBudget(
      test.max_daily_budget_aud,
      test.min_daily_budget_aud,
      phase
    );

    return {
      test_date: test.test_date_primary,
      weeks_until_test: weeksUntil,
      seasonal_phase: phase,
      recommended_budget_aud: recommendedBudget,
    };
  }

  /**
   * Determine seasonal phase
   */
  private getSeasonalPhase(weeksUntil: number, productSlug: string): string {
    if (weeksUntil < 0) return 'POST_TEST';

    const isRollingTest = productSlug.includes('edutest') || productSlug.includes('acer');

    if (isRollingTest) {
      if (weeksUntil <= 2) return 'IMMINENT';
      if (weeksUntil <= 6) return 'PEAK';
      if (weeksUntil <= 12) return 'RAMP_UP';
      if (weeksUntil <= 20) return 'EARLY';
      return 'BASELINE';
    }

    // Fixed-date tests
    if (weeksUntil <= 2) return 'IMMINENT';
    if (weeksUntil <= 6) return 'LATE';
    if (weeksUntil <= 12) return 'PEAK';
    if (weeksUntil <= 20) return 'RAMP_UP';
    if (weeksUntil <= 26) return 'EARLY';
    return 'TOO_EARLY';
  }

  /**
   * Calculate recommended budget based on seasonal phase
   */
  private calculateSeasonalBudget(max: number, min: number, phase: string): number {
    const multipliers: Record<string, number> = {
      POST_TEST: 0.0,
      TOO_EARLY: 0.0,
      EARLY: 0.4,
      RAMP_UP: 0.7,
      PEAK: 1.0,
      LATE: 0.85,
      IMMINENT: 0.6,
      BASELINE: 0.5,
    };

    const multiplier = multipliers[phase] || 0;
    return Math.round(min + (max - min) * multiplier);
  }

  /**
   * Aggregate campaign metrics
   */
  private aggregateCampaigns(
    metrics: any[],
    weekStart: string,
    weekEnd: string,
    budgets: Map<string, number>,
    campaigns: any[]
  ): WeeklyCampaignSnapshot[] {
    const campaignMap = new Map<string, any>();

    // Aggregate metrics across days
    metrics.forEach((m) => {
      const existing = campaignMap.get(m.campaignId);
      if (existing) {
        existing.impressions += m.impressions;
        existing.clicks += m.clicks;
        existing.cost_micros += m.costMicros;
        existing.conversions += m.conversions;
        existing.conversion_value_micros += m.conversionValueMicros;
      } else {
        campaignMap.set(m.campaignId, {
          campaign_id: m.campaignId,
          campaign_name: m.campaignName,
          campaign_status: m.campaignStatus,
          impressions: m.impressions,
          clicks: m.clicks,
          cost_micros: m.costMicros,
          conversions: m.conversions,
          conversion_value_micros: m.conversionValueMicros,
        });
      }
    });

    const snapshots: WeeklyCampaignSnapshot[] = [];

    campaignMap.forEach((data, campaignId) => {
      const productSlug = CAMPAIGN_PRODUCT_MAP.get(campaignId) || 'unknown';
      const seasonalContext = this.calculateSeasonalContext(productSlug);
      const campaign = campaigns.find((c) => c.id === campaignId);

      const costAud = data.cost_micros / 1_000_000;
      const cac = data.conversions > 0 ? costAud / data.conversions : 0;
      const ctr = data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0;
      const conversionRate = data.clicks > 0 ? (data.conversions / data.clicks) * 100 : 0;

      snapshots.push({
        week_start_date: weekStart,
        week_end_date: weekEnd,
        campaign_id: campaignId,
        campaign_name: data.campaign_name,
        product_slug: productSlug,
        impressions: data.impressions,
        clicks: data.clicks,
        cost_micros: data.cost_micros,
        conversions: data.conversions,
        conversion_value_micros: data.conversion_value_micros,
        cac_aud: Number(cac.toFixed(2)),
        ctr: Number(ctr.toFixed(2)),
        conversion_rate: Number(conversionRate.toFixed(2)),
        daily_budget_aud: budgets.get(campaignId) || 0,
        campaign_status: data.campaign_status,
        bidding_strategy: campaign?.biddingStrategy || 'UNKNOWN',
        ...seasonalContext,
      });
    });

    return snapshots;
  }

  /**
   * Aggregate keywords
   */
  private aggregateKeywords(
    keywords: any[],
    weekStart: string,
    weekEnd: string
  ): WeeklyKeywordSnapshot[] {
    return keywords.map((k) => {
      const costAud = k.costMicros / 1_000_000;
      const cac = k.conversions > 0 ? costAud / k.conversions : 0;
      const ctr = k.impressions > 0 ? (k.clicks / k.impressions) * 100 : 0;

      return {
        week_start_date: weekStart,
        week_end_date: weekEnd,
        campaign_id: k.campaignId,
        campaign_name: k.campaignName,
        ad_group_id: k.adGroupId,
        ad_group_name: k.adGroupName,
        keyword_text: k.keywordText,
        match_type: k.matchType,
        impressions: k.impressions,
        clicks: k.clicks,
        cost_micros: k.costMicros,
        conversions: k.conversions,
        cac_aud: Number(cac.toFixed(2)),
        ctr: Number(ctr.toFixed(2)),
        cpc_bid_micros: k.cpcBidMicros,
        cpc_bid_aud: Number((k.cpcBidMicros / 1_000_000).toFixed(2)),
        keyword_status: 'ENABLED',
      };
    });
  }

  /**
   * Aggregate ad copy
   */
  private aggregateAdCopy(ads: any[], weekStart: string, weekEnd: string): WeeklyAdCopySnapshot[] {
    return ads.map((ad) => {
      const ctr = ad.impressions > 0 ? (ad.clicks / ad.impressions) * 100 : 0;
      const conversionRate = ad.clicks > 0 ? (ad.conversions / ad.clicks) * 100 : 0;

      return {
        week_start_date: weekStart,
        week_end_date: weekEnd,
        campaign_id: ad.campaignId,
        campaign_name: ad.campaignName,
        ad_group_id: ad.adGroupId,
        ad_id: ad.adId,
        headlines: ad.headlines,
        descriptions: ad.descriptions,
        final_url: ad.finalUrl,
        impressions: ad.impressions,
        clicks: ad.clicks,
        conversions: ad.conversions,
        ctr: Number(ctr.toFixed(2)),
        conversion_rate: Number(conversionRate.toFixed(2)),
        ad_status: 'ENABLED',
      };
    });
  }

  /**
   * Save snapshots to Supabase
   */
  private async saveToSupabase(
    campaigns: WeeklyCampaignSnapshot[],
    keywords: WeeklyKeywordSnapshot[],
    adCopy: WeeklyAdCopySnapshot[]
  ): Promise<void> {
    console.log('\n💾 Saving to Supabase...');

    // Save campaigns
    if (campaigns.length > 0) {
      const { error } = await db.client.from('google_ads_weekly_snapshots').upsert(campaigns, {
        onConflict: 'week_start_date,campaign_id',
      });

      if (error) {
        throw new Error(`Failed to save campaigns: ${error.message}`);
      }
      console.log(`  ✓ Saved ${campaigns.length} campaign snapshots`);
    }

    // Save keywords
    if (keywords.length > 0) {
      const { error } = await db.client.from('google_ads_weekly_keywords').upsert(keywords, {
        onConflict: 'week_start_date,campaign_id,keyword_text,match_type',
      });

      if (error) {
        throw new Error(`Failed to save keywords: ${error.message}`);
      }
      console.log(`  ✓ Saved ${keywords.length} keyword snapshots`);
    }

    // Save ad copy
    if (adCopy.length > 0) {
      const { error } = await db.client.from('google_ads_weekly_ad_copy').upsert(adCopy, {
        onConflict: 'week_start_date,ad_id',
      });

      if (error) {
        throw new Error(`Failed to save ad copy: ${error.message}`);
      }
      console.log(`  ✓ Saved ${adCopy.length} ad copy snapshots`);
    }
  }

  /**
   * Main collection function
   */
  async collect(options: { weekStart?: string; weekEnd?: string; dryRun?: boolean } = {}): Promise<void> {
    console.log('📊 Google Ads Weekly Snapshot Collector');
    console.log('═══════════════════════════════════════════\n');

    // Calculate week dates
    let { weekStart, weekEnd } = options;
    if (!weekStart || !weekEnd) {
      const dates = this.getWeekDates(7);
      weekStart = dates.weekStart;
      weekEnd = dates.weekEnd;
    }

    console.log(`Week: ${weekStart} to ${weekEnd}`);
    if (options.dryRun) {
      console.log('🔍 DRY RUN MODE - No data will be saved\n');
    }
    console.log('');

    // Step 1: Load test calendar
    console.log('📅 Loading test calendar...');
    await this.loadTestCalendar();

    // Step 2: Fetch from Google Ads API
    console.log('\n🔄 Fetching from Google Ads API...');

    const campaignMetrics = await this.adsClient.getCampaignMetrics(weekStart, weekEnd);
    console.log(`  ✓ Fetched ${campaignMetrics.length} campaign metric records`);

    const keywords = await this.adsClient.getKeywords(weekStart, weekEnd);
    console.log(`  ✓ Fetched ${keywords.length} keywords`);

    const adCopy = await this.adsClient.getAdCopy(weekStart, weekEnd);
    console.log(`  ✓ Fetched ${adCopy.length} ads`);

    const budgets = await this.adsClient.getBudgets();
    const budgetsMap = new Map(budgets.map((b) => [b.id, b.amountMicros / 1_000_000]));
    console.log(`  ✓ Fetched ${budgets.length} budgets`);

    const campaigns = await this.adsClient.getCampaigns();
    const campaignBudgets = new Map<string, number>();
    campaigns.forEach((c) => {
      const budgetAmount = budgetsMap.get(c.budgetId) || 0;
      campaignBudgets.set(c.id, budgetAmount);
    });
    console.log(`  ✓ Fetched ${campaigns.length} campaigns`);

    // Step 3: Aggregate data
    console.log('\n📊 Aggregating data...');

    const campaignSnapshots = this.aggregateCampaigns(
      campaignMetrics,
      weekStart,
      weekEnd,
      campaignBudgets,
      campaigns
    );
    console.log(`  ✓ Aggregated ${campaignSnapshots.length} campaign snapshots`);

    const keywordSnapshots = this.aggregateKeywords(keywords, weekStart, weekEnd);
    console.log(`  ✓ Aggregated ${keywordSnapshots.length} keyword snapshots`);

    const adCopySnapshots = this.aggregateAdCopy(adCopy, weekStart, weekEnd);
    console.log(`  ✓ Aggregated ${adCopySnapshots.length} ad copy snapshots`);

    // Step 4: Validate data
    console.log('\n🔍 Validating data quality...');
    const validationResult = this.validator.validate(
      campaignSnapshots,
      keywordSnapshots,
      adCopySnapshots
    );

    DataValidator.printReport(validationResult);

    if (!validationResult.isValid) {
      throw new Error('Data validation failed. Fix errors before proceeding.');
    }

    // Step 5: Save to Supabase (unless dry run)
    if (!options.dryRun) {
      await this.saveToSupabase(campaignSnapshots, keywordSnapshots, adCopySnapshots);
    } else {
      console.log('\n⏭️  Skipping Supabase save (dry run mode)');
    }

    // Step 6: Export JSON backup
    console.log('\n📦 Exporting JSON backup...');
    const filepath = this.exporter.export(
      weekStart,
      weekEnd,
      campaignSnapshots,
      keywordSnapshots,
      adCopySnapshots,
      validationResult.score
    );

    SnapshotExporter.printExportSummary(filepath, {
      metadata: {
        version: '1.0',
        week_start: weekStart,
        week_end: weekEnd,
        collected_at: new Date().toISOString(),
        data_quality_score: validationResult.score,
      },
      campaigns: campaignSnapshots,
      keywords: keywordSnapshots,
      adCopy: adCopySnapshots,
    });

    // Step 7: Generate summary report
    console.log('📄 Generating summary report...');
    const reportPath = this.exporter.exportSummaryReport({
      metadata: {
        version: '1.0',
        week_start: weekStart,
        week_end: weekEnd,
        collected_at: new Date().toISOString(),
        data_quality_score: validationResult.score,
      },
      campaigns: campaignSnapshots,
      keywords: keywordSnapshots,
      adCopy: adCopySnapshots,
    });
    console.log(`  ✓ Saved to: ${reportPath}\n`);

    // Final summary
    console.log('═══════════════════════════════════════════');
    console.log('✅ Collection complete!');
    console.log('═══════════════════════════════════════════\n');

    console.log('Summary:');
    console.log(`  Week: ${weekStart} to ${weekEnd}`);
    console.log(`  Campaigns: ${campaignSnapshots.length}`);
    console.log(`  Keywords: ${keywordSnapshots.length}`);
    console.log(`  Ads: ${adCopySnapshots.length}`);
    console.log(`  Quality Score: ${validationResult.score}/100`);
    console.log(`  JSON Backup: ${filepath}`);
    console.log(`  Summary Report: ${reportPath}\n`);

    if (!options.dryRun) {
      console.log('Next: Run AI analysis with:');
      console.log(`  npm run agents:google-ads:analyze -- --week-start=${weekStart}\n`);
    }
  }
}

// CLI execution
async function main() {
  try {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const weekStartArg = args.find((arg) => arg.startsWith('--week-start='));
    const weekEndArg = args.find((arg) => arg.startsWith('--week-end='));

    const weekStart = weekStartArg?.split('=')[1];
    const weekEnd = weekEndArg?.split('=')[1];

    const collector = new WeeklySnapshotCollector();
    await collector.collect({ weekStart, weekEnd, dryRun });
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
