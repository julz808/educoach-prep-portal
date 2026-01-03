# 🎓 **Ghost Blog Setup Guide for EduCourse**

---

## 📚 **ELI5: What is Ghost and How Does It Work?**

### **Think of Ghost like a separate "blog apartment" next to your main "house"**

**Your current setup:**
- **Main house (educourse.com.au):** Your React app with product pages, dashboard, learning platform
- **Built with:** React, Vite, hosted on Vercel
- **Does:** Student learning, purchases, user accounts

**Ghost setup:**
- **Blog apartment (blog.educourse.com.au):** Separate platform ONLY for blog posts
- **Built with:** Ghost (they host it for you)
- **Does:** Blog posts, SEO content, nothing else

### **How they work together:**

```
┌─────────────────────────────────────────────────────┐
│           educourse.com.au (Main Site)              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Product  │  │Dashboard │  │ Learning │          │
│  │  Pages   │  │          │  │ Platform │          │
│  └──────────┘  └──────────┘  └──────────┘          │
└─────────────────────────────────────────────────────┘
                        │
                        │ Links to blog
                        ↓
┌─────────────────────────────────────────────────────┐
│        blog.educourse.com.au (Ghost Blog)           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Blog     │  │ Blog     │  │ Blog     │          │
│  │ Post 1   │  │ Post 2   │  │ Post 3   │          │
│  └──────────┘  └──────────┘  └──────────┘          │
│                                                     │
│  Each post links back to relevant product pages    │
└─────────────────────────────────────────────────────┘
```

### **Example User Journey:**

1. **Parent searches Google:** "ACER scholarship test 2026"
2. **Finds your blog post:** blog.educourse.com.au/acer-scholarship-test-2026-guide
3. **Reads helpful guide** (2,000 words of valuable info)
4. **Clicks CTA in post:** "Start preparing with EduCourse ACER course"
5. **Goes to main site:** educourse.com.au/products/acer-scholarship
6. **Purchases:** $199

**Ghost's job:** Attract visitors from Google
**Your main site's job:** Convert visitors to customers

---

## 🤔 **Why Ghost Instead of Building Blog in Your React App?**

### **Option A: Build Blog in Your React App** ❌

**Pros:**
- Everything in one place
- Same design/branding

**Cons:**
- Takes 10-20 hours to build blog system
- Takes 2-3 hours to write each post (manual HTML/React components)
- Hard to optimize for SEO
- Need to rebuild/redeploy for each post
- No built-in SEO features

---

### **Option B: Use Ghost** ✅

**Pros:**
- **Ready in 30 minutes** (sign up, point subdomain, done)
- **Write posts in 5-10 mins** with Gemini + easy editor
- **Built-in SEO** (auto-generates sitemaps, meta tags, schema)
- **No coding required** to publish
- **Just works** - Ghost handles hosting, updates, security

**Cons:**
- Costs $9/month (but saves you 15-20 hours of dev time)
- Separate platform to manage

**Math:**
- Your time value: $50-100/hour
- Time saved: 15-20 hours
- **Value:** $750-2,000 saved
- **Cost:** $9/month = $108/year
- **ROI:** Worth it!

---

## 🏗️ **Architecture: How Everything Connects**

### **Current Architecture:**

```
User → educourse.com.au → Vercel → React App → Supabase (data)
                                   ↓
                              Stripe (payments)
```

### **After Adding Ghost:**

```
Google Search
    ↓
    ↓ (60-70% of blog traffic comes from search)
    ↓
blog.educourse.com.au (Ghost hosted)
    ↓
    ↓ (User reads blog post)
    ↓
    ↓ (Clicks "Start Preparing" CTA)
    ↓
educourse.com.au/products/acer-scholarship
    ↓
Stripe Checkout → Purchase Success
```

