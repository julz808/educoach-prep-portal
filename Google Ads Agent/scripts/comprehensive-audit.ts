import { GoogleAdsApi } from 'google-ads-api';
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

interface AuditData {
  campaigns: any[];
  adGroups: any[];
  keywords: any[];
  ads: any[];
  searchTerms: any[];
  negativeKeywords: any[];
  accountSettings: any;
}

async function runComprehensiveAudit(): Promise<AuditData> {
  console.log('🔍 Starting Comprehensive Google Ads Audit for EduCourse\n');
  console.log('='.repeat(80));

  const auditData: AuditData = {
    campaigns: [],
    adGroups: [],
    keywords: [],
    ads: [],
    searchTerms: [],
    negativeKeywords: [],
    accountSettings: {},
  };

  try {
    // 1. Campaign-level audit
    console.log('\n📊 PHASE 1.1: Campaign-level audit\n');

    const campaignQuery = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type,
        campaign.bidding_strategy_type,
        campaign.network_settings.target_search_network,
        campaign.network_settings.target_content_network,
        campaign.network_settings.target_partner_search_network,
        campaign_budget.amount_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.average_cpc,
        metrics.ctr,
        metrics.conversions_value,
        metrics.search_impression_share,
        metrics.search_budget_lost_impression_share
      FROM campaign
      WHERE campaign.status != 'REMOVED'
        AND segments.date DURING LAST_30_DAYS
    `;

    const campaigns = await customer.query(campaignQuery);
    console.log(`✓ Found ${campaigns.length} campaigns\n`);

    for (const campaign of campaigns) {
      const campaignData = {
        id: campaign.campaign.id,
        name: campaign.campaign.name,
        status: campaign.campaign.status,
        type: campaign.campaign.advertising_channel_type,
        budget_micros: campaign.campaign_budget?.amount_micros || 0,
        budget_aud: (campaign.campaign_budget?.amount_micros || 0) / 1000000,
        bidding_strategy: campaign.campaign.bidding_strategy_type,
        target_search_network: campaign.campaign.network_settings?.target_search_network,
        target_content_network: campaign.campaign.network_settings?.target_content_network,
        target_partner_search_network: campaign.campaign.network_settings?.target_partner_search_network,
        last_30_days: {
          impressions: campaign.metrics.impressions || 0,
          clicks: campaign.metrics.clicks || 0,
          cost_aud: (campaign.metrics.cost_micros || 0) / 1000000,
          conversions: campaign.metrics.conversions || 0,
          avg_cpc: (campaign.metrics.average_cpc || 0) / 1000000,
          ctr: campaign.metrics.ctr || 0,
          conversion_value: campaign.metrics.conversions_value || 0,
          impression_share: campaign.metrics.search_impression_share || 0,
          budget_lost_impression_share: campaign.metrics.search_budget_lost_impression_share || 0,
        },
      };

      auditData.campaigns.push(campaignData);

      console.log(`Campaign: ${campaign.campaign.name}`);
      console.log(`  Status: ${campaign.campaign.status}`);
      console.log(`  Budget: $${campaignData.budget_aud}/day`);
      console.log(`  30d Spend: $${campaignData.last_30_days.cost_aud.toFixed(2)}`);
      console.log(`  30d Conversions: ${campaignData.last_30_days.conversions}`);
      console.log(`  Avg CPC: $${campaignData.last_30_days.avg_cpc.toFixed(2)}`);
      console.log('');
    }

    // 2. Ad Group audit
    console.log('\n📊 PHASE 1.2: Ad Group audit\n');

    const adGroupQuery = `
      SELECT
        campaign.id,
        campaign.name,
        ad_group.id,
        ad_group.name,
        ad_group.status,
        ad_group.cpc_bid_micros,
        ad_group.target_cpa_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions
      FROM ad_group
      WHERE campaign.status != 'REMOVED'
        AND ad_group.status != 'REMOVED'
        AND segments.date DURING LAST_30_DAYS
    `;

    const adGroups = await customer.query(adGroupQuery);
    console.log(`✓ Found ${adGroups.length} ad groups\n`);

    for (const ag of adGroups) {
      const adGroupData = {
        campaign_id: ag.campaign.id,
        campaign_name: ag.campaign.name,
        id: ag.ad_group.id,
        name: ag.ad_group.name,
        status: ag.ad_group.status,
        cpc_bid_aud: (ag.ad_group.cpc_bid_micros || 0) / 1000000,
        target_cpa_aud: (ag.ad_group.target_cpa_micros || 0) / 1000000,
        last_30_days: {
          impressions: ag.metrics.impressions || 0,
          clicks: ag.metrics.clicks || 0,
          cost_aud: (ag.metrics.cost_micros || 0) / 1000000,
          conversions: ag.metrics.conversions || 0,
        },
      };

      auditData.adGroups.push(adGroupData);

      console.log(`${ag.campaign.name} > ${ag.ad_group.name}`);
      console.log(`  Status: ${ag.ad_group.status}`);
      console.log(`  30d: ${adGroupData.last_30_days.impressions} impr, ${adGroupData.last_30_days.clicks} clicks, $${adGroupData.last_30_days.cost_aud.toFixed(2)}`);
      console.log('');
    }

    // 3. Keyword audit
    console.log('\n📊 PHASE 1.3: Keyword audit\n');

    const keywordQuery = `
      SELECT
        campaign.id,
        campaign.name,
        ad_group.id,
        ad_group.name,
        ad_group_criterion.keyword.text,
        ad_group_criterion.keyword.match_type,
        ad_group_criterion.status,
        ad_group_criterion.quality_info.quality_score,
        ad_group_criterion.cpc_bid_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.average_cpc
      FROM keyword_view
      WHERE campaign.status != 'REMOVED'
        AND ad_group.status != 'REMOVED'
        AND ad_group_criterion.status != 'REMOVED'
        AND segments.date DURING LAST_30_DAYS
    `;

    const keywords = await customer.query(keywordQuery);
    console.log(`✓ Found ${keywords.length} keywords\n`);

    for (const kw of keywords) {
      const keywordData = {
        campaign_name: kw.campaign.name,
        ad_group_name: kw.ad_group.name,
        text: kw.ad_group_criterion.keyword?.text || '',
        match_type: kw.ad_group_criterion.keyword?.match_type || 0,
        status: kw.ad_group_criterion.status,
        quality_score: kw.ad_group_criterion.quality_info?.quality_score || 0,
        cpc_bid_aud: (kw.ad_group_criterion.cpc_bid_micros || 0) / 1000000,
        last_30_days: {
          impressions: kw.metrics.impressions || 0,
          clicks: kw.metrics.clicks || 0,
          cost_aud: (kw.metrics.cost_micros || 0) / 1000000,
          conversions: kw.metrics.conversions || 0,
          avg_cpc: (kw.metrics.average_cpc || 0) / 1000000,
        },
      };

      auditData.keywords.push(keywordData);
    }

    console.log(`Processed ${keywords.length} keywords`);

    // 4. Search Terms Report
    console.log('\n📊 PHASE 1.4: Search Terms Report (last 60 days)\n');

    // Get date 60 days ago
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const dateFrom = sixtyDaysAgo.toISOString().split('T')[0].replace(/-/g, '');
    const dateTo = new Date().toISOString().split('T')[0].replace(/-/g, '');

    const searchTermsQuery = `
      SELECT
        campaign.name,
        ad_group.name,
        segments.search_term_match_type,
        search_term_view.search_term,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions
      FROM search_term_view
      WHERE segments.date BETWEEN '${dateFrom}' AND '${dateTo}'
        AND metrics.clicks > 0
    `;

    const searchTerms = await customer.query(searchTermsQuery);
    console.log(`✓ Found ${searchTerms.length} search terms with clicks\n`);

    for (const st of searchTerms) {
      const searchTermData = {
        campaign_name: st.campaign.name,
        ad_group_name: st.ad_group.name,
        search_term: st.search_term_view.search_term,
        match_type: st.segments.search_term_match_type,
        impressions: st.metrics.impressions || 0,
        clicks: st.metrics.clicks || 0,
        cost_aud: (st.metrics.cost_micros || 0) / 1000000,
        conversions: st.metrics.conversions || 0,
      };

      auditData.searchTerms.push(searchTermData);
    }

    console.log(`Processed ${searchTerms.length} search terms`);

    // 5. Ad Copy Audit
    console.log('\n📊 PHASE 1.5: Ad Copy Audit\n');

    const adsQuery = `
      SELECT
        campaign.name,
        ad_group.name,
        ad_group_ad.ad.id,
        ad_group_ad.ad.responsive_search_ad.headlines,
        ad_group_ad.ad.responsive_search_ad.descriptions,
        ad_group_ad.ad.final_urls,
        ad_group_ad.status,
        ad_group_ad.ad_strength,
        metrics.impressions,
        metrics.clicks,
        metrics.ctr,
        metrics.conversions
      FROM ad_group_ad
      WHERE campaign.status != 'REMOVED'
        AND ad_group_ad.status = 'ENABLED'
        AND segments.date DURING LAST_30_DAYS
    `;

    const ads = await customer.query(adsQuery);
    console.log(`✓ Found ${ads.length} active ads\n`);

    for (const ad of ads) {
      const adData = {
        campaign_name: ad.campaign.name,
        ad_group_name: ad.ad_group.name,
        ad_id: ad.ad_group_ad.ad.id,
        status: ad.ad_group_ad.status,
        ad_strength: ad.ad_group_ad.ad_strength,
        headlines: ad.ad_group_ad.ad.responsive_search_ad?.headlines || [],
        descriptions: ad.ad_group_ad.ad.responsive_search_ad?.descriptions || [],
        final_urls: ad.ad_group_ad.ad.final_urls || [],
        last_30_days: {
          impressions: ad.metrics.impressions || 0,
          clicks: ad.metrics.clicks || 0,
          ctr: ad.metrics.ctr || 0,
          conversions: ad.metrics.conversions || 0,
        },
      };

      auditData.ads.push(adData);
    }

    console.log(`Processed ${ads.length} ads`);

    // 6. Negative Keywords
    console.log('\n📊 PHASE 1.6: Negative Keywords Audit\n');

    const negativeKeywordsQuery = `
      SELECT
        campaign.name,
        campaign_criterion.keyword.text,
        campaign_criterion.keyword.match_type,
        campaign_criterion.negative
      FROM campaign_criterion
      WHERE campaign_criterion.negative = true
        AND campaign_criterion.status != 'REMOVED'
    `;

    const negativeKeywords = await customer.query(negativeKeywordsQuery);
    console.log(`✓ Found ${negativeKeywords.length} negative keywords\n`);

    for (const nk of negativeKeywords) {
      auditData.negativeKeywords.push({
        campaign_name: nk.campaign.name,
        text: nk.campaign_criterion.keyword?.text || '',
        match_type: nk.campaign_criterion.keyword?.match_type || 0,
      });
    }

    console.log('='.repeat(80));
    console.log('\n✅ Audit data collection complete!\n');

    // Save raw data
    fs.writeFileSync(
      'google_ads_audit_data.json',
      JSON.stringify(auditData, null, 2)
    );
    console.log('💾 Saved audit data to google_ads_audit_data.json\n');

    return auditData;

  } catch (error: any) {
    console.error('❌ Error during audit:', error.message);
    if (error.errors) {
      console.error(JSON.stringify(error.errors, null, 2));
    }
    throw error;
  }
}

// Run audit
runComprehensiveAudit()
  .then(() => {
    console.log('✅ Audit complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  });
