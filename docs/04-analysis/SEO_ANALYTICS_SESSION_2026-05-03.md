# SEO + Analytics Session Summary — 2026-05-03

End-to-end record of the SEO/GA4/Search Console audit + remediation work.

---

## TL;DR

| | Before | After |
|---|---|---|
| GA4 Data API access | None | ✅ Working via ADC |
| Search Console API access | None | ✅ Working via ADC |
| Ghost CMS API access | Configured but unused | ✅ Working |
| Google Ads gclid through Stripe | Lost during redirect | ✅ Preserved end-to-end |
| Conversion linker on gtag | Off | ✅ On (cross-subdomain) |
| Ghost blog sitemap in robots.txt | Missing | ✅ Listed |
| Auth email links carrying UTMs | No | ✅ Yes |
| Main sitemap completeness | 8 URLs (incl. /auth) | 14 URLs (no /auth) |
| Ghost drafts | 45 (mostly V2 duplicates) | 0 |

**Headline diagnosis:** the −85% impression cliff on March 17 was caused by **two specific blog posts losing 6 ranking positions each** (`year-5-naplan-writing`, `year-7-naplan-language-conventions`) — most likely a Google algorithm update. Not a site-wide problem.

---

## What was diagnosed

### 1. GSC impression cliff (-85% on Mar 17)
- Driven almost entirely by 2 blog posts dropping from page 1 (pos ~5) to page 2 (pos ~11)
- ~600 of the ~700 daily impressions lost are explained by these 2 URLs
- No git activity around the cliff date → almost certainly external (algorithm or competition)
- Manual actions: confirmed clean (user verified in GSC)
- Diagnosis script: [SEO Agent/scripts/find-impression-cliff.ts](../../SEO Agent/scripts/find-impression-cliff.ts)
- Query-level diff: [SEO Agent/scripts/cliff-query-diff.ts](../../SEO Agent/scripts/cliff-query-diff.ts)

### 2. Paid Search conversion attribution broken
- GA4 showed 1 conversion per ~1,949 paid sessions (clearly wrong)
- Root cause: gclid lost through Stripe redirect → conversion fired but couldn't link to ad click
- 5 issues found in tracking code (no GA4 ID, no conversion linker, gclid not preserved, etc.)
- Now fixed (see "Code changes" below)

### 3. /auth as #1 paid landing page (1,059 of 1,949 sessions = 54%)
- **Not** caused by Google Ads URL configuration (verified: 0 ads point to /auth in any campaign or asset type)
- Real cause: post-purchase email confirmation flow → users click email link to set up account → land on /auth/callback while gclid cookie still attached → GA4 attributes new session to Paid Search
- Fix: UTM-tag the Supabase email links so they route to "Email" channel instead

### 4. GA4 ↔ GSC discrepancy (560 vs 60)
- **Not** misclassification — GA4 organic includes Bing (145), DuckDuckGo, Yahoo, etc., which GSC doesn't track
- Stripe checkout return was being miscategorized as "Organic Shopping" (173 sessions) — needs GSC referral exclusion (manual action)

### 5. Sitemap and indexing gaps
- Main sitemap had only 8 URLs (incl. /auth incorrectly), missing 7+ "complete-guide" landing pages → fixed
- Blog sitemap (`insights.educourse.com.au/sitemap.xml`) wasn't declared in main robots.txt → fixed
- Only 10/26 pages indexed in GSC → should improve with sitemap fixes

### 6. Ghost blog drafts mass cleanup
- 45 drafts existed; 36+ were V2 duplicates of already-published posts (would have caused keyword cannibalization)
- All 45 deleted on user request; 61 published posts intact
- Forward plan: update existing posts in place for 2027, create new posts as needed

### 7. AI assistants referring traffic
- Tiny but real signal: copilot.com (5), claude.ai (2), gemini.google.com (1) over 30 days
- robots.txt allows AI bots (no blocks for GPTBot, ClaudeBot, etc.)

---

## Code changes shipped to production

All deployed to https://educourse.com.au and verified live.

| File | Change | Purpose |
|---|---|---|
| [index.html](../../index.html) | Added `conversion_linker: true`, cross-subdomain `linker.domains`, `decorate_forms: true`, gclid capture to localStorage on landing | Preserve gclid across subdomains and Stripe redirect |
| [src/services/stripeService.ts](../../src/services/stripeService.ts) | Append `gclid` to Stripe `successUrl` | Survives the redirect to checkout.stripe.com |
| [src/pages/PurchaseSuccess.tsx](../../src/pages/PurchaseSuccess.tsx) | Read gclid from URL/localStorage, attach to conversion event | Restores attribution if cookies were wiped |
| [src/pages/Auth.tsx](../../src/pages/Auth.tsx) | Add `utm_source=email&utm_medium=signup_confirmation/magic_link/password_reset` to all 3 Supabase email redirect URLs | Stops post-purchase email traffic from being misattributed to Paid Search |
| [public/robots.txt](../../public/robots.txt) | Added `Sitemap: https://insights.educourse.com.au/sitemap.xml` | Google can now discover all 61 Ghost blog posts |
| [public/sitemap.xml](../../public/sitemap.xml) | Removed `/auth`, added 7 complete-guide landing pages | Sitemap consistent with robots.txt; better indexation |

---

## New tooling (audit + diagnostics)

All under `SEO Agent/scripts/` and `Google Ads Agent/scripts/`. Re-runnable any time.

