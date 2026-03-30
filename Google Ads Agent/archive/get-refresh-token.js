#!/usr/bin/env node
/**
 * Get Google Ads OAuth Refresh Token
 *
 * This script helps you generate a refresh token for the Google Ads API.
 *
 * Usage:
 *   1. Get Client ID and Client Secret from Google Cloud Console
 *   2. Run: node scripts/agents/google-ads/get-refresh-token.js
 *   3. Follow the instructions
 */

import readline from 'readline';
import http from 'http';
import { URL } from 'url';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('🔐 Google Ads OAuth Setup\n');
  console.log('This will generate a refresh token for the Google Ads API.\n');

  // Get Client ID and Secret
  const clientId = await question('Enter your Client ID: ');
  const clientSecret = await question('Enter your Client Secret: ');

  if (!clientId || !clientSecret) {
    console.error('❌ Client ID and Secret are required!');
    process.exit(1);
  }

  const redirectUri = 'http://localhost:8080';
  const scope = 'https://www.googleapis.com/auth/adwords';

  // Build authorization URL
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');

  console.log('\n📋 Step 1: Authorize the application');
  console.log('\nOpen this URL in your browser:\n');
  console.log(authUrl.toString());
  console.log('\n');

  // Start local server to receive callback
  let authCode = null;

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname === '/') {
      authCode = url.searchParams.get('code');

      if (authCode) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <html>
            <body style="font-family: Arial; padding: 50px; text-align: center;">
              <h1>✅ Authorization Successful!</h1>
              <p>You can close this window and return to the terminal.</p>
            </body>
          </html>
        `);
        server.close();
      } else {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end('<html><body><h1>❌ Authorization Failed</h1></body></html>');
      }
    }
  });

  server.listen(8080, () => {
    console.log('⏳ Waiting for authorization...\n');
  });

  // Wait for authorization
  await new Promise((resolve) => {
    server.on('close', resolve);
  });

  if (!authCode) {
    console.error('❌ No authorization code received');
    process.exit(1);
  }

  console.log('\n📋 Step 2: Exchanging code for refresh token...\n');

  // Exchange code for tokens
  const tokenUrl = 'https://oauth2.googleapis.com/token';
  const tokenData = new URLSearchParams({
    code: authCode,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code'
  });

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenData
    });

    const data = await response.json();

    if (data.error) {
      console.error('❌ Error getting tokens:', data.error_description || data.error);
      process.exit(1);
    }

    console.log('✅ Success! Here are your credentials:\n');
    console.log('─'.repeat(60));
    console.log('\nAdd these to your .env file:\n');
    console.log(`GOOGLE_ADS_CLIENT_ID=${clientId}`);
    console.log(`GOOGLE_ADS_CLIENT_SECRET=${clientSecret}`);
    console.log(`GOOGLE_ADS_DEVELOPER_TOKEN=Pp04tdcBEHldBSbPCgOBwg`);
    console.log(`GOOGLE_ADS_REFRESH_TOKEN=${data.refresh_token}`);
    console.log('GOOGLE_ADS_CUSTOMER_ID=YOUR_CUSTOMER_ID_HERE');
    console.log('\n─'.repeat(60));
    console.log('\n📝 Next steps:');
    console.log('  1. Find your Customer ID (10-digit number in Google Ads, top right)');
    console.log('  2. Add all 5 credentials to your .env file');
    console.log('  3. Run: npm run agents:google-ads:dry-run');
    console.log('\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  rl.close();
}

main().catch(console.error);
