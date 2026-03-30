# Budget Allocation FAQ

## 1. How is the $20K allocated month to month?

### Monthly Breakdown (2026)

| Month | Budget | Avg Heat | Phase | % of Annual |
|-------|--------|----------|-------|-------------|
| **Q1 (Peak Season)** |
| Jan 2026 | $2,622 | 0.70 | PEAK | 13.1% |
| Feb 2026 | $2,940 | 0.78 | PEAK | 14.7% |
| Mar 2026 | **$3,595** | 0.77 | PEAK | **18.0%** ⭐ |
| **Q2 (Transition)** |
| Apr 2026 | $1,348 | 0.36 | MEDIUM | 6.7% |
| May 2026 | $1,807 | 0.48 | MEDIUM | 9.0% |
| Jun 2026 | $1,994 | 0.43 | MEDIUM | 10.0% |
| **Q3 (Dead Zone)** |
| Jul 2026 | **$599** | 0.16 | DEAD | **3.0%** 💀 |
| Aug 2026 | $749 | 0.16 | DEAD | 3.7% |
| Sep 2026 | $599 | 0.16 | DEAD | 3.0% |
| **Q4 (Ramp Up)** |
| Oct 2026 | $899 | 0.24 | LOW | 4.5% |
| Nov 2026 | $1,124 | 0.24 | LOW | 5.6% |
| Dec 2026 | $1,723 | 0.46 | MEDIUM | 8.6% |
| **TOTAL** | **$19,999** | | | **100%** |

### Key Patterns

**Q1 Dominance**: 45.8% of annual budget ($9,157)
- ACER Scholarship peak (Feb 28 test)
- EduTest Scholarship Q1 peak
- NAPLAN Year 5 & 7 (March tests)
- Heavy concentration: 3 months = nearly half the budget

**Summer Dead Zone**: 9.7% of annual budget ($1,947)
- Jul-Sep: All tests finished
- Minimal buyer intent
- Baseline spending only (0.25 seasonal multiplier)

**Peak/Dead Ratio**: 6.0x
- March spending is 6× higher than July
- This is intentional - spend when buyers are ready

**Why this works**:
- Budget follows buyer intent (not evenly distributed)
- Most parents buy 2-6 weeks before test
- Q1 has multiple overlapping test windows
- Summer has zero tests = minimal spending

---

## 2. How is it allocated between products in each month?

### Annual Product Allocation

| Product | Annual Budget | % of Total | Why? |
|---------|---------------|------------|------|
| **ACER Scholarship** | $8,256 | 41.3% | 32% of sales × 0.85 CAC eff × Q1 peak |
| **EduTest Scholarship** | $6,251 | 31.3% | 22% of sales × 0.80 CAC eff × Q1+June peaks |
| **VIC Selective** | $4,091 | 20.5% | 28% of sales × 0.90 CAC eff × June peak only |
| **Year 5 NAPLAN** | $926 | 4.6% | 12% of sales × 0.60 CAC eff × March peak |
| **Year 7 NAPLAN** | $257 | 1.3% | 4% of sales × 0.50 CAC eff × March peak |
| **NSW Selective** | $218 | 1.1% | 2% of sales × 0.70 CAC eff × May peak |

### Quarter-by-Quarter Product Mix

**Q1 (Jan-Mar): Heavy ACER + EduTest + NAPLAN**
```
ACER:     $4,150 (45%)  ← Dominates Q1
EduTest:  $2,685 (29%)  ← Strong Q1 presence
VIC:      $1,206 (13%)  ← Building awareness
NAPLAN Y5: $767 (8%)    ← March test peak
NAPLAN Y7: $213 (2%)
NSW:       $136 (1%)
```

**Q2 (Apr-Jun): VIC Takes Over**
```
VIC:      $2,510 (47%)  ← June test peak
EduTest:  $1,541 (29%)  ← Mid-year peak (June)
ACER:      $975 (18%)   ← Drops to baseline
NSW:        $59 (1%)    ← May test window
NAPLAN:     $52 (1%)    ← Post-test dead
```

**Q3 (Jul-Sep): All Products at Baseline**
```
ACER:      $1,020 (52%)  ← Maintains baseline
EduTest:    $660 (34%)
VIC:        $189 (10%)   ← Post-test
NAPLAN:      $55 (3%)    ← Post-test
NSW:         $10 (1%)    ← Post-test
```

