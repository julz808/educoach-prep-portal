/**
 * Budget Executor V2
 *
 * Automatically executes weekly budget allocation from weekly_budget_allocation table
 * NO human approval needed - this is preset strategy
 */

import { GoogleAdsApi, MutateOperation, resources } from 'google-ads-api';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

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

// Map product slugs to campaign names
const CAMPAIGN_MAPPING: Record<string, string> = {
  'vic-selective': 'VIC Selective Entry',
  'nsw-selective': 'NSW Selective Entry',
  'year-5-naplan': 'Year 5 NAPLAN',
  'year-7-naplan': 'Year 7 NAPLAN',
  'acer-scholarship': 'ACER Scholarship',
  'edutest-scholarship': 'EduTest Scholarship',
};

interface BudgetChange {
  product_slug: string;
  campaign_name: string;
  previous_budget: number;
  new_budget: number;
  phase: string;
  status: 'success' | 'failed' | 'skipped';
  message?: string;
}

export class BudgetExecutor {

  async execute(): Promise<BudgetChange[]> {
    console.log('💰 BUDGET EXECUTOR V2\n');
    console.log('Auto-executing preset budget strategy...\n');

    const changes: BudgetChange[] = [];

    try {
      // 1. Get current week allocation
      const allocation = await this.getCurrentWeekAllocation();

      if (!allocation) {
        console.log('⚠️  No allocation found for current week. Skipping budget updates.\n');
        return changes;
      }

      console.log(`Week: ${allocation.week_start_date}`);
      console.log(`Market Heat: ${allocation.market_heat}`);
      console.log(`Weekly Budget: $${allocation.weekly_budget_aud} AUD\n`);

      // 2. Get all campaigns
      const campaigns = await this.getAllCampaigns();

      // 3. Update each campaign based on allocation
      for (const [slug, campaignName] of Object.entries(CAMPAIGN_MAPPING)) {
        const campaign = campaigns.find(c => c.name === campaignName);

        if (!campaign) {
          console.log(`⚠️  Campaign not found: ${campaignName}\n`);
          continue;
        }

        const productAlloc = allocation.product_allocations[slug];

        if (!productAlloc) {
          console.log(`⚠️  No allocation for ${slug}\n`);
          continue;
        }

        const targetBudget = productAlloc.daily_budget;
        const currentBudget = campaign.budgetDaily;
        const targetStatus = productAlloc.phase === 'PAUSED' ? 'PAUSED' : 'ENABLED';
        const currentStatus = campaign.status;

        console.log(`📊 ${campaignName}`);
        console.log(`   Phase: ${productAlloc.phase}`);
        console.log(`   Current: ${currentStatus} @ $${currentBudget.toFixed(2)}/day`);
        console.log(`   Target:  ${targetStatus} @ $${targetBudget.toFixed(2)}/day`);

        // Check if update needed (1% tolerance to avoid constant micro-adjustments)
        const budgetDiff = Math.abs(targetBudget - currentBudget);
        const tolerance = targetBudget * 0.01;
        const budgetNeedsUpdate = budgetDiff > tolerance;
        const statusNeedsUpdate = currentStatus !== targetStatus;

        if (!budgetNeedsUpdate && !statusNeedsUpdate) {
          console.log(`   ✓ Already correct (within 1% tolerance)\n`);
          changes.push({
            product_slug: slug,
            campaign_name: campaignName,
            previous_budget: currentBudget,
            new_budget: currentBudget,
            phase: productAlloc.phase,
            status: 'skipped',
            message: 'Already correct'
          });
          continue;
        }

        // Update campaign
        try {
          if (budgetNeedsUpdate) {
            await this.updateCampaignBudget(campaign.id, campaign.budgetResourceName, targetBudget);
            console.log(`   ✅ Budget updated: $${currentBudget.toFixed(2)} → $${targetBudget.toFixed(2)}`);
          }

          if (statusNeedsUpdate) {
            await this.updateCampaignStatus(campaign.id, targetStatus);
            console.log(`   ✅ Status updated: ${currentStatus} → ${targetStatus}`);
          }

          console.log('');

          changes.push({
            product_slug: slug,
            campaign_name: campaignName,
            previous_budget: currentBudget,
            new_budget: targetBudget,
            phase: productAlloc.phase,
            status: 'success'
          });

        } catch (error: any) {
          console.error(`   ❌ Update failed: ${error.message}\n`);

          changes.push({
            product_slug: slug,
            campaign_name: campaignName,
            previous_budget: currentBudget,
            new_budget: currentBudget,
            phase: productAlloc.phase,
            status: 'failed',
            message: error.message
          });
        }

        // Rate limit: wait 1 second between campaigns
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log('═'.repeat(60));
      console.log(`\n✅ Budget execution complete`);
      console.log(`   Updates: ${changes.filter(c => c.status === 'success').length}`);
      console.log(`   Skipped: ${changes.filter(c => c.status === 'skipped').length}`);
      console.log(`   Failed: ${changes.filter(c => c.status === 'failed').length}\n`);

      return changes;

    } catch (error) {
      console.error('❌ Fatal error in budget execution:', error);
      throw error;
    }
  }

  private async getCurrentWeekAllocation() {
    // Get Monday of current week
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + daysToMonday);
    const mondayStr = monday.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('weekly_budget_allocation')
      .select('*')
      .eq('week_start_date', mondayStr)
      .single();

    if (error) {
      console.error('Error fetching allocation:', error);
      return null;
    }

    return data;
  }

  private async getAllCampaigns() {
    const query = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign_budget.id,
        campaign_budget.resource_name,
        campaign_budget.amount_micros
      FROM campaign
      WHERE campaign.status != 'REMOVED'
    `;

    const results = await customer.query(query);

    const statusMap: Record<number, string> = {
      2: 'ENABLED',
      3: 'PAUSED',
    };

    return results.map((row: any) => ({
      id: row.campaign.id.toString(),
      name: row.campaign.name,
      status: statusMap[row.campaign.status] || 'UNKNOWN',
      budgetId: row.campaign_budget.id.toString(),
      budgetResourceName: row.campaign_budget.resource_name,
      budgetDaily: parseInt(row.campaign_budget.amount_micros) / 1_000_000,
    }));
  }

  private async updateCampaignBudget(campaignId: string, budgetResourceName: string, dailyBudgetAud: number) {
    const budgetMicros = Math.round(dailyBudgetAud * 1_000_000);

    const operation: MutateOperation<resources.ICampaignBudget> = {
      entity: 'campaign_budget',
      operation: 'update',
      resource: {
        resource_name: budgetResourceName,
        amount_micros: budgetMicros,
      },
      update_mask: {
        paths: ['amount_micros']
      }
    };

    await customer.mutateResources([operation]);
  }

  private async updateCampaignStatus(campaignId: string, status: string) {
    const statusCode = status === 'ENABLED' ? 2 : 3;

    const operation: MutateOperation<resources.ICampaign> = {
      entity: 'campaign',
      operation: 'update',
      resource: {
        resource_name: `customers/${process.env.GOOGLE_ADS_CUSTOMER_ID}/campaigns/${campaignId}`,
        status: statusCode,
      },
      update_mask: {
        paths: ['status']
      }
    };

    await customer.mutateResources([operation]);
  }
}

// Run standalone if called directly
// Note: ES modules don't support require.main === module
// This file is meant to be imported by index-weekly-v2.ts
