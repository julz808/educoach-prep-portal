# EduCoach Marketing Automation Plan

## Overview
This plan focuses on three core pillars:
1. **SEO Agent** - Automated content creation and ranking optimization
2. **CRO Agent** - Conversion rate optimization and funnel analysis
3. **School Landing Pages** - SEO-targeted pages for specific schools (no paid ads)

**Strategy**: Keep Google Ads campaigns product-focused, use school-specific landing pages purely for organic SEO traffic.

---

## Current State

### ✅ Already Built
- **Google Ads Agent**: Autonomous optimization running
- **GA4 Tracking**: Google Ads tracking installed (AW-11082636289)
- **Conversion Tracking**: Purchase success events firing

### 🚧 In Progress
- **SEO Agent**: Partially built, needs completion

### ❌ Missing
- GA4 Analytics property (need G-XXXXXXXXXX ID)
- CRO tracking infrastructure
- School landing pages system

---

## Phase 1: Finish SEO Agent (Week 1-2)

### Objectives
Complete the autonomous SEO agent to drive organic traffic and improve rankings.

### Tasks
- [ ] **Backlink Monitoring**
  - Track backlinks from other sites
  - Monitor backlink quality and domain authority
  - Alert on lost backlinks

- [ ] **Content Quality Scoring**
  - Automated content analysis
  - Readability scores
  - Keyword density optimization
  - Competitive content gap analysis

- [ ] **Auto-Publish Blog Posts**
  - Generate SEO-optimized blog content
  - Schedule and publish automatically
  - Internal linking to products and school pages

- [ ] **Keyword Ranking Tracker**
  - Monitor rankings for target keywords
  - Track competitor rankings
  - Identify ranking opportunities

### Success Metrics
- Blog posts published per week
- Keyword rankings improvement
- Organic traffic increase
- Backlink growth rate

---

## Phase 2: Build CRO Agent (Week 2-3)

### Objectives
Maximize conversion rates on existing traffic by identifying and fixing friction points.

### Tasks
- [ ] **Conversion Funnel Tracking**
  - Landing page → Product page
  - Product page → Checkout
  - Checkout → Purchase
  - Identify drop-off points at each stage

- [ ] **A/B Test Framework**
  - Test headlines, CTAs, pricing presentation
  - Track statistical significance
  - Auto-implement winning variants

- [ ] **Form Abandonment Detection**
  - Track checkout form abandonment
  - Identify problematic form fields
  - Measure completion rates

- [ ] **Heatmap Integration**
  - Integrate Hotjar or Microsoft Clarity
  - Analyze user behavior patterns
  - Identify confusing UI elements

### Success Metrics
- Conversion rate improvement (baseline → target)
- Form completion rate
- Average time to purchase
- Cart abandonment rate reduction

---

## Phase 3: School Landing Pages (Week 4+)

### Objectives
Create 100-500 school-specific landing pages to capture long-tail organic search traffic.

### Strategy: Tiered Approach

#### **Tier 1: High-Value Schools** (20-30 schools)
Premium selective schools with high search volume.
- Manual content creation for quality
- Detailed school information, test prep guidance
- High internal linking priority
- Examples: Melbourne High, Mac.Robertson, James Ruse, Sydney Grammar

#### **Tier 2: Medium-Value Schools** (50-100 schools)
Competitive schools with moderate search volume.
- Semi-automated content generation
- Template-based with school-specific customization
- Standard internal linking

#### **Tier 3: Long-Tail Schools** (200+ schools)
Lower volume but high-intent searches.
- Fully automated content generation
- Programmatic page creation
- Basic template with school name/location variations

### Technical Implementation

