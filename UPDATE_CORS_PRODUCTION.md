# Update CORS Headers for Production

Your Vercel domain: `https://educourseportal-dn1wp7znk-edu-course.vercel.app`

## Step 1: Update generate-questions Edge Function

Go to your Supabase Edge Functions dashboard and update the `generate-questions` function with this corrected CORS configuration:

**Find this line in the function:**
```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
```

**Replace with:**
```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://educourseportal-dn1wp7znk-edu-course.vercel.app',
```

## Step 2: Update assess-writing Edge Function

Do the same for the `assess-writing` function - update the CORS headers:

**Find this line in the function:**
```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
```

**Replace with:**
```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://educourseportal-dn1wp7znk-edu-course.vercel.app',
```

## Step 3: Deploy Both Functions

After making these changes:
1. **Click "Deploy Function"** for generate-questions
2. **Click "Deploy Function"** for assess-writing

## Step 4: Test the Sign Out Fix

After the CORS updates:
1. **Wait 2-3 minutes** for the new deployment to propagate
2. **Test sign out** on your Vercel app
3. **Check that Edge Functions work** (if you use question generation)

This will secure your Edge Functions to only accept requests from your production domain while fixing the sign out issue.