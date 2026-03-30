/**
 * Rules Engine
 *
 * Enforces hard rules and constraints on AI recommendations
 * Validates recommendations before execution
 */

export interface Campaign {
  campaign_id: string;
  campaign_name: string;
  product_slug: string;
  daily_budget_aud: number;
  cac_aud: number;
  conversions: number;
  seasonal_phase: string;
  weeks_until_test: number | null;
  test_date: string | null;
  max_daily_budget_aud: number;
  min_daily_budget_aud: number;
  target_cpa_aud: number;
  pause_cpa_aud: number;
  recommended_budget_aud: number;
  registration_deadline?: string | null;
}

export interface Recommendation {
  action_id: string;
  type: string;
  campaign_id?: string;
  action: string;
  confidence: number;
  details: any;
}

export interface RuleViolation {
  rule: string;
  severity: 'error' | 'warning';
  message: string;
  recommendation_id: string;
}

export interface ValidationResult {
  isValid: boolean;
  violations: RuleViolation[];
  recommendations: {
    approved: Recommendation[];
    rejected: Recommendation[];
    warning: Recommendation[];
  };
}

export class RulesEngine {
  /**
   * Build hard rules section for Claude prompt
   */
  static buildRulesPrompt(campaigns: Campaign[]): string {
    const lines: string[] = [];

    lines.push('# HARD RULES (NON-NEGOTIABLE - YOU MUST FOLLOW THESE)');
    lines.push('');
    lines.push('You MUST follow these rules when making recommendations:');
    lines.push('');

    // Budget constraints
    lines.push('## 💰 RULE 1: Budget Constraints');
    lines.push('');
    for (const c of campaigns) {
      const maxIncrease = (c.daily_budget_aud * 1.25).toFixed(2);
      const maxDecrease = (c.daily_budget_aud * 0.75).toFixed(2);

      lines.push(`### Campaign: ${c.campaign_name}`);
      lines.push(`- Current Budget: $${c.daily_budget_aud}/day`);
      lines.push(`- Min Budget: $${c.min_daily_budget_aud}/day (HARD FLOOR)`);
      lines.push(`- Max Budget: $${c.max_daily_budget_aud}/day (HARD CEILING)`);
      lines.push(`- Max Increase This Week: $${maxIncrease}/day (+25% limit)`);
      lines.push(`- Max Decrease This Week: $${maxDecrease}/day (-25% limit)`);
      lines.push(`- ❌ NEVER recommend budget > $${c.max_daily_budget_aud}`);
      lines.push(`- ❌ NEVER recommend budget < $${c.min_daily_budget_aud} (unless pausing)`);
      lines.push('');
    }

    // Test calendar & seasonal phases
    lines.push('## 📅 RULE 2: Test Calendar & Seasonal Awareness');
    lines.push('');
    for (const c of campaigns) {
      const phaseMax = (c.recommended_budget_aud * 1.1).toFixed(2);

      lines.push(`### Campaign: ${c.campaign_name}`);
      lines.push(`- Test Date: ${c.test_date || 'Rolling test'}`);
      lines.push(`- Weeks Until Test: ${c.weeks_until_test ?? 'N/A'}`);
      lines.push(`- Current Phase: ${c.seasonal_phase}`);
      lines.push(`- Recommended Budget for Phase: $${c.recommended_budget_aud}/day`);
      lines.push(`- Max Allowed (Phase + 10%): $${phaseMax}/day`);

      if (c.seasonal_phase === 'POST_TEST') {
        lines.push(`- ❌ CRITICAL: Test has passed - MUST recommend pausing this campaign`);
        lines.push(`- ❌ DO NOT recommend any budget increases`);
      } else if (c.seasonal_phase === 'PEAK') {
        lines.push(`- ✅ PEAK season - maximize budget if CAC is good`);
      } else if (c.seasonal_phase === 'TOO_EARLY') {
        lines.push(`- ⚠️  Too early to advertise - recommend pausing`);
      }

      if (c.registration_deadline) {
        const deadline = new Date(c.registration_deadline);
        const today = new Date();
        const daysUntil = Math.floor((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntil < 0) {
          lines.push(`- ⚠️  Registration deadline PASSED - conversions unlikely`);
        } else if (daysUntil <= 7) {
          lines.push(`- 🚨 URGENT: Registration deadline in ${daysUntil} days! Final push recommended.`);
        }
      }

      lines.push('');
    }

    // Performance thresholds
    lines.push('## 🎯 RULE 3: Performance Thresholds (AUTO-PAUSE)');
    lines.push('');
    for (const c of campaigns) {
      let status = '';
      let action = '';

      if (c.cac_aud > c.pause_cpa_aud) {
        status = '❌ CRITICAL';
        action = 'MUST pause or drastically reduce budget (-30-50%)';
      } else if (c.cac_aud > c.target_cpa_aud) {
        status = '⚠️  ABOVE TARGET';
        action = 'Do NOT increase budget - optimize first';
      } else if (c.cac_aud <= c.target_cpa_aud * 0.9) {
        status = '✅ VERY EFFICIENT';
        action = 'Safe to scale budget aggressively';
      } else {
        status = '✅ EFFICIENT';
        action = 'Safe to scale budget moderately';
      }

      lines.push(`### Campaign: ${c.campaign_name}`);
      lines.push(`- Current CAC: $${c.cac_aud.toFixed(2)}`);
      lines.push(`- Target CAC: $${c.target_cpa_aud} (optimal)`);
      lines.push(`- Pause Threshold: $${c.pause_cpa_aud} (auto-pause above this)`);
      lines.push(`- Status: ${status}`);
      lines.push(`- Action: ${action}`);

      if (c.cac_aud > c.pause_cpa_aud) {
        lines.push(`- ❌ NEVER recommend budget increases when CAC > pause threshold`);
      }

      lines.push('');
    }

    // Change rate limits
    lines.push('## 🔄 RULE 4: Change Rate Limits');
    lines.push('');
    lines.push('- Max 1 major change per campaign per week');
    lines.push('  - "Major change" = budget change >15%, bidding strategy change, or ad overhaul');
    lines.push('  - Need time to measure impact before next major change');
    lines.push('- Keyword bid changes: Max ±30% per week');
    lines.push('- Ad copy tests: Max 2 new variants per week per campaign');
    lines.push('');

    // Safety rails
    lines.push('## 🛡️ RULE 5: Safety Rails');
    lines.push('');
    lines.push('- ❌ NEVER recommend pausing ALL campaigns (at least one must stay active)');
    lines.push('- ❌ NEVER pause campaigns with >median conversions (top performers)');
    lines.push('- ❌ NEVER pause keywords with >5 conversions and CAC < target*1.2');
    lines.push('- ❌ Minimum budget: $10/day (below this = pause campaign instead)');
    lines.push('- ⚠️  Confidence <60%: Requires human approval');
    lines.push('- ⚠️  Confidence <80%: Suggest review before approving');
    lines.push('- ✅ Confidence ≥80%: Can auto-execute (if enabled)');
    lines.push('');

    lines.push('## ⚖️  Rule Violations');
    lines.push('');
    lines.push('If a recommendation would violate any rule:');
    lines.push('1. DO NOT include it in your recommendations array');
    lines.push('2. OR mark it with "requires_override": true and explain why');
    lines.push('3. Explain the violation in the "key_insights" section');
    lines.push('');
    lines.push('REMEMBER: These are HARD RULES. Do not suggest violations even if you think they might work.');
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Validate recommendations against hard rules
   */
  static validate(
    recommendations: Recommendation[],
    campaigns: Campaign[]
  ): ValidationResult {
    const violations: RuleViolation[] = [];
    const approved: Recommendation[] = [];
    const rejected: Recommendation[] = [];
    const warning: Recommendation[] = [];

    // Rule 5.1: Never pause all campaigns
    const pauseRecommendations = recommendations.filter((r) => r.type === 'pause_campaign');
    if (pauseRecommendations.length >= campaigns.length && campaigns.length > 1) {
      pauseRecommendations.forEach((r) => {
        violations.push({
          rule: 'RULE_5_1',
          severity: 'error',
          message: 'Cannot pause all campaigns - at least one must remain active',
          recommendation_id: r.action_id,
        });
      });
    }

    for (const rec of recommendations) {
      const campaign = campaigns.find((c) => c.campaign_id === rec.campaign_id);
      if (!campaign) {
        // Non-campaign specific recommendation
        approved.push(rec);
        continue;
      }

      let hasError = false;
      let hasWarning = false;

      // RULE 1: Budget constraints
      if (rec.type === 'budget_increase' || rec.type === 'budget_change') {
        const newBudget = rec.details?.new_budget || rec.details?.budget;

        if (newBudget > campaign.max_daily_budget_aud) {
          violations.push({
            rule: 'RULE_1_1',
            severity: 'error',
            message: `Budget $${newBudget} exceeds max limit $${campaign.max_daily_budget_aud}`,
            recommendation_id: rec.action_id,
          });
          hasError = true;
        }

        if (newBudget < campaign.min_daily_budget_aud && newBudget > 0) {
          violations.push({
            rule: 'RULE_1_2',
            severity: 'error',
            message: `Budget $${newBudget} below min limit $${campaign.min_daily_budget_aud}`,
            recommendation_id: rec.action_id,
          });
          hasError = true;
        }

        const maxIncrease = campaign.daily_budget_aud * 1.25;
        const maxDecrease = campaign.daily_budget_aud * 0.75;

        if (newBudget > maxIncrease) {
          violations.push({
            rule: 'RULE_1_3',
            severity: 'error',
            message: `Budget increase exceeds +25% limit (max: $${maxIncrease.toFixed(2)})`,
            recommendation_id: rec.action_id,
          });
          hasError = true;
        }

        if (newBudget < maxDecrease && newBudget > 0) {
          violations.push({
            rule: 'RULE_1_3',
            severity: 'error',
            message: `Budget decrease exceeds -25% limit (min: $${maxDecrease.toFixed(2)})`,
            recommendation_id: rec.action_id,
          });
          hasError = true;
        }

        if (newBudget > 0 && newBudget < 10) {
          violations.push({
            rule: 'RULE_5_4',
            severity: 'error',
            message: 'Budget below $10/day minimum - recommend pausing instead',
            recommendation_id: rec.action_id,
          });
          hasError = true;
        }
      }

      // RULE 2: Seasonal phase
      if (campaign.seasonal_phase === 'POST_TEST' && rec.type !== 'pause_campaign') {
        violations.push({
          rule: 'RULE_2_4',
          severity: 'error',
          message: 'POST_TEST campaigns must be paused',
          recommendation_id: rec.action_id,
        });
        hasError = true;
      }

      if (campaign.seasonal_phase === 'TOO_EARLY' && rec.type === 'budget_increase') {
        violations.push({
          rule: 'RULE_2_3',
          severity: 'warning',
          message: 'Increasing budget in TOO_EARLY phase may waste money',
          recommendation_id: rec.action_id,
        });
        hasWarning = true;
      }

      const phaseMax = campaign.recommended_budget_aud * 1.1;
      if (
        (rec.type === 'budget_increase' || rec.type === 'budget_change') &&
        rec.details?.new_budget > phaseMax
      ) {
        violations.push({
          rule: 'RULE_2_3',
          severity: 'warning',
          message: `Budget $${rec.details.new_budget} exceeds phase recommendation $${phaseMax.toFixed(2)} for ${campaign.seasonal_phase}`,
          recommendation_id: rec.action_id,
        });
        hasWarning = true;
      }

      // RULE 3: Performance thresholds
      if (campaign.cac_aud > campaign.pause_cpa_aud) {
        if (rec.type === 'budget_increase') {
          violations.push({
            rule: 'RULE_3_1',
            severity: 'error',
            message: `Cannot increase budget when CAC ($${campaign.cac_aud}) exceeds pause threshold ($${campaign.pause_cpa_aud})`,
            recommendation_id: rec.action_id,
          });
          hasError = true;
        }
      }

      if (
        campaign.cac_aud > campaign.target_cpa_aud &&
        campaign.cac_aud <= campaign.pause_cpa_aud &&
        rec.type === 'budget_increase'
      ) {
        violations.push({
          rule: 'RULE_3_2',
          severity: 'warning',
          message: `CAC ($${campaign.cac_aud}) above target ($${campaign.target_cpa_aud}) - optimize before scaling`,
          recommendation_id: rec.action_id,
        });
        hasWarning = true;
      }

      // RULE 5.2: Preserve top performers
      const medianConversions =
        campaigns.map((c) => c.conversions).sort((a, b) => a - b)[Math.floor(campaigns.length / 2)];

      if (campaign.conversions > medianConversions * 2 && rec.type === 'pause_campaign') {
        violations.push({
          rule: 'RULE_5_2',
          severity: 'error',
          message: `Cannot pause top performing campaign (${campaign.conversions} conv vs median ${medianConversions})`,
          recommendation_id: rec.action_id,
        });
        hasError = true;
      }

      // RULE 5.5: Confidence threshold
      if (rec.confidence < 60) {
        violations.push({
          rule: 'RULE_5_5',
          severity: 'warning',
          message: 'Low confidence (<60%) - requires human approval',
          recommendation_id: rec.action_id,
        });
        hasWarning = true;
      }

      // Categorize recommendation
      if (hasError) {
        rejected.push(rec);
      } else if (hasWarning) {
        warning.push(rec);
      } else {
        approved.push(rec);
      }
    }

    return {
      isValid: violations.filter((v) => v.severity === 'error').length === 0,
      violations,
      recommendations: {
        approved,
        rejected,
        warning,
      },
    };
  }

  /**
   * Print validation report
   */
  static printValidationReport(result: ValidationResult): void {
    console.log('\n🔍 Rules Validation Report');
    console.log('═══════════════════════════════════════════\n');

    if (result.isValid) {
      console.log('✅ All recommendations passed validation!\n');
    } else {
      console.log('❌ Some recommendations violate hard rules\n');
    }

    console.log(`Summary:`);
    console.log(`  ✅ Approved: ${result.recommendations.approved.length}`);
    console.log(`  ⚠️  Warnings: ${result.recommendations.warning.length}`);
    console.log(`  ❌ Rejected: ${result.recommendations.rejected.length}`);

    if (result.violations.length > 0) {
      console.log(`\n📋 Violations:\n`);

      const errors = result.violations.filter((v) => v.severity === 'error');
      const warnings = result.violations.filter((v) => v.severity === 'warning');

      if (errors.length > 0) {
        console.log('❌ Errors (blocking):');
        errors.forEach((v, i) => {
          console.log(`  ${i + 1}. [${v.rule}] ${v.recommendation_id}`);
          console.log(`     ${v.message}\n`);
        });
      }

      if (warnings.length > 0) {
        console.log('⚠️  Warnings (review required):');
        warnings.forEach((v, i) => {
          console.log(`  ${i + 1}. [${v.rule}] ${v.recommendation_id}`);
          console.log(`     ${v.message}\n`);
        });
      }
    }

    console.log('═══════════════════════════════════════════\n');
  }
}
