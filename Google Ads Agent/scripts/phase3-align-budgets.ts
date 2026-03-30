import { GoogleAdsApi, MutateOperation, resources } from 'google-ads-api';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
});

const customer = client.Customer({
  customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID!,
  refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const slugToCampaign: Record<string, string> = {
  'vic-selective': 'VIC Selective Entry',
  'nsw-selective': 'NSW Selective Entry',
  'year-5-naplan': 'Year 5 NAPLAN',
  'year-7-naplan': 'Year 7 NAPLAN',
  'acer-scholarship': 'ACER Scholarship',
  'edutest-scholarship': 'EduTest Scholarship',
};

interface CampaignUpdate {
  campaignName: string;
  campaignId: string;
  currentStatus: string;
  currentBudget: number;
  targetStatus: string;
  targetBudgetDaily: number;
  budgetResourceName: string;
}

async function getCurrentWeekAllocation() {
  console.log('📊 Fetching current week budget allocation from Supabase\n');

  const { data, error } = await supabase
    .from('weekly_budget_allocation')
    .select('*')
    .order('week_start_date', { ascending: false });

  if (error) throw error;

  // Get current week
  const today = new Date();
  const currentWeekData = data?.find((record: any) => {
    const weekStart = new Date(record.week_start_date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return today >= weekStart && today < weekEnd;
  });

  if (!currentWeekData) {
    throw new Error('No budget allocation found for current week');
  }

  console.log(`✓ Found allocation for week starting ${currentWeekData.week_start_date}\n`);
  return currentWeekData;
}

async function getCampaignsWithBudgets() {
  console.log('📋 Fetching current campaign settings from Google Ads\n');

  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign_budget.id,
      campaign_budget.amount_micros,
      campaign_budget.resource_name
    FROM campaign
    WHERE campaign.status != 'REMOVED'
  `;

  const campaigns = await customer.query(query);

  const statusMap: Record<number, string> = {
    2: 'ENABLED',
    3: 'PAUSED',
    4: 'REMOVED',
  };

  const campaignData = campaigns.map((row: any) => ({
    id: row.campaign.id.toString(),
    name: row.campaign.name,
    status: statusMap[row.campaign.status] || 'UNKNOWN',
    budgetId: row.campaign_budget.id.toString(),
    budgetResourceName: row.campaign_budget.resource_name,
    budgetMicros: parseInt(row.campaign_budget.amount_micros),
    budgetDaily: parseInt(row.campaign_budget.amount_micros) / 1_000_000,
  }));

  console.log(`✓ Found ${campaignData.length} campaigns\n`);
  return campaignData;
}

async function alignBudgetsAndStatus() {
  try {
    // Get current week allocation
    const allocation = await getCurrentWeekAllocation();
    const productAllocations = allocation.product_allocations;

    // Get current campaigns
    const campaigns = await getCampaignsWithBudgets();

    // Build update plan
    const updates: CampaignUpdate[] = [];

    for (const [slug, campaignName] of Object.entries(slugToCampaign)) {
      const campaign = campaigns.find((c: any) => c.name === campaignName);
      const planned = productAllocations[slug];

      if (!campaign) {
        console.log(`⚠️  Campaign not found: ${campaignName}`);
        continue;
      }

      if (!planned) {
        console.log(`⚠️  No allocation found for: ${slug}`);
        continue;
      }

      const targetStatus = planned.phase === 'PAUSED' ? 'PAUSED' : 'ENABLED';
      const targetBudget = planned.daily_budget;

      const needsUpdate =
        campaign.status !== targetStatus ||
        Math.abs(campaign.budgetDaily - targetBudget) > 0.1;

      if (needsUpdate) {
        updates.push({
          campaignName: campaign.name,
          campaignId: campaign.id,
          currentStatus: campaign.status,
          currentBudget: campaign.budgetDaily,
          targetStatus,
          targetBudgetDaily: targetBudget,
          budgetResourceName: campaign.budgetResourceName,
        });
      }
    }

    if (updates.length === 0) {
      console.log('✅ All campaigns already aligned with budget allocation\n');
      return;
    }

    // Show update plan
    console.log('📝 Update Plan:\n');
    console.log('═'.repeat(120));
    updates.forEach((update, i) => {
      console.log(`\n${i + 1}. ${update.campaignName}`);
      console.log(`   Campaign ID: ${update.campaignId}`);
      console.log(`   Status: ${update.currentStatus} → ${update.targetStatus}`);
      console.log(`   Budget: $${update.currentBudget.toFixed(2)}/day → $${update.targetBudgetDaily.toFixed(2)}/day`);
    });
    console.log('\n' + '═'.repeat(120));

    // Apply updates one at a time
    console.log('\n🔧 Applying updates...\n');

    for (const update of updates) {
      console.log(`\n📌 Updating: ${update.campaignName}`);

      const operations: MutateOperation<resources.ICampaignBudget | resources.ICampaign>[] = [];

      // Execute updates
      try {
        // Update budget if changed
        if (Math.abs(update.currentBudget - update.targetBudgetDaily) > 0.1) {
          const budgetMicros = Math.round(update.targetBudgetDaily * 1_000_000);

          const budgetOperation: MutateOperation<resources.ICampaignBudget> = {
            entity: 'campaign_budget',
            operation: 'update',
            resource: {
              resource_name: update.budgetResourceName,
              amount_micros: budgetMicros,
            },
            update_mask: {
              paths: ['amount_micros']
            }
          };

          await customer.mutateResources([budgetOperation]);

          console.log(`   ✅ Budget: $${update.currentBudget.toFixed(2)} → $${update.targetBudgetDaily.toFixed(2)}`);
        }

        // Update status if changed
        if (update.currentStatus !== update.targetStatus) {
          const statusCode = update.targetStatus === 'ENABLED' ? 2 : 3;

          const campaignOperation: MutateOperation<resources.ICampaign> = {
            entity: 'campaign',
            operation: 'update',
            resource: {
              resource_name: `customers/${process.env.GOOGLE_ADS_CUSTOMER_ID}/campaigns/${update.campaignId}`,
              status: statusCode,
            },
            update_mask: {
              paths: ['status']
            }
          };

          await customer.mutateResources([campaignOperation]);

          console.log(`   ✅ Status: ${update.currentStatus} → ${update.targetStatus}`);
        }

        // Log to file
        fs.appendFileSync(
          'phase3_changes_log.txt',
          `${new Date().toISOString()} | BUDGET_ALIGN | ${update.campaignName} | ` +
          `Status: ${update.currentStatus}→${update.targetStatus} | ` +
          `Budget: $${update.currentBudget.toFixed(2)}→$${update.targetBudgetDaily.toFixed(2)}\n`
        );

      } catch (error: any) {
        console.error(`   ❌ Error updating campaign: ${error.message}`);
        throw error;
      }

      // Wait 1 second between campaigns to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n✅ All campaigns aligned with weekly budget allocation\n');

    // Summary
    console.log('\n📊 Summary:');
    console.log(`   Total campaigns updated: ${updates.length}`);
    console.log(`   Budget changes: ${updates.filter(u => Math.abs(u.currentBudget - u.targetBudgetDaily) > 0.1).length}`);
    console.log(`   Status changes: ${updates.filter(u => u.currentStatus !== u.targetStatus).length}`);
    console.log('\n   All changes logged to: phase3_changes_log.txt\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

alignBudgetsAndStatus()
  .then(() => {
    console.log('✅ Phase 3.3 Complete: Campaign budgets and status aligned');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
