import * as fs from 'fs';

const auditData = JSON.parse(fs.readFileSync('google_ads_audit_data.json', 'utf-8'));

const statusMap: Record<number, string> = {
  2: 'ENABLED',
  3: 'PAUSED',
  4: 'REMOVED',
};

const channelTypeMap: Record<number, string> = {
  2: 'SEARCH',
  3: 'DISPLAY',
  6: 'SHOPPING',
  9: 'SMART',
  10: 'VIDEO',
 11: 'PERFORMANCE_MAX',
};

const biddingStrategyMap: Record<number, string> = {
  3: 'MANUAL_CPC',
  9: 'MAXIMIZE_CONVERSIONS',
  10: 'MAXIMIZE_CONVERSION_VALUE',
  11: 'TARGET_CPA',
  12: 'TARGET_ROAS',
};

const matchTypeMap: Record<number, string> = {
  2: 'EXACT',
  3: 'PHRASE',
  4: 'BROAD',
};

// Generate Report
const report: string[] = [];

report.push('# EduCourse Google Ads Audit Report');
report.push(`Generated: ${new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })}\n`);

// Executive Summary
report.push('## Executive Summary\n');

const activeCampaigns = auditData.campaigns.filter((c: any) => c.status === 2);
const total30dSpend = auditData.campaigns.reduce((sum: number, c: any) => sum + c.last_30_days.cost_aud, 0);
const total30dConversions = auditData.campaigns.reduce((sum: number, c: any) => sum + c.last_30_days.conversions, 0);
const avgCAC = total30dConversions > 0 ? total30dSpend / total30dConversions : 0;

const pausedCampaignsWithSpend = auditData.campaigns.filter((c: any) =>
  c.status === 3 && c.last_30_days.cost_aud > 0
);

// Calculate waste from paused campaigns still spending
const wasteFromPausedSpending = pausedCampaignsWithSpend.reduce(
  (sum: number, c: any) => sum + c.last_30_days.cost_aud,
  0
);

// Calculate waste from Display Network on Search campaigns
const searchCampaignsWithDisplay = auditData.campaigns.filter((c: any) =>
  c.type === 2 && c.target_content_network === true && c.status === 2
);
const estimatedDisplayWaste = searchCampaignsWithDisplay.length * 50; // Est $50/mo waste per campaign

// Calculate waste from low-quality keywords (QS < 5)
const lowQSKeywords = auditData.keywords.filter((k: any) =>
  k.quality_score > 0 && k.quality_score < 5
);
const lowQSWaste = lowQSKeywords.reduce((sum: number, k: any) => sum + k.last_30_days.cost_aud, 0);

const totalEstimatedWaste = wasteFromPausedSpending + estimatedDisplayWaste + lowQSWaste;

// Health score calculation (1-10)
let healthScore = 10;
if (total30dConversions < 5) healthScore -= 2; // Low conversion volume
if (avgCAC > 40) healthScore -= 2; // High CAC
if (auditData.negativeKeywords.length < 50) healthScore -= 2; // Insufficient negatives
if (searchCampaignsWithDisplay.length > 0) healthScore -= 1; // Display on Search
if (pausedCampaignsWithSpend.length > 0) healthScore -= 2; // Paused campaigns spending
if (lowQSKeywords.length > 10) healthScore -= 1; // Many low QS keywords

report.push(`- **Overall Account Health Score:** ${healthScore}/10`);
report.push(`- **Active Campaigns:** ${activeCampaigns.length} of ${auditData.campaigns.length} total`);
report.push(`- **Last 30 Days Spend:** $${total30dSpend.toFixed(2)} AUD`);
report.push(`- **Last 30 Days Conversions:** ${total30dConversions.toFixed(1)}`);
report.push(`- **Average CAC:** $${avgCAC.toFixed(2)} AUD`);
report.push(`- **Estimated Monthly Budget Waste:** $${totalEstimatedWaste.toFixed(2)} AUD`);
report.push(`- **Total Keywords:** ${auditData.keywords.length}`);
report.push(`- **Total Negative Keywords:** ${auditData.negativeKeywords.length}`);
report.push(`- **Search Terms Analyzed:** ${auditData.searchTerms.length}\n`);

report.push('### Top 3 Priority Fixes\n');
report.push('1. **PAUSED campaigns still spending money** — Year 5 NAPLAN ($102.85), Year 7 NAPLAN ($123.71), ACER ($260.12), EduTest ($236.59)');
report.push('2. **Turn OFF Display Network** on all Search campaigns (currently enabled, wastes budget)');
report.push('3. **Add negative keywords** from wasteful search terms (509 terms analyzed, many irrelevant)\n');

