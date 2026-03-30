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

// Converting search terms from audit report
const CONVERTING_SEARCH_TERMS = [
  { term: 'educourse', campaign: 'EduTest Scholarship', conversions: 3, cost: 20.13 },
  { term: 'educourse', campaign: 'Year 7 NAPLAN', conversions: 1.5, cost: 0.84 },
  { term: 'online selective practice tests', campaign: 'VIC Selective Entry', conversions: 1, cost: 1.90 },
  { term: 'naplan year 5', campaign: 'Year 5 NAPLAN', conversions: 1, cost: 7.42 },
  { term: 'acer test practice', campaign: 'ACER Scholarship', conversions: 1, cost: 26.40 },
  { term: 'acer practice test year 7', campaign: 'ACER Scholarship', conversions: 1, cost: 3.89 },
  { term: 'acer scholarship test preparation', campaign: 'ACER Scholarship', conversions: 1, cost: 6.78 },
  { term: 'aas scholarship test past papers', campaign: 'EduTest Scholarship', conversions: 1, cost: 2.21 },
  { term: 'edutest practice tests', campaign: 'EduTest Scholarship', conversions: 1, cost: 59.50 },
  { term: 'excel naplan year 5', campaign: 'Year 5 NAPLAN', conversions: 0.5, cost: 1.12 },
  { term: 'educourse', campaign: 'Year 5 NAPLAN', conversions: 0.5, cost: 0.70 },
  { term: 'naplan preparation year 5', campaign: 'NSW Selective Entry', conversions: 0.5, cost: 1.42 },
];

interface Campaign {
  id: string;
  name: string;
  adGroups: AdGroup[];
}

interface AdGroup {
  id: string;
  name: string;
  campaignId: string;
}

async function getCampaignsWithAdGroups(): Promise<Campaign[]> {
  const query = `
    SELECT
      campaign.id,
      campaign.name,
      ad_group.id,
      ad_group.name
    FROM ad_group
    WHERE campaign.status != 'REMOVED'
      AND ad_group.status != 'REMOVED'
    ORDER BY campaign.name, ad_group.name
  `;

  const results = await customer.query(query);

  const campaignMap = new Map<string, Campaign>();

  results.forEach((row: any) => {
    const campaignId = row.campaign.id.toString();
    const campaignName = row.campaign.name;

    if (!campaignMap.has(campaignId)) {
      campaignMap.set(campaignId, {
        id: campaignId,
        name: campaignName,
        adGroups: [],
      });
    }

    campaignMap.get(campaignId)!.adGroups.push({
      id: row.ad_group.id.toString(),
      name: row.ad_group.name,
      campaignId,
    });
  });

  return Array.from(campaignMap.values());
}

async function getExistingKeywords(adGroupId: string): Promise<Set<string>> {
  const query = `
    SELECT
      ad_group_criterion.keyword.text
    FROM keyword_view
    WHERE ad_group.id = ${adGroupId}
      AND ad_group_criterion.status != 'REMOVED'
  `;

  try {
    const results = await customer.query(query);
    return new Set(results.map((row: any) => row.ad_group_criterion.keyword.text.toLowerCase()));
  } catch (error) {
    return new Set<string>();
  }
}

async function addConvertingKeywords() {
  console.log('🔍 Adding converting search terms as EXACT match keywords\n');

  try {
    const campaigns = await getCampaignsWithAdGroups();
    console.log(`✓ Found ${campaigns.length} campaigns\n`);

    console.log(`📋 Search terms to add: ${CONVERTING_SEARCH_TERMS.length}\n`);
    console.log('═'.repeat(120));

    let totalAdded = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const item of CONVERTING_SEARCH_TERMS) {
      const campaign = campaigns.find(c => c.name === item.campaign);

      if (!campaign) {
        console.log(`\n⚠️  Campaign not found: ${item.campaign} (skipping "${item.term}")`);
        totalSkipped++;
        continue;
      }

      // Use first active ad group in the campaign
      const adGroup = campaign.adGroups[0];

      if (!adGroup) {
        console.log(`\n⚠️  No ad groups found in: ${item.campaign} (skipping "${item.term}")`);
        totalSkipped++;
        continue;
      }

      console.log(`\n📌 ${item.campaign} > ${adGroup.name}`);
      console.log(`   Adding: "${item.term}" (${item.conversions} conv, $${item.cost.toFixed(2)} cost)`);

      // Check if keyword already exists
      const existingKeywords = await getExistingKeywords(adGroup.id);

      if (existingKeywords.has(item.term.toLowerCase())) {
        console.log(`   ⏭️  Keyword already exists (skipping)`);
        totalSkipped++;
        continue;
      }

      try {
        // Calculate CPC bid based on historical cost per conversion
        const avgCpc = item.conversions > 0 ? item.cost / item.conversions : 1.0;
        const cpcBidMicros = Math.max(Math.round(avgCpc * 1_000_000), 10_000); // Min $0.01

        // Round to billable unit (10,000 micros)
        const billableUnit = 10_000;
        const roundedCpcMicros = Math.max(billableUnit, Math.round(cpcBidMicros / billableUnit) * billableUnit);

        const operation: MutateOperation<resources.IAdGroupCriterion> = {
          entity: 'ad_group_criterion',
          operation: 'create',
          resource: {
            ad_group: `customers/${process.env.GOOGLE_ADS_CUSTOMER_ID}/adGroups/${adGroup.id}`,
            keyword: {
              text: item.term,
              match_type: enums.KeywordMatchType.EXACT,
            },
            status: enums.AdGroupCriterionStatus.ENABLED,
            cpc_bid_micros: roundedCpcMicros,
          },
        };

        await customer.mutateResources([operation]);
        totalAdded++;

        console.log(`   ✅ Added as EXACT match keyword (CPC: $${(roundedCpcMicros / 1_000_000).toFixed(2)})`);

        // Log to file
        fs.appendFileSync(
          'phase3_changes_log.txt',
          `${new Date().toISOString()} | ADD_KEYWORD | ${item.campaign} | "${item.term}" | EXACT | $${(roundedCpcMicros / 1_000_000).toFixed(2)}\n`
        );

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error: any) {
        totalErrors++;
        console.error(`   ❌ Error: ${error.message}`);
      }
    }

    console.log('\n' + '═'.repeat(120));
    console.log('\n✅ Converting search terms added as keywords\n');

    // Summary
    console.log('📊 Summary:');
    console.log(`   Keywords added: ${totalAdded}`);
    console.log(`   Already existing (skipped): ${totalSkipped}`);
    console.log(`   Errors: ${totalErrors}`);
    console.log('   All changes logged to: phase3_changes_log.txt\n');

    console.log('💡 Impact:');
    console.log('   - Better control over converting search terms');
    console.log('   - Lower CPCs for exact match vs broad/phrase');
    console.log('   - "educourse" brand term now optimized across campaigns');
    console.log('   - Expected improvement in Quality Scores\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

addConvertingKeywords()
  .then(() => {
    console.log('✅ Phase 3.5 Complete: Converting search terms added as keywords');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
