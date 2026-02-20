# Google Ads Optimization Guide - January 2, 2026

## 🎯 Your Questions Answered

### Q1: Should I switch from Maximize Clicks to Maximize Conversions?

**Answer: YES - Switch to Maximize Conversions NOW**

Your campaigns have finished learning with Maximize Clicks, which means:
- ✅ You have enough conversion data (at least 15-30 conversions in 30 days recommended)
- ✅ Enhanced conversion tracking is now fixed and working
- ✅ Google's algorithm has baseline performance data

**Why Switch Now:**
- **Maximize Clicks** optimizes for clicks (not purchases) → You're getting irrelevant traffic
- **Maximize Conversions** optimizes for actual purchases → Google will find high-intent users
- With enhanced conversions working, Google can better attribute conversions to clicks
- Your Cost Per Click (CPC) will likely increase, but Cost Per Acquisition (CPA) should decrease

**Expected Results After Switch:**
- ❌ Lower click volume (this is GOOD - less waste)
- ✅ Higher conversion rate (more qualified traffic)
- ✅ Better ROAS (Return on Ad Spend)
- ✅ Fewer irrelevant search terms automatically

---

### Q2: Should Ads Link to Product Pages or Homepage?

**Answer: ALWAYS Link to Specific Product Pages**

**Your Current URL Structure:**
```
Homepage: https://educourse.com.au/
Product Pages: https://educourse.com.au/course/:slug

Available product pages:
- /course/year-5-naplan
- /course/year-7-naplan
- /course/edutest-scholarship
- /course/acer-scholarship
- /course/nsw-selective
- /course/vic-selective
```

**Why Product Pages Win:**

1. **Higher Conversion Rate** (3-5x better than homepage)
   - User sees exactly what they searched for
   - No navigation required to find the right product
   - Message match = trust = conversion

2. **Better Quality Score**
   - Google rewards relevant landing pages
   - Lower cost per click
   - Better ad positions

3. **Faster Purchase Decision**
   - One-click checkout from product page
   - No confusion about which test to choose

**Example Mapping:**

| Campaign | Search Query | Landing Page |
|----------|--------------|--------------|
| VIC Selective | "vic selective practice test" | `/course/vic-selective` |
| Year 5 NAPLAN | "year 5 naplan preparation" | `/course/year-5-naplan` |
| ACER Scholarship | "acer scholarship test prep" | `/course/acer-scholarship` |

**❌ WRONG:**
```
All campaigns → https://educourse.com.au/ (homepage)
```

**✅ CORRECT:**
```
VIC Selective campaign → https://educourse.com.au/course/vic-selective
NSW Selective campaign → https://educourse.com.au/course/nsw-selective
ACER campaign → https://educourse.com.au/course/acer-scholarship
```

---

### Q3: How to Fix Irrelevant Search Terms?

**Answer: Add Negative Keywords + Use Exact/Phrase Match**

Your irrelevant search terms are caused by two issues:
1. **Broad match keywords** - Google shows ads for loosely related searches
2. **No negative keywords** - You're not blocking bad searches

**SOLUTION: 3-Step Process**

#### **Step 1: Add Negative Keywords (Do This TODAY)**

**Universal Negative Keywords (Add to ALL campaigns):**
```
free
jobs
career
teaching
books
pdf
download
sample
example
template
login
login portal
teacher resources
curriculum
lesson plans
salary
degree
university
course outline
syllabus
```

**Product-Specific Negative Keywords:**

For VIC Selective campaign, add:
```
nsw
naplan
year 5
year 7
edutest
acer
western australia
wa
queensland
qld
```

For NAPLAN campaigns, add:
```
selective
scholarship
vic
nsw
year 9
year 10
edutest
acer
```

#### **Step 2: Change Match Types (From Broad to Phrase/Exact)**

**Current (Broad Match):**
```
vic selective test
```
→ Shows for: "vic high school test", "victoria teaching test", "selective breeding test"

**Better (Phrase Match):**
```
"vic selective test"
```
→ Shows for: "vic selective test prep", "best vic selective test"
→ Doesn't show for: "victoria teaching test"

**Best (Exact Match):**
```
[vic selective test]
```
→ Shows ONLY for: "vic selective test"

**Recommended Mix:**
- 70% Phrase Match - Good balance of reach + relevance
- 30% Exact Match - Highest intent, lowest waste

#### **Step 3: Review Search Terms Weekly**

**Where to Find Search Terms in Google Ads:**
1. Click on Campaign → Keywords → Search Terms
2. Look for irrelevant terms getting clicks
3. Add them as negative keywords

