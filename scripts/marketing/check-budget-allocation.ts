#!/usr/bin/env tsx
/**
 * Check Weekly Budget Allocation Table
 * Quick script to verify data exists and show sample
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBudgetAllocation() {
  console.log('\n📊 Checking Weekly Budget Allocation Table\n');
  console.log('═'.repeat(80));

  try {
    // Check if table exists and has data
    const { data: rows, error, count } = await supabase
      .from('weekly_budget_allocation')
      .select('*', { count: 'exact' })
      .order('week_start_date', { ascending: true })
      .limit(5);

    if (error) {
      console.log('❌ Error:', error.message);
      console.log('\nThe table might not exist yet.');
      console.log('\nTo create it, run:');
      console.log('  1. npx supabase db push');
      console.log('  2. tsx scripts/marketing/generate-budget-calendar-v2.ts');
      return;
    }

    if (!rows || rows.length === 0) {
      console.log('⚠️  Table exists but has no data\n');
      console.log('To populate it, run:');
      console.log('  tsx scripts/marketing/generate-budget-calendar-v2.ts');
      return;
    }

    console.log(`✅ Table exists with ${count} weeks of data\n`);

    // Show date range
    const { data: range } = await supabase
      .from('weekly_budget_allocation')
      .select('week_start_date')
      .order('week_start_date', { ascending: true });

    if (range && range.length > 0) {
      const earliest = range[0].week_start_date;
      const latest = range[range.length - 1].week_start_date;
      console.log(`Date Range: ${earliest} to ${latest}\n`);
    }

    // Show first 3 weeks
    console.log('First 3 Weeks:\n');
    for (const week of rows.slice(0, 3)) {
      console.log(`Week of ${week.week_start_date}:`);
      console.log(`  Market Heat: ${week.market_heat}`);
      console.log(`  Weekly Budget: $${week.weekly_budget_aud}`);
      console.log(`  Daily Budget: $${week.daily_budget_aud}`);
      console.log(`  Products:`);

      const allocations = week.product_allocations as any;
      const sorted = Object.entries(allocations).sort(
        ([, a]: any, [, b]: any) => b.daily_budget - a.daily_budget
      );

      for (const [slug, alloc] of sorted.slice(0, 3)) {
        const a = alloc as any;
        console.log(
          `    ${slug.padEnd(20)} $${a.daily_budget.toFixed(2).padStart(6)}/day (${a.phase})`
        );
      }
      console.log('');
    }

    // Show current week
    const today = new Date();
    const currentMonday = new Date(today);
    currentMonday.setDate(today.getDate() - today.getDay() + 1);
    const mondayStr = currentMonday.toISOString().split('T')[0];

    console.log('═'.repeat(80));
    console.log(`\nCurrent Week (${mondayStr}):\n`);

    const { data: currentWeek } = await supabase
      .from('weekly_budget_allocation')
      .select('*')
      .eq('week_start_date', mondayStr)
      .single();

    if (currentWeek) {
      console.log(`Market Heat: ${currentWeek.market_heat}`);
      console.log(`Weekly Budget: $${currentWeek.weekly_budget_aud}`);
      console.log(`Daily Budget: $${currentWeek.daily_budget_aud}\n`);
      console.log('Product Allocations:');

      const allocations = currentWeek.product_allocations as any;
      const sorted = Object.entries(allocations).sort(
        ([, a]: any, [, b]: any) => b.daily_budget - a.daily_budget
      );

      for (const [slug, alloc] of sorted) {
        const a = alloc as any;
        console.log(
          `  ${slug.padEnd(25)} $${a.daily_budget.toFixed(2).padStart(6)}/day  ${a.phase.padEnd(15)} (seasonal: ${a.seasonal_multiplier})`
        );
      }
    } else {
      console.log('⚠️  No data for current week');
    }

    console.log('\n' + '═'.repeat(80));
    console.log('\n✅ Data looks good!\n');
    console.log('This is stored in Supabase:');
    console.log(`  Database: ${supabaseUrl.replace('https://', '')}`);
    console.log(`  Table: weekly_budget_allocation`);
    console.log(`  Rows: ${count}`);

  } catch (error) {
    console.error('\n❌ Error:', error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  checkBudgetAllocation().catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
}

export { checkBudgetAllocation };
