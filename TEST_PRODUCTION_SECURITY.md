# Production Security Testing Checklist

## 1. Test Security Headers
```bash
curl -I https://educourseportal-dn1wp7znk-edu-course.vercel.app

# Check for:
# ✅ Content-Security-Policy
# ✅ X-Frame-Options: DENY
# ✅ Strict-Transport-Security
# ✅ X-Content-Type-Options: nosniff
```

## 2. Test Edge Functions
Try generating a question or using the writing assessment feature in your app. If it fails with CORS errors, you need to update the CORS headers in Supabase.

## 3. Check Security Score
Visit: https://securityheaders.com/?q=educourseportal-dn1wp7znk-edu-course.vercel.app

Target: A+ rating

## 4. Verify API Key Security
```bash
# Check production bundle for API key exposure
curl https://educourseportal-dn1wp7znk-edu-course.vercel.app/assets/index-*.js | grep -i "sk-ant"
# Expected: No matches (secure)
```

## 5. Test Authentication Flow
- Sign up with a new email
- Check email verification works
- Test password reset
- Verify sign out works (✅ Already confirmed)

## 6. Production Monitoring
- Set up Vercel Analytics (in dashboard)
- Monitor Edge Function logs in Supabase
- Check for any console errors in production