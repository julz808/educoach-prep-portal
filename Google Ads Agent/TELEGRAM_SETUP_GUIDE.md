# Telegram Bot Setup Guide

Complete step-by-step guide to get your Google Ads Agent V2 sending reports to Telegram.

---

## 📋 Step 1: Create a Telegram Bot

### 1.1 Open Telegram and find BotFather

1. Open Telegram on your phone or desktop
2. Search for `@BotFather` (official Telegram bot for creating bots)
3. Start a chat with BotFather

### 1.2 Create your bot

Send this command to BotFather:
```
/newbot
```

BotFather will ask for:
1. **Bot name:** `EduCourse Google Ads Agent` (or whatever you want)
2. **Bot username:** Must end in `bot` (e.g., `educourse_ads_bot`)

### 1.3 Save your bot token

BotFather will give you a token that looks like:
```
1234567890:ABCdefGHIjklMNOpqrsTUVwxyz1234567890
```

**⚠️ IMPORTANT:** Copy this token - you'll need it in Step 2!

---

## 📋 Step 2: Get Your Chat ID

### 2.1 Start a chat with your bot

1. Click the link BotFather provides to your new bot
2. Click "START" or send any message to your bot

### 2.2 Get your Chat ID

**Option A: Use the Telegram API (easiest)**

Replace `YOUR_BOT_TOKEN` with the token from Step 1, then open this URL in your browser:

```
https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates
```

Example:
```
https://api.telegram.org/bot1234567890:ABCdefGHIjklMNOpqrsTUVwxyz/getUpdates
```

You'll see JSON response with your chat ID:
```json
{
  "ok": true,
  "result": [{
    "message": {
      "chat": {
        "id": 123456789,  // <-- This is your chat ID!
        "first_name": "Your Name",
        "type": "private"
      }
    }
  }]
}
```

Copy the `id` number (e.g., `123456789`)

**Option B: Use a helper bot**

1. Search for `@userinfobot` on Telegram
2. Start a chat
3. It will tell you your Chat ID

---

## 📋 Step 3: Add to Environment Variables

Open your `.env` file and add:

```bash
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz1234567890
TELEGRAM_CHAT_ID=123456789
```

Replace with your actual values from Steps 1-2.

---

## 📋 Step 4: Install Telegram Library

Run this command to install the Telegram API library:

```bash
npm install node-telegram-bot-api
npm install --save-dev @types/node-telegram-bot-api
```

---

## 📋 Step 5: Implement Telegram Functions

I've prepared the code for you. Create this file:

**File: `Google Ads Agent/scripts/v2/telegram-notifier.ts`**

```typescript
/**
 * Telegram Notification Service
 */

import TelegramBot from 'node-telegram-bot-api';
import * as dotenv from 'dotenv';

dotenv.config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { polling: false });
const chatId = process.env.TELEGRAM_CHAT_ID!;

export interface BudgetChange {
  campaign_name: string;
  previous_budget: number;
  new_budget: number;
  phase: string;
  status: 'success' | 'skipped' | 'failed';
}

export interface TacticalRecommendation {
  type: string;
  campaign: string;
  action: string;
  reason: string;
  impact: string;
}

export async function sendTelegramReport(
  budgetChanges: BudgetChange[],
  tacticalRecommendations: TacticalRecommendation[]
) {
  try {
    const message = formatReport(budgetChanges, tacticalRecommendations);

    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    });

    console.log('✅ Telegram message sent successfully!');
  } catch (error) {
    console.error('❌ Failed to send Telegram message:', error);
    throw error;
  }
}

function formatReport(
  budgetChanges: BudgetChange[],
  tacticalRecommendations: TacticalRecommendation[]
): string {
  const date = new Date().toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  let message = `📊 *GOOGLE ADS WEEKLY REPORT*\n`;
  message += `${date}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // Budget Execution Section
  message += `💰 *BUDGET EXECUTION (Automated)*\n\n`;

  const successful = budgetChanges.filter(c => c.status === 'success');
  const skipped = budgetChanges.filter(c => c.status === 'skipped');

  budgetChanges.forEach(change => {
    const icon = change.status === 'success' ? '✅' :
                 change.status === 'skipped' ? '⏭️' : '❌';
    const diff = ((change.new_budget - change.previous_budget) / change.previous_budget * 100).toFixed(0);
    const arrow = change.new_budget > change.previous_budget ? '↑' :
                  change.new_budget < change.previous_budget ? '↓' : '→';

    message += `${icon} *${change.campaign_name}*\n`;
    message += `   $${change.previous_budget.toFixed(2)}/day ${arrow} $${change.new_budget.toFixed(2)}/day`;

    if (change.status === 'success' && Math.abs(parseFloat(diff)) > 0.1) {
      message += ` (${diff >= 0 ? '+' : ''}${diff}%)`;
    }

    message += `\n   Phase: ${change.phase}\n\n`;
  });

  message += `_Budgets: ${successful.length} updated, ${skipped.length} unchanged_\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // Tactical Recommendations Section
  message += `🎯 *TACTICAL RECOMMENDATIONS*\n\n`;

  if (tacticalRecommendations.length === 0) {
    message += `No recommendations this week.\nCampaigns performing well! 🎉\n`;
  } else {
    tacticalRecommendations.forEach((rec, i) => {
      const icon = rec.type === 'negative_keyword' ? '🚫' :
                   rec.type === 'add_keyword' ? '➕' :
                   rec.type === 'bid_adjustment' ? '💵' :
                   rec.type === 'pause_ad' ? '⏸️' : '▶️';

      message += `[${i + 1}] ${icon} *${rec.type.toUpperCase().replace('_', ' ')}*\n`;
      message += `   📊 ${rec.campaign}\n`;
      message += `   💡 ${rec.action}\n`;
      message += `   📈 ${rec.reason}\n`;
      message += `   🎯 ${rec.impact}\n`;
      message += `   👉 /approve\\_${i + 1} or /reject\\_${i + 1}\n\n`;
    });
  }

  message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `Next update: Monday 6 AM AEST`;

  return message;
}

// Test function
export async function testTelegramConnection() {
  try {
    await bot.sendMessage(chatId, '✅ Telegram bot connected successfully!\n\nYour Google Ads Agent V2 is ready.');
    console.log('✅ Test message sent!');
    return true;
  } catch (error) {
    console.error('❌ Failed to send test message:', error);
    return false;
  }
}
```

