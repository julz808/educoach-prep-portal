# EduCourse SEO - Quick Start Guide

**Date:** November 4, 2025
**Your Next Steps:** Read this first, then check SEO_AUDIT_REPORT.md for details

---

## 🎯 Where We Are Right Now

### The Good News 👍
- Your SEO foundation is **75% built**
- Redirects, sitemap, robots.txt all working
- Metadata system is well-designed
- Google Analytics tracking

### The Bad News 👎
- **Build is broken** - One missing dependency blocking everything
- No blog yet
- Images are huge and unoptimized (20MB)
- Google Search Console not set up
- Per-page SEO not working in production

### The Great News 🎉
**All fixable in 1 week!** Once we fix the build error, everything else falls into place quickly.

---

## 📊 Current SEO Health: 5.5/10

**Why so low?**
- Build error preventing SEO deployment (-2 points)
- No blog content (-1 point)
- Images killing page speed (-1 point)
- No Search Console monitoring (-0.5 points)

**After fixes:** Should jump to 8/10 within 2 weeks

---

## 🔴 CRITICAL: Do These First (2 Hours Total)

### What I Need You To Do (Julian) - 1 Hour

#### 1. Set Up Google Search Console (30 min)
**Why:** This is how you see if SEO is working. Without it, you're blind.

**Steps:**
1. Go to: https://search.google.com/search-console
2. Click "Add Property"
3. Enter: `educourse.com.au`
4. Choose "HTML tag" verification method
5. Copy the meta tag that looks like:
   ```html
   <meta name="google-site-verification" content="abc123xyz..." />
   ```
6. Send it to me (Claude) - I'll add it to your site
7. Click "Verify" in Search Console
8. Once verified, click "Sitemaps" in sidebar
9. Add: `https://educourse.com.au/sitemap.xml`
10. Click "Submit"

**Result:** Google will start showing you search performance data within 24-48 hours

---

#### 2. Check What's Actually Ranking (15 min)
Open Google and search:
- `site:educourse.com.au` - See what Google has indexed
- `"educourse"` - See if you show up for your brand
- `"naplan preparation"` - See if you rank (probably not yet)

Take screenshots - we'll compare in 30 days.

---

#### 3. Test Your Page Speed (15 min)
1. Go to: https://pagespeed.web.dev/
2. Test: `https://educourse.com.au`
3. Test: `https://educourse.com.au/course/vic-selective-entry`
4. Take note of scores and red/yellow warnings
5. We'll compare after image optimization

**Expected:** Probably 60-80 on mobile due to large images

---

### What I'll Do (Claude) - 2 Hours

#### 1. Fix The Build Error (30 min)
- Install `react-helmet-async`
- Configure the HelmetProvider
- Test and deploy
- Verify all product pages have unique meta tags

#### 2. Verify SEO is Working (30 min)
- Check all 7 pages in production
- Test meta tags with Facebook debugger
- Verify canonical URLs
- Confirm Open Graph tags

#### 3. Quick Wins (1 hour)
- Add schema markup to product pages
- Set up HelmetProvider correctly
- Deploy and test

---

## 🟡 HIGH PRIORITY: Week 1 Tasks

### Your Tasks (Julian) - 3 Hours This Week

#### 1. Create OG Images (1.5 hours)
**What:** Social sharing images (1200x630px)
**Tool:** Canva.com (free account works)

**Images needed:**
1. `/images/og-home.png` - Homepage
2. `/images/og-vic-selective.png` - VIC Selective
3. `/images/og-nsw-selective.png` - NSW Selective
4. `/images/og-acer.png` - ACER
5. `/images/og-edutest.png` - EduTest
6. `/images/og-year5-naplan.png` - Year 5 NAPLAN
7. `/images/og-year7-naplan.png` - Year 7 NAPLAN

