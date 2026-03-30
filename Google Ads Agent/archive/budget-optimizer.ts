/**
 * Budget Optimizer
 *
 * Executes budget changes via Google Ads API
 */

import { GoogleAdsClient } from './google-ads-client';
import { db } from '../shared/database';
import { BudgetRecommendation } from './seasonality-engine';

export interface BudgetChangeResult {
  productSlug: string;
  productName: string;
  success: boolean;
  error?: string;
  oldBudgetAud: number;
  newBudgetAud: number;
  actionId?: number;
}

export class BudgetOptimizer {
  private adsClient: GoogleAdsClient;

  constructor() {
    this.adsClient = new GoogleAdsClient();
  }

  /**
   * Execute budget changes
   */
  async executeBudgetChanges(
    recommendations: BudgetRecommendation[],
    budgets: Map<string, { budgetId: string; amount: number }>,
    dryRun: boolean = false
  ): Promise<BudgetChangeResult[]> {
    const results: BudgetChangeResult[] = [];

    for (const rec of recommendations) {
      // Skip if change is less than $1
      if (Math.abs(rec.changeAud) < 1) {
        console.log(`    Skip ${rec.productName}: Change too small ($${rec.changeAud.toFixed(2)})`);
        continue;
      }

      // Skip if should pause
      if (rec.shouldPause) {
        console.log(`    ⚠️  ${rec.productName}: ${rec.pauseReason}`);
        // This will be handled by the main orchestrator
        continue;
      }

      const budgetInfo = budgets.get(rec.productSlug);
      if (!budgetInfo) {
        console.log(`    ⚠️  ${rec.productName}: No budget found`);
        continue;
      }

      // Log the action first
      const actionId = await db.logAgentAction({
        action_type: 'budget_change',
        product_slug: rec.productSlug,
        details: {
          old_budget_aud: rec.currentBudgetAud,
          new_budget_aud: rec.recommendedBudgetAud,
          change_aud: rec.changeAud,
          change_percentage: rec.changePercentage,
          reason: rec.reason,
          seasonality_multiplier: rec.seasonalityMultiplier,
          weeks_until_test: rec.weeksUntilTest,
        },
        requires_approval: false,
        execution_status: 'pending',
      });

      if (dryRun) {
        console.log(
          `    [DRY RUN] ${rec.productName}: $${rec.currentBudgetAud.toFixed(2)} → $${rec.recommendedBudgetAud.toFixed(2)} (${rec.changePercentage > 0 ? '+' : ''}${rec.changePercentage.toFixed(1)}%)`
        );
        await db.updateActionStatus(actionId, 'executed');
        results.push({
          productSlug: rec.productSlug,
          productName: rec.productName,
          success: true,
          oldBudgetAud: rec.currentBudgetAud,
          newBudgetAud: rec.recommendedBudgetAud,
          actionId,
        });
      } else {
        try {
          const newBudgetMicros = Math.round(rec.recommendedBudgetAud * 1_000_000);
          await this.adsClient.updateCampaignBudget(budgetInfo.budgetId, newBudgetMicros);

          console.log(
            `    ✓ ${rec.productName}: $${rec.currentBudgetAud.toFixed(2)} → $${rec.recommendedBudgetAud.toFixed(2)} (${rec.changePercentage > 0 ? '+' : ''}${rec.changePercentage.toFixed(1)}%)`
          );

          await db.updateActionStatus(actionId, 'executed');
          results.push({
            productSlug: rec.productSlug,
            productName: rec.productName,
            success: true,
            oldBudgetAud: rec.currentBudgetAud,
            newBudgetAud: rec.recommendedBudgetAud,
            actionId,
          });
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.log(`    ✗ ${rec.productName}: Failed - ${errorMsg}`);

          await db.updateActionStatus(actionId, 'failed', errorMsg);
          results.push({
            productSlug: rec.productSlug,
            productName: rec.productName,
            success: false,
            error: errorMsg,
            oldBudgetAud: rec.currentBudgetAud,
            newBudgetAud: rec.recommendedBudgetAud,
            actionId,
          });
        }
      }
    }

    return results;
  }

  /**
   * Pause campaigns that exceed CPA thresholds
   */
  async pauseUnderperformingCampaigns(
    recommendations: BudgetRecommendation[],
    campaignProductMap: Map<string, string>,
    dryRun: boolean = false
  ): Promise<number> {
    let pausedCount = 0;

    // Reverse the map to go from product to campaign
    const productCampaignMap = new Map<string, string>();
    campaignProductMap.forEach((product, campaign) => {
      productCampaignMap.set(product, campaign);
    });

    for (const rec of recommendations) {
      if (!rec.shouldPause) continue;

      const campaignId = productCampaignMap.get(rec.productSlug);
      if (!campaignId) {
        console.log(`    ⚠️  ${rec.productName}: No campaign ID found`);
        continue;
      }

      const actionId = await db.logAgentAction({
        action_type: 'pause_campaign',
        campaign_id: campaignId,
        product_slug: rec.productSlug,
        details: {
          reason: rec.pauseReason,
        },
        requires_approval: false,
        execution_status: 'pending',
      });

      if (dryRun) {
        console.log(`    [DRY RUN] Pause ${rec.productName}: ${rec.pauseReason}`);
        await db.updateActionStatus(actionId, 'executed');
        pausedCount++;
      } else {
        try {
          await this.adsClient.pauseCampaign(campaignId);
          console.log(`    ✓ Paused ${rec.productName}: ${rec.pauseReason}`);
          await db.updateActionStatus(actionId, 'executed');
          pausedCount++;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.log(`    ✗ Failed to pause ${rec.productName}: ${errorMsg}`);
          await db.updateActionStatus(actionId, 'failed', errorMsg);
        }
      }
    }

    return pausedCount;
  }
}