---

## 📋 Step 6: Test the Connection

Create a test script:

**File: `Google Ads Agent/scripts/test-telegram.ts`**

```typescript
import { testTelegramConnection } from './v2/telegram-notifier';

async function main() {
  console.log('🧪 Testing Telegram connection...\n');

  const success = await testTelegramConnection();

  if (success) {
    console.log('\n✅ Telegram bot is working!');
    console.log('Check your Telegram app for the test message.');
  } else {
    console.log('\n❌ Telegram bot failed.');
    console.log('Check your TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env');
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
```

Run the test:

```bash
npx tsx "Google Ads Agent/scripts/test-telegram.ts"
```

You should receive a message in Telegram saying "Telegram bot connected successfully!"

---

## 📋 Step 7: Update the Weekly Agent

Update `Google Ads Agent/scripts/v2/index-weekly-v2.ts` to use Telegram:

Replace the stub function with:

```typescript
import { sendTelegramReport } from './telegram-notifier';

// In the main function, replace the console.log telegram report with:
await sendTelegramReport(budgetChanges, tacticalRecommendations);
```

Full updated section:

```typescript
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PHASE 4: TELEGRAM REPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('━━━ PHASE 4: TELEGRAM REPORT ━━━\n');
console.log('Sending weekly report to Telegram...\n');

await sendTelegramReport(budgetChanges, tacticalRecommendations);

console.log('✅ Telegram report sent\n');
```

---

## 📋 Step 8: Test the Full Weekly Agent

Run the full weekly agent to see everything in action:

```bash
npx tsx "Google Ads Agent/scripts/v2/index-weekly-v2.ts"
```

You should receive a formatted weekly report in Telegram!

---

## 📋 Step 9: Set Up Cron Job (Automation)

### On Mac/Linux:

1. Open crontab:
```bash
crontab -e
```

2. Add this line (runs every Monday at 6 AM):
```bash
0 6 * * 1 cd /Users/julz88/Documents/educoach-prep-portal-2 && npx tsx "Google Ads Agent/scripts/v2/index-weekly-v2.ts" >> /tmp/google-ads-agent.log 2>&1
```

3. Save and exit (`:wq` in vim)

### On Windows (Task Scheduler):

1. Open Task Scheduler
2. Create Basic Task
3. Name: "Google Ads Weekly Agent"
4. Trigger: Weekly, Monday, 6:00 AM
5. Action: Start a program
   - Program: `cmd`
   - Arguments: `/c cd /d C:\path\to\project && npx tsx "Google Ads Agent/scripts/v2/index-weekly-v2.ts"`
6. Finish

---

## 📋 Troubleshooting

### Issue: "Unauthorized" error

**Problem:** Bot token is incorrect

**Solution:**
1. Double-check your `TELEGRAM_BOT_TOKEN` in `.env`
2. Make sure there are no extra spaces
3. Get a new token from BotFather if needed: `/token`

---

### Issue: "Chat not found" error

**Problem:** Chat ID is incorrect or you haven't started the bot

**Solution:**
1. Open Telegram and search for your bot username
2. Click START
3. Get your chat ID again using the API method
4. Update `TELEGRAM_CHAT_ID` in `.env`

---

### Issue: Messages not formatting correctly

**Problem:** Markdown syntax issues

**Solution:**
- Underscores in text must be escaped: `\_` instead of `_`
- The telegram-notifier already handles this
- If you customize messages, escape special characters

---

## 🎉 You're Done!

Your Google Ads Agent V2 will now:

1. **Every Monday at 6 AM:**
   - Collect last week's data
   - Auto-update budgets from `weekly_budget_allocation` table
   - AI analyzes for tactical opportunities
   - **Sends formatted report to your Telegram! 📱**

2. **You receive:**
   - Budget execution summary (what changed automatically)
   - 3-5 tactical recommendations
   - Approve/reject buttons (future enhancement)

3. **You spend:**
   - 5-10 minutes reviewing on your phone
   - Instead of 30-45 minutes at your computer

---

## 🚀 Future Enhancements (Optional)

### Interactive Approval via Telegram

To make `/approve_1` commands actually work:

1. Enable polling in telegram-notifier:
```typescript
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { polling: true });
```

2. Add command handlers:
```typescript
bot.onText(/\/approve_(\d+)/, async (msg, match) => {
  const recommendationId = parseInt(match![1]);
  // Execute recommendation
  await executeRecommendation(recommendationId);
  bot.sendMessage(msg.chat.id, `✅ Recommendation ${recommendationId} executed!`);
});
```

3. Store recommendations in database for approval

This turns it into a fully interactive bot!

---

**Questions?** Check the test script output for errors, or review the Telegram Bot API docs at: https://core.telegram.org/bots/api
