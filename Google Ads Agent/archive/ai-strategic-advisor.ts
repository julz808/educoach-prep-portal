import Anthropic from '@anthropic-ai/sdk';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../shared/database';
import { GoogleAdsClient } from './google-ads-client';

export interface TimeframeData {
  campaigns: CampaignPerformance[];
  searchTerms: SearchTermAnalysis[];
  adPerformance: AdPerformance[];
  summary: PerformanceSummary;
}

interface CampaignPerformance {
  campaign_id: string;
  campaign_name: string;
  campaign_status?: string;  // ENABLED, PAUSED, REMOVED
  product_slug: string;
  spend: number;
  conversions: number;
  cac: number;
  ctr: number;
  impressions: number;
  clicks: number;
}

interface SearchTermAnalysis {
  search_term: string;
  clicks: number;
  conversions: number;
  cost: number;
  campaign_id: string;
}

interface AdPerformance {
  ad_id: string;
  campaign_id: string;
  headline: string;
  ctr: number;
  conversion_rate: number;
  impressions: number;
}

interface PerformanceSummary {
  total_spend: number;
  total_conversions: number;
  average_cac: number;
  average_ctr: number;
}

export interface AIRecommendation {
  id: string;
  type: 'budget_shift' | 'pause_campaign' | 'pause_ad' | 'add_negative_keyword' | 'bid_adjustment' | 'ad_copy_test';
  priority: 'high' | 'medium' | 'low';
  action: string;
  reasoning: string;
  expected_impact: string;
  confidence: number;
  campaign_id?: string;
  details: Record<string, any>;
}

export interface AIAnalysis {
  executive_summary: string;
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

interface ApprovalPattern {
  recommendation_type: string;
  approved_count: number;
  rejected_count: number;
  approval_rate: number;
  common_reasons: string[];
}

export class AIStrategicAdvisor {
  private anthropic: Anthropic;
  private db: SupabaseClient<Database>;
  private adsClient: GoogleAdsClient;

  constructor(db: SupabaseClient<Database>) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }

