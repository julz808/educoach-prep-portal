# Edge Function Deployment Guide

## Problem
The Claude API cannot be called directly from the browser due to CORS restrictions and security concerns (API key exposure).

## Solution
Deploy a Supabase Edge Function to act as a secure proxy for Claude API calls.

## Deployment Steps

### 1. Via Supabase Dashboard (Recommended)

1. **Login to Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Navigate to Edge Functions**
   - Go to "Edge Functions" in the left sidebar
   - Click "Create Function"

3. **Create Function**
   - Function name: `assess-writing`
   - Copy the entire contents of `supabase/functions/assess-writing/index.ts`
   - Paste into the function editor
   - Click "Deploy Function"

4. **Set Environment Variables**
   - Go to Project Settings > Environment variables
   - Add secret: `CLAUDE_API_KEY` = your Claude API key
   - The function will automatically have access to `SUPABASE_URL` and `SUPABASE_ANON_KEY`

### 2. Via Supabase CLI (If Docker is available)

```bash
# Start Docker Desktop first, then:
npx supabase functions deploy assess-writing
```

## Environment Variables Required

The Edge Function needs these environment variables in Supabase:

```
CLAUDE_API_KEY=your_claude_api_key_here
SUPABASE_URL=automatically_provided
SUPABASE_ANON_KEY=automatically_provided
```

## Testing the Function

After deployment, you can test the function:

1. **Via Dashboard**
   - Go to Edge Functions > assess-writing
   - Use the "Test" tab with sample payload

2. **Sample Test Payload**
```json
{
  "userResponse": "This is a test writing response about creativity and imagination.",
  "writingPrompt": "Write a creative piece exploring the concept of 'forgotten treasures'",
  "rubric": {
    "testName": "VIC Selective Entry (Year 9 Entry)",
    "genre": "Creative Writing",
    "totalMarks": 30,
    "timeMinutes": 20,
    "criteria": [
      {
        "name": "Imagination & Originality",
        "description": "Creative ideas, unique perspective, and innovative approach",
        "maxMarks": 7,
        "weight": 23.3
      }
    ]
  },
  "yearLevel": "Year 8-9"
}
```

## Verification

After deployment, the writing assessment should work without CORS errors. Check:

1. ✅ Edge Function is deployed and accessible
2. ✅ Environment variables are set
3. ✅ Function responds to test calls
4. ✅ Writing assessment works in the app

## Next Steps

Once the Edge Function is deployed:

1. Test a writing question in the app
2. Submit the test to trigger assessment
3. Check console logs for successful API calls
4. Verify detailed feedback appears in review mode

## Alternative: Backend API Route

If Edge Functions don't work, you can also create a backend API route in your preferred framework (Node.js, Python, etc.) to proxy the Claude API calls.