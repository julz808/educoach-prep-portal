# Domain Migration Guide: GoDaddy to Vercel

## Overview
This guide will help you point your existing GoDaddy domain (educourse.com.au) to your new Vercel-hosted application, replacing your WordPress/Elementor marketing site and Thinkfic learning platform.

---

## ⚠️ IMPORTANT BEFORE YOU START

### Pre-Migration Checklist
- [ ] **Backup your existing WordPress site** (files and database)
- [ ] **Export any important data from Thinkfic** (student records, course content, etc.)
- [ ] **Note your current DNS records** (screenshot or export from GoDaddy)
- [ ] **Verify your Vercel app is working** at the current Vercel URL
- [ ] **Test all critical features** (auth, payments, course access) on Vercel
- [ ] **Have a rollback plan** in case something goes wrong

### Timing Considerations
- DNS changes can take 24-48 hours to fully propagate
- Consider doing this during low-traffic hours
- Keep your old hosting active for at least 48 hours after the switch

---

## 📋 Step 1: Prepare Your Vercel Project

### 1.1 Verify Your Deployment
1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Click on your project (educoach-prep-portal-2)
3. Verify the latest deployment is successful
4. Test the current Vercel URL thoroughly

### 1.2 Note Your Vercel URLs
- Your current URL should be something like: `educoach-prep-portal-2.vercel.app`
- Keep this URL handy for testing

---

## 🌐 Step 2: Add Custom Domain in Vercel

### 2.1 Navigate to Domain Settings
1. In your Vercel project dashboard, click on **"Settings"** tab
2. Click on **"Domains"** in the left sidebar

### 2.2 Add Your Domain
1. Click **"Add"** button
2. Enter your domain: `educourse.com.au`
3. Click **"Add"** to confirm

### 2.3 Add www Subdomain (Recommended)
1. Also add: `www.educourse.com.au`
2. This ensures both versions work

### 2.4 Vercel DNS Records for Your Domain
Based on your Vercel configuration, here are your exact DNS records:

**For educourse.com.au (root domain):**
```
Type: A
Name: @
Value: 216.198.79.1
```

**For www.educourse.com.au:**
```
Type: CNAME
Name: www
Value: 4f87934f3e412790.vercel-dns-017.com
```

**IMPORTANT**: Use these exact values for your GoDaddy configuration!

---

## 🔧 Step 3: Configure DNS in GoDaddy

### 3.1 Access GoDaddy DNS Management
1. Log in to your GoDaddy account
2. Go to **"My Products"**
3. Find `educourse.com.au` and click **"DNS"** or **"Manage DNS"**

### 3.2 Remove Conflicting Records
**⚠️ CAUTION**: This will take your current site offline!

Based on your current GoDaddy DNS setup, **DELETE these specific records**:
- **A Record**: `@` → `162.159.137.9` ❌ DELETE
- **A Record**: `@` → `162.159.138.9` ❌ DELETE  
- **CNAME**: `www` → `educourse.elementor.cloud` ❌ DELETE
- **CNAME**: `learn` → `julian-s-site-12e8.thinkific.com` ❌ DELETE

