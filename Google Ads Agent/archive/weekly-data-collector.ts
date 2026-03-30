/**
 * Weekly Data Collector
 *
 * Collects and aggregates Google Ads data for the past week
 * Saves weekly snapshots for AI analysis and attribution tracking
 */

import { GoogleAdsClient } from './google-ads-client';
import { db } from '../shared/database';

export interface WeeklyData {
  weekStart: string;
  weekEnd: string;
  campaigns: WeeklyCampaignSnapshot[];
  keywords: WeeklyKeywordSnapshot[];
  adCopy: WeeklyAdCopySnapshot[];
}

export interface WeeklyCampaignSnapshot {
  week_start_date: string;
  week_end_date: string;
  campaign_id: string;
  campaign_name: string;
  product_slug: string;
  impressions: number;
  clicks: number;
  cost_micros: number;
  conversions: number;
  conversion_value_micros: number;
  cac_aud: number;
  ctr: number;
  conversion_rate: number;
  daily_budget_aud: number;
  campaign_status: string;
  bidding_strategy: string;
  test_date: string | null;
  weeks_until_test: number | null;
  seasonal_phase: string | null;
  recommended_budget_aud: number | null;
}

export interface WeeklyKeywordSnapshot {
  week_start_date: string;
  week_end_date: string;
  campaign_id: string;
  campaign_name: string;
  ad_group_id: string;
  ad_group_name: string;
  keyword_text: string;
  match_type: string;
  impressions: number;
  clicks: number;
  cost_micros: number;
  conversions: number;
  cac_aud: number;
  ctr: number;
  cpc_bid_micros: number;
  cpc_bid_aud: number;
  keyword_status: string;
}

export interface WeeklyAdCopySnapshot {
  week_start_date: string;
  week_end_date: string;
  campaign_id: string;
  campaign_name: string;
  ad_group_id: string;
  ad_id: string;
  headlines: string[];
  descriptions: string[];
  final_url: string;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  conversion_rate: number;
  ad_status: string;
}

export class WeeklyDataCollector {
  private adsClient: GoogleAdsClient;
  private campaignProductMap: Map<string, string>;
  private testCalendar: Map<string, any>;

  constructor(campaignProductMap: Map<string, string>) {
    this.adsClient = new GoogleAdsClient();
    this.campaignProductMap = campaignProductMap;
    this.testCalendar = new Map();
  }

