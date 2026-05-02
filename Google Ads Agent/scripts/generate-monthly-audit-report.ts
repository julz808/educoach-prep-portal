import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const auditDataPath = path.join(__dirname, '..', 'google_ads_audit_data.json');
const auditData = JSON.parse(fs.readFileSync(auditDataPath, 'utf-8'));

const statusMap: Record<number, string> = { 2: 'ENABLED', 3: 'PAUSED', 4: 'REMOVED' };
const matchTypeMap: Record<number, string> = { 2: 'EXACT', 3: 'PHRASE', 4: 'BROAD' };

const today = new Date();
const thirtyDaysAgo = new Date(today);
thirtyDaysAgo.setDate(today.getDate() - 30);

const fmtDate = (d: Date) => d.toISOString().split('T')[0];
const periodFrom = fmtDate(thirtyDaysAgo);
const periodTo = fmtDate(today);

// Aggregate campaign-level metrics (sum across all rows per campaign)
const campaignMap = new Map<string, any>();
for (const c of auditData.campaigns) {
  const key = c.name;
  if (!campaignMap.has(key)) {
    campaignMap.set(key, {
      id: c.id,
      name: c.name,
      status: c.status,
      type: c.type,
      budget_aud: c.budget_aud,
      bidding_strategy: c.bidding_strategy,
      impressions: 0, clicks: 0, cost_aud: 0, conversions: 0,
    });
  }
  const agg = campaignMap.get(key);
  agg.impressions += c.last_30_days.impressions || 0;
  agg.clicks += c.last_30_days.clicks || 0;
  agg.cost_aud += c.last_30_days.cost_aud || 0;
  agg.conversions += c.last_30_days.conversions || 0;
  // Keep the highest budget seen (in case of multiple rows)
  if (c.budget_aud > agg.budget_aud) agg.budget_aud = c.budget_aud;
}
const campaigns = Array.from(campaignMap.values()).sort((a, b) => b.cost_aud - a.cost_aud);

// Aggregate keyword-level metrics
const keywordMap = new Map<string, any>();
for (const k of auditData.keywords) {
  const key = `${k.campaign_name}||${k.text}||${k.match_type}`;
  if (!keywordMap.has(key)) {
    keywordMap.set(key, {
      campaign_name: k.campaign_name,
      ad_group_name: k.ad_group_name,
      text: k.text,
      match_type: k.match_type,
      quality_score: k.quality_score,
      impressions: 0, clicks: 0, cost_aud: 0, conversions: 0,
    });
  }
  const agg = keywordMap.get(key);
  agg.impressions += k.last_30_days.impressions || 0;
  agg.clicks += k.last_30_days.clicks || 0;
  agg.cost_aud += k.last_30_days.cost_aud || 0;
  agg.conversions += k.last_30_days.conversions || 0;
}
const keywords = Array.from(keywordMap.values());

// Aggregate ad-level metrics
const adMap = new Map<string, any>();
for (const a of auditData.ads) {
  const key = a.ad_id;
  if (!adMap.has(key)) {
    adMap.set(key, {
      campaign_name: a.campaign_name,
      ad_group_name: a.ad_group_name,
      ad_id: a.ad_id,
      status: a.status,
      ad_strength: a.ad_strength,
      headlines: a.headlines,
      descriptions: a.descriptions,
      impressions: 0, clicks: 0, conversions: 0,
    });
  }
  const agg = adMap.get(key);
  agg.impressions += a.last_30_days.impressions || 0;
  agg.clicks += a.last_30_days.clicks || 0;
  agg.conversions += a.last_30_days.conversions || 0;
}
const ads = Array.from(adMap.values());

