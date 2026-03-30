/**
 * Analyze with AI (Pure AI Analysis - No Data Collection)
 *
 * Reads weekly snapshots from Supabase and analyzes with Claude
 * NO Google Ads API calls - only reads from database
 *
 * Can be run multiple times on the same snapshot for testing
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { TelegramNotifier } from './telegram-notifier';
import { RulesEngine } from './rules-engine';
import dotenv from 'dotenv';

dotenv.config();

interface WeeklyContext {
  currentWeek: {
    campaigns: any[];
    keywords: any[];
    adCopy: any[];
  };
  priorWeek: {
    campaigns: any[];
    keywords: any[];
    adCopy: any[];
  } | null;
  priorActions: any[];
}

interface AIAnalysis {
  week_date: string;
  overall_health: string;
  key_insights: string[];
  recommendations: any[];
  attribution_summary?: {
    total_actions_last_week: number;
    successful_actions: number;
    success_rate: number;
  };
}

export class AIAnalyzer {
  private supabase: any;
  private anthropic: Anthropic;

  constructor() {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    if (!anthropicKey) {
      throw new Error('Missing Anthropic API key');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.anthropic = new Anthropic({ apiKey: anthropicKey });
  }

  /**
   * Subtract days from a date string
   */
  private subtractDays(dateStr: string, days: number): string {
    const date = new Date(dateStr);
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }

  /**
   * Get week snapshots from Supabase
   */
  private async getWeekSnapshots(weekStart: string, weekEnd: string) {
    // Fetch campaign snapshots
    const { data: campaigns, error: campaignError } = await this.supabase
      .from('google_ads_weekly_snapshots')
      .select('*')
      .eq('week_start_date', weekStart);

    if (campaignError) {
      throw new Error(`Failed to fetch campaign snapshots: ${campaignError.message}`);
    }

    // Fetch keyword snapshots
    const { data: keywords, error: keywordError } = await this.supabase
      .from('google_ads_weekly_keywords')
      .select('*')
      .eq('week_start_date', weekStart);

    if (keywordError) {
      throw new Error(`Failed to fetch keyword snapshots: ${keywordError.message}`);
    }

    // Fetch ad copy snapshots
    const { data: adCopy, error: adCopyError } = await this.supabase
      .from('google_ads_weekly_ad_copy')
      .select('*')
      .eq('week_start_date', weekStart);

    if (adCopyError) {
      throw new Error(`Failed to fetch ad copy snapshots: ${adCopyError.message}`);
    }

    return {
      campaigns: campaigns || [],
      keywords: keywords || [],
      adCopy: adCopy || [],
    };
  }

  /**
   * Get executed actions from prior week
   */
  private async getExecutedActions(weekStart: string, weekEnd: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('google_ads_agent_actions')
      .select('*')
      .eq('week_date', weekStart)
      .eq('approved', true)
      .eq('executed', true);

    if (error) {
      console.error('Warning: Could not fetch prior actions:', error.message);
      return [];
    }

    return data || [];
  }

  /**
   * Gather weekly context (current + prior week)
   */
  private async gatherWeeklyContext(weekStart: string, weekEnd: string): Promise<WeeklyContext> {
    console.log('  📊 Reading current week snapshots from Supabase...');
    const currentWeek = await this.getWeekSnapshots(weekStart, weekEnd);
    console.log(`     • ${currentWeek.campaigns.length} campaigns`);
    console.log(`     • ${currentWeek.keywords.length} keywords`);
    console.log(`     • ${currentWeek.adCopy.length} ads`);

    // Get prior week (7 days earlier)
    const priorWeekStart = this.subtractDays(weekStart, 7);
    const priorWeekEnd = this.subtractDays(weekEnd, 7);

    console.log(`\n  📊 Reading prior week snapshots (${priorWeekStart})...`);
    let priorWeek = null;
    let priorActions: any[] = [];

    try {
      priorWeek = await this.getWeekSnapshots(priorWeekStart, priorWeekEnd);
      console.log(`     • ${priorWeek.campaigns.length} campaigns`);
      console.log(`     • ${priorWeek.keywords.length} keywords`);
      console.log(`     • ${priorWeek.adCopy.length} ads`);

      // Get actions from prior week
      priorActions = await this.getExecutedActions(priorWeekStart, priorWeekEnd);
      if (priorActions.length > 0) {
        console.log(`     • ${priorActions.length} executed actions to measure`);
      }
    } catch (error) {
      console.log('     ⚠️  No prior week data (this is normal for first run)');
    }

    return { currentWeek, priorWeek, priorActions };
  }

  /**
   * Build Claude prompt with all context
   */
  private buildClaudePrompt(context: WeeklyContext, weekStart: string): string {
    const { currentWeek, priorWeek, priorActions } = context;

    let prompt = `You are a Google Ads strategist analyzing weekly performance data.

# CURRENT WEEK: ${weekStart}

## Campaign Performance
${JSON.stringify(currentWeek.campaigns, null, 2)}

## Top Keywords
${JSON.stringify(currentWeek.keywords.slice(0, 50), null, 2)}

## Ad Copy Performance
${JSON.stringify(currentWeek.adCopy.slice(0, 20), null, 2)}

${RulesEngine.buildRulesPrompt(currentWeek.campaigns)}
`;

    // Add prior week comparison if available
    if (priorWeek) {
      prompt += `\n\n# PRIOR WEEK COMPARISON

## Prior Campaign Performance
${JSON.stringify(priorWeek.campaigns, null, 2)}

## Prior Keywords
${JSON.stringify(priorWeek.keywords.slice(0, 50), null, 2)}

## Prior Ad Copy
${JSON.stringify(priorWeek.adCopy.slice(0, 20), null, 2)}
`;
    }

    // Add attribution context if available
    if (priorActions && priorActions.length > 0) {
      prompt += `\n\n# ACTIONS FROM LAST WEEK (Attribution Context)

The following actions were executed last week. Please analyze if they had the expected impact:

${JSON.stringify(priorActions, null, 2)}

For each action, compare the predicted impact to actual results and calculate attribution.
`;
    }

    prompt += `\n\n# YOUR TASK

Analyze the data and provide:

1. Overall health assessment
2. Key insights (3-5 bullet points)
3. Specific recommendations with:
   - Action ID (unique identifier)
   - Type (budget_change, keyword_bid, ad_copy, etc.)
   - Campaign ID
   - Description
   - Reasoning
   - Expected impact (be specific with numbers)
   - Confidence (0-100)

${
  priorActions.length > 0
    ? `
4. Attribution analysis:
   - For each action from last week, calculate:
     - Actual impact (change in conversions, CAC, etc.)
     - Accuracy (actual vs predicted)
     - Verdict (SUCCESS if >80%, PARTIAL if 50-80%, MISS if <50%)
`
    : ''
}

Return your analysis as JSON with this structure:
{
  "overall_health": "EXCELLENT | GOOD | FAIR | POOR",
  "key_insights": ["insight 1", "insight 2", ...],
  "recommendations": [
    {
      "action_id": "unique_id",
      "type": "budget_change",
      "campaign_id": "123456",
      "action": "Increase budget",
      "reasoning": "Why this makes sense",
      "expected_impact": "+25 conversions/week, -$5 CAC",
      "confidence": 85,
      "details": { ... }
    }
  ]${
    priorActions.length > 0
      ? `,
  "attribution": [
    {
      "action_id": "from_last_week",
      "actual_impact": "Description of what happened",
      "accuracy": 0.88,
      "verdict": "SUCCESS"
    }
  ]`
      : ''
  }
}`;

    return prompt;
  }

  /**
   * Call Claude API for analysis
   */
  private async callClaude(prompt: string): Promise<any> {
    const message = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from Claude response');
    }

    return JSON.parse(jsonMatch[0]);
  }

  /**
   * Calculate and save attribution
   */
  private async calculateAttribution(
    context: WeeklyContext,
    analysis: any
  ): Promise<void> {
    if (!context.priorWeek || !context.priorActions || context.priorActions.length === 0) {
      return;
    }

    console.log('\n  🎯 Calculating attribution...');

    let successCount = 0;
    let totalCount = context.priorActions.length;

    for (const action of context.priorActions) {
      // Find corresponding campaign in current vs prior week
      const currentCampaign = context.currentWeek.campaigns.find(
        (c) => c.campaign_id === action.campaign_id
      );
      const priorCampaign = context.priorWeek.campaigns.find(
        (c) => c.campaign_id === action.campaign_id
      );

      if (!currentCampaign || !priorCampaign) continue;

      // Calculate actual changes
      const conversionsChange = currentCampaign.conversions - priorCampaign.conversions;
      const cacChange = currentCampaign.cac_aud - priorCampaign.cac_aud;

      // Extract expected conversions from action
      const expectedMatch = action.expected_impact?.match(/\+(\d+)\s*conversions/i);
      const expectedConversions = expectedMatch ? parseInt(expectedMatch[1]) : null;

      // Calculate accuracy
      let accuracy = null;
      if (expectedConversions && expectedConversions > 0) {
        accuracy = Math.min(conversionsChange / expectedConversions, 1);
      }

      // Determine verdict
      let verdict = 'UNKNOWN';
      if (accuracy !== null) {
        if (accuracy >= 0.8) {
          verdict = 'SUCCESS';
          successCount++;
        } else if (accuracy >= 0.5) {
          verdict = 'PARTIAL';
        } else {
          verdict = 'MISS';
        }
      }

      // Save measured impact
      const { error } = await this.supabase
        .from('google_ads_agent_actions')
        .update({
          measured_impact: {
            conversions_change: conversionsChange,
            conversions_expected: expectedConversions,
            accuracy: accuracy ? Number(accuracy.toFixed(2)) : null,
            cac_change: Number(cacChange.toFixed(2)),
            verdict,
          },
          attribution_calculated_at: new Date().toISOString(),
        })
        .eq('id', action.id);

      if (error) {
        console.error(`     ⚠️  Error updating attribution for action ${action.id}:`, error.message);
      } else {
        console.log(`     ✓ ${action.action_type}: ${verdict} (${accuracy ? Math.round(accuracy * 100) : 0}%)`);
      }
    }

    // Add attribution summary to analysis
    analysis.attribution_summary = {
      total_actions_last_week: totalCount,
      successful_actions: successCount,
      success_rate: totalCount > 0 ? successCount / totalCount : 0,
    };
  }

  /**
   * Save recommendations to database
   */
  private async saveRecommendations(weekStart: string, analysis: any): Promise<void> {
    const recommendations = analysis.recommendations.map((rec: any) => ({
      action_id: rec.action_id,
      week_date: weekStart,
      action_type: rec.type,
      campaign_id: rec.campaign_id || null,
      description: rec.action,
      reasoning: rec.reasoning,
      expected_impact: rec.expected_impact,
      confidence: rec.confidence,
      recommended_at: new Date().toISOString(),
      recommended_by: 'claude',
      details: rec.details || {},
      approved: false,
      executed: false,
    }));

    if (recommendations.length === 0) {
      console.log('  No recommendations to save');
      return;
    }

    const { error } = await this.supabase
      .from('google_ads_agent_actions')
      .insert(recommendations);

    if (error) {
      throw new Error(`Failed to save recommendations: ${error.message}`);
    }

    console.log(`  ✓ Saved ${recommendations.length} recommendations`);
  }

  /**
   * Main analysis function
   */
  async analyze(options: { weekStart?: string; weekEnd?: string } = {}): Promise<void> {
    console.log('🧠 Google Ads AI Analysis');
    console.log('═══════════════════════════════════════════\n');

    // Calculate week dates
    let { weekStart, weekEnd } = options;
    if (!weekStart || !weekEnd) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastMonday = new Date(today);
      const dayOfWeek = today.getDay();
      const daysToLastMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      lastMonday.setDate(today.getDate() - daysToLastMonday - 7);

      const lastSunday = new Date(lastMonday);
      lastSunday.setDate(lastMonday.getDate() + 6);

      weekStart = lastMonday.toISOString().split('T')[0];
      weekEnd = lastSunday.toISOString().split('T')[0];
    }

    console.log(`Week: ${weekStart} to ${weekEnd}\n`);

    // Step 1: Gather context from Supabase
    console.log('📊 Step 1: Gathering context from Supabase...\n');
    const context = await this.gatherWeeklyContext(weekStart, weekEnd);

    if (context.currentWeek.campaigns.length === 0) {
      throw new Error(
        `No snapshot data found for ${weekStart}. Run collection first:\n  npm run agents:google-ads:collect-snapshots`
      );
    }

    // Step 2: Build prompt
    console.log('\n📝 Step 2: Building Claude prompt...');
    const prompt = this.buildClaudePrompt(context, weekStart);
    console.log(`  ✓ Prompt built (${prompt.length} chars)`);

    // Step 3: Call Claude
    console.log('\n🤖 Step 3: Calling Claude API...');
    const analysis = await this.callClaude(prompt);
    analysis.week_date = weekStart;

    console.log(`  ✓ Analysis complete`);
    console.log(`     • Overall health: ${analysis.overall_health}`);
    console.log(`     • Insights: ${analysis.key_insights?.length || 0}`);
    console.log(`     • Recommendations: ${analysis.recommendations?.length || 0}`);

    // Step 3.5: Validate recommendations against hard rules
    console.log('\n🔍 Step 3.5: Validating recommendations against hard rules...');
    const validationResult = RulesEngine.validate(
      analysis.recommendations || [],
      context.currentWeek.campaigns
    );

    RulesEngine.printValidationReport(validationResult);

    if (!validationResult.isValid) {
      console.log('⚠️  Some recommendations were rejected due to rule violations');
      console.log('    Only approved and warning recommendations will be saved.');
    }

    // Update analysis with only valid recommendations
    analysis.recommendations = [
      ...validationResult.recommendations.approved,
      ...validationResult.recommendations.warning,
    ];

    console.log(`  ✓ ${validationResult.recommendations.approved.length} recommendations approved`);
    console.log(`  ⚠️  ${validationResult.recommendations.warning.length} recommendations require review`);
    console.log(`  ❌ ${validationResult.recommendations.rejected.length} recommendations rejected`);

    // Step 4: Calculate attribution
    if (context.priorActions && context.priorActions.length > 0) {
      await this.calculateAttribution(context, analysis);

      if (analysis.attribution_summary) {
        const { successful_actions, total_actions_last_week, success_rate } =
          analysis.attribution_summary;
        console.log(
          `     • Attribution: ${successful_actions}/${total_actions_last_week} successful (${Math.round(success_rate * 100)}%)`
        );
      }
    }

    // Step 5: Save recommendations
    console.log('\n💾 Step 4: Saving recommendations...');
    await this.saveRecommendations(weekStart, analysis);

    // Step 6: Send to Telegram
    console.log('\n📱 Step 5: Sending to Telegram...');
    const notifier = new TelegramNotifier();
    await notifier.sendWeeklyAnalysis(analysis, {
      weekStart,
      weekEnd,
      campaigns: context.currentWeek.campaigns,
      keywords: context.currentWeek.keywords,
      adCopy: context.currentWeek.adCopy,
    });
    console.log('  ✓ Sent to Telegram');

    // Final summary
    console.log('\n═══════════════════════════════════════════');
    console.log('✅ AI Analysis Complete!');
    console.log('═══════════════════════════════════════════\n');

    console.log('Summary:');
    console.log(`  Week: ${weekStart} to ${weekEnd}`);
    console.log(`  Health: ${analysis.overall_health}`);
    console.log(`  Recommendations: ${analysis.recommendations?.length || 0}`);
    if (analysis.attribution_summary) {
      console.log(
        `  Attribution Success Rate: ${Math.round(analysis.attribution_summary.success_rate * 100)}%`
      );
    }

    console.log('\nNext Steps:');
    console.log('  1. Check Telegram for recommendations');
    console.log('  2. Approve/reject each recommendation');
    console.log('  3. Agent will execute approved actions\n');
  }
}

// CLI execution
async function main() {
  try {
    const args = process.argv.slice(2);
    const weekStartArg = args.find((arg) => arg.startsWith('--week-start='));
    const weekEndArg = args.find((arg) => arg.startsWith('--week-end='));

    const weekStart = weekStartArg?.split('=')[1];
    const weekEnd = weekEndArg?.split('=')[1];

    const analyzer = new AIAnalyzer();
    await analyzer.analyze({ weekStart, weekEnd });
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { AIAnalyzer };
