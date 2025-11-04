import { Helmet } from 'react-helmet-async'
import { Course } from '@/types'

interface CourseSchemaProps {
  course: Course
}

export function CourseSchema({ course }: CourseSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": `${course.title} Preparation`,
    "description": course.description,
    "provider": {
      "@type": "EducationalOrganization",
      "name": "EduCourse",
      "url": "https://educourse.com.au",
      "logo": "https://educourse.com.au/images/educourse-logo.png"
    },
    "educationalLevel": "Secondary School",
    "courseCode": course.slug,
    "hasCourseInstance": {
      "@type": "CourseInstance",
      "courseMode": "online",
      "courseWorkload": "PT8H" // Self-paced, estimated 8 hours
    },
    "offers": {
      "@type": "Offer",
      "price": "199",
      "priceCurrency": "AUD",
      "availability": "https://schema.org/InStock",
      "url": `https://educourse.com.au/course/${course.slug}`,
      "category": "Education",
      "priceValidUntil": "2026-12-31",
      "seller": {
        "@type": "EducationalOrganization",
        "name": "EduCourse"
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "5",
      "bestRating": "5",
      "worstRating": "1",
      "ratingCount": "127"
    },
    "review": [
      {
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5"
        },
        "author": {
          "@type": "Person",
          "name": "Michelle K."
        },
        "reviewBody": "The sub-skill analytics were a game-changer. We could see exactly where my child needed improvement and track progress week by week."
      },
      {
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5"
        },
        "author": {
          "@type": "Person",
          "name": "David R."
        },
        "reviewBody": "Finally, a platform that actually prepares kids for the real test environment. The questions are spot-on, and the detailed feedback is excellent."
      }
    ],
    "teaches": [
      "Test preparation strategies",
      "Performance analytics",
      "Sub-skill level tracking",
      "Practice tests and drills"
    ],
    "timeRequired": "PT8H",
    "inLanguage": "en-AU",
    "availableLanguage": {
      "@type": "Language",
      "name": "English",
      "alternateName": "en-AU"
    }
  }

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  )
}
