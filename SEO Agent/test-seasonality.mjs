import { SEOSeasonalityCalculator } from './scripts/seo-seasonality-calculator.ts';

const exampleWeeklyBudget = {
  week_start_date: '2026-03-30',
  product_allocations: {
    'vic-selective': {
      phase: 'RAMP_UP',
      seasonal_multiplier: 0.7,
      opportunity_score: 1.04,
    },
    'nsw-selective': {
      phase: 'PEAK',
      seasonal_multiplier: 1.0,
      opportunity_score: 1.0,
    },
    'year-5-naplan': {
      phase: 'TOO_EARLY',
      seasonal_multiplier: 0.0,
      opportunity_score: 1.0,
    },
    'year-7-naplan': {
      phase: 'TOO_EARLY',
      seasonal_multiplier: 0.0,
      opportunity_score: 1.0,
    },
    'acer-scholarship': {
      phase: 'BASELINE',
      seasonal_multiplier: 0.5,
      opportunity_score: 1.3,
    },
    'edutest-scholarship': {
      phase: 'BASELINE',
      seasonal_multiplier: 0.5,
      opportunity_score: 1.2,
    },
  },
};

const testCalendar = [
  { product_slug: 'vic-selective', product_name: 'VIC Selective', test_date_primary: '2026-06-20' },
  { product_slug: 'nsw-selective', product_name: 'NSW Selective', test_date_primary: '2026-05-01' },
  { product_slug: 'year-5-naplan', product_name: 'Year 5 NAPLAN', test_date_primary: '2027-03-09' },
  { product_slug: 'year-7-naplan', product_name: 'Year 7 NAPLAN', test_date_primary: '2027-03-09' },
  { product_slug: 'acer-scholarship', product_name: 'ACER', test_date_primary: '2027-02-01' },
  { product_slug: 'edutest-scholarship', product_name: 'EduTest', test_date_primary: '2027-02-01' },
];

const allocations = SEOSeasonalityCalculator.calculateWeeklyContentAllocation(
  exampleWeeklyBudget,
  testCalendar
);

console.log(SEOSeasonalityCalculator.generateReport(allocations));