// Aggregate search terms
const searchTermMap = new Map<string, any>();
for (const st of auditData.searchTerms) {
  const key = `${st.campaign_name}||${st.search_term}`;
  if (!searchTermMap.has(key)) {
    searchTermMap.set(key, {
      campaign_name: st.campaign_name,
      ad_group_name: st.ad_group_name,
      search_term: st.search_term,
      impressions: 0, clicks: 0, cost_aud: 0, conversions: 0,
    });
  }
  const agg = searchTermMap.get(key);
  agg.impressions += st.impressions || 0;
  agg.clicks += st.clicks || 0;
  agg.cost_aud += st.cost_aud || 0;
  agg.conversions += st.conversions || 0;
}
const searchTerms = Array.from(searchTermMap.values());

// Total metrics
const totalSpend = campaigns.reduce((s, c) => s + c.cost_aud, 0);
const totalConversions = campaigns.reduce((s, c) => s + c.conversions, 0);
const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
const overallCAC = totalConversions > 0 ? totalSpend / totalConversions : 0;
const overallCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
const overallConvRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
const activeCampaigns = campaigns.filter(c => c.status === 2).length;

// Build report
const r: string[] = [];
r.push('═══════════════════════════════════════════════════════════════════');
r.push('           GOOGLE ADS COMPREHENSIVE AUDIT REPORT');
r.push(`           Period: ${periodFrom} to ${periodTo} (Last 30 Days)`);
r.push(`           Generated: ${new Date().toISOString()}`);
r.push('═══════════════════════════════════════════════════════════════════');
r.push('');
r.push('📊 EXECUTIVE SUMMARY');
r.push('');
r.push(`Total Spend (30d):          $${totalSpend.toFixed(2)}`);
r.push(`Total Conversions:          ${totalConversions.toFixed(1)}`);
r.push(`Overall CAC:                $${overallCAC.toFixed(2)}`);
r.push(`Total Impressions:          ${totalImpressions.toLocaleString()}`);
r.push(`Total Clicks:               ${totalClicks.toLocaleString()}`);
r.push(`Overall CTR:                ${overallCTR.toFixed(2)}%`);
r.push(`Overall Conv Rate:          ${overallConvRate.toFixed(2)}%`);
r.push(`Active Campaigns:           ${activeCampaigns}/${campaigns.length}`);
r.push('');

r.push('─────────────────────────────────────────────────────────────────');
r.push('📊 CAMPAIGN PERFORMANCE');
r.push('');

for (const c of campaigns) {
  const statusIcon = c.status === 2 ? '✅' : c.status === 3 ? '⏸️' : '❌';
  const cac = c.conversions > 0 ? c.cost_aud / c.conversions : 0;
  const ctr = c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0;
  const convRate = c.clicks > 0 ? (c.conversions / c.clicks) * 100 : 0;
  const cacIcon = cac === 0 && c.cost_aud > 0 ? '🔴' : cac > 150 ? '🔴' : cac > 100 ? '🟡' : '🟢';
  r.push(`${statusIcon} ${c.name}`);
  r.push(`   Status: ${statusMap[c.status] || c.status}`);
  r.push(`   Spend: $${c.cost_aud.toFixed(2)} | Conversions: ${c.conversions.toFixed(1)} | CAC: ${cacIcon} $${cac.toFixed(2)}`);
  r.push(`   Impressions: ${c.impressions.toLocaleString()} | Clicks: ${c.clicks.toLocaleString()}`);
  r.push(`   CTR: ${ctr.toFixed(2)}% | Conv Rate: ${convRate.toFixed(2)}%`);
  r.push(`   Daily Budget: $${c.budget_aud.toFixed(2)}`);
  r.push('');
}

r.push('─────────────────────────────────────────────────────────────────');
r.push('✅ WHAT\'S WORKING WELL');
r.push('');

// Profitable campaigns (CAC < $100)
const profitable = campaigns.filter(c => c.conversions > 0 && (c.cost_aud / c.conversions) < 100);
r.push(`Profitable Campaigns (CAC < $100) (${profitable.length}):`);
profitable.forEach(c => {
  const cac = c.cost_aud / c.conversions;
  r.push(`  • ${c.name}: $${cac.toFixed(2)} CAC, ${c.conversions.toFixed(1)} conv`);
});
r.push('');

