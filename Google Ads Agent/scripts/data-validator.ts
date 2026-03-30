/**
 * Data Validator
 *
 * Validates Google Ads data before saving to Supabase
 * Ensures data quality and flags anomalies
 */

import type {
  WeeklyCampaignSnapshot,
  WeeklyKeywordSnapshot,
  WeeklyAdCopySnapshot,
} from './weekly-data-collector';

export interface ValidationResult {
  isValid: boolean;
  score: number; // 0-100
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: {
    campaigns: { total: number; valid: number; invalid: number };
    keywords: { total: number; valid: number; invalid: number };
    adCopy: { total: number; valid: number; invalid: number };
  };
}

export interface ValidationError {
  type: 'campaign' | 'keyword' | 'ad_copy';
  id: string;
  field: string;
  issue: string;
  severity: 'critical' | 'error';
}

export interface ValidationWarning {
  type: 'campaign' | 'keyword' | 'ad_copy';
  id: string;
  issue: string;
  suggestedAction?: string;
}

export class DataValidator {
  private errors: ValidationError[] = [];
  private warnings: ValidationWarning[] = [];

  /**
   * Validate all weekly snapshot data
   */
  validate(
    campaigns: WeeklyCampaignSnapshot[],
    keywords: WeeklyKeywordSnapshot[],
    adCopy: WeeklyAdCopySnapshot[]
  ): ValidationResult {
    this.errors = [];
    this.warnings = [];

    // Validate campaigns
    const campaignStats = this.validateCampaigns(campaigns);

    // Validate keywords
    const keywordStats = this.validateKeywords(keywords);

    // Validate ad copy
    const adCopyStats = this.validateAdCopy(adCopy);

    // Calculate overall quality score
    const totalItems = campaigns.length + keywords.length + adCopy.length;
    const invalidItems = this.errors.filter((e) => e.severity === 'critical').length;
    const score = totalItems > 0 ? Math.round(((totalItems - invalidItems) / totalItems) * 100) : 100;

    const isValid = this.errors.filter((e) => e.severity === 'critical').length === 0;

    return {
      isValid,
      score,
      errors: this.errors,
      warnings: this.warnings,
      summary: {
        campaigns: campaignStats,
        keywords: keywordStats,
        adCopy: adCopyStats,
      },
    };
  }

  /**
   * Validate campaign snapshots
   */
  private validateCampaigns(
    campaigns: WeeklyCampaignSnapshot[]
  ): { total: number; valid: number; invalid: number } {
    let validCount = 0;
    let invalidCount = 0;

    for (const campaign of campaigns) {
      let isValid = true;

      // Critical validations
      if (!campaign.campaign_id) {
        this.errors.push({
          type: 'campaign',
          id: campaign.campaign_name || 'unknown',
          field: 'campaign_id',
          issue: 'Missing campaign_id',
          severity: 'critical',
        });
        isValid = false;
      }

      if (!campaign.campaign_name) {
        this.errors.push({
          type: 'campaign',
          id: campaign.campaign_id,
          field: 'campaign_name',
          issue: 'Missing campaign_name',
          severity: 'critical',
        });
        isValid = false;
      }

      if (!campaign.week_start_date || !campaign.week_end_date) {
        this.errors.push({
          type: 'campaign',
          id: campaign.campaign_id,
          field: 'week_dates',
          issue: 'Missing week start/end dates',
          severity: 'critical',
        });
        isValid = false;
      }

      // Numeric validations
      if (campaign.impressions < 0 || campaign.clicks < 0 || campaign.cost_micros < 0) {
        this.errors.push({
          type: 'campaign',
          id: campaign.campaign_id,
          field: 'metrics',
          issue: 'Negative metric values detected',
          severity: 'error',
        });
        isValid = false;
      }

      if (campaign.conversions < 0 || campaign.cac_aud < 0) {
        this.errors.push({
          type: 'campaign',
          id: campaign.campaign_id,
          field: 'conversions',
          issue: 'Negative conversion metrics',
          severity: 'error',
        });
        isValid = false;
      }

      // Logical validations
      if (campaign.clicks > campaign.impressions) {
        this.errors.push({
          type: 'campaign',
          id: campaign.campaign_id,
          field: 'clicks',
          issue: 'Clicks exceed impressions (impossible)',
          severity: 'error',
        });
        isValid = false;
      }

      if (campaign.conversions > campaign.clicks) {
        this.errors.push({
          type: 'campaign',
          id: campaign.campaign_id,
          field: 'conversions',
          issue: 'Conversions exceed clicks (impossible)',
          severity: 'error',
        });
        isValid = false;
      }

      // Warnings (non-blocking)
      if (campaign.campaign_status === 'ENABLED' && campaign.impressions === 0) {
        this.warnings.push({
          type: 'campaign',
          id: campaign.campaign_id,
          issue: `Active campaign "${campaign.campaign_name}" has 0 impressions this week`,
          suggestedAction: 'Check campaign settings and budget',
        });
      }

      if (campaign.daily_budget_aud === 0 && campaign.campaign_status === 'ENABLED') {
        this.warnings.push({
          type: 'campaign',
          id: campaign.campaign_id,
          issue: `Active campaign "${campaign.campaign_name}" has $0 daily budget`,
          suggestedAction: 'Set a budget or pause campaign',
        });
      }

      if (campaign.ctr > 20) {
        this.warnings.push({
          type: 'campaign',
          id: campaign.campaign_id,
          issue: `Unusually high CTR (${campaign.ctr}%) - possible data anomaly`,
          suggestedAction: 'Verify data accuracy',
        });
      }

      if (campaign.conversion_rate > 50) {
        this.warnings.push({
          type: 'campaign',
          id: campaign.campaign_id,
          issue: `Unusually high conversion rate (${campaign.conversion_rate}%) - possible tracking issue`,
          suggestedAction: 'Check conversion tracking setup',
        });
      }

      if (campaign.product_slug === 'unknown') {
        this.warnings.push({
          type: 'campaign',
          id: campaign.campaign_id,
          issue: `Campaign not mapped to product slug`,
          suggestedAction: 'Add to CAMPAIGN_PRODUCT_MAP in index-weekly.ts',
        });
      }

      if (isValid) validCount++;
      else invalidCount++;
    }

    return { total: campaigns.length, valid: validCount, invalid: invalidCount };
  }

