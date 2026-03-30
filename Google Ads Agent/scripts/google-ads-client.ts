/**
 * Google Ads API Client
 *
 * Wrapper around the google-ads-api library for easier usage
 */

import { GoogleAdsApi, Customer } from 'google-ads-api';
import dotenv from 'dotenv';

dotenv.config();

export interface Campaign {
  id: string;
  name: string;
  status: string;
  budgetId: string;
  biddingStrategy: string;
}

export interface CampaignMetrics {
  campaignId: string;
  campaignName: string;
  campaignStatus: string;  // ENABLED, PAUSED, REMOVED
  date: string;
  impressions: number;
  clicks: number;
  costMicros: number;
  conversions: number;
  conversionValueMicros: number;
}

export interface SearchTermData {
  campaignId: string;
  searchTerm: string;
  impressions: number;
  clicks: number;
  costMicros: number;
  conversions: number;
}

export interface KeywordData {
  campaignId: string;
  campaignName: string;
  adGroupId: string;
  adGroupName: string;
  keywordText: string;
  matchType: string;
  cpcBidMicros: number;
  impressions: number;
  clicks: number;
  costMicros: number;
  conversions: number;
  ctr: number;
}

export interface AdCopyData {
  campaignId: string;
  campaignName: string;
  adGroupId: string;
  adId: string;
  headlines: string[];
  descriptions: string[];
  finalUrl: string;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
}

export interface Budget {
  id: string;
  name: string;
  amountMicros: number;
}

export class GoogleAdsClient {
  private client: GoogleAdsApi;
  private customer: Customer;
  private customerId: string;

  constructor() {
    const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;
    const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;

    if (!clientId || !clientSecret || !developerToken || !refreshToken || !customerId) {
      throw new Error(
        'Missing Google Ads API credentials. Please add GOOGLE_ADS_* variables to your .env file.'
      );
    }

    this.customerId = customerId.replace(/-/g, '');

    this.client = new GoogleAdsApi({
      client_id: clientId,
      client_secret: clientSecret,
      developer_token: developerToken,
    });

    this.customer = this.client.Customer({
      customer_id: this.customerId,
      refresh_token: refreshToken,
    });
  }

  /**
   * Get all campaigns
   */
  async getCampaigns(): Promise<Campaign[]> {
    try {
      const query = `
        SELECT
          campaign.id,
          campaign.name,
          campaign.status,
          campaign.campaign_budget,
          campaign.bidding_strategy_type
        FROM campaign
        WHERE campaign.status != 'REMOVED'
        ORDER BY campaign.name
      `;

      const results = await this.customer.query(query);

      return results.map((row: any) => ({
        id: row.campaign.id.toString(),
        name: row.campaign.name,
        status: row.campaign.status,
        budgetId: row.campaign.campaign_budget,
        biddingStrategy: row.campaign.bidding_strategy_type,
      }));
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      throw error;
    }
  }

  /**
   * Get campaign performance metrics for a date range
   */
  async getCampaignMetrics(
    startDate: string,
    endDate: string
  ): Promise<CampaignMetrics[]> {
    try {
      const query = `
        SELECT
          campaign.id,
          campaign.name,
          campaign.status,
          segments.date,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.conversions_value
        FROM campaign
        WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
          AND campaign.status != 'REMOVED'
        ORDER BY segments.date DESC, campaign.name
      `;

      const results = await this.customer.query(query);

      return results.map((row: any) => ({
        campaignId: row.campaign.id.toString(),
        campaignName: row.campaign.name,
        campaignStatus: row.campaign.status,
        date: row.segments.date,
        impressions: row.metrics.impressions,
        clicks: row.metrics.clicks,
        costMicros: row.metrics.cost_micros,
        conversions: row.metrics.conversions,
        conversionValueMicros: row.metrics.conversions_value,
      }));
    } catch (error) {
      console.error('Error fetching campaign metrics:', error);
      throw error;
    }
  }

