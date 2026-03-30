/**
 * Seasonality Engine
 *
 * The brain of the budget optimization system. Calculates intelligent
 * budget recommendations based on:
 * - Test proximity (weeks until test)
 * - Monthly intensity scores
 * - Historical performance
 * - CPA thresholds
 */

import { db, TestCalendar } from '../shared/database';
import { GENERAL_CONFIG } from '../shared/config';

export interface BudgetRecommendation {
  productSlug: string;
  productName: string;
  currentBudgetAud: number;
  recommendedBudgetAud: number;
  changePercentage: number;
  changeAud: number;
  reason: string;
  shouldPause: boolean;
  pauseReason?: string;
  weeksUntilTest: number;
  seasonalityMultiplier: number;
}

export class SeasonalityEngine {
  private testCalendar: TestCalendar[] = [];
  private today: Date;

  constructor() {
    this.today = new Date();
  }

  /**
   * Initialize by loading test calendar
   */
  async initialize(): Promise<void> {
    this.testCalendar = await db.getTestCalendar();
    console.log(`  Loaded ${this.testCalendar.length} products from test calendar`);
  }

  /**
   * Calculate weeks until test
   */
  private getWeeksUntilTest(testDate: string): number {
    const test = new Date(testDate);
    const diffMs = test.getTime() - this.today.getTime();
    const diffWeeks = diffMs / (1000 * 60 * 60 * 24 * 7);
    return Math.round(diffWeeks);
  }

  /**
   * Get monthly intensity for current month
   */
  private getMonthlyIntensity(product: TestCalendar): number {
    const month = this.today.getMonth(); // 0-11
    const intensities = [
      product.intensity_jan,
      product.intensity_feb,
      product.intensity_mar,
      product.intensity_apr,
      product.intensity_may,
      product.intensity_jun,
      product.intensity_jul,
      product.intensity_aug,
      product.intensity_sep,
      product.intensity_oct,
      product.intensity_nov,
      product.intensity_dec,
    ];
    return intensities[month];
  }

  /**
   * Calculate seasonality multiplier based on test proximity and monthly intensity
   */
  private calculateSeasonalityMultiplier(
    product: TestCalendar,
    weeksUntilTest: number
  ): number {
    const monthlyIntensity = this.getMonthlyIntensity(product);

    // Proximity boost based on weeks until test
    let proximityBoost = 1.0;
    if (weeksUntilTest <= 4) {
      proximityBoost = 1.5; // 1-4 weeks: aggressive
    } else if (weeksUntilTest <= 8) {
      proximityBoost = 1.25; // 5-8 weeks: moderate
    } else if (weeksUntilTest <= 12) {
      proximityBoost = 1.1; // 9-12 weeks: slight
    }

    // Combine monthly intensity with proximity boost
    const combined = monthlyIntensity * proximityBoost;

    // Cap at 2x to prevent excessive spending
    return Math.min(combined, 2.0);
  }

  /**
   * Check if campaign should be paused based on CPA performance
   */
  private async shouldPauseCampaign(
    productSlug: string,
    pauseCpaThreshold: number
  ): Promise<{ shouldPause: boolean; reason?: string; actualCpa?: number }> {
    // Get last 7 days of performance
    const performance = await db.getCampaignPerformance(productSlug, 7);

    if (performance.length === 0) {
      return { shouldPause: false };
    }

    // Calculate average CPA over last 7 days
    let totalCost = 0;
    let totalConversions = 0;

    performance.forEach((day: any) => {
      totalCost += day.cost_aud;
      totalConversions += day.conversions;
    });

    if (totalConversions === 0) {
      // No conversions in 7 days - check if we've spent more than 2x target CPA
      const product = this.testCalendar.find((p) => p.product_slug === productSlug);
      if (product && totalCost > product.target_cpa_aud * 2) {
        return {
          shouldPause: true,
          reason: `No conversions in 7 days with $${totalCost.toFixed(2)} spent (> 2x target CPA)`,
        };
      }
      return { shouldPause: false };
    }

    const avgCpa = totalCost / totalConversions;

    if (avgCpa > pauseCpaThreshold) {
      return {
        shouldPause: true,
        reason: `CPA ($${avgCpa.toFixed(2)}) exceeds pause threshold ($${pauseCpaThreshold})`,
        actualCpa: avgCpa,
      };
    }

    return { shouldPause: false };
  }

