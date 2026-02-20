# EduCourse Marketing Guide - What To Do Next

**Last Updated:** November 24, 2025
**Status:** SEO Phase 1 Complete, Ready for Next Steps

---

## Current Status Summary

### What's DONE
- Google Search Console set up and pages indexed (10 pages indexed as of Nov 2025)
- Sitemap submitted and successful
- SEO metadata system deployed (per-page meta tags, schema markup)
- Images optimized (96.5% reduction - 22MB to 772KB)
- 301 redirects configured
- Robots.txt optimized
- Google Ads campaigns created (6 campaigns, $10/day each)

### What's NOT Done Yet
- GA4 conversion tracking (partially set up, needs verification)
- Google Ads underperforming (low impressions despite budget)
- Blog not created
- OG images not created
- Backlinks strategy not started
- Email marketing not set up

---

## Priority Action Items (In Order)

### 1. FIX GOOGLE ADS (URGENT)

Your Google Ads have barely any impressions despite $60/day total budget. Common causes:

**Diagnostic Checklist:**
1. Go to Google Ads dashboard
2. Check each campaign for:
   - **Ad Status**: Are ads "Eligible" or showing warnings?
   - **Keyword Status**: Are keywords "Eligible"?
   - **Search Terms Report**: Any data at all?
   - **Bid amounts**: What's your actual CPC vs recommended?
   - **Quality Score**: Check for low quality scores

**Likely Issues & Fixes:**

| Issue | Symptom | Fix |
|-------|---------|-----|
| Bids too low | 0 impressions, "Limited by bid" | Increase max CPC to $3-5 |
| Low search volume | "Low search volume" status | Add broader match keywords |
| Narrow targeting | Few impressions | Expand to all major Australian cities |
| Payment issue | All campaigns paused | Check billing settings |
| Ad disapproval | Warning icons | Review and fix policy violations |
| Too restrictive match types | Exact match only | Switch to broad match |

**Quick Fix Steps:**
1. Log into Google Ads: ads.google.com
2. Go to Campaigns > Click each campaign
3. Check for any warning icons or "Limited" status
4. Check Keywords tab - look for "Low search volume" or "Below first page bid"
5. If bids are issue: Increase target CPA to $50-60 or max CPC to $4-5
6. If keywords are issue: Add more broad match keywords

**Recommended Keywords Per Product (Broad Match):**
```
VIC Selective: vic selective entry, selective school test victoria, melbourne selective schools
NSW Selective: nsw selective test, selective high school test, sydney selective school
NAPLAN Year 5: year 5 naplan practice, naplan year 5, naplan test year 5
NAPLAN Year 7: year 7 naplan practice, naplan year 7, naplan test year 7
ACER: acer scholarship test, acer test prep, private school scholarship test
EduTest: edutest practice, edutest scholarship, edutest prep
```

---

### 2. SET UP GA4 PROPERLY

**Why:** Without conversion tracking, you can't measure ROI from any marketing channel.

**Your GA4 Measurement ID:** Get this from analytics.google.com

**Step 1: Verify GA4 is Installed**
1. Go to analytics.google.com
2. Check if you see real-time data when you browse your site
3. If not, add the GA4 tag to index.html:

