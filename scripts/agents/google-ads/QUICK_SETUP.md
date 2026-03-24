# Quick Setup - Get Your Credentials in 15 Minutes

You already have: ✅ Developer Token: `Pp04tdcBEHldBSbPCgOBwg`

You need 4 more things:
- Client ID
- Client Secret
- Refresh Token
- Customer ID

## Option 1: Use the Automated Script (Recommended)

### Step 1: Get Client ID & Secret (5 minutes)

1. Go to: https://console.cloud.google.com/apis/credentials
2. Select your project (or create one)
3. Click "+ CREATE CREDENTIALS" → "OAuth client ID"
4. If prompted to configure consent screen:
   - User Type: "External" → Continue
   - App name: "EduCourse Marketing"
   - Email: julian@educourse.com.au
   - Save and Continue (skip optional fields)
   - Add test user: julian@educourse.com.au
   - Save

5. Create OAuth Client:
   - Application type: **Desktop app**
   - Name: "EduCourse Ads Agent"
   - Click CREATE

6. **Copy the Client ID and Client Secret** that appear

### Step 2: Run the Script (2 minutes)

```bash
node scripts/agents/google-ads/get-refresh-token.js
```

The script will:
1. Ask for your Client ID and Client Secret
2. Open your browser for authorization
3. Automatically get your Refresh Token
4. Show you exactly what to add to `.env`

### Step 3: Get Customer ID (30 seconds)

1. Log into Google Ads: https://ads.google.com/
2. Look at the top-right corner
3. Your Customer ID is the 10-digit number (format: 123-456-7890)

### Step 4: Add to .env (1 minute)

Open `.env` and uncomment/fill in these lines:

```bash
GOOGLE_ADS_CLIENT_ID=your_client_id_from_step_1
GOOGLE_ADS_CLIENT_SECRET=your_client_secret_from_step_1
GOOGLE_ADS_DEVELOPER_TOKEN=Pp04tdcBEHldBSbPCgOBwg
GOOGLE_ADS_REFRESH_TOKEN=your_refresh_token_from_step_2
GOOGLE_ADS_CUSTOMER_ID=123-456-7890
```

### Step 5: Test It! (30 seconds)

```bash
npm run agents:google-ads:dry-run
```

If you see:
```
✓ Google Ads API connected
✓ Fetched data for 6 campaigns
```

**You're done!** 🎉

---

## Option 2: Manual Method (if script doesn't work)

### Get Refresh Token Manually

1. Build authorization URL:
```
https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost&response_type=code&scope=https://www.googleapis.com/auth/adwords&access_type=offline&prompt=consent
```

2. Replace `YOUR_CLIENT_ID` with your actual Client ID
3. Open URL in browser
4. Authorize the app
5. Copy the `code` from the redirect URL (after `?code=...`)
6. Exchange code for token:

```bash
curl -X POST https://oauth2.googleapis.com/token \
  -d "code=YOUR_CODE_HERE" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "redirect_uri=http://localhost" \
  -d "grant_type=authorization_code"
```

7. Copy the `refresh_token` from the response

---

## Troubleshooting

**"The redirect URI doesn't match"**
- Use `http://localhost:8080` exactly (no trailing slash)
- Add it to "Authorized redirect URIs" in Google Cloud Console

**"Developer token not approved"**
- You can still test with test accounts
- Production requires Google to approve your developer token (24-48 hours)

**"Invalid customer ID"**
- Remove dashes: `123-456-7890` → `1234567890`
- Or keep them, the code will strip them

**Script won't run**
```bash
chmod +x scripts/agents/google-ads/get-refresh-token.js
node scripts/agents/google-ads/get-refresh-token.js
```

---

## Quick Reference

**What you need:**

1. ✅ Developer Token: `Pp04tdcBEHldBSbPCgOBwg`
2. ⏳ Client ID: Get from Google Cloud Console
3. ⏳ Client Secret: Get from Google Cloud Console
4. ⏳ Refresh Token: Run the script to get it
5. ⏳ Customer ID: Get from Google Ads (top-right)

**Where to get them:**

- Client ID/Secret: https://console.cloud.google.com/apis/credentials
- Refresh Token: `node scripts/agents/google-ads/get-refresh-token.js`
- Customer ID: https://ads.google.com/ (top-right corner)

**Total time:** 10-15 minutes

**Ready?** Let's do this! 🚀