**Q4 (Oct-Dec): Pre-Q1 Ramp Up**
```
ACER:      $2,112 (57%)  ← December ramp-up (0.80 seasonal)
EduTest:   $1,367 (37%)  ← December ramp-up
VIC:        $187 (5%)    ← Still baseline
NAPLAN:      $53 (1%)    ← Still baseline
NSW:         $10 (0%)    ← Still baseline
```

### Why ACER Gets 41.3% of Budget

1. **Highest sales percentage**: 32% (almost 1/3 of all sales)
2. **Best CAC efficiency**: 0.85 (actual CAC $102 vs target $120)
3. **Year-round demand**: Rolling tests = never fully dead (0.25 baseline)
4. **Multiple peaks**: Q1 peak (1.00) + December ramp (0.80) + Oct-Nov awareness (0.40)

**Opportunity score calculation**:
```
Q1: 1.00 (seasonal) × 0.32 (sales%) × 0.85 (CAC eff) = 0.272
Baseline: 0.25 × 0.32 × 0.85 = 0.068
```

### Why VIC Gets Only 20.5% Despite 28% Sales?

**VIC has a narrow window**:
- Test: June 20, 2026
- Peak: May-June only (2-6 weeks before test)
- Dead: July-May (rest of year at 0.05-0.30 seasonal)

**Monthly breakdown**:
- Jan-Apr: $26-179/month (building awareness, 0.15-0.50 seasonal)
- May-Jun: $1,028-696/month ⭐ (PEAK, 0.75-1.00 seasonal)
- Jul-Dec: $4-73/month (post-test dead zone)

**Contrast with ACER**:
- ACER maintains 0.25 baseline year-round
- VIC drops to 0.05 post-test
- Result: ACER gets more despite lower sales percentage

---

## 3. How much say does our Google Ads Agent have over budget allocation?

### Current Design: **Agent Has NO Budget Decision Power**

The Google Ads Agent is **read-only** on budgets:

```typescript
// Google Ads Agent's role:
1. Read weekly_budget_allocation table
2. Get pre-calculated daily budgets per product
3. Set Google Ads campaign budgets to match
4. Track actual spend vs allocated
5. Report performance metrics
```

**Agent does NOT**:
- ❌ Decide how much to spend
- ❌ Allocate budget between products
- ❌ Change seasonal logic
- ❌ Override opportunity scores

**Agent DOES**:
- ✅ Execute the budget plan
- ✅ Optimize bids/keywords/ad copy within budget
- ✅ Track CAC efficiency
- ✅ Report if budget is under/overspent

### Why This Separation?

**Strategic vs Tactical Separation**:

```
┌─────────────────────────────────────────────────┐
│ STRATEGIC (Budget Allocation System)            │
├─────────────────────────────────────────────────┤
│ • Decides HOW MUCH to spend                     │
│ • Decides WHERE to spend (which products)       │
│ • Based on: test dates, sales history, CAC     │
│ • Updated: Weekly (pre-calculated 104 weeks)    │
│ • Decision maker: You (via opportunity formula) │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ TACTICAL (Google Ads Agent)                     │
├─────────────────────────────────────────────────┤
│ • Executes the budget plan                      │
│ • Optimizes HOW to spend (bids, keywords, copy) │
│ • Based on: CTR, CPC, conversion rate           │
│ • Updated: Daily/hourly                         │
│ • Decision maker: AI Agent                      │
└─────────────────────────────────────────────────┘
```

### Benefits of This Approach

**1. Simplicity**
- Budget decisions are deterministic (formula-based)
- No AI "black box" deciding where money goes
- You control the formula, agent executes

**2. Predictability**
- You know exactly how $20k will be spent over 104 weeks
- No surprise budget shifts
- Clear audit trail

**3. Control**
- Want to change allocation? Update the formula and regenerate
- Want to cap a product? Set `max_daily_budget_aud`
- Want to boost a product? Update `sales_percentage` or `cac_efficiency`

**4. Agent Focus**
- Agent focuses on what it's good at: optimizing within constraints
- Doesn't waste "intelligence" on strategic decisions
- Tactical optimization is where AI adds value

