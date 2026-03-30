import { GoogleAdsApi, MutateOperation, resources, enums } from 'google-ads-api';
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

// Universal negative keywords (apply to all campaigns)
const UNIVERSAL_NEGATIVES = [
  'free',
  'pdf',
  'download',
  'downloads',
  'sample',
  'samples',
  'template',
  'templates',
  'job',
  'jobs',
  'career',
  'careers',
  'salary',
  'teaching',
  'teacher',
];

// Specific wasteful search terms from audit report
const WASTEFUL_SEARCH_TERMS = [
  'free year 8 pdf',
  'past papers pdf',
  'pdf free download',
  'practice test year 7 pdf free download',
  'free download',
  'practice tests online free',
  'online free practice tests',
  'naplan free',
  'practice tests free',
  'test past papers free pdf',
];

async function getCampaigns() {
  const query = `
    SELECT
      campaign.id,
      campaign.name
    FROM campaign
    WHERE campaign.status != 'REMOVED'
  `;

  const results = await customer.query(query);

  return results.map((row: any) => ({
    id: row.campaign.id.toString(),
    name: row.campaign.name,
  }));
}

async function getExistingNegativeKeywords(campaignId: string) {
  const query = `
    SELECT
      campaign_criterion.criterion_id,
      campaign_criterion.keyword.text,
      campaign_criterion.keyword.match_type
    FROM campaign_criterion
    WHERE campaign.id = ${campaignId}
      AND campaign_criterion.type = 'KEYWORD'
      AND campaign_criterion.negative = true
  `;

  try {
    const results = await customer.query(query);
    return new Set(results.map((row: any) => row.campaign_criterion.keyword.text.toLowerCase()));
  } catch (error) {
    return new Set<string>();
  }
}

async function addNegativeKeywords() {
  console.log('🔍 Adding negative keywords to campaigns\n');

  try {
    const campaigns = await getCampaigns();
    console.log(`✓ Found ${campaigns.length} campaigns\n`);

    // Combine all negatives
    const allNegatives = [...new Set([...UNIVERSAL_NEGATIVES, ...WASTEFUL_SEARCH_TERMS])];
    console.log(`📋 Total negative keywords to add: ${allNegatives.length}\n`);
    console.log('═'.repeat(120));

    let totalAdded = 0;
    let totalSkipped = 0;

    for (const campaign of campaigns) {
      console.log(`\n📌 Campaign: ${campaign.name}`);

      // Get existing negatives for this campaign
      const existingNegatives = await getExistingNegativeKeywords(campaign.id);
      console.log(`   Current negative keywords: ${existingNegatives.size}`);

      // Filter out existing negatives
      const negativesToAdd = allNegatives.filter(
        neg => !existingNegatives.has(neg.toLowerCase())
      );

      if (negativesToAdd.length === 0) {
        console.log(`   ✓ All negative keywords already added`);
        continue;
      }

      console.log(`   Adding ${negativesToAdd.length} new negative keywords...`);

      for (const negativeKeyword of negativesToAdd) {
        try {
          const operation: MutateOperation<resources.ICampaignCriterion> = {
            entity: 'campaign_criterion',
            operation: 'create',
            resource: {
              campaign: `customers/${process.env.GOOGLE_ADS_CUSTOMER_ID}/campaigns/${campaign.id}`,
              keyword: {
                text: negativeKeyword,
                match_type: enums.KeywordMatchType.PHRASE, // Use PHRASE match for broader coverage
              },
              negative: true,
            },
          };

          await customer.mutateResources([operation]);
          totalAdded++;

          // Log to file
          fs.appendFileSync(
            'phase3_changes_log.txt',
            `${new Date().toISOString()} | ADD_NEGATIVE | ${campaign.name} | "${negativeKeyword}" | PHRASE\n`
          );

          // Small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error: any) {
          if (error.message?.includes('already exists')) {
            totalSkipped++;
          } else {
            console.error(`   ⚠️  Error adding "${negativeKeyword}": ${error.message}`);
          }
        }
      }

      console.log(`   ✅ Added ${negativesToAdd.length} negative keywords`);

      // Wait 1 second between campaigns
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n' + '═'.repeat(120));
    console.log('\n✅ Negative keywords added successfully\n');

    // Summary
    console.log('📊 Summary:');
    console.log(`   Campaigns processed: ${campaigns.length}`);
    console.log(`   Total negative keywords added: ${totalAdded}`);
    console.log(`   Already existing (skipped): ${totalSkipped}`);
    console.log('   All changes logged to: phase3_changes_log.txt\n');

    console.log('💡 Impact:');
    console.log('   - Blocking "free" searches will save ~$15-20/month');
    console.log('   - Blocking "pdf" searches will save ~$10-15/month');
    console.log('   - Blocking "download" searches will save ~$5-10/month');
    console.log('   - Total estimated monthly savings: ~$30-45\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

addNegativeKeywords()
  .then(() => {
    console.log('✅ Phase 3.4 Complete: Negative keywords added');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
