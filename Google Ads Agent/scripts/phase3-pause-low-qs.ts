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

interface LowQsKeyword {
  keywordId: string;
  adGroupId: string;
  campaignName: string;
  adGroupName: string;
  keywordText: string;
  matchType: number;
  qualityScore: number;
  status: number;
  cost30d: number;
  conversions30d: number;
}

async function pauseLowQualityScoreKeywords() {
  console.log('🔍 Finding keywords with Quality Score < 3\n');

  try {
    // Get keywords with QS and performance data
    const query = `
      SELECT
        ad_group_criterion.criterion_id,
        ad_group_criterion.keyword.text,
        ad_group_criterion.keyword.match_type,
        ad_group_criterion.quality_info.quality_score,
        ad_group_criterion.status,
        ad_group.id,
        ad_group.name,
        campaign.name,
        metrics.cost_micros,
        metrics.conversions
      FROM keyword_view
      WHERE campaign.status = 'ENABLED'
        AND ad_group.status != 'REMOVED'
        AND ad_group_criterion.status = 'ENABLED'
        AND segments.date DURING LAST_30_DAYS
    `;

    const results = await customer.query(query);

    // Aggregate by keyword (sum metrics across date segments)
    const keywordMap = new Map<string, LowQsKeyword>();

    results.forEach((row: any) => {
      const keywordId = row.ad_group_criterion.criterion_id.toString();
      const adGroupId = row.ad_group.id.toString();
      const key = `${adGroupId}_${keywordId}`;

      if (!keywordMap.has(key)) {
        keywordMap.set(key, {
          keywordId,
          adGroupId,
          campaignName: row.campaign.name,
          adGroupName: row.ad_group.name,
          keywordText: row.ad_group_criterion.keyword.text,
          matchType: row.ad_group_criterion.keyword.match_type,
          qualityScore: row.ad_group_criterion.quality_info?.quality_score || 0,
          status: row.ad_group_criterion.status,
          cost30d: 0,
          conversions30d: 0,
        });
      }

      const keyword = keywordMap.get(key)!;
      keyword.cost30d += parseInt(row.metrics.cost_micros || '0') / 1_000_000;
      keyword.conversions30d += parseFloat(row.metrics.conversions || '0');
    });

    // Filter for QS < 3
    const lowQsKeywords = Array.from(keywordMap.values())
      .filter(kw => kw.qualityScore > 0 && kw.qualityScore < 3)
      .sort((a, b) => b.cost30d - a.cost30d);

    if (lowQsKeywords.length === 0) {
      console.log('✅ No keywords with Quality Score < 3 found\n');
      return;
    }

    const totalWaste = lowQsKeywords.reduce((sum, kw) => sum + kw.cost30d, 0);

    console.log(`📋 Found ${lowQsKeywords.length} keywords with QS < 3:\n`);
    console.log('═'.repeat(120));
    console.log('\nKeyword                                    | Campaign              | QS | 30d Cost | 30d Conv | Action');
    console.log('-'.repeat(120));

    lowQsKeywords.forEach(kw => {
      const matchTypeLabel = kw.matchType === 2 ? 'EXACT' : kw.matchType === 3 ? 'PHRASE' : 'BROAD';
      console.log(
        `${kw.keywordText.padEnd(40)} | ${kw.campaignName.padEnd(20)} | ${kw.qualityScore}  | $${kw.cost30d.toFixed(2).padStart(7)} | ${kw.conversions30d.toFixed(1).padStart(8)} | PAUSE`
      );
    });

    console.log('-'.repeat(120));
    console.log(`\nTotal waste from low QS keywords: $${totalWaste.toFixed(2)}\n`);
    console.log('═'.repeat(120));

    console.log('\n🔧 Pausing low Quality Score keywords...\n');

    let pausedCount = 0;

    for (const keyword of lowQsKeywords) {
      console.log(`   Pausing: "${keyword.keywordText}" (QS ${keyword.qualityScore}, Cost: $${keyword.cost30d.toFixed(2)})`);

      const pauseOperation: MutateOperation<resources.IAdGroupCriterion> = {
        entity: 'ad_group_criterion',
        operation: 'update',
        resource: {
          resource_name: `customers/${process.env.GOOGLE_ADS_CUSTOMER_ID}/adGroupCriteria/${keyword.adGroupId}~${keyword.keywordId}`,
          status: enums.AdGroupCriterionStatus.PAUSED,
        },
        update_mask: {
          paths: ['status']
        }
      };

      try {
        await customer.mutateResources([pauseOperation]);
        pausedCount++;
        console.log(`   ✅ Paused successfully`);

        // Log to file
        fs.appendFileSync(
          'phase3_changes_log.txt',
          `${new Date().toISOString()} | PAUSE_LOW_QS | ${keyword.campaignName} | ` +
          `"${keyword.keywordText}" | QS: ${keyword.qualityScore} | Cost: $${keyword.cost30d.toFixed(2)}\n`
        );

      } catch (error: any) {
        console.error(`   ❌ Error: ${error.message}`);
      }

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('\n✅ Low Quality Score keywords paused\n');

    // Summary
    console.log('📊 Summary:');
    console.log(`   Keywords paused: ${pausedCount}`);
    console.log(`   Estimated monthly savings: $${totalWaste.toFixed(2)}`);
    console.log('   All changes logged to: phase3_changes_log.txt\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

pauseLowQualityScoreKeywords()
  .then(() => {
    console.log('✅ Phase 3.6 Complete: Low Quality Score keywords paused');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
