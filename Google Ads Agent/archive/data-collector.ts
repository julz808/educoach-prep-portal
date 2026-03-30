/**
 * Data Collector
 *
 * Fetches campaign performance data from Google Ads API and saves to database
 */

import { GoogleAdsClient } from './google-ads-client';
import { db } from '../shared/database';

export interface CollectedData {
  performance: any[];
  searchTerms: any[];
  budgets: Map<string, { budgetId: string; amount: number }>;
}

export class DataCollector {
  private adsClient: GoogleAdsClient;
  private campaignProductMap: Map<string, string>;

  constructor(campaignProductMap: Map<string, string>) {
    this.adsClient = new GoogleAdsClient();
    this.campaignProductMap = campaignProductMap;
  }

  /**
   * Collect all data for a specific date
   */
  async collectAllData(date: string): Promise<CollectedData> {
    console.log(`  Fetching data for ${date}...`);

    // Fetch campaign performance
    const metrics = await this.adsClient.getCampaignMetrics(date, date);
    console.log(`  ✓ Fetched metrics for ${metrics.length} campaigns`);

    // Map to product slugs and save
    const performance = metrics.map((metric) => {
      const productSlug = this.campaignProductMap.get(metric.campaignId) || 'unknown';
      return {
        date: metric.date,
        campaign_id: metric.campaignId,
        campaign_name: metric.campaignName,
        campaign_status: metric.campaignStatus,
        product_slug: productSlug,
        impressions: metric.impressions,
        clicks: metric.clicks,
        cost_micros: metric.costMicros,
        conversions: metric.conversions,
        conversion_value_micros: metric.conversionValueMicros,
      };
    });

    if (performance.length > 0) {
      await db.saveCampaignPerformance(performance);
      console.log(`  ✓ Saved ${performance.length} performance records`);
    }

    // Fetch search terms (last 7 days for analysis)
    const endDate = date;
    const startDateObj = new Date(date);
    startDateObj.setDate(startDateObj.getDate() - 6);
    const startDate = startDateObj.toISOString().split('T')[0];

    const searchTermsData = await this.adsClient.getSearchTerms(startDate, endDate);
    console.log(`  ✓ Fetched ${searchTermsData.length} search terms`);

    // Aggregate by campaign and search term
    const searchTermMap = new Map<string, any>();
    searchTermsData.forEach((term) => {
      const key = `${term.campaignId}:${term.searchTerm}`;
      if (searchTermMap.has(key)) {
        const existing = searchTermMap.get(key)!;
        existing.impressions += term.impressions;
        existing.clicks += term.clicks;
        existing.cost_micros += term.costMicros;
        existing.conversions += term.conversions;
      } else {
        const productSlug = this.campaignProductMap.get(term.campaignId) || 'unknown';
        searchTermMap.set(key, {
          date: endDate,
          campaign_id: term.campaignId,
          product_slug: productSlug,
          search_term: term.searchTerm,
          impressions: term.impressions,
          clicks: term.clicks,
          cost_micros: term.costMicros,
          conversions: term.conversions,
        });
      }
    });

    const searchTerms = Array.from(searchTermMap.values());
    if (searchTerms.length > 0) {
      await db.saveSearchTerms(searchTerms);
      console.log(`  ✓ Saved ${searchTerms.length} search terms`);
    }

    // Fetch current budgets
    const campaigns = await this.adsClient.getCampaigns();
    const budgetsList = await this.adsClient.getBudgets();
    const budgetsMap = new Map(
      budgetsList.map((b) => [b.id, b.amountMicros / 1_000_000])
    );

    const budgets = new Map<string, { budgetId: string; amount: number }>();
    campaigns.forEach((campaign) => {
      const productSlug = this.campaignProductMap.get(campaign.id);
      if (productSlug) {
        const budgetAmount = budgetsMap.get(campaign.budgetId) || 0;
        budgets.set(productSlug, {
          budgetId: campaign.budgetId,
          amount: budgetAmount,
        });
      }
    });

    console.log(`  ✓ Fetched budgets for ${budgets.size} products`);

    return { performance, searchTerms, budgets };
  }
}
