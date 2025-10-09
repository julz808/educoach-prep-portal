import { useLocation } from 'react-router-dom'
import seoMetadata from '@/config/seo-metadata.json'

interface SEOMetadata {
  title: string
  description: string
  keywords: string
  ogImage: string
  canonical: string
}

// Default fallback metadata
const defaultMetadata: SEOMetadata = {
  title: 'EduCourse - Test Preparation Platform',
  description: 'Australia\'s premier test preparation platform for NAPLAN, Selective Entry & Scholarship exams.',
  keywords: 'test preparation, NAPLAN, selective entry, scholarship exams',
  ogImage: '/images/og-home.png',
  canonical: 'https://educourse.com.au',
}

export function useSEOMetadata(customPath?: string): SEOMetadata {
  const location = useLocation()
  const path = customPath || location.pathname

  // Get metadata for current path or use default
  const metadata = (seoMetadata as Record<string, SEOMetadata>)[path] || defaultMetadata

  return metadata
}