  /**
   * Get search terms for negative keyword analysis
   */
  async getSearchTerms(
    startDate: string,
    endDate: string
  ): Promise<SearchTermData[]> {
    try {
      const query = `
        SELECT
          campaign.id,
          search_term_view.search_term,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions
        FROM search_term_view
        WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
          AND campaign.status != 'REMOVED'
        ORDER BY metrics.clicks DESC
      `;

      const results = await this.customer.query(query);

      return results.map((row: any) => ({
        campaignId: row.campaign.id.toString(),
        searchTerm: row.search_term_view.search_term,
        impressions: row.metrics.impressions,
        clicks: row.metrics.clicks,
        costMicros: row.metrics.cost_micros,
        conversions: row.metrics.conversions,
      }));
    } catch (error) {
      console.error('Error fetching search terms:', error);
      throw error;
    }
  }

  /**
   * Get keywords with performance data (for AI analysis)
   */
  async getKeywords(startDate: string, endDate: string): Promise<KeywordData[]> {
    try {
      const query = `
        SELECT
          campaign.id,
          campaign.name,
          ad_group.id,
          ad_group.name,
          ad_group_criterion.keyword.text,
          ad_group_criterion.keyword.match_type,
          ad_group_criterion.cpc_bid_micros,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.ctr
        FROM keyword_view
        WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
          AND campaign.status = 'ENABLED'
          AND ad_group.status = 'ENABLED'
          AND ad_group_criterion.status IN ('ENABLED', 'PAUSED')
        ORDER BY metrics.impressions DESC
        LIMIT 100
      `;

      const results = await this.customer.query(query);

      return results.map((row: any) => ({
        campaignId: row.campaign.id.toString(),
        campaignName: row.campaign.name,
        adGroupId: row.ad_group.id.toString(),
        adGroupName: row.ad_group.name,
        keywordText: row.ad_group_criterion.keyword.text,
        matchType: row.ad_group_criterion.keyword.match_type,
        cpcBidMicros: row.ad_group_criterion.cpc_bid_micros || 0,
        impressions: row.metrics.impressions,
        clicks: row.metrics.clicks,
        costMicros: row.metrics.cost_micros,
        conversions: row.metrics.conversions,
        ctr: row.metrics.ctr,
      }));
    } catch (error) {
      console.error('Error fetching keywords:', error);
      throw error;
    }
  }

  /**
   * Get ad copy with performance data (for AI analysis)
   */
  async getAdCopy(startDate: string, endDate: string): Promise<AdCopyData[]> {
    try {
      const query = `
        SELECT
          campaign.id,
          campaign.name,
          ad_group.id,
          ad_group_ad.ad.id,
          ad_group_ad.ad.responsive_search_ad.headlines,
          ad_group_ad.ad.responsive_search_ad.descriptions,
          ad_group_ad.ad.final_urls,
          metrics.impressions,
          metrics.clicks,
          metrics.conversions,
          metrics.ctr
        FROM ad_group_ad
        WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
          AND campaign.status = 'ENABLED'
          AND ad_group_ad.status = 'ENABLED'
          AND ad_group_ad.ad.type = 'RESPONSIVE_SEARCH_AD'
        ORDER BY metrics.impressions DESC
        LIMIT 50
      `;

      const results = await this.customer.query(query);

      return results.map((row: any) => {
        const ad = row.ad_group_ad.ad.responsive_search_ad;
        return {
          campaignId: row.campaign.id.toString(),
          campaignName: row.campaign.name,
          adGroupId: row.ad_group.id.toString(),
          adId: row.ad_group_ad.ad.id.toString(),
          headlines: ad.headlines?.map((h: any) => h.text) || [],
          descriptions: ad.descriptions?.map((d: any) => d.text) || [],
          finalUrl: row.ad_group_ad.ad.final_urls?.[0] || '',
          impressions: row.metrics.impressions,
          clicks: row.metrics.clicks,
          conversions: row.metrics.conversions,
          ctr: row.metrics.ctr,
        };
      });
    } catch (error) {
      console.error('Error fetching ad copy:', error);
      throw error;
    }
  }

  /**
   * Get campaign budgets
   */
  async getBudgets(): Promise<Budget[]> {
    try {
      const query = `
        SELECT
          campaign_budget.id,
          campaign_budget.name,
          campaign_budget.amount_micros
        FROM campaign_budget
        ORDER BY campaign_budget.name
      `;

      const results = await this.customer.query(query);

      return results.map((row: any) => ({
        id: row.campaign_budget.id.toString(),
        name: row.campaign_budget.name,
        amountMicros: row.campaign_budget.amount_micros,
      }));
    } catch (error) {
      console.error('Error fetching budgets:', error);
      throw error;
    }
  }