### Alternative: Give Agent Budget Control

**If we let the agent decide budgets**, it would need to:

```typescript
// Agent would analyze:
1. Current week's market heat
2. Each product's performance (CTR, CPC, conv rate)
3. Remaining annual budget
4. Test date proximity
5. Historical patterns

// Then decide:
- How much to spend this week? ($500? $2000?)
- Split between products? (60% ACER, 20% VIC?)
- When to ramp up? (Now? Next week?)
```

**Problems with this**:
- ❌ **Overspend risk**: Agent could blow budget early
- ❌ **Underspend risk**: Agent could be too conservative
- ❌ **Complexity**: Needs additional constraints, safety rails
- ❌ **Unpredictability**: Hard to forecast annual spend
- ❌ **Attribution lag**: Takes weeks to know if decisions were good
- ❌ **Test overlap handling**: Hard for AI to reason about "ACER + NAPLAN both peak in March, but ACER has 32% sales vs 12%"

**Benefits**:
- ✅ Could react to real-time performance
- ✅ Could shift budget if a product is underperforming
- ✅ Could exploit unexpected opportunities

### Recommendation: **Hybrid Approach**

Keep current design, but add **agent recommendations**:

```typescript
// Weekly agent analysis:
1. Agent reads allocated budget
2. Agent executes campaigns
3. Agent tracks: actual_spend, actual_conversions, actual_cac
4. Agent generates recommendation:

   "VIC Selective: Allocated $500 this week, spent $320,
    CAC $85 (target $120). RECOMMENDATION: Increase budget
    by 30% next week - we're underserving high-intent traffic."

5. You review recommendation
6. You decide: accept (update formula) or reject
```

**Implementation**:
```sql
-- Add to weekly_budget_allocation table:
ALTER TABLE weekly_budget_allocation ADD COLUMN
  agent_recommendation TEXT;

-- Agent writes recommendations, you approve/reject
```

**This gives you**:
- ✅ Strategic control (you set the rules)
- ✅ Tactical optimization (agent executes)
- ✅ Intelligence feedback loop (agent suggests improvements)
- ✅ Safety (you approve before changes take effect)

---

## Final Answer to Your Questions

### 1. How is the $20K allocated month to month?

**Dynamically based on market heat**:
- Q1 (Jan-Mar): $9,157 (45.8%) ← Multiple test peaks
- Q2 (Apr-Jun): $5,149 (25.7%) ← VIC peak
- Q3 (Jul-Sep): $1,947 (9.7%) ← Dead zone
- Q4 (Oct-Dec): $3,746 (18.7%) ← Pre-Q1 ramp

**Peak month**: March ($3,595) - ACER + NAPLAN + EduTest all peak
**Dead month**: July ($599) - All tests finished

### 2. How is it allocated between products in each month?

**Annual**:
- ACER: 41.3% ($8,256) ← Highest sales + year-round demand
- EduTest: 31.3% ($6,251) ← Q1 + June peaks
- VIC: 20.5% ($4,091) ← 28% sales but narrow June window
- NAPLAN Y5: 4.6% ($926)
- NAPLAN Y7: 1.3% ($257)
- NSW: 1.1% ($218)

**Monthly mix shifts**:
- Q1: ACER dominates (45%)
- Q2: VIC takes over (47%)
- Q3-Q4: ACER returns to baseline dominance (52-57%)

### 3. How much say does our Google Ads Agent have?

**Current**: **Zero budget decision power**
- Agent reads pre-calculated budgets
- Agent executes campaigns within budget
- Agent tracks performance
- Agent has full control over HOW to spend (bids, keywords, ad copy)
- Agent has zero control over HOW MUCH to spend

**Recommendation**: **Keep it this way** (with optional feedback loop)
- Strategic decisions (budget allocation) = deterministic formula
- Tactical decisions (campaign optimization) = AI agent
- Add agent recommendations for you to review/approve
- Avoids complexity, overspend risk, unpredictability

**Why this works**:
- Simple, predictable, controllable
- Agent focuses on what it's good at (optimization)
- You maintain strategic control
- Can evolve to hybrid if needed (agent recommends, you approve)

---

**Generated**: 2026-03-25
**Analysis Script**: `scripts/marketing/analyze-budget-allocation.ts`
