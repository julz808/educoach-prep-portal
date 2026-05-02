import { GoogleAdsApi, enums } from 'google-ads-api';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
});

const customer = client.Customer({
  customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID!,
  refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
});

const SLUG_TO_CAMPAIGN: Record<string, string> = {
  'vic-selective': 'VIC Selective Entry',
  'nsw-selective': 'NSW Selective Entry',
  'year-5-naplan': 'Year 5 NAPLAN',
  'year-7-naplan': 'Year 7 NAPLAN',
  'acer-scholarship': 'ACER Scholarship',
  'edutest-scholarship': 'EduTest Scholarship',
};

async function main() {
  console.log('💰 Aligning campaign budgets to weekly_budget_allocation calendar\n');

  const calendar = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', '..', 'weekly_budget_allocation.json'), 'utf-8')
  );

  const today = new Date();
  const currentWeek = calendar.find((w: any) => {
    const start = new Date(w.week_start_date);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return today >= start && today < end;
  });

  if (!currentWeek) {
    console.error('❌ No current-week allocation found in calendar');
    process.exit(1);
  }

  console.log(`Week ${currentWeek.week_number}: ${currentWeek.week_start_date}`);
  console.log(`Total daily target: $${currentWeek.daily_budget_aud.toFixed(2)}\n`);

  // Get campaigns with their budget resource names
  const campaigns = await customer.query(`
    SELECT
      campaign.id,
      campaign.name,
      campaign_budget.resource_name,
      campaign_budget.amount_micros
    FROM campaign
    WHERE campaign.status != 'REMOVED'
  `);

  const byName = new Map<string, any>();
  for (const c of campaigns) {
    byName.set(c.campaign.name, c);
  }

  let totalOldDaily = 0;
  let totalNewDaily = 0;

  for (const [slug, alloc] of Object.entries(currentWeek.product_allocations) as any) {
    const campaignName = SLUG_TO_CAMPAIGN[slug];
    const c = byName.get(campaignName);
    if (!c) {
      console.log(`⚠️  Campaign "${campaignName}" not found, skipping\n`);
      continue;
    }

    const oldDaily = (c.campaign_budget.amount_micros || 0) / 1_000_000;
    const newDaily = alloc.daily_budget;
    const delta = newDaily - oldDaily;

    totalOldDaily += oldDaily;
    totalNewDaily += newDaily;

    console.log(`📊 ${campaignName} [${alloc.phase}]`);
    console.log(`   $${oldDaily.toFixed(2)}/day → $${newDaily.toFixed(2)}/day (Δ ${delta >= 0 ? '+' : ''}$${delta.toFixed(2)})`);

    if (Math.abs(delta) < 0.05) {
      console.log(`   ⏭️  Already aligned (within $0.05)\n`);
      continue;
    }

    try {
      await customer.campaignBudgets.update([{
        resource_name: c.campaign_budget.resource_name,
        amount_micros: Math.round(newDaily * 1_000_000),
        update_mask: { paths: ['amount_micros'] },
      }]);
      console.log(`   ✅ Budget updated\n`);
    } catch (err: any) {
      console.error(`   ❌ Failed: ${err.message}\n`);
      if (err.errors) console.error(JSON.stringify(err.errors, null, 2));
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Old total daily: $${totalOldDaily.toFixed(2)}`);
  console.log(`New total daily: $${totalNewDaily.toFixed(2)}`);
  console.log(`Saving: $${(totalOldDaily - totalNewDaily).toFixed(2)}/day = $${((totalOldDaily - totalNewDaily) * 30).toFixed(0)}/month`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error:', err.message);
    if (err.errors) console.error(JSON.stringify(err.errors, null, 2));
    process.exit(1);
  });
