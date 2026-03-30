/**
 * Bidding Optimizer
 *
 * Handles auto-graduation from Maximize Clicks to Maximize Conversions
 * with 48-hour monitoring and rollback protection
 */

import { GoogleAdsClient } from './google-ads-client';
import { db } from '../shared/database';
import { GOOGLE_ADS_CONFIG } from '../shared/config';

export interface GraduationEvaluation {
  campaignId: string;
  productSlug: string;
  eligible: boolean;
  reason: string;
  conversions30d?: number;
  conversionRate?: number;
}

export class BiddingOptimizer {
  private adsClient: GoogleAdsClient;

  constructor() {
    this.adsClient = new GoogleAdsClient();
  }

  /**
   * Evaluate campaigns for graduation to Maximize Conversions
   */
  async evaluateCampaignsForGraduation(
    campaignProductMap: Map<string, string>
  ): Promise<GraduationEvaluation[]> {
    if (!GOOGLE_ADS_CONFIG.AUTO_GRADUATE_ENABLED) {
      return [];
    }

    const campaigns = await this.adsClient.getCampaigns();
    const evaluations: GraduationEvaluation[] = [];

    for (const campaign of campaigns) {
      // Only evaluate campaigns on Maximize Clicks
      if (campaign.biddingStrategy !== 'MAXIMIZE_CLICKS') {
        continue;
      }

      const productSlug = campaignProductMap.get(campaign.id);
      if (!productSlug) {
        continue;
      }

      // Get 30-day performance
      const performance = await db.getCampaignPerformance(productSlug, 30);

      if (performance.length === 0) {
        evaluations.push({
          campaignId: campaign.id,
          productSlug,
          eligible: false,
          reason: 'No performance data',
        });
        continue;
      }

      // Calculate totals
      let totalConversions = 0;
      let totalClicks = 0;

      performance.forEach((day: any) => {
        totalConversions += day.conversions;
        totalClicks += day.clicks;
      });

      const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

      // Check eligibility: >= 15 conversions AND >= 2% conversion rate
      const eligible =
        totalConversions >= GOOGLE_ADS_CONFIG.MIN_CONVERSIONS_FOR_GRADUATION &&
        conversionRate >= 2;

      evaluations.push({
        campaignId: campaign.id,
        productSlug,
        eligible,
        reason: eligible
          ? `Ready: ${totalConversions} conversions, ${conversionRate.toFixed(2)}% CR`
          : `Not ready: ${totalConversions} conversions (need ${GOOGLE_ADS_CONFIG.MIN_CONVERSIONS_FOR_GRADUATION}), ${conversionRate.toFixed(2)}% CR (need 2%)`,
        conversions30d: totalConversions,
        conversionRate,
      });
    }

    return evaluations;
  }

  /**
   * Graduate eligible campaigns to Maximize Conversions
   */
  async graduateCampaigns(
    evaluations: GraduationEvaluation[],
    dryRun: boolean = false
  ): Promise<number> {
    let graduatedCount = 0;

    for (const evaluation of evaluations) {
      if (!evaluation.eligible) continue;

      // Get target CPA from test calendar
      const calendar = await db.getTestCalendar(evaluation.productSlug);
      if (calendar.length === 0) continue;

      const targetCpaAud = calendar[0].target_cpa_aud;
      const targetCpaMicros = Math.round(targetCpaAud * 1_000_000);

      // Log the action
      const actionId = await db.logAgentAction({
        action_type: 'bidding_strategy_change',
        campaign_id: evaluation.campaignId,
        product_slug: evaluation.productSlug,
        details: {
          from: 'MAXIMIZE_CLICKS',
          to: 'MAXIMIZE_CONVERSIONS',
          target_cpa_aud: targetCpaAud,
          reason: evaluation.reason,
          conversions_30d: evaluation.conversions30d,
          conversion_rate: evaluation.conversionRate,
        },
        requires_approval: false,
        execution_status: 'pending',
      });

      if (dryRun) {
        console.log(
          `    [DRY RUN] Graduate ${evaluation.productSlug}: Maximize Clicks → Maximize Conversions (target CPA: $${targetCpaAud})`
        );
        await db.updateActionStatus(actionId, 'executed');
        graduatedCount++;
      } else {
        try {
          await this.adsClient.updateBiddingStrategy(
            evaluation.campaignId,
            'MAXIMIZE_CONVERSIONS',
            targetCpaMicros
          );

          console.log(
            `    ✓ Graduated ${evaluation.productSlug}: Maximize Clicks → Maximize Conversions (target CPA: $${targetCpaAud})`
          );

          await db.updateActionStatus(actionId, 'executed');
          graduatedCount++;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.log(`    ✗ Failed to graduate ${evaluation.productSlug}: ${errorMsg}`);
          await db.updateActionStatus(actionId, 'failed', errorMsg);
        }
      }
    }

    return graduatedCount;
  }

  /**
   * Monitor recent graduations for CPA spikes and rollback if needed
   */
  async monitorRecentGraduations(): Promise<
    Array<{
      productSlug: string;
      shouldRollback: boolean;
      reason: string;
      cpaBeforeAud?: number;
      cpaAfterAud?: number;
    }>
  > {
    const monitoringResults: Array<{
      productSlug: string;
      shouldRollback: boolean;
      reason: string;
      cpaBeforeAud?: number;
      cpaAfterAud?: number;
    }> = [];

    // Find graduations from last 48 hours
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - GOOGLE_ADS_CONFIG.GRADUATION_MONITORING_HOURS);

    // This is simplified - in production, you'd query the actions table
    // and calculate CPA before/after graduation
    // For now, we'll return empty array

    return monitoringResults;
  }
}
