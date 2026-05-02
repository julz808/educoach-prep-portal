import { GoogleAdsApi } from 'google-ads-api';
import * as dotenv from 'dotenv';
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

// Conversion action category enum (partial)
const categoryMap: Record<number, string> = {
  0: 'UNSPECIFIED', 1: 'UNKNOWN', 2: 'DEFAULT', 3: 'PAGE_VIEW', 4: 'PURCHASE',
  5: 'SIGNUP', 6: 'LEAD', 7: 'DOWNLOAD', 8: 'ADD_TO_CART', 9: 'BEGIN_CHECKOUT',
  10: 'SUBSCRIBE_PAID', 11: 'PHONE_CALL_LEAD', 12: 'IMPORTED_LEAD',
  13: 'SUBMIT_LEAD_FORM', 14: 'BOOK_APPOINTMENT', 15: 'REQUEST_QUOTE',
  16: 'GET_DIRECTIONS', 17: 'OUTBOUND_CLICK', 18: 'CONTACT', 19: 'ENGAGEMENT',
  20: 'STORE_VISIT', 21: 'STORE_SALE', 22: 'QUALIFIED_LEAD',
  23: 'CONVERTED_LEAD',
};
const statusMap: Record<number, string> = {
  0: 'UNSPECIFIED', 1: 'UNKNOWN', 2: 'ENABLED', 3: 'REMOVED', 4: 'HIDDEN',
};
const includeInConversionsMap: Record<number, string> = {
  // origin enum
};

async function main() {
  console.log('🔍 Fetching all conversion actions configured in account\n');

  const query = `
    SELECT
      conversion_action.id,
      conversion_action.name,
      conversion_action.status,
      conversion_action.type,
      conversion_action.category,
      conversion_action.include_in_conversions_metric,
      conversion_action.primary_for_goal,
      conversion_action.counting_type,
      conversion_action.click_through_lookback_window_days,
      conversion_action.value_settings.default_value,
      conversion_action.value_settings.always_use_default_value
    FROM conversion_action
  `;

  const results = await customer.query(query);

  console.log(`Found ${results.length} conversion actions configured\n`);
  console.log('='.repeat(100));

  for (const row of results) {
    const ca = row.conversion_action;
    console.log(`\n📌 ${ca.name}`);
    console.log(`   ID:                  ${ca.id}`);
    console.log(`   Status:              ${statusMap[ca.status] || ca.status}`);
    console.log(`   Category:            ${categoryMap[ca.category] || ca.category}`);
    console.log(`   Counts as Conversion: ${ca.include_in_conversions_metric}`);
    console.log(`   Primary for Goal:    ${ca.primary_for_goal}`);
    console.log(`   Counting Type:       ${ca.counting_type === 2 ? 'ONE_PER_CLICK' : ca.counting_type === 3 ? 'MANY_PER_CLICK' : ca.counting_type}`);
    console.log(`   Lookback Days:       ${ca.click_through_lookback_window_days}`);
    console.log(`   Default Value:       $${ca.value_settings?.default_value || 0}`);
  }

  console.log('\n' + '='.repeat(100));
  console.log('\n🔍 Now: per-campaign breakdown by conversion_action (last 30 days)\n');

  const breakdownQuery = `
    SELECT
      campaign.name,
      segments.conversion_action_name,
      segments.conversion_action_category,
      metrics.all_conversions,
      metrics.conversions
    FROM campaign
    WHERE segments.date DURING LAST_30_DAYS
      AND metrics.all_conversions > 0
  `;

  const breakdown = await customer.query(breakdownQuery);

  // Group by campaign
  const byCampaign: Record<string, any[]> = {};
  for (const row of breakdown) {
    const camp = row.campaign.name;
    if (!byCampaign[camp]) byCampaign[camp] = [];
    byCampaign[camp].push({
      action: row.segments.conversion_action_name,
      category: categoryMap[row.segments.conversion_action_category] || row.segments.conversion_action_category,
      all_conv: row.metrics.all_conversions || 0,
      conv: row.metrics.conversions || 0,
    });
  }

  for (const [camp, rows] of Object.entries(byCampaign)) {
    console.log(`\n📊 ${camp}`);
    for (const r of rows) {
      console.log(`   • "${r.action}" [${r.category}]`);
      console.log(`     conversions: ${r.conv.toFixed(2)} | all_conversions: ${r.all_conv.toFixed(2)}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error:', err.message);
    if (err.errors) console.error(JSON.stringify(err.errors, null, 2));
    process.exit(1);
  });
