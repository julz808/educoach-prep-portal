import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../shared/database';
import { AIAnalysis, AIRecommendation } from './ai-strategic-advisor';

interface TelegramConfig {
  botToken: string;
  chatId: string;
}

export class TelegramNotifier {
  private config: TelegramConfig;
  private db: SupabaseClient<Database>;
  private baseUrl: string;

  constructor(db: SupabaseClient<Database>) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      throw new Error('TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID environment variables are required');
    }

    this.config = { botToken, chatId };
    this.db = db;
    this.baseUrl = `https://api.telegram.org/bot${botToken}`;
  }

  /**
   * Send weekly AI analysis to Telegram
   */
  async sendWeeklyAnalysis(analysis: AIAnalysis, performanceData: any): Promise<void> {
    console.log('📱 Sending Telegram notification...');

    const message = this.formatWeeklyMessage(analysis, performanceData);

    // Send main message
    await this.sendMessage(message, { parse_mode: 'HTML' });

    // Send recommendations with interactive buttons
    const highPriority = analysis.recommendations.filter(r => r.priority === 'high');
    const mediumPriority = analysis.recommendations.filter(r => r.priority === 'medium');
    const lowPriority = analysis.recommendations.filter(r => r.priority === 'low');

    if (highPriority.length > 0) {
      await this.sendMessage('<b>🎯 HIGH PRIORITY RECOMMENDATIONS:</b>', { parse_mode: 'HTML' });
      for (const rec of highPriority) {
        await this.sendRecommendation(rec, 'high');
      }
    }

    if (mediumPriority.length > 0) {
      await this.sendMessage(`\n<b>📈 MEDIUM PRIORITY (${mediumPriority.length}):</b>`, { parse_mode: 'HTML' });
      for (const rec of mediumPriority.slice(0, 3)) { // Only show top 3
        await this.sendRecommendation(rec, 'medium');
      }
      if (mediumPriority.length > 3) {
        await this.sendMessage(`   <i>+${mediumPriority.length - 3} more in database</i>`, { parse_mode: 'HTML' });
      }
    }

    if (lowPriority.length > 0) {
      await this.sendMessage(`\n<b>📊 LOW PRIORITY (${lowPriority.length}):</b> View in Supabase`, { parse_mode: 'HTML' });
    }

    console.log('  ✓ Telegram notifications sent');
  }

  /**
   * Send daily summary (simple metrics)
   */
  async sendDailySummary(metrics: any): Promise<void> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toLocaleDateString('en-AU', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    const message = `
📊 <b>Google Ads Daily Report</b> - ${dateStr}

💰 <b>Yesterday's Performance:</b>
• Spend: $${metrics.spend.toFixed(2)} ${this.getBudgetStatus(metrics.spend)}
• Conversions: ${metrics.conversions} ${this.getChangeIndicator(metrics.conversions_change)}
• CAC: $${metrics.cac.toFixed(2)} (target: $${metrics.target_cac})
• CTR: ${metrics.ctr.toFixed(1)}%

${this.getPerformanceEmoji(metrics)} <b>${this.getPerformanceMessage(metrics)}</b>

📅 Next full AI audit: Monday 6 AM
    `.trim();

    await this.sendMessage(message, { parse_mode: 'HTML' });
  }

  /**
   * Format the weekly analysis message
   */
  private formatWeeklyMessage(analysis: AIAnalysis, performanceData: any): string {
    const today = new Date().toLocaleDateString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const { last7Days, previous7Days } = performanceData;

    // Calculate week-over-week changes
    const spendChange = this.calculateChange(last7Days.summary.total_spend, previous7Days.summary.total_spend);
    const convChange = this.calculateChange(last7Days.summary.total_conversions, previous7Days.summary.total_conversions);
    const cacChange = this.calculateChange(last7Days.summary.average_cac, previous7Days.summary.average_cac);
    const ctrChange = this.calculateChange(last7Days.summary.average_ctr, previous7Days.summary.average_ctr);

    return `
🧠 <b>Google Ads AI Weekly Audit</b>
${today}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚡ <b>THIS WEEK vs LAST WEEK:</b>

<pre>
Metric       This Week  Last Week   Δ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Spend        $${last7Days.summary.total_spend.toFixed(0).padStart(7)}  $${previous7Days.summary.total_spend.toFixed(0).padStart(7)}  ${spendChange}
Conversions  ${String(last7Days.summary.total_conversions).padStart(7)}  ${String(previous7Days.summary.total_conversions).padStart(7)}  ${convChange}
CAC          $${last7Days.summary.average_cac.toFixed(2).padStart(6)}  $${previous7Days.summary.average_cac.toFixed(2).padStart(6)}  ${cacChange}
CTR          ${last7Days.summary.average_ctr.toFixed(1).padStart(5)}%  ${previous7Days.summary.average_ctr.toFixed(1).padStart(5)}%  ${ctrChange}
</pre>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 <b>AI STRATEGIC ANALYSIS:</b>
${analysis.executive_summary}

🔍 <b>KEY INSIGHTS:</b>
${analysis.key_insights.map((insight, i) => `${i + 1}. ${insight}`).join('\n')}

${analysis.risks.length > 0 ? `
⚠️ <b>RISKS TO MONITOR:</b>
${analysis.risks.map(risk => `• ${risk}`).join('\n')}
` : ''}

🎯 <b>NEXT WEEK FOCUS:</b>
${analysis.next_week_focus}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();
  }

  /**
   * Send individual recommendation with approve/reject buttons
   */
  private async sendRecommendation(rec: AIRecommendation, priority: string): Promise<void> {
    const emoji = this.getRecommendationEmoji(rec.type);
    const priorityEmoji = priority === 'high' ? '🔴' : priority === 'medium' ? '🟡' : '⚪';

    const message = `
${priorityEmoji} ${emoji} <b>${rec.action}</b>

<b>Why:</b> ${rec.reasoning}

<b>Expected Impact:</b> ${rec.expected_impact}

<b>Confidence:</b> ${(rec.confidence * 100).toFixed(0)}%
${this.formatRecommendationDetails(rec.details)}
    `.trim();

    const keyboard = {
      inline_keyboard: [[
        { text: '✅ Approve', callback_data: `approve:${rec.id}` },
        { text: '❌ Reject', callback_data: `reject:${rec.id}` },
        { text: '💬 Explain', callback_data: `explain:${rec.id}` },
      ]],
    };

    await this.sendMessage(message, {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
  }

  /**
   * Format recommendation details
   */
  private formatRecommendationDetails(details: Record<string, any>): string {
    const parts: string[] = [];

    if (details.from_campaign && details.to_campaign) {
      parts.push(`\n<i>From: ${details.from_campaign} → To: ${details.to_campaign}</i>`);
    }
    if (details.amount) {
      parts.push(`<i>Amount: $${details.amount}/day</i>`);
    }
    if (details.keyword) {
      parts.push(`<i>Keyword: "${details.keyword}"</i>`);
    }
    if (details.current_cac) {
      parts.push(`<i>Current CAC: $${details.current_cac}</i>`);
    }

    return parts.length > 0 ? '\n' + parts.join('\n') : '';
  }

  /**
   * Get emoji for recommendation type
   */
  private getRecommendationEmoji(type: string): string {
    const emojiMap: Record<string, string> = {
      budget_shift: '💰',
      pause_campaign: '⏸️',
      pause_ad: '📝',
      add_negative_keyword: '🚫',
      bid_adjustment: '📊',
      ad_copy_test: '✨',
    };
    return emojiMap[type] || '📌';
  }

  /**
   * Calculate percentage change
   */
  private calculateChange(current: number, previous: number): string {
    if (previous === 0) return '—';

    const change = ((current - previous) / previous) * 100;
    const sign = change > 0 ? '+' : '';
    const indicator = change > 0 ? '↑' : change < 0 ? '↓' : '→';

    return `${sign}${change.toFixed(0)}% ${indicator}`;
  }

  /**
   * Get budget status indicator
   */
  private getBudgetStatus(spend: number): string {
    if (spend > 150) return '⚠️ Over';
    if (spend > 140) return '⚡ Near limit';
    if (spend > 100) return '✓ Good';
    return '💚 Under budget';
  }

  /**
   * Get change indicator emoji
   */
  private getChangeIndicator(change: number): string {
    if (change > 0) return `(+${change} ↑)`;
    if (change < 0) return `(${change} ↓)`;
    return '(—)';
  }

  /**
   * Get performance emoji
   */
  private getPerformanceEmoji(metrics: any): string {
    if (metrics.cac <= metrics.target_cac * 0.9) return '🎉';
    if (metrics.cac <= metrics.target_cac) return '✅';
    if (metrics.cac <= metrics.target_cac * 1.2) return '⚠️';
    return '🚨';
  }

  /**
   * Get performance message
   */
  private getPerformanceMessage(metrics: any): string {
    if (metrics.cac <= metrics.target_cac * 0.9) return 'Crushing it! CAC well under target';
    if (metrics.cac <= metrics.target_cac) return 'On track - hitting CAC target';
    if (metrics.cac <= metrics.target_cac * 1.2) return 'Slightly over target - monitor closely';
    return 'CAC too high - needs optimization';
  }

  /**
   * Send a message via Telegram API
   */
  private async sendMessage(text: string, options: any = {}): Promise<void> {
    const url = `${this.baseUrl}/sendMessage`;

    const body = {
      chat_id: this.config.chatId,
      text,
      ...options,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Telegram API error: ${error}`);
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  /**
   * Set up webhook for interactive buttons (called once during setup)
   */
  async setupWebhook(webhookUrl: string): Promise<void> {
    const url = `${this.baseUrl}/setWebhook`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl }),
    });

    if (!response.ok) {
      throw new Error('Failed to set up Telegram webhook');
    }

    console.log('✓ Telegram webhook configured');
  }
}
