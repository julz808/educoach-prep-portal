# Google Ads Monthly Audit & Deep-Dive

## Overview

Run this **comprehensive audit on the 1st Monday of each month** (or after accumulating 30+ conversions).

This goes deeper than the weekly automation to identify strategic opportunities, wasteful spend, and optimization potential across all campaigns.

**Time Required:** 60-90 minutes
**When to Run:** 1st Monday of every month
**Data Window:** Last 30-90 days (depending on volume)

---

## Pre-Audit Checklist

Before starting, ensure you have:
- [ ] At least 30 conversions in the review period (for statistical significance)
- [ ] No major changes made in last 2 weeks (let data stabilize)
- [ ] Access to Google Ads account
- [ ] Access to Supabase database
- [ ] Terminal access to run scripts

---

## The 7-Step Monthly Audit

### Step 1: Overall Performance Health Check (10 min)

**Goal:** Understand high-level account health

**Run:**
```bash
npx tsx "Google Ads Agent/scripts/agents/google-ads/audit-comprehensive.ts"
```

**What to Review:**

1. **Account-Level Metrics** (Last 30 days)
   - Total spend vs. budget
   - Total conversions
   - Average cost per conversion (CAC)
   - Overall CTR (should be > 3%)
   - Overall conversion rate (should be > 2%)

2. **Red Flags to Watch:**
   - ❌ CAC > $150 (your historical average is $122)
   - ❌ CTR < 2% (indicates poor ad relevance)
   - ❌ Conversion rate < 1% (landing page or targeting issue)
   - ❌ Spend significantly over/under budget (>20% variance)

3. **Campaign-Level Health:**
   - Which campaigns are driving conversions?
   - Which campaigns are wasting budget?
   - Are any campaigns showing warning signs?

**Document:**
```
Total Spend: $______
Total Conversions: ______
Average CAC: $______
Best Performing Campaign: ____________
Worst Performing Campaign: ____________
```

---

### Step 2: Search Terms Analysis (15 min)

**Goal:** Identify wasteful searches and winning searches

**Run:**
```bash
npx tsx "Google Ads Agent/scripts/analyze-search-terms.ts"
```

**What to Review:**

1. **Top Wasters** (Spend > $20, 0 conversions)
   - Add these as negative keywords
   - Look for patterns (competitor names, job searches, free resources)

2. **Hidden Winners** (Conversions but not yet targeted)
   - Add these as exact match keywords
   - Increase bids to capture more volume

3. **Category Analysis:**
   - Tutor/tutoring searches: Converting or wasting?
   - Free/PDF searches: Any diamonds in the rough?
   - Competitor names: Should we block or bid?
   - Generic terms: Worth the cost?

**Actions to Take:**

**Add Negative Keywords** (Phrase Match):
```bash
# Edit this file with your findings:
Google Ads Agent/scripts/add-new-negatives.ts

# Then run:
npx tsx "Google Ads Agent/scripts/add-new-negatives.ts"
```

**Add Winning Keywords** (Exact Match):
```bash
# Edit this file with your findings:
Google Ads Agent/scripts/add-winning-keywords.ts

# Then run:
npx tsx "Google Ads Agent/scripts/add-winning-keywords.ts"
```

**Document:**
```
Top 3 Wasters:
1. "____________" - $____ spent, 0 conv → Add as negative
2. "____________" - $____ spent, 0 conv → Add as negative
3. "____________" - $____ spent, 0 conv → Add as negative

Top 3 Winners:
1. "____________" - $____ CAC, ___% conv rate → Add as keyword
2. "____________" - $____ CAC, ___% conv rate → Add as keyword
3. "____________" - $____ CAC, ___% conv rate → Add as keyword
```

---

### Step 3: Keyword Performance Review (10 min)

**Goal:** Optimize bids and pause underperformers

**Manual Check in Google Ads:**
1. Go to Campaigns → Keywords
2. Date range: Last 30 days
3. Sort by: Cost (descending)

**For Each Top 10 Keywords by Spend:**

| Keyword | Impressions | CTR | Conversions | CAC | Action |
|---------|-------------|-----|-------------|-----|--------|
| _______ | __________ | ___% | __________ | $___ | ______ |

**Decision Rules:**

**Pause if:**
- Spend > $50 AND conversions = 0 AND impressions > 500
- Quality Score < 3 (check in Google Ads interface)
- CTR < 1% with > 1000 impressions

