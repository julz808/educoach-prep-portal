import { GoogleAdsApi, MutateOperation, resources, enums } from 'google-ads-api';
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

// Search terms that converted but aren't yet keywords (from last-30d audit)
const NEW_KEYWORDS = [
  {
    campaign: 'NSW Selective Entry',
    keyword: 'melbourne high school entrance exam practice',
    bid: 2.00,
    note: '1 conv at $1.50 CAC last 30d (note: probably mis-targeted to NSW campaign — better fit for VIC)',
  },
  {
    campaign: 'Year 7 NAPLAN',
    keyword: 'selective past papers',
    bid: 2.00,
    note: '1 conv at $1.33 CAC last 30d (Year 7 NAPLAN is POST_TEST — keyword may convert better in VIC/NSW campaigns)',
  },
  {
    campaign: 'VIC Selective Entry',
    keyword: 'selective school practice test',
    bid: 3.00,
    note: '1 conv at $16.16 CAC last 30d',
  },
  {
    campaign: 'VIC Selective Entry',
    keyword: 'victoria selective school test papers',
    bid: 3.00,
    note: '1 conv at $3.98 CAC last 30d',
  },
];

async function main() {
  console.log('🎯 Adding Stripe-validated converting search terms as EXACT keywords\n');

  const campaigns = await customer.query(`
    SELECT campaign.id, campaign.name
    FROM campaign
    WHERE campaign.status != 'REMOVED'
  `);

  const campaignMap = new Map<string, string>();
  for (const c of campaigns) {
    campaignMap.set(c.campaign.name, c.campaign.id.toString());
  }

  let added = 0;
  let skipped = 0;
  let failed = 0;

  for (const kw of NEW_KEYWORDS) {
    const campaignId = campaignMap.get(kw.campaign);
    if (!campaignId) {
      console.log(`⚠️  Campaign "${kw.campaign}" not found, skipping "${kw.keyword}"\n`);
      failed++;
      continue;
    }

    console.log(`📊 ${kw.campaign}`);
    console.log(`   Adding: "${kw.keyword}" [EXACT] @ $${kw.bid.toFixed(2)} CPC`);
    console.log(`   Note:   ${kw.note}`);

    const adGroups = await customer.query(`
      SELECT ad_group.id, ad_group.name
      FROM ad_group
      WHERE campaign.id = ${campaignId}
        AND ad_group.name LIKE '%EXACT%'
        AND ad_group.status = 'ENABLED'
    `);

    if (adGroups.length === 0) {
      console.log(`   ⚠️  No EXACT ad group found, skipping\n`);
      failed++;
      continue;
    }

    const adGroupId = adGroups[0].ad_group.id.toString();
    console.log(`   Target: ${adGroups[0].ad_group.name}`);

    try {
      const operation: MutateOperation<resources.IAdGroupCriterion> = {
        entity: 'ad_group_criterion',
        operation: 'create',
        resource: {
          ad_group: `customers/${process.env.GOOGLE_ADS_CUSTOMER_ID}/adGroups/${adGroupId}`,
          keyword: {
            text: kw.keyword,
            match_type: enums.KeywordMatchType.EXACT,
          },
          cpc_bid_micros: kw.bid * 1_000_000,
          status: enums.AdGroupCriterionStatus.ENABLED,
        },
      };

      await customer.mutateResources([operation]);
      console.log(`   ✅ Added\n`);
      added++;
      await new Promise(r => setTimeout(r, 400));
    } catch (err: any) {
      if (err.message?.includes('DUPLICATE') || err.message?.toLowerCase().includes('duplicate')) {
        console.log(`   ⏭️  Already exists\n`);
        skipped++;
      } else {
        console.error(`   ❌ Failed: ${err.message}\n`);
        if (err.errors) console.error(JSON.stringify(err.errors, null, 2));
        failed++;
      }
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Added: ${added} | Skipped (duplicate): ${skipped} | Failed: ${failed}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error:', err.message);
    if (err.errors) console.error(JSON.stringify(err.errors, null, 2));
    process.exit(1);
  });