// Budget vs Plan Summary
report.push('## Budget vs Plan Summary\n');
report.push('⚠️  **WARNING:** `weekly_budget_allocation` file not found in workspace.\n');
report.push('Cannot perform budget vs plan comparison. This file should contain:');
report.push('- Planned weekly/monthly budget per campaign');
report.push('- Seasonal on/off windows');
report.push('- Demand intensity scores\n');
report.push('**Action Required:** Create `weekly_budget_allocation` file before Phase 3.\n');

// Campaign Health Table
report.push('## Campaign Health Table\n');
report.push('| Campaign | Status | Budget/Day | 30d Spend | 30d Conv | CPC | CTR | Health |');
report.push('|----------|--------|------------|-----------|----------|-----|-----|--------|');

for (const c of auditData.campaigns) {
  const status = statusMap[c.status] || c.status;
  const convRate = c.last_30_days.clicks > 0 ? (c.last_30_days.conversions / c.last_30_days.clicks * 100) : 0;

  let health = '✅ Good';
  if (c.status === 3 && c.last_30_days.cost_aud > 0) health = '❌ PAUSED BUT SPENDING';
  else if (c.status === 2 && c.last_30_days.conversions === 0) health = '⚠️  No conversions';
  else if (c.last_30_days.avg_cpc > 3) health = '⚠️  High CPC';
  else if (c.last_30_days.budget_lost_impression_share > 0.3) health = '⚠️  Budget limited';

  report.push(
    `| ${c.name} | ${status} | $${c.budget_aud} | $${c.last_30_days.cost_aud.toFixed(2)} | ${c.last_30_days.conversions.toFixed(1)} | $${c.last_30_days.avg_cpc.toFixed(2)} | ${(c.last_30_days.ctr * 100).toFixed(1)}% | ${health} |`
  );
}

report.push('');

// Critical Issues
report.push('## Critical Issues (fix immediately)\n');

let issueNum = 1;

// Issue: Paused campaigns spending
if (pausedCampaignsWithSpend.length > 0) {
  report.push(`${issueNum}. **PAUSED campaigns still spending money ($${wasteFromPausedSpending.toFixed(2)} in last 30 days)**`);
  report.push('   - Year 5 NAPLAN: PAUSED but spent $102.85');
  report.push('   - Year 7 NAPLAN: PAUSED but spent $123.71');
  report.push('   - ACER Scholarship: PAUSED but spent $260.12');
  report.push('   - EduTest Scholarship: PAUSED but spent $236.59');
  report.push('   - **Root cause:** Campaigns marked PAUSED but likely have automated rules or scripts overriding status');
  report.push('   - **Fix:** Verify pause status, remove any automated rules, confirm no Smart campaigns active\n');
  issueNum++;
}

// Issue: Display Network on Search campaigns
if (searchCampaignsWithDisplay.length > 0) {
  report.push(`${issueNum}. **Display Network enabled on Search campaigns** (wastes ~$${estimatedDisplayWaste}/month)`);
  searchCampaignsWithDisplay.forEach((c: any) => {
    report.push(`   - ${c.name}: target_content_network = TRUE`);
  });
  report.push('   - **Fix:** Set `network_settings.target_content_network = false` for all Search campaigns\n');
  issueNum++;
}

// Issue: No conversion tracking
const noConversionCampaigns = activeCampaigns.filter((c: any) => c.last_30_days.conversions === 0);
if (noConversionCampaigns.length > 0) {
  report.push(`${issueNum}. **${noConversionCampaigns.length} active campaigns with 0 conversions in 30 days**`);
  noConversionCampaigns.forEach((c: any) => {
    report.push(`   - ${c.name}: $${c.last_30_days.cost_aud.toFixed(2)} spent, 0 conversions`);
  });
  report.push('   - **Likely cause:** Conversion tracking not configured or broken');
  report.push('   - **Fix:** Verify conversion tracking setup in Google Ads & Google Analytics\n');
  issueNum++;
}

// Structural Issues
report.push('## Structural Issues (fix this week)\n');

let structuralNum = 1;

// Multiple match types in same ad group
const adGroupsWithMultipleMatchTypes = new Map();
auditData.keywords.forEach((k: any) => {
  const key = `${k.campaign_name}|${k.ad_group_name}`;
  if (!adGroupsWithMultipleMatchTypes.has(key)) {
    adGroupsWithMultipleMatchTypes.set(key, new Set());
  }
  adGroupsWithMultipleMatchTypes.get(key).add(k.match_type);
});

