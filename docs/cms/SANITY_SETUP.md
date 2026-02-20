# Sanity.io Blog Setup Guide - EduCourse

**Document Version:** 1.0
**Date:** October 2025
**Owner:** Julian
**Estimated Time:** 6 hours

---

## 📋 Overview

This document provides step-by-step instructions for integrating Sanity.io as a headless CMS for the EduCourse blog. By the end of this guide, you'll have a fully functional blog with:

- ✅ Visual editor at `/studio`
- ✅ Blog listing page at `/blog`
- ✅ Individual post pages at `/blog/:slug`
- ✅ Full SEO optimization
- ✅ Category filtering
- ✅ Search functionality
- ✅ Author profiles
- ✅ Related posts

---

## 🎯 Goals

1. **Easy Content Creation** - Write blog posts without touching code
2. **SEO-Optimized** - Every post has custom meta tags, schema markup
3. **Fast Performance** - CDN-delivered images, cached content
4. **Scalable** - Support multiple authors, categories, tags
5. **Portable** - Own your content, export anytime

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│  Sanity Content Lake (Cloud Database)               │
│  ├── Blog Posts                                     │
│  ├── Authors                                        │
│  ├── Categories                                     │
│  └── Media (Images optimized via CDN)               │
└─────────────────────────────────────────────────────┘
                     ↕ API
┌─────────────────────────────────────────────────────┐
│  Your Website (educourse.com.au)                    │
│  ├── /blog (listing page)                           │
│  ├── /blog/:slug (individual posts)                 │
│  ├── /studio (Sanity Studio - your editor)          │
│  └── src/services/sanityClient.ts (API connector)   │
└─────────────────────────────────────────────────────┘
```

---

## 📦 Phase 1: Sanity Project Setup (30 min)

### Step 1.1: Create Sanity Account & Project

**Action:**
```bash
# Install Sanity CLI globally
npm install -g @sanity/cli

# Create new Sanity project
sanity init
```

**Prompts & Answers:**
```
? Select project: Create new project
? Project name: EduCourse Blog
? Use default dataset: Y
? Output path: ./studio
? Select project template: Clean project with no predefined schemas
? Package manager: npm
```

**What This Creates:**
- Sanity project ID (save this!)
- `/studio` directory with Sanity Studio files
- Dataset: `production`

---

### Step 1.2: Install Sanity Dependencies

**In your main project root:**
```bash
cd /Users/julz88/Documents/educoach-prep-portal-2

# Install Sanity client for React
npm install @sanity/client @sanity/image-url @portabletext/react react-helmet-async
```

**Package Versions:**
```json
{
  "@sanity/client": "^6.10.0",
  "@sanity/image-url": "^1.0.2",
  "@portabletext/react": "^3.0.0",
  "react-helmet-async": "^2.0.4"
}
```

---

### Step 1.3: Configure Sanity Studio

**File:** `studio/sanity.config.ts`

```typescript
import { defineConfig } from 'sanity'
import { deskTool } from 'sanity/desk'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemas'

