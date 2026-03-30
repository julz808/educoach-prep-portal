/**
 * Check Weekly Budget Allocation Status
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkBudgetAllocation() {
  console.log('📊 WEEKLY BUDGET ALLOCATION STATUS\n');

  // Get current week data
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const currentMonday = new Date(today);
  currentMonday.setDate(today.getDate() + daysToMonday);
  const currentMondayStr = currentMonday.toISOString().split('T')[0];

  console.log(`Today: ${today.toISOString().split('T')[0]}`);
  console.log(`Current Week Monday: ${currentMondayStr}\n`);

  // Get next 5 weeks
  const { data, error } = await supabase
    .from('weekly_budget_allocation')
    .select('*')
    .gte('week_start_date', currentMondayStr)
    .order('week_start_date')
    .limit(5);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚠️  NO DATA FOUND for current/future weeks\n');
    console.log('This means the budget executor will have nothing to execute!\n');

    // Check if there's ANY data
    const { data: anyData } = await supabase
      .from('weekly_budget_allocation')
      .select('week_start_date')
      .order('week_start_date', { ascending: false })
      .limit(1);

    if (anyData && anyData.length > 0) {
      console.log(`Latest data in table: ${anyData[0].week_start_date}`);
      console.log('The table exists but needs to be populated with current/future weeks.\n');
    }

    return;
  }

  console.log(`✅ Found ${data.length} weeks of budget data\n`);
  console.log('═'.repeat(100));

  data.forEach((week: any) => {
    const isCurrent = week.week_start_date === currentMondayStr;
    console.log(`\n${isCurrent ? '👉 ' : '   '}Week: ${week.week_start_date} ${isCurrent ? '(CURRENT WEEK)' : ''}`);
    console.log(`   Weekly Budget: $${week.weekly_budget_aud.toFixed(2)} AUD`);
    console.log(`   Market Heat: ${week.market_heat.toFixed(2)}`);

    if (week.product_allocations) {
      console.log(`\n   Product Allocations:`);
      Object.entries(week.product_allocations).forEach(([product, alloc]: [string, any]) => {
        console.log(`      ${product}:`);
        console.log(`         Phase: ${alloc.phase}`);
        console.log(`         Daily Budget: $${alloc.daily_budget.toFixed(2)}`);
        console.log(`         Weekly Budget: $${alloc.weekly_budget.toFixed(2)}`);
      });
    }

    console.log('\n' + '─'.repeat(100));
  });

  console.log('\n✅ Budget allocation table is ready!\n');
}

checkBudgetAllocation()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Failed:', error);
    process.exit(1);
  });
