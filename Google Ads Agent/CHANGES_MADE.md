# Google Ads Agent — Change Log

---

## April 29, 2026 — Conversion Tracking Overhaul + URL/Budget/Keyword Cleanup

### Context

Monthly audit revealed Google Ads conversion data was **wildly inconsistent with Stripe truth**:
- 13 Google Ads "conversions" vs **9 actual Stripe purchases** (44% over-count)
- EduTest: 4.7 Google conversions vs **0 Stripe purchases** (the worst offender)
- Year 5 NAPLAN: 0 Google conversions vs **1 Stripe purchase** (under-attribution)

Root cause: `PurchaseSuccess.tsx` fired the `gtag` Purchase Success conversion **on any URL hit containing `?product=`**, with no payment verification and no deduplication. `transaction_id` used `Date.now()` so refresh = new conversion.

### What Changed

#### 1. Conversion Tracking — Server-side Verification (CRITICAL FIX)

**Files:**
- `src/services/stripeService.ts` — appended `&session_id={CHECKOUT_SESSION_ID}` to Stripe `success_url`
- `supabase/functions/verify-checkout-session/index.ts` — **new Edge Function** that calls `stripe.checkout.sessions.retrieve()` and only returns `verified: true` for `payment_status === 'paid'`
- `src/pages/PurchaseSuccess.tsx` — rewritten conversion firing:
  - Skips fire if no `session_id` in URL (catches direct hits, bookmarks, auth-callback returns)
  - Skips fire if `localStorage` already recorded this session (catches refresh, back button)
  - Calls `verify-checkout-session` to confirm payment server-side
  - Uses Stripe `session_id` as `transaction_id` for native Google Ads dedup
  - Uses real `amount` from Stripe (not hardcoded $199) and real `customer_email` from `session.customer_details`

**Supersedes** the January 2, 2026 fix in `docs/10-marketing/conversion/ENHANCED_CONVERSION_FIX.md` which only added enhanced-conversion email data but didn't fix the over-firing root cause.

#### 2. Ad URLs — Product-Specific Landing Pages

All 22 ads were either:
- Pointing to `https://learning.educoach.com.au` (typo'd domain that doesn't exist — 4 paused/disapproved)
- Pointing to generic `https://educourse.com.au/` homepage (18 enabled)

Replaced all 22 with campaign-specific course pages:
| Campaign | New URL |
|---|---|
| VIC Selective Entry | `/course/vic-selective` |
| NSW Selective Entry | `/course/nsw-selective` |
| Year 5 NAPLAN | `/course/year-5-naplan` |
| Year 7 NAPLAN | `/course/year-7-naplan` |
| ACER Scholarship | `/course/acer-scholarship` |
| EduTest Scholarship | `/course/edutest-scholarship` |

Script: `scripts/fix-broken-ad-urls.ts` (4 broken) + `scripts/upgrade-ad-urls-to-product-pages.ts` (18 generic). Pattern: create new ENABLED ad with same headlines/descriptions but correct URL, then `REMOVE` the old ad.

#### 3. Daily Budgets — Aligned to `weekly_budget_allocation` Calendar

The Monday 6 AM AEST GitHub Action that runs `Google Ads Agent/scripts/v2/budget-executor.ts` had stopped firing — budgets had drifted significantly from the calendar. Manually re-aligned to Week 17 (2026-04-27) targets:

| Campaign | Phase | Old | New | Δ |
|---|---|---|---|---|
| VIC Selective | PEAK | $22.01 | $22.07 | +$0.06 |
| EduTest Scholarship | EARLY_AWARENESS | $18.28 | $6.11 | -$12.17 |
| NSW Selective | CONSIDERATION | $10.16 | $8.49 | -$1.67 |
| ACER Scholarship | BASELINE | $4.40 | $3.31 | -$1.09 |
| Year 5 NAPLAN | POST_TEST | $8.46 | $0.85 | -$7.61 |
| Year 7 NAPLAN | POST_TEST | $8.46 | $0.85 | -$7.61 |
| **TOTAL** | — | **$71.77** | **$41.68** | **-$30.09/day** |