  /**
   * Validate keyword snapshots
   */
  private validateKeywords(
    keywords: WeeklyKeywordSnapshot[]
  ): { total: number; valid: number; invalid: number } {
    let validCount = 0;
    let invalidCount = 0;

    for (const keyword of keywords) {
      let isValid = true;

      // Critical validations
      if (!keyword.keyword_text || keyword.keyword_text.trim() === '') {
        this.errors.push({
          type: 'keyword',
          id: `${keyword.campaign_id}_${keyword.ad_group_id}`,
          field: 'keyword_text',
          issue: 'Empty keyword text',
          severity: 'critical',
        });
        isValid = false;
      }

      if (!keyword.match_type) {
        this.errors.push({
          type: 'keyword',
          id: keyword.keyword_text,
          field: 'match_type',
          issue: 'Missing match type',
          severity: 'error',
        });
        isValid = false;
      }

      // Numeric validations
      if (keyword.impressions < 0 || keyword.clicks < 0 || keyword.cost_micros < 0) {
        this.errors.push({
          type: 'keyword',
          id: keyword.keyword_text,
          field: 'metrics',
          issue: 'Negative metric values',
          severity: 'error',
        });
        isValid = false;
      }

      if (keyword.clicks > keyword.impressions) {
        this.errors.push({
          type: 'keyword',
          id: keyword.keyword_text,
          field: 'clicks',
          issue: 'Clicks exceed impressions',
          severity: 'error',
        });
        isValid = false;
      }

      // Warnings
      if (keyword.cpc_bid_aud > 50) {
        this.warnings.push({
          type: 'keyword',
          id: keyword.keyword_text,
          issue: `Very high CPC bid ($${keyword.cpc_bid_aud}) for keyword "${keyword.keyword_text}"`,
          suggestedAction: 'Review bid strategy',
        });
      }

      if (keyword.cac_aud > 100) {
        this.warnings.push({
          type: 'keyword',
          id: keyword.keyword_text,
          issue: `High CAC ($${keyword.cac_aud}) for keyword "${keyword.keyword_text}"`,
          suggestedAction: 'Consider pausing or adjusting bids',
        });
      }

      if (isValid) validCount++;
      else invalidCount++;
    }

    return { total: keywords.length, valid: validCount, invalid: invalidCount };
  }

