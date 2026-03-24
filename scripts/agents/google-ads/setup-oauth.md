# Get Google Ads OAuth Credentials

## Step 1: Create OAuth Client (5 minutes)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one if you don't have one)
3. Enable Google Ads API:
   - Go to "APIs & Services" → "Library"
   - Search for "Google Ads API"
   - Click "Enable"

4. Create OAuth credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "+ CREATE CREDENTIALS" → "OAuth client ID"
   - If prompted, configure OAuth consent screen:
     - User Type: "External"
     - App name: "EduCourse Marketing Agent"
     - User support email: julian@educourse.com.au
     - Developer contact: julian@educourse.com.au
     - Click "Save and Continue" through the scopes/test users sections

5. Create OAuth Client ID:
   - Application type: **"Desktop app"**
   - Name: "EduCourse Ads Agent"
   - Click "Create"

6. **COPY THESE TWO VALUES:**
   - Client ID (looks like: `123456789.apps.googleusercontent.com`)
   - Client Secret (looks like: `GOCSPX-abc123...`)

## Step 2: Get Refresh Token (10 minutes)

I'll create a script for you...