**Red Flags (Add as Negatives):**
- ❌ Generic education terms ("teaching methods", "curriculum")
- ❌ Free seekers ("free practice test")
- ❌ Wrong location ("nsw" in VIC campaign)
- ❌ Wrong age group ("year 5" in Year 7 campaign)
- ❌ Career/job seekers ("selective school teacher jobs")

---

## 🚀 ACTION PLAN: What to Do RIGHT NOW

### Immediate Actions (Next 30 Minutes)

#### **Task 1: Update All Ad Final URLs to Product Pages**

**For Each Campaign:**

1. Go to Google Ads → Campaigns
2. Click on campaign name (e.g., "VIC Selective Entry")
3. Go to "Ads" tab
4. Click the pencil icon to edit each ad
5. Update "Final URL" field:

**VIC Selective Campaign:**
```
Old: https://educourse.com.au/
New: https://educourse.com.au/course/vic-selective
```

**NSW Selective Campaign:**
```
Old: https://educourse.com.au/
New: https://educourse.com.au/course/nsw-selective
```

**Year 5 NAPLAN Campaign:**
```
Old: https://educourse.com.au/
New: https://educourse.com.au/course/year-5-naplan
```

**Year 7 NAPLAN Campaign:**
```
Old: https://educourse.com.au/
New: https://educourse.com.au/course/year-7-naplan
```

**EduTest Scholarship Campaign:**
```
Old: https://educourse.com.au/
New: https://educourse.com.au/course/edutest-scholarship
```

**ACER Scholarship Campaign:**
```
Old: https://educourse.com.au/
New: https://educourse.com.au/course/acer-scholarship
```

6. Click "Save"
7. Repeat for ALL ads in ALL campaigns

**⚠️ IMPORTANT:** Make sure to update:
- All text ads
- All responsive search ads
- Display ad final URLs (if you have display campaigns)

#### **Task 2: Add Negative Keywords**

1. Go to Google Ads → Campaigns
2. Click "Keywords" in left sidebar
3. Click "Negative keywords" tab
4. Click the blue "+" button
5. Select "Add negative keywords to: Campaign" or "Account"

**Option A: Campaign Level** (Recommended)
- Add product-specific negatives to each campaign
- More control, but more work

**Option B: Account Level** (Faster)
- Add universal negatives once for all campaigns
- Paste this list:
```
free
jobs
career
teaching
teacher
books
pdf
download
sample
login
salary
degree
university
curriculum
lesson plans
resources
```

6. Choose match type: **Phrase match** (recommended)
7. Click "Save"

#### **Task 3: Switch to Maximize Conversions**

1. Go to Google Ads → Campaigns
2. Click on campaign name
3. Click "Settings" in left sidebar
4. Scroll to "Bidding" section
5. Click "Change bid strategy"
6. Select "Maximize conversions"
7. **IMPORTANT:** Set a Target CPA (optional but recommended)
   - Start with: $50-100 AUD (if your current CPA is around $199/conversion rate)
   - Google will try to get conversions at or below this cost
8. Click "Save"
9. Repeat for ALL 6 campaigns

**Expected Learning Period:**
- 1-2 weeks for Google to optimize
- Don't make changes during this period
- Monitor daily but don't panic if performance dips initially

---

## 📊 How to Monitor Performance

### Key Metrics to Track (Weekly)

**Before Optimization (Maximize Clicks to Homepage):**
```
Clicks: 500
Conversions: 5
Conversion Rate: 1%
Cost per Click: $2
Cost per Conversion: $200
```

**After Optimization (Maximize Conversions to Product Pages):**
```
Clicks: 300 (↓40% - GOOD, less waste)
Conversions: 12 (↑140% - EXCELLENT)
Conversion Rate: 4% (↑300%)
Cost per Click: $3 (↑50% - expected)
Cost per Conversion: $75 (↓62.5% - GREAT)
```

### Red Flags to Watch For

**Week 1-2 (Learning Period):**
- ⚠️ CPC might increase 20-50% (normal)
- ⚠️ Click volume might drop 30-50% (normal)
- ⚠️ Impressions might decrease (normal)

**Week 3+ (Should Stabilize):**
- ✅ Conversion rate should be 2-5% (vs 0.5-1% before)
- ✅ Cost per conversion should decrease
- ✅ ROAS should improve
- ❌ If conversions drop significantly, revert to Maximize Clicks

---

## 🎓 Advanced Optimizations (After 2-4 Weeks)

### 1. Add Conversion Value Optimization

Once Maximize Conversions is working:
- Switch to "Maximize Conversion Value"
- Assign values to different products if some are more profitable
- Google will prioritize higher-value conversions

### 2. Create Separate Campaigns for Different Match Types