// High CTR campaigns
const highCTR = campaigns.filter(c => c.impressions > 0 && (c.clicks / c.impressions) > 0.05);
r.push(`High CTR Campaigns (${highCTR.length} > 5%):`);
highCTR.forEach(c => {
  const ctr = (c.clicks / c.impressions) * 100;
  r.push(`  • ${c.name}: ${ctr.toFixed(2)}% CTR`);
});
r.push('');

// Top performing keywords by conversions
const topKeywords = keywords
  .filter(k => k.conversions > 0)
  .sort((a, b) => b.conversions - a.conversions)
  .slice(0, 10);
r.push('Top Performing Keywords (by conversions):');
topKeywords.forEach((k, i) => {
  const cac = k.conversions > 0 ? k.cost_aud / k.conversions : 0;
  const ctr = k.impressions > 0 ? (k.clicks / k.impressions) * 100 : 0;
  r.push(`  ${i + 1}. "${k.text}" [${matchTypeMap[k.match_type] || k.match_type}]`);
  r.push(`     Campaign: ${k.campaign_name}`);
  r.push(`     ${k.conversions.toFixed(1)} conv | CAC: $${cac.toFixed(2)} | CTR: ${ctr.toFixed(2)}% | Cost: $${k.cost_aud.toFixed(2)}`);
});
r.push('');

// Top performing ads
const enabledAds = ads.filter(a => a.status === 2 && a.impressions > 100);
const topAds = enabledAds
  .map(a => ({ ...a, ctr: a.impressions > 0 ? (a.clicks / a.impressions) * 100 : 0 }))
  .sort((a, b) => b.ctr - a.ctr)
  .slice(0, 5);
r.push('Top Performing Ads (by CTR, min 100 impr):');
topAds.forEach((ad, i) => {
  const headlines = (ad.headlines || []).map((h: any) => h.text).slice(0, 3).join(' | ');
  const convRate = ad.clicks > 0 ? (ad.conversions / ad.clicks) * 100 : 0;
  r.push(`  ${i + 1}. Campaign: ${ad.campaign_name}`);
  r.push(`     Ad Strength: ${ad.ad_strength}`);
  r.push(`     Headlines: ${headlines}`);
  r.push(`     CTR: ${ad.ctr.toFixed(2)}% | Conv Rate: ${convRate.toFixed(2)}%`);
  r.push(`     ${ad.conversions.toFixed(1)} conv from ${ad.clicks} clicks (${ad.impressions.toLocaleString()} impr)`);
});
r.push('');

r.push('─────────────────────────────────────────────────────────────────');
r.push('⚠️  ISSUES & OPPORTUNITIES');
r.push('');

// High CAC campaigns
const highCAC = campaigns.filter(c => c.conversions > 0 && (c.cost_aud / c.conversions) > 150);
const noConvWithSpend = campaigns.filter(c => c.conversions === 0 && c.cost_aud > 50);
if (highCAC.length > 0 || noConvWithSpend.length > 0) {
  r.push(`🔴 Critical: CAC > $150 or Zero Conversions with Spend (${highCAC.length + noConvWithSpend.length}):`);
  highCAC.forEach(c => {
    const cac = c.cost_aud / c.conversions;
    r.push(`  • ${c.name}: CAC $${cac.toFixed(2)} (${c.conversions.toFixed(1)} conv on $${c.cost_aud.toFixed(2)} spend)`);
    r.push('    → Recommend: Pause or reduce budget by 50%, audit landing page');
  });
  noConvWithSpend.forEach(c => {
    r.push(`  • ${c.name}: $${c.cost_aud.toFixed(2)} spent, 0 conversions`);
    r.push('    → Recommend: Verify conversion tracking, then pause if confirmed broken');
  });
  r.push('');
}

