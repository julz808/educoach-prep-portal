#!/usr/bin/env tsx
/**
 * Generate 104-Week Intelligent Budget Allocation
 *
 * Generates weekly budget allocations for Jan 2026 - Dec 2027
 * Total annual budget: $20,000
 * Dynamically allocated across 6 products based on:
 * - Seasonal demand (test window timing)
 * - Historical sales performance (32% ACER, 28% VIC, etc.)
 * - CAC efficiency
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Product configurations
const PRODUCTS = [
  {
    slug: 'acer-scholarship',
    salesPct: 0.32,
    cacEfficiency: 0.85,
    testDate: '2026-02-28',
    testDate2027: '2027-02-28',
    type: 'rolling', // Q1 + mid-year peaks
  },
  {
    slug: 'vic-selective',
    salesPct: 0.28,
    cacEfficiency: 0.90,
    testDate: '2026-06-20',
    testDate2027: '2027-06-19',
    registrationDeadline: '2026-04-24',
    registrationDeadline2027: '2027-04-23',
    type: 'fixed',
  },
  {
    slug: 'edutest-scholarship',
    salesPct: 0.22,
    cacEfficiency: 0.80,
    testDate: '2026-03-15',
    testDate2027: '2027-03-15',
    type: 'rolling', // Q1 + mid-year peaks
  },
  {
    slug: 'year-5-naplan',
    salesPct: 0.12,
    cacEfficiency: 0.60,
    testDate: '2026-03-17',
    testDate2027: '2027-03-16',
    type: 'fixed',
  },
  {
    slug: 'year-7-naplan',
    salesPct: 0.04,
    cacEfficiency: 0.50,
    testDate: '2026-03-17',
    testDate2027: '2027-03-16',
    type: 'fixed',
  },
  {
    slug: 'nsw-selective',
    salesPct: 0.02,
    cacEfficiency: 0.70,
    testDate: '2026-05-01',
    testDate2027: '2027-05-01',
    registrationDeadline: '2026-02-20',
    registrationDeadline2027: '2027-02-19',
    type: 'fixed',
  },
];

const ANNUAL_BUDGET = 20000;

/**
 * Calculate seasonal multiplier for a product on a given date
 */
function calculateSeasonalMultiplier(
  product: any,
  date: Date
): number {
  const year = date.getFullYear();
  const testDateStr = year === 2026 ? product.testDate : product.testDate2027;
  const testDate = new Date(testDateStr);

  // Special handling for rolling tests (ACER/EduTest)
  if (product.type === 'rolling') {
    const month = date.getMonth() + 1; // 1-12

    // Q1 peak (Jan-Mar)
    if (month >= 1 && month <= 3) return 1.00;
    // December (pre-Q1 ramp)
    if (month === 12) return 0.80;
    // Mid-year peak (June) - EduTest
    if (month === 6 && product.slug === 'edutest-scholarship') return 0.90;
    // May (pre mid-year) - EduTest
    if (month === 5 && product.slug === 'edutest-scholarship') return 0.60;
    // October-November (early awareness)
    if (month >= 10 && month <= 11) return 0.40;
    // Baseline
    return 0.25;
  }

  // Fixed-date tests: calculate weeks until test
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeksUntilTest = (testDate.getTime() - date.getTime()) / msPerWeek;

  // Check registration deadline boost
  if (product.registrationDeadline || product.registrationDeadline2027) {
    const deadlineStr =
      year === 2026 ? product.registrationDeadline : product.registrationDeadline2027;
    if (deadlineStr) {
      const deadline = new Date(deadlineStr);
      const daysUntilDeadline = Math.floor(
        (deadline.getTime() - date.getTime()) / (24 * 60 * 60 * 1000)
      );

      // Boost during deadline week
      if (daysUntilDeadline >= 0 && daysUntilDeadline <= 7) {
        return 0.85; // Deadline week boost
      }
    }
  }

  // Standard curve based on weeks until test
  if (weeksUntilTest < 0) return 0.05; // Post-test (dead)
  if (weeksUntilTest <= 2) return 0.70; // Imminent (0-2 weeks)
  if (weeksUntilTest <= 6) return 1.00; // PEAK (2-6 weeks) - most buying
  if (weeksUntilTest <= 10) return 0.75; // Serious prep (6-10 weeks)
  if (weeksUntilTest <= 15) return 0.50; // Growing awareness (10-15 weeks)
  if (weeksUntilTest <= 20) return 0.30; // Early awareness (15-20 weeks)
  if (weeksUntilTest <= 26) return 0.15; // Very early (20-26 weeks)
  return 0.05; // Too early (26+ weeks)
}

