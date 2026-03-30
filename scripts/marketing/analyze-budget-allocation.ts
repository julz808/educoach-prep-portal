#!/usr/bin/env tsx
/**
 * Analyze Budget Allocation
 *
 * Shows:
 * 1. Monthly budget breakdown (2026)
 * 2. Product allocation by month
 * 3. Detailed insights
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeBudgetAllocation() {
  console.log('\n📊 Budget Allocation Analysis (2026)\n');
  console.log('═'.repeat(80));

  // Get all 2026 data
  const { data: weeks, error } = await supabase
    .from('weekly_budget_allocation')
    .select('*')
    .eq('year', 2026)
    .order('week_start_date');

  if (error || !weeks) {
    throw new Error(`Failed to fetch data: ${error?.message}`);
  }

  // 1. MONTHLY BREAKDOWN
  console.log('\n1️⃣  MONTHLY BUDGET ALLOCATION (2026)\n');
  console.log('Month      Budget    Avg Heat  Phase');
  console.log('─'.repeat(60));

  const monthlyData: Record<string, any> = {};

  for (const week of weeks) {
    const month = week.week_start_date.substring(0, 7); // YYYY-MM
    if (!monthlyData[month]) {
      monthlyData[month] = {
        budget: 0,
        totalHeat: 0,
        weeks: 0,
      };
    }
    monthlyData[month].budget += week.weekly_budget_aud;
    monthlyData[month].totalHeat += week.market_heat;
    monthlyData[month].weeks += 1;
  }

  let totalBudget = 0;

  for (const [month, data] of Object.entries(monthlyData)) {
    const avgHeat = data.totalHeat / data.weeks;
    const phase = getPhaseFromHeat(avgHeat);
    console.log(
      `${month}   $${data.budget.toFixed(0).padStart(6)}    ${avgHeat.toFixed(2)}      ${phase}`
    );
    totalBudget += data.budget;
  }

  console.log('─'.repeat(60));
  console.log(`TOTAL      $${totalBudget.toFixed(0).padStart(6)}\n`);

  // 2. PRODUCT ALLOCATION BY MONTH
  console.log('\n2️⃣  PRODUCT ALLOCATION BY MONTH (2026)\n');

  const productMonthly: Record<string, Record<string, number>> = {};
  const products = [
    'acer-scholarship',
    'vic-selective',
    'edutest-scholarship',
    'year-5-naplan',
    'year-7-naplan',
    'nsw-selective',
  ];

  for (const week of weeks) {
    const month = week.week_start_date.substring(0, 7);
    const allocations = week.product_allocations as any;

    for (const product of products) {
      if (!productMonthly[product]) {
        productMonthly[product] = {};
      }
      if (!productMonthly[product][month]) {
        productMonthly[product][month] = 0;
      }
      const weeklyBudget = allocations[product]?.weekly_budget || 0;
      productMonthly[product][month] += weeklyBudget;
    }
  }

  // Print by quarter for readability
  const quarters = {
    Q1: ['2026-01', '2026-02', '2026-03'],
    Q2: ['2026-04', '2026-05', '2026-06'],
    Q3: ['2026-07', '2026-08', '2026-09'],
    Q4: ['2026-10', '2026-11', '2026-12'],
  };

  for (const [quarter, months] of Object.entries(quarters)) {
    console.log(`\n${quarter} (${months[0]} - ${months[2]})`);
    console.log('─'.repeat(80));

    // Header
    console.log(
      'Product'.padEnd(25) +
        months.map((m) => m.substring(5)).join('      ')
    );
    console.log('─'.repeat(80));

    // Products
    for (const product of products) {
      const displayName = product
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase())
        .substring(0, 22);

      const budgets = months.map((month) => {
        const budget = productMonthly[product][month] || 0;
        return `$${budget.toFixed(0).padStart(5)}`;
      });

      console.log(displayName.padEnd(25) + budgets.join('  '));
    }
  }

  // 3. KEY INSIGHTS
  console.log('\n\n3️⃣  KEY INSIGHTS\n');
  console.log('─'.repeat(80));

  // Find peak month
  let peakMonth = '';
  let peakBudget = 0;
  let deadMonth = '';
  let deadBudget = Infinity;

  for (const [month, data] of Object.entries(monthlyData)) {
    if (data.budget > peakBudget) {
      peakMonth = month;
      peakBudget = data.budget;
    }
    if (data.budget < deadBudget) {
      deadMonth = month;
      deadBudget = data.budget;
    }
  }

  console.log(`Peak Month: ${peakMonth} ($${peakBudget.toFixed(0)})`);
  console.log(`Dead Month: ${deadMonth} ($${deadBudget.toFixed(0)})`);
  console.log(
    `Peak/Dead Ratio: ${(peakBudget / deadBudget).toFixed(1)}x\n`
  );

  // Find top product by total annual allocation
  const productTotals: Record<string, number> = {};
  for (const product of products) {
    productTotals[product] = Object.values(productMonthly[product]).reduce(
      (sum, val) => sum + val,
      0
    );
  }

  const sortedProducts = Object.entries(productTotals).sort(
    ([, a], [, b]) => b - a
  );

  console.log('Annual Budget by Product:');
  for (const [product, total] of sortedProducts) {
    const pct = ((total / totalBudget) * 100).toFixed(1);
    const displayName = product
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
    console.log(`  ${displayName.padEnd(25)} $${total.toFixed(0).padStart(6)}  (${pct}%)`);
  }

  console.log('\n' + '═'.repeat(80));
}

function getPhaseFromHeat(heat: number): string {
  if (heat >= 0.70) return 'PEAK';
  if (heat >= 0.50) return 'HIGH';
  if (heat >= 0.30) return 'MEDIUM';
  if (heat >= 0.20) return 'LOW';
  return 'DEAD';
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  analyzeBudgetAllocation().catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
}

export { analyzeBudgetAllocation };