    this.anthropic = new Anthropic({ apiKey });
    this.db = db;
    this.adsClient = new GoogleAdsClient();
  }

  /**
   * Main entry point: Analyze performance and generate strategic recommendations
   */
  async analyzeAndRecommend(): Promise<AIAnalysis> {
    console.log('🧠 AI Strategic Advisor starting analysis...');

    // Collect multi-timeframe data
    const last7Days = await this.collectTimeframeData(7);
    const previous7Days = await this.collectTimeframeData(14, 7); // Days 8-14
    const last30Days = await this.collectTimeframeData(30);

    // Get previous changes and approval patterns
    const lastWeekChanges = await this.getLastWeekChanges();
    const approvalPatterns = await this.getApprovalPatterns();

    // Get test calendar context
    const testCalendar = await this.getTestCalendarContext();

    // NEW: Fetch live Google Ads data for complete visibility
    console.log('  📡 Fetching live Google Ads data...');
    const endDate = new Date().toISOString().split('T')[0];
    const startDateObj = new Date();
    startDateObj.setDate(startDateObj.getDate() - 7);
    const startDate = startDateObj.toISOString().split('T')[0];

    const [currentKeywords, currentAdCopy, currentBudgets] = await Promise.all([
      this.adsClient.getKeywords(startDate, endDate),
      this.adsClient.getAdCopy(startDate, endDate),
      this.adsClient.getBudgets(),
    ]);

    console.log('  📊 Data collected:');
    console.log(`    - Last 7 days: ${last7Days.campaigns.length} campaigns`);
    console.log(`    - Previous 7 days: ${previous7Days.campaigns.length} campaigns`);
    console.log(`    - Last 30 days: ${last30Days.campaigns.length} campaigns`);
    console.log(`    - Current keywords: ${currentKeywords.length} active keywords`);
    console.log(`    - Current ad copy: ${currentAdCopy.length} active ads`);
    console.log(`    - Current budgets: ${currentBudgets.length} budgets`);

    // Call Claude API for intelligent analysis
    const analysis = await this.callClaudeForAnalysis({
      last7Days,
      previous7Days,
      last30Days,
      lastWeekChanges,
      approvalPatterns,
      testCalendar,
      currentKeywords,      // NEW
      currentAdCopy,        // NEW
      currentBudgets,       // NEW
    });

    // Validate and apply safety checks
    const validatedAnalysis = this.validateRecommendations(analysis);

    // Save analysis to database
    await this.saveAnalysis(validatedAnalysis);

    console.log('  ✓ AI analysis complete');
    console.log(`    - ${validatedAnalysis.recommendations.length} recommendations generated`);

    return validatedAnalysis;
  }

  /**
   * Collect performance data for a specific timeframe
   */
  private async collectTimeframeData(days: number, offset: number = 0): Promise<TimeframeData> {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - offset);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Get campaign performance from daily snapshots
    const { data: snapshots } = await this.db
      .from('google_ads_campaign_performance')
      .select('*')
      .gte('date', startDateStr)
      .lte('date', endDateStr);

    // Aggregate by campaign
    const campaignMap = new Map<string, CampaignPerformance>();

    snapshots?.forEach(snapshot => {
      const existing = campaignMap.get(snapshot.campaign_id);
      // Convert cost_micros to dollars
      const cost = snapshot.cost_micros / 1000000;

      if (existing) {
        existing.spend += cost;
        existing.conversions += snapshot.conversions;
        existing.impressions += snapshot.impressions;
        existing.clicks += snapshot.clicks;
      } else {
        campaignMap.set(snapshot.campaign_id, {
          campaign_id: snapshot.campaign_id,
          campaign_name: snapshot.campaign_name,
          campaign_status: snapshot.campaign_status,
          product_slug: snapshot.product_slug || '',
          spend: cost,
          conversions: snapshot.conversions,
          cac: 0, // Will calculate after
          ctr: 0,
          impressions: snapshot.impressions,
          clicks: snapshot.clicks,
        });
      }
    });

    // Calculate derived metrics
    const campaigns = Array.from(campaignMap.values()).map(camp => ({
      ...camp,
      cac: camp.conversions > 0 ? camp.spend / camp.conversions : 0,
      ctr: camp.impressions > 0 ? (camp.clicks / camp.impressions) * 100 : 0,
    }));

    // Get search terms
    const { data: searchTerms } = await this.db
      .from('google_ads_search_terms')
      .select('*')
      .gte('first_seen', startDateStr)
      .lte('first_seen', endDateStr);

    // Get ad performance (simplified for now)
    const adPerformance: AdPerformance[] = [];

    // Calculate summary
    const summary: PerformanceSummary = {
      total_spend: campaigns.reduce((sum, c) => sum + c.spend, 0),
      total_conversions: campaigns.reduce((sum, c) => sum + c.conversions, 0),
      average_cac: 0,
      average_ctr: campaigns.reduce((sum, c) => sum + c.ctr, 0) / (campaigns.length || 1),
    };

    summary.average_cac = summary.total_conversions > 0
      ? summary.total_spend / summary.total_conversions
      : 0;

    return {
      campaigns,
      searchTerms: searchTerms || [],
      adPerformance,
      summary,
    };
  }

  /**
   * Get changes made in last 30 days (to measure impact and attribution)
   */
  private async getLastWeekChanges() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: actions } = await this.db
      .from('google_ads_agent_actions')
      .select('*')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .not('executed_at', 'is', null)
      .order('executed_at', { ascending: false });

    return actions || [];
  }

  /**
   * Get user's approval patterns to personalize recommendations
   */
  private async getApprovalPatterns(): Promise<ApprovalPattern[]> {
    const { data: actions } = await this.db
      .from('google_ads_agent_actions')
      .select('action_type, approved_at, rejected_at')
      .or('approved_at.not.is.null,rejected_at.not.is.null');

    const patterns = new Map<string, { approved: number; rejected: number }>();

    actions?.forEach(action => {
      const existing = patterns.get(action.action_type) || { approved: 0, rejected: 0 };
      if (action.approved_at) existing.approved++;
      if (action.rejected_at) existing.rejected++;
      patterns.set(action.action_type, existing);
    });

    return Array.from(patterns.entries()).map(([type, counts]) => ({
      recommendation_type: type,
      approved_count: counts.approved,
      rejected_count: counts.rejected,
      approval_rate: counts.approved / (counts.approved + counts.rejected || 1),
      common_reasons: [],
    }));
  }

  /**
   * Get test calendar with seasonal phases for strategic timing
   */
  private async getTestCalendarContext() {
    const { data: tests } = await this.db
      .from('test_calendar')
      .select('*');

    return tests?.map(test => {
      const testDate = new Date(test.test_date_primary);
      const today = new Date();
      const daysUntil = Math.floor((testDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const weeksUntil = Math.floor(daysUntil / 7);

      // Calculate seasonal phase and recommended budget
      // Pass product_slug to handle different test types (fixed vs rolling)
      const phase = this.getSeasonalPhase(weeksUntil, test.product_slug);
      const recommendedBudget = this.calculateSeasonalBudget(
        test.max_daily_budget_aud,
        test.min_daily_budget_aud,
        phase
      );

      return {
        product_slug: test.product_slug,
        product_name: test.product_name,
        test_date: test.test_date_primary,
        days_until: daysUntil,
        weeks_until: weeksUntil,
        seasonal_phase: phase,
        recommended_daily_budget: recommendedBudget,
        min_budget: test.min_daily_budget_aud,
        max_budget: test.max_daily_budget_aud,
        target_cpa: test.target_cpa_aud,
        pause_threshold: test.pause_cpa_aud,
      };
    }) || [];
  }

  /**
   * Determine seasonal phase based on weeks until test
   */
  private getSeasonalPhase(weeksUntil: number, productSlug?: string): string {
    if (weeksUntil < 0) return 'POST_TEST';

    // EduTest and ACER have rolling test dates throughout the year
    // Most concentrated in Q1, but tests happen year-round
    const isRollingTest = productSlug?.includes('edutest') || productSlug?.includes('acer');

    if (isRollingTest) {
      // More conservative approach for rolling tests
      // Keep spending steady year-round with seasonal adjustments
      if (weeksUntil <= 2) return 'IMMINENT';
      if (weeksUntil <= 6) return 'PEAK';        // 1.5 months before Q1
      if (weeksUntil <= 12) return 'RAMP_UP';    // 3 months before Q1
      if (weeksUntil <= 20) return 'EARLY';      // 5 months before Q1
      return 'BASELINE';  // Don't pause - maintain year-round presence
    }

    // NAPLAN, VIC Selective, NSW Selective have fixed dates
    // Longer ramp-up window (20 weeks = 5 months)
    if (weeksUntil <= 2) return 'IMMINENT';
    if (weeksUntil <= 6) return 'LATE';
    if (weeksUntil <= 12) return 'PEAK';
    if (weeksUntil <= 20) return 'RAMP_UP';      // Extended from 12 to 20 weeks
    if (weeksUntil <= 26) return 'EARLY';        // Extended from 16 to 26 weeks
    return 'TOO_EARLY';
  }

  /**
   * Calculate recommended budget based on seasonal phase
   */
  private calculateSeasonalBudget(
    maxBudget: number,
    minBudget: number,
    phase: string
  ): number {
    const budgetMultipliers: Record<string, number> = {
      'POST_TEST': 0.0,    // PAUSE - test finished (fixed-date tests only)
      'TOO_EARLY': 0.0,    // PAUSE - too far out (26+ weeks for fixed-date tests)
      'EARLY': 0.4,        // 40% - early awareness (20-26 weeks)
      'RAMP_UP': 0.7,      // 70% - ramping up (12-20 weeks)
      'PEAK': 1.0,         // 100% - peak season (6-12 weeks)
      'LATE': 0.85,        // 85% - maintain momentum (2-6 weeks)
      'IMMINENT': 0.6,     // 60% - test very close (0-2 weeks)
      'BASELINE': 0.5,     // 50% - year-round baseline (EduTest/ACER)
    };

    const multiplier = budgetMultipliers[phase] || 0;
    const recommended = minBudget + (maxBudget - minBudget) * multiplier;

    return Math.round(recommended);
  }

  /**
   * Call Claude API for intelligent analysis
   */
  private async callClaudeForAnalysis(context: any): Promise<AIAnalysis> {
    const prompt = this.buildAnalysisPrompt(context);

    console.log('  🤖 Calling Claude API for strategic analysis...');

    const message = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      temperature: 0.7,
      messages: [{
        role: 'user',
        content: prompt,
      }],
    });

    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

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
      details: rec.details || {},
    }));

    return analysis;
  }

  /**
   * Build the detailed prompt for Claude
   */
  private buildAnalysisPrompt(context: any): string {
    const {
      last7Days,
      previous7Days,
      last30Days,
      lastWeekChanges,
      approvalPatterns,
      testCalendar,
      currentKeywords,
      currentAdCopy,
      currentBudgets,
    } = context;

    return `You are an expert Google Ads strategist for an Australian test prep company (Educourse). Your job is to analyze performance data and provide strategic, actionable recommendations.

BUSINESS CONTEXT:
- Company: Educourse (test prep for selective schools and scholarship exams)
- Target audience: Parents of students in Melbourne and Sydney
- Products: VIC Selective, EduTest, ACER, NSW Selective, Year 5 NAPLAN, Year 7 NAPLAN

CAMPAIGN STATUS CODES:
- ENABLED: Campaign is actively running (can spend money)
- PAUSED: Campaign exists but is temporarily stopped (seasonal pause)
- REMOVED: Campaign was deleted (no longer exists)

IMPORTANT: If a campaign shows "PAUSED" status, it means it's intentionally paused for seasonal reasons (e.g., test already happened). Do NOT recommend "launching" paused campaigns unless the test calendar shows the test is approaching soon.

BUSINESS ECONOMICS:
- Revenue per customer: $200 AUD
- Target CAC: <$50 AUD (HARD CONSTRAINT - must stay under)
- Current average CAC: ~$15 AUD (excellent performance!)
- No capacity constraints - can handle growth
- Daily budget cap: $150/day maximum

PRIMARY GOAL: Maximize Total Profit
Formula: Total Profit = (Customers × $200) - Ad Spend

STRATEGIC APPROACH:
- GROW profitably by scaling campaigns with low CAC
- Test everything - let DATA reveal patterns (no assumptions about intent)
- Scale aggressively when CAC is $12-$30 (you have $20-$38 headroom)
- Monitor closely when CAC approaches $40-$45 (getting close to limit)
- Only reduce spend when CAC hits $48-$50 (constraint violated)
- All tests are valuable - discover which are MOST valuable through data

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 TEST CALENDAR - SEASONAL INTELLIGENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SEASONAL PHASE DEFINITIONS:

FIXED-DATE TESTS (NAPLAN, VIC Selective, NSW Selective):
- POST_TEST (test finished): PAUSE (0%) - Test completed, no demand until next year
- TOO_EARLY (26+ weeks): PAUSE (0%) - Too far out, waste of budget
- EARLY (20-26 weeks): 40% budget - Early awareness building (5-6 months before)
- RAMP_UP (12-20 weeks): 70% budget - Optimal awareness window (3-5 months before)
- PEAK (6-12 weeks): 100% budget - Maximum demand period (1.5-3 months before)
- LATE (2-6 weeks): 85% budget - Maintain momentum (2 weeks - 1.5 months before)
- IMMINENT (0-2 weeks): 60% budget - Test very close, still some last-minute demand

ROLLING-DATE TESTS (EduTest, ACER):
- BASELINE (20+ weeks from Q1): 50% budget - Maintain year-round presence
- EARLY (12-20 weeks from Q1): 50% budget - Pre-Q1 awareness
- RAMP_UP (6-12 weeks from Q1): 70% budget - Building toward Q1 peak
- PEAK (0-6 weeks from Q1): 100% budget - Q1 concentration period
Note: Never pause EduTest/ACER - they have rolling tests year-round

YOUR SEASONAL OPTIMIZATION TASK:
1. For each product, compare CURRENT budget to RECOMMENDED seasonal budget
2. NAPLAN/VIC/NSW in POST_TEST phase and still ENABLED → HIGH PRIORITY: PAUSE
3. NAPLAN/VIC/NSW in TOO_EARLY phase (26+ weeks) → Recommend PAUSE (save money)
4. Any product in RAMP_UP or PEAK phase but budget <70% of recommended → Recommend INCREASE
5. NAPLAN/VIC/NSW in EARLY phase (20-26 weeks) and paused → Consider UNPAUSE (start awareness)
6. EduTest/ACER: NEVER recommend pause - maintain year-round with seasonal adjustments
7. Quantify impact: "Save $X/day" or "Add $X profit/week"

TEST CALENDAR WITH SEASONAL PHASES:
${JSON.stringify(testCalendar, null, 2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 PERFORMANCE DATA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LAST 7 DAYS (PRIMARY - Current State):
${JSON.stringify(last7Days, null, 2)}

PREVIOUS 7 DAYS (COMPARISON - Week-over-Week):
${JSON.stringify(previous7Days, null, 2)}

LAST 30 DAYS (CONTEXT - Validation):
${JSON.stringify(last30Days, null, 2)}

CHANGES MADE IN LAST 30 DAYS (Attribution - what we changed vs what happened):
${JSON.stringify(lastWeekChanges, null, 2)}

USER'S APPROVAL PATTERNS (Personalization):
${JSON.stringify(approvalPatterns, null, 2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 LIVE GOOGLE ADS DATA - KEYWORDS & AD COPY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CURRENT KEYWORDS (Last 7 Days - Top 100 by impressions):
${JSON.stringify(currentKeywords, null, 2)}

CURRENT AD COPY (Last 7 Days - Top 50 by impressions):
${JSON.stringify(currentAdCopy, null, 2)}

CURRENT CAMPAIGN BUDGETS:
${JSON.stringify(currentBudgets, null, 2)}

KEYWORD ANALYSIS TASK:
1. Which keywords have CAC <$30 and high conversions? (Scale these!)
2. Which keywords have CAC >$45 with low conversions? (Consider pausing)
3. Any keywords with high clicks but zero conversions? (Potential negative keywords)
4. Match type analysis: Are BROAD keywords wasting money vs EXACT?
5. CTR analysis: Keywords with <2% CTR may indicate poor relevance

AD COPY ANALYSIS TASK:
1. Which headlines/descriptions have highest CTR? (These are winners)
2. Which ads have high impressions but low CTR <3%? (Test new copy)
3. Which ads drive conversions at good CAC? (Scale these ad groups)
4. Any patterns in winning ad copy? (Replicate across campaigns)
5. Are there opportunities to A/B test new angles?

YOUR TASK:

Analyze the data with focus on MAXIMIZING PROFIT and SEASONAL OPTIMIZATION:

1. **SEASONAL STRATEGY (HIGHEST PRIORITY)**:
   - Which campaigns are POST_TEST and wasting money? → HIGH PRIORITY: PAUSE
   - Which campaigns are RAMP_UP/PEAK but underbudgeted? → INCREASE NOW
   - Which campaigns are TOO_EARLY and wasting budget? → PAUSE until 12-14 weeks out
   - Calculate savings from seasonal pauses and profit from seasonal ramps

2. **Profit opportunity** - Which campaigns have CAC <$30 that we should SCALE?
3. **Week-over-week performance** - What's working/failing RIGHT NOW?
4. **Attribution** - Did last week's changes improve results?
5. **Trend validation** - Are 7-day trends supported by 30-day context?
6. **Keyword optimization** - Which keywords drive best CAC? Which waste money?
7. **Ad copy optimization** - Which headlines/descriptions convert best?
8. **Data-driven insights** - What patterns emerge from actual conversions? (no assumptions)
9. **Risk monitoring** - Any campaigns approaching $40-$50 CAC danger zone?
10. **User preferences** - What types of changes does the user typically approve?

RECOMMENDATION PHILOSOPHY:

🔴 SEASONAL PRIORITY RECOMMENDATIONS (Always check FIRST):

POST_TEST campaigns still running (NAPLAN/VIC/NSW only):
- Action: "PAUSE immediately - test finished, zero demand"
- Impact: "Save $X/day ($Y/month) with zero revenue loss"
- Unpause: "Resume in [DATE] (20-26 weeks before next test)"
- Confidence: 100%

RAMP_UP/PEAK campaigns underbudgeted:
- Action: "INCREASE budget from $X to $Y (seasonal phase: [PHASE])"
- Reasoning: "[Z] weeks until test - optimal awareness window"
- Impact: "Est. +X conversions/week, +$Y profit/month at $Z CAC"
- Confidence: 85-95%

TOO_EARLY campaigns wasting budget (NAPLAN/VIC/NSW only):
- Action: "PAUSE until [DATE] - currently 26+ weeks before test"
- Impact: "Save $X/day, resume at 20-26 week window (EARLY phase)"
- Confidence: 90%

BASELINE campaigns (EduTest/ACER):
- Action: "Maintain year-round at 50% budget (BASELINE phase)"
- Reasoning: "Rolling test dates throughout year - need consistent presence"
- Note: "Increase to 70-100% budget in Q4/Q1 (peak period)"
- Confidence: 95%

✅ RECOMMEND SCALING when:
- Campaign CAC is $12-$25 → "You have $25-$38 headroom - increase budget 30-50%"
- Campaign CAC is $26-$35 → "Still profitable - increase budget 15-25%"
- Test is 8-14 weeks away (RAMP_UP/PEAK phase) → "Ramp up now to build awareness"
- Conversions increasing week-over-week → "Momentum building - double down"
- Keywords with CAC <$20 and high volume → "Scale these winning keywords"

⚠️ RECOMMEND MONITORING when:
- Campaign CAC is $36-$45 → "Approaching limit - hold steady, watch closely"
- New campaign <7 days old → "Too early to judge - let it learn"
- Test is 2-4 weeks away (LATE phase) → "Maintain current spend"

❌ RECOMMEND REDUCING when:
- Campaign CAC is $46-$50 → "At constraint - reduce 20-30%"
- Campaign CAC >$50 → "Over constraint - reduce 40% or pause"
- Trend worsening for 3+ weeks → "Not responding to optimization"
- Keywords with CAC >$45 and low conversions → "Pause or add as negative"
- Test is 0-2 weeks away (IMMINENT phase) → "Too late to convert - reduce 50%"

IMPORTANT RULES:
- Budget changes: Maximum ±50% per week for scaling winners (user wants growth)
- Budget reductions: Maximum -30% per week (moderate risk tolerance)
- Total daily spend: Cannot exceed $150/day across all campaigns
- ALWAYS check seasonal phase FIRST before recommending budget changes
- Prioritize seasonal pauses/ramps over minor optimization tweaks
- Quantify impact: "Est. +X customers/week = +$Y profit" or "Save $X/day"
- Consider keyword-level CAC when available (not just campaign-level)
- Identify winning ad copy patterns and recommend replication
- Focus on ROI, not cost savings

RETURN JSON (no additional text):
{
  "executive_summary": "2-3 sentence summary for CEO - what happened this week, what should happen next",
  "key_insights": [
    "Insight 1 about performance",
    "Insight 2 about trends",
    "Insight 3 about opportunities"
  ],
  "recommendations": [
    {
      "type": "budget_shift|pause_campaign|pause_ad|add_negative_keyword|bid_adjustment|ad_copy_test",
      "priority": "high|medium|low",
      "action": "Specific action to take",
      "reasoning": "Why this matters - include data from last 7 days and CAC headroom",
      "expected_impact": "Quantified impact: Est. +X customers/week, +$Y profit (or savings if reducing)",
      "confidence": 0.85,
      "campaign_id": "optional-campaign-id",
      "details": {
        "from_campaign": "if budget shift",
        "to_campaign": "if budget shift",
        "amount": "if budget change",
        "keyword": "if negative keyword",
        "current_cac": "for context",
        "target_cac": "for context"
      }
    }
  ],
  "risks": [
    "Risk 1 to monitor",
    "Risk 2 to watch"
  ],
  "next_week_focus": "Strategic priority for next week",
  "performance_trends": {
    "improving": ["Campaign or metric that's improving"],
    "declining": ["Campaign or metric that's declining"],
    "stable": ["Campaign or metric that's stable"]
  }
}

Focus on HIGH-IMPACT, DATA-DRIVEN recommendations that align with test timing and user preferences.`;
  }

  /**
   * Validate recommendations against safety rules
   */
  private validateRecommendations(analysis: AIAnalysis): AIAnalysis {
    const validatedRecs = analysis.recommendations.map(rec => {
      // Check budget constraints
      if (rec.type === 'budget_shift' && rec.details.amount) {
        const amount = parseFloat(rec.details.amount);

        // Allow larger increases for scaling (up to $75/day change)
        // User wants growth, not just cost reduction
        if (amount > 75) {
          rec.details.amount = '75';
          rec.reasoning += ' (Amount capped at $75/day for safety)';
        }

        // Warn if recommendation would violate $150/day total cap
        // (This is a simplified check - full validation happens at execution time)
        if (amount > 0 && rec.details.total_daily_spend_after) {
          const totalAfter = parseFloat(rec.details.total_daily_spend_after);
          if (totalAfter > 150) {
            rec.reasoning += ' ⚠️ NOTE: May need to reduce other campaigns to stay under $150/day cap';
          }
        }
      }

      return rec;
    });

    return {
      ...analysis,
      recommendations: validatedRecs,
    };
  }

  /**
   * Save analysis to database for tracking
   */
  private async saveAnalysis(analysis: AIAnalysis) {
    const { error } = await this.db
      .from('google_ads_agent_summaries')
      .insert({
        date: new Date().toISOString().split('T')[0],
        summary: analysis.executive_summary,
        recommendations_count: analysis.recommendations.length,
        full_analysis: analysis as any,
      });

    if (error) {
      console.error('Failed to save analysis:', error);
    }
  }
}
