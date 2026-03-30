/**
 * Show all campaigns
 */

import { GoogleAdsClient } from './google-ads-client';

async function main() {
  const client = new GoogleAdsClient();
  const campaigns = await client.getCampaigns();

  console.log(`\n📊 Your Google Ads Campaigns (${campaigns.length} total)\n`);
  console.log('─'.repeat(80));

  campaigns.forEach((campaign) => {
    console.log(`\n🎯 ${campaign.name}`);
    console.log(`   ID: ${campaign.id}`);
    console.log(`   Status: ${campaign.status}`);
    console.log(`   Bidding: ${campaign.biddingStrategy}`);
  });

  console.log('\n' + '─'.repeat(80));
  console.log(`\n📝 Next: Map these campaigns to products in scripts/agents/google-ads/index.ts\n`);
}

main();
