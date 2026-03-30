/**
 * Get Detailed Keywords by Match Type
 */

import { GoogleAdsApi } from 'google-ads-api';
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

async function getKeywordsDetailed() {
  console.log('🔑 KEYWORDS BY MATCH TYPE - DETAILED VIEW\n');
  console.log('═'.repeat(80));

  const query = `
    SELECT
      campaign.name,
      ad_group.name,
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      ad_group_criterion.status,
      ad_group_criterion.cpc_bid_micros
    FROM ad_group_criterion
    WHERE campaign.status != 'REMOVED'
      AND ad_group.status != 'REMOVED'
      AND ad_group_criterion.type = 'KEYWORD'
      AND ad_group_criterion.status != 'REMOVED'
    ORDER BY campaign.name, ad_group.name, ad_group_criterion.keyword.match_type
  `;

  const results = await customer.query(query);

  let currentCampaign = '';
  let currentAdGroup = '';

  for (const row of results) {
    const campaign = row.campaign.name;
    const adGroup = row.ad_group.name;
    const keyword = row.ad_group_criterion.keyword.text;
    const matchType = row.ad_group_criterion.keyword.match_type;
    const status = row.ad_group_criterion.status === 2 ? 'ENABLED' : 'PAUSED';
    const bidMicros = row.ad_group_criterion.cpc_bid_micros;
    const bid = bidMicros ? `$${(bidMicros / 1_000_000).toFixed(2)}` : 'Auto';

    if (campaign !== currentCampaign) {
      console.log(`\n\n📌 ${campaign}`);
      console.log('═'.repeat(80));
      currentCampaign = campaign;
      currentAdGroup = '';
    }

    if (adGroup !== currentAdGroup) {
      console.log(`\n   📁 ${adGroup}`);
      currentAdGroup = adGroup;
    }

    const statusIcon = status === 'ENABLED' ? '✓' : '⏸';
    const matchIcon = matchType === 2 ? '🎯' : matchType === 3 ? '📝' : '🌐';
    const matchName = matchType === 2 ? 'EXACT' : matchType === 3 ? 'PHRASE' : 'BROAD';

    console.log(`      ${statusIcon} ${matchIcon} [${matchName}] "${keyword}" - Bid: ${bid}`);
  }

  console.log('\n\n✅ Report complete!\n');
}

getKeywordsDetailed()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Failed:', error);
    process.exit(1);
  });
