#!/usr/bin/env tsx
/**
 * Generate 104-Week Budget Allocation V2
 *
 * NEW PHILOSOPHY:
 * - Give all 6 products a FAIR opportunity with optimized ads
 * - Slight weighting towards ACER, VIC, EduTest (strategic picks)
 * - Purchase timing: Most buying happens Dec/Jan/Feb (school year planning)
 * - NOT based on historical sales (small sample, unoptimized ads)
 *
 * Annual Budget: $20,000
 * Period: Jan 2026 - Dec 2027
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// PRODUCT CONFIGURATIONS
const PRODUCTS = [
  {
    slug: 'acer-scholarship',
    weight: 1.3, // Strategic priority (higher CAC tolerance)
    testDate: '2026-02-28',
    testDate2027: '2027-02-28',
    applicationsOpen: '2025-09-22', // Q4 previous year!
    applicationsClose: '2026-02-08',
    type: 'rolling', // Alternative dates throughout year
  },
  {
    slug: 'vic-selective',
    weight: 1.3, // Strategic priority (large market)
    testDate: '2026-06-20',
    testDate2027: '2027-06-19',
    applicationsOpen: '2026-03-02',
    applicationsClose: '2026-04-24',
    type: 'fixed',
  },
  {
    slug: 'edutest-scholarship',
    weight: 1.2, // Strategic priority (multiple peaks)
    testDate: '2026-03-15', // Q1 peak
    testDate2: '2026-06-20', // Mid-year peak
    testDate2027: '2027-03-15',
    type: 'rolling', // Scattered school dates
  },
  {
    slug: 'year-5-naplan',
    weight: 1.0, // Equal opportunity
    testDate: '2026-03-17',
    testDate2027: '2027-03-16',
    type: 'fixed',
  },
  {
    slug: 'year-7-naplan',
    weight: 1.0, // Equal opportunity
    testDate: '2026-03-17',
    testDate2027: '2027-03-16',
    type: 'fixed',
  },
  {
    slug: 'nsw-selective',
    weight: 1.0, // Equal opportunity
    testDate: '2026-05-01',
    testDate2027: '2027-05-01',
    applicationsOpen: '2025-11-06', // Q4 previous year!
    applicationsClose: '2026-02-20',
    type: 'fixed',
  },
];

const ANNUAL_BUDGET = 20000;

/**
 * Calculate seasonal multiplier based on REAL buyer behavior:
 * - Parents plan during Dec/Jan/Feb (school year planning)
 * - NOT last-minute (2 weeks out)
 * - Applications opening drives urgency
 */
