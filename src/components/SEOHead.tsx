import { Helmet } from 'react-helmet-async'

interface SEOMetadata {
  title: string
  description: string
  keywords: string
  ogImage: string
  canonical: string
}

interface SEOHeadProps {
  metadata: SEOMetadata
}

export function SEOHead({ metadata }: SEOHeadProps) {
  const { title, description, keywords, ogImage, canonical } = metadata

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Canonical URL */}
      <link rel="canonical" href={canonical} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`https://educourse.com.au${ogImage}`} />
      <meta property="og:site_name" content="EduCourse" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={canonical} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={`https://educourse.com.au${ogImage}`} />
    </Helmet>
  )
}
