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

const MATCH_TYPE_LABELS = {
  2: 'EXACT',
  3: 'PHRASE',
  4: 'BROAD',
};

interface AdGroupData {
  id: string;
  name: string;
  campaignId: string;
  campaignName: string;
  status: number;
  cpcBidMicros: number;
}

interface KeywordData {
  id: string;
  adGroupId: string;
  matchType: number;
  text: string;
  status: number;
  cpcBidMicros: number;
  qualityScore: number;
}

async function getAdGroupsAndKeywords() {
  console.log('📋 Fetching ad groups and keywords from Google Ads\n');

  // Get ad groups
  const adGroupQuery = `
    SELECT
      ad_group.id,
      ad_group.name,
      ad_group.campaign,
      ad_group.status,
      ad_group.cpc_bid_micros,
      campaign.id,
      campaign.name
    FROM ad_group
    WHERE campaign.status != 'REMOVED'
      AND ad_group.status != 'REMOVED'
  `;

  const adGroupResults = await customer.query(adGroupQuery);

  const adGroups: AdGroupData[] = adGroupResults.map((row: any) => ({
    id: row.ad_group.id.toString(),
    name: row.ad_group.name,
    campaignId: row.campaign.id.toString(),
    campaignName: row.campaign.name,
    status: row.ad_group.status,
    cpcBidMicros: parseInt(row.ad_group.cpc_bid_micros || '0'),
  }));

  console.log(`✓ Found ${adGroups.length} ad groups\n`);

  // Get keywords
  const keywordQuery = `
    SELECT
      ad_group_criterion.criterion_id,
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      ad_group_criterion.status,
      ad_group_criterion.cpc_bid_micros,
      ad_group_criterion.quality_info.quality_score,
      ad_group.id
    FROM keyword_view
    WHERE ad_group.status != 'REMOVED'
      AND campaign.status != 'REMOVED'
  `;

  const keywordResults = await customer.query(keywordQuery);

  const keywords: KeywordData[] = keywordResults
    .filter((row: any) => row.ad_group_criterion.status !== 4) // Exclude REMOVED (4)
    .map((row: any) => ({
      id: row.ad_group_criterion.criterion_id.toString(),
      adGroupId: row.ad_group.id.toString(),
      matchType: row.ad_group_criterion.keyword.match_type,
      text: row.ad_group_criterion.keyword.text,
      status: row.ad_group_criterion.status,
      cpcBidMicros: parseInt(row.ad_group_criterion.cpc_bid_micros || '0'),
      qualityScore: row.ad_group_criterion.quality_info?.quality_score || 0,
    }));

  console.log(`✓ Found ${keywords.length} keywords\n`);

  return { adGroups, keywords };
}

