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

  let message = `📊 GOOGLE ADS WEEKLY REPORT\n`;
  message += `${date}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // Budget Execution Section
  message += `💰 BUDGET EXECUTION (Automated)\n\n`;

  const successful = budgetChanges.filter(c => c.status === 'success');
  const skipped = budgetChanges.filter(c => c.status === 'skipped');

  budgetChanges.forEach(change => {
    const icon = change.status === 'success' ? '✅' :
                 change.status === 'skipped' ? '⏭️' : '❌';
    const diff = ((change.new_budget - change.previous_budget) / change.previous_budget * 100).toFixed(0);
    const arrow = change.new_budget > change.previous_budget ? '↑' :
                  change.new_budget < change.previous_budget ? '↓' : '→';

    message += `${icon} ${change.campaign_name}\n`;
    message += `   $${change.previous_budget.toFixed(2)}/day ${arrow} $${change.new_budget.toFixed(2)}/day`;

    if (change.status === 'success' && Math.abs(parseFloat(diff)) > 0.1) {
      message += ` (${diff >= 0 ? '+' : ''}${diff}%)`;
    }

    message += `\n   Phase: ${change.phase}\n\n`;
  });

  message += `Budgets: ${successful.length} updated, ${skipped.length} unchanged\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // Tactical Recommendations Section
  message += `🎯 TACTICAL RECOMMENDATIONS\n\n`;

  if (tacticalRecommendations.length === 0) {
    message += `No recommendations this week.\nCampaigns performing well! 🎉\n`;
  } else {
    tacticalRecommendations.forEach((rec, i) => {
      const icon = rec.type === 'negative_keyword' ? '🚫' :
                   rec.type === 'add_keyword' ? '➕' :
                   rec.type === 'bid_adjustment' ? '💵' :
                   rec.type === 'pause_ad' ? '⏸️' : '▶️';

      message += `[${i + 1}] ${icon} ${rec.type.toUpperCase().replace('_', ' ')}\n`;
      message += `   📊 ${rec.campaign}\n`;
      message += `   💡 ${rec.action}\n`;
      message += `   📈 ${rec.reason}\n`;
      message += `   🎯 ${rec.impact}\n`;
      message += `   👉 /approve_${i + 1} or /reject_${i + 1}\n\n`;
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
