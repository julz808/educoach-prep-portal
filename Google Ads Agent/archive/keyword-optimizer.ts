/**
 * Keyword Optimizer
 *
 * Analyzes search terms to:
 * 1. Flag wasteful terms as negative keywords (requires approval)
 * 2. Identify high performers for potential new keywords
 */

import { db } from '../shared/database';
import { GOOGLE_ADS_CONFIG } from '../shared/config';

export interface KeywordAnalysis {
  negativeKeywordsFlagged: number;
  highPerformersFound: number;
}

export class KeywordOptimizer {
  private wastefulTerms = [
    'free',
    'sample',
    'pdf',
    'download',
    'jobs',
    'teacher',
    'salary',
    'login',
    'portal',
    'laptop',
    'computer',
    'second hand',
    'used',
    'cheap',
    'template',
    'worksheet',
    'printable',
  ];

  /**
   * Analyze search terms and flag negative keywords
   */
  async analyzeSearchTerms(): Promise<KeywordAnalysis> {
    // Get search terms from last 7 days
    const searchTerms = await db.getSearchTerms(undefined, 7);

    let negativeKeywordsFlagged = 0;
    let highPerformersFound = 0;

    for (const term of searchTerms) {
      // Check if should be flagged as negative
      const negativeCheck = this.shouldFlagAsNegative(term);
      if (negativeCheck.flag && !term.flagged_as_negative) {
        // Flag in database
        await db.saveSearchTerms({
          ...term,
          flagged_as_negative: true,
          flagged_reason: negativeCheck.reason,
        });

        // Log as action requiring approval
        await db.logAgentAction({
          action_type: 'add_negative_keywords',
          product_slug: term.product_slug,
          details: {
            search_term: term.search_term,
            reason: negativeCheck.reason,
            clicks: term.clicks,
            conversions: term.conversions,
            cost_aud: term.cost_micros / 1_000_000,
          },
          requires_approval: GOOGLE_ADS_CONFIG.NEGATIVE_KEYWORD_APPROVAL_REQUIRED,
          execution_status: 'pending',
        });

        negativeKeywordsFlagged++;
      }

      // Check if high performer
      if (this.isHighPerformer(term) && !term.is_high_performer) {
        await db.saveSearchTerms({
          ...term,
          is_high_performer: true,
        });
        highPerformersFound++;
      }
    }

    return { negativeKeywordsFlagged, highPerformersFound };
  }

  /**
   * Determine if a search term should be flagged as negative
   */
  private shouldFlagAsNegative(term: any): { flag: boolean; reason: string } {
    // Rule 1: High clicks with zero conversions
    if (
      term.clicks >= GOOGLE_ADS_CONFIG.MIN_CLICKS_FOR_NEGATIVE_FLAG &&
      term.conversions === 0
    ) {
      const costAud = term.cost_micros / 1_000_000;
      if (costAud >= GOOGLE_ADS_CONFIG.MIN_COST_FOR_NEGATIVE_FLAG_AUD) {
        return {
          flag: true,
          reason: `${term.clicks} clicks, 0 conversions, $${costAud.toFixed(2)} spent`,
        };
      }
    }

    // Rule 2: Contains wasteful terms
    const lowerTerm = term.search_term.toLowerCase();
    for (const wasteful of this.wastefulTerms) {
      if (lowerTerm.includes(wasteful)) {
        return {
          flag: true,
          reason: `Contains wasteful keyword: "${wasteful}"`,
        };
      }
    }

    // Rule 3: Brand confusion (e.g., "acer laptop" vs "acer scholarship")
    if (lowerTerm.includes('acer') && (lowerTerm.includes('laptop') || lowerTerm.includes('computer'))) {
      return {
        flag: true,
        reason: 'Brand confusion: ACER electronics vs ACER Scholarship',
      };
    }

    return { flag: false, reason: '' };
  }

  /**
   * Determine if a search term is a high performer
   */
  private isHighPerformer(term: any): boolean {
    if (term.clicks < GOOGLE_ADS_CONFIG.MIN_CLICKS_FOR_HIGH_PERFORMER) {
      return false;
    }

    if (term.conversions < GOOGLE_ADS_CONFIG.MIN_CONVERSIONS_FOR_HIGH_PERFORMER) {
      return false;
    }

    const conversionRate = (term.conversions / term.clicks) * 100;
    return conversionRate >= GOOGLE_ADS_CONFIG.MIN_CONVERSION_RATE_FOR_HIGH_PERFORMER;
  }

  /**
   * Get summary of flagged negative keywords (for approval)
   */
  async getFlaggedNegativeKeywords(): Promise<any[]> {
    const searchTerms = await db.getSearchTerms(undefined, 30);
    return searchTerms.filter(
      (term: any) => term.flagged_as_negative && !term.added_as_negative_at
    );
  }

  /**
   * Get high performers (for new keyword opportunities)
   */
  async getHighPerformers(): Promise<any[]> {
    const searchTerms = await db.getSearchTerms(undefined, 30);
    return searchTerms
      .filter((term: any) => term.is_high_performer)
      .sort((a: any, b: any) => b.conversions - a.conversions)
      .slice(0, 20); // Top 20
  }
}
