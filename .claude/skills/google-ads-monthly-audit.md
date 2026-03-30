# Google Ads Monthly Audit Skill

**Purpose:** Run comprehensive monthly Google Ads audit following best practices

**When to use:** 1st Monday of every month (or after 30+ conversions accumulated)

---

## What This Skill Does

This skill guides you through a professional 7-step Google Ads audit:

1. **Health Check** - Overall account performance
2. **Search Terms** - Find wasters and winners
3. **Keywords** - Optimize bids, pause poor performers
4. **Ad Copy** - Review performance, identify winning messages
5. **Quality Score** - Improve relevance and landing pages
6. **Demographics** - Audience and geographic insights
7. **Competitive** - Market analysis and competitor intel

**Time:** 60-90 minutes
**Output:** Actionable recommendations with scripts to execute changes

---

## How to Use

Invoke this skill by typing:
```
/google-ads-monthly-audit
```

Or simply say: "Run my monthly Google Ads audit"

---

## What Happens

When you invoke this skill, Claude will:

1. **Run all analysis scripts:**
   - Comprehensive audit
   - Search terms analysis (90 days)
   - Budget allocation check

2. **Guide you through manual checks:**
   - Google Ads UI reviews
   - Quality score analysis
   - Demographic insights
   - Competitive research

3. **Generate recommendations:**
   - Negative keywords to add
   - Winning keywords to add
   - Bid adjustments needed
   - Ads to pause/create
   - Landing page improvements

4. **Prepare action scripts:**
   - Edit add-new-negatives.ts with findings
   - Edit add-winning-keywords.ts with winners
   - Prepare bid adjustment commands

5. **Document everything:**
   - Fill audit template with findings
   - Save dated report
   - Set priorities for next month

---

## Prerequisites

Before running, ensure:
- [ ] At least 30 conversions in last 30 days
- [ ] No major changes in last 2 weeks
- [ ] 90 minutes available
- [ ] Access to Google Ads account
- [ ] Terminal access

---

## Outputs

You'll receive:

1. **Audit Report** - Comprehensive findings document
2. **Action Scripts** - Ready-to-run commands for changes
3. **Next Steps** - Prioritized list of improvements
4. **Benchmark Tracking** - Progress vs. previous months

---

## Follow-Up

After audit completion:

**Immediate (This Week):**
- Add negative keywords (run script)
- Add winning keywords (run script)
- Pause poor ads (manual in Google Ads)
- Adjust bids (manual in Google Ads)

**Strategic (Next Week):**
- Landing page improvements
- Budget reallocation
- New campaign planning

**Track (Next Month):**
- Did CAC improve?
- Did conversion rate increase?
- Did quality scores rise?

---

## Reference Documents

- **Weekly Automation:** `Google Ads Agent/WEEKLY_AUTOMATION.md`
- **Monthly Audit Guide:** `Google Ads Agent/MONTHLY_AUDIT_GUIDE.md`
- **Scripts Directory:** `Google Ads Agent/scripts/`

---

## Success Criteria

Audit is successful when:
- ✅ All 7 steps completed
- ✅ 3-5 actionable changes identified
- ✅ Scripts prepared and ready to run
- ✅ Audit template documented
- ✅ Next month priorities set

---

**Invoke with:** `/google-ads-monthly-audit` or "Run my monthly Google Ads audit"
