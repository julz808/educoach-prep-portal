# Supabase Edge Function Setup - CRITICAL STEP

## ⚠️ IMMEDIATE ACTION REQUIRED

Your Edge Functions need the Claude API key configured to work. This is a **manual step** that must be done in the Supabase Dashboard.

### Step-by-Step Instructions:

#### 1. Access Supabase Dashboard
1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Select project: **EduCourse Prep Portal** (`mcxxiunseawojmojikvb`)

#### 2. Navigate to Edge Functions
1. In the left sidebar, click **Edge Functions**
2. Click **Secrets** tab
3. You should see a list of environment variables

#### 3. Add Claude API Key Secret
1. Click **Add Secret** or **New Secret**
2. **Name:** `CLAUDE_API_KEY`
3. **Value:** `[YOUR_CLAUDE_API_KEY]`
4. Click **Save** or **Add**

#### 4. Verify Configuration
After adding the secret:
1. Go to **Edge Functions** → **Functions**
2. You should see:
   - `generate-questions`
   - `assess-writing`
3. Both should show as "Deployed" or "Active"

#### 5. Test the Configuration
Once configured, you can test the secure API:
```bash
# Run this from your project directory
node testing/test-rate-limiting.js
```

### ✅ Completion Checklist
- [ ] Logged into Supabase Dashboard
- [ ] Navigated to Edge Functions → Secrets
- [ ] Added `CLAUDE_API_KEY` secret
- [ ] Verified functions are deployed
- [ ] Tested API functionality

### 🚨 Important Notes
- This API key will be server-side only (secure)
- Edge Functions can now make Claude API calls
- Question generation and writing assessment will work
- Rate limiting is already active

---

**Please complete this step now, then let me know when it's done so I can continue with the remaining tasks.**