// Low CTR campaigns
const lowCTR = campaigns.filter(c => c.impressions > 1000 && (c.clicks / c.impressions) < 0.03);
if (lowCTR.length > 0) {
  r.push(`🟡 Low CTR (${lowCTR.length} < 3% with 1000+ impressions):`);
  lowCTR.forEach(c => {
    const ctr = (c.clicks / c.impressions) * 100;
    r.push(`  • ${c.name}: ${ctr.toFixed(2)}% CTR`);
    r.push('    → Recommend: Refresh ad copy, review keyword relevance');
  });
  r.push('');
}

// Low conversion rate
const lowConvRate = campaigns.filter(c => c.clicks > 100 && (c.conversions / c.clicks) < 0.02);
if (lowConvRate.length > 0) {
  r.push(`🟡 Low Conversion Rate (${lowConvRate.length} < 2% with 100+ clicks):`);
  lowConvRate.forEach(c => {
    const convRate = (c.conversions / c.clicks) * 100;
    r.push(`  • ${c.name}: ${convRate.toFixed(2)}% conv rate ($${c.cost_aud.toFixed(2)} spent, ${c.conversions.toFixed(1)} conv)`);
    r.push('    → Recommend: Review landing page, target audience');
  });
  r.push('');
}

// Wasted spend (keywords with 0 conversions and >$30 spent)
const wastedKeywords = keywords
  .filter(k => k.conversions === 0 && k.cost_aud > 30)
  .sort((a, b) => b.cost_aud - a.cost_aud);
const totalWaste = wastedKeywords.reduce((s, k) => s + k.cost_aud, 0);
r.push(`💸 Wasted Spend (keywords with $30+ spent and 0 conversions):`);
r.push(`  Total wasted: $${totalWaste.toFixed(2)} on ${wastedKeywords.length} keywords`);
wastedKeywords.slice(0, 15).forEach(k => {
  r.push(`  • "${k.text}" [${matchTypeMap[k.match_type]}]: $${k.cost_aud.toFixed(2)} spent, ${k.clicks} clicks (${k.campaign_name})`);
});
r.push('');

// Negative keyword opportunities (search terms with 0 conv and high spend)
const negativeOpps = searchTerms
  .filter(st => st.conversions === 0 && st.cost_aud > 5)
  .sort((a, b) => b.cost_aud - a.cost_aud)
  .slice(0, 25);
if (negativeOpps.length > 0) {
  const totalNegOpp = negativeOpps.reduce((s, st) => s + st.cost_aud, 0);
  r.push(`🚫 Negative Keyword Opportunities (search terms ≥$5 spend, 0 conv):`);
  r.push(`  Potential savings: $${totalNegOpp.toFixed(2)} (top ${negativeOpps.length})`);
  negativeOpps.forEach(st => {
    r.push(`  • "${st.search_term}": ${st.impressions} impr, $${st.cost_aud.toFixed(2)} spent, 0 conv (${st.campaign_name})`);
    r.push('    → Add as negative keyword');
  });
  r.push('');
}

// Quality Score issues
const lowQS = keywords.filter(k => k.quality_score > 0 && k.quality_score < 5);
const criticalQS = lowQS.filter(k => k.quality_score < 3);
if (lowQS.length > 0) {
  const lowQSCost = lowQS.reduce((s, k) => s + k.cost_aud, 0);
  r.push(`⚠️  Quality Score Issues (${lowQS.length} keywords with QS < 5):`);
  r.push(`  Wasted on low QS: $${lowQSCost.toFixed(2)}`);
  if (criticalQS.length > 0) {
    r.push(`  Critical (QS 1-2) — pause immediately (${criticalQS.length}):`);
    criticalQS.slice(0, 10).forEach(k => {
      r.push(`    • "${k.text}" [QS ${k.quality_score}]: $${k.cost_aud.toFixed(2)} spent, ${k.conversions} conv (${k.campaign_name})`);
    });
  }
  r.push('');
}

