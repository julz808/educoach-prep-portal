import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getBudgetAllocation() {
  console.log('📊 Fetching weekly_budget_allocation from Supabase\n');

  try {
    const { data, error } = await supabase
      .from('weekly_budget_allocation')
      .select('*')
      .order('week_start_date', { ascending: true });

    if (error) {
      console.error('❌ Error fetching budget allocation:', error);
      throw error;
    }

    console.log(`✓ Found ${data?.length || 0} budget allocation records\n`);

    if (data && data.length > 0) {
      // Show sample
      console.log('Sample records:');
      console.log(JSON.stringify(data.slice(0, 3), null, 2));
      console.log('');

      // Save to file
      fs.writeFileSync(
        'weekly_budget_allocation.json',
        JSON.stringify(data, null, 2)
      );
      console.log('💾 Saved to weekly_budget_allocation.json\n');

      // Get current week
      const today = new Date();
      const currentWeekData = data.filter((record: any) => {
        const weekStart = new Date(record.week_start_date);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        return today >= weekStart && today < weekEnd;
      });

      if (currentWeekData.length > 0) {
        console.log('📅 Current Week Allocations:');
        console.log('');
        currentWeekData.forEach((record: any) => {
          console.log(`Campaign: ${record.campaign_name || record.product_slug}`);
          console.log(`  Week: ${record.week_start_date}`);
          console.log(`  Planned Budget: $${record.planned_weekly_budget || 0}`);
          console.log(`  Daily: $${((record.planned_weekly_budget || 0) / 7).toFixed(2)}`);
          console.log(`  Status: ${record.should_be_active ? 'ACTIVE' : 'PAUSED'}`);
          console.log('');
        });
      }

      return data;
    } else {
      console.log('⚠️  No budget allocation data found in table');
      return [];
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

getBudgetAllocation()
  .then(() => {
    console.log('✅ Budget allocation fetched successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
