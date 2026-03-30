/**
 * Weekly AI Strategic Advisor
 *
 * Analyzes weekly Google Ads performance with attribution tracking
 * Queries weekly snapshots from database and compares to prior week
 */

import Anthropic from '@anthropic-ai/sdk';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../shared/database';
import type {
  WeeklyCampaignSnapshot,
  WeeklyKeywordSnapshot,
  WeeklyAdCopySnapshot,
} from './weekly-data-collector';

export interface AIRecommendation {
  id: string;
  action_id: string;  // Unique ID for tracking across weeks
  type: 'budget_change' | 'pause_campaign' | 'unpause_campaign' | 'keyword_bid_change' | 'add_negative_keyword' | 'ad_copy_test';
  priority: 'high' | 'medium' | 'low';
  action: string;
  reasoning: string;
  expected_impact: string;
  confidence: number;
  campaign_id?: string;
  details: Record<string, any>;
}

export interface AIAnalysis {
  week_date: string;
  executive_summary: string;
  attribution_summary: AttributionSummary | null;
  key_insights: string[];
  recommendations: AIRecommendation[];
  risks: string[];
  next_week_focus: string;
  performance_trends: {
    improving: string[];
    declining: string[];
    stable: string[];
  };
}

export interface AttributionSummary {
  total_actions_last_week: number;
  successful_actions: number;
  failed_actions: number;
  success_rate: number;
  average_accuracy: number;
  key_learnings: string[];
}

interface WeeklyContext {
  currentWeek: {
    weekStart: string;
    weekEnd: string;
    campaigns: WeeklyCampaignSnapshot[];
    keywords: WeeklyKeywordSnapshot[];
    adCopy: WeeklyAdCopySnapshot[];
  };
  priorWeek: {
    weekStart: string;
    weekEnd: string;
    campaigns: WeeklyCampaignSnapshot[];
    keywords: WeeklyKeywordSnapshot[];
    adCopy: WeeklyAdCopySnapshot[];
  } | null;
  priorActions: any[];
}

export class WeeklyAIAdvisor {
  private anthropic: Anthropic;
  private db: SupabaseClient<Database>;

