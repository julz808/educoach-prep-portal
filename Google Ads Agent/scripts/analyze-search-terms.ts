/**
 * Analyze Search Terms Performance
 *
 * Shows what actual searches triggered ads and their performance
 * This will tell us if our negative keywords are blocking good traffic
 */

import { GoogleAdsApi } from 'google-ads-api';
import * as dotenv from 'dotenv';

dotenv.config();

const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
  client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
});

const customer = client.Customer({
  customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID!,
  refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
});

async function analyzeSearchTerms() {
  console.log('🔍 SEARCH TERMS PERFORMANCE ANALYSIS\n');
  console.log('Last 90 days of actual searches that triggered your ads\n');
  console.log('═'.repeat(100));

  try {
    // Get search terms from last 90 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);

    const startStr = startDate.toISOString().split('T')[0].replace(/-/g, '');
    const endStr = endDate.toISOString().split('T')[0].replace(/-/g, '');

    const query = `
      SELECT
        campaign.name,
        search_term_view.search_term,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value
      FROM search_term_view
      WHERE segments.date BETWEEN '${startStr}' AND '${endStr}'
        AND metrics.impressions > 0
      ORDER BY metrics.cost_micros DESC
    `;

    const results = await customer.query(query);
    const searchTerms = Array.from(results);

    console.log(`\nFound ${searchTerms.length} search terms\n`);

    // Analyze by category
    const categories = {
      tutor: [] as any[],
      free: [] as any[],
      pdf: [] as any[],
      job: [] as any[],
      other: [] as any[]
    };

    let totalSpend = 0;
    let totalConversions = 0;

    for (const row of searchTerms) {
      const term = row.search_term_view.search_term.toLowerCase();
      const campaign = row.campaign.name;
      const impressions = row.metrics.impressions;
      const clicks = row.metrics.clicks;
      const cost = row.metrics.cost_micros / 1_000_000;
      const conversions = row.metrics.conversions || 0;
      const convValue = row.metrics.conversions_value || 0;

      totalSpend += cost;
      totalConversions += conversions;

      const data = {
        term,
        campaign,
        impressions,
        clicks,
        cost,
        conversions,
        convValue,
        ctr: clicks > 0 ? (clicks / impressions * 100).toFixed(2) + '%' : '0%',
        cpc: clicks > 0 ? (cost / clicks).toFixed(2) : '0',
        convRate: clicks > 0 ? (conversions / clicks * 100).toFixed(2) + '%' : '0%'
      };

      // Categorize
      if (term.includes('tutor') || term.includes('tutoring')) {
        categories.tutor.push(data);
      } else if (term.includes('free') || term.includes('download')) {
        categories.free.push(data);
      } else if (term.includes('pdf') || term.includes('sample')) {
        categories.pdf.push(data);
      } else if (term.includes('job') || term.includes('career') || term.includes('teacher')) {
        categories.job.push(data);
      } else {
        categories.other.push(data);
      }
    }

    console.log(`\n💰 TOTAL PERFORMANCE (Last 90 Days)`);
    console.log(`   Total Spend: $${totalSpend.toFixed(2)}`);
    console.log(`   Total Conversions: ${totalConversions}`);
    console.log(`   Average CAC: $${totalConversions > 0 ? (totalSpend / totalConversions).toFixed(2) : 'N/A'}`);

    // Print each category
    console.log(`\n\n${'═'.repeat(100)}\n`);
    console.log(`🎯 TUTOR/TUTORING SEARCHES (${categories.tutor.length} terms)`);
    console.log(`Currently blocked by negative keywords: "tutor", "tutoring", "private tutor"\n`);

    if (categories.tutor.length > 0) {
      const tutorSpend = categories.tutor.reduce((sum, t) => sum + t.cost, 0);
      const tutorConv = categories.tutor.reduce((sum, t) => sum + t.conversions, 0);
      console.log(`   Total Spend: $${tutorSpend.toFixed(2)}`);
      console.log(`   Total Conversions: ${tutorConv}`);
      console.log(`   Conversion Rate: ${categories.tutor.reduce((sum, t) => sum + t.clicks, 0) > 0 ? (tutorConv / categories.tutor.reduce((sum, t) => sum + t.clicks, 0) * 100).toFixed(2) : '0'}%\n`);

      categories.tutor.forEach(t => {
        console.log(`   "${t.term}" (${t.campaign})`);
        console.log(`      ${t.impressions} impr | ${t.clicks} clicks | $${t.cost.toFixed(2)} | ${t.conversions} conv | CTR: ${t.ctr} | Conv Rate: ${t.convRate}`);
      });
    } else {
      console.log('   ℹ️  No tutor/tutoring searches in last 90 days\n');
    }

    console.log(`\n${'═'.repeat(100)}\n`);
    console.log(`📄 FREE/PDF/SAMPLE SEARCHES (${categories.free.length + categories.pdf.length} terms)`);
    console.log(`Currently blocked by negative keywords: "free", "pdf", "download", "sample", etc.\n`);

    const freepdfs = [...categories.free, ...categories.pdf];
    if (freepdfs.length > 0) {
      const fpSpend = freepdfs.reduce((sum, t) => sum + t.cost, 0);
      const fpConv = freepdfs.reduce((sum, t) => sum + t.conversions, 0);
      console.log(`   Total Spend: $${fpSpend.toFixed(2)}`);
      console.log(`   Total Conversions: ${fpConv}`);
      console.log(`   Conversion Rate: ${freepdfs.reduce((sum, t) => sum + t.clicks, 0) > 0 ? (fpConv / freepdfs.reduce((sum, t) => sum + t.clicks, 0) * 100).toFixed(2) : '0'}%\n`);

      freepdfs.slice(0, 20).forEach(t => {
        console.log(`   "${t.term}" (${t.campaign})`);
        console.log(`      ${t.impressions} impr | ${t.clicks} clicks | $${t.cost.toFixed(2)} | ${t.conversions} conv | CTR: ${t.ctr} | Conv Rate: ${t.convRate}`);
      });
    } else {
      console.log('   ℹ️  No free/pdf searches in last 90 days\n');
    }

    console.log(`\n${'═'.repeat(100)}\n`);
    console.log(`💼 JOB/CAREER/TEACHER SEARCHES (${categories.job.length} terms)`);
    console.log(`Currently blocked by negative keywords: "job", "jobs", "career", "teacher", etc.\n`);

    if (categories.job.length > 0) {
      const jobSpend = categories.job.reduce((sum, t) => sum + t.cost, 0);
      const jobConv = categories.job.reduce((sum, t) => sum + t.conversions, 0);
      console.log(`   Total Spend: $${jobSpend.toFixed(2)}`);
      console.log(`   Total Conversions: ${jobConv}`);
      console.log(`   Conversion Rate: ${categories.job.reduce((sum, t) => sum + t.clicks, 0) > 0 ? (jobConv / categories.job.reduce((sum, t) => sum + t.clicks, 0) * 100).toFixed(2) : '0'}%\n`);

      categories.job.forEach(t => {
        console.log(`   "${t.term}" (${t.campaign})`);
        console.log(`      ${t.impressions} impr | ${t.clicks} clicks | $${t.cost.toFixed(2)} | ${t.conversions} conv | CTR: ${t.ctr} | Conv Rate: ${t.convRate}`);
      });
    } else {
      console.log('   ℹ️  No job/career searches in last 90 days\n');
    }

    console.log(`\n${'═'.repeat(100)}\n`);
    console.log(`📊 TOP 20 CONVERTING SEARCHES (${categories.other.length} other terms)\n`);

    const converting = categories.other.filter(t => t.conversions > 0).sort((a, b) => b.conversions - a.conversions);

    if (converting.length > 0) {
      converting.slice(0, 20).forEach(t => {
        console.log(`   ⭐ "${t.term}" (${t.campaign})`);
        console.log(`      ${t.impressions} impr | ${t.clicks} clicks | $${t.cost.toFixed(2)} | 🎯 ${t.conversions} conv | Conv Rate: ${t.convRate}`);
      });
    }

    console.log(`\n${'═'.repeat(100)}\n`);
    console.log(`💸 TOP 20 EXPENSIVE NON-CONVERTING SEARCHES\n`);

    const wasteful = categories.other.filter(t => t.conversions === 0 && t.cost > 5).sort((a, b) => b.cost - a.cost);

    if (wasteful.length > 0) {
      wasteful.slice(0, 20).forEach(t => {
        console.log(`   ❌ "${t.term}" (${t.campaign})`);
        console.log(`      ${t.impressions} impr | ${t.clicks} clicks | $${t.cost.toFixed(2)} wasted | 0 conv | CTR: ${t.ctr}`);
      });
    }

    console.log(`\n\n✅ Analysis complete!\n`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

analyzeSearchTerms()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Failed:', error);
    process.exit(1);
  });