**Structure:**
```
Campaign 1: VIC Selective - Exact Match
Campaign 2: VIC Selective - Phrase Match
Campaign 3: VIC Selective - Broad Match (with many negatives)
```

**Benefits:**
- Better budget control
- Different bid strategies per match type
- Easier performance analysis

### 3. Add Audience Targeting

**In-Market Audiences to Target:**
- Education Services
- Parenting Resources
- Test Preparation

**Custom Audiences:**
- Website visitors (remarketing)
- Similar to converters (lookalike)

### 4. Implement Ad Extensions

**Sitelink Extensions:**
- "See Sample Questions"
- "View Pricing"
- "How It Works"
- "Parent Testimonials"

**Callout Extensions:**
- "500+ Practice Questions"
- "$199 One-Time Payment"
- "Expert-Designed Tests"
- "Detailed Performance Analytics"

**Structured Snippets:**
- Test Types: NAPLAN, Selective Entry, Scholarships
- Features: Diagnostic Tests, Targeted Drills, Practice Exams

---

## 📋 Weekly Checklist

**Every Monday Morning:**
- [ ] Review Search Terms report
- [ ] Add 5-10 new negative keywords
- [ ] Check conversion tracking is firing
- [ ] Review top performing ads
- [ ] Pause ads with <1% CTR

**Every Wednesday:**
- [ ] Check budget pacing (are you running out of budget?)
- [ ] Review Quality Scores (aim for 7+)
- [ ] Test new ad copy variations

**Every Friday:**
- [ ] Weekly performance summary
- [ ] Calculate ROAS (Revenue / Ad Spend)
- [ ] Plan next week's tests

---

## 🚨 Common Mistakes to Avoid

### ❌ DON'T:
1. **Change too many things at once** - You won't know what worked
2. **Make changes during learning period** - Let Google optimize
3. **Use only broad match keywords** - Too much wasted spend
4. **Ignore search terms report** - Gold mine for negatives
5. **Send all traffic to homepage** - Lower conversion rate
6. **Use same ad copy for all products** - Not specific enough
7. **Set and forget campaigns** - Weekly optimization required

### ✅ DO:
1. **One change per week** - Isolate impact
2. **Wait 2 weeks after bid strategy change** - Let it learn
3. **Use phrase + exact match primarily** - Better targeting
4. **Review search terms weekly** - Find new opportunities
5. **Send to specific product pages** - Higher conversion rate
6. **Customize ad copy per product** - Better message match
7. **Review and optimize weekly** - Continuous improvement

---

## 💰 Expected Budget Recommendations

**Current Situation:**
- 6 campaigns running simultaneously
- Moderate budget spread across all

**Optimized Budget Allocation:**

Based on your purchase data, prioritize:
1. **VIC Selective Entry** - 30% of budget (highest volume)
2. **EduTest Scholarship** - 25% of budget
3. **ACER Scholarship** - 20% of budget
4. **Year 7 NAPLAN** - 15% of budget
5. **NSW Selective** - 7% of budget
6. **Year 5 NAPLAN** - 3% of budget

**Daily Budget Recommendations:**

If total daily budget is $100:
```
VIC Selective: $30/day
EduTest: $25/day
ACER: $20/day
Year 7 NAPLAN: $15/day
NSW Selective: $7/day
Year 5 NAPLAN: $3/day
```

---

## 📞 Need Help?

**Google Ads Support:**
- Call Google Ads support: 1300 720 571 (Australia)
- They can help implement these changes
- Free optimization recommendations

**Resources:**
- [Google Ads Negative Keywords Guide](https://support.google.com/google-ads/answer/2453972)
- [Maximize Conversions Bidding](https://support.google.com/google-ads/answer/7381968)
- [Landing Page Experience](https://support.google.com/google-ads/answer/2404197)

---

## 📝 Summary

**Top 3 Priorities (Do Today):**

1. ✅ **Update all ad final URLs to product pages** (30 min)
   - `/course/vic-selective` instead of `/`
   - Immediate 2-3x conversion rate boost expected

2. ✅ **Add negative keywords** (15 min)
   - Block "free", "jobs", "teaching", etc.
   - Reduce wasted spend by 30-50%

3. ✅ **Switch to Maximize Conversions** (10 min)
   - Optimize for purchases, not clicks
   - Better ROI within 2-4 weeks

**Expected Results in 30 Days:**
- 📈 Conversion Rate: 1% → 3-5%
- 📉 Cost per Conversion: $200 → $75-100
- 📊 ROAS: Improve by 100-200%
- 🎯 Relevance: 50% fewer irrelevant clicks

---

**Last Updated:** January 2, 2026
**Next Review:** January 9, 2026 (check Maximize Conversions learning progress)