  /**
   * Calculate week start/end dates (Monday to Sunday)
   */
  private getWeekDates(daysAgo: number = 7): { weekStart: string; weekEnd: string } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get last Monday
    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() - today.getDay() - daysAgo + 1);

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
  private async loadTestCalendar() {
    const { data: tests, error } = await db.from('test_calendar').select('*');

    if (error) {
      console.error('Error loading test calendar:', error);
      return;
    }

    tests?.forEach((test: any) => {
      this.testCalendar.set(test.product_slug, test);
    });
  }

  /**
   * Calculate seasonal phase and recommended budget
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
   * Calculate recommended budget
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
   * Collect all weekly data and save snapshots
   */
  async collectWeeklyData(): Promise<WeeklyData> {
    console.log('📊 Collecting weekly Google Ads data...');

    // Load test calendar
    await this.loadTestCalendar();

    // Get last complete week (Monday to Sunday)
    const { weekStart, weekEnd } = this.getWeekDates(7);

    console.log(`  Week: ${weekStart} to ${weekEnd}`);

    // Fetch campaign metrics for the week
    const campaignMetrics = await this.adsClient.getCampaignMetrics(weekStart, weekEnd);
    console.log(`  ✓ Fetched metrics for ${campaignMetrics.length} campaigns`);

    // Fetch keywords for the week
    const keywords = await this.adsClient.getKeywords(weekStart, weekEnd);
    console.log(`  ✓ Fetched ${keywords.length} keywords`);

    // Fetch ad copy for the week
    const adCopy = await this.adsClient.getAdCopy(weekStart, weekEnd);
    console.log(`  ✓ Fetched ${adCopy.length} ads`);

    // Get current budgets
    const budgets = await this.adsClient.getBudgets();
    const budgetsMap = new Map(budgets.map((b) => [b.id, b.amountMicros / 1_000_000]));

    // Get campaigns for budget mapping
    const campaigns = await this.adsClient.getCampaigns();
    const campaignBudgets = new Map<string, number>();
    campaigns.forEach((c) => {
      const budgetAmount = budgetsMap.get(c.budgetId) || 0;
      campaignBudgets.set(c.id, budgetAmount);
    });

    // Aggregate campaigns by ID
    const campaignSnapshots = this.aggregateCampaigns(
      campaignMetrics,
      weekStart,
      weekEnd,
      campaignBudgets,
      campaigns
    );

    // Aggregate keywords by campaign + keyword text
    const keywordSnapshots = this.aggregateKeywords(keywords, weekStart, weekEnd);

    // Aggregate ad copy by ad ID
    const adCopySnapshots = this.aggregateAdCopy(adCopy, weekStart, weekEnd);

    // Save to database
    await this.saveWeeklySnapshots(campaignSnapshots, keywordSnapshots, adCopySnapshots);

    return {
      weekStart,
      weekEnd,
      campaigns: campaignSnapshots,
      keywords: keywordSnapshots,
      adCopy: adCopySnapshots,
    };
  }

  /**
   * Aggregate campaign metrics for the week
   */
  private aggregateCampaigns(
    metrics: any[],
    weekStart: string,
    weekEnd: string,
    budgets: Map<string, number>,
    campaigns: any[]
  ): WeeklyCampaignSnapshot[] {
    const campaignMap = new Map<string, any>();

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
      const productSlug = this.campaignProductMap.get(campaignId) || 'unknown';
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
   * Aggregate keywords for the week
   */
  private aggregateKeywords(keywords: any[], weekStart: string, weekEnd: string): WeeklyKeywordSnapshot[] {
    const snapshots: WeeklyKeywordSnapshot[] = keywords.map((k) => {
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
        keyword_status: 'ENABLED', // Would need to query status separately
      };
    });

    return snapshots;
  }

  /**
   * Aggregate ad copy for the week
   */
  private aggregateAdCopy(ads: any[], weekStart: string, weekEnd: string): WeeklyAdCopySnapshot[] {
    const snapshots: WeeklyAdCopySnapshot[] = ads.map((ad) => {
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
        ad_status: 'ENABLED', // Would need to query status separately
      };
    });

    return snapshots;
  }

  /**
   * Save all weekly snapshots to database
   */
  private async saveWeeklySnapshots(
    campaigns: WeeklyCampaignSnapshot[],
    keywords: WeeklyKeywordSnapshot[],
    adCopy: WeeklyAdCopySnapshot[]
  ) {
    console.log('  💾 Saving weekly snapshots...');

    // Save campaign snapshots
    if (campaigns.length > 0) {
      const { error: campaignError } = await db.from('google_ads_weekly_snapshots').upsert(campaigns, {
        onConflict: 'week_start_date,campaign_id',
      });

      if (campaignError) {
        console.error('Error saving campaign snapshots:', campaignError);
      } else {
        console.log(`  ✓ Saved ${campaigns.length} campaign snapshots`);
      }
    }

    // Save keyword snapshots
    if (keywords.length > 0) {
      const { error: keywordError } = await db.from('google_ads_weekly_keywords').upsert(keywords, {
        onConflict: 'week_start_date,campaign_id,keyword_text,match_type',
      });

      if (keywordError) {
        console.error('Error saving keyword snapshots:', keywordError);
      } else {
        console.log(`  ✓ Saved ${keywords.length} keyword snapshots`);
      }
    }

    // Save ad copy snapshots
    if (adCopy.length > 0) {
      const { error: adError } = await db.from('google_ads_weekly_ad_copy').upsert(adCopy, {
        onConflict: 'week_start_date,ad_id',
      });

      if (adError) {
        console.error('Error saving ad copy snapshots:', adError);
      } else {
        console.log(`  ✓ Saved ${adCopy.length} ad copy snapshots`);
      }
    }
  }
}