**Increase Bid (+20%) if:**
- CAC < $80 (well below average)
- Conversion rate > 5%
- Impression share < 50% (losing to competitors)

**Decrease Bid (-20%) if:**
- CAC > $150 (above average)
- CTR < 2%
- Spending budget quickly with poor performance

**Document:**
```
Keywords to Pause: ____________, ____________
Keywords to Increase Bid: ____________, ____________
Keywords to Decrease Bid: ____________, ____________
```

---

### Step 4: Ad Copy Performance (10 min)

**Goal:** Pause weak ads, identify winning messages

**Manual Check in Google Ads:**
1. Go to Campaigns → Ads
2. Date range: Last 30 days
3. Add columns: Impressions, CTR, Conversions, Cost/conv

**For Responsive Search Ads:**

Google auto-optimizes, but you can still:
1. **Check ad strength** (should be "Excellent" or "Good")
2. **Review asset performance**:
   - Go to Ad → View asset details
   - Look for "Low" performing headlines/descriptions
   - Replace low performers with new variations

**Decision Rules:**

**Pause Ad if:**
- Impressions > 3000 AND CTR < 2%
- Impressions > 5000 AND conversions = 0
- Ad strength = "Poor"

**Create New Ad if:**
- All current ads have similar messaging (no variety)
- CTR across all ads < 3%
- New product features/offers to promote

**Winning Message Analysis:**
- What headlines have "Best" or "Good" performance?
- What pain points resonate? (practice tests, exam prep, selective entry)
- What CTAs work? (free trial, instant access, proven results)

**Document:**
```
Ads to Pause: ____________
Best Performing Headlines: ____________, ____________
Best Performing Descriptions: ____________
New Ad Ideas: ____________
```

---

### Step 5: Quality Score & Landing Page (10 min)

**Goal:** Improve ad relevance and user experience

**Manual Check in Google Ads:**
1. Go to Keywords
2. Add column: Quality Score
3. Add columns: Expected CTR, Ad Relevance, Landing Page Experience

**Quality Score Breakdown:**

| Component | Status | How to Fix |
|-----------|--------|------------|
| Expected CTR | Low/Average/Above Avg | Improve ad copy, add emotional hooks |
| Ad Relevance | Low/Average/Above Avg | Match ad text to keyword closely |
| Landing Page Exp | Low/Average/Above Avg | Improve page speed, relevance, mobile |

**Actions by Quality Score:**

**QS 1-3 (Poor):**
- Pause keyword OR
- Create dedicated ad group with highly relevant ad

**QS 4-6 (Average):**
- Review which component is low
- Improve that specific element

**QS 7-10 (Good):**
- Keep optimizing, you're paying less per click!

**Landing Page Check:**
1. Mobile speed test: https://pagespeed.web.dev/
   - Should score > 50 on mobile
2. Do keywords appear on landing page?
3. Is CTA clear and prominent?
4. Does page match ad promise?

**Document:**
```
Average Quality Score: ____/10
Keywords with QS < 5: ____________, ____________
Landing Page Mobile Score: ____/100
Landing Page Issues: ____________
```

---

### Step 6: Demographic & Geographic Insights (10 min)

**Goal:** Identify high-converting audiences and locations

**Manual Check in Google Ads:**

**Geographic Performance:**
1. Go to Campaigns → Locations
2. Date range: Last 30 days
3. Sort by conversions

**Questions:**
- Which states/cities drive most conversions?
- Are there locations with high spend but 0 conversions? (consider excluding)
- Should you adjust bids by location? (+20% for top converters)

**Demographic Performance:**
1. Go to Campaigns → Demographics
2. Check: Age, Gender, Household Income

**Questions:**
- Is there a clear age group that converts better?
- Any demographics with high spend, low conversions? (consider excluding)
- Any surprising insights? (e.g., parents vs. students searching)

**Device Performance:**
1. Go to Campaigns → Devices
2. Compare: Mobile, Desktop, Tablet

**Questions:**
- Is mobile conversion rate significantly lower? (landing page issue)
- Should you adjust bids by device?

**Document:**
```
Top 3 Converting Locations: ____________, ____________, ____________
Locations to Exclude: ____________
Best Converting Age Group: ____________
Device with Best Conv Rate: ____________
Bid Adjustments Needed: ____________
```

---

### Step 7: Competitive & Market Analysis (15 min)

**Goal:** Understand competitive landscape and market shifts

**Auction Insights (Google Ads):**
1. Go to Campaigns → Auction Insights
2. Date range: Last 30 days

