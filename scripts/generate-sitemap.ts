#!/usr/bin/env tsx
/**
 * Dynamic Sitemap Generator for EduCourse
 * Generates sitemap.xml with current dates and all public routes
 */

import { writeFileSync } from 'fs'
import { join } from 'path'

// Course slugs from your data
const courseSlugs = [
  'vic-selective-entry',
  'nsw-selective-entry',
  'acer-scholarship',
  'edutest-scholarship',
  'year-5-naplan',
  'year-7-naplan',
]

// Generate current date in ISO format
const currentDate = new Date().toISOString().split('T')[0]

// Sitemap XML structure
const generateSitemap = () => {
  const baseUrl = 'https://educourse.com.au'

  const urls = [
    // Homepage - highest priority
    {
      loc: baseUrl,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '1.0',
    },
    // Course pages - high priority
    ...courseSlugs.map(slug => ({
      loc: `${baseUrl}/course/${slug}`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: '0.9',
    })),
    // Auth page - low priority
    {
      loc: `${baseUrl}/auth`,
      lastmod: currentDate,
      changefreq: 'yearly',
      priority: '0.3',
    },
  ]

  // Build XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urls
  .map(
    url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`

  return xml
}

// Write sitemap to public directory
const sitemap = generateSitemap()
const sitemapPath = join(process.cwd(), 'public', 'sitemap.xml')

writeFileSync(sitemapPath, sitemap, 'utf-8')

console.log('✅ Sitemap generated successfully!')
console.log(`📍 Location: ${sitemapPath}`)
console.log(`📅 Last updated: ${currentDate}`)
console.log(`📊 Total URLs: ${courseSlugs.length + 2}`)