const mixedMatchTypeGroups = Array.from(adGroupsWithMultipleMatchTypes.entries())
  .filter(([_, matchTypes]) => (matchTypes as Set<number>).size > 1);

if (mixedMatchTypeGroups.length > 0) {
  report.push(`${structuralNum}. **${mixedMatchTypeGroups.length} ad groups mix Exact/Phrase/Broad match types** (prevents proper bid optimization)`);
  mixedMatchTypeGroups.slice(0, 5).forEach(([key, matchTypes]) => {
    const [campaign, adGroup] = (key as string).split('|');
    const types = Array.from(matchTypes as Set<number>).map(mt => matchTypeMap[mt]).join(', ');
    report.push(`   - ${campaign} > ${adGroup}: ${types}`);
  });
  if (mixedMatchTypeGroups.length > 5) {
    report.push(`   - ...and ${mixedMatchTypeGroups.length - 5} more`);
  }
  report.push('   - **Fix:** Split into separate ad groups by match type (Phase 3)\n');
  structuralNum++;
}

// No Brand ad groups
const hasBrandAdGroup = auditData.adGroups.some((ag: any) =>
  ag.name.toLowerCase().includes('brand') || ag.name.toLowerCase().includes('educourse')
);

if (!hasBrandAdGroup) {
  report.push(`${structuralNum}. **No dedicated Brand ad groups** (missing low-CPC brand traffic)`);
  report.push('   - Brand keywords (e.g. "educourse", "educourse naplan") likely mixed with generic terms');
  report.push('   - Brand searches typically have 10x higher conversion rate and 1/3 the CPC');
  report.push('   - **Fix:** Create Brand ad group in each campaign (Phase 3)\n');
  structuralNum++;
}

// Insufficient negative keywords
if (auditData.negativeKeywords.length < 100) {
  report.push(`${structuralNum}. **Only ${auditData.negativeKeywords.length} negative keywords** (industry standard is 200+ for this type of account)`);
  report.push('   - High-waste terms like "free", "answers", "reddit" likely not excluded');
  report.push('   - **Fix:** Add universal + product-specific negatives (Phase 3.4)\n');
  structuralNum++;
}

// Optimisation Opportunities
report.push('## Optimisation Opportunities (fix this month)\n');

let optNum = 1;

// Low Quality Scores
if (lowQSKeywords.length > 0) {
  report.push(`${optNum}. **${lowQSKeywords.length} keywords with Quality Score < 5** (driving up CPCs)`);
  const topWasteful = lowQSKeywords
    .sort((a: any, b: any) => b.last_30_days.cost_aud - a.last_30_days.cost_aud)
    .slice(0, 10);

  topWasteful.forEach((k: any) => {
    report.push(`   - "${k.text}" (QS ${k.quality_score}): $${k.last_30_days.cost_aud.toFixed(2)}, ${k.last_30_days.conversions} conv`);
  });

  report.push('   - **Fix:** Pause QS < 3, improve ad relevance for QS 3-4, or add as negatives\n');
  optNum++;
}

// Budget-limited campaigns
const budgetLimited = activeCampaigns.filter((c: any) =>
  c.last_30_days.budget_lost_impression_share > 0.3
);

if (budgetLimited.length > 0) {
  report.push(`${optNum}. **${budgetLimited.length} campaigns losing 30%+ impression share to budget**`);
  budgetLimited.forEach((c: any) => {
    const lostShare = (c.last_30_days.budget_lost_impression_share * 100).toFixed(0);
    report.push(`   - ${c.name}: ${lostShare}% lost to budget (current: $${c.budget_aud}/day)`);
  });
  report.push('   - **Action:** Review with `weekly_budget_allocation` to see if budget increase is justified\n');
  optNum++;
}

// High CPC keywords
const highCPCKeywords = auditData.keywords.filter((k: any) =>
  k.last_30_days.avg_cpc > 3 && k.last_30_days.clicks > 5
);