// Search terms to add as positive keywords (converting search terms not yet keywords)
const existingKeywordTexts = new Set(keywords.map(k => k.text.toLowerCase()));
const newKeywordOpps = searchTerms
  .filter(st => st.conversions > 0 && !existingKeywordTexts.has(st.search_term.toLowerCase()))
  .sort((a, b) => b.conversions - a.conversions)
  .slice(0, 10);
if (newKeywordOpps.length > 0) {
  r.push(`🌱 Search Terms to Add as Keywords (converting, not yet keywords):`);
  newKeywordOpps.forEach(st => {
    const cac = st.conversions > 0 ? st.cost_aud / st.conversions : 0;
    r.push(`  • "${st.search_term}": ${st.conversions.toFixed(1)} conv, $${cac.toFixed(2)} CAC (${st.campaign_name})`);
    r.push('    → Add as EXACT match keyword');
  });
  r.push('');
}

r.push('─────────────────────────────────────────────────────────────────');
r.push('💡 PRIORITY RECOMMENDATIONS');
r.push('');

let recNum = 1;
if (highCAC.length > 0 || noConvWithSpend.length > 0) {
  r.push(`${recNum}. CRITICAL: Address campaigns with high CAC or zero conversions`);
  highCAC.forEach(c => {
    const cac = c.cost_aud / c.conversions;
    r.push(`   • ${c.name}: CAC $${cac.toFixed(2)} — pause or reduce budget by 50%`);
  });
  noConvWithSpend.forEach(c => {
    r.push(`   • ${c.name}: $${c.cost_aud.toFixed(2)} spent, 0 conv — verify tracking`);
  });
  r.push('');
  recNum++;
}

if (negativeOpps.length > 0) {
  const monthlySavings = negativeOpps.reduce((s, st) => s + st.cost_aud, 0);
  r.push(`${recNum}. HIGH: Add negative keywords to reduce wasted spend`);
  r.push(`   Estimated monthly savings: $${monthlySavings.toFixed(2)}`);
  r.push(`   Top 5 to add immediately:`);
  negativeOpps.slice(0, 5).forEach(st => {
    r.push(`   • "${st.search_term}" — $${st.cost_aud.toFixed(2)} wasted`);
  });
  r.push('');
  recNum++;
}

if (newKeywordOpps.length > 0) {
  r.push(`${recNum}. MEDIUM: Add converting search terms as keywords`);
  r.push(`   ${newKeywordOpps.length} converting search terms not yet added as keywords`);
  r.push('   → Run scripts/add-winning-keywords.ts after edit');
  r.push('');
  recNum++;
}

if (criticalQS.length > 0) {
  r.push(`${recNum}. MEDIUM: Pause keywords with Quality Score 1-2 (${criticalQS.length} keywords)`);
  r.push('   These are dragging down account-wide CPCs');
  r.push('');
  recNum++;
}

if (lowConvRate.length > 0) {
  r.push(`${recNum}. LOW: Improve conversion rate on under-performing campaigns`);
  lowConvRate.forEach(c => {
    r.push(`   • ${c.name}: review landing page UX, social proof, CTA clarity`);
  });
  r.push('');
  recNum++;
}

r.push('═══════════════════════════════════════════════════════════════════');
r.push('                         END OF REPORT');
r.push('═══════════════════════════════════════════════════════════════════');

const reportPath = path.join(
  __dirname, '..', '..', 'data',
  `google-ads-audit_${periodFrom}_${periodTo}.txt`
);
fs.writeFileSync(reportPath, r.join('\n'));
console.log(`✅ Report written to: ${reportPath}`);
console.log(`   Period: ${periodFrom} to ${periodTo}`);
console.log(`   Spend: $${totalSpend.toFixed(2)} | Conv: ${totalConversions.toFixed(1)} | CAC: $${overallCAC.toFixed(2)}`);
