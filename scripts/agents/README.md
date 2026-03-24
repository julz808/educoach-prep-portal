# Marketing Agents

Autonomous agents for optimizing Google Ads campaigns and conversion rates.

## 🚀 Quick Start

### 1. Deploy Database Schema

```bash
npx supabase db push
```

This creates 11 tables for tracking campaigns, agent actions, and performance data.

### 2. Test the Agent

```bash
npm run agents:google-ads:dry-run
```

Without Google Ads API credentials, this runs in test mode and verifies:
- ✅ Database connection
- ✅ Seasonality calculations
- ✅ Test calendar data

### 3. Configure Google Ads API (Optional)

To enable full optimization, add these to your `.env`:

```bash
GOOGLE_ADS_CLIENT_ID=your_client_id
GOOGLE_ADS_CLIENT_SECRET=your_client_secret
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token
GOOGLE_ADS_REFRESH_TOKEN=your_refresh_token
GOOGLE_ADS_CUSTOMER_ID=123-456-7890
```

See [Google Ads API Setup Guide](https://developers.google.com/google-ads/api/docs/first-call/overview)

### 4. Configure Campaign Mapping

Edit `scripts/agents/google-ads/index.ts` and add your campaign IDs:

```typescript
const CAMPAIGN_PRODUCT_MAP = new Map<string, string>([
  ['1234567890', 'vic-selective'],
  ['9876543210', 'acer-scholarship'],
  // ... etc
]);
```

### 5. Run for Real

```bash
npm run agents:google-ads
```

## 📊 What It Does

The Google Ads Agent runs weekly and:

1. **Collects Data** - Fetches campaign performance from Google Ads API
2. **Calculates Seasonality** - Adjusts budgets based on test dates and monthly intensity
3. **Optimizes Budgets** - Changes budgets by up to ±25% per week
4. **Pauses Underperformers** - Stops campaigns exceeding CPA thresholds
5. **Mines Negative Keywords** - Flags wasteful search terms (requires approval)
6. **Graduates Bidding Strategies** - Moves from Maximize Clicks → Maximize Conversions at 15+ conversions
7. **Monitors Performance** - Tracks all changes in database

## 🎯 Key Features

### Intelligent Budget Distribution

- **Seasonality-based** - Increases budgets as test dates approach
- **Monthly intensity** - Follows your sales intensity calendar
- **Global cap** - Never exceeds $150/day total
- **Change limits** - Max ±25% change per week per campaign

### Safety Guardrails

- **CPA thresholds** - Auto-pauses campaigns at $150+ CPA (VIC/EduTest), $180+ (NAPLAN)
- **Dry run mode** - Test changes without executing
- **Approval workflow** - Negative keywords require manual review
- **Rollback monitoring** - Watches bidding strategy changes for 48 hours

### Auto-Graduation

Campaigns automatically graduate from Maximize Clicks to Maximize Conversions when:
- ✅ 15+ conversions in last 30 days
- ✅ 2%+ conversion rate

Why? Maximize Clicks optimizes for clicks (wasteful). Maximize Conversions optimizes for purchases (better ROI).

## 📁 Project Structure

```
scripts/agents/
├── shared/
│   ├── config.ts          # All configuration settings
│   └── database.ts        # Type-safe database client
└── google-ads/
    ├── index.ts           # Main orchestrator
    ├── google-ads-client.ts  # Google Ads API wrapper
    ├── seasonality-engine.ts # Budget calculation brain
    ├── data-collector.ts     # Data fetching
    ├── budget-optimizer.ts   # Budget execution
    ├── keyword-optimizer.ts  # Negative keyword mining
    └── bidding-optimizer.ts  # Auto-graduation logic
```

## 🗄️ Database Tables

- `google_ads_campaign_performance` - Daily metrics snapshots
- `google_ads_agent_actions` - Audit log of all changes
- `google_ads_search_terms` - Search term analysis
- `test_calendar` - Seasonality data with test dates
- `google_ads_weekly_summary` - Execution summaries
- `agent_coordination_events` - Inter-agent communication

## ⚙️ Configuration

Edit `scripts/agents/shared/config.ts` to customize:

```typescript
export const GENERAL_CONFIG = {
  DAILY_BUDGET_CAP_AUD: 150,              // Hard cap
  WEEKLY_CHANGE_LIMIT_PERCENTAGE: 25,     // Max change per week
  NOTIFICATION_EMAIL: 'your@email.com',
};

export const GOOGLE_ADS_CONFIG = {
  AUTO_GRADUATE_ENABLED: true,
  MIN_CONVERSIONS_FOR_GRADUATION: 15,
  NEGATIVE_KEYWORD_APPROVAL_REQUIRED: true,
};
```

## 📅 Scheduling (Coming Soon)

Set up weekly execution with:
- Vercel Cron
- GitHub Actions
- AWS EventBridge
- Or any cron service

Recommended: Every Monday at 6 AM AEST

## 🔍 Monitoring

View agent activity in Supabase:

```sql
-- Recent actions
SELECT * FROM google_ads_agent_actions
ORDER BY created_at DESC LIMIT 10;

-- Pending approvals
SELECT * FROM vw_pending_approvals;

-- Current week performance
SELECT * FROM vw_current_week_performance;

-- Weekly summaries
SELECT * FROM google_ads_weekly_summary
ORDER BY week_start_date DESC;
```

## 📚 Learn More

- [Implementation Plan](../../docs/10-marketing/MARKETING_AGENTS_IMPLEMENTATION_PLAN.md)
- [Google Ads API Docs](https://developers.google.com/google-ads/api)
- [Seasonality Calendar](../../docs/10-marketing/strategy/sales_intensity_calendar.xlsx)

## 🆘 Troubleshooting

**"Cannot find module google-ads-api"**
```bash
npm install
```

**"Missing Google Ads API credentials"**
- Agent runs in test mode without credentials
- Add credentials to `.env` to enable full features

**"No data in database"**
- First run won't have historical data
- Data accumulates over time
- Agent still makes recommendations based on seasonality

## 🎯 Next Steps

1. ✅ Database deployed
2. ✅ Agent working in test mode
3. ⏳ Add Google Ads API credentials
4. ⏳ Configure campaign mapping
5. ⏳ Run first optimization
6. ⏳ Set up weekly scheduling
7. ⏳ Build CRO Agent (conversion rate optimization)
