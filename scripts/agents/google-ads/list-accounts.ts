/**
 * List all Google Ads accounts under your manager account
 */

import { GoogleAdsApi } from 'google-ads-api';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET!;
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN!;
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN!;
  const managerId = process.env.GOOGLE_ADS_CUSTOMER_ID!.replace(/-/g, '');

  const client = new GoogleAdsApi({
    client_id: clientId,
    client_secret: clientSecret,
    developer_token: developerToken,
  });

  const manager = client.Customer({
    customer_id: managerId,
    refresh_token: refreshToken,
  });

  console.log('🔍 Fetching all client accounts under manager:', managerId);
  console.log('─'.repeat(60));

  try {
    const query = `
      SELECT
        customer_client.id,
        customer_client.descriptive_name,
        customer_client.manager,
        customer_client.status
      FROM customer_client
      WHERE customer_client.status = 'ENABLED'
      ORDER BY customer_client.descriptive_name
    `;

    const accounts = await manager.query(query);

    console.log('\n✅ Found', accounts.length, 'accounts:\n');

    accounts.forEach((account: any) => {
      const isManager = account.customer_client.manager ? '(Manager)' : '';
      console.log(
        `  • ${account.customer_client.id} - ${account.customer_client.descriptive_name} ${isManager}`
      );
    });

    console.log('\n─'.repeat(60));
    console.log('\n📝 Next step:');
    console.log('  1. Choose the client account with your actual campaigns');
    console.log('  2. Update .env with that Customer ID');
    console.log('  3. Run the agent again\n');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main();
