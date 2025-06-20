# Quick Fix for CORS Issue - Writing Assessment

## Problem
The Claude API cannot be called directly from the browser due to CORS restrictions.

## Immediate Solutions

### Option 1: Local Proxy Server (Fastest)

1. **Install dependencies:**
```bash
npm install express cors node-fetch dotenv
```

2. **Run the proxy server:**
```bash
node writing-assessment-proxy.js
```

3. **Test the writing assessment:**
   - The app will automatically try the local proxy at `http://localhost:3001`
   - Complete a writing question and submit the test
   - Check console logs for successful API calls

### Option 2: Supabase Edge Function (Production)

1. **Deploy via Supabase Dashboard:**
   - Go to https://supabase.com/dashboard
   - Navigate to Edge Functions
   - Create new function: `assess-writing`
   - Copy contents from `supabase/functions/assess-writing/index.ts`
   - Deploy the function

2. **Set environment variable:**
   - Go to Project Settings > Environment variables
   - Add: `CLAUDE_API_KEY` = your Claude API key

3. **Test the writing assessment:**
   - The app will automatically try Supabase Edge Function first
   - Fallback to local proxy if Edge Function fails

## Environment Variables

Make sure you have these in your `.env` file:

```env
VITE_CLAUDE_API_KEY=your_claude_api_key_here
CLAUDE_API_KEY=your_claude_api_key_here
VITE_PROXY_URL=http://localhost:3001
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Testing Steps

1. **Start the development server:**
```bash
npm run dev
```

2. **Start the proxy server (if using Option 1):**
```bash
node writing-assessment-proxy.js
```

3. **Test the writing assessment:**
   - Navigate to VIC Selective Entry test
   - Complete a writing question (Creative or Persuasive)
   - Submit the test
   - Check the review mode for detailed feedback

## Console Output

You should see:
```
🤖 Calling Claude API via backend proxy...
🔄 Attempting Supabase Edge Function...
⚠️ Supabase Edge Function failed: [error details]
🔄 Attempting local proxy server...
✅ Local proxy server successful
✅ Writing assessment completed
```

## Next Steps

- For development: Use the local proxy server
- For production: Deploy the Supabase Edge Function
- Both methods are implemented and will work automatically

The writing assessment feature should now work without CORS errors! 🎉