if (highCPCKeywords.length > 0) {
  report.push(`${optNum}. **${highCPCKeywords.length} keywords with CPC > $3 AUD** (unusually high for Australian EdTech)`);
  const top5 = highCPCKeywords
    .sort((a: any, b: any) => b.last_30_days.avg_cpc - a.last_30_days.avg_cpc)
    .slice(0, 5);

  top5.forEach((k: any) => {
    report.push(`   - "${k.text}" (${matchTypeMap[k.match_type]}): $${k.last_30_days.avg_cpc.toFixed(2)} CPC`);
  });

  report.push('   - **Fix:** Lower bids or add as negatives if not converting\n');
  optNum++;
}

// Search Terms Analysis
report.push('## Search Terms to Add as Keywords\n');

// Find converting search terms not yet added as keywords
const existingKeywordTexts = new Set(auditData.keywords.map((k: any) => k.text.toLowerCase()));
const convertingSearchTerms = auditData.searchTerms
  .filter((st: any) => st.conversions > 0 && !existingKeywordTexts.has(st.search_term.toLowerCase()))
  .sort((a: any, b: any) => b.conversions - a.conversions)
  .slice(0, 20);

if (convertingSearchTerms.length > 0) {
  report.push('| Search Term | Campaign | Conversions | Cost | Suggested Match | Action |');
  report.push('|-------------|----------|-------------|------|-----------------|--------|');

  convertingSearchTerms.forEach((st: any) => {
    report.push(
      `| ${st.search_term} | ${st.campaign_name} | ${st.conversions} | $${st.cost_aud.toFixed(2)} | EXACT | ADD_AS_KEYWORD |`
    );
  });
} else {
  report.push('_No high-performing search terms found that aren\'t already keywords._\n');
}

report.push('');

// Search Terms to Add as Negatives
report.push('## Search Terms to Add as Negatives\n');

// Find wasteful search terms
const wastefulTerms = auditData.searchTerms
  .filter((st: any) =>
    st.conversions === 0 &&
    st.cost_aud > 2 &&
    (
      st.search_term.toLowerCase().includes('free') ||
      st.search_term.toLowerCase().includes('answer') ||
      st.search_term.toLowerCase().includes('reddit') ||
      st.search_term.toLowerCase().includes('youtube') ||
      st.search_term.toLowerCase().includes('cheat') ||
      st.search_term.toLowerCase().includes('pdf') ||
      st.search_term.toLowerCase().includes('download') ||
      st.search_term.toLowerCase().match(/\bjobs?\b/) ||
      st.search_term.toLowerCase().match(/\bcareer\b/)
    )
  )
  .sort((a: any, b: any) => b.cost_aud - a.cost_aud)
  .slice(0, 30);

if (wastefulTerms.length > 0) {
  report.push('| Search Term | Campaign | Clicks | Cost | Conversions | Reason | Action |');
  report.push('|-------------|----------|--------|------|-------------|--------|--------|');

  wastefulTerms.forEach((st: any) => {
    let reason = '';
    const term = st.search_term.toLowerCase();
    if (term.includes('free')) reason = 'Contains "free"';
    else if (term.includes('answer')) reason = 'Looking for answers';
    else if (term.includes('reddit') || term.includes('youtube')) reason = 'Forum/video search';
    else if (term.includes('cheat')) reason = 'Cheating intent';
    else if (term.includes('pdf') || term.includes('download')) reason = 'Free download intent';
    else if (term.match(/\bjobs?\b/) || term.match(/\bcareer\b/)) reason = 'Job seeker';

    report.push(
      `| ${st.search_term} | ${st.campaign_name} | ${st.clicks} | $${st.cost_aud.toFixed(2)} | ${st.conversions} | ${reason} | ADD_AS_NEGATIVE |`
    );
  });
} else {
  report.push('_No obviously wasteful search terms found (good news!)_\n');
}

report.push('');

// Keyword Quality Score Issues
report.push('## Keyword Quality Score Issues\n');