  /**
   * Calculate budget recommendations for all products
   */
  async calculateBudgetRecommendations(
    currentBudgets: Map<string, number>
  ): Promise<BudgetRecommendation[]> {
    const recommendations: BudgetRecommendation[] = [];

    for (const product of this.testCalendar) {
      const currentBudget = currentBudgets.get(product.product_slug) || 0;
      const weeksUntilTest = this.getWeeksUntilTest(product.test_date_primary);
      const seasonalityMultiplier = this.calculateSeasonalityMultiplier(
        product,
        weeksUntilTest
      );

      // Calculate target budget based on seasonality
      let targetBudget = product.base_daily_budget_aud * seasonalityMultiplier;

      // Apply min/max constraints
      targetBudget = Math.max(product.min_daily_budget_aud, targetBudget);
      targetBudget = Math.min(product.max_daily_budget_aud, targetBudget);

      // Apply weekly change limit (±25%)
      const maxChange = currentBudget * (GENERAL_CONFIG.WEEKLY_CHANGE_LIMIT_PERCENTAGE / 100);
      const maxIncrease = currentBudget + maxChange;
      const maxDecrease = currentBudget - maxChange;

      if (targetBudget > maxIncrease) {
        targetBudget = maxIncrease;
      } else if (targetBudget < maxDecrease && currentBudget > 0) {
        targetBudget = maxDecrease;
      }

      // Round to 2 decimal places
      targetBudget = Math.round(targetBudget * 100) / 100;

      const changeAud = targetBudget - currentBudget;
      const changePercentage =
        currentBudget > 0 ? (changeAud / currentBudget) * 100 : 0;

      // Generate reason
      let reason = `Seasonality: ${seasonalityMultiplier.toFixed(2)}x (`;
      reason += `${weeksUntilTest} weeks to test, `;
      reason += `intensity: ${this.getMonthlyIntensity(product).toFixed(1)}x)`;

      // Check if should pause
      const pauseCheck = await this.shouldPauseCampaign(
        product.product_slug,
        product.pause_cpa_aud
      );

      recommendations.push({
        productSlug: product.product_slug,
        productName: product.product_name,
        currentBudgetAud: currentBudget,
        recommendedBudgetAud: targetBudget,
        changePercentage,
        changeAud,
        reason,
        shouldPause: pauseCheck.shouldPause,
        pauseReason: pauseCheck.reason,
        weeksUntilTest,
        seasonalityMultiplier,
      });
    }

    // Apply global budget cap - scale down if total exceeds $150/day
    const totalRecommended = recommendations.reduce(
      (sum, rec) => sum + rec.recommendedBudgetAud,
      0
    );

    if (totalRecommended > GENERAL_CONFIG.DAILY_BUDGET_CAP_AUD) {
      const scaleFactor = GENERAL_CONFIG.DAILY_BUDGET_CAP_AUD / totalRecommended;
      recommendations.forEach((rec) => {
        rec.recommendedBudgetAud = Math.round(rec.recommendedBudgetAud * scaleFactor * 100) / 100;
        rec.changeAud = rec.recommendedBudgetAud - rec.currentBudgetAud;
        rec.changePercentage =
          rec.currentBudgetAud > 0
            ? (rec.changeAud / rec.currentBudgetAud) * 100
            : 0;
        rec.reason += ` [Scaled by ${(scaleFactor * 100).toFixed(1)}% to meet $${GENERAL_CONFIG.DAILY_BUDGET_CAP_AUD} cap]`;
      });
    }

    return recommendations;
  }

  /**
   * Get summary of current seasonality state
   */
  getSummary(): string {
    const summaries = this.testCalendar.map((product) => {
      const weeks = this.getWeeksUntilTest(product.test_date_primary);
      const intensity = this.getMonthlyIntensity(product);
      const multiplier = this.calculateSeasonalityMultiplier(product, weeks);

      return `  • ${product.product_name}: ${weeks} weeks to test, intensity ${intensity.toFixed(1)}x, multiplier ${multiplier.toFixed(2)}x`;
    });

    return summaries.join('\n');
  }
}