### SEO / GA4 / Search Console
- **`SEO Agent/scripts/audit-30-day.ts`** — full GA4 + GSC 30-day audit report, written to `docs/04-analysis/SEO_AUDIT_<date>.md`
- **`SEO Agent/scripts/find-impression-cliff.ts`** — detects sustained impression drops, correlates with git history
- **`SEO Agent/scripts/cliff-query-diff.ts`** — shows which queries/pages were lost during a traffic cliff
- **`SEO Agent/scripts/diagnose-ga4-channels.ts`** — source/medium breakdown per channel (catches Stripe-as-referral and similar misattributions)
- **`SEO Agent/scripts/check-ghost-posts.ts`** — Ghost CMS post inventory (published, drafts, scheduled)
- **`SEO Agent/scripts/find-draft-duplicates.ts`** — detects V2 drafts that duplicate already-published posts
- **`SEO Agent/scripts/delete-all-drafts.ts`** — bulk-delete Ghost drafts (with safety checks)

### Google Ads URL audit
- **`Google Ads Agent/scripts/audit-final-urls.ts`** — flags ads pointing to /auth/dashboard/wrong-domain
- **`Google Ads Agent/scripts/audit-all-ad-destinations.ts`** — comprehensive: ad URLs, sitelinks, PMax asset groups
- **`Google Ads Agent/scripts/show-wrong-domain-ads.ts`** — shows full details of any ad on a non-educourse domain

---

## Authentication setup (for future runs)

### Application Default Credentials (ADC)
GA4 Data API and Search Console API authenticate via gcloud ADC — no key files needed.

```bash
# One-time setup (already done):
gcloud auth application-default login \
  --scopes=openid,https://www.googleapis.com/auth/userinfo.email,https://www.googleapis.com/auth/cloud-platform,https://www.googleapis.com/auth/analytics.readonly,https://www.googleapis.com/auth/webmasters.readonly

gcloud auth application-default set-quota-project warm-upgrade-490611-p5
```

Credentials stored at `~/.config/gcloud/application_default_credentials.json`.

### Required Workspace Admin allow-list
Google Cloud SDK OAuth client (`764086051850-6qr4p6gpi6hn506pt8ejuq83di341hur.apps.googleusercontent.com`) must be marked **Trusted** in admin.google.com → Security → API controls → MANAGE APP ACCESS. (Done.)

### Environment variables (in .env)
```
GA4_PROPERTY_ID=351688132
GSC_SITE_URL=sc-domain:educourse.com.au
```

### Google Cloud project
- Project: `Google Ads API` (`warm-upgrade-490611-p5`)
- APIs enabled: Analytics Data API, Search Console API, Google Ads API
- Service account `google-ads-api-service@…` exists but is unused (org policy blocks key creation; ADC used instead)

---

## Outstanding manual actions (you)

### Critical (do now)
1. **GA4 Admin → Data streams → Configure tag → List unwanted referrals → add `checkout.stripe.com`**
   Effect: stops 173+ sessions/month being miscategorized as "Organic Shopping"; restores their original channel attribution
2. **Wait 24-48 hours** then re-check **GSC → Sitemaps** — the `insights.educourse.com.au/sitemap.xml` "Couldn't fetch" should clear

### Important (this week)
3. **Refresh the 2 cliff posts** manually in Ghost editor:
   - `year-5-naplan-writing`
   - `year-7-naplan-language-conventions`
   - Add depth, update for 2027 angle, add FAQ schema
4. **Resubmit blog sitemap in GSC** if still failing after 48 hours

### Nice to have (when bandwidth allows)
5. Audit other "complete-guide" pages on main domain — there may be more than 7 missing from sitemap
6. Add Course schema markup to the 6 course pages (`Schema.org Course` type) — helps both Google and AI tools
7. Add FAQ sections + FAQ schema to top 10 published blog posts

---

## Forward plan (from user)

- Update existing 61 published Ghost posts in place for 2027 over the coming months
- Don't create V2 drafts — edit originals to preserve URL history and ranking signals
- Create new posts (Year 3 NAPLAN, Year 9 NAPLAN, QLD Selective, NAPLAN Platforms) when bandwidth allows

---

## Measuring recovery

Re-run any time:

```bash
# Full 30-day audit (post-fix tracking)
npx tsx "SEO Agent/scripts/audit-30-day.ts"

# Has the cliff recovered?
npx tsx "SEO Agent/scripts/find-impression-cliff.ts"

# Are channels attributed correctly now?
npx tsx "SEO Agent/scripts/diagnose-ga4-channels.ts"
```

Expected timeline:
- **1-2 weeks:** Paid Search conversions in Google Ads tick up (gclid pipeline working)
- **2-4 weeks:** Direct conversions drop in GA4 (because they were stolen from Paid)
- **4-8 weeks:** Blog impressions tick up (sitemap discovery + indexation)
- **8-12 weeks:** Cliff posts may recover if you refresh them with quality updates

---

## Reports generated this session

- [docs/04-analysis/SEO_AUDIT_2026-05-03.md](./SEO_AUDIT_2026-05-03.md)
- [docs/04-analysis/IMPRESSION_CLIFF_2026-05-03.md](./IMPRESSION_CLIFF_2026-05-03.md)
- [docs/04-analysis/CLIFF_QUERY_DIFF_2026-05-03.md](./CLIFF_QUERY_DIFF_2026-05-03.md)
- [docs/04-analysis/GA4_CHANNEL_DIAGNOSTIC_2026-05-03.md](./GA4_CHANNEL_DIAGNOSTIC_2026-05-03.md)
- This file

---

**Status as of 2026-05-03:** All code fixes deployed and verified live. Three manual GA4/GSC clicks pending. Ready for monitoring loop over next 2-4 weeks.