  /**
   * Validate ad copy snapshots
   */
  private validateAdCopy(
    adCopy: WeeklyAdCopySnapshot[]
  ): { total: number; valid: number; invalid: number } {
    let validCount = 0;
    let invalidCount = 0;

    for (const ad of adCopy) {
      let isValid = true;

      // Critical validations
      if (!ad.ad_id) {
        this.errors.push({
          type: 'ad_copy',
          id: `${ad.campaign_id}_${ad.ad_group_id}`,
          field: 'ad_id',
          issue: 'Missing ad_id',
          severity: 'critical',
        });
        isValid = false;
      }

      if (!ad.headlines || ad.headlines.length === 0) {
        this.errors.push({
          type: 'ad_copy',
          id: ad.ad_id,
          field: 'headlines',
          issue: 'No headlines found',
          severity: 'critical',
        });
        isValid = false;
      }

      if (!ad.descriptions || ad.descriptions.length === 0) {
        this.errors.push({
          type: 'ad_copy',
          id: ad.ad_id,
          field: 'descriptions',
          issue: 'No descriptions found',
          severity: 'critical',
        });
        isValid = false;
      }

      if (!ad.final_url || ad.final_url === '') {
        this.errors.push({
          type: 'ad_copy',
          id: ad.ad_id,
          field: 'final_url',
          issue: 'Missing final URL',
          severity: 'error',
        });
        isValid = false;
      }

      // Numeric validations
      if (ad.impressions < 0 || ad.clicks < 0 || ad.conversions < 0) {
        this.errors.push({
          type: 'ad_copy',
          id: ad.ad_id,
          field: 'metrics',
          issue: 'Negative metric values',
          severity: 'error',
        });
        isValid = false;
      }

      if (ad.clicks > ad.impressions) {
        this.errors.push({
          type: 'ad_copy',
          id: ad.ad_id,
          field: 'clicks',
          issue: 'Clicks exceed impressions',
          severity: 'error',
        });
        isValid = false;
      }

      // Warnings
      if (ad.ad_status === 'ENABLED' && ad.impressions === 0) {
        this.warnings.push({
          type: 'ad_copy',
          id: ad.ad_id,
          issue: 'Active ad has 0 impressions this week',
          suggestedAction: 'Check ad strength or ad group settings',
        });
      }

      if (ad.headlines && ad.headlines.length < 3) {
        this.warnings.push({
          type: 'ad_copy',
          id: ad.ad_id,
          issue: `Only ${ad.headlines.length} headlines (RSA should have 3-15)`,
          suggestedAction: 'Add more headlines for better performance',
        });
      }

      if (ad.ctr > 30) {
        this.warnings.push({
          type: 'ad_copy',
          id: ad.ad_id,
          issue: `Unusually high CTR (${ad.ctr}%) - possible data anomaly`,
          suggestedAction: 'Verify data accuracy',
        });
      }

      if (isValid) validCount++;
      else invalidCount++;
    }

    return { total: adCopy.length, valid: validCount, invalid: invalidCount };
  }

  /**
   * Print validation report to console
   */
  static printReport(result: ValidationResult): void {
    console.log('\n📋 Data Validation Report');
    console.log('═══════════════════════════════════════\n');

    // Overall score
    const scoreEmoji = result.score >= 95 ? '🟢' : result.score >= 80 ? '🟡' : '🔴';
    console.log(`${scoreEmoji} Overall Quality Score: ${result.score}/100`);
    console.log(`   Status: ${result.isValid ? '✅ PASS' : '❌ FAIL'}\n`);

    // Summary
    console.log('Summary:');
    console.log(
      `  Campaigns:  ${result.summary.campaigns.valid}/${result.summary.campaigns.total} valid`
    );
    console.log(
      `  Keywords:   ${result.summary.keywords.valid}/${result.summary.keywords.total} valid`
    );
    console.log(`  Ad Copy:    ${result.summary.adCopy.valid}/${result.summary.adCopy.total} valid`);

    // Errors
    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach((error, i) => {
        console.log(`  ${i + 1}. [${error.type.toUpperCase()}] ${error.id}`);
        console.log(`     Field: ${error.field}`);
        console.log(`     Issue: ${error.issue}`);
        console.log(`     Severity: ${error.severity}\n`);
      });
    }

    // Warnings
    if (result.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      const maxWarningsToShow = 10;
      const warningsToShow = result.warnings.slice(0, maxWarningsToShow);

      warningsToShow.forEach((warning, i) => {
        console.log(`  ${i + 1}. [${warning.type.toUpperCase()}] ${warning.id}`);
        console.log(`     ${warning.issue}`);
        if (warning.suggestedAction) {
          console.log(`     → ${warning.suggestedAction}`);
        }
        console.log('');
      });

      if (result.warnings.length > maxWarningsToShow) {
        console.log(
          `  ... and ${result.warnings.length - maxWarningsToShow} more warnings\n`
        );
      }
    }

    if (result.errors.length === 0 && result.warnings.length === 0) {
      console.log('\n✨ No issues found! Data quality is excellent.\n');
    }

    console.log('═══════════════════════════════════════\n');
  }
}