  /**
   * Get all ads for all campaigns (regardless of status)
   */
  async getAllAds(): Promise<AdCopyData[]> {
    try {
      const query = `
        SELECT
          campaign.id,
          campaign.name,
          campaign.status,
          ad_group.id,
          ad_group.name,
          ad_group_ad.ad.id,
          ad_group_ad.ad.responsive_search_ad.headlines,
          ad_group_ad.ad.responsive_search_ad.descriptions,
          ad_group_ad.ad.final_urls,
          ad_group_ad.status
        FROM ad_group_ad
        WHERE ad_group_ad.ad.type = 'RESPONSIVE_SEARCH_AD'
        ORDER BY campaign.name, ad_group.name
      `;

      const results = await this.customer.query(query);

      return results.map((row: any) => {
        const ad = row.ad_group_ad.ad.responsive_search_ad;
        return {
          campaignId: row.campaign.id.toString(),
          campaignName: row.campaign.name,
          campaignStatus: row.campaign.status,
          adGroupId: row.ad_group.id.toString(),
          adGroupName: row.ad_group.name,
          adId: row.ad_group_ad.ad.id.toString(),
          adStatus: row.ad_group_ad.status,
          headlines: ad.headlines?.map((h: any) => h.text) || [],
          descriptions: ad.descriptions?.map((d: any) => d.text) || [],
          finalUrl: row.ad_group_ad.ad.final_urls?.[0] || '',
          impressions: 0,
          clicks: 0,
          conversions: 0,
          ctr: 0,
        };
      });
    } catch (error) {
      console.error('Error fetching all ads:', error);
      throw error;
    }
  }

  /**
   * Update a campaign budget
   */
  async updateCampaignBudget(
    budgetId: string,
    newAmountMicros: number
  ): Promise<void> {
    try {
      await this.customer.campaignBudgets.update([{
        resource_name: `customers/${this.customerId}/campaignBudgets/${budgetId}`,
        amount_micros: newAmountMicros,
      }]);
    } catch (error) {
      console.error('Error updating campaign budget:', error);
      throw error;
    }
  }

  /**
   * Update campaign bidding strategy
   */
  async updateBiddingStrategy(
    campaignId: string,
    strategyType: 'MAXIMIZE_CONVERSIONS' | 'MAXIMIZE_CLICKS',
    targetCpaMicros?: number
  ): Promise<void> {
    try {
      const updates: any = {
        resource_name: `customers/${this.customerId}/campaigns/${campaignId}`,
        bidding_strategy_type: strategyType,
      };

      if (strategyType === 'MAXIMIZE_CONVERSIONS' && targetCpaMicros) {
        updates.maximize_conversions = {
          target_cpa_micros: targetCpaMicros,
        };
      }

      await this.customer.campaigns.update(updates);
    } catch (error) {
      console.error('Error updating bidding strategy:', error);
      throw error;
    }
  }

  /**
   * Pause a campaign
   */
  async pauseCampaign(campaignId: string): Promise<void> {
    try {
      await this.customer.campaigns.update([{
        resource_name: `customers/${this.customerId}/campaigns/${campaignId}`,
        status: 'PAUSED',
      }]);
    } catch (error) {
      console.error('Error pausing campaign:', error);
      throw error;
    }
  }

  /**
   * Enable a campaign
   */
  async enableCampaign(campaignId: string): Promise<void> {
    try {
      await this.customer.campaigns.update([{
        resource_name: `customers/${this.customerId}/campaigns/${campaignId}`,
        status: 'ENABLED',
      }]);
    } catch (error) {
      console.error('Error enabling campaign:', error);
      throw error;
    }
  }

  /**
   * Add negative keywords to a campaign
   */
  async addNegativeKeywords(
    campaignId: string,
    keywords: string[],
    matchType: 'EXACT' | 'PHRASE' | 'BROAD' = 'PHRASE'
  ): Promise<void> {
    try {
      const operations = keywords.map((keyword) => ({
        create: {
          campaign: `customers/${this.customerId}/campaigns/${campaignId}`,
          keyword: {
            text: keyword,
            match_type: matchType,
          },
        },
      }));

      await this.customer.campaignCriteria.create(operations);
    } catch (error) {
      console.error('Error adding negative keywords:', error);
      throw error;
    }
  }
}
