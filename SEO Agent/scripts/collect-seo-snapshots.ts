#!/usr/bin/env tsx
/**
 * SEO Agent - Phase 1: Data Collection
 *
 * This script collects weekly SEO data (deterministic, no AI):
 * 1. Ghost CMS posts
 * 2. Google Search Console rankings (TODO: need to set up API)
 * 3. Competitor analysis (TODO: web scraping)
 * 4. Seasonal context (using 10-week time lag)
 *
 * Saves everything to Supabase for Phase 2 AI analysis
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { SEOSeasonalityCalculator } from './seo-seasonality-calculator.js';
import path from 'path';
import fs from 'fs';

config();

// Initialize Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Initialize Ghost API (import from existing utils)
const GHOST_API_URL = process.env.GHOST_API_URL || '';
const GHOST_ADMIN_API_KEY = process.env.GHOST_ADMIN_API_KEY || '';

interface TestCalendarEntry {
  product_slug: string;
  product_name: string;
  test_date_primary: string;
}

interface WeeklyBudgetAllocation {
  week_start_date: string;
  product_allocations: {
    [key: string]: {
      phase: string;
      seasonal_multiplier: number;
      opportunity_score: number;
    };
  };
}

interface GhostPost {
  slug: string;
  title: string;
  url: string;
  published_at: string;
  updated_at: string;
  excerpt: string;
  custom_excerpt?: string;
  html: string;
  tags?: Array<{ name: string; slug: string }>;
}

interface SEOSnapshot {
  snapshot_id: string;
  snapshot_date: string;
  week_start_date: string;
  week_end_date: string;
  total_posts: number;
  posts_published_this_week: number;
  total_words: number;
  total_keywords_tracked: number;
  keywords_ranking_top_10: number;
  keywords_ranking_top_50: number;
  total_impressions: number;
  total_clicks: number;
  average_position: number;
  average_ctr: number;
  seasonal_allocations: any;
  total_posts_recommended_this_week: number;
  snapshot_data: any;
}

/**
 * Get test calendar from Supabase
 */
async function getTestCalendar(): Promise<TestCalendarEntry[]> {
  const { data, error } = await supabase
    .from('test_calendar')
    .select('product_slug, product_name, test_date_primary')
    .order('product_slug');

  if (error) {
    throw new Error(`Failed to fetch test calendar: ${error.message}`);
  }

  return data || [];
}

/**
 * Get weekly budget allocation
 */
async function getWeeklyBudgetAllocation(): Promise<WeeklyBudgetAllocation> {
  // Read from weekly_budget_allocation.json
  const budgetPath = path.join(process.cwd(), 'weekly_budget_allocation.json');

  if (!fs.existsSync(budgetPath)) {
    throw new Error('weekly_budget_allocation.json not found');
  }

  const budgetData = JSON.parse(fs.readFileSync(budgetPath, 'utf-8'));

  // Get current week's allocation
  const currentWeek = getWeekStartDate(new Date());
  const weekData = budgetData.find((w: any) => w.week_start_date === currentWeek);

  if (!weekData) {
    // Return most recent week if current week not found
    return budgetData[budgetData.length - 1];
  }

  return weekData;
}

/**
 * Fetch Ghost CMS posts
 */
async function fetchGhostPosts(): Promise<GhostPost[]> {
  console.log('📚 Fetching Ghost CMS posts...');

  // Using Ghost Content API (public)
  const contentKey = process.env.GHOST_CONTENT_API_KEY;

  if (!contentKey) {
    console.log('   ⚠️  GHOST_CONTENT_API_KEY not set, using mock data');
    return [];
  }

  const apiUrl = `${GHOST_API_URL}/ghost/api/content/posts/`;
  const params = new URLSearchParams({
    key: contentKey,
    limit: 'all',
    fields: 'slug,title,url,published_at,updated_at,excerpt,custom_excerpt,html',
    include: 'tags',
  });

  try {
    const response = await fetch(`${apiUrl}?${params}`);

    if (!response.ok) {
      throw new Error(`Ghost API returned ${response.status}`);
    }

    const data = await response.json();
    const posts = data.posts || [];

    console.log(`   ✓ Found ${posts.length} published posts`);
    return posts;
  } catch (error: any) {
    console.error(`   ❌ Error fetching Ghost posts: ${error.message}`);
    return [];
  }
}

/**
 * Calculate total words from HTML content
 */