**Design tip:**
- Use your brand colors (teal #4ECDC4, coral #FF6B6B)
- Include test name prominently
- Add "EduCourse" branding
- Keep text minimal but impactful

---

#### 2. Write Your First Blog Post (1.5 hours)
**Topic idea:** "Complete Guide to NSW Selective Entry Test 2025"

**Target length:** 1,200-1,500 words

**Must include:**
- What the test covers
- Key dates for 2025
- How to prepare (mention your product!)
- Common mistakes to avoid
- Internal link to your NSW Selective product page

**SEO checklist:**
- [ ] "NSW selective entry" in title
- [ ] "NSW selective entry" in first paragraph
- [ ] 2-3 internal links to your products
- [ ] 1-2 external links to official sources (NSW Education)
- [ ] Subheadings with related keywords

Don't overthink it - publish is better than perfect!

---

### My Tasks (Claude) - 6 Hours This Week

#### 1. Image Optimization (1.5 hours)
- Convert all PNGs to WebP (60-80% smaller)
- Compress remaining images
- Implement lazy loading
- Add width/height to prevent layout shift

**Expected result:** 20MB → 4-6MB (70% reduction)

---

#### 2. Enhanced Schema Markup (1.5 hours)
Add to each product page:
- Course schema (price, name, description)
- FAQ schema (from existing FAQs)
- Review schema (from testimonials)
- BreadcrumbList schema

**Result:** Rich snippets in Google (star ratings, prices, FAQs)

---

#### 3. Blog Setup (3 hours)
- Set up Sanity.io CMS
- Create `/blog` listing page
- Create `/blog/:slug` detail page
- Add RSS feed
- Integrate with sitemap

**Result:** Ready to publish your first post!

---

## 📈 What to Expect (Timeline)

### Week 1 (After Critical Fixes)
- ✅ Build working
- ✅ Per-page SEO deployed
- ✅ Search Console set up
- ✅ Images optimized
- **Result:** +10% traffic from faster loading

### Week 2-3 (After Blog Launch)
- ✅ First blog post live
- ✅ Schema markup showing in search
- ✅ Search Console data coming in
- **Result:** +15-20% traffic from long-tail keywords

### Month 2 (Content Building)
- ✅ 4-8 blog posts published
- ✅ Starting to rank for target keywords
- ✅ Getting backlinks from guest posts
- **Result:** +30-40% traffic

### Month 3 (Momentum)
- ✅ Ranking top 10 for 10-15 keywords
- ✅ 20-30 quality backlinks
- ✅ Consistent content publishing
- **Result:** +40-60% traffic, 3-5% conversion rate

---

## 🎯 Target Keywords (Not Ranking Yet)

These are your money keywords. After fixes, you should start ranking for these within 30-60 days:

| Keyword | Monthly Searches | Difficulty | Priority |
|---------|-----------------|------------|----------|
| naplan preparation | 1,900 | Medium | HIGH |
| nsw selective entry | 2,400 | Medium | HIGH |
| vic selective entry | 1,600 | Medium | HIGH |
| selective entry test prep | 880 | Low | HIGH |
| edutest practice | 720 | Low | MEDIUM |
| acer scholarship test | 590 | Low | MEDIUM |
| year 5 naplan practice | 1,200 | Medium | MEDIUM |
| year 7 naplan practice | 980 | Medium | MEDIUM |

**Total monthly opportunity:** ~10,000 searches
**Estimated traffic if you rank top 5:** 1,000-2,000 visitors/month
**At 3-5% conversion:** 30-100 customers/month = $6,000-$20,000/month

---

## 💰 Budget Required

### This Month: $0
Everything can be done with free tools:
- ✅ Google Search Console (free)
- ✅ Google Analytics (free)
- ✅ Canva (free tier)
- ✅ TinyPNG (free image compression)
- ✅ Sanity.io (free tier - 3 users, 100k documents)

### Optional Tools (Later)
- Ahrefs ($99/mo) - Better keyword research, backlink monitoring
- Canva Pro ($15/mo) - More templates, remove watermarks
- Grammarly Premium ($12/mo) - Better blog writing

**My recommendation:** Stay free for first 2-3 months, add paid tools only if budget allows after you're seeing ROI

---

## 📊 How to Track Success

### Weekly (Every Monday Morning - 15 min)
1. Open Google Search Console
2. Check last 7 days:
   - Total impressions
   - Total clicks
   - Average CTR
   - Average position
3. Note any crawl errors
4. Check which pages are performing best

### Monthly (First Monday - 30 min)
1. Compare to previous month:
   - Traffic up or down?
   - New keywords ranking?
   - Top performing pages?
2. Check Google Analytics:
   - Organic traffic trend
   - Bounce rate
   - Conversion rate
3. Review backlinks (if using Ahrefs)

### Keep a Simple Spreadsheet
| Month | Organic Traffic | Top Rankings | Conversions | Revenue |
|-------|----------------|--------------|-------------|---------|
| Nov 2025 | [baseline] | 0 | [baseline] | [baseline] |
| Dec 2025 | +15%? | 5? | +10%? | +10%? |
| Jan 2026 | +30%? | 10? | +20%? | +20%? |

---

## 🚫 What NOT to Do (Common Mistakes)

### Don't:
❌ Buy backlinks (Google will penalize)
❌ Keyword stuff (sounds unnatural, Google hates it)
❌ Copy competitor content (plagiarism, no value)
❌ Obsess over rankings daily (takes time, check weekly)
❌ Ignore mobile users (50%+ of your traffic)
❌ Create thin content (<500 words)
❌ Use black hat SEO tactics
❌ Expect instant results (SEO takes 2-3 months)

### Do:
✅ Write for humans first, search engines second
✅ Focus on helpful, valuable content
✅ Build backlinks through relationships
✅ Be patient and consistent
✅ Track and measure everything
✅ Iterate based on data
✅ Keep learning and improving

---

## 📚 Quick Resources

### Tools You'll Use
- **Google Search Console:** https://search.google.com/search-console
- **Google Analytics:** https://analytics.google.com
- **PageSpeed Insights:** https://pagespeed.web.dev
- **Canva:** https://canva.com (for OG images)
- **TinyPNG:** https://tinypng.com (compress images)
- **Facebook Debugger:** https://developers.facebook.com/tools/debug (test OG tags)

### Learning Resources (If You Want to Go Deeper)
- **Google SEO Guide:** https://developers.google.com/search/docs/beginner/seo-starter-guide
- **Moz Beginner's Guide:** https://moz.com/beginners-guide-to-seo
- **Backlinko Blog:** https://backlinko.com/blog (SEO tactics)

### Australian-Specific
- **NSW Selective Schools:** education.nsw.gov.au (link from your content)
- **VIC Selective Entry:** education.vic.gov.au (link from your content)
- **ACARA (NAPLAN):** nap.edu.au (official NAPLAN info)

---

## ❓ FAQ - Quick Answers

### "How long until I see results?"
- **Week 1:** Technical improvements (faster site, better structure)
- **Week 2-4:** Google starts indexing blog posts
- **Month 2-3:** Start seeing ranking improvements and traffic increases
- **Month 3+:** Sustained growth and momentum

### "What's the single most important thing to do?"
**Fix the build error first.** Everything else depends on it.

### "Should I hire an SEO agency?"
Not yet. You have 75% of the work done already. Fix the critical issues first, then reassess in 3 months. If you're seeing good growth, keep doing it yourself. If you're stuck, then consider outside help.

### "Do I need to buy tools like Ahrefs?"
No. Start with free tools (Search Console, GA4). Add paid tools only if:
1. You have budget
2. You're seeing ROI from SEO
3. You want deeper competitor analysis

### "How much time will this take weekly?"
- **Week 1 (setup):** 3-4 hours (one-time)
- **Weeks 2-4:** 2-3 hours/week (blog writing + monitoring)
- **Ongoing:** 2 hours/week (1 blog post + monitoring)

### "What if I don't have time to write blog posts?"
Option 1: Write shorter posts (800 words instead of 1,500)
Option 2: Post less frequently (2x/month instead of weekly)
Option 3: Hire a content writer later ($50-100 per post)

Start with what you can manage consistently. Better to publish 1 good post per month than 4 rushed posts.

---

## 🎬 Ready to Start?

### Your Immediate Next Steps:

1. **Read SEO_AUDIT_REPORT.md** (20 min)
   - Full technical audit
   - Detailed findings
   - Complete recommendations

2. **Set Up Google Search Console** (30 min)
   - Follow steps above
   - Send me verification meta tag

3. **Approve Critical Fixes** (5 min)
   - Reply "Yes, fix the build error and optimize images"
   - I'll get started immediately

4. **Plan Your Week** (15 min)
   - Block 1.5 hours for OG images
   - Block 1.5 hours for first blog post
   - Schedule weekly SEO check-ins (15 min Mondays)

---

## 📞 Questions?

**For Implementation:** Work with Claude (me!)
**For Strategy:** Review SEO_Strategy.md
**For Details:** Check SEO_AUDIT_REPORT.md
**For Official Help:** Google Search Central help docs

---

**Last Updated:** November 4, 2025
**Next Review:** After critical fixes deployed

---

**Bottom Line:** You're closer than you think. One dependency fix + image optimization + blog setup = SEO unlocked. Let's do this! 🚀
