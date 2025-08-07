# Domain Transfer Guide: educourse.com.au to Vercel

## Overview
This guide will walk you through transferring your educourse.com.au domain from GoDaddy (currently hosting WordPress/Elementor/Thinkific) to point to your new Vercel-hosted web application.

**Important**: This process will make your current WordPress site inaccessible. Ensure you have backed up any important content before proceeding.

---

## Prerequisites

Before starting, ensure you have:
- [ ] Access to your GoDaddy account
- [ ] Access to your Vercel account
- [ ] Your new web app successfully deployed on Vercel
- [ ] Backed up any important content from your WordPress site
- [ ] Exported any necessary data from Thinkific

---

## Step 1: Prepare Your Vercel Project

1. **Log into Vercel**
   - Go to https://vercel.com
   - Navigate to your project dashboard

2. **Verify Your Deployment**
   - Ensure your app is working at the Vercel URL (e.g., `your-project.vercel.app`)
   - Test all critical functionality

---

## Step 2: Add Domain to Vercel

1. **Navigate to Domain Settings**
   - In your Vercel project, go to **Settings** → **Domains**
   - Click **Add Domain**

2. **Enter Your Domain**
   - Type `educourse.com.au`
   - Click **Add**

3. **Choose Configuration**
   - Vercel will ask how you want to configure the domain
   - Select **Add educourse.com.au and Redirect www.educourse.com.au to it**
   - This ensures both `educourse.com.au` and `www.educourse.com.au` work

4. **Note the DNS Records**
   - Vercel will show you the required DNS records
   - You'll typically see:
     - An A record pointing to Vercel's IP (usually `76.76.21.21`)
     - A CNAME record for `www` pointing to `cname.vercel-dns.com`
   - Keep this page open - you'll need these values

---

## Step 3: Update DNS Settings in GoDaddy

1. **Log into GoDaddy**
   - Go to https://godaddy.com
   - Sign in to your account

2. **Navigate to DNS Management**
   - Go to **My Products**
   - Find `educourse.com.au`
   - Click **DNS** or **Manage DNS**

3. **Remove Existing Records** (Important!)
   - Delete any existing A records for `@` (root domain)
   - Delete any existing CNAME records for `www`
   - **DO NOT** delete MX records (these are for email)
   - **DO NOT** delete TXT records unless they're WordPress-specific

4. **Add Vercel DNS Records**

   **For the root domain (@):**
   - Click **Add Record**
   - Type: **A**
   - Name: **@**
   - Value: **76.76.21.21** (or the IP Vercel provided)
   - TTL: **600** (10 minutes) or leave as default

   **For www subdomain:**
   - Click **Add Record**
   - Type: **CNAME**
   - Name: **www**
   - Value: **cname.vercel-dns.com**
   - TTL: **600** (10 minutes) or leave as default

5. **Save Changes**
   - Click **Save** to apply all DNS changes

---

## Step 4: Configure Domain in Vercel

1. **Return to Vercel**
   - Go back to your domain configuration page in Vercel

2. **Verify Configuration**
   - Click **Refresh** or wait a few minutes
   - Vercel will automatically check if the DNS records are correct
   - You should see green checkmarks when properly configured

3. **SSL Certificate**
   - Vercel will automatically provision an SSL certificate
   - This may take 10-20 minutes after DNS verification

---

## Step 5: Wait for DNS Propagation

**Important**: DNS changes can take time to propagate globally.

- **Typical timeframe**: 10 minutes to 48 hours
- **Average**: 1-4 hours
- **Check progress**: Use https://www.whatsmydns.net
  - Enter `educourse.com.au`
  - Check if the A record shows Vercel's IP globally

---

## Step 6: Verify the Transfer

1. **Test Your Domain**
   - Visit https://educourse.com.au
   - Visit https://www.educourse.com.au
   - Both should load your Vercel app

2. **Check SSL Certificate**
   - Look for the padlock icon in your browser
   - The certificate should be issued by Let's Encrypt (via Vercel)

3. **Test Key Functionality**
   - Navigation
   - Forms
   - API connections
   - Authentication (if applicable)

---

## Step 7: Update Your Application

1. **Update Environment Variables** (if needed)
   - In Vercel, go to **Settings** → **Environment Variables**
   - Update any URLs from Vercel URLs to your custom domain
   - Common variables to update:
     - `NEXT_PUBLIC_SITE_URL`
     - `NEXTAUTH_URL` (if using NextAuth)
     - Any API endpoints

2. **Redeploy After Changes**
   - Trigger a new deployment to apply environment variable changes

---

## Troubleshooting

### Domain Not Working After 24 Hours

1. **Check DNS Records**
   - Verify records in GoDaddy match Vercel's requirements exactly
   - Use `nslookup educourse.com.au` in terminal to check

2. **Clear DNS Cache**
   - Windows: `ipconfig /flushdns`
   - Mac: `sudo dscacheutil -flushcache`
   - Chrome: Navigate to `chrome://net-internals/#dns` and click "Clear host cache"

### SSL Certificate Issues

- Vercel automatically handles SSL
- If showing "Not Secure":
  - Wait 20-30 minutes after domain verification
  - Check Vercel dashboard for any error messages
  - Contact Vercel support if issues persist

### Email Not Working

- If you were using GoDaddy email:
  - MX records should remain unchanged
  - Only A and CNAME records for web traffic should be modified
- Verify MX records are still present in GoDaddy DNS settings

---

## Important Considerations

### Before Making Changes

1. **Backup WordPress Content**
   - Export posts/pages if needed
   - Save any custom code or configurations
   - Download media files

2. **Thinkific Course Content**
   - Ensure course content is migrated or accessible elsewhere
   - Update any course links in your new app

3. **SEO Impact**
   - Set up 301 redirects for important pages (configure in Vercel)
   - Update Google Search Console with new property
   - Submit new sitemap

### After Transfer

1. **Monitor Performance**
   - Check Google Analytics for traffic changes
   - Monitor for 404 errors
   - Test all critical user journeys

2. **Update External Services**
   - Update domain in Google Analytics
   - Update social media links
   - Update any third-party integrations

---

## Rollback Plan

If you need to revert to WordPress:

1. **In GoDaddy DNS**:
   - Change A record back to original WordPress hosting IP
   - Update CNAME records to original values

2. **Note**: Your WordPress site may need to be reactivated with your hosting provider

---

## Support Contacts

- **Vercel Support**: https://vercel.com/support
- **GoDaddy Support**: https://au.godaddy.com/help
- **DNS Propagation Check**: https://www.whatsmydns.net

---

## Checklist Summary

- [ ] Backup WordPress/Thinkific content
- [ ] Deploy and test app on Vercel
- [ ] Add domain to Vercel project
- [ ] Update DNS records in GoDaddy
- [ ] Wait for DNS propagation (1-48 hours)
- [ ] Verify SSL certificate is active
- [ ] Test website functionality
- [ ] Update environment variables if needed
- [ ] Monitor for issues in first 24-48 hours

---

## Notes

- Keep your GoDaddy account active for domain renewal
- Vercel handles SSL certificates automatically
- DNS changes are not instant - be patient
- Always test thoroughly before announcing the change to users