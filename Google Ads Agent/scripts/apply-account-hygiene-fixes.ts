import { GoogleAdsApi, enums } from 'google-ads-api';
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

// IDs from earlier conversion actions audit
const PURCHASE_SUCCESS_CONVERSION_ID = '7272565817';
const SIGNUP_CONVERSION_ID = '6724142286';

async function disableSearchPartners() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1️⃣  Disabling Search Partners network on all campaigns');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const campaigns = await customer.query(`
    SELECT
      campaign.resource_name,
      campaign.name,
      campaign.network_settings.target_search_network,
      campaign.network_settings.target_content_network,
      campaign.network_settings.target_partner_search_network,
      campaign.network_settings.target_google_search
    FROM campaign
    WHERE campaign.status != 'REMOVED'
  `);

  for (const c of campaigns) {
    const partner = c.campaign.network_settings?.target_partner_search_network;
    console.log(`📌 ${c.campaign.name}`);
    console.log(`   Search Partners currently: ${partner ? 'ENABLED ❌' : 'DISABLED ✅'}`);

    if (!partner) {
      console.log('   ⏭️  Already disabled, skipping\n');
      continue;
    }

    try {
      await customer.campaigns.update([{
        resource_name: c.campaign.resource_name,
        network_settings: {
          target_google_search: c.campaign.network_settings?.target_google_search ?? true,
          target_search_network: c.campaign.network_settings?.target_search_network ?? true,
          target_content_network: c.campaign.network_settings?.target_content_network ?? false,
          target_partner_search_network: false,
        },
        update_mask: { paths: ['network_settings.target_partner_search_network'] },
      }]);
      console.log('   ✅ Search Partners disabled\n');
    } catch (err: any) {
      console.error(`   ❌ Failed: ${err.message}\n`);
      if (err.errors) console.error(JSON.stringify(err.errors, null, 2));
    }
  }
}

async function setPurchaseSuccessCountToOne() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('2️⃣  Setting "Purchase Success" Count to ONE_PER_CLICK');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const resourceName = `customers/${process.env.GOOGLE_ADS_CUSTOMER_ID}/conversionActions/${PURCHASE_SUCCESS_CONVERSION_ID}`;

  const before = await customer.query(`
    SELECT
      conversion_action.name,
      conversion_action.counting_type
    FROM conversion_action
    WHERE conversion_action.id = ${PURCHASE_SUCCESS_CONVERSION_ID}
  `);

  if (before.length === 0) {
    console.log(`❌ Conversion action ID ${PURCHASE_SUCCESS_CONVERSION_ID} not found\n`);
    return;
  }

  const ca = before[0].conversion_action;
  const countingTypeName: Record<number, string> = { 2: 'ONE_PER_CLICK', 3: 'MANY_PER_CLICK' };
  console.log(`📌 ${ca.name}`);
  console.log(`   Counting type currently: ${countingTypeName[ca.counting_type] || ca.counting_type}`);

  if (ca.counting_type === 2) {
    console.log('   ⏭️  Already ONE_PER_CLICK, skipping\n');
    return;
  }

  try {
    await customer.conversionActions.update([{
      resource_name: resourceName,
      counting_type: enums.ConversionActionCountingType.ONE_PER_CLICK,
      update_mask: { paths: ['counting_type'] },
    }]);
    console.log('   ✅ Updated to ONE_PER_CLICK\n');
  } catch (err: any) {
    console.error(`   ❌ Failed: ${err.message}\n`);
    if (err.errors) console.error(JSON.stringify(err.errors, null, 2));
  }
}

async function demoteSignupConversion() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('3️⃣  Demoting "Sign-up" from "Counts as Conversion"');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const resourceName = `customers/${process.env.GOOGLE_ADS_CUSTOMER_ID}/conversionActions/${SIGNUP_CONVERSION_ID}`;

  const before = await customer.query(`
    SELECT
      conversion_action.name,
      conversion_action.include_in_conversions_metric
    FROM conversion_action
    WHERE conversion_action.id = ${SIGNUP_CONVERSION_ID}
  `);

  if (before.length === 0) {
    console.log(`❌ Conversion action ID ${SIGNUP_CONVERSION_ID} not found\n`);
    return;
  }

  const ca = before[0].conversion_action;
  console.log(`📌 ${ca.name}`);
  console.log(`   Currently 'Counts as Conversion': ${ca.include_in_conversions_metric}`);

  if (!ca.include_in_conversions_metric) {
    console.log('   ⏭️  Already excluded, skipping\n');
    return;
  }

  try {
    await customer.conversionActions.update([{
      resource_name: resourceName,
      include_in_conversions_metric: false,
      update_mask: { paths: ['include_in_conversions_metric'] },
    }]);
    console.log('   ✅ Sign-up no longer counts toward Conversions metric\n');
  } catch (err: any) {
    console.error(`   ❌ Failed: ${err.message}\n`);
    if (err.errors) console.error(JSON.stringify(err.errors, null, 2));
  }
}

async function main() {
  console.log('🛠  Account Hygiene Fixes\n');
  await disableSearchPartners();
  await setPurchaseSuccessCountToOne();
  await demoteSignupConversion();
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ All hygiene fixes complete');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error:', err.message);
    if (err.errors) console.error(JSON.stringify(err.errors, null, 2));
    process.exit(1);
  });