  constructor(db: SupabaseClient<Database>) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }

    this.anthropic = new Anthropic({ apiKey });
    this.db = db;
  }

  /**
   * Main entry point: Analyze weekly performance and generate recommendations
   */
  async analyzeWeek(weekStart: string, weekEnd: string): Promise<AIAnalysis> {
    console.log(`🧠 Analyzing week ${weekStart} to ${weekEnd}...`);

    // Gather all context for analysis
    const context = await this.gatherWeeklyContext(weekStart, weekEnd);

    // Call Claude for analysis
    const analysis = await this.callClaudeForAnalysis(context);

    // If we had prior week actions, calculate and save attribution
    if (context.priorActions && context.priorActions.length > 0) {
      await this.calculateAndSaveAttribution(context, analysis);
    }

    // Save analysis summary
    await this.saveAnalysis(weekStart, analysis);

    console.log(`  ✓ Analysis complete`);
    console.log(`    - ${analysis.recommendations.length} recommendations generated`);
    if (analysis.attribution_summary) {
      console.log(`    - Attribution: ${analysis.attribution_summary.successful_actions}/${analysis.attribution_summary.total_actions_last_week} actions successful`);
    }

    return analysis;
  }

  /**
   * Gather all context needed for weekly analysis
   */
  private async gatherWeeklyContext(weekStart: string, weekEnd: string): Promise<WeeklyContext> {
    // Get current week's snapshots
    const currentWeek = await this.getWeekSnapshots(weekStart, weekEnd);

    // Get prior week's snapshots (7 days earlier)
    const priorWeekStart = this.subtractDays(weekStart, 7);
    const priorWeekEnd = this.subtractDays(weekEnd, 7);
    const priorWeek = await this.getWeekSnapshots(priorWeekStart, priorWeekEnd);

    // Get actions that were executed last week (for attribution)
    const priorActions = priorWeek
      ? await this.getExecutedActions(priorWeekStart, priorWeekEnd)
      : [];

    return {
      currentWeek: {
        weekStart,
        weekEnd,
        ...currentWeek,
      },
      priorWeek: priorWeek
        ? {
            weekStart: priorWeekStart,
            weekEnd: priorWeekEnd,
            ...priorWeek,
          }
        : null,
      priorActions,
    };
  }

  /**
   * Get weekly snapshots from database
   */
  private async getWeekSnapshots(weekStart: string, weekEnd: string) {
    // Get campaign snapshots
    const { data: campaigns, error: campaignError } = await this.db
      .from('google_ads_weekly_snapshots')
      .select('*')
      .eq('week_start_date', weekStart);

    if (campaignError) {
      console.error('Error fetching campaign snapshots:', campaignError);
      return { campaigns: [], keywords: [], adCopy: [] };
    }

    // Get keyword snapshots
    const { data: keywords, error: keywordError } = await this.db
      .from('google_ads_weekly_keywords')
      .select('*')
      .eq('week_start_date', weekStart)
      .order('conversions', { ascending: false })
      .limit(100);

    if (keywordError) {
      console.error('Error fetching keyword snapshots:', keywordError);
    }

    // Get ad copy snapshots
    const { data: adCopy, error: adError } = await this.db
      .from('google_ads_weekly_ad_copy')
      .select('*')
      .eq('week_start_date', weekStart)
      .order('conversions', { ascending: false })
      .limit(50);

    if (adError) {
      console.error('Error fetching ad copy snapshots:', adError);
    }

    return {
      campaigns: (campaigns as WeeklyCampaignSnapshot[]) || [],
      keywords: (keywords as WeeklyKeywordSnapshot[]) || [],
      adCopy: (adCopy as WeeklyAdCopySnapshot[]) || [],
    };
  }

  /**
   * Get actions that were executed in a given week
   */
  private async getExecutedActions(weekStart: string, weekEnd: string) {
    const { data: actions, error } = await this.db
      .from('google_ads_agent_actions')
      .select('*')
      .gte('executed_at', weekStart)
      .lte('executed_at', weekEnd)
      .not('executed_at', 'is', null)
      .order('executed_at', { ascending: true });

    if (error) {
      console.error('Error fetching executed actions:', error);
      return [];
    }

    return actions || [];
  }

  /**
   * Call Claude API for weekly analysis
   */
  private async callClaudeForAnalysis(context: WeeklyContext): Promise<AIAnalysis> {
    const prompt = this.buildWeeklyAnalysisPrompt(context);

    console.log('  🤖 Calling Claude API for strategic analysis...');

    const message = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse Claude response as JSON');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    // Add unique IDs to recommendations
    analysis.recommendations = analysis.recommendations.map((rec: any, idx: number) => ({
      ...rec,
      id: `ai-rec-${Date.now()}-${idx}`,
      action_id: `action-${context.currentWeek.weekStart}-${idx}`,
      details: rec.details || {},
    }));

    analysis.week_date = context.currentWeek.weekStart;

    return analysis;
  }

  /**
   * Build comprehensive prompt for Claude
   */
  private buildWeeklyAnalysisPrompt(context: WeeklyContext): string {
    const { currentWeek, priorWeek, priorActions } = context;

    let prompt = `You are an expert Google Ads strategist for Educourse, an Australian test prep company.

BUSINESS CONTEXT:
- Company: Educourse (test prep for selective schools and scholarship exams)
- Target audience: Parents of students in Melbourne and Sydney
- Products: VIC Selective, EduTest, ACER, NSW Selective, NAPLAN Year 5 & 7
- Revenue per customer: $200 AUD
- Target CAC: <$50 AUD (HARD CONSTRAINT)
- Daily budget cap: $150/day maximum

GOAL: Maximize profit through seasonal optimization and data-driven decisions.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 CURRENT WEEK (${currentWeek.weekStart} to ${currentWeek.weekEnd})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CAMPAIGNS:
${JSON.stringify(currentWeek.campaigns, null, 2)}

TOP KEYWORDS (by conversions):
${JSON.stringify(currentWeek.keywords.slice(0, 20), null, 2)}

TOP AD COPY (by conversions):
${JSON.stringify(currentWeek.adCopy.slice(0, 10), null, 2)}
`;

    if (priorWeek) {
      prompt += `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 PRIOR WEEK (${priorWeek.weekStart} to ${priorWeek.weekEnd})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CAMPAIGNS:
${JSON.stringify(priorWeek.campaigns, null, 2)}

TOP KEYWORDS (by conversions):
${JSON.stringify(priorWeek.keywords.slice(0, 20), null, 2)}

TOP AD COPY (by conversions):
${JSON.stringify(priorWeek.adCopy.slice(0, 10), null, 2)}
`;
    }

    if (priorActions && priorActions.length > 0) {
      prompt += `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 ACTIONS YOU RECOMMENDED LAST WEEK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${priorActions
  .map(
    (action, idx) => `
${idx + 1}. ${action.description}
   - Your reasoning: ${action.reasoning}
   - Your prediction: ${action.expected_impact}
   - Executed at: ${action.executed_at}
   - Confidence: ${(action.confidence * 100).toFixed(0)}%
`
  )
  .join('\n')}

YOUR ATTRIBUTION TASK:
Compare your predictions to actual results:
- For each action above, calculate the measured impact
- Did conversions change as predicted?
- Did CAC stay stable or improve?
- What was your prediction accuracy?
- What did you learn?
`;
    }

    prompt += `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR TASK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ${priorWeek ? 'ATTRIBUTION ANALYSIS (highest priority):' : 'INITIAL ANALYSIS:'}
   ${
     priorWeek
       ? `- Compare current week to prior week for each campaign
   - For campaigns where you recommended changes, calculate accuracy
   - Identify what worked and what didn't
   - Extract key learnings for future recommendations`
       : `- This is your first week of analysis
   - Focus on seasonal positioning and obvious opportunities
   - Set baseline for future comparisons`
   }

2. SEASONAL STRATEGY:
   - Which campaigns are POST_TEST and wasting money? → PAUSE
   - Which campaigns are RAMP_UP/PEAK but underbudgeted? → INCREASE
   - Which campaigns are TOO_EARLY (26+ weeks) and wasting budget? → PAUSE
   - Which EduTest/ACER campaigns need year-round baseline? → MAINTAIN

3. PERFORMANCE OPTIMIZATION:
   - Which keywords have CAC <$30 and high volume? → SCALE
   - Which keywords have CAC >$45 with low conversions? → PAUSE/NEGATIVE
   - Which ad copy has CTR >7% and good conversions? → REPLICATE
   - Which ad copy has CTR <3%? → TEST NEW VARIANTS

4. RISK MONITORING:
   - Any campaigns approaching CAC $40-$50? → REDUCE
   - Any campaigns with CAC >$50? → PAUSE
   - Any trends worsening over multiple weeks? → INVESTIGATE

IMPORTANT RULES:
- Maximum budget change: ±50% per week
- Total daily spend: Cannot exceed $150/day
- ALWAYS check seasonal phase before recommending budget changes
- Prioritize seasonal pauses/ramps over minor optimizations
- Quantify every impact: "Est. +X conversions/week = +$Y profit"
- Consider keyword-level CAC, not just campaign-level
- Identify winning ad copy patterns for replication

RETURN JSON (no additional text):
{
  "executive_summary": "2-3 sentence summary of this week's performance and next week's priorities",

  ${
    priorWeek
      ? `"attribution_summary": {
    "total_actions_last_week": number,
    "successful_actions": number,
    "failed_actions": number,
    "success_rate": number (0-1),
    "average_accuracy": number (0-1),
    "key_learnings": ["Learning 1", "Learning 2", ...]
  },`
      : `"attribution_summary": null,`
  }

  "key_insights": [
    "Insight 1 about performance or seasonal timing",
    "Insight 2 about trends or opportunities",
    "Insight 3 about risks or concerns"
  ],

  "recommendations": [
    {
      "type": "budget_change|pause_campaign|unpause_campaign|keyword_bid_change|add_negative_keyword|ad_copy_test",
      "priority": "high|medium|low",
      "action": "Specific action to take",
      "reasoning": "Why this matters - include data and seasonal context",
      "expected_impact": "Quantified impact: Est. +X conversions/week, +$Y profit (or -$Z savings)",
      "confidence": 0.85,
      "campaign_id": "optional-campaign-id",
      "details": {
        "current_value": "e.g. current budget",
        "new_value": "e.g. recommended budget",
        "seasonal_phase": "e.g. RAMP_UP",
        "weeks_until_test": number
      }
    }
  ],

  "risks": [
    "Risk 1 to monitor next week",
    "Risk 2 to watch"
  ],

  "next_week_focus": "Strategic priority for next week",

  "performance_trends": {
    "improving": ["Campaign or metric improving"],
    "declining": ["Campaign or metric declining"],
    "stable": ["Campaign or metric stable"]
  }
}

Focus on HIGH-IMPACT, DATA-DRIVEN recommendations aligned with seasonal timing.`;

    return prompt;
  }

  /**
   * Calculate attribution and save to database
   */
  private async calculateAndSaveAttribution(context: WeeklyContext, analysis: AIAnalysis) {
    if (!context.priorWeek || !context.priorActions.length) return;

    const { currentWeek, priorWeek, priorActions } = context;

    for (const action of priorActions) {
      // Find corresponding campaigns in current and prior week
      const currentCampaign = currentWeek.campaigns.find((c) => c.campaign_id === action.campaign_id);
      const priorCampaign = priorWeek.campaigns.find((c) => c.campaign_id === action.campaign_id);

      if (!currentCampaign || !priorCampaign) continue;

      // Calculate measured impact
      const conversionsChange = currentCampaign.conversions - priorCampaign.conversions;
      const cacChange = currentCampaign.cac_aud - priorCampaign.cac_aud;

      // Extract expected values from action
      const expectedConversionsMatch = action.expected_impact?.match(/\+(\d+)\s*conversions/i);
      const expectedConversions = expectedConversionsMatch
        ? parseInt(expectedConversionsMatch[1])
        : null;

      const accuracy =
        expectedConversions !== null && expectedConversions > 0
          ? Math.min(conversionsChange / expectedConversions, 1)
          : null;

      const verdict =
        accuracy !== null && accuracy >= 0.8
          ? 'SUCCESS'
          : accuracy !== null && accuracy >= 0.5
            ? 'PARTIAL'
            : 'MISS';

      // Update action with measured impact
      await this.db
        .from('google_ads_agent_actions')
        .update({
          measured_impact: {
            conversions_change: conversionsChange,
            conversions_expected: expectedConversions,
            accuracy: accuracy ? Number(accuracy.toFixed(2)) : null,
            cac_change: Number(cacChange.toFixed(2)),
            cac_prior: Number(priorCampaign.cac_aud.toFixed(2)),
            cac_current: Number(currentCampaign.cac_aud.toFixed(2)),
            verdict,
          },
          attribution_calculated_at: new Date().toISOString(),
        })
        .eq('id', action.id);
    }
  }

  /**
   * Save analysis summary to database
   */
  private async saveAnalysis(weekDate: string, analysis: AIAnalysis) {
    await this.db.from('google_ads_agent_summaries').upsert(
      {
        week_date: weekDate,
        executive_summary: analysis.executive_summary,
        attribution_summary: analysis.attribution_summary as any,
        recommendations_count: analysis.recommendations.length,
        full_analysis: analysis as any,
      },
      {
        onConflict: 'week_date',
      }
    );
  }

  /**
   * Utility: Subtract days from a date string
   */
  private subtractDays(dateStr: string, days: number): string {
    const date = new Date(dateStr);
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }
}