function calculateWordCount(html: string): number {
  // Strip HTML tags and count words
  const text = html.replace(/<[^>]*>/g, ' ');
  const words = text.trim().split(/\s+/);
  return words.filter(w => w.length > 0).length;
}

/**
 * Fetch Google Search Console data
 * TODO: Implement when GSC API is set up
 */
async function fetchGoogleSearchConsoleData(): Promise<any> {
  console.log('🔍 Fetching Google Search Console data...');
  console.log('   ⚠️  Google Search Console API not yet implemented');
  console.log('   → Returning mock data for now');

  // Mock data structure
  return {
    total_keywords: 0,
    keywords_top_10: 0,
    keywords_top_50: 0,
    total_impressions: 0,
    total_clicks: 0,
    average_position: 0,
    average_ctr: 0,
    keywords: [],
    posts: [],
  };
}

/**
 * Analyze competitor content
 * TODO: Implement web scraping
 */
async function analyzeCompetitors(): Promise<any> {
  console.log('🕵️  Analyzing competitor content...');
  console.log('   ⚠️  Competitor analysis not yet implemented');
  console.log('   → Returning mock data for now');

  return {
    new_content_count: 0,
    competitors: [],
  };
}

/**
 * Calculate seasonal allocations using 10-week time lag
 */
function calculateSeasonalAllocations(
  weeklyBudget: WeeklyBudgetAllocation,
  testCalendar: TestCalendarEntry[]
): any {
  console.log('📊 Calculating seasonal content allocations (10-week time lag)...');

  const allocations = SEOSeasonalityCalculator.calculateWeeklyContentAllocation(
    weeklyBudget,
    testCalendar
  );

  const totalPosts = allocations.reduce((sum, a) => sum + a.posts_this_week, 0);

  console.log(`   ✓ Total posts recommended this week: ${totalPosts}`);

  for (const allocation of allocations) {
    if (allocation.posts_this_week > 0) {
      console.log(`   🟢 ${allocation.product_name}: ${allocation.posts_this_week} posts`);
    } else {
      console.log(`   ⚪ ${allocation.product_name}: 0 posts (${allocation.seo_phase})`);
    }
  }

  return {
    allocations,
    total_posts_recommended: totalPosts,
  };
}

/**
 * Get week start date (Monday)
 */