export default defineConfig({
  name: 'default',
  title: 'EduCourse Blog',

  projectId: 'YOUR_PROJECT_ID', // Replace with actual ID
  dataset: 'production',

  plugins: [
    deskTool(),
    visionTool(), // For testing queries
  ],

  schema: {
    types: schemaTypes,
  },
})
```

---

## 📝 Phase 2: Define Content Schemas (1 hour)

### Step 2.1: Blog Post Schema

**File:** `studio/schemas/post.ts`

```typescript
import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'post',
  title: 'Blog Post',
  type: 'document',
  fields: [
    // Basic Fields
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required().max(80),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{ type: 'author' }],
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'mainImage',
      title: 'Featured Image',
      type: 'image',
      options: {
        hotspot: true, // Enables focal point selection
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative Text',
          description: 'Important for SEO and accessibility',
          validation: Rule => Rule.required(),
        },
      ],
    }),
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      of: [{ type: 'reference', to: { type: 'category' } }],
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 4,
      description: 'Short summary for listing pages (150-160 characters)',
      validation: Rule => Rule.max(160),
    }),
    defineField({
      name: 'body',
      title: 'Content',
      type: 'blockContent', // Rich text editor
    }),

    // SEO Fields
    defineField({
      name: 'seo',
      title: 'SEO Settings',
      type: 'object',
      fields: [
        {
          name: 'metaTitle',
          title: 'Meta Title',
          type: 'string',
          description: 'Custom title for search engines (55-60 chars)',
          validation: Rule => Rule.max(60),
        },
        {
          name: 'metaDescription',
          title: 'Meta Description',
          type: 'text',
          rows: 3,
          description: 'Description for search results (150-160 chars)',
          validation: Rule => Rule.max(160),
        },
        {
          name: 'keywords',
          title: 'Keywords',
          type: 'array',
          of: [{ type: 'string' }],
          description: 'Focus keywords for this post',
        },
        {
          name: 'ogImage',
          title: 'Social Share Image',
          type: 'image',
          description: 'Custom image for social media (1200x630 recommended)',
        },
      ],
    }),

    // Reading Time (calculated automatically)
    defineField({
      name: 'estimatedReadingTime',
      title: 'Estimated Reading Time (minutes)',
      type: 'number',
      readOnly: true,
    }),
  ],

  preview: {
    select: {
      title: 'title',
      author: 'author.name',
      media: 'mainImage',
    },
    prepare(selection) {
      const { author } = selection
      return { ...selection, subtitle: author && `by ${author}` }
    },
  },
})
```

---

### Step 2.2: Author Schema

**File:** `studio/schemas/author.ts`

```typescript
import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'author',
  title: 'Author',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
    }),
    defineField({
      name: 'image',
      title: 'Profile Photo',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'bio',
      title: 'Bio',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'role',
      title: 'Role',
      type: 'string',
      description: 'e.g., "Education Expert", "Content Writer"',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      media: 'image',
    },
  },
})
```

---

### Step 2.3: Category Schema

**File:** `studio/schemas/category.ts`

```typescript
import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
    }),
  ],
})
```

---

### Step 2.4: Block Content (Rich Text) Schema

**File:** `studio/schemas/blockContent.ts`

```typescript
import { defineType, defineArrayMember } from 'sanity'

export default defineType({
  title: 'Block Content',
  name: 'blockContent',
  type: 'array',
  of: [
    defineArrayMember({
      title: 'Block',
      type: 'block',
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'H1', value: 'h1' },
        { title: 'H2', value: 'h2' },
        { title: 'H3', value: 'h3' },
        { title: 'H4', value: 'h4' },
        { title: 'Quote', value: 'blockquote' },
      ],
      lists: [
        { title: 'Bullet', value: 'bullet' },
        { title: 'Numbered', value: 'number' },
      ],
      marks: {
        decorators: [
          { title: 'Strong', value: 'strong' },
          { title: 'Emphasis', value: 'em' },
          { title: 'Code', value: 'code' },
        ],
        annotations: [
          {
            title: 'URL',
            name: 'link',
            type: 'object',
            fields: [
              {
                title: 'URL',
                name: 'href',
                type: 'url',
              },
              {
                title: 'Open in new tab',
                name: 'blank',
                type: 'boolean',
              },
            ],
          },
          {
            title: 'Internal Link',
            name: 'internalLink',
            type: 'object',
            fields: [
              {
                title: 'Reference',
                name: 'reference',
                type: 'reference',
                to: [
                  { type: 'post' },
                  // Add other internal pages if needed
                ],
              },
            ],
          },
        ],
      },
    }),
    // Images in content
    defineArrayMember({
      type: 'image',
      options: { hotspot: true },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative Text',
        },
      ],
    }),
    // Code blocks
    defineArrayMember({
      type: 'code',
      options: {
        language: 'javascript',
        languageAlternatives: [
          { title: 'JavaScript', value: 'javascript' },
          { title: 'TypeScript', value: 'typescript' },
          { title: 'HTML', value: 'html' },
          { title: 'CSS', value: 'css' },
        ],
      },
    }),
  ],
})
```

---

### Step 2.5: Export Schemas

**File:** `studio/schemas/index.ts`

```typescript
import blockContent from './blockContent'
import category from './category'
import post from './post'
import author from './author'

