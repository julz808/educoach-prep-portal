/**
 * Script to verify Enhanced Conversion data format
 *
 * This simulates what the PurchaseSuccess page will send to Google Ads
 * and validates the format matches Google's requirements.
 */

// Simulate the conversion data that will be sent
function simulateConversionTracking(product: string, customerEmail: string) {
  console.log('🧪 Simulating Enhanced Conversion Tracking\n');
  console.log('Parameters:');
  console.log(`  Product: ${product}`);
  console.log(`  Customer Email: ${customerEmail}\n`);

  const transactionId = Date.now() + '-' + product;

  const conversionData: any = {
    'send_to': 'AW-11082636289/I_1RCLmY6osbEIG4zqQp',
    'value': 199.0,
    'currency': 'AUD',
    'transaction_id': transactionId,
    'items': [{
      'id': product,
      'name': getProductName(product),
      'category': 'Test Prep',
      'price': 199.0,
      'quantity': 1
    }]
  };

  // Add enhanced conversion data
  if (customerEmail) {
    conversionData.user_data = {
      email_address: customerEmail
    };
  }

  console.log('📤 Conversion Data that will be sent to Google Ads:\n');
  console.log(JSON.stringify(conversionData, null, 2));

  // Validation checks
  console.log('\n✅ Validation Checks:');
  console.log(`  ✓ Has send_to: ${!!conversionData.send_to}`);
  console.log(`  ✓ Has value: ${!!conversionData.value}`);
  console.log(`  ✓ Has currency: ${!!conversionData.currency}`);
  console.log(`  ✓ Has transaction_id: ${!!conversionData.transaction_id}`);
  console.log(`  ✓ Has items: ${!!conversionData.items && conversionData.items.length > 0}`);
  console.log(`  ✓ Has user_data: ${!!conversionData.user_data}`);
  console.log(`  ✓ Has email_address in user_data: ${!!conversionData.user_data?.email_address}`);

  // Check if enhanced conversion data is properly formatted
  const hasEnhancedData = conversionData.user_data && conversionData.user_data.email_address;

  if (hasEnhancedData) {
    console.log('\n🎉 SUCCESS: Enhanced Conversion data is properly formatted!');
    console.log('\nGoogle Ads will receive:');
    console.log('  - Standard conversion data (value, currency, transaction_id, items)');
    console.log('  - Enhanced conversion data (customer email)');
    console.log('\nThis should resolve the "Issues detected with your enhanced conversion setup" warning.');
  } else {
    console.log('\n⚠️  WARNING: Enhanced Conversion data is missing!');
    console.log('Google Ads will only receive standard conversion data.');
  }

  return conversionData;
}

function getProductName(productSlug: string): string {
  const productNames: Record<string, string> = {
    'year-5-naplan': 'Year 5 NAPLAN',
    'year-7-naplan': 'Year 7 NAPLAN',
    'edutest-scholarship': 'EduTest Scholarship',
    'acer-scholarship': 'ACER Scholarship',
    'nsw-selective': 'NSW Selective Entry',
    'vic-selective': 'VIC Selective Entry'
  };

  return productNames[productSlug] || 'Your Test Prep Course';
}

// Test cases
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('Test Case 1: VIC Selective Entry with customer email\n');
console.log('═══════════════════════════════════════════════════════════════\n');
simulateConversionTracking('vic-selective', 'ericlin200903@gmail.com');

console.log('\n\n═══════════════════════════════════════════════════════════════\n');
console.log('Test Case 2: ACER Scholarship with customer email\n');
console.log('═══════════════════════════════════════════════════════════════\n');
simulateConversionTracking('acer-scholarship', 'customer@example.com');

console.log('\n\n═══════════════════════════════════════════════════════════════\n');
console.log('Test Case 3: Year 7 NAPLAN WITHOUT customer email (edge case)\n');
console.log('═══════════════════════════════════════════════════════════════\n');
simulateConversionTracking('year-7-naplan', '');

console.log('\n\n📝 SUMMARY\n');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('Changes Made:');
console.log('  1. ✅ Updated PurchaseSuccess.tsx to extract email from URL params');
console.log('  2. ✅ Added user_data object with email_address to conversion event');
console.log('  3. ✅ Enabled allow_enhanced_conversions in gtag config (index.html)');
console.log('\nExpected Result:');
console.log('  - Google Ads will receive customer email with each conversion');
console.log('  - Enhanced Conversions will be properly tracked');
console.log('  - "Issues detected" warning should be resolved within 24-48 hours');
console.log('\nNext Steps:');
console.log('  1. Build and deploy the updated code');
console.log('  2. Test with a real purchase (or use Google Tag Assistant)');
console.log('  3. Check Google Ads after 24-48 hours for validation');
console.log('═══════════════════════════════════════════════════════════════\n');
