// Rate Limiting Test Script
// Tests the rate limiting functionality for Edge Functions

async function testRateLimit() {
  console.log('🧪 Testing Rate Limiting Implementation...');
  
  // You'll need to update these URLs to your actual Supabase function URLs
  const SUPABASE_URL = 'https://mcxxiunseawojmojikvb.supabase.co';
  const QUESTION_GENERATION_URL = `${SUPABASE_URL}/functions/v1/generate-questions`;
  const WRITING_ASSESSMENT_URL = `${SUPABASE_URL}/functions/v1/assess-writing`;
  
  // You'll need a valid auth token - get this from your browser dev tools
  // or from a logged-in session
  const AUTH_TOKEN = 'YOUR_AUTH_TOKEN_HERE'; // Replace with real token
  
  const headers = {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json'
  };
  
  // Test payload for question generation
  const questionGenPayload = {
    testType: 'VIC Selective Entry (Year 9 Entry)',
    yearLevel: '9',
    sectionName: 'Mathematics',
    subSkill: 'Algebra',
    difficulty: 1,
    questionCount: 1
  };
  
  // Test payload for writing assessment
  const writingAssessmentPayload = {
    userResponse: 'This is a test response.',
    writingPrompt: 'Write about your favorite hobby.',
    rubric: {
      totalMarks: 10,
      criteria: [
        { name: 'Content', maxMarks: 5, description: 'Quality of content' },
        { name: 'Grammar', maxMarks: 5, description: 'Grammar and spelling' }
      ]
    },
    yearLevel: '7'
  };
  
  console.log('\n1. Testing Question Generation Rate Limiting...');
  await testEndpoint(QUESTION_GENERATION_URL, questionGenPayload, headers, 'question-generation');
  
  console.log('\n2. Testing Writing Assessment Rate Limiting...');
  await testEndpoint(WRITING_ASSESSMENT_URL, writingAssessmentPayload, headers, 'writing-assessment');
  
  console.log('\n✅ Rate limiting tests completed!');
}

async function testEndpoint(url, payload, headers, endpointName) {
  console.log(`\n📡 Testing ${endpointName} endpoint...`);
  
  // Send rapid requests to trigger rate limiting
  const requestCount = 5;
  const promises = [];
  
  for (let i = 0; i < requestCount; i++) {
    promises.push(
      fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      }).then(async response => {
        const data = await response.json().catch(() => ({}));
        return {
          requestNumber: i + 1,
          status: response.status,
          rateLimitHeaders: {
            userLimit: response.headers.get('X-RateLimit-Limit-User'),
            userRemaining: response.headers.get('X-RateLimit-Remaining-User'),
            ipLimit: response.headers.get('X-RateLimit-Limit-IP'),
            ipRemaining: response.headers.get('X-RateLimit-Remaining-IP'),
            retryAfter: response.headers.get('Retry-After')
          },
          error: data.error || null,
          success: response.status === 200
        };
      }).catch(error => ({
        requestNumber: i + 1,
        status: 'ERROR',
        error: error.message,
        success: false
      }))
    );
  }
  
  try {
    const results = await Promise.all(promises);
    
    console.log('\n📊 Results:');
    results.forEach(result => {
      console.log(`Request ${result.requestNumber}: ${result.status} ${result.success ? '✅' : '❌'}`);
      
      if (result.status === 429) {
        console.log(`  Rate limited! Retry after: ${result.rateLimitHeaders.retryAfter || 'N/A'} seconds`);
      }
      
      if (result.rateLimitHeaders.userLimit) {
        console.log(`  User limit: ${result.rateLimitHeaders.userRemaining}/${result.rateLimitHeaders.userLimit}`);
      }
      
      if (result.rateLimitHeaders.ipLimit) {
        console.log(`  IP limit: ${result.rateLimitHeaders.ipRemaining}/${result.rateLimitHeaders.ipLimit}`);
      }
      
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
    });
    
    // Check if any requests were rate limited
    const rateLimitedRequests = results.filter(r => r.status === 429);
    if (rateLimitedRequests.length > 0) {
      console.log(`\n🛡️ Rate limiting is working! ${rateLimitedRequests.length} requests were rate limited.`);
    } else {
      console.log('\n⚠️ No rate limiting detected. This could mean:');
      console.log('  - Rate limits are set very high');
      console.log('  - Rate limiting is not properly configured');
      console.log('  - Database functions are not working');
    }
    
  } catch (error) {
    console.error(`❌ Error testing ${endpointName}:`, error);
  }
}

// Manual test instructions
console.log(`
🔧 MANUAL TESTING INSTRUCTIONS:

1. Update the AUTH_TOKEN variable above with a real token from your browser dev tools
2. Run: node test-rate-limiting.js

To get an auth token:
1. Open your app in the browser and log in
2. Open Developer Tools (F12)
3. Go to Application/Storage > Local Storage
4. Find 'sb-mcxxiunseawojmojikvb-auth-token' (or similar)
5. Copy the access_token value

EXPECTED BEHAVIOR:
- First few requests should succeed (200 status)
- Later requests should be rate limited (429 status)
- Rate limit headers should be present
- Retry-After header should indicate when to retry

If you see 401 errors, the auth token is invalid or expired.
If you see 500 errors, there might be an issue with the Edge Functions.
`);

// Auto-run if called directly (uncomment to run automatically)
// testRateLimit();

module.exports = { testRateLimit };