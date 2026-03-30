/**
 * SEO Seasonality Calculator
 *
 * Key difference from Google Ads:
 * - Google Ads can turn on/off instantly (0 lag)
 * - SEO content takes 8-12 weeks to rank (10 week lag)
 *
 * Therefore, SEO content calendar runs 10 WEEKS AHEAD of Google Ads calendar
 */

interface TestCalendarEntry {
  product_slug: string;
  product_name: string;
  test_date_primary: string;
  test_date_secondary?: string;
}

interface WeeklyBudgetAllocation {
  week_start_date: string;
  product_allocations: {
    [productSlug: string]: {
      phase: string;
      seasonal_multiplier: number;
      opportunity_score: number;
    };
  };
}

interface SEOContentAllocation {
  product_slug: string;
  product_name: string;
  weeks_until_test: number;
  google_ads_phase: string;
  seo_phase: string;
  posts_this_week: number;
  reasoning: string;
}

export class SEOSeasonalityCalculator {
  private static readonly SEO_TIME_LAG_WEEKS = 10;
  private static readonly MAX_WEEKLY_POSTS = 5;

  /**
   * Calculate SEO seasonal phase (10 weeks ahead of Google Ads phase)
   */
  static calculateSEOPhase(weeksUntilTest: number, productSlug?: string): string {
    // Apply time lag offset
    const effectiveWeeks = weeksUntilTest - this.SEO_TIME_LAG_WEEKS;

    // Special handling for rolling test dates (EduTest/ACER)
    if (productSlug === 'edutest-scholarship' || productSlug === 'acer-scholarship') {
      const currentMonth = new Date().getMonth() + 1; // 1-12

      // Offset by ~2.5 months (10 weeks)
      const effectiveMonth = currentMonth + 2.5;

      if (effectiveMonth >= 1 && effectiveMonth <= 3) return 'PEAK';      // Write in Oct-Dec for Q1 peak
      if (effectiveMonth === 12) return 'RAMP_UP';                        // Write in Sep for Dec ramp
      if (effectiveMonth >= 10 && effectiveMonth <= 11) return 'EARLY';   // Write in Jul-Aug for Oct-Nov
      return 'BASELINE';                                                  // Write year-round for Apr-Sep
    }

    // Fixed-date tests (NAPLAN, VIC Selective, NSW Selective)
    if (effectiveWeeks < 0) return 'POST_TEST';      // Stop writing (test finished or too close)
    if (effectiveWeeks <= 2) return 'IMMINENT';      // 10-12 weeks before test → last-minute content
    if (effectiveWeeks <= 6) return 'PEAK';          // 16-18 weeks before test → peak content volume
    if (effectiveWeeks <= 12) return 'RAMP_UP';      // 22-24 weeks before test → ramping up
    if (effectiveWeeks <= 20) return 'EARLY';        // 30-32 weeks before test → early awareness
    return 'TOO_EARLY';                              // 36+ weeks before test → don't write yet
  }

  /**
   * Calculate content budget (how many posts this week)
   */
  static calculateContentBudget(
    seoPhase: string,
    opportunityScore: number = 1.0
  ): number {
    const phaseMultipliers: Record<string, number> = {
      'POST_TEST': 0.0,   // STOP (content won't rank in time)
      'TOO_EARLY': 0.0,   // Don't write yet
      'EARLY': 0.4,       // 40% → 2 posts/week
      'RAMP_UP': 0.7,     // 70% → 3-4 posts/week
      'PEAK': 1.0,        // 100% → 4-5 posts/week
      'IMMINENT': 0.6,    // 60% → 3 posts/week (last-minute tips)
      'BASELINE': 0.5,    // 50% → 2-3 posts/week (rolling tests)
    };

    const baseMultiplier = phaseMultipliers[seoPhase] || 0;
    const adjustedMultiplier = baseMultiplier * opportunityScore;

    return Math.floor(this.MAX_WEEKLY_POSTS * adjustedMultiplier);
  }

