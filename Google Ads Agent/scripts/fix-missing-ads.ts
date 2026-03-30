/**
 * Fix Missing Ads in New Ad Groups
 *
 * After splitting ad groups by match type, the new ad groups have no ads.
 * This script copies ads from the original (paused) ad groups to the new ones.
 */

import { GoogleAdsApi, MutateOperation, resources, enums } from 'google-ads-api';
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

// Correct final URL for all ads
const CORRECT_FINAL_URL = 'https://educourse.com.au/';

async function fixMissingAds() {
  console.log('🔧 FIXING MISSING ADS IN NEW AD GROUPS\n');

  try {
    // Get all ad groups
    const adGroupQuery = `
      SELECT
        ad_group.id,
        ad_group.name,
        ad_group.status,
        campaign.id,
        campaign.name
      FROM ad_group
      WHERE campaign.status != 'REMOVED'
        AND ad_group.status != 'REMOVED'
    `;

    const adGroupResults = await customer.query(adGroupQuery);

    // Get all ads
    const adsQuery = `
      SELECT
        ad_group.id,
        ad_group_ad.ad.id,
        ad_group_ad.ad.responsive_search_ad.headlines,
        ad_group_ad.ad.responsive_search_ad.descriptions,
        ad_group_ad.ad.final_urls,
        ad_group_ad.status
      FROM ad_group_ad
      WHERE campaign.status != 'REMOVED'
        AND ad_group.status != 'REMOVED'
        AND ad_group_ad.status = 'ENABLED'
    `;

    const adsResults = await customer.query(adsQuery);

    // Group ad groups by campaign
    const campaignData: Map<string, any> = new Map();

    adGroupResults.forEach((row: any) => {
      const campaignId = row.campaign.id.toString();
      const campaignName = row.campaign.name;

      if (!campaignData.has(campaignId)) {
        campaignData.set(campaignId, {
          name: campaignName,
          adGroups: new Map()
        });
      }

      const adGroupId = row.ad_group.id.toString();
      const adGroupName = row.ad_group.name;
      const adGroups = campaignData.get(campaignId)!.adGroups;

      adGroups.set(adGroupId, {
        id: adGroupId,
        name: adGroupName,
        status: row.ad_group.status,
        ads: []
      });
    });

    // Add ads to ad groups
    adsResults.forEach((row: any) => {
      const adGroupId = row.ad_group.id.toString();

      // Find which campaign this ad group belongs to
      for (const [campaignId, campaign] of campaignData.entries()) {
        if (campaign.adGroups.has(adGroupId)) {
          campaign.adGroups.get(adGroupId)!.ads.push({
            id: row.ad_group_ad.ad.id.toString(),
            headlines: row.ad_group_ad.ad.responsive_search_ad?.headlines || [],
            descriptions: row.ad_group_ad.ad.responsive_search_ad?.descriptions || [],
            finalUrls: row.ad_group_ad.ad.final_urls || [],
            status: row.ad_group_ad.status,
          });
          break;
        }
      }
    });

    console.log(`Found ${campaignData.size} campaigns\n`);

    // For each campaign, find ad groups needing ads
    for (const [campaignId, campaign] of campaignData.entries()) {
      console.log(`\n📊 ${campaign.name}`);

      const adGroups = Array.from(campaign.adGroups.values());

      // Find original "Ad group 1" (should be paused now)
      const originalAdGroup = adGroups.find(ag => ag.name === 'Ad group 1' && ag.status === 3); // 3 = PAUSED

      // Find new match-type ad groups (EXACT, PHRASE, BROAD)
      const newAdGroups = adGroups.filter(ag =>
        (ag.name.includes('| EXACT') || ag.name.includes('| PHRASE') || ag.name.includes('| BROAD')) &&
        ag.status === 2 // 2 = ENABLED
      );

      if (!originalAdGroup) {
        console.log(`   ⚠️  No original ad group found (skipping)`);
        continue;
      }

      if (originalAdGroup.ads.length === 0) {
        console.log(`   ⚠️  Original ad group has no ads (skipping)`);
        continue;
      }

      if (newAdGroups.length === 0) {
        console.log(`   ⚠️  No new match-type ad groups found (skipping)`);
        continue;
      }

      console.log(`   Found ${newAdGroups.length} new ad groups needing ads`);
      console.log(`   Template: ${originalAdGroup.ads.length} ad(s) from "${originalAdGroup.name}"\n`);

      // Copy ads from original to each new ad group
      for (const newAdGroup of newAdGroups) {
        console.log(`   📝 ${newAdGroup.name} (${newAdGroup.ads.length} existing ads)`);

        if (newAdGroup.ads.length > 0) {
          console.log(`      ✓ Already has ads (skipping)\n`);
          continue;
        }

        // Copy each ad from original ad group
        for (const templateAd of originalAdGroup.ads) {
          try {
            // Create responsive search ad
            const operation: MutateOperation<resources.IAdGroupAd> = {
              entity: 'ad_group_ad',
              operation: 'create',
              resource: {
                ad_group: `customers/${process.env.GOOGLE_ADS_CUSTOMER_ID}/adGroups/${newAdGroup.id}`,
                status: enums.AdGroupAdStatus.ENABLED,
                ad: {
                  final_urls: [CORRECT_FINAL_URL], // Use correct URL
                  responsive_search_ad: {
                    headlines: templateAd.headlines,
                    descriptions: templateAd.descriptions,
                  },
                },
              },
            };

            await customer.mutateResources([operation]);

            console.log(`      ✅ Created ad with correct URL: ${CORRECT_FINAL_URL}`);

            // Small delay
            await new Promise(resolve => setTimeout(resolve, 500));

          } catch (error: any) {
            console.error(`      ❌ Failed to create ad: ${error.message}`);
          }
        }

        console.log('');
      }
    }

    console.log('\n✅ Ad copy complete!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

fixMissingAds()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed:', error);
    process.exit(1);
  });
