#!/usr/bin/env tsx

import { getAllGhostPosts, createGhostPost } from './utils/ghost-client';
import { askClaude } from './utils/claude-client';
import fs from 'fs';
import path from 'path';

// Configuration
const CONFIG = {
  products: [
    { slug: 'acer-scholarship', name: 'ACER Scholarship', keywords: ['ACER test', 'ACER scholarship', 'ACER preparation'] },
    { slug: 'edutest-scholarship', name: 'EduTest Scholarship', keywords: ['EduTest', 'EduTest scholarship', 'EduTest prep'] },
    { slug: 'nsw-selective', name: 'NSW Selective', keywords: ['NSW selective', 'selective schools NSW', 'selective test'] },
    { slug: 'vic-selective', name: 'VIC Selective', keywords: ['VIC selective', 'Victorian selective entry', 'SEHS'] },
    { slug: 'year5-naplan', name: 'Year 5 NAPLAN', keywords: ['Year 5 NAPLAN', 'NAPLAN Year 5', 'NAPLAN preparation'] },
    { slug: 'year7-naplan', name: 'Year 7 NAPLAN', keywords: ['Year 7 NAPLAN', 'NAPLAN Year 7', 'NAPLAN test'] },
  ],
  postsPerWeek: 4,
  publishAsDraft: true,
};

interface ContentGap {
  topic: string;
  keyword: string;
  product: string;
  priority: number;
  reason: string;
}

interface BlogPostData {
  title: string;
  slug: string;
  html: string;
  metaTitle: string;
  metaDescription: string;
  tags: string[];
  excerpt: string;
}

async function analyzeExistingContent(): Promise<ContentGap[]> {
  console.log('\n📚 Analyzing existing Ghost content...');

  const posts = await getAllGhostPosts();
  console.log(`   Found ${posts.length} existing posts`);

  const existingTopics = posts.map(post => ({
    title: post.title,
    tags: post.tags?.map((t: any) => t.name) || [],
  }));

  const prompt = `Analyze this blog content inventory and identify content gaps.

**Existing Blog Posts:**
${existingTopics.slice(0, 50).map((p, i) => `${i + 1}. ${p.title}`).join('\n')}

**Our Products:**
${CONFIG.products.map(p => `- ${p.name}: ${p.keywords.join(', ')}`).join('\n')}

**Task:**
Identify 10 high-priority content gaps for Australian test preparation that:
1. Cover keywords we haven't written about yet
2. Support our 6 product lines
3. Have good search potential
4. Are timely/relevant

**Output JSON array:**
[{
  "topic": "Complete ACER Test Day Checklist for 2026",
  "keyword": "ACER test day checklist",
  "product": "acer-scholarship",
  "priority": 9,
  "reason": "High search volume, supports product"
}, ...]`;

  const response = await askClaude(prompt, {
    systemPrompt: 'You are an expert SEO content strategist for Australian education.',
    maxTokens: 8000,
  });

  const jsonMatch = response.match(/\[([\s\S]*)\]/);
  if (!jsonMatch) return [];

  const gaps: ContentGap[] = JSON.parse('[' + jsonMatch[1] + ']');
  console.log(`   ✅ Identified ${gaps.length} content gaps`);

  return gaps;
}

async function generateBlogPost(topic: string, keyword: string, product: string): Promise<BlogPostData> {
  console.log(`\n📝 Generating: "${topic}"`);

  const prompt = `Write a comprehensive, SEO-optimized blog post for EduCourse.

**Topic:** ${topic}
**Primary Keyword:** ${keyword}
**Product to Promote:** ${product} (link: https://educourse.com.au/products/${product})

**Requirements:**
1. Length: 2,000-2,500 words
2. SEO-optimized title and meta description
3. Clear H2/H3 structure
4. 2-3 CTAs linking to product
5. Written for Australian parents

**Output Format (JSON):**
{
  "title": "The H1 title",
  "slug": "url-friendly-slug",
  "metaTitle": "SEO title (60 chars max)",
  "metaDescription": "SEO description (155-160 chars)",
  "excerpt": "Short excerpt (140-160 chars)",
  "tags": ["tag1", "tag2", "tag3"],
  "html": "Full HTML content with <h1>, <h2>, <p>, etc."
}`;

  const response = await askClaude(prompt, {
    systemPrompt: 'You are an expert SEO content writer for Australian test preparation.',
    maxTokens: 16000,
    temperature: 0.8,
  });

  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to generate blog post');

  return JSON.parse(jsonMatch[0]);
}

async function publishToGhost(blogData: BlogPostData, status: 'draft' | 'published') {
  const existing = await  import('./utils/ghost-client').then(m => m.getGhostPostBySlug(blogData.slug));
  if (existing) {
    console.log(`   ⚠️  Post "${blogData.slug}" already exists, skipping`);
    return null;
  }

  const result = await createGhostPost({
    title: blogData.title,
    slug: blogData.slug,
    html: blogData.html,
    status,
    meta_title: blogData.metaTitle,
    meta_description: blogData.metaDescription,
    custom_excerpt: blogData.excerpt,
    tags: blogData.tags.map(tag => ({ name: tag })),
  });

  console.log(`   ✅ Published as ${status}: ${result.url}`);
  return result;
}

async function runAutonomousAgent() {
  console.log('\n🤖 AUTONOMOUS SEO AGENT STARTING\n');
  console.log('='.repeat(80));

  const startTime = Date.now();

  try {
    // Phase 1: Analysis
    console.log('\n📊 PHASE 1: CONTENT ANALYSIS');
    console.log('='.repeat(80));

    const gaps = await analyzeExistingContent();

    // Phase 2: Generation
    console.log('\n📊 PHASE 2: CONTENT GENERATION');
    console.log('='.repeat(80));

    const topGaps = gaps.sort((a, b) => b.priority - a.priority).slice(0, CONFIG.postsPerWeek);
    let generated = 0;

    for (const gap of topGaps) {
      try {
        const blogData = await generateBlogPost(gap.topic, gap.keyword, gap.product);
        await publishToGhost(blogData, CONFIG.publishAsDraft ? 'draft' : 'published');
        generated++;
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error: any) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }

    // Save results
    const resultsDir = path.join(process.cwd(), 'seo-agent-results');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir);

    const timestamp = new Date().toISOString().split('T')[0];
    fs.writeFileSync(
      path.join(resultsDir, `content-gaps-${timestamp}.json`),
      JSON.stringify(gaps, null, 2)
    );

    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

    console.log('\n' + '='.repeat(80));
    console.log('✅ AUTONOMOUS AGENT COMPLETE');
    console.log('='.repeat(80));
    console.log(`\n📊 Summary:`);
    console.log(`   • Content gaps identified: ${gaps.length}`);
    console.log(`   • Blog posts generated: ${generated}`);
    console.log(`   • Duration: ${duration} minutes`);
    console.log(`\n📁 Check Ghost admin for new drafts`);
    console.log(`📁 Check seo-agent-results/ for reports\n`);

  } catch (error: any) {
    console.error('\n❌ Agent error:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runAutonomousAgent();
}

export { runAutonomousAgent };