async function splitAdGroupsByMatchType() {
  try {
    const { adGroups, keywords } = await getAdGroupsAndKeywords();

    // Analyze which ad groups need splitting
    const adGroupsNeedingSplit: {
      adGroup: AdGroupData;
      matchTypes: Set<number>;
      keywordsByMatchType: Map<number, KeywordData[]>;
    }[] = [];

    for (const adGroup of adGroups) {
      const adGroupKeywords = keywords.filter(k => k.adGroupId === adGroup.id);
      const matchTypes = new Set(adGroupKeywords.map(k => k.matchType));

      if (matchTypes.size > 1) {
        const keywordsByMatchType = new Map<number, KeywordData[]>();
        adGroupKeywords.forEach(kw => {
          if (!keywordsByMatchType.has(kw.matchType)) {
            keywordsByMatchType.set(kw.matchType, []);
          }
          keywordsByMatchType.get(kw.matchType)!.push(kw);
        });

        adGroupsNeedingSplit.push({
          adGroup,
          matchTypes,
          keywordsByMatchType,
        });
      }
    }

    if (adGroupsNeedingSplit.length === 0) {
      console.log('✅ All ad groups already split by match type\n');
      return;
    }

    console.log(`📝 Found ${adGroupsNeedingSplit.length} ad groups needing match type split:\n`);
    console.log('═'.repeat(120));

    for (const item of adGroupsNeedingSplit) {
      console.log(`\n${item.adGroup.campaignName} > ${item.adGroup.name}`);
      console.log(`   Match types: ${Array.from(item.matchTypes).map(mt => MATCH_TYPE_LABELS[mt as keyof typeof MATCH_TYPE_LABELS]).join(', ')}`);
      item.matchTypes.forEach(mt => {
        const kwCount = item.keywordsByMatchType.get(mt)?.length || 0;
        console.log(`   - ${MATCH_TYPE_LABELS[mt as keyof typeof MATCH_TYPE_LABELS]}: ${kwCount} keywords`);
      });
    }

    console.log('\n' + '═'.repeat(120));
    console.log('\n🔧 Starting ad group split process...\n');

    // Process each ad group one at a time
    for (const item of adGroupsNeedingSplit) {
      console.log(`\n📌 Processing: ${item.adGroup.campaignName} > ${item.adGroup.name}`);

      // Determine base CPC for each match type (Exact highest, Phrase medium, Broad lowest)
      // Ensure minimum CPC of $0.01 (10,000 micros) and round to billable unit (10,000 micros)
      const baseCpc = Math.max(item.adGroup.cpcBidMicros / 1_000_000, 0.01);
      const roundToBillableUnit = (micros: number) => {
        const billableUnit = 10_000;
        return Math.max(billableUnit, Math.round(micros / billableUnit) * billableUnit);
      };

      const cpcByMatchType = {
        2: roundToBillableUnit(baseCpc * 1.2 * 1_000_000), // EXACT: +20%
        3: roundToBillableUnit(baseCpc * 1.0 * 1_000_000), // PHRASE: same
        4: roundToBillableUnit(baseCpc * 0.8 * 1_000_000), // BROAD: -20%
      };

      // Create new ad groups for each match type
      for (const matchType of Array.from(item.matchTypes)) {
        const matchTypeLabel = MATCH_TYPE_LABELS[matchType as keyof typeof MATCH_TYPE_LABELS];
        const newAdGroupName = `${item.adGroup.name} | ${matchTypeLabel}`;
        const keywordsToMove = item.keywordsByMatchType.get(matchType)!;

        // Check if ad group already exists
        const existingAdGroup = adGroups.find(
          ag => ag.name === newAdGroupName && ag.campaignId === item.adGroup.campaignId
        );

        if (existingAdGroup) {
          console.log(`\n   ⏭️  Ad group already exists: ${newAdGroupName} (skipping)`);
          continue;
        }

        console.log(`\n   Creating ad group: ${newAdGroupName} (${keywordsToMove.length} keywords)`);

        // Create the new ad group
        const createAdGroupOperation: MutateOperation<resources.IAdGroup> = {
          entity: 'ad_group',
          operation: 'create',
          resource: {
            name: newAdGroupName,
            campaign: `customers/${process.env.GOOGLE_ADS_CUSTOMER_ID}/campaigns/${item.adGroup.campaignId}`,
            status: item.adGroup.status,
            cpc_bid_micros: cpcByMatchType[matchType as keyof typeof cpcByMatchType],
          },
        };

        const createResult = await customer.mutateResources([createAdGroupOperation]);

        // Extract resource name from response
        let newAdGroupResourceName: string;
        if (createResult.mutate_operation_responses && createResult.mutate_operation_responses.length > 0) {
          newAdGroupResourceName = createResult.mutate_operation_responses[0].ad_group_result.resource_name;
        } else if (createResult.results && createResult.results.length > 0) {
          newAdGroupResourceName = createResult.results[0].resource_name;
        } else if (createResult[0]?.ad_group?.resource_name) {
          newAdGroupResourceName = createResult[0].ad_group.resource_name;
        } else {
          console.error('   ❌ Failed to get resource name from create result:', createResult);
          throw new Error('Failed to create ad group - no resource name returned');
        }

        const newAdGroupId = newAdGroupResourceName.split('/').pop();

        console.log(`   ✓ Created ad group ID: ${newAdGroupId}`);
        console.log(`   ✓ CPC: $${(cpcByMatchType[matchType as keyof typeof cpcByMatchType] / 1_000_000).toFixed(2)}`);

        // Move keywords to new ad group (create new keywords, pause old ones)
        console.log(`   ✓ Moving ${keywordsToMove.length} keywords...`);

        for (const keyword of keywordsToMove) {
          // Create keyword in new ad group
          // Ensure keyword CPC also meets minimum requirements
          const keywordCpcMicros = roundToBillableUnit(Math.max(keyword.cpcBidMicros, 10_000));

          const createKeywordOperation: MutateOperation<resources.IAdGroupCriterion> = {
            entity: 'ad_group_criterion',
            operation: 'create',
            resource: {
              ad_group: newAdGroupResourceName,
              status: keyword.status,
              keyword: {
                text: keyword.text,
                match_type: keyword.matchType,
              },
              cpc_bid_micros: keywordCpcMicros,
            },
          };

          await customer.mutateResources([createKeywordOperation]);

          // Pause old keyword (don't delete, as per user constraint)
          const pauseKeywordOperation: MutateOperation<resources.IAdGroupCriterion> = {
            entity: 'ad_group_criterion',
            operation: 'update',
            resource: {
              resource_name: `customers/${process.env.GOOGLE_ADS_CUSTOMER_ID}/adGroupCriteria/${item.adGroup.id}~${keyword.id}`,
              status: enums.AdGroupCriterionStatus.PAUSED,
            },
            update_mask: {
              paths: ['status']
            }
          };

          await customer.mutateResources([pauseKeywordOperation]);

          // Small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log(`   ✅ Moved ${keywordsToMove.length} keywords successfully`);

        // Log changes
        fs.appendFileSync(
          'phase3_changes_log.txt',
          `${new Date().toISOString()} | SPLIT_MATCH_TYPE | ${item.adGroup.campaignName} | ` +
          `Created: ${newAdGroupName} | ${keywordsToMove.length} ${matchTypeLabel} keywords\n`
        );
      }

      // Pause the original ad group (don't delete, as per user constraint)
      console.log(`\n   Pausing original ad group: ${item.adGroup.name}`);

      const pauseAdGroupOperation: MutateOperation<resources.IAdGroup> = {
        entity: 'ad_group',
        operation: 'update',
        resource: {
          resource_name: `customers/${process.env.GOOGLE_ADS_CUSTOMER_ID}/adGroups/${item.adGroup.id}`,
          status: enums.AdGroupStatus.PAUSED,
        },
        update_mask: {
          paths: ['status']
        }
      };

      await customer.mutateResources([pauseAdGroupOperation]);

      console.log(`   ✅ Paused original ad group`);

      // Wait 2 seconds between ad groups
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n✅ All ad groups split by match type successfully\n');

    // Summary
    console.log('📊 Summary:');
    console.log(`   Ad groups split: ${adGroupsNeedingSplit.length}`);
    const totalNewAdGroups = adGroupsNeedingSplit.reduce((sum, item) => sum + item.matchTypes.size, 0);
    console.log(`   New ad groups created: ${totalNewAdGroups}`);
    console.log('   All changes logged to: phase3_changes_log.txt\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

splitAdGroupsByMatchType()
  .then(() => {
    console.log('✅ Phase 3.1 Complete: Ad groups split by match type');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