export const schemaTypes = [post, author, category, blockContent]
```

---

## 🚀 Phase 3: Deploy Sanity Studio (30 min)

### Step 3.1: Test Studio Locally

```bash
cd studio
npm run dev
```

**Open:** http://localhost:3333

**Expected:**
- Clean Sanity Studio interface
- "Blog Post", "Author", "Category" in sidebar
- Ability to create content

---

### Step 3.2: Deploy Studio to Vercel

**Option A: Embed in Main App (Recommended)**

**File:** `vite.config.ts` (update)

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy /studio to Sanity Studio
      '/studio': {
        target: 'http://localhost:3333',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/studio/, ''),
      },
    },
  },
})
```

**For Production:**
Create separate Vercel project for Studio or use Sanity's hosted option.

**Option B: Separate Subdomain**
- Deploy studio to `studio.educourse.com.au`
- Configure CORS in Sanity project settings

---

### Step 3.3: Configure CORS

**Sanity Dashboard:**
1. Go to https://www.sanity.io/manage
2. Select your project
3. Settings → API
4. Add CORS origins:
   - `https://educourse.com.au`
   - `http://localhost:5173` (for development)

---

## 🔌 Phase 4: Connect to React App (2 hours)

### Step 4.1: Create Sanity Client

**File:** `src/lib/sanity.config.ts`

```typescript
export const sanityConfig = {
  projectId: 'YOUR_PROJECT_ID', // From Sanity dashboard
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: true, // Use CDN for faster loading
}
```

---

### Step 4.2: Create Sanity Client Service

**File:** `src/services/sanityClient.ts`

```typescript
import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'
import { sanityConfig } from '@/lib/sanity.config'

// Create client
export const sanityClient = createClient(sanityConfig)

// Image URL builder
const builder = imageUrlBuilder(sanityClient)

export function urlFor(source: any) {
  return builder.image(source)
}

// Fetch all blog posts
export async function getAllPosts() {
  return await sanityClient.fetch(`
    *[_type == "post"] | order(publishedAt desc) {
      _id,
      title,
      slug,
      publishedAt,
      excerpt,
      estimatedReadingTime,
      "author": author->{name, slug, image},
      "categories": categories[]->title,
      mainImage,
      seo
    }
  `)
}

// Fetch single post by slug
export async function getPostBySlug(slug: string) {
  return await sanityClient.fetch(
    `
    *[_type == "post" && slug.current == $slug][0] {
      _id,
      title,
      slug,
      publishedAt,
      body,
      mainImage,
      seo,
      estimatedReadingTime,
      "author": author->{
        name,
        slug,
        image,
        bio,
        role
      },
      "categories": categories[]->{
        title,
        slug
      },
      "relatedPosts": *[_type == "post" && slug.current != $slug && count((categories[]._ref)[@ in ^.^.categories[]._ref]) > 0] | order(publishedAt desc) [0...3] {
        title,
        slug,
        excerpt,
        mainImage,
        publishedAt
      }
    }
  `,
    { slug }
  )
}

// Fetch posts by category
export async function getPostsByCategory(categorySlug: string) {
  return await sanityClient.fetch(
    `
    *[_type == "post" && $categorySlug in categories[]->slug.current] | order(publishedAt desc) {
      _id,
      title,
      slug,
      publishedAt,
      excerpt,
      mainImage,
      "author": author->{name, slug, image},
      "categories": categories[]->title
    }
  `,
    { categorySlug }
  )
}

// Fetch all categories
export async function getAllCategories() {
  return await sanityClient.fetch(`
    *[_type == "category"] | order(title asc) {
      _id,
      title,
      slug,
      description
    }
  `)
}

// Search posts
export async function searchPosts(query: string) {
  return await sanityClient.fetch(
    `
    *[_type == "post" && (
      title match $searchQuery ||
      excerpt match $searchQuery ||
      pt::text(body) match $searchQuery
    )] | order(publishedAt desc) {
      _id,
      title,
      slug,
      publishedAt,
      excerpt,
      mainImage,
      "author": author->{name, slug, image}
    }
  `,
    { searchQuery: `*${query}*` }
  )
}
```

