# Cliff Query/Page Diff — 2026-05-03

**Spike window:** 2026-03-06 → 2026-03-16 (11 days, peak traffic)
**Post-cliff window:** 2026-04-03 → 2026-05-02 (30 days, current baseline)
**Site:** sc-domain:educourse.com.au

All numbers are **daily averages** so the windows are comparable.

---

## Lost queries (top 30 by daily-impression drop)

These are search queries you used to get impressions for during the spike, but lost most or all of after the cliff.

| Query | Spike imp/day | Now imp/day | Drop | Spike position | Now position |
|---|---|---|---|---|---|
| educourse | 34 | 11 | 66% | 4.7 | 4.6 |
| naplan year 5 writing time | 7 | 0 | 100% | 3.0 | **gone** |
| naplan year 5 writing how many words | 4 | 0 | 99% | 4.4 | 3.0 |
| naplan writing topic 2026 | 3 | 0 | 99% | 1.0 | 1.0 |
| 2026 naplan writing topic | 2 | 0 | 100% | 3.2 | **gone** |
| year 5 naplan writing time | 2 | 0 | 96% | 5.6 | 10.7 |
| naplan writing time year 5 | 2 | 0 | 97% | 3.2 | 12.5 |
| naplan writing 2026 year 5 | 2 | 0 | 100% | 7.3 | **gone** |
| edutest | 3 | 1 | 67% | 14.0 | 30.7 |
| naplan writing prompt 2026 | 2 | 0 | 97% | 4.1 | 12.0 |
| yes | 2 | 0 | 95% | 2.4 | 6.3 |

---

## Position drops on still-ranking queries (top 20)

These queries still appear, but at a worse position.

| Query | Spike pos | Now pos | Δ | Spike imp | Now imp |
|---|---|---|---|---|---|
| year 7 naplan practice | 38.5 | 73.6 | +35.1 | 12 | 7 |
| year 7 naplan | 32.6 | 62.1 | +29.5 | 17 | 11 |
| year 5 naplan | 18.4 | 46.0 | +27.6 | 10 | 1 |
| edutest scholarship test | 9.1 | 32.0 | +22.9 | 10 | 4 |
| naplan year 5 | 33.2 | 50.4 | +17.2 | 21 | 16 |
| edutest | 14.0 | 30.7 | +16.7 | 34 | 31 |
| edutest scholarship | 10.9 | 24.3 | +13.4 | 12 | 13 |
| naplan writing time year 5 | 3.2 | 12.5 | +9.3 | 26 | 2 |
| naplan writing prompt 2026 | 4.1 | 12.0 | +7.9 | 23 | 2 |
| year 5 naplan writing time | 5.6 | 10.7 | +5.1 | 27 | 3 |

---

## Lost pages (top 20 by daily-impression drop)

| Page | Spike imp/day | Now imp/day | Drop | Spike pos | Now pos |
|---|---|---|---|---|---|
| blog:/year-5-naplan-writing/ | 373 | 8 | 98% | 5.1 | 11.9 |
| blog:/year-7-naplan-language-conventions/ | 241 | 8 | 97% | 4.5 | 11.3 |
| / | 54 | 25 | 53% | 6.2 | 7.1 |
| /course/year-7-naplan | 27 | 7 | 73% | 25.3 | 24.7 |
| blog:/complete-guide-to-acer-scholarship-test-2026-everything-parents-need-to-know/ | 15 | 0 | 100% | 7.5 | **gone** |
| /course/edutest-scholarship | 26 | 13 | 53% | 12.7 | 13.6 |
| /course/year-5-naplan | 16 | 6 | 60% | 21.8 | 23.9 |

---

## How to read this

- **"Gone"** in the Now column = query/page no longer appears in GSC top 1000 results for the post-cliff window
- A query going from position 5 → position 35 is effectively gone (page 4 of search results)
- Look for **patterns**: are most lost queries on the same topic? Same page? Same intent (informational vs commercial)?

To re-run: `npx tsx "SEO Agent/scripts/cliff-query-diff.ts"`
