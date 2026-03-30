/**
 * Tactical Analyzer V2
 *
 * AI-powered tactical optimization (NO budget recommendations)
 *
 * Focuses on:
 * - Ad copy performance (pause low CTR, promote high CTR)
 * - Keyword opportunities (add converting search terms)
 * - Negative keywords (block wasteful searches)
 * - Bid adjustments (increase/decrease based on performance)
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface TacticalRecommendation {
  type: 'negative_keyword' | 'add_keyword' | 'bid_adjustment' | 'pause_ad' | 'enable_ad';
  campaign: string;
  action: string;
  reason: string;
  impact: string;
  data?: any;
}

export class TacticalAnalyzer {

  async analyze(): Promise<TacticalRecommendation[]> {
    console.log('🎯 TACTICAL ANALYZER V2\n');
    console.log('AI analyzing performance for tactical opportunities...\n');

    try {
      // Get current + prior week data
      const currentWeek = await this.getCurrentWeekData();
      const priorWeek = await this.getPriorWeekData();

      if (!currentWeek) {
        console.log('⚠️  No data for current week. Skipping analysis.\n');
        return [];
      }

      console.log(`Analyzing week: ${currentWeek.week_start_date}`);
      console.log(`Total spend: $${currentWeek.total_cost.toFixed(2)}`);
      console.log(`Total conversions: ${currentWeek.total_conversions}\n`);

      // Call Claude API with tactical-focused prompt
      const recommendations = await this.getTacticalRecommendations(currentWeek, priorWeek);

      console.log(`\n✅ Analysis complete`);
      console.log(`   Recommendations generated: ${recommendations.length}\n`);

      return recommendations;

    } catch (error) {
      console.error('❌ Error in tactical analysis:', error);
      throw error;
    }
  }

  private async getCurrentWeekData() {
    // Get Monday of current week
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + daysToMonday);
    const mondayStr = monday.toISOString().split('T')[0];

    // Get snapshot
    const { data, error } = await supabase
      .from('google_ads_weekly_snapshots')
      .select('*')
      .eq('week_start_date', mondayStr)
      .single();

    if (error || !data) return null;

    return data;
  }

  private async getPriorWeekData() {
    // Get prior Monday
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const priorMonday = new Date(today);
    priorMonday.setDate(today.getDate() + daysToMonday - 7);
    const priorMondayStr = priorMonday.toISOString().split('T')[0];

    const { data } = await supabase
      .from('google_ads_weekly_snapshots')
      .select('*')
      .eq('week_start_date', priorMondayStr)
      .single();

    return data || null;
  }

  private async getTacticalRecommendations(currentWeek: any, priorWeek: any): Promise<TacticalRecommendation[]> {

    const TACTICAL_PROMPT = `You are a Google Ads optimization expert analyzing performance data.

IMPORTANT: DO NOT recommend budget changes. Budgets are set automatically by a preset allocation strategy.

Your job is to identify TACTICAL opportunities only:

1. NEGATIVE KEYWORDS: Which search terms are wasting money? (high cost, low/no conversions)
2. ADD KEYWORDS: Which converting search terms should be added as exact/phrase match keywords?
3. BID ADJUSTMENTS: Which keywords need higher/lower bids based on conversion rate and impression share?
4. AD COPY: Which ads should be paused (low CTR/conv rate) or promoted (high performance)?

Current Week Data:
${JSON.stringify(currentWeek, null, 2)}

${priorWeek ? `Prior Week Data (for comparison):\n${JSON.stringify(priorWeek, null, 2)}` : '(No prior week data available)'}

Provide 3-5 HIGH-IMPACT tactical recommendations ONLY. Focus on the biggest wins (most waste to eliminate, best conversion opportunities).

Respond with ONLY a JSON array in this format:
[
  {
    "type": "negative_keyword",
    "campaign": "VIC Selective Entry",
    "action": "Add 'free' as negative keyword",
    "reason": "30 clicks, $45 spent, 0 conversions in current week",
    "impact": "Save ~$60/week"
  },
  {
    "type": "bid_adjustment",
    "campaign": "Year 5 NAPLAN",
    "action": "Increase bid on 'naplan practice test' from $2.50 to $3.50",
    "reason": "Converting at 8% but losing 40% impression share to competitors",
    "impact": "Estimated +3 conversions/week"
  }
]

Valid types: negative_keyword, add_keyword, bid_adjustment, pause_ad, enable_ad

Keep recommendations specific, actionable, and high-impact.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: TACTICAL_PROMPT
      }]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Extract JSON from response (handle markdown code blocks)
    let jsonText = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*(\[[\s\S]*\])\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    try {
      const recommendations = JSON.parse(jsonText);
      return Array.isArray(recommendations) ? recommendations : [];
    } catch (error) {
      console.error('Failed to parse AI response as JSON:', error);
      console.error('Response was:', responseText);
      return [];
    }
  }
}

// Run standalone if called directly
// Note: ES modules don't support require.main === module
// This file is meant to be imported by index-weekly-v2.ts