  /**
   * Calculate weekly content allocation from Google Ads weekly budget data
   */
  static calculateWeeklyContentAllocation(
    weeklyBudget: WeeklyBudgetAllocation,
    testCalendar: TestCalendarEntry[]
  ): SEOContentAllocation[] {
    const allocations: SEOContentAllocation[] = [];
    const weekStartDate = new Date(weeklyBudget.week_start_date);

    for (const [productSlug, adsData] of Object.entries(weeklyBudget.product_allocations)) {
      const testEntry = testCalendar.find(t => t.product_slug === productSlug);
      if (!testEntry) continue;

      const testDate = new Date(testEntry.test_date_primary);
      const weeksUntilTest = Math.floor(
        (testDate.getTime() - weekStartDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
      );

      const seoPhase = this.calculateSEOPhase(weeksUntilTest, productSlug);
      const postsThisWeek = this.calculateContentBudget(seoPhase, adsData.opportunity_score);

      let reasoning = '';
      if (seoPhase === 'POST_TEST') {
        reasoning = `Test is ${weeksUntilTest} weeks away (< 10 week SEO lag). Content won't rank in time - STOP writing.`;
      } else if (seoPhase === 'TOO_EARLY') {
        reasoning = `Test is ${weeksUntilTest} weeks away. Too early to write content.`;
      } else if (postsThisWeek > 0) {
        reasoning = `Test is ${weeksUntilTest} weeks away. SEO phase ${seoPhase} (10-week lag applied). Write ${postsThisWeek} posts to rank by test date.`;
      }

      allocations.push({
        product_slug: productSlug,
        product_name: testEntry.product_name,
        weeks_until_test: weeksUntilTest,
        google_ads_phase: adsData.phase,
        seo_phase: seoPhase,
        posts_this_week: postsThisWeek,
        reasoning,
      });
    }

    return allocations;
  }

  /**
   * Generate human-readable report
   */
  static generateReport(allocations: SEOContentAllocation[]): string {
    const totalPosts = allocations.reduce((sum, a) => sum + a.posts_this_week, 0);
    const activeProducts = allocations.filter(a => a.posts_this_week > 0);

    let report = `\n📊 SEO Content Allocation Report (10-Week Time Lag Applied)\n`;
    report += `${'='.repeat(80)}\n\n`;
    report += `Total posts this week: ${totalPosts}\n`;
    report += `Active products: ${activeProducts.length}/${allocations.length}\n\n`;

    for (const allocation of allocations) {
      if (allocation.posts_this_week > 0) {
        report += `🟢 ${allocation.product_name}\n`;
      } else {
        report += `⚪ ${allocation.product_name}\n`;
      }
      report += `   Weeks until test: ${allocation.weeks_until_test}\n`;
      report += `   Google Ads phase: ${allocation.google_ads_phase}\n`;
      report += `   SEO phase: ${allocation.seo_phase} (accounting for 10-week lag)\n`;
      report += `   Posts this week: ${allocation.posts_this_week}\n`;
      report += `   Reasoning: ${allocation.reasoning}\n\n`;
    }

    report += `${'='.repeat(80)}\n`;

    return report;
  }
}

/**
 * Example usage
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const exampleWeeklyBudget: WeeklyBudgetAllocation = {
    week_start_date: '2026-03-30',
    product_allocations: {
      'vic-selective': {
        phase: 'RAMP_UP',
        seasonal_multiplier: 0.7,
        opportunity_score: 1.04,
      },
      'nsw-selective': {
        phase: 'PEAK',
        seasonal_multiplier: 1.0,
        opportunity_score: 1.0,
      },
      'year-5-naplan': {
        phase: 'TOO_EARLY',
        seasonal_multiplier: 0.0,
        opportunity_score: 1.0,
      },
      'year-7-naplan': {
        phase: 'TOO_EARLY',
        seasonal_multiplier: 0.0,
        opportunity_score: 1.0,
      },
      'acer-scholarship': {
        phase: 'BASELINE',
        seasonal_multiplier: 0.5,
        opportunity_score: 1.3,
      },
      'edutest-scholarship': {
        phase: 'BASELINE',
        seasonal_multiplier: 0.5,
        opportunity_score: 1.2,
      },
    },
  };

  const testCalendar: TestCalendarEntry[] = [
    { product_slug: 'vic-selective', product_name: 'VIC Selective', test_date_primary: '2026-06-20' },
    { product_slug: 'nsw-selective', product_name: 'NSW Selective', test_date_primary: '2026-05-01' },
    { product_slug: 'year-5-naplan', product_name: 'Year 5 NAPLAN', test_date_primary: '2027-03-09' },
    { product_slug: 'year-7-naplan', product_name: 'Year 7 NAPLAN', test_date_primary: '2027-03-09' },
    { product_slug: 'acer-scholarship', product_name: 'ACER', test_date_primary: '2027-02-01' },
    { product_slug: 'edutest-scholarship', product_name: 'EduTest', test_date_primary: '2027-02-01' },
  ];

  const allocations = SEOSeasonalityCalculator.calculateWeeklyContentAllocation(
    exampleWeeklyBudget,
    testCalendar
  );

  console.log(SEOSeasonalityCalculator.generateReport(allocations));
}