**Key points:**
- Ghost is **completely separate** from your React app
- Ghost is **hosted by Ghost** (you don't host it on Vercel)
- Your React app and Ghost just **link to each other**
- No integration code needed - just hyperlinks!

---

## 📝 **Step-by-Step Setup Guide**

---

### **STEP 1: Sign Up for Ghost (5 minutes)**

**1.1 Go to Ghost:**
- Visit: https://ghost.org/pricing/
- Click **"Start Publishing"** or **"Try Ghost"**

**1.2 Choose Plan:**
- Select **"Starter"** plan ($9/month)
- This includes:
  - Hosting for your blog
  - Up to 500 members (newsletter subscribers)
  - Unlimited posts
  - SEO features
  - Support

**1.3 Create Account:**
- Enter email: `learning@educourse.com.au` (or your email)
- Create password
- Choose a site name: **"EduCourse Blog"**
- Choose a URL (temporary): `educourse-blog.ghost.io` (we'll change this later)

**1.4 Complete Payment:**
- Enter card details
- Confirm $9/month subscription
- Click **"Start Publishing"**

✅ **You now have a Ghost blog!**

---

### **STEP 2: Access Your Ghost Admin (2 minutes)**

**2.1 You'll receive an email:**
- Subject: "Welcome to Ghost"
- Click the link to access your admin panel

**2.2 Your Ghost Admin URL:**
- **Format:** `https://educourse-blog.ghost.io/ghost/`
- **Bookmark this** - this is where you'll write/publish posts

**2.3 Initial Setup Wizard:**
- Ghost will ask you a few questions:
  - **Site title:** "EduCourse Blog"
  - **Site description:** "Expert test preparation insights for Australian families"
  - **Language:** English
  - **Timezone:** Australia/Sydney (or your timezone)

✅ **Your Ghost admin is ready!**

---

### **STEP 3: Point Your Subdomain to Ghost (10-15 minutes)**

Now we need to make your blog accessible at `blog.educourse.com.au` instead of the temporary `educourse-blog.ghost.io` URL.

**3.1 In Ghost Admin:**
- Go to **Settings** (⚙️ icon in left sidebar)
- Click **"General"**
- Scroll to **"Publication info"**
- Click **"Set up a custom domain"** or similar

**3.2 Ghost will show you DNS instructions:**

You need to add these DNS records (Ghost will give you the exact values):

```
Type: CNAME
Name: blog
Value: [ghost-provided-value].ghost.io
TTL: 3600 (or Auto)
```

**3.3 Add DNS Records in Your Domain Provider:**

**Where is educourse.com.au hosted?** (Namecheap, GoDaddy, Cloudflare, etc.?)

**Generic DNS Steps:**
1. Log into your domain registrar (where you bought educourse.com.au)
2. Go to DNS settings or DNS management
3. Click **"Add Record"**
4. Select **"CNAME"** as record type
5. **Name/Host:** `blog`
6. **Value/Points to:** `[value Ghost gives you].ghost.io`
7. **TTL:** 3600 or Automatic
8. **Save**

**3.4 Verify in Ghost:**
- Go back to Ghost Settings → General
- Ghost will automatically check if DNS is configured
- Status should change from "Pending" to "Active"
- This can take **5-60 minutes** depending on DNS propagation

**3.5 Update Ghost URL:**
- Once DNS is verified, Ghost will ask you to confirm the new URL
- Click **"Update URL"** or similar
- Your Ghost blog is now at: **blog.educourse.com.au** ✅

---

### **STEP 4: Choose and Customize a Theme (10 minutes)**

**4.1 Go to Settings → Design:**
- Ghost comes with a default theme called **"Casper"**
- It's clean, modern, and works well

**4.2 Customize Brand Colors:**
- In **Design** settings, find **"Brand"** section
- **Accent color:** Set to `#4ECDC4` (your teal)
- **Site description:** "Expert test preparation guides for NAPLAN, Selective Entry, and Scholarship exams"

**4.3 Upload Site Logo (Optional for now):**
- If you have a logo, upload it here
- If not, skip - you can add later

**4.4 Navigation Setup:**
- Go to **Settings → Navigation**
- Set up main menu:

**Primary Navigation:**
```
Home          →  https://educourse.com.au
Products      →  https://educourse.com.au/#products
Blog          →  https://blog.educourse.com.au
```

**This creates links in your Ghost blog header that point back to your main site.**

**4.5 Save Changes**

✅ **Your blog now has EduCourse branding!**

---

### **STEP 5: Configure SEO Settings (5 minutes)**

**5.1 Go to Settings → General:**

**Meta Data:**
- **Meta title:** "EduCourse Blog - Test Preparation Insights for Australian Families"
- **Meta description:** "Expert guides for NAPLAN, Selective Entry, ACER & EduTest scholarship exams. Trusted by 1000+ Australian families."

**5.2 Go to Settings → Code Injection:**

**Add Google Analytics / Google Ads Tag (if you want blog traffic tracked):**

In the **"Site Header"** section, paste:

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-11082636289"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'AW-11082636289');
</script>
```

This tracks blog visitors in your Google Analytics/Ads.

**5.3 Save**

✅ **SEO and tracking configured!**

---

### **STEP 6: Create Your First Test Post (5 minutes)**

Let's publish a test post to make sure everything works.

**6.1 In Ghost Admin:**
- Click **"Posts"** in left sidebar
- Click **"New Post"** button

**6.2 Write a Simple Test Post:**

**Title:** "Test Post - ACER Scholarship Guide 2026"

**Content:**
```markdown
This is a test blog post to verify Ghost is working correctly.

## What is the ACER Test?

The ACER scholarship test is used by many Australian private schools for entrance and scholarship decisions.

**Key points:**
- Test date: February 2026
- Covers: Reasoning, Mathematics, English
- Duration: 2-3 hours

[Start preparing with EduCourse ACER Course](https://educourse.com.au/products/acer-scholarship)
```

**6.3 Configure Post Settings:**
- Click **"Settings"** icon (⚙️) in top right of editor
- **URL slug:** `acer-scholarship-test-2026-guide`
- **Excerpt:** "Everything you need to know about the ACER scholarship test for 2026"
- **Tags:** Add tag "ACER" and "Scholarship"

**6.4 Publish:**
- Click **"Publish"** button (top right)
- Click **"Publish"** again to confirm
- Click **"View Post"** to see it live

**6.5 Verify:**
- Your post should now be live at: `blog.educourse.com.au/acer-scholarship-test-2026-guide`
- Check that the link to your main site works

✅ **Your first blog post is live!**

---

### **STEP 7: Connect Ghost to Your Main Site (5 minutes)**

Now add a link from your main site to your Ghost blog.

**7.1 Update Navigation in Your React App:**

Find your navigation component (probably in `src/components/` or similar).

Add a "Blog" or "Insights" link:

```jsx
<nav>
  <a href="/">Home</a>
  <a href="/#products">Products</a>
  <a href="https://blog.educourse.com.au">Blog</a>  {/* NEW */}
  <a href="/login">Login</a>
</nav>
```

**7.2 Deploy:**
```bash
git add .
git commit -m "feat: add blog link to navigation"
git push origin main
```

**7.3 Verify:**
- Visit educourse.com.au
- Click "Blog" in navigation
- Should take you to blog.educourse.com.au

✅ **Main site and blog are connected!**

---

## 🔄 **Your New Blog Publishing Workflow**

### **Weekly Routine (30-60 mins total):**

**Monday Morning:**

**1. Generate Content with Gemini (10 mins):**
- Use your Gemini Gem
- Input: Target keyword (e.g., "ACER test preparation tips")
- Output: Full 2,000-word blog post
- Copy the output

**2. Paste into Ghost (2 mins):**
- Go to Ghost Admin → New Post
- Paste Gemini content
- Gemini output is usually Markdown format - Ghost handles this perfectly

**3. Configure Post Settings (3 mins):**
- **Title:** Make sure it's SEO-optimized
- **URL slug:** Clean, keyword-rich (e.g., `acer-test-preparation-tips-2026`)
- **Excerpt:** 150-160 character summary
- **Tags:** Add relevant tags (ACER, Scholarship, Test Prep)
- **Featured image:** Upload if you have one (optional for now)

**4. Add Internal Links (2 mins):**
- Find 2-3 places in the post to link to your product pages
- Example: "Start preparing with [EduCourse ACER Course](https://educourse.com.au/products/acer-scholarship)"

**5. Add CTAs (2 mins):**
- Add call-to-action boxes at:
  - After introduction
  - Middle of post
  - End of post
- Example:

```markdown
---
**Ready to start preparing?**

EduCourse's ACER Scholarship package includes 500+ practice questions, detailed analytics, and full-length practice tests.

[Explore ACER Preparation →](https://educourse.com.au/products/acer-scholarship)
---
```

**6. Preview and Publish (2 mins):**
- Click **"Preview"** to see how it looks
- Make any quick edits
- Click **"Publish"**
- Choose: **"Publish now"** or **"Schedule"** for later in the week

**Total time: ~20 mins per post**

**Repeat 6x for 6 posts = ~2 hours/week**

---

## 📊 **How Google Finds Your Blog Posts**

### **Ghost Handles This Automatically:**

**1. Sitemap Generation:**
- Ghost automatically creates: `blog.educourse.com.au/sitemap.xml`
- Updates every time you publish a post
- Google crawls this to find new content

**2. Submit to Google Search Console:**

After your first 5-10 posts are published:

- Go to https://search.google.com/search-console
- Click **"Add Property"**
- Enter: `blog.educourse.com.au`
- Verify ownership (Ghost has instructions for this)
- Submit sitemap: `blog.educourse.com.au/sitemap.xml`

**3. Google Indexes Your Posts:**
- Usually within 1-7 days of publishing
- You can manually request indexing in Search Console

**4. Posts Start Ranking:**
- Month 1-2: Google discovers and indexes
- Month 2-3: Posts start ranking for long-tail keywords (page 2-5)
- Month 3-6: Some posts reach page 1 for less competitive keywords
- Month 6+: Multiple posts on page 1, traffic growing

---

## 🔗 **Internal Linking Strategy**

### **Every Blog Post Should Link To:**

**1. Your Relevant Product Page (2-3 times):**
```markdown
If you're preparing for the ACER test, our comprehensive
[ACER Scholarship preparation package](https://educourse.com.au/products/acer-scholarship)
includes everything you need to succeed.
```

**2. Related Blog Posts (1-2 times):**
```markdown
Read our guide on [EduTest vs ACER: Which Test is Right for Your Child?](https://blog.educourse.com.au/edutest-vs-acer-comparison)
```

**3. Homepage (if relevant):**
```markdown
[EduCourse](https://educourse.com.au) offers expert test preparation for all major Australian entrance exams.
```

**Why this matters:**
- Helps SEO (internal linking signals)
- Keeps visitors on your site longer
- Guides visitors toward purchase

---

## 📈 **Measuring Success**

### **Week 1 After Setup:**
- ✅ Ghost blog live at blog.educourse.com.au
- ✅ 6 posts published
- ✅ Google has discovered your sitemap
- Traffic: 0-10 visitors (mostly direct, testing)

### **Week 4 (1 month):**
- ✅ 24 posts published
- ✅ Google has indexed most posts
- ✅ Posts showing in Search Console (impressions, not clicks yet)
- Traffic: 50-200 visitors/month

### **Month 3:**
- ✅ 36+ posts published
- ✅ Some posts ranking on page 1-2 for long-tail keywords
- Traffic: 500-2,000 visitors/month
- Conversions: 5-20 from organic

### **Month 6:**
- ✅ 48+ posts published
- ✅ Multiple posts ranking on page 1
- Traffic: 2,000-5,000 visitors/month
- Conversions: 20-50 from organic
- **Revenue: $4,000-10,000 from organic traffic**

---

## 💰 **Cost Breakdown**

### **Ghost:**
- **$9/month** = $108/year
- Includes hosting, SSL, updates, support

### **Time Investment:**
- **Setup:** 1-2 hours (one-time)
- **Weekly:** 1-2 hours (generating + publishing 6 posts)
- **Monthly:** 4-8 hours total

### **ROI Calculation:**

**Investment:**
- Month 1-6: $54 (Ghost fees)
- Time: ~30 hours @ $50/hour = $1,500 opportunity cost
- **Total investment:** ~$1,550

**Return (by Month 6):**
- Organic traffic: 2,000-5,000 visitors/month
- Conversions: 20-50 sales/month
- Revenue: $4,000-10,000/month
- **Monthly profit: $3,500-9,500**

**ROI: 225-600% by Month 6** ✅

---

## ❓ **Common Questions**

### **Q: Do I need to style Ghost to match my main site?**
**A:** Not critical. Ghost themes are professional by default. You can customize colors (already did in setup) and that's good enough. Perfect design matching is <5% ROI boost.

### **Q: Can I import posts from Ghost to my React app later?**
**A:** Yes, Ghost has an export feature and a Content API. But you probably won't want to - Ghost works great as-is.

### **Q: What if Ghost shuts down or I want to leave?**
**A:** Ghost is open-source. You can export all your content and self-host or move to another platform. Your content is never locked in.

### **Q: Can I use my Gemini Gem output directly in Ghost?**
**A:** Yes! Gemini outputs Markdown, Ghost accepts Markdown. Just paste and publish.

### **Q: Do I need to worry about Ghost security/updates?**
**A:** No. Ghost Pro (the $9/month plan) handles all of this automatically.

### **Q: Can I add a newsletter/email capture to Ghost?**
**A:** Yes! Ghost has built-in email/newsletter features. You can add email signup forms to posts. But focus on blog posts first, newsletter later.

---

## 🚀 **Next Steps**

**Today:**
1. ✅ Sign up for Ghost ($9/month)
2. ✅ Point blog.educourse.com.au to Ghost
3. ✅ Customize basic branding (colors, navigation)
4. ✅ Publish 1 test post to verify everything works

**This Week:**
5. ✅ Generate 6 blog posts with Gemini
6. ✅ Publish them to Ghost (1 per day or all at once)
7. ✅ Add blog link to your main site navigation

**Next Week:**
8. ✅ Generate 6 more posts
9. ✅ Submit blog.educourse.com.au to Google Search Console
10. ✅ Check Search Console for indexing status

---

## 🎯 **Quick Start Checklist**

```
[ ] Sign up for Ghost at ghost.org
[ ] Choose Starter plan ($9/month)
[ ] Set site name: "EduCourse Blog"
[ ] Access Ghost Admin panel
[ ] Add DNS CNAME record: blog → [ghost-value].ghost.io
[ ] Wait for DNS to propagate (5-60 mins)
[ ] Verify blog.educourse.com.au works
[ ] Customize brand color to #4ECDC4 (teal)
[ ] Set up navigation linking back to main site
[ ] Add Google Analytics tag in Code Injection
[ ] Publish 1 test post
[ ] Verify post is live at blog.educourse.com.au/test-post
[ ] Add "Blog" link to main site navigation
[ ] Generate 6 posts with Gemini Gem
[ ] Publish posts to Ghost
[ ] Submit sitemap to Google Search Console
```

---

## 🆘 **Need Help?**

**If you get stuck:**

1. **DNS not working?**
   - Tell me your domain registrar (Namecheap, GoDaddy, etc.)
   - I'll give you exact DNS instructions

2. **Ghost admin access issues?**
   - Check your email for the welcome email from Ghost
   - Click the setup link

3. **Not sure how to publish with Gemini?**
   - I'll walk you through the exact workflow

4. **Want me to review your first post before publishing?**
   - Paste the Gemini output and I'll optimize it

---

**Ready to start? Sign up for Ghost and let me know when you've got the admin panel open!** 🚀
