/**
 * Shared Configuration for Marketing Agents
 *
 * This file contains all configuration settings for the Google Ads Agent
 * and CRO Agent. Update these values to customize agent behavior.
 */

export const GENERAL_CONFIG = {
  // Hard cap on daily budget across all campaigns
  DAILY_BUDGET_CAP_AUD: 150,

  // Maximum percentage change in budget per week (25% = moderate risk)
  WEEKLY_CHANGE_LIMIT_PERCENTAGE: 25,

  // Email for notifications
  NOTIFICATION_EMAIL: 'julian@educourse.com.au',
};

export const GOOGLE_ADS_CONFIG = {
  // Auto-graduation from Maximize Clicks to Maximize Conversions
  AUTO_GRADUATE_ENABLED: true,
  MIN_CONVERSIONS_FOR_GRADUATION: 15,
  GRADUATION_MONITORING_HOURS: 48,
  MAX_CPA_SPIKE_PERCENTAGE_FOR_ROLLBACK: 40,

  // Negative keyword mining
  NEGATIVE_KEYWORD_APPROVAL_REQUIRED: true,
  MIN_CLICKS_FOR_NEGATIVE_FLAG: 20,
  MIN_COST_FOR_NEGATIVE_FLAG_AUD: 30,

  // High performer criteria
  MIN_CLICKS_FOR_HIGH_PERFORMER: 10,
  MIN_CONVERSIONS_FOR_HIGH_PERFORMER: 2,
  MIN_CONVERSION_RATE_FOR_HIGH_PERFORMER: 5, // percentage
};

export const CRO_CONFIG = {
  // Conversion rate monitoring
  MIN_SESSIONS_FOR_ANALYSIS: 100,
  CONVERSION_RATE_DROP_THRESHOLD_PERCENTAGE: 20,

  // A/B testing
  MIN_SAMPLE_SIZE_PER_VARIANT: 500,
  MIN_CONFIDENCE_LEVEL: 95, // percentage
};

export interface ProductConfig {
  slug: string;
  name: string;
  landingPageUrl: string;
  price: number;
}

export const PRODUCTS: ProductConfig[] = [
  {
    slug: 'vic-selective',
    name: 'VIC Selective Entry',
    landingPageUrl: 'https://educourse.com.au/course/vic-selective',
    price: 199,
  },
  {
    slug: 'edutest-scholarship',
    name: 'EduTest Scholarship',
    landingPageUrl: 'https://educourse.com.au/course/edutest-scholarship',
    price: 199,
  },
  {
    slug: 'acer-scholarship',
    name: 'ACER Scholarship',
    landingPageUrl: 'https://educourse.com.au/course/acer-scholarship',
    price: 199,
  },
  {
    slug: 'nsw-selective',
    name: 'NSW Selective Entry',
    landingPageUrl: 'https://educourse.com.au/course/nsw-selective',
    price: 199,
  },
  {
    slug: 'year-5-naplan',
    name: 'Year 5 NAPLAN',
    landingPageUrl: 'https://educourse.com.au/course/year-5-naplan',
    price: 149,
  },
  {
    slug: 'year-7-naplan',
    name: 'Year 7 NAPLAN',
    landingPageUrl: 'https://educourse.com.au/course/year-7-naplan',
    price: 149,
  },
];