**Savings: $903/month ($10,800/year).** Script: `scripts/align-budgets-to-calendar.ts`.

**Outstanding:** investigate why GitHub Actions cron stopped (likely failing secrets / expired token / disabled workflow).

#### 4. Stripe-Validated Winning Keywords (+4 EXACT)

Added 4 search terms that converted in last 30 days but weren't yet keywords:
- `melbourne high school entrance exam practice` → NSW Selective ($1.50 CAC)
- `selective past papers` → Year 7 NAPLAN ($1.33 CAC)
- `selective school practice test` → VIC Selective ($16.16 CAC)
- `victoria selective school test papers` → VIC Selective ($3.98 CAC)

Script: `scripts/add-stripe-winning-keywords.ts`.

#### 5. Tier 1 Negative Keywords (+34)

**Campaign-specific (4):** `edutest` PHRASE → Year 7 NAPLAN; `hscassociate` BROAD → NSW Selective; `higher ability selection test hast` PHRASE → VIC Selective; `edutest practice tests free year 8 pdf` EXACT → EduTest.

**Universal across all 6 campaigns (5 × 6 = 30):** `cheat`, `reddit`, `youtube`, `torrent`, `crack` — all BROAD.

**Note:** owner explicitly chose NOT to negate `free`, `pdf`, `answers`, `download`, `solutions`, `solved` — testing whether bargain-hunter intent can convert. Re-evaluate end of May.

Total negatives in account: 285 → 319. Script: `scripts/add-tier1-negatives.ts`.

#### 6. Account Hygiene

- **Purchase Success counting:** changed from `MANY_PER_CLICK` → `ONE_PER_CLICK` (belt-and-braces with code-level dedup).
- **Search Partners network:** confirmed already disabled on all 6 campaigns.
- **Sign-up demotion:** API blocked (`include_in_conversions_metric` is immutable). Functionally moot since all campaigns use Campaign-specific Purchases goal — Sign-up is purely cosmetic in account-default reporting.

Script: `scripts/apply-account-hygiene-fixes.ts`.

### Watch Period (next 30 days, baseline → target)

| Metric | Last 30d (broken) | Target by May 28 |
|---|---|---|
| Account ROAS | 0.90x | >1.0x |
| Avg CAC | $222 | <$199 |
| EduTest sales | 0 | ≥1 (or pause) |
| NSW Selective sales | 0 | ≥1 (test in May) |
| VIC Selective ROAS | 1.79x | hold or improve |
| Stripe ↔ Google conv match | wildly off | within 10% |

### Tier 2 Negatives — Held for Re-evaluation

13 search terms that look genuinely relevant but didn't convert in the broken-tracking period. Don't negate yet — re-evaluate when 30 days of clean data is available. List in `google-ads-audit_2026-03-30_2026-04-29.txt`.

### Scripts Added Today

All in `Google Ads Agent/scripts/`:
- `find-bad-urls.ts` — scans all ads/sitelinks/campaign-level URL settings for typo'd domains
- `fix-broken-ad-urls.ts` — repairs ads with broken URLs by recreating with correct campaign-specific URLs
- `upgrade-ad-urls-to-product-pages.ts` — upgrades any ad whose URL doesn't match its campaign's product page
- `verify-all-ad-urls.ts` — read-only audit to confirm every ad's URL matches its campaign
- `align-budgets-to-calendar.ts` — manual run of what `v2/budget-executor.ts` should do automatically (use this if cron is broken)
- `add-stripe-winning-keywords.ts` — adds Stripe-validated keywords (template — edit `NEW_KEYWORDS` for next batch)
- `add-tier1-negatives.ts` — adds campaign-specific + universal negative keywords
- `apply-account-hygiene-fixes.ts` — Search Partners, conversion-action count type, Sign-up demotion attempt
- `check-conversion-actions.ts` — lists all conversion actions and per-campaign breakdown of which actions fire
- `generate-monthly-audit-report.ts` — generates the txt audit report from `google_ads_audit_data.json`