/**
 * Get phase name for a seasonal multiplier
 */
function getPhaseName(multiplier: number): string {
  if (multiplier >= 0.95) return 'PEAK';
  if (multiplier >= 0.70) return 'RAMP_UP';
  if (multiplier >= 0.50) return 'CONSIDERATION';
  if (multiplier >= 0.30) return 'EARLY_AWARENESS';
  if (multiplier >= 0.15) return 'BASELINE';
  if (multiplier >= 0.10) return 'TOO_EARLY';
  return 'POST_TEST';
}

/**
 * Generate all Mondays between start and end dates
 */
function getMondays(startDate: Date, endDate: Date): Date[] {
  const mondays: Date[] = [];
  const current = new Date(startDate);

  // Find first Monday
  while (current.getDay() !== 1) {
    current.setDate(current.getDate() + 1);
  }

  // Collect all Mondays
  while (current <= endDate) {
    mondays.push(new Date(current));
    current.setDate(current.getDate() + 7);
  }

  return mondays;
}

/**
 * Calculate market heat (weighted average of all products' seasonal multipliers)
 */
function calculateMarketHeat(date: Date): number {
  let weightedSum = 0;

  for (const product of PRODUCTS) {
    const seasonal = calculateSeasonalMultiplier(product, date);
    weightedSum += seasonal * product.salesPct;
  }

  return Math.round(weightedSum * 100) / 100; // Round to 2 decimals
}

/**
 * Allocate weekly budget across products
 */
function allocateWeeklyBudget(date: Date, weeklyBudget: number) {
  // Calculate opportunity score for each product
  const scores = PRODUCTS.map((product) => {
    const seasonal = calculateSeasonalMultiplier(product, date);
    const score = seasonal * product.salesPct * product.cacEfficiency;
    return { product, seasonal, score };
  });

  const totalScore = scores.reduce((sum, s) => sum + s.score, 0);

  // Allocate budget proportionally
  const allocations: Record<string, any> = {};

  for (const { product, seasonal, score } of scores) {
    const dailyBudget =
      totalScore > 0 ? (score / totalScore) * (weeklyBudget / 7) : 0;

    allocations[product.slug] = {
      seasonal_multiplier: seasonal,
      opportunity_score: Math.round(score * 10000) / 10000,
      daily_budget: Math.round(dailyBudget * 100) / 100,
      weekly_budget: Math.round(dailyBudget * 7 * 100) / 100,
      phase: getPhaseName(seasonal),
    };
  }

  return allocations;
}

/**
 * Main generation function
 */
