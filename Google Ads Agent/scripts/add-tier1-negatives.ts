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

const ALL_CAMPAIGNS = [
  'VIC Selective Entry',
  'NSW Selective Entry',
  'Year 5 NAPLAN',
  'Year 7 NAPLAN',
  'ACER Scholarship',
  'EduTest Scholarship',
];

// Universal negatives — applied to every campaign
const UNIVERSAL_NEGATIVES: { text: string; match: number }[] = [
  { text: 'cheat', match: enums.KeywordMatchType.BROAD },
  { text: 'reddit', match: enums.KeywordMatchType.BROAD },
  { text: 'youtube', match: enums.KeywordMatchType.BROAD },
  { text: 'torrent', match: enums.KeywordMatchType.BROAD },
  { text: 'crack', match: enums.KeywordMatchType.BROAD },
];

// Campaign-specific negatives
const CAMPAIGN_SPECIFIC_NEGATIVES: { campaign: string; text: string; match: number; reason: string }[] = [
  {
    campaign: 'Year 7 NAPLAN',
    text: 'edutest',
    match: enums.KeywordMatchType.PHRASE,
    reason: 'Wrong product — EduTest queries should not show NAPLAN ads',
  },
  {
    campaign: 'NSW Selective Entry',
    text: 'hscassociate',
    match: enums.KeywordMatchType.BROAD,
    reason: 'Competitor brand, $20.15 wasted',
  },
  {
    campaign: 'VIC Selective Entry',
    text: 'higher ability selection test hast',
    match: enums.KeywordMatchType.PHRASE,
    reason: 'HAST is a different test (Catholic schools), not VIC Selective',
  },
  {
    campaign: 'EduTest Scholarship',
    text: 'edutest practice tests free year 8 pdf',
    match: enums.KeywordMatchType.EXACT,
    reason: 'Wrong year level (Year 8 not sold), still a clear mismatch',
  },
];

const matchTypeName: Record<number, string> = { 2: 'EXACT', 3: 'PHRASE', 4: 'BROAD' };

async function main() {
  console.log('🚫 Adding Tier 1 negative keywords\n');

  // Get campaigns
  const campaigns = await customer.query(`
    SELECT campaign.id, campaign.name
    FROM campaign
    WHERE campaign.status != 'REMOVED'
  `);

  const campaignMap = new Map<string, string>();
  for (const c of campaigns) {
    campaignMap.set(c.campaign.name, c.campaign.id.toString());
  }

  // Get existing negatives so we don't duplicate
  const existingNegs = await customer.query(`
    SELECT
      campaign.name,
      campaign_criterion.keyword.text,
      campaign_criterion.keyword.match_type
    FROM campaign_criterion
    WHERE campaign_criterion.negative = true
      AND campaign_criterion.status != 'REMOVED'
  `);

  const existingSet = new Set<string>();
  for (const e of existingNegs) {
    const key = `${e.campaign.name}||${(e.campaign_criterion.keyword?.text || '').toLowerCase()}||${e.campaign_criterion.keyword?.match_type}`;
    existingSet.add(key);
  }

  let added = 0;
  let skipped = 0;
  let failed = 0;

  // Build list of all (campaign, text, match) to add
  const toAdd: { campaign: string; text: string; match: number; reason: string }[] = [];
  for (const u of UNIVERSAL_NEGATIVES) {
    for (const camp of ALL_CAMPAIGNS) {
      toAdd.push({ campaign: camp, text: u.text, match: u.match, reason: 'Universal negative' });
    }
  }
  for (const s of CAMPAIGN_SPECIFIC_NEGATIVES) {
    toAdd.push(s);
  }

  console.log(`Total targets: ${toAdd.length}\n`);

  for (const neg of toAdd) {
    const campaignId = campaignMap.get(neg.campaign);
    if (!campaignId) {
      console.log(`⚠️  Campaign "${neg.campaign}" not found, skipping "${neg.text}"`);
      failed++;
      continue;
    }

    const dedupKey = `${neg.campaign}||${neg.text.toLowerCase()}||${neg.match}`;
    if (existingSet.has(dedupKey)) {
      console.log(`⏭️  ${neg.campaign} | "${neg.text}" [${matchTypeName[neg.match]}] — already exists`);
      skipped++;
      continue;
    }

    try {
      const operation: MutateOperation<resources.ICampaignCriterion> = {
        entity: 'campaign_criterion',
        operation: 'create',
        resource: {
          campaign: `customers/${process.env.GOOGLE_ADS_CUSTOMER_ID}/campaigns/${campaignId}`,
          negative: true,
          keyword: {
            text: neg.text,
            match_type: neg.match,
          },
        },
      };

      await customer.mutateResources([operation]);
      console.log(`✅ ${neg.campaign} | "${neg.text}" [${matchTypeName[neg.match]}] — added`);
      added++;
      await new Promise((r) => setTimeout(r, 300));
    } catch (err: any) {
      if (err.message?.toLowerCase().includes('duplicate')) {
        console.log(`⏭️  ${neg.campaign} | "${neg.text}" — duplicate (skipped)`);
        skipped++;
      } else {
        console.error(`❌ ${neg.campaign} | "${neg.text}" — failed: ${err.message}`);
        if (err.errors) console.error(JSON.stringify(err.errors, null, 2));
        failed++;
      }
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Added: ${added} | Skipped (already exists): ${skipped} | Failed: ${failed}`);
  console.log(`Total negatives in account before: ${existingNegs.length}`);
  console.log(`Total after this run: ${existingNegs.length + added}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error:', err.message);
    if (err.errors) console.error(JSON.stringify(err.errors, null, 2));
    process.exit(1);
  });