function getWeekStartDate(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

/**
 * Get week end date (Sunday)
 */
function getWeekEndDate(weekStart: string): string {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  return d.toISOString().split('T')[0];
}

/**
 * Generate snapshot ID
 */
function generateSnapshotId(weekStart: string): string {
  return `seo_${weekStart.replace(/-/g, '_')}_${Date.now().toString(36)}`;
}

/**
 * Save snapshot to Supabase
 */
async function saveSnapshot(snapshot: SEOSnapshot): Promise<void> {
  console.log('\n💾 Saving snapshot to Supabase...');

  const { error } = await supabase
    .from('seo_weekly_snapshots')
    .insert(snapshot);

  if (error) {
    throw new Error(`Failed to save snapshot: ${error.message}`);
  }

  console.log(`   ✓ Snapshot ID: ${snapshot.snapshot_id}`);
  console.log(`   ✓ Saved to seo_weekly_snapshots`);
}

/**
 * Save blog posts to Supabase
 */
async function saveBlogPosts(
  snapshotId: string,
  posts: GhostPost[],
  gscData: any
): Promise<void> {
  if (posts.length === 0) return;

  console.log('\n💾 Saving blog posts to Supabase...');

  const blogPostRecords = posts.map(post => {
    // Find GSC data for this post (if available)
    const postGscData = gscData.posts?.find((p: any) =>
      p.url?.includes(post.slug)
    ) || {};

    // Extract product slug from tags
    const productTag = post.tags?.find(t =>
      ['acer', 'edutest', 'vic-selective', 'nsw-selective', 'naplan'].some(p =>
        t.slug.includes(p)
      )
    );

    const publishedDate = post.published_at ? new Date(post.published_at) : null;
    const daysSincePublished = publishedDate
      ? Math.floor((Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      snapshot_id: snapshotId,
      post_slug: post.slug,
      post_title: post.title,
      post_url: post.url,
      product_slug: productTag?.slug || null,
      word_count: calculateWordCount(post.html),
      published_date: publishedDate ? publishedDate.toISOString().split('T')[0] : null,
      updated_date: post.updated_at ? new Date(post.updated_at).toISOString().split('T')[0] : null,
      days_since_published: daysSincePublished,
      impressions: postGscData.impressions || 0,
      clicks: postGscData.clicks || 0,
      average_position: postGscData.average_position || null,
      ctr: postGscData.ctr || null,
      top_keywords: postGscData.top_keywords || null,
      internal_links_count: 0, // TODO: Extract from HTML
      outbound_links_count: 0, // TODO: Extract from HTML
      has_product_cta: false, // TODO: Check for product links
    };
  });

  const { error } = await supabase
    .from('seo_weekly_blog_posts')
    .insert(blogPostRecords);

  if (error) {
    console.error(`   ❌ Error saving blog posts: ${error.message}`);
  } else {
    console.log(`   ✓ Saved ${blogPostRecords.length} blog posts`);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('\n🤖 SEO AGENT - PHASE 1: DATA COLLECTION\n');
  console.log('='.repeat(80));

  const startTime = Date.now();

  try {
    // 1. Get test calendar and budget allocation
    console.log('\n📋 Loading configuration...');
    const testCalendar = await getTestCalendar();
    const weeklyBudget = await getWeeklyBudgetAllocation();
    console.log(`   ✓ Loaded ${testCalendar.length} products from test calendar`);
    console.log(`   ✓ Using week starting ${weeklyBudget.week_start_date}`);

    // 2. Fetch Ghost CMS posts
    const ghostPosts = await fetchGhostPosts();
    const postsThisWeek = ghostPosts.filter(p => {
      const publishedDate = new Date(p.published_at);
      const weekStart = new Date(weeklyBudget.week_start_date);
      const weekEnd = new Date(getWeekEndDate(weeklyBudget.week_start_date));
      return publishedDate >= weekStart && publishedDate <= weekEnd;
    }).length;

    // 3. Fetch Google Search Console data
    const gscData = await fetchGoogleSearchConsoleData();

    // 4. Analyze competitors
    const competitorData = await analyzeCompetitors();

    // 5. Calculate seasonal allocations (10-week time lag)
    const seasonalData = calculateSeasonalAllocations(weeklyBudget, testCalendar);

    // 6. Create snapshot
    const weekStart = weeklyBudget.week_start_date;
    const weekEnd = getWeekEndDate(weekStart);
    const snapshotId = generateSnapshotId(weekStart);

    const totalWords = ghostPosts.reduce((sum, post) =>
      sum + calculateWordCount(post.html), 0
    );

    const snapshot: SEOSnapshot = {
      snapshot_id: snapshotId,
      snapshot_date: new Date().toISOString().split('T')[0],
      week_start_date: weekStart,
      week_end_date: weekEnd,
      total_posts: ghostPosts.length,
      posts_published_this_week: postsThisWeek,
      total_words: totalWords,
      total_keywords_tracked: gscData.total_keywords,
      keywords_ranking_top_10: gscData.keywords_top_10,
      keywords_ranking_top_50: gscData.keywords_top_50,
      total_impressions: gscData.total_impressions,
      total_clicks: gscData.total_clicks,
      average_position: gscData.average_position,
      average_ctr: gscData.average_ctr,
      seasonal_allocations: seasonalData.allocations,
      total_posts_recommended_this_week: seasonalData.total_posts_recommended,
      snapshot_data: {
        ghost_posts: ghostPosts.length,
        gsc_data: gscData,
        competitor_data: competitorData,
        weekly_budget: weeklyBudget,
        test_calendar: testCalendar,
      },
    };

    // 7. Save to Supabase
    await saveSnapshot(snapshot);
    await saveBlogPosts(snapshotId, ghostPosts, gscData);

    // 8. Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n' + '='.repeat(80));
    console.log('✅ PHASE 1 COMPLETE');
    console.log('='.repeat(80));
    console.log(`\n📊 Summary:`);
    console.log(`   • Ghost posts tracked: ${ghostPosts.length}`);
    console.log(`   • Posts published this week: ${postsThisWeek}`);
    console.log(`   • Total words: ${totalWords.toLocaleString()}`);
    console.log(`   • Keywords tracked: ${gscData.total_keywords} (TODO: GSC API)`);
    console.log(`   • Clicks this week: ${gscData.total_clicks} (TODO: GSC API)`);
    console.log(`   • Posts recommended: ${seasonalData.total_posts_recommended}`);
    console.log(`   • Duration: ${duration} seconds`);
    console.log(`\n📁 Snapshot ID: ${snapshotId}`);
    console.log(`📁 Ready for Phase 2 (AI analysis)\n`);

  } catch (error: any) {
    console.error('\n❌ Phase 1 error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as collectSEOSnapshots };