async function generateBudgetCalendar() {
  console.log('\n🗓️  Generating 104-Week Intelligent Budget Allocation\n');
  console.log('═'.repeat(80));
  console.log(`Annual Budget: $${ANNUAL_BUDGET.toLocaleString()}`);
  console.log(`Period: Jan 2026 - Dec 2027`);
  console.log('═'.repeat(80));

  // Generate all Mondays from Jan 2026 to Dec 2027
  const startDate = new Date('2026-01-05'); // First Monday of 2026
  const endDate = new Date('2027-12-31');
  const mondays = getMondays(startDate, endDate);

  console.log(`\n✓ Generated ${mondays.length} weeks\n`);

  // Calculate market heat for each week
  const weeklyData = mondays.map((monday, index) => {
    const year = monday.getFullYear();
    const marketHeat = calculateMarketHeat(monday);

    return {
      weekStartDate: monday.toISOString().split('T')[0],
      weekNumber: index + 1,
      year,
      marketHeat,
    };
  });

  // Calculate total annual heat (for budget distribution)
  const totalHeat2026 = weeklyData
    .filter((w) => w.year === 2026)
    .reduce((sum, w) => sum + w.marketHeat, 0);

  const totalHeat2027 = weeklyData
    .filter((w) => w.year === 2027)
    .reduce((sum, w) => sum + w.marketHeat, 0);

  console.log('Market Heat Analysis:');
  console.log(`  2026 total heat: ${totalHeat2026.toFixed(2)}`);
  console.log(`  2027 total heat: ${totalHeat2027.toFixed(2)}\n`);

  // Allocate annual budget proportionally to market heat
  const weeklyAllocations = weeklyData.map((week) => {
    const annualBudget = week.year === 2026 ? ANNUAL_BUDGET : ANNUAL_BUDGET;
    const totalHeat = week.year === 2026 ? totalHeat2026 : totalHeat2027;

    // Weekly budget = (week's heat / total heat) × annual budget
    const weeklyBudget = (week.marketHeat / totalHeat) * annualBudget;

    const productAllocations = allocateWeeklyBudget(
      new Date(week.weekStartDate),
      weeklyBudget
    );

    return {
      week_start_date: week.weekStartDate,
      week_number: week.weekNumber,
      year: week.year,
      market_heat: week.marketHeat,
      weekly_budget_aud: Math.round(weeklyBudget * 100) / 100,
      product_allocations: productAllocations,
    };
  });

  // Verify total budget
  const total2026 = weeklyAllocations
    .filter((w) => w.year === 2026)
    .reduce((sum, w) => sum + w.weekly_budget_aud, 0);

  const total2027 = weeklyAllocations
    .filter((w) => w.year === 2027)
    .reduce((sum, w) => sum + w.weekly_budget_aud, 0);

  console.log('Budget Verification:');
  console.log(`  2026 allocated: $${total2026.toFixed(2)} (target: $${ANNUAL_BUDGET})`);
  console.log(`  2027 allocated: $${total2027.toFixed(2)} (target: $${ANNUAL_BUDGET})\n`);

  // Show sample weeks
  console.log('Sample Weeks:\n');

  const sampleWeeks = [
    weeklyAllocations[0], // First week
    weeklyAllocations.find((w) => w.week_start_date === '2026-02-23'), // Peak week
    weeklyAllocations.find((w) => w.week_start_date === '2026-08-03'), // Dead week
  ].filter(Boolean);

  for (const week of sampleWeeks) {
    const dailyBudget = week.weekly_budget_aud / 7;
    console.log(`Week of ${week.week_start_date} (Heat: ${week.market_heat})`);
    console.log(`  Daily Budget: $${dailyBudget.toFixed(2)}/day`);
    console.log(`  Allocations:`);

    const sorted = Object.entries(week.product_allocations).sort(
      ([, a]: any, [, b]: any) => b.daily_budget - a.daily_budget
    );

    for (const [slug, alloc] of sorted) {
      const a = alloc as any;
      console.log(
        `    ${slug.padEnd(20)} $${a.daily_budget.toFixed(2).padStart(6)}/day (${a.phase})`
      );
    }
    console.log('');
  }

  // Insert into database
  console.log('💾 Inserting into Supabase...\n');

  const { error } = await supabase
    .from('weekly_budget_allocation')
    .upsert(weeklyAllocations, {
      onConflict: 'week_start_date',
      ignoreDuplicates: false,
    });

  if (error) {
    throw new Error(`Failed to insert budget allocations: ${error.message}`);
  }

  console.log('✅ Successfully generated 104-week budget allocation!\n');
  console.log('═'.repeat(80));
  console.log('Next Steps:');
  console.log('  1. Run migration: npx supabase db push');
  console.log('  2. Run this script: tsx scripts/marketing/generate-budget-calendar.ts');
  console.log('  3. Google Ads Agent will read from weekly_budget_allocation table');
  console.log('  4. SEO Agent will use same calendar for content volume');
  console.log('═'.repeat(80));
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateBudgetCalendar().catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
}

export { generateBudgetCalendar };