---

### Step 4.3: Create Blog Listing Page

**File:** `src/pages/Blog.tsx`

```typescript
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { getAllPosts, getAllCategories, urlFor } from '@/services/sanityClient'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Calendar, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'

export default function Blog() {
  const [posts, setPosts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const [postsData, categoriesData] = await Promise.all([
        getAllPosts(),
        getAllCategories(),
      ])
      setPosts(postsData)
      setCategories(categoriesData)
      setLoading(false)
    }
    fetchData()
  }, [])

  const filteredPosts = selectedCategory
    ? posts.filter(post => post.categories?.includes(selectedCategory))
    : posts

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4ECDC4]" />
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Blog - Test Prep Tips & Resources | EduCourse</title>
        <meta
          name="description"
          content="Expert tips and resources for NAPLAN, selective entry, and scholarship exam preparation. Learn from education experts."
        />
        <link rel="canonical" href="https://educourse.com.au/blog" />
      </Helmet>

      <div className="min-h-screen bg-white">
        {/* Header */}
        <section className="pt-24 pb-12 bg-gradient-to-b from-[#E6F7F5] to-white">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold text-[#2C3E50] mb-4 text-center">
              Test Prep Insights
            </h1>
            <p className="text-xl text-[#6B7280] text-center max-w-2xl mx-auto">
              Expert tips, strategies, and resources for exam success
            </p>
          </div>
        </section>

        {/* Category Filter */}
        <section className="py-8 border-b">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                variant={selectedCategory === null ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(null)}
                className={selectedCategory === null ? 'bg-[#6366F1]' : ''}
              >
                All Posts
              </Button>
              {categories.map(category => (
                <Button
                  key={category._id}
                  variant={selectedCategory === category.title ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(category.title)}
                  className={
                    selectedCategory === category.title ? 'bg-[#6366F1]' : ''
                  }
                >
                  {category.title}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Blog Posts Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map(post => (
                <Card
                  key={post._id}
                  className="group hover:shadow-xl transition-all duration-300"
                >
                  <Link to={`/blog/${post.slug.current}`}>
                    {/* Featured Image */}
                    {post.mainImage && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={urlFor(post.mainImage).width(600).height(400).url()}
                          alt={post.mainImage.alt || post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}

                    <CardHeader>
                      <div className="flex items-center gap-4 text-sm text-[#6B7280] mb-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(post.publishedAt), 'MMM d, yyyy')}
                        </span>
                        {post.estimatedReadingTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {post.estimatedReadingTime} min read
                          </span>
                        )}
                      </div>
                      <h2 className="text-2xl font-bold text-[#2C3E50] group-hover:text-[#6366F1] transition-colors">
                        {post.title}
                      </h2>
                    </CardHeader>

                    <CardContent>
                      <p className="text-[#6B7280] mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>

                      {/* Categories */}
                      {post.categories && post.categories.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.categories.map((cat: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-[#E6F7F5] text-[#4ECDC4] text-xs rounded-full"
                            >
                              {cat}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Author */}
                      {post.author && (
                        <div className="flex items-center gap-3">
                          {post.author.image && (
                            <img
                              src={urlFor(post.author.image).width(40).height(40).url()}
                              alt={post.author.name}
                              className="w-10 h-10 rounded-full"
                            />
                          )}
                          <span className="text-sm text-[#6B7280]">
                            {post.author.name}
                          </span>
                        </div>
                      )}

                      <Button
                        variant="link"
                        className="mt-4 p-0 text-[#6366F1] group-hover:translate-x-1 transition-transform"
                      >
                        Read More <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>

            {filteredPosts.length === 0 && (
              <div className="text-center py-16">
                <p className="text-xl text-[#6B7280]">
                  No posts found in this category.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  )
}
```

