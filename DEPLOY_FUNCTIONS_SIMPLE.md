# Simple Edge Function Deployment

## Option 1: Via Dashboard (Fastest - 5 minutes)

Since Docker setup is having issues, use the web interface:

### Step 1: Deploy generate-questions
1. **In your Supabase dashboard**, click **"Deploy a new function"**
2. **Choose "Via Editor"** 
3. **Function name:** `generate-questions`
4. **Replace the default code** with the contents from: `supabase/functions/generate-questions/index.ts`
5. **Click "Deploy Function"**

### Step 2: Deploy assess-writing  
1. **Click "Deploy a new function"** again
2. **Choose "Via Editor"**
3. **Function name:** `assess-writing`
4. **Replace the default code** with the contents from: `supabase/functions/assess-writing/index.ts`
5. **Click "Deploy Function"**

### Step 3: Add API Key Secret
1. **Go to Edge Functions → Secrets**
2. **Click "Add Secret"**
3. **Name:** `CLAUDE_API_KEY`
4. **Value:** `[YOUR_CLAUDE_API_KEY]`
5. **Click "Save"**

---

## Option 2: Manual Docker Setup (If you prefer CLI)

### Step 1: Install Docker Manually
1. **Download Docker Desktop** from [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/mac)
2. **Install the .dmg file**
3. **Start Docker Desktop**
4. **Wait for it to fully start** (green status icon)

### Step 2: Deploy via CLI
```bash
# Verify Docker is running
docker --version

# Deploy functions
supabase functions deploy generate-questions
supabase functions deploy assess-writing

# Set API key secret
supabase secrets set CLAUDE_API_KEY=[YOUR_CLAUDE_API_KEY]
```

---

## What You'll See After Success

In your Supabase Edge Functions page, you should see:
- ✅ **generate-questions** (Deployed)
- ✅ **assess-writing** (Deployed)
- ✅ **Secrets tab** showing CLAUDE_API_KEY

## Test the Functions

After deployment, test with:
```bash
# Test from your app directory
node testing/test-rate-limiting.js
```

---

**Recommendation: Use Option 1 (Dashboard) for speed, or Option 2 if you specifically want CLI workflow.**