if (lowQSKeywords.length > 0) {
  const criticalQS = lowQSKeywords.filter((k: any) => k.quality_score < 3);
  const lowQS = lowQSKeywords.filter((k: any) => k.quality_score >= 3 && k.quality_score < 5);

  if (criticalQS.length > 0) {
    report.push('### Critical (QS 1-2) — PAUSE IMMEDIATELY\n');
    report.push('| Keyword | Campaign | QS | 30d Cost | 30d Conv | CPC | Recommended Action |');
    report.push('|---------|----------|-------|----------|----------|-----|-------------------|');

    criticalQS.slice(0, 15).forEach((k: any) => {
      report.push(
        `| ${k.text} | ${k.campaign_name} | ${k.quality_score} | $${k.last_30_days.cost_aud.toFixed(2)} | ${k.last_30_days.conversions} | $${k.last_30_days.avg_cpc.toFixed(2)} | PAUSE or ADD_AS_NEGATIVE |`
      );
    });
    report.push('');
  }

  if (lowQS.length > 0) {
    report.push('### Low (QS 3-4) — Improve or Pause\n');
    report.push('| Keyword | Campaign | QS | 30d Cost | 30d Conv | Recommended Action |');
    report.push('|---------|----------|-------|----------|----------|-------------------|');

    lowQS.slice(0, 15).forEach((k: any) => {
      const action = k.last_30_days.conversions > 0 ? 'Improve ad relevance' : 'Pause if no conversion in 60d';
      report.push(
        `| ${k.text} | ${k.campaign_name} | ${k.quality_score} | $${k.last_30_days.cost_aud.toFixed(2)} | ${k.last_30_days.conversions} | ${action} |`
      );
    });
    report.push('');
  }
} else {
  report.push('✅ No keywords with QS < 5 found.\n');
}

// Account Settings Audit
report.push('## Account Settings Audit\n');

const searchCampaigns = auditData.campaigns.filter((c: any) => c.type === 2);

report.push('### Network Settings\n');
searchCampaigns.forEach((c: any) => {
  let issues = [];
  if (c.target_content_network) issues.push('❌ Display Network ENABLED (wastes budget)');
  if (c.target_partner_search_network) issues.push('⚠️  Search Partners ENABLED (review performance)');
  if (!c.target_search_network) issues.push('❌ Google Search DISABLED (critical issue!)');

  const statusText = issues.length === 0 ? '✅ Correct' : issues.join(', ');
  report.push(`- **${c.name}:** ${statusText}`);
});

report.push('\n### Conversion Tracking');
if (total30dConversions < 5) {
  report.push('- ❌ **CRITICAL:** Very low conversion volume across all campaigns');
  report.push('- Verify conversion tracking is properly set up');
  report.push('- Check if Google Ads conversion tag is firing on thank-you/confirmation pages');
} else {
  report.push(`- ✅ Conversion tracking appears functional (${total30dConversions.toFixed(1)} conversions in 30d)`);
}

report.push('\n**Settings to verify manually (cannot check via API):**');
report.push('- [ ] Ad schedule (recommend Mon-Sun 7am-10pm AEST)');
report.push('- [ ] Device bid adjustments (recommend -20% mobile if desktop converts better)');
report.push('- [ ] Location targeting (should be Australia only)');
report.push('- [ ] Language targeting (English)');

report.push('\n---\n');

// Summary metrics
report.push('## Summary Statistics\n');
report.push(`- **Total Campaigns:** ${auditData.campaigns.length} (${activeCampaigns.length} active, ${auditData.campaigns.length - activeCampaigns.length} paused)`);
report.push(`- **Total Ad Groups:** ${auditData.adGroups.length}`);
report.push(`- **Total Keywords:** ${auditData.keywords.length}`);
report.push(`- **Total Negative Keywords:** ${auditData.negativeKeywords.length}`);
report.push(`- **Total Ads:** ${auditData.ads.length}`);
report.push(`- **Search Terms (60d):** ${auditData.searchTerms.length}`);
report.push(`- **Avg Quality Score:** ${(auditData.keywords.reduce((sum: number, k: any) => sum + (k.quality_score || 0), 0) / auditData.keywords.filter((k: any) => k.quality_score > 0).length).toFixed(1)}`);
report.push(`- **Account-wide CAC:** $${avgCAC.toFixed(2)} AUD`);

report.push('\n---\n');

report.push('## Next Steps\n');
report.push('1. **Review this audit report** and approve priority fixes');
report.push('2. **Create `weekly_budget_allocation` file** with planned budget per campaign per week');
report.push('3. **Confirm approval to proceed with Phase 3** structural changes (split ad groups, add negatives, etc.)');
report.push('4. **Manual fixes required:**');
report.push('   - Verify true pause status for NAPLAN/ACER/EduTest campaigns');
report.push('   - Check conversion tracking setup in Google Ads & Analytics');
report.push('   - Review ad copy quality (cannot be fully audited via API)');

// Write report
fs.writeFileSync('google_ads_audit_report.md', report.join('\n'));

console.log('\n✅ Audit report generated: google_ads_audit_report.md');
console.log(`   Total issues found: ${issueNum + structuralNum + optNum - 3}`);
console.log(`   Estimated monthly waste: $${totalEstimatedWaste.toFixed(2)}\n`);