---

### Step 4.4: Create Individual Post Page

**File:** `src/pages/BlogPost.tsx`

```typescript
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { PortableText } from '@portabletext/react'
import { getPostBySlug, urlFor } from '@/services/sanityClient'
import { format } from 'date-fns'
import { Clock, Calendar, ArrowLeft, Share2, Facebook, Twitter, Linkedin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// Custom components for PortableText rendering
const portableTextComponents = {
  types: {
    image: ({ value }: any) => (
      <img
        src={urlFor(value).width(800).url()}
        alt={value.alt || 'Blog image'}
        className="w-full rounded-lg my-8"
      />
    ),
    code: ({ value }: any) => (
      <pre className="bg-gray-900 text-white p-4 rounded-lg my-6 overflow-x-auto">
        <code>{value.code}</code>
      </pre>
    ),
  },
  marks: {
    link: ({ children, value }: any) => (
      <a
        href={value.href}
        target={value.blank ? '_blank' : '_self'}
        rel={value.blank ? 'noopener noreferrer' : ''}
        className="text-[#6366F1] hover:underline"
      >
        {children}
      </a>
    ),
  },
  block: {
    h1: ({ children }: any) => (
      <h1 className="text-4xl font-bold text-[#2C3E50] mt-12 mb-6">{children}</h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-3xl font-bold text-[#2C3E50] mt-10 mb-4">{children}</h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-2xl font-bold text-[#2C3E50] mt-8 mb-3">{children}</h3>
    ),
    normal: ({ children }: any) => (
      <p className="text-lg text-[#4B5563] leading-relaxed mb-6">{children}</p>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-[#4ECDC4] pl-6 italic text-[#6B7280] my-8">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }: any) => (
      <ul className="list-disc list-inside space-y-2 my-6 text-[#4B5563]">
        {children}
      </ul>
    ),
    number: ({ children }: any) => (
      <ol className="list-decimal list-inside space-y-2 my-6 text-[#4B5563]">
        {children}
      </ol>
    ),
  },
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPost() {
      if (!slug) return
      setLoading(true)
      const data = await getPostBySlug(slug)
      setPost(data)
      setLoading(false)
    }
    fetchPost()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4ECDC4]" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#2C3E50] mb-4">Post Not Found</h1>
          <Link to="/blog">
            <Button>Back to Blog</Button>
          </Link>
        </div>
      </div>
    )
  }

  const pageUrl = `https://educourse.com.au/blog/${post.slug.current}`
  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${pageUrl}&text=${post.title}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${pageUrl}`,
  }

  return (
    <>
      <Helmet>
        <title>{post.seo?.metaTitle || post.title} | EduCourse Blog</title>
        <meta
          name="description"
          content={post.seo?.metaDescription || post.excerpt}
        />
        {post.seo?.keywords && (
          <meta name="keywords" content={post.seo.keywords.join(', ')} />
        )}
        <link rel="canonical" href={pageUrl} />

        {/* Open Graph */}
        <meta property="og:title" content={post.title} />
        <meta
          property="og:description"
          content={post.seo?.metaDescription || post.excerpt}
        />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:type" content="article" />
        {post.mainImage && (
          <meta
            property="og:image"
            content={urlFor(post.mainImage).width(1200).height(630).url()}
          />
        )}

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta
          name="twitter:description"
          content={post.seo?.metaDescription || post.excerpt}
        />
        {post.mainImage && (
          <meta
            name="twitter:image"
            content={urlFor(post.mainImage).width(1200).height(630).url()}
          />
        )}

        {/* Article Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.excerpt,
            image: post.mainImage
              ? urlFor(post.mainImage).width(1200).height(630).url()
              : undefined,
            datePublished: post.publishedAt,
            author: {
              '@type': 'Person',
              name: post.author.name,
            },
            publisher: {
              '@type': 'Organization',
              name: 'EduCourse',
              logo: {
                '@type': 'ImageObject',
                url: 'https://educourse.com.au/images/educourse-logo.png',
              },
            },
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-white">
        {/* Back Button */}
        <div className="container mx-auto px-4 pt-24 pb-8">
          <Link to="/blog">
            <Button variant="ghost" className="group">
              <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Back to Blog
            </Button>
          </Link>
        </div>

        {/* Article Header */}
        <article className="container mx-auto px-4 max-w-4xl pb-16">
          {/* Categories */}
          {post.categories && post.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.categories.map((cat: any) => (
                <span
                  key={cat.slug.current}
                  className="px-3 py-1 bg-[#E6F7F5] text-[#4ECDC4] text-sm rounded-full"
                >
                  {cat.title}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-[#2C3E50] mb-6">
            {post.title}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-6 text-[#6B7280] mb-8">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(post.publishedAt), 'MMMM d, yyyy')}</span>
            </div>
            {post.estimatedReadingTime && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{post.estimatedReadingTime} min read</span>
              </div>
            )}
          </div>

          {/* Author */}
          {post.author && (
            <div className="flex items-center gap-4 mb-8 pb-8 border-b">
              {post.author.image && (
                <img
                  src={urlFor(post.author.image).width(80).height(80).url()}
                  alt={post.author.name}
                  className="w-16 h-16 rounded-full"
                />
              )}
              <div>
                <p className="font-semibold text-[#2C3E50]">
                  {post.author.name}
                </p>
                {post.author.role && (
                  <p className="text-sm text-[#6B7280]">{post.author.role}</p>
                )}
              </div>
            </div>
          )}

          {/* Featured Image */}
          {post.mainImage && (
            <div className="mb-12 rounded-2xl overflow-hidden">
              <img
                src={urlFor(post.mainImage).width(1200).url()}
                alt={post.mainImage.alt || post.title}
                className="w-full"
              />
            </div>
          )}

          {/* Article Content */}
          <div className="prose prose-lg max-w-none">
            <PortableText value={post.body} components={portableTextComponents} />
          </div>

          {/* Share Buttons */}
          <div className="mt-12 pt-8 border-t">
            <p className="text-sm text-[#6B7280] mb-4">Share this post:</p>
            <div className="flex gap-3">
              <a
                href={shareLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-[#1877F2] text-white rounded-full hover:opacity-80 transition"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href={shareLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-[#1DA1F2] text-white rounded-full hover:opacity-80 transition"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href={shareLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-[#0A66C2] text-white rounded-full hover:opacity-80 transition"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Author Bio */}
          {post.author && post.author.bio && (
            <Card className="mt-12 p-6 bg-[#F8F9FA]">
              <div className="flex items-start gap-4">
                {post.author.image && (
                  <img
                    src={urlFor(post.author.image).width(100).height(100).url()}
                    alt={post.author.name}
                    className="w-20 h-20 rounded-full flex-shrink-0"
                  />
                )}
                <div>
                  <h3 className="text-xl font-bold text-[#2C3E50] mb-2">
                    About {post.author.name}
                  </h3>
                  <p className="text-[#6B7280]">{post.author.bio}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Related Posts */}
          {post.relatedPosts && post.relatedPosts.length > 0 && (
            <div className="mt-16">
              <h2 className="text-3xl font-bold text-[#2C3E50] mb-8">
                Related Posts
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {post.relatedPosts.map((relatedPost: any) => (
                  <Link
                    key={relatedPost.slug.current}
                    to={`/blog/${relatedPost.slug.current}`}
                    className="group"
                  >
                    <Card className="h-full hover:shadow-lg transition-shadow">
                      {relatedPost.mainImage && (
                        <div className="aspect-video overflow-hidden">
                          <img
                            src={urlFor(relatedPost.mainImage)
                              .width(400)
                              .height(250)
                              .url()}
                            alt={relatedPost.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-bold text-[#2C3E50] group-hover:text-[#6366F1] transition-colors">
                          {relatedPost.title}
                        </h3>
                        <p className="text-sm text-[#6B7280] mt-2 line-clamp-2">
                          {relatedPost.excerpt}
                        </p>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>
    </>
  )
}
```

