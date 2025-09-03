# Google Analytics 4 (GA4) Setup Guide for EduCourse

## Overview
**Time Required**: 15-20 minutes  
**Cost**: FREE (forever at your scale)  
**Purpose**: Track all website traffic, understand user behavior, measure ROI across all marketing channels

---

## Part 1: Create Your GA4 Account (5 mins)

### Step 1: Access Google Analytics
1. Go to [analytics.google.com](https://analytics.google.com)
2. Sign in with your Google account (use the same one as Google Ads)
3. Click **"Start measuring"**

### Step 2: Account Setup
1. **Account Name**: `EduCourse`
2. **Account Data Sharing Settings**: Leave defaults checked
3. Click **"Next"**

### Step 3: Property Setup
1. **Property Name**: `EduCourse Website`
2. **Reporting Time Zone**: `(GMT+10:00) Australia/Sydney`
3. **Currency**: `Australian Dollar (A$)`
4. Click **"Next"**

### Step 4: Business Details
1. **Industry Category**: `Education`
2. **Business Size**: `Small - 1 to 10 employees`
3. Click **"Next"**

### Step 5: Business Objectives
Select these objectives:
- ✅ Generate leads
- ✅ Examine user behavior
- ✅ Drive online sales
- Click **"Create"**

### Step 6: Data Collection
1. Choose **"Web"**
2. **Website URL**: `https://educourse.com.au`
3. **Stream Name**: `EduCourse Main Site`
4. Click **"Create stream"**

### Step 7: SAVE YOUR MEASUREMENT ID
You'll see a Measurement ID like: `G-XXXXXXXXXX`  
**COPY THIS ID** - you'll need it in the next section!

---

## Part 2: Add GA4 to Your Website (5 mins)

### Step 1: Update index.html
Add this code to `/index.html` RIGHT AFTER your existing Google Ads tag:

```html
<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  
  // Google Ads (existing)
  gtag('config', 'AW-11082636289');
  
  // Google Analytics 4 (new - replace with your ID)
  gtag('config', 'G-XXXXXXXXXX', {
    send_page_view: true
  });
</script>
```

**IMPORTANT**: Since you already have gtag.js loaded for Google Ads, you only need to add the new `gtag('config', 'G-XXXXXXXXXX')` line!

### Step 2: Update PurchaseSuccess.tsx
Add GA4 ecommerce tracking to your purchase success page:

```typescript
// In PurchaseSuccess.tsx, after the Google Ads conversion code
useEffect(() => {
  if (typeof window !== 'undefined' && window.gtag && product) {
    // Existing Google Ads conversion
    console.log('🎯 Firing Google Ads conversion for product:', product);
    window.gtag('event', 'conversion', {
      'send_to': 'AW-11082636289',
      'value': 199.0,
      'currency': 'AUD',
      'transaction_id': Date.now() + '-' + product
    });
    
    // NEW: GA4 Ecommerce tracking
    console.log('📊 Tracking GA4 purchase for product:', product);
    window.gtag('event', 'purchase', {
      'transaction_id': Date.now() + '-' + product,
      'value': 199.0,
      'currency': 'AUD',
      'affiliation': 'EduCourse Website',
      'items': [{
        'item_id': product,
        'item_name': product,
        'price': 199.0,
        'quantity': 1,
        'item_category': 'Test Preparation'
      }]
    });
  }
}, [product]);
```

### Step 3: Update CSP in vercel.json
Your Content Security Policy already allows Google Analytics! No changes needed since you have:
```json
"connect-src 'self' ... https://www.google-analytics.com ..."
```

---

## Part 3: Configure GA4 Settings (5 mins)

### Step 1: Enable Enhanced Measurement
1. In GA4, go to **Admin** (gear icon)
2. Under Property, click **Data Streams**
3. Click on your web stream
4. Toggle ON all **Enhanced Measurement** options:
   - ✅ Page views
   - ✅ Scrolls (see how far people scroll)
   - ✅ Outbound clicks
   - ✅ Site search
   - ✅ Form interactions
   - ✅ File downloads

### Step 2: Set Up Conversions
1. Go to **Admin → Conversions**
2. Click **"New conversion event"**
3. Create these conversion events:
   - Event name: `purchase` (for completed purchases)
   - Event name: `begin_checkout` (for checkout starts)
   - Event name: `view_item` (for course page views)
   - Event name: `sign_up` (for account creation)

### Step 3: Link Google Ads
1. Go to **Admin → Google Ads Links**
2. Click **"Link"**
3. Choose your Google Ads account (11082636289)
4. Enable **"Enable personalized advertising"**
5. Enable **"Enable auto-tagging"**
6. Click **"Submit"**

### Step 4: Set Up Audiences
1. Go to **Admin → Audiences**
2. Create these audiences:
   - **Purchasers**: Users who triggered purchase event
   - **High Intent**: Visited 3+ course pages
   - **Cart Abandoners**: Started checkout but didn't purchase
   - **NSW Parents**: Users from Sydney/NSW
   - **VIC Parents**: Users from Melbourne/VIC

---

## Part 4: Track Custom Events (Optional but Recommended)

### Add to Your React Components:

```typescript
// Track course page views
const trackCourseView = (courseName: string) => {
  if (window.gtag) {
    window.gtag('event', 'view_item', {
      'currency': 'AUD',
      'value': 199.0,
      'items': [{
        'item_id': courseName,
        'item_name': courseName,
        'item_category': 'Test Preparation',
        'price': 199.0
      }]
    });
  }
};

// Track checkout starts
const trackBeginCheckout = (courseName: string) => {
  if (window.gtag) {
    window.gtag('event', 'begin_checkout', {
      'currency': 'AUD',
      'value': 199.0,
      'items': [{
        'item_id': courseName,
        'item_name': courseName,
        'price': 199.0
      }]
    });
  }
};

// Track sign ups
const trackSignUp = (method: string) => {
  if (window.gtag) {
    window.gtag('event', 'sign_up', {
      'method': method // 'email', 'google', etc.
    });
  }
};
```

---

## Part 5: Testing Your Setup (5 mins)

### Step 1: Real-Time Verification
1. Open GA4 and go to **Reports → Realtime**
2. Open your website in another tab
3. Navigate around your site
4. You should see yourself as an active user in real-time

### Step 2: DebugView Testing
1. Install [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna) Chrome extension
2. Enable the extension
3. In GA4, go to **Admin → DebugView**
4. Browse your site - you'll see all events firing in real-time

### Step 3: Test Purchase Tracking
1. Go through a test purchase with Stripe test card: `4242 4242 4242 4242`
2. Check DebugView for the `purchase` event
3. Verify the event includes:
   - Transaction ID
   - Value: 199
   - Currency: AUD
   - Item details

---

## Part 6: Create Your Dashboard (5 mins)

### Custom Dashboard Setup
1. Go to **Reports → Library**
2. Click **"Create new report"**
3. Name it: `Marketing Performance Dashboard`

### Add These Cards:
1. **Traffic Sources**
   - Dimension: Session default channel group
   - Metric: Users, Conversions
   
2. **Top Landing Pages**
   - Dimension: Landing page
   - Metric: Users, Engagement rate, Conversions
   
3. **Campaign Performance**
   - Dimension: Session campaign
   - Metric: Users, Conversions, Revenue
   
4. **Geographic Performance**
   - Dimension: City
   - Metric: Users, Conversions
   
5. **Device Breakdown**
   - Dimension: Device category
   - Metric: Users, Conversions

---

## Part 7: Key Reports to Check Weekly

### 1. Acquisition Report
**Path**: Reports → Acquisition → Traffic acquisition
- See which channels drive most traffic
- Compare conversion rates by source
- Identify best ROI channels

### 2. Engagement Report  
**Path**: Reports → Engagement → Pages and screens
- See most visited pages
- Track time on page
- Identify high-exit pages

### 3. Conversion Report
**Path**: Reports → Monetization → Ecommerce purchases
- Track revenue by product
- See purchase funnel
- Identify drop-off points

### 4. User Report
**Path**: Reports → User → User attributes
- Understand your audience
- See device usage
- Track user locations

---

## Understanding Your Data

### Key Metrics Explained:
- **Users**: Unique visitors
- **Sessions**: Total visits (one user can have multiple sessions)
- **Engagement Rate**: % of sessions that were "engaged" (>10 seconds or conversion)
- **Average Engagement Time**: How long users actively engage
- **Conversions**: Completed goals (purchases, sign-ups)
- **Revenue**: Total money generated

### Traffic Sources Explained:
- **Organic Search**: Google/Bing searches (FREE traffic)
- **Paid Search**: Google Ads clicks
- **Direct**: Typed URL or bookmarks
- **Referral**: Links from other websites
- **Social**: Facebook, Instagram, etc.
- **Email**: Clicks from email campaigns

### What Good Performance Looks Like:
- **Engagement Rate**: >55% is good
- **Average Session Duration**: >2 minutes is good
- **Conversion Rate**: 2-3% is typical, 4-5% is excellent
- **Bounce Rate**: <50% is good for content sites

---

## Pro Tips

### 1. Exclude Internal Traffic
1. Go to Admin → Data Streams → Configure tag settings
2. Click "Define internal traffic"
3. Add your IP address
4. This prevents your own visits from skewing data

### 2. Set Up Alerts
1. Go to Admin → Custom insights
2. Create alerts for:
   - Sudden traffic drops
   - Conversion rate changes
   - Revenue milestones

### 3. Use Annotations
- Mark important dates (campaign launches, site updates)
- Helps explain traffic/conversion changes later

### 4. Connect Search Console
1. Go to Admin → Search Console Links
2. Link your Google Search Console
3. See which keywords drive organic traffic

---

## Troubleshooting

### GA4 Not Showing Data?
- Wait 24-48 hours for initial data
- Check if tracking code is on all pages
- Verify no ad blockers are active
- Check DebugView for events

### Conversions Not Tracking?
- Ensure purchase event fires on success page
- Check event name matches exactly
- Verify value and currency are included
- Wait 24 hours for conversion data

### Real-time Shows 0 Users?
- Clear cache and cookies
- Check if GA4 code is properly installed
- Disable ad blockers
- Try incognito mode

---

## Next Steps

### Week 1:
- ✅ Set up GA4 account
- ✅ Add tracking code
- ✅ Configure conversions
- ✅ Link Google Ads
- ✅ Test everything works

### Week 2:
- Review initial data
- Set up custom audiences
- Create first custom report
- Set up email alerts

### Month 1:
- Analyze traffic sources
- Compare channel performance
- Optimize based on data
- Create monthly reporting routine

### Ongoing:
- Weekly performance check (10 mins)
- Monthly deep dive (30 mins)
- Quarterly strategy review (1 hour)

---

## Quick Reference

### Your Key IDs:
- **GA4 Measurement ID**: G-XXXXXXXXXX (you'll get this when you create account)
- **Google Ads ID**: AW-11082636289 (already have)
- **Website**: educourse.com.au

### Support Resources:
- [GA4 Help Center](https://support.google.com/analytics)
- [GA4 Demo Account](https://analytics.google.com/analytics/web/demoAccount)
- [Google Analytics YouTube Channel](https://www.youtube.com/c/GoogleAnalytics)

### Common Event Names:
- `page_view` - Automatic
- `purchase` - When payment completes
- `begin_checkout` - Start checkout
- `view_item` - View course page
- `add_to_cart` - Click purchase button
- `sign_up` - Create account
- `login` - User login

---

## ROI Calculation Example

Once GA4 is running for a month, you'll be able to calculate:

```
Google Ads ROI:
- Spend: $600 (30 days × $20)
- Sales from Ads: 10 × $199 = $1,990
- ROI: 231% ($1,390 profit)

Organic SEO ROI:
- Spend: $0
- Sales from Organic: 5 × $199 = $995
- ROI: Infinite (pure profit)

Email Marketing ROI:
- Spend: $50 (tools)
- Sales from Email: 3 × $199 = $597
- ROI: 1,094% ($547 profit)
```

This data will help you invest more in what works!