---

## March 28, 2026

## ✅ All Optimizations Complete!

---

## 1. ✅ Added New Negative Keywords

**Added to all 6 campaigns:**
- "entrance exam quiz" [PHRASE] - Was wasting $48.05, 94 clicks, 0 conversions
- "hscassociate" [PHRASE] - Was wasting $20.15, 3 clicks, 0 conversions (competitor)
- "spectrum tuition" [PHRASE] - Was wasting $14.51, 3 clicks, 0 conversions (competitor)

**Total waste prevented:** ~$83/month

**Note:** Did NOT add "acer scholarship test" as negative (per your request - you're bullish on it converting)

---

## 2. ✅ Added Proven Converting Keywords

**Added to ACER Scholarship campaign (EXACT match):**
- "acer scholarship examination" @ $5.00 bid
  - Historical performance: 16.67% conversion rate, $4.31 CAC
- "acer year 7 practice test" @ $2.00 bid
  - Historical performance: 100% conversion rate, $0.94 CAC

**Added to Year 5 NAPLAN campaign (EXACT match):**
- "excel naplan year 5" @ $3.00 bid
  - Historical performance: 50% conversion rate, $2.24 CAC
  - (Already existed, increased bid from $2.24 to $3.00)

**Expected impact:** +3-5 conversions/month at low CAC

---

## 3. ✅ Increased "educourse" Brand Term Bids

**Updated across all campaigns from $0.56-$6.71 to $12.00**

| Campaign | Old Bid | New Bid | Increase |
|----------|---------|---------|----------|
| Year 5 NAPLAN | $1.40 | $12.00 | +757% |
| Year 7 NAPLAN | $0.56 | $12.00 | +2043% |
| EduTest Scholarship | $6.71 | $12.00 | +79% |

**Why:** "educourse" converting at $5.56 CAC vs $122.63 average (22x better!)

**Expected impact:**
- Higher impression share on brand searches
- More clicks from high-intent users
- Maintain low CAC (even at $12 bid, still profitable)
- +2-4 conversions/month

---

## 4. ✅ Telegram Bot Setup (Ready to Deploy)

**Created:**
- `scripts/v2/telegram-notifier.ts` - Telegram notification service
- `scripts/test-telegram.ts` - Test connection script
- `TELEGRAM_SETUP_GUIDE.md` - Complete setup instructions

**Updated:**
- `scripts/v2/index-weekly-v2.ts` - Now uses Telegram (was stubbed before)

**What you need to do:**

### Step 1: Create Telegram Bot (5 minutes)

1. Open Telegram, search for `@BotFather`
2. Send `/newbot`
3. Choose name: "EduCourse Google Ads Agent"
4. Choose username: "educourse_ads_bot" (must end in "bot")
5. Copy the bot token (looks like: `1234567890:ABCdef...`)

### Step 2: Get Your Chat ID (2 minutes)

1. Start a chat with your new bot (click the link BotFather gives you)
2. Send any message to your bot
3. Open this URL in browser (replace YOUR_BOT_TOKEN):
   ```
   https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates
   ```
4. Copy your `chat_id` from the JSON response (looks like: `123456789`)

### Step 3: Add to .env (1 minute)

Add these lines to your `.env` file:
```bash
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

### Step 4: Install Telegram Library (1 minute)

```bash
npm install node-telegram-bot-api
npm install --save-dev @types/node-telegram-bot-api
```

### Step 5: Test It! (1 minute)

```bash
npx tsx "Google Ads Agent/scripts/test-telegram.ts"
```

You should receive a message: "✅ Telegram bot connected successfully!"

**That's it!** The bot is now ready to send weekly reports.

---

## 📊 Summary of Impact

### Waste Reduction:
- **Negative keywords:** ~$83/month saved
- **Total saved:** ~$996/year

### New Opportunities:
- **Proven keywords added:** 3 high-converting terms
- **Brand bid increase:** "educourse" now competitive
- **Expected additional conversions:** +5-9/month
- **At $5.56 CAC:** Additional spend of ~$28-50/month for high-quality leads

### Net Impact:
- **Saved:** $83/month on waste
- **Invested:** $28-50/month on proven winners
- **Net improvement:** +$33-55/month savings + better quality leads

---

## 🤖 Bot Status

### Currently:
- ⏳ **Code ready** but NOT running automatically yet
- ⏳ **Telegram not configured** (waiting for you to set up bot token/chat ID)

### Once you complete Telegram setup:
- ✅ Bot will be fully functional
- ✅ Can test with: `npx tsx "Google Ads Agent/scripts/v2/index-weekly-v2.ts"`
- ✅ Can deploy to cron job for Monday 6 AM automation

### What the bot will do (when deployed):
**Every Monday 6 AM:**
1. Collect last week's Google Ads data
2. Auto-update budgets from `weekly_budget_allocation` table (NO approval needed)
3. AI analyzes and generates 3-5 tactical recommendations
4. Sends formatted report to your Telegram

**You will:**
- Receive report on your phone 📱
- Review 3-5 tactical suggestions (5-10 minutes)
- Approve/reject good ideas (future: interactive buttons)

---

## 📝 Files Created/Modified

### New Files:
1. `scripts/add-new-negatives.ts` - Script to add negative keywords
2. `scripts/add-winning-keywords.ts` - Script to add proven keywords
3. `scripts/increase-educourse-bid.ts` - Script to increase brand bids
4. `scripts/analyze-search-terms.ts` - Search term performance analysis
5. `scripts/check-budget-allocation.ts` - Check weekly budget table status
6. `scripts/v2/telegram-notifier.ts` - Telegram notification service
7. `scripts/test-telegram.ts` - Test Telegram connection
8. `TELEGRAM_SETUP_GUIDE.md` - Complete setup guide
9. `ANSWERS_TO_YOUR_QUESTIONS.md` - Data analysis and answers
10. `CHANGES_MADE.md` - This file

### Modified Files:
1. `scripts/v2/index-weekly-v2.ts` - Now uses Telegram (removed stub function)

---

## 🎯 Next Steps

### Immediate (You):
1. **Set up Telegram bot** (10 minutes total)
   - Follow `TELEGRAM_SETUP_GUIDE.md`
   - Create bot with BotFather
   - Get chat ID
   - Add to .env
   - Install library
   - Test connection

### After Telegram Setup:
2. **Test full agent:** `npx tsx "Google Ads Agent/scripts/v2/index-weekly-v2.ts"`
3. **Verify you receive Telegram message with formatted report**
4. **Deploy to cron job** (instructions in TELEGRAM_SETUP_GUIDE.md)

### Monitor:
- Check Google Ads next week to see impact of:
  - New negative keywords blocking waste
  - New proven keywords getting impressions
  - "educourse" brand term getting more clicks
- Review search terms report for new opportunities
- Verify budgets match `weekly_budget_allocation` table

---

## 🎉 What You Now Have

✅ **18 approved ads** running with correct URL
✅ **3 new negative keywords** blocking $83/month waste
✅ **3 new proven keywords** targeting high-converters
✅ **Brand term optimized** ("educourse" @ $12 bid)
✅ **Match type segmentation** (EXACT/PHRASE/BROAD ad groups)
✅ **32-84 negative keywords** per campaign
✅ **Weekly budget allocation table** ready and up-to-date
✅ **Google Ads Agent V2** code complete and ready to deploy
✅ **Telegram integration** ready (just needs your bot token)

**You're in great shape!** 🚀

Once you set up Telegram (10 min), the bot will be fully operational and you'll get automated weekly reports on your phone.
