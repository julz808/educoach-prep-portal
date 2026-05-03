# GA4 Channel Grouping Diagnostic — 2026-05-03

**Window:** 2026-04-03 → 2026-05-03
**GA4 Property:** 351688132

---

## Source / medium breakdown by channel

This is the truth. "Organic Search" should be dominated by `google / organic`. Anything else in there is either misclassification or non-Google search.

### Paid Search (1949 sessions)

| Source | Medium | Sessions | % |
|---|---|---|---|
| google | cpc | 1949 | 100.0% |

### Direct (1019 sessions)

| Source | Medium | Sessions | % |
|---|---|---|---|
| (direct) | (none) | 1019 | 100.0% |

### Organic Search (560 sessions)

| Source | Medium | Sessions | % |
|---|---|---|---|
| google | organic | 394 | 70.4% |
| bing | organic | 145 | 25.9% |
| au.search.yahoo.com | referral | 11 | 2.0% |
| duckduckgo | organic | 6 | 1.1% |
| uk.search.yahoo.com | referral | 2 | 0.4% |
| in.search.yahoo.com | referral | 1 | 0.2% |
| yahoo | organic | 1 | 0.2% |

### Organic Shopping (173 sessions)

| Source | Medium | Sessions | % |
|---|---|---|---|
| checkout.stripe.com | referral | 173 | 100.0% |

### Unassigned (12 sessions)

| Source | Medium | Sessions | % |
|---|---|---|---|
| (not set) | (not set) | 12 | 100.0% |

### Cross-network (6 sessions)

| Source | Medium | Sessions | % |
|---|---|---|---|
| (data not available) | (data not available) | 6 | 100.0% |

### Referral (9 sessions)

| Source | Medium | Sessions | % |
|---|---|---|---|
| copilot.com | referral | 5 | 55.6% |
| claude.ai | referral | 2 | 22.2% |
| app.clickup.com | referral | 1 | 11.1% |
| gemini.google.com | referral | 1 | 11.1% |

### Organic Social (2 sessions)

| Source | Medium | Sessions | % |
|---|---|---|---|
| facebook.com | referral | 1 | 50.0% |
| m.facebook.com | referral | 1 | 50.0% |

---

## Auth-flow landing pages

If email confirmation links don't carry UTM params, /auth/callback shows up as Direct or random. This pollutes channel attribution.

| Sessions | Channel | Source | Landing page |
|---|---|---|---|
| 1059 | Paid Search | google | /auth |
| 352 | Direct | (direct) | /auth |
| 148 | Organic Search | google | /auth |
| 141 | Organic Shopping | checkout.stripe.com | /auth |
| 13 | Organic Search | bing | /auth |
| 4 | Unassigned | (not set) | /auth |
| 1 | Referral | claude.ai | /auth |