```html
<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

**Step 2: Set Up Conversion Events**
1. In GA4, go to Admin > Events
2. Mark these as conversions:
   - `purchase` (when someone buys)
   - `begin_checkout` (when someone starts checkout)

**Step 3: Link GA4 to Google Ads**
1. In GA4, go to Admin > Google Ads Links
2. Link your Google Ads account (AW-11082636289)
3. Enable auto-tagging

**Step 4: Link GA4 to Search Console**
1. In GA4, go to Admin > Search Console Links
2. Link your Search Console property

---

### 3. CREATE A BLOG (High Impact)

**Why:** Blog content drives 60-70% of organic traffic through long-tail keywords.

**Options (Simplest to Most Complex):**

**Option A: Ghost Pro ($9/month) - RECOMMENDED**
- Easiest to set up
- Great SEO built-in
- Host at blog.educourse.com.au
- Takes 1-2 hours to set up

**Option B: Sanity.io (Free)**
- More technical setup
- Requires coding integration
- Takes 4-6 hours to set up

**Option C: Simple Blog Pages in Your App**
- Create `/blog` route
- Manual page creation for each post
- Takes 2-3 hours to set up

**First 4 Blog Posts to Write:**

1. **"Complete Guide to NSW Selective Entry Test 2026"**
   - Target: "nsw selective entry" (2,400 searches/month)
   - 1,500 words
   - Link to your NSW Selective product

2. **"VIC Selective Entry Exam: Everything Parents Need to Know"**
   - Target: "vic selective entry" (1,600 searches/month)
   - 1,500 words
   - Link to your VIC Selective product

3. **"Year 5 NAPLAN 2026: Parent's Complete Preparation Guide"**
   - Target: "year 5 naplan" (1,200 searches/month)
   - 1,200 words
   - Link to your Year 5 NAPLAN product

4. **"ACER vs EduTest Scholarship: Which Test is Right for Your Child?"**
   - Target: "edutest vs acer" (720 searches/month)
   - 1,200 words
   - Links to both scholarship products

---

### 4. CREATE OG IMAGES

**Why:** When people share your links on social media, they see broken images.

**What You Need:** 7 images (1200x630px each)

**Files to Create:**
- `/public/images/og-home.png`
- `/public/images/og-vic-selective.png`
- `/public/images/og-nsw-selective.png`
- `/public/images/og-acer.png`
- `/public/images/og-edutest.png`
- `/public/images/og-year5-naplan.png`
- `/public/images/og-year7-naplan.png`

**How to Create (Canva):**
1. Go to canva.com
2. Create design: Custom size 1200x630
3. Include: Test name, "EduCourse" branding, key benefit
4. Use brand colors: Teal #4ECDC4, Coral #FF6B6B
5. Export as PNG
6. Save to `/public/images/`

---

### 5. START BACKLINK BUILDING (Month 2+)

**Easy Wins (Do First):**
- Submit to 5-10 education directories
- Create Google Business Profile
- Submit to local business directories

**Medium Effort:**
- Guest post on 1-2 education/parenting blogs per month
- Reach out to resource pages asking to be listed
- Participate in parent forums (don't spam)

**High Effort, High Value:**
- Partner with selective schools as a resource
- Create free downloadable guides (lead magnets)
- Get featured in education publications

**Goal:** 2-3 quality backlinks per month

---

## Weekly Routine (2-3 Hours/Week)

### Monday (30 min)
1. Check Google Search Console
   - Note: impressions, clicks, average position
   - Check for crawl errors
   - See which queries are performing

2. Check Google Analytics
   - Traffic trends
   - Conversion rate
   - Top pages

### Wednesday (1-2 hours)
- Write/edit blog content
- OR work on backlink outreach
- OR create marketing assets

### Friday (15 min)
- Check Google Ads performance
- Adjust budgets if needed (move money to winning campaigns)
- Pause underperforming keywords if any

---

## Monthly Review (1 Hour)

**Track These Metrics:**

| Metric | Month 1 | Month 2 | Month 3 | Goal |
|--------|---------|---------|---------|------|
| Organic Impressions | Baseline | +15% | +30% | +50% |
| Organic Clicks | Baseline | +20% | +40% | +60% |
| Google Ads Cost/Sale | $? | <$50 | <$40 | <$30 |
| Blog Posts Published | 0 | 4 | 8 | 12 |
| Backlinks Acquired | 0 | 3 | 8 | 15 |
| Total Sales | ? | +10% | +25% | +50% |

---

## Budget Allocation Recommendation

**Monthly Budget: $1,800 (based on your $60/day Google Ads)**

| Channel | Budget | Expected Return |
|---------|--------|-----------------|
| Google Ads | $1,500 (83%) | Direct sales, high intent |
| Content/Blog | $200 (11%) | Long-term organic traffic |
| Tools | $100 (6%) | Ghost, Canva Pro, etc. |

**Adjust Based on Performance:**
- If Google Ads CPA > $60: Reduce budget, fix targeting
- If Google Ads CPA < $40: Increase budget on winning campaigns
- If organic growing fast: Invest more in content

---

## Google Ads Deep Dive

### Campaign Structure (Current)
You have 6 campaigns with $10/day each:
1. VIC Selective Entry
2. NSW Selective Entry
3. Year 5 NAPLAN
4. Year 7 NAPLAN
5. ACER Scholarship
6. EduTest Scholarship

### If Impressions Are Low, Check:

**1. Keyword Match Types**
- Exact match [keyword]: Very limited reach
- Phrase match "keyword": Moderate reach
- Broad match keyword: Maximum reach

**Recommendation:** Use broad match for most keywords to start, then refine.

**2. Geographic Targeting**
- Too narrow (specific suburbs) = low volume
- Recommended: Target entire states (NSW, VIC) or major cities (Sydney, Melbourne, Brisbane)

**3. Bid Strategy**
- If using Target CPA: Try $50-60 to start
- If using Manual CPC: Bid $3-5 per click
- Education keywords are competitive

**4. Ad Schedule**
- Running 24/7? Good.
- Limited hours? Might miss searches.

**5. Device Targeting**
- Most parents search on mobile
- Ensure mobile bids aren't reduced

### Negative Keywords (Add These)
```
free
torrent
download
crack
answers
cheat
pdf
reddit
```

---

## Testing Calendar 2026

| Product | Test Date | Peak Campaign Period |
|---------|-----------|---------------------|
| ACER Scholarship | Feb 22, 2026 | Oct 2025 - Jan 2026 |
| EduTest Scholarship | Feb-Mar 2026 | Oct 2025 - Jan 2026 |
| Year 5 NAPLAN | Mar 11-23, 2026 | Dec 2025 - Feb 2026 |
| Year 7 NAPLAN | Mar 11-23, 2026 | Dec 2025 - Feb 2026 |
| NSW Selective | May 1-3, 2026 | Sept 2025 - Apr 2026 |
| VIC Selective | June 2026 | Dec 2025 - May 2026 |

**Budget Strategy:**
- Increase spend 8-12 weeks before each test date
- Decrease spend after test date passes
- Focus on scholarship tests NOW (Feb tests approaching)

---

## Quick Reference: Your IDs

- **Google Ads ID:** AW-11082636289
- **GA4 Measurement ID:** G-XXXXXXXXXX (get from GA4 dashboard)
- **Website:** educourse.com.au
- **Stripe:** Already integrated for payments

---

## What Success Looks Like

### Month 1 (December 2025)
- Google Ads getting impressions and clicks
- GA4 tracking all conversions
- First blog post published
- 5+ backlinks from directories

### Month 3 (February 2026)
- 8-12 blog posts published
- Ranking for 10+ keywords
- Google Ads CPA under $50
- Organic traffic +30%

### Month 6 (May 2026)
- 20+ blog posts
- 20+ quality backlinks
- Multiple top-10 rankings
- Organic traffic +50-60%
- Google Ads profitable and scaling

---

## Immediate Next Steps (This Week)

1. **TODAY:** Diagnose Google Ads low impressions issue
2. **TODAY:** Verify GA4 is tracking properly
3. **THIS WEEK:** Create 7 OG images
4. **THIS WEEK:** Decide on blog platform (Ghost recommended)
5. **NEXT WEEK:** Set up blog and write first post

---

## Resources

**Google Ads Support:** 1800 572 078 (Australia) - Free help
**Google Search Console:** search.google.com/search-console
**Google Analytics:** analytics.google.com
**PageSpeed Test:** pagespeed.web.dev
**Schema Validator:** search.google.com/test/rich-results
**Facebook Debugger:** developers.facebook.com/tools/debug

---

## Questions?

**"My Google Ads still aren't working"**
- Call Google Ads support (free) - they'll review your account
- Or share your campaign dashboard with Claude for analysis

**"Should I hire an agency?"**
- Not yet. Fix the basics first. If still struggling after 2 months, consider it.

**"How much time will this take?"**
- Setup week: 5-8 hours
- Ongoing: 2-3 hours/week

**"When will I see results?"**
- Google Ads: Should see impressions within 24-48 hours of fixes
- SEO/Blog: 2-3 months for meaningful traffic
- Revenue impact: Month 2-3 for noticeable improvement