function calculateSeasonalMultiplier(product: any, date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12
  const testDateStr = year === 2026 ? product.testDate : product.testDate2027;
  const testDate = new Date(testDateStr);

  // ACER: Rolling tests with Q4 → Q1 cycle
  if (product.slug === 'acer-scholarship') {
    // Applications open Sept 22, 2025
    // Tests: Feb 7 (SA), Feb 28 (other states)
    // Peak buying: Oct → Feb (when applications are open)

    if (month === 9) return 0.40; // Applications just opened
    if (month === 10) return 0.70; // October (early prep, 4 months to test)
    if (month === 11) return 0.80; // November (3 months to test)
    if (month === 12) return 1.00; // December (PEAK - school year planning)
    if (month === 1) return 1.00; // January (PEAK - New Year resolution)
    if (month === 2) return 0.90; // February (final prep, test approaching)
    if (month === 3) return 0.20; // March (most tests done)
    if (month >= 4 && month <= 8) return 0.15; // Alternative dates only
    return 0.15;
  }

  // EduTest: Q1 peak + mid-year peak (scattered schools)
  if (product.slug === 'edutest-scholarship') {
    // Most schools test Q1 (Feb-Mar) or mid-year (June)
    // Peak buying: Oct → Mar (Q1 prep)

    if (month === 10) return 0.60; // October (early Q1 prep)
    if (month === 11) return 0.70; // November (Q1 planning)
    if (month === 12) return 1.00; // December (PEAK - school year planning)
    if (month === 1) return 1.00; // January (PEAK - New Year)
    if (month === 2) return 1.00; // February (Q1 test window)
    if (month === 3) return 0.90; // March (Q1 test window)
    if (month === 4) return 0.30; // April (between Q1 and mid-year)
    if (month === 5) return 0.70; // May (mid-year ramp-up)
    if (month === 6) return 0.80; // June (mid-year peak)
    if (month >= 7 && month <= 9) return 0.25; // Baseline (scattered tests)
    return 0.25;
  }

  // NSW Selective: Applications open Nov 6, 2025
  if (product.slug === 'nsw-selective') {
    // Applications: Nov 6, 2025 → Feb 20, 2026
    // Test: May 1-2, 2026
    // Peak buying: Nov → Feb (when applications are open)

    if (month === 11) return 1.00; // November (PEAK - applications just opened)
    if (month === 12) return 1.00; // December (PEAK - school year planning)
    if (month === 1) return 1.00; // January (PEAK - New Year)
    if (month === 2) return 0.90; // February (deadline Feb 20)
    if (month === 3) return 0.60; // March (applications closed, 2 months to test)
    if (month === 4) return 0.50; // April (1 month to test)
    if (month === 5) return 0.20; // May (test happening)
    if (month >= 6 && month <= 10) return 0.05; // Post-test
    return 0.05;
  }

  // VIC Selective: Applications open Mar 2, 2026
  if (product.slug === 'vic-selective') {
    // Applications: Mar 2 → Apr 24, 2026
    // Test: June 20, 2026
    // Peak buying: Dec → June (long awareness + application window)

    if (month === 12) return 0.80; // December (early awareness, 6 months to test)
    if (month === 1) return 0.80; // January (New Year planning)
    if (month === 2) return 0.90; // February (applications opening soon)
    if (month === 3) return 1.00; // March (PEAK - applications open)
    if (month === 4) return 1.00; // April (PEAK - deadline Apr 24)
    if (month === 5) return 0.90; // May (6 weeks to test)
    if (month === 6) return 0.60; // June (test June 20)
    if (month >= 7 && month <= 11) return 0.05; // Post-test
    return 0.05;
  }

  // NAPLAN (Year 5 & 7): Test March 11-23
  const isNaplan =
    product.slug === 'year-5-naplan' || product.slug === 'year-7-naplan';
  if (isNaplan) {
    // Test: March 11-23, 2026
    // Peak buying: Nov → Feb (school year planning for March test)

    if (month === 11) return 0.60; // November (4 months to test)
    if (month === 12) return 1.00; // December (PEAK - school year planning)
    if (month === 1) return 1.00; // January (PEAK - New Year)
    if (month === 2) return 1.00; // February (PEAK - 1 month to test)
    if (month === 3) return 0.50; // March (test happening)
    if (month >= 4 && month <= 10) return 0.05; // Post-test
    return 0.05;
  }

  return 0.15; // Default baseline
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
  let totalWeight = 0;

  for (const product of PRODUCTS) {
    const seasonal = calculateSeasonalMultiplier(product, date);
    weightedSum += seasonal * product.weight;
    totalWeight += product.weight;
  }

  return Math.round((weightedSum / totalWeight) * 100) / 100;
}

/**
 * Allocate weekly budget across products
 */
function allocateWeeklyBudget(date: Date, weeklyBudget: number) {
  // Calculate opportunity score for each product
  const scores = PRODUCTS.map((product) => {
    const seasonal = calculateSeasonalMultiplier(product, date);
    const score = seasonal * product.weight; // No CAC efficiency yet (untested)
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
  console.log('\n🗓️  Generating 104-Week Budget Allocation (V2 - Fair Opportunity)\n');
  console.log('═'.repeat(80));
  console.log(`Annual Budget: $${ANNUAL_BUDGET.toLocaleString()}`);
  console.log(`Period: Jan 2026 - Dec 2027`);
  console.log('\n💡 NEW PHILOSOPHY:');
  console.log('   • Equal opportunity for all 6 products');
  console.log('   • Slight weighting: ACER (1.3x), VIC (1.3x), EduTest (1.2x)');
  console.log('   • Purchase timing: Dec/Jan/Feb (school year planning)');
  console.log('   • NOT based on historical sales (small sample)');
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
    weeklyAllocations.find((w) => w.week_start_date === '2025-12-29'), // Dec (PEAK planning)
    weeklyAllocations.find((w) => w.week_start_date === '2026-01-05'), // Jan (PEAK New Year)
    weeklyAllocations.find((w) => w.week_start_date === '2026-02-02'), // Feb (PEAK final prep)
    weeklyAllocations.find((w) => w.week_start_date === '2026-08-03'), // Aug (dead zone)
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

  console.log('✅ Successfully generated 104-week budget allocation (V2)!\n');
  console.log('═'.repeat(80));
  console.log('Key Differences from V1:');
  console.log('  • NOT biased by historical sales (100 sales, unoptimized ads)');
  console.log('  • Equal opportunity for all products');
  console.log('  • Strategic weighting: ACER/VIC/EduTest get 20-30% more');
  console.log('  • Purchase timing: Dec/Jan/Feb (school year planning), not last-minute');
  console.log('  • Market heat shifted to Q4/Q1 (when parents actually buy)');
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