**KEEP these records** (don't delete):
- All **MX records** (for email delivery)
- All **TXT records** (for Google verification and SPF)
- **NS records** (nameservers)
- **SOA record** (required DNS record)
- **CNAME**: `_domainconnect` (domain management service)

### 3.3 Add Vercel DNS Records

#### For the Root Domain (@):
1. Click **"Add"** → Select **"A"** record
2. Set:
   - **Type**: A
   - **Name**: @ (or leave blank)
   - **Value**: 216.198.79.1
   - **TTL**: 600 seconds (or lowest available)

#### For www Subdomain:
1. Click **"Add"** → Select **"CNAME"** record
2. Set:
   - **Type**: CNAME
   - **Name**: www
   - **Value**: 4f87934f3e412790.vercel-dns-017.com
   - **TTL**: 600 seconds (or lowest available)

### 3.4 Save All Changes
Click **"Save"** to apply all DNS changes

---

## ✅ Step 4: Verify Domain Configuration in Vercel

### 4.1 Return to Vercel
1. Go back to your Vercel project → Settings → Domains
2. You should see your domains listed with status indicators

### 4.2 Wait for Verification
- Vercel will automatically check DNS configuration
- You'll see checkmarks ✓ when properly configured
- This can take 5-30 minutes

### 4.3 SSL Certificate
- Vercel automatically provisions SSL certificates
- This happens after DNS verification
- Usually takes 10-20 minutes

---

## 🔄 Step 5: Handle Redirects

### 5.1 Set Primary Domain in Vercel
1. In Domains settings, click on `educourse.com.au`
2. Set it as the **primary domain**
3. This will redirect www to non-www (or vice versa based on your preference)

### 5.2 Configure Redirects for Old URLs (Optional)
If you need to redirect old WordPress URLs, create a `vercel.json` file:

```json
{
  "redirects": [
    {
      "source": "/old-wordpress-page",
      "destination": "/new-page",
      "permanent": true
    },
    {
      "source": "/courses/(.*)",
      "destination": "/dashboard",
      "permanent": true
    }
  ]
}
```

---

## 🧪 Step 6: Testing

### 6.1 DNS Propagation Check
1. Use: https://dnschecker.org
2. Enter `educourse.com.au`
3. Check if it points to `216.198.79.1` globally
4. Check if `www.educourse.com.au` points to `4f87934f3e412790.vercel-dns-017.com`

### 6.2 Test Your Site
Once DNS propagates:
1. Visit https://educourse.com.au
2. Check https://www.educourse.com.au
3. Verify SSL certificate (padlock icon)
4. Test all critical functions:
   - User registration/login
   - Payment processing
   - Course access
   - Email notifications

### 6.3 Clear Browser Cache
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Try incognito/private mode
- Test on mobile devices

---

## 📧 Step 7: Email Configuration (IMPORTANT!)

### 7.1 Verify Email Records Unchanged
Your email should continue working if you kept:
- MX records
- Email-related TXT records (SPF, DKIM)
- Email CNAME records

### 7.2 Update Email Service if Needed
If your emails were tied to WordPress hosting:
1. Consider using Google Workspace or Microsoft 365
2. Update MX records accordingly
3. Update any email sending in your app (SMTP settings)

---

## 🚨 Step 8: Monitoring & Troubleshooting

### 8.1 Common Issues & Solutions

**Site not loading:**
- Wait for DNS propagation (up to 48 hours)
- Clear browser cache
- Check DNS settings in GoDaddy

**SSL Certificate Error:**
- Wait for Vercel to provision certificate
- Ensure domain is verified in Vercel
- Contact Vercel support if it takes > 24 hours

**Some users see old site:**
- DNS propagation is gradual
- Lower TTL values in GoDaddy for faster propagation
- Wait 24-48 hours for full propagation

### 8.2 Monitor Your Application
- Check Vercel dashboard for errors
- Monitor Supabase for database issues
- Test Stripe webhooks are working
- Verify email delivery

---

## 🔄 Step 9: Clean Up (After 48-72 Hours)

Once everything is working:
1. Cancel your WordPress hosting (keep backups!)
2. Cancel Thinkfic subscription
3. Remove any temporary redirects
4. Update your TTL values to standard (3600 seconds)

---

## 📞 Support Contacts

### Vercel Support
- Documentation: https://vercel.com/docs
- Support: https://vercel.com/support

### GoDaddy Support
- DNS Help: https://www.godaddy.com/help/manage-dns-680
- Support: 24/7 phone support available

### Your App Support
- Supabase: https://supabase.com/support
- Stripe: https://support.stripe.com

---

## 📝 Post-Migration Checklist

After migration is complete:
- [ ] Update any hardcoded URLs in your application
- [ ] Update sitemap.xml with new URLs
- [ ] Submit new sitemap to Google Search Console
- [ ] Update any third-party integrations with new domain
- [ ] Update social media links
- [ ] Update marketing materials
- [ ] Update email signatures
- [ ] Set up domain monitoring/uptime alerts
- [ ] Document the new infrastructure for your team

---

## 🆘 Emergency Rollback Plan

If something goes critically wrong:

1. **In GoDaddy DNS:**
   - Change A record back to old hosting IP
   - Change CNAME back to old hosting
   - Lower TTL to 600 seconds for faster propagation

2. **Keep Old Hosting Active:**
   - Don't cancel immediately
   - Keep for at least 1 week after migration

3. **Have Backups Ready:**
   - WordPress backup files
   - Database backup
   - Thinkfic course export

---

## 💡 Final Tips

1. **Do a dry run:** Test everything on Vercel's temporary domain first
2. **Communicate:** Inform users about potential downtime
3. **Monitor closely:** Watch for the first 48 hours
4. **Keep documentation:** Document any custom configurations
5. **Test payments:** Ensure Stripe webhooks work with new domain

---

## Notes Specific to Your Setup

### Current Stack Being Replaced:
- **WordPress/Elementor** → Vercel + React
- **Thinkfic** → Custom Learning Portal
- **Old Database** → Supabase
- **Old Payments** → Stripe Integration

### Your New Stack:
- **Frontend**: React + Vite on Vercel
- **Backend**: Supabase (Auth + Database)
- **Payments**: Stripe
- **Domain**: educourse.com.au via GoDaddy → Vercel

---

**Good luck with your migration! 🚀**

Remember: Take it slow, test everything, and keep backups of everything.