**Review:**
- Who are your top competitors?
- What's your impression share vs. theirs?
- Are you losing to budget or rank?
- Any new competitors appearing?

**Search Trends (Google Trends):**
1. Go to: https://trends.google.com/trends/
2. Search: "selective entry test", "NAPLAN preparation", "scholarship exam"

**Questions:**
- Is search volume trending up or down?
- Any seasonal patterns to note?
- Regional differences in interest?

**Competitive Intelligence:**

Do manual searches for your top keywords:
- "VIC selective entry test"
- "NAPLAN practice test year 5"
- "ACER scholarship test"

**Questions:**
- Who's advertising? (competitors)
- What's their messaging? (pain points, offers)
- What's their landing page like? (better or worse than yours?)
- Any new players in market?

**Document:**
```
Top 3 Competitors: ____________, ____________, ____________
Your Impression Share: ____%
Lost IS (Budget): ____%
Lost IS (Rank): ____%
Market Trends: ____________
Competitive Advantages You Have: ____________
Competitive Gaps to Address: ____________
```

---

## Post-Audit Actions

### Immediate Changes (Do Now)

Based on your audit, make these changes immediately:

**1. Add Negative Keywords:**
```bash
# Edit the list in this file, then run:
npx tsx "Google Ads Agent/scripts/add-new-negatives.ts"
```

**2. Add Winning Keywords:**
```bash
# Edit the list in this file, then run:
npx tsx "Google Ads Agent/scripts/add-winning-keywords.ts"
```

**3. Pause Underperforming Ads:**
- Go to Google Ads UI
- Manually pause ads with >3000 impressions, <2% CTR

**4. Adjust Bids:**
- Increase bids on keywords with CAC < $80
- Decrease bids on keywords with CAC > $150

**5. Update Ad Copy:**
- Replace low-performing headlines/descriptions
- Test new messaging based on competitive research

---

### Strategic Changes (Plan for Next Week)

**1. Landing Page Improvements:**
- Fix mobile speed issues
- Add keywords to page copy
- Improve CTA prominence
- A/B test new layouts

**2. Budget Reallocation:**
- Update `weekly_budget_allocation` table based on performance
- Shift budget from poor performers to winners

**3. New Campaign Ideas:**
- Any new products/keywords to target?
- Any audience segments to test?
- Any new ad formats to try? (video, discovery)

---

### Quarterly Deep-Dive (Every 3 Months)

In addition to monthly audits, run these quarterly:

**1. Conversion Path Analysis:**
- Check Google Analytics
- How many touchpoints before conversion?
- Assisted conversions vs. last-click?

**2. Lifetime Value Analysis:**
- Are customers from certain campaigns worth more?
- Should you adjust target CAC based on LTV?

**3. Market Expansion:**
- New keywords to test?
- New geographic markets?
- New products to promote?

**4. Competitive Refresh:**
- Deep dive into competitor strategies
- New messaging angles to test
- Pricing/offer competitiveness

---

## Audit Template

Use this template to document each monthly audit:

```markdown
# Google Ads Monthly Audit - [Month Year]

**Date:** [Date]
**Review Period:** [Start] to [End]
**Total Conversions:** [Number]

---

## Step 1: Health Check
- Total Spend: $______
- Total Conversions: ______
- Average CAC: $______
- Overall CTR: ____%
- Overall Conv Rate: ____%

**Red Flags:** ____________

---

## Step 2: Search Terms
**Top 3 Wasters:**
1. ____________ ($____)
2. ____________ ($____)
3. ____________ ($____)

**Top 3 Winners:**
1. ____________ (___% conv rate)
2. ____________ (___% conv rate)
3. ____________ (___% conv rate)

**Actions Taken:**
- Added negative keywords: ____________
- Added new keywords: ____________

---

## Step 3: Keywords
**To Pause:** ____________
**Bid Increases:** ____________
**Bid Decreases:** ____________

---

## Step 4: Ad Copy
**To Pause:** ____________
**Best Headlines:** ____________
**New Ideas:** ____________

---

## Step 5: Quality Score
**Avg QS:** ____/10
**Low QS Keywords:** ____________
**Landing Page Score:** ____/100
**LP Issues:** ____________

---

## Step 6: Demographics
**Top Locations:** ____________
**Best Age:** ____________
**Best Device:** ____________
**Bid Adjustments:** ____________

---

## Step 7: Competitive
**Top Competitors:** ____________
**Impression Share:** ____%
**Market Trends:** ____________
**New Opportunities:** ____________

---

## Action Items
- [ ] ____________
- [ ] ____________
- [ ] ____________

---

## Next Month Focus
____________

```

