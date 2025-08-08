// Stripe Configuration
// Maps internal product IDs to Stripe price IDs

export interface StripeProductConfig {
  productId: string;
  priceId: string;
  name: string;
  dbProductType: string;
}

// Map of internal product IDs to Stripe configuration
export const STRIPE_PRODUCTS: Record<string, StripeProductConfig> = {
  'year-5-naplan': {
    productId: import.meta.env.VITE_STRIPE_YEAR_5_NAPLAN_PRODUCT_ID || '',
    priceId: import.meta.env.VITE_STRIPE_YEAR_5_NAPLAN_PRICE_ID || '',
    name: 'Year 5 NAPLAN',
    dbProductType: 'Year 5 NAPLAN'
  },
  'year-7-naplan': {
    productId: import.meta.env.VITE_STRIPE_YEAR_7_NAPLAN_PRODUCT_ID || '',
    priceId: import.meta.env.VITE_STRIPE_YEAR_7_NAPLAN_PRICE_ID || '',
    name: 'Year 7 NAPLAN',
    dbProductType: 'Year 7 NAPLAN'
  },
  'edutest-scholarship': {
    productId: import.meta.env.VITE_STRIPE_EDUTEST_SCHOLARSHIP_PRODUCT_ID || '',
    priceId: import.meta.env.VITE_STRIPE_EDUTEST_SCHOLARSHIP_PRICE_ID || '',
    name: 'EduTest Scholarship (Year 7 Entry)',
    dbProductType: 'EduTest Scholarship (Year 7 Entry)'
  },
  'acer-scholarship': {
    productId: import.meta.env.VITE_STRIPE_ACER_SCHOLARSHIP_PRODUCT_ID || '',
    priceId: import.meta.env.VITE_STRIPE_ACER_SCHOLARSHIP_PRICE_ID || '',
    name: 'ACER Scholarship (Year 7 Entry)',
    dbProductType: 'ACER Scholarship (Year 7 Entry)'
  },
  'nsw-selective': {
    productId: import.meta.env.VITE_STRIPE_NSW_SELECTIVE_PRODUCT_ID || '',
    priceId: import.meta.env.VITE_STRIPE_NSW_SELECTIVE_PRICE_ID || '',
    name: 'NSW Selective Entry (Year 7 Entry)',
    dbProductType: 'NSW Selective Entry (Year 7 Entry)'
  },
  'vic-selective': {
    productId: import.meta.env.VITE_STRIPE_VIC_SELECTIVE_PRODUCT_ID || '',
    priceId: import.meta.env.VITE_STRIPE_VIC_SELECTIVE_PRICE_ID || '',
    name: 'VIC Selective Entry (Year 9 Entry)',
    dbProductType: 'VIC Selective Entry (Year 9 Entry)'
  }
};

// Get Stripe configuration for a product
export function getStripeProductConfig(productId: string): StripeProductConfig | null {
  return STRIPE_PRODUCTS[productId] || null;
}

// Check if Stripe is properly configured
export function isStripeConfigured(): boolean {
  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  return !!publishableKey && publishableKey !== 'pk_test_your_publishable_key_here';
}

// Get Stripe publishable key
export function getStripePublishableKey(): string {
  return import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
}

// Feature flags
export function isAccessControlEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_ACCESS_CONTROL === 'true';
}

export function isPaywallUIEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_PAYWALL_UI === 'true';
}