---

### Step 4.5: Update App Routes

**File:** `src/App.tsx` (add blog routes)

```typescript
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'

// Inside Routes:
<Route path="/blog" element={<Blog />} />
<Route path="/blog/:slug" element={<BlogPost />} />
```

---

## ✅ Phase 5: Testing & Launch (1 hour)

### Step 5.1: Create Test Content

**In Sanity Studio:**

1. **Create Author:**
   - Name: Julian (or your name)
   - Role: Education Expert
   - Bio: Brief bio
   - Upload photo

2. **Create Categories:**
   - NAPLAN
   - Selective Entry
   - Study Tips
   - Test Preparation

3. **Create First Post:**
   - Title: "How to Prepare for NAPLAN 2025"
   - Write 500+ words
   - Add featured image
   - Set SEO meta tags
   - Publish

---

### Step 5.2: Test Locally

**Checklist:**
- [ ] `/blog` shows all posts
- [ ] Category filtering works
- [ ] `/blog/how-to-prepare-for-naplan-2025` loads correctly
- [ ] Images display properly
- [ ] SEO meta tags present (view page source)
- [ ] Mobile responsive
- [ ] Fast loading (<2s)

---

### Step 5.3: Deploy to Production

```bash
# Build and deploy
npm run build
git add .
git commit -m "Add Sanity blog integration"
git push origin main
```