---

## Automation Scripts Reference

Keep these handy for monthly use:

### Analysis Scripts
```bash
# Comprehensive audit
npx tsx "Google Ads Agent/scripts/agents/google-ads/audit-comprehensive.ts"

# Search terms analysis (last 90 days)
npx tsx "Google Ads Agent/scripts/analyze-search-terms.ts"

# Check current budget allocation
npx tsx "Google Ads Agent/scripts/check-budget-allocation.ts"
```

### Action Scripts
```bash
# Add negative keywords
npx tsx "Google Ads Agent/scripts/add-new-negatives.ts"

# Add winning keywords
npx tsx "Google Ads Agent/scripts/add-winning-keywords.ts"

# Update brand bid
npx tsx "Google Ads Agent/scripts/increase-educourse-bid.ts"

# Check for missing ads
npx tsx "Google Ads Agent/scripts/fix-missing-ads.ts"
```

### Test Scripts
```bash
# Test Telegram notifications
npx tsx "Google Ads Agent/scripts/test-telegram.ts"

# Run weekly agent manually
npx tsx "Google Ads Agent/scripts/v2/index-weekly-v2.ts"
```

---

## Best Practices

### Statistical Significance

**Minimum Data Requirements:**
- **30+ conversions** before making keyword decisions
- **3,000+ impressions** before judging ad performance
- **100+ clicks** before evaluating CTR
- **$100+ spend** before pausing keywords

### Change Management

**DON'T change too much at once:**
- ✅ Make 3-5 changes per audit
- ✅ Wait 2 weeks to see impact
- ✅ Document everything
- ❌ Don't change budgets, keywords, AND ads all at once
- ❌ Don't make changes during major test dates

### Testing Cadence

**Weekly:** Budget adjustments (automated)
**Monthly:** Keywords, negatives, bids
**Quarterly:** Ad copy refresh, strategic pivots
**Annually:** Complete account restructure

---

## Benchmarks to Track

Track these over time to measure improvement:

| Metric | Current | Target | Best Ever |
|--------|---------|--------|-----------|
| CAC | $122 | < $100 | $5.56 (brand) |
| CTR | ___% | > 4% | ___% |
| Conv Rate | ___% | > 3% | ___% |
| Quality Score | ___/10 | > 7 | ___/10 |
| Impression Share | ___% | > 60% | ___% |

---

## Monthly Audit Checklist

Print this and check off each month:

**Preparation:**
- [ ] 30+ conversions accumulated
- [ ] No changes in last 2 weeks
- [ ] Terminal/scripts accessible
- [ ] 90 minutes blocked on calendar

**Analysis:**
- [ ] Step 1: Health check completed
- [ ] Step 2: Search terms reviewed
- [ ] Step 3: Keywords analyzed
- [ ] Step 4: Ad copy evaluated
- [ ] Step 5: Quality scores checked
- [ ] Step 6: Demographics reviewed
- [ ] Step 7: Competitive intel gathered

**Actions:**
- [ ] Negative keywords added
- [ ] Winning keywords added
- [ ] Bids adjusted
- [ ] Poor ads paused
- [ ] New ads created (if needed)
- [ ] Budget allocation updated (if needed)

**Documentation:**
- [ ] Audit template filled out
- [ ] Actions documented
- [ ] Next month priorities set
- [ ] Template saved with date

---

## Getting Help

**Stuck on something?**

1. **Check audit logs:** Review previous month's findings
2. **Run scripts again:** Data might have changed
3. **Google Ads support:** They can explain specific metrics
4. **A/B test:** Not sure? Test both approaches for 2 weeks

**Common Issues:**

**"Not enough conversions"**
→ Wait another week, need 30+ for significance

**"All keywords performing poorly"**
→ Landing page issue, not keyword issue

**"CAC increasing month over month"**
→ Competition increasing OR quality score decreasing

**"Spend not hitting budget"**
→ Bids too low OR impression share lost to rank

---

## Success Metrics

You'll know the monthly audits are working when:

✅ CAC trending downward month-over-month
✅ Conversion rate improving
✅ Quality scores increasing
✅ Less wasted spend on irrelevant searches
✅ More conversions from proven keywords
✅ You spend < 90 min on each audit (getting faster)

---

**Happy auditing! 📊**

Schedule this for the 1st Monday of every month and watch your Google Ads performance improve consistently.