#### School Database (Supabase)
```sql
CREATE TABLE schools (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  suburb TEXT,
  state TEXT,
  test_type TEXT, -- 'ACER', 'EduTest', 'VIC Selective', 'NSW Selective'
  tier INTEGER, -- 1, 2, or 3
  competition_level TEXT, -- 'highly_competitive', 'competitive', 'moderate'
  meta_title TEXT,
  meta_description TEXT,
  content_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Landing Page System
- **Route**: `/schools/[school-slug]`
- **Dynamic Content**: AI-generated unique content per school
- **SEO Elements**:
  - Unique meta titles/descriptions
  - Schema markup for LocalBusiness + EducationalOrganization
  - Internal links to relevant test prep products
  - Location-based keywords

#### Content Generation Workflow
1. **You**: Map schools → test types in Perplexity
2. **Claude Code**: Generate unique landing page content
3. **System**: Auto-create pages with proper SEO structure
4. **Monitor**: Track rankings and traffic per school page

### Tasks
- [ ] **School Database Setup**
  - Create Supabase table
  - Import school data (your Perplexity research)
  - Assign tiers to schools

- [ ] **Landing Page Template**
  - Design Next.js dynamic route
  - Create responsive page layout
  - Add conversion elements (CTA buttons, product links)

- [ ] **Content Generator**
  - AI prompt engineering for unique content
  - School-specific customization
  - Quality assurance checks

- [ ] **SEO Infrastructure**
  - XML sitemap generation (all school pages)
  - Schema markup implementation
  - Internal linking strategy
  - Canonical URL management

- [ ] **GA4 Integration**
  - Add GA4 property ID to tracking
  - School page event tracking
  - UTM parameter strategy
  - Conversion attribution by school page

### Success Metrics
- Number of school pages indexed
- Organic traffic from school pages
- School page → product conversions
- Average ranking position for "[School Name] scholarship preparation"

---

## Quick Wins

### Immediate (< 1 day)
- [ ] Add GA4 property ID to index.html
- [ ] Enable conversion tracking in GA4 dashboard

### Short-term (1 week)
- [ ] Set up basic performance dashboard
- [ ] Install Hotjar or Microsoft Clarity
- [ ] Create school database structure

---

## Analytics & Tracking

### GA4 Configuration
**Current**: Google Ads tracking (AW-11082636289)
**Needed**: GA4 property (G-XXXXXXXXXX)

### UTM Strategy for School Pages
```
?utm_source=organic
&utm_medium=seo
&utm_campaign=[school-slug]
&utm_content=school-landing-page
```

### Key Metrics to Track
1. **Traffic Sources**
   - Organic (by school page)
   - Paid (Google Ads by product)
   - Direct
   - Referral

2. **Conversion Funnel**
   - Landing page views
   - Product page views
   - Checkout initiations
   - Purchases completed

3. **School Page Performance**
   - Traffic per school page
   - Conversion rate per school
   - Top-performing schools
   - Keyword rankings per school

4. **ROI Metrics**
   - Cost per acquisition (CPA) - paid ads
   - Customer lifetime value (LTV)
   - Return on ad spend (ROAS)

---

## Performance Dashboard (Optional)

### Simple Supabase + Next.js Page
**Metrics Displayed**:
- Google Ads performance (already collecting)
- Top-performing school landing pages
- Conversion rates by source
- Week-over-week growth

**Data Sources**:
- Google Ads API (already connected)
- GA4 API (to be added)
- Supabase purchase data (already tracking)

---

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| **Phase 1: SEO Agent** | Weeks 1-2 | Backlink monitoring, content scoring, auto-publish, keyword tracking |
| **Phase 2: CRO Agent** | Weeks 2-3 | Funnel tracking, A/B tests, heatmaps, abandonment detection |
| **Phase 3: School Pages** | Week 4+ | School database, landing pages, content generation, SEO optimization |

---

## Out of Scope

The following are explicitly NOT part of this plan:
- ❌ Email marketing automation
- ❌ Social media agents
- ❌ Customer retention campaigns
- ❌ School-specific Google Ads campaigns (keeping ads product-focused)

---

## Next Steps

1. **Immediate**: Add GA4 property to tracking code
2. **Week 1**: Complete SEO agent features
3. **Week 2**: Build CRO tracking infrastructure
4. **Week 3**: You map schools, I build landing page system
5. **Week 4+**: Generate and deploy school landing pages

---

## Notes

- School landing pages are **SEO-only** (no paid ads per school)
- Google Ads campaigns remain **product-focused**
- All tracking flows into unified GA4 property
- Conversion attribution will show which schools drive revenue