**Vercel auto-deploys!**

---

### Step 5.4: Update Sitemap

**Add blog posts to sitemap:**

**File:** `scripts/generate-sitemap.ts` (update to fetch from Sanity)

```typescript
import { sanityClient } from '../src/services/sanityClient'

// Fetch blog posts
const posts = await sanityClient.fetch(`
  *[_type == "post"] {
    "slug": slug.current,
    publishedAt
  }
`)

// Add to sitemap
posts.forEach(post => {
  // Add blog post URL with lastmod date
})
```

---

## 📝 Phase 6: Writing Workflow (Ongoing)

### Your Weekly Routine:

**Step 1: Plan Your Post (15 min)**
- Choose topic (from SEO keyword research)
- Create outline (H2, H3 headings)
- List key points to cover

**Step 2: Write in Sanity Studio (1-2 hours)**
1. Open https://educourse.com.au/studio
2. Click "Create New Post"
3. Fill in:
   - Title (keyword-optimized)
   - Slug (auto-generated)
   - Content (rich text editor)
   - Featured image
   - Category
   - SEO meta title & description
   - Keywords

**Step 3: Optimize for SEO (15 min)**
- [ ] Primary keyword in title
- [ ] Keyword in first paragraph
- [ ] 2-3 H2 headings with keywords
- [ ] 2-3 internal links to product pages
- [ ] 1-2 external links to authorities
- [ ] Featured image with alt text
- [ ] Meta description (150-160 chars)

**Step 4: Publish (1 min)**
- Click "Publish"
- Post goes live immediately!

**Total Time:** 2-3 hours per post

---

## 🚀 Next Steps

1. **Complete this setup guide** (6 hours)
2. **Create 4 initial posts** (8-12 hours)
3. **Monitor performance** in Google Search Console
4. **Iterate and improve** based on data

---

## 📞 Support

**Sanity Documentation:** https://www.sanity.io/docs
**Sanity Community:** https://www.sanity.io/slack
**PortableText:** https://portabletext.org/

---

## ✅ Checklist: Blog Setup Complete

- [ ] Sanity project created
- [ ] Schemas defined (post, author, category)
- [ ] Studio deployed
- [ ] Sanity client integrated
- [ ] `/blog` page created
- [ ] `/blog/:slug` page created
- [ ] Routes added to App.tsx
- [ ] First test post published
- [ ] SEO meta tags working
- [ ] Sitemap updated
- [ ] Mobile responsive tested
- [ ] Performance optimized

**Once all checked: Your blog is live!** 🎉

---

**Last Updated:** October 2025
**Next Review:** After first month of blogging
