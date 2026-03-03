/**
 * Test script for table formatting functionality
 * This demonstrates how the table conversion works
 */

import { convertMarkdownTableToHtml, containsMarkdownTable } from '../src/utils/tableFormatter';

// Test case 1: Simple table from the user's screenshot
const testQuestion1 = `A florist recorded the number of bouquets sold each day over one week:

| Day | Bouquets Sold |
|---|---|
| Monday | 28 |
| Tuesday | 35 |
| Wednesday | 42 |
| Thursday | 31 |
| Friday | 56 |
| Saturday | 63 |
| Sunday | 49 |

How many days had sales of more than 40 bouquets?`;

// Test case 2: Table without explicit separator
const testQuestion2 = `Compare the temperatures:

| City | Temperature |
| Sydney | 28°C |
| Melbourne | 22°C |
| Brisbane | 30°C |

Which city is the warmest?`;

// Test case 3: Multi-column table
const testQuestion3 = `Study the data:

| Product | Price | Stock | Sales |
|---|---|---|---|
| Apples | $3.50 | 120 | 45 |
| Bananas | $2.80 | 200 | 78 |
| Oranges | $4.20 | 150 | 32 |

Calculate the total revenue from apple sales.`;

console.log('='.repeat(80));
console.log('TABLE FORMATTING TEST');
console.log('='.repeat(80));

function testConversion(testName: string, questionText: string) {
  console.log(`\n\n${testName}`);
  console.log('-'.repeat(80));

  console.log('\n📝 ORIGINAL TEXT:');
  console.log(questionText);

  const hasTable = containsMarkdownTable(questionText);
  console.log(`\n🔍 Contains table: ${hasTable ? 'YES' : 'NO'}`);

  if (hasTable) {
    const converted = convertMarkdownTableToHtml(questionText);
    console.log('\n✨ CONVERTED HTML:');
    console.log(converted);
  }
}

testConversion('TEST 1: Simple Two-Column Table', testQuestion1);
testConversion('TEST 2: Table Without Separator', testQuestion2);
testConversion('TEST 3: Multi-Column Table', testQuestion3);

console.log('\n\n' + '='.repeat(80));
console.log('✅ All tests completed!');
console.log('='.repeat(80));
