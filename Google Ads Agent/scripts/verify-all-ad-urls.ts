import { GoogleAdsApi } from 'google-ads-api';
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

const EXPECTED: Record<string, string> = {
  'Year 5 NAPLAN': 'https://educourse.com.au/course/year-5-naplan',
  'Year 7 NAPLAN': 'https://educourse.com.au/course/year-7-naplan',
  'EduTest Scholarship': 'https://educourse.com.au/course/edutest-scholarship',
  'ACER Scholarship': 'https://educourse.com.au/course/acer-scholarship',
  'VIC Selective Entry': 'https://educourse.com.au/course/vic-selective',
  'NSW Selective Entry': 'https://educourse.com.au/course/nsw-selective',
};

async function main() {
  const ads = await customer.query(`
    SELECT
      campaign.name,
      ad_group.name,
      ad_group_ad.ad.id,
      ad_group_ad.ad.final_urls,
      ad_group_ad.status
    FROM ad_group_ad
    WHERE campaign.status != 'REMOVED'
      AND ad_group_ad.status != 'REMOVED'
  `);

  const byCampaign: Record<string, { ad_group: string; status: number; url: string }[]> = {};
  let mismatches = 0;

  for (const ad of ads) {
    const camp = ad.campaign.name;
    const url = ad.ad_group_ad.ad.final_urls?.[0] || '';
    if (!byCampaign[camp]) byCampaign[camp] = [];
    byCampaign[camp].push({
      ad_group: ad.ad_group.name,
      status: ad.ad_group_ad.status,
      url,
    });
    if (EXPECTED[camp] && url !== EXPECTED[camp]) mismatches++;
  }

  const statusMap: Record<number, string> = { 2: 'ENABLED', 3: 'PAUSED', 4: 'REMOVED' };

  console.log('🔍 Final state of all ad URLs\n');
  for (const camp of Object.keys(byCampaign).sort()) {
    console.log(`📌 ${camp}  (expected: ${EXPECTED[camp] || 'N/A'})`);
    for (const ad of byCampaign[camp]) {
      const ok = ad.url === EXPECTED[camp] ? '✅' : '⚠️';
      console.log(`   ${ok} [${statusMap[ad.status] || ad.status}] ${ad.ad_group}: ${ad.url}`);
    }
    console.log('');
  }

  console.log(`${mismatches === 0 ? '✅' : '⚠️'}  Mismatches: ${mismatches}\n`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error('❌ Error:', err.message);
  if (err.errors) console.error(JSON.stringify(err.errors, null, 2));
  process.exit(1);
});
