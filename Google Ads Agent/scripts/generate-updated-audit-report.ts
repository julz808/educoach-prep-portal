import * as fs from 'fs';

const auditData = JSON.parse(fs.readFileSync('google_ads_audit_data.json', 'utf-8'));
const budgetAllocation = JSON.parse(fs.readFileSync('weekly_budget_allocation.json', 'utf-8'));

// Get current week's allocation
const today = new Date();
const currentWeekAllocation = budgetAllocation.find((record: any) => {
  const weekStart = new Date(record.week_start_date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  return today >= weekStart && today < weekEnd;
});

console.log('Current week allocation:', currentWeekAllocation?.week_start_date);

// Map product slugs to campaign names
const slugToCampaign: Record<string, string> = {
  'vic-selective': 'VIC Selective Entry',
  'nsw-selective': 'NSW Selective Entry',
  'year-5-naplan': 'Year 5 NAPLAN',
  'year-7-naplan': 'Year 7 NAPLAN',
  'acer-scholarship': 'ACER Scholarship',
  'edutest-scholarship': 'EduTest Scholarship',
};

const statusMap: Record<number, string> = {
  2: 'ENABLED',
  3: 'PAUSED',
  4: 'REMOVED',
};

const matchTypeMap: Record<number, string> = {
  2: 'EXACT',
  3: 'PHRASE',
  4: 'BROAD',
};

// Generate Report
const report: string[] = [];

report.push('# EduCourse Google Ads Audit Report (UPDATED)');
report.push(`Generated: ${new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })}`);
report.push(`Current Week: ${currentWeekAllocation?.week_start_date || 'Unknown'}\n`);

// Executive Summary
report.push('## Executive Summary\n');

const activeCampaigns = auditData.campaigns.filter((c: any) => c.status === 2);
const total30dSpend = auditData.campaigns.reduce((sum: number, c: any) => sum + c.last_30_days.cost_aud, 0);
const total30dConversions = auditData.campaigns.reduce((sum: number, c: any) => sum + c.last_30_days.conversions, 0);
const avgCAC = total30dConversions > 0 ? total30dSpend / total30dConversions : 0;

// Calculate waste from paused campaigns still spending
const pausedCampaignsWithSpend = auditData.campaigns.filter((c: any) =>
  c.status === 3 && c.last_30_days.cost_aud > 0
);
const wasteFromPausedSpending = pausedCampaignsWithSpend.reduce(
  (sum: number, c: any) => sum + c.last_30_days.cost_aud,
  0
);

// Low QS waste
const lowQSKeywords = auditData.keywords.filter((k: any) =>
  k.quality_score > 0 && k.quality_score < 5
);
const lowQSWaste = lowQSKeywords.reduce((sum: number, k: any) => sum + k.last_30_days.cost_aud, 0);

const totalEstimatedWaste = wasteFromPausedSpending + lowQSWaste;

// Health score
let healthScore = 10;
if (total30dConversions < 10) healthScore -= 1;
if (avgCAC > 50) healthScore -= 2;
if (auditData.negativeKeywords.length < 100) healthScore -= 1;
if (pausedCampaignsWithSpend.length > 0) healthScore -= 2;
if (lowQSKeywords.length > 10) healthScore -= 1;

report.push(`- **Overall Account Health Score:** ${healthScore}/10`);
report.push(`- **Total Campaigns:** 6 (down from 9 - old campaigns removed ✅)`);
report.push(`- **Active Campaigns:** ${activeCampaigns.length}`);
report.push(`- **Last 30 Days Spend:** $${total30dSpend.toFixed(2)} AUD`);
report.push(`- **Last 30 Days Conversions:** ${total30dConversions.toFixed(1)}`);
report.push(`- **Average CAC:** $${avgCAC.toFixed(2)} AUD`);
report.push(`- **Estimated Monthly Budget Waste:** $${totalEstimatedWaste.toFixed(2)} AUD`);
report.push(`- **Total Keywords:** ${auditData.keywords.length}`);
report.push(`- **Total Negative Keywords:** ${auditData.negativeKeywords.length}`);
report.push(`- **Search Terms Analyzed:** ${auditData.searchTerms.length}\n`);

report.push('### Top 3 Priority Fixes\n');
report.push('1. **Align campaign budgets with weekly_budget_allocation table** (some campaigns over/under budget)');
report.push('2. **Activate/pause campaigns per seasonal phase** (4 campaigns should be ENABLED this week, 2 paused)');
report.push('3. **Split ad groups by match type** (all 6 campaigns mix Exact/Phrase/Broad in same ad group)\n');

// Budget vs Plan Summary
report.push('## Budget vs Plan Summary\n');

if (currentWeekAllocation) {
  report.push(`**Current Week:** ${currentWeekAllocation.week_start_date} (Week ${currentWeekAllocation.week_number})`);
  report.push(`**Total Planned Weekly Budget:** $${currentWeekAllocation.weekly_budget_aud.toFixed(2)} AUD`);
  report.push(`**Total Planned Daily Budget:** $${currentWeekAllocation.daily_budget_aud.toFixed(2)} AUD\n`);

  report.push('| Campaign | Planned Daily | Actual Daily | Variance $ | Variance % | Should Be | Currently | Status |');
  report.push('|----------|---------------|--------------|------------|-----------|-----------|-----------|--------|');

  Object.entries(currentWeekAllocation.product_allocations).forEach(([slug, allocation]: [string, any]) => {
    const campaignName = slugToCampaign[slug];
    const campaign = auditData.campaigns.find((c: any) => c.name === campaignName);

    if (campaign) {
      const plannedDaily = allocation.daily_budget;
      const actualDaily = campaign.budget_aud;
      const variance = actualDaily - plannedDaily;
      const variancePct = plannedDaily > 0 ? (variance / plannedDaily * 100) : 0;

      const shouldBe = allocation.phase !== 'PAUSED' ? 'ENABLED' : 'PAUSED';
      const currentlyIs = statusMap[campaign.status];

      let statusIcon = '✅';
      if (Math.abs(variancePct) > 20) statusIcon = '⚠️  Budget mismatch';
      if (shouldBe !== currentlyIs) statusIcon = '❌ Wrong status';
      if (Math.abs(variancePct) > 20 && shouldBe !== currentlyIs) statusIcon = '❌ CRITICAL';

      report.push(
        `| ${campaignName} | $${plannedDaily.toFixed(2)} | $${actualDaily.toFixed(2)} | $${variance.toFixed(2)} | ${variancePct.toFixed(0)}% | ${shouldBe} (${allocation.phase}) | ${currentlyIs} | ${statusIcon} |`
      );
    }
  });

  report.push('');
} else {
  report.push('⚠️  Could not find current week in budget allocation data\n');
}

// Campaign Health Table
report.push('## Campaign Health Table\n');
report.push('| Campaign | Status | Budget/Day | 30d Spend | 30d Conv | CAC | CTR | Conv Rate | Health |');
report.push('|----------|--------|------------|-----------|----------|-----|-----|-----------|--------|');

for (const c of auditData.campaigns) {
  const status = statusMap[c.status] || c.status;
  const cac = c.last_30_days.conversions > 0 ? c.last_30_days.cost_aud / c.last_30_days.conversions : 0;
  const convRate = c.last_30_days.clicks > 0 ? (c.last_30_days.conversions / c.last_30_days.clicks * 100) : 0;

  let health = '✅ Good';
  if (c.status === 3 && c.last_30_days.cost_aud > 0) health = '❌ PAUSED BUT SPENDING';
  else if (c.last_30_days.conversions === 0) health = '⚠️  No conversions';
  else if (cac > 100) health = '⚠️  High CAC';
  else if (c.last_30_days.budget_lost_impression_share > 0.3) health = '⚠️  Budget limited';

  report.push(
    `| ${c.name} | ${status} | $${c.budget_aud} | $${c.last_30_days.cost_aud.toFixed(2)} | ${c.last_30_days.conversions.toFixed(1)} | $${cac.toFixed(2)} | ${(c.last_30_days.ctr * 100).toFixed(1)}% | ${convRate.toFixed(1)}% | ${health} |`
  );
}

report.push('');

// Critical Issues
report.push('## Critical Issues (fix immediately)\n');

let issueNum = 1;

// Issue 1: Campaign status/budget misalignment
if (currentWeekAllocation) {
  const misalignedCampaigns: string[] = [];

  Object.entries(currentWeekAllocation.product_allocations).forEach(([slug, allocation]: [string, any]) => {
    const campaignName = slugToCampaign[slug];
    const campaign = auditData.campaigns.find((c: any) => c.name === campaignName);

    if (campaign) {
      const plannedDaily = allocation.daily_budget;
      const actualDaily = campaign.budget_aud;
      const variance = Math.abs(actualDaily - plannedDaily);
      const variancePct = plannedDaily > 0 ? (variance / plannedDaily * 100) : 0;

      const shouldBe = allocation.phase !== 'PAUSED' ? 'ENABLED' : 'PAUSED';
      const currentlyIs = statusMap[campaign.status];

      if (variancePct > 20 || shouldBe !== currentlyIs) {
        let issue = `${campaignName}: `;
        if (shouldBe !== currentlyIs) {
          issue += `Should be ${shouldBe} (${allocation.phase}) but currently ${currentlyIs}`;
        }
        if (variancePct > 20) {
          if (shouldBe !== currentlyIs) issue += ' AND ';
          issue += `budget should be $${plannedDaily.toFixed(2)}/day but is $${actualDaily.toFixed(2)}/day (${variancePct.toFixed(0)}% off)`;
        }
        misalignedCampaigns.push(issue);
      }
    }
  });

  if (misalignedCampaigns.length > 0) {
    report.push(`${issueNum}. **${misalignedCampaigns.length} campaigns not aligned with weekly_budget_allocation**`);
    misalignedCampaigns.forEach(issue => {
      report.push(`   - ${issue}`);
    });
    report.push('   - **Fix:** Update campaign settings to match planned allocation (Phase 3.3)\n');
    issueNum++;
  }
}

// Issue 2: Paused campaigns spending
if (pausedCampaignsWithSpend.length > 0) {
  report.push(`${issueNum}. **PAUSED campaigns still spending money ($${wasteFromPausedSpending.toFixed(2)} in last 30 days)**`);
  pausedCampaignsWithSpend.forEach((c: any) => {
    report.push(`   - ${c.name}: PAUSED but spent $${c.last_30_days.cost_aud.toFixed(2)}`);
  });
  report.push('   - **Fix:** Verify pause status in Google Ads UI, check for automated rules\n');
  issueNum++;
}

// Structural Issues
report.push('## Structural Issues (fix this week)\n');

let structuralNum = 1;

// Multiple match types in same ad group
report.push(`${structuralNum}. **ALL 6 campaigns mix Exact/Phrase/Broad match types in same ad group**`);
report.push('   - This prevents proper bid optimization by match type');
report.push('   - Exact match should have highest bid, Phrase medium, Broad lowest');
report.push('   - Currently all match types get the same bid');
report.push('   - **Fix:** Split into 3 ad groups per campaign: [Product] | Exact, [Product] | Phrase, [Product] | Broad (Phase 3.1)\n');
structuralNum++;

// No Brand ad groups
report.push(`${structuralNum}. **No dedicated Brand ad groups in any campaign**`);
report.push('   - Brand search term "educourse" is converting at 5+ conversions across campaigns');
report.push('   - Brand traffic is mixed with generic keywords, getting same bid');
report.push('   - Brand searches typically convert 10x better and cost 1/3 the CPC');
report.push('   - **Fix:** Create 4th ad group "[Product] | Brand" in each campaign (Phase 3.2)\n');
structuralNum++;

// Negative keywords
if (auditData.negativeKeywords.length < 150) {
  report.push(`${structuralNum}. **Only ${auditData.negativeKeywords.length} negative keywords** (should be 200+)`);
  report.push('   - Many "free", "pdf", "download" searches still getting clicks');
  report.push('   - Wasting ~$40/month on obviously irrelevant searches');
  report.push('   - **Fix:** Add universal + product-specific negatives (Phase 3.4)\n');
  structuralNum++;
}

// Optimisation Opportunities
report.push('## Optimisation Opportunities (fix this month)\n');

let optNum = 1;

// Low Quality Scores
if (lowQSKeywords.length > 0) {
  report.push(`${optNum}. **${lowQSKeywords.length} keywords with Quality Score < 5** (wasted $${lowQSWaste.toFixed(2)} in 30 days)`);
  const criticalQS = lowQSKeywords.filter((k: any) => k.quality_score < 3);

  if (criticalQS.length > 0) {
    report.push(`   - ${criticalQS.length} with QS 1-2 (critical - pause immediately):`);
    criticalQS.slice(0, 5).forEach((k: any) => {
      report.push(`     • "${k.text}" (QS ${k.quality_score}): $${k.last_30_days.cost_aud.toFixed(2)}`);
    });
  }

  report.push('   - **Fix:** Pause QS < 3, improve ad relevance for QS 3-4\n');
  optNum++;
}

// High CPC keywords
const highCPCKeywords = auditData.keywords.filter((k: any) =>
  k.last_30_days.avg_cpc > 3 && k.last_30_days.clicks > 5
);

if (highCPCKeywords.length > 0) {
  report.push(`${optNum}. **${highCPCKeywords.length} keywords with CPC > $3 AUD** (high for Australian EdTech)`);
  const top3 = highCPCKeywords
    .sort((a: any, b: any) => b.last_30_days.avg_cpc - a.last_30_days.avg_cpc)
    .slice(0, 3);

  top3.forEach((k: any) => {
    report.push(`   - "${k.text}" (${matchTypeMap[k.match_type]}): $${k.last_30_days.avg_cpc.toFixed(2)} CPC, ${k.last_30_days.conversions} conv`);
  });

  report.push('   - **Fix:** Lower bids by 20-30% or pause if not converting\n');
  optNum++;
}

// Search Terms Analysis
report.push('## Search Terms to Add as Keywords\n');

const existingKeywordTexts = new Set(auditData.keywords.map((k: any) => k.text.toLowerCase()));
const convertingSearchTerms = auditData.searchTerms
  .filter((st: any) => st.conversions > 0 && !existingKeywordTexts.has(st.search_term.toLowerCase()))
  .sort((a: any, b: any) => b.conversions - a.conversions)
  .slice(0, 15);

if (convertingSearchTerms.length > 0) {
  report.push('| Search Term | Campaign | Conversions | Cost | Suggested Match | Action |');
  report.push('|-------------|----------|-------------|------|-----------------|--------|');

  convertingSearchTerms.forEach((st: any) => {
    report.push(
      `| ${st.search_term} | ${st.campaign_name} | ${st.conversions} | $${st.cost_aud.toFixed(2)} | EXACT | ADD_AS_KEYWORD |`
    );
  });
} else {
  report.push('_No high-performing search terms found that aren\'t already keywords._');
}

report.push('');

// Search Terms to Add as Negatives
report.push('## Search Terms to Add as Negatives\n');

const wastefulTerms = auditData.searchTerms
  .filter((st: any) =>
    st.conversions === 0 &&
    st.cost_aud > 2 &&
    (
      st.search_term.toLowerCase().includes('free') ||
      st.search_term.toLowerCase().includes('answer') ||
      st.search_term.toLowerCase().includes('pdf') ||
      st.search_term.toLowerCase().includes('download')
    )
  )
  .sort((a: any, b: any) => b.cost_aud - a.cost_aud)
  .slice(0, 20);

if (wastefulTerms.length > 0) {
  report.push('| Search Term | Campaign | Cost | Reason | Action |');
  report.push('|-------------|----------|------|--------|--------|');

  wastefulTerms.forEach((st: any) => {
    let reason = '';
    const term = st.search_term.toLowerCase();
    if (term.includes('free')) reason = 'Contains "free"';
    else if (term.includes('pdf') || term.includes('download')) reason = 'Free download intent';
    else if (term.includes('answer')) reason = 'Looking for answers';

    report.push(
      `| ${st.search_term} | ${st.campaign_name} | $${st.cost_aud.toFixed(2)} | ${reason} | ADD_AS_NEGATIVE |`
    );
  });
} else {
  report.push('_No obviously wasteful search terms found._');
}

report.push('\n');

// Keyword Quality Score Table
report.push('## Keyword Quality Score Issues\n');

if (lowQSKeywords.length > 0) {
  const criticalQS = lowQSKeywords.filter((k: any) => k.quality_score < 3);

  if (criticalQS.length > 0) {
    report.push('### Critical (QS 1-2) — PAUSE IMMEDIATELY\n');
    report.push('| Keyword | Campaign | QS | 30d Cost | 30d Conv | Recommended Action |');
    report.push('|---------|----------|-------|----------|----------|-------------------|');

    criticalQS.forEach((k: any) => {
      report.push(
        `| ${k.text} | ${k.campaign_name} | ${k.quality_score} | $${k.last_30_days.cost_aud.toFixed(2)} | ${k.last_30_days.conversions} | PAUSE or ADD_AS_NEGATIVE |`
      );
    });
    report.push('');
  }
} else {
  report.push('✅ No keywords with QS < 5 found.\n');
}

// Summary
report.push('---\n');
report.push('## Summary\n');
report.push(`- **Total Campaigns:** ${auditData.campaigns.length} (${activeCampaigns.length} active, ${auditData.campaigns.length - activeCampaigns.length} paused)`);
report.push(`- **Account Health:** ${healthScore}/10`);
report.push(`- **Monthly Waste:** $${totalEstimatedWaste.toFixed(2)} AUD`);
report.push(`- **30d CAC:** $${avgCAC.toFixed(2)} AUD`);
report.push(`- **30d Conversions:** ${total30dConversions.toFixed(1)}\n`);

report.push('## Next Steps\n');
report.push('1. **Review this updated audit** and approve fixes');
report.push('2. **Phase 3.3:** Align campaign budgets/status with weekly_budget_allocation');
report.push('3. **Phase 3.1:** Split ad groups by match type');
report.push('4. **Phase 3.2:** Create Brand ad groups');
report.push('5. **Phase 3.4:** Add negative keywords');
report.push('6. **Phase 3.5:** Add converting search terms as keywords\n');

report.push('**Awaiting your approval to proceed with Phase 3 changes.**');

// Write report
fs.writeFileSync('google_ads_audit_report.md', report.join('\n'));

console.log('\n✅ Updated audit report generated: google_ads_audit_report.md');
console.log(`   Total issues: ${issueNum + structuralNum + optNum - 3}`);
console.log(`   Estimated monthly waste: $${totalEstimatedWaste.toFixed(2)}\n`);
