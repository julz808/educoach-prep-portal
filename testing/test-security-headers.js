// Security Headers Test Script
// Tests that security headers are properly configured

async function testSecurityHeaders() {
  console.log('🔐 Testing Security Headers Implementation...');
  
  // Test URLs - update these to your actual deployment URLs
  const testUrls = [
    'http://localhost:5173',  // Local development
    'https://your-app.vercel.app',  // Production (update this)
    // Add more URLs as needed
  ];
  
  const requiredHeaders = {
    'content-security-policy': {
      name: 'Content-Security-Policy',
      critical: true,
      description: 'Prevents XSS and code injection attacks'
    },
    'x-frame-options': {
      name: 'X-Frame-Options',
      critical: true,
      description: 'Prevents clickjacking attacks'
    },
    'x-content-type-options': {
      name: 'X-Content-Type-Options',
      critical: true,
      description: 'Prevents MIME type sniffing'
    },
    'strict-transport-security': {
      name: 'Strict-Transport-Security',
      critical: true,
      description: 'Enforces HTTPS connections'
    },
    'referrer-policy': {
      name: 'Referrer-Policy',
      critical: false,
      description: 'Controls referrer information'
    },
    'permissions-policy': {
      name: 'Permissions-Policy',
      critical: false,
      description: 'Controls browser feature access'
    },
    'x-xss-protection': {
      name: 'X-XSS-Protection',
      critical: false,
      description: 'Legacy XSS protection (mostly deprecated)'
    }
  };
  
  for (const url of testUrls) {
    console.log(`\n📡 Testing: ${url}`);
    await testUrl(url, requiredHeaders);
  }
  
  console.log('\n✅ Security headers testing completed!');
  console.log('\n📋 Recommendations:');
  console.log('  1. Run this test after deploying to Vercel');
  console.log('  2. Use https://securityheaders.com to get additional insights');
  console.log('  3. Test with https://observatory.mozilla.org for comprehensive analysis');
}

async function testUrl(url, requiredHeaders) {
  try {
    console.log(`\n🔍 Fetching headers from ${url}...`);
    
    const response = await fetch(url, {
      method: 'HEAD',  // Only get headers, not body
      redirect: 'follow'
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok && response.status !== 404) {
      console.log(`⚠️ Warning: Non-successful status code`);
    }
    
    // Check each required header
    let securityScore = 0;
    let totalHeaders = Object.keys(requiredHeaders).length;
    
    console.log('\n🛡️ Security Headers Analysis:');
    
    for (const [headerKey, headerInfo] of Object.entries(requiredHeaders)) {
      const headerValue = response.headers.get(headerKey);
      
      if (headerValue) {
        console.log(`✅ ${headerInfo.name}: ${headerValue.substring(0, 80)}${headerValue.length > 80 ? '...' : ''}`);
        securityScore++;
        
        // Additional validation for specific headers
        validateHeaderValue(headerInfo.name, headerValue);
        
      } else {
        const status = headerInfo.critical ? '❌' : '⚠️';
        console.log(`${status} ${headerInfo.name}: MISSING (${headerInfo.description})`);
      }
    }
    
    // Calculate security score
    const scorePercentage = Math.round((securityScore / totalHeaders) * 100);
    console.log(`\n📊 Security Score: ${securityScore}/${totalHeaders} (${scorePercentage}%)`);
    
    if (scorePercentage >= 90) {
      console.log('🎉 Excellent security header configuration!');
    } else if (scorePercentage >= 70) {
      console.log('✅ Good security header configuration');
    } else if (scorePercentage >= 50) {
      console.log('⚠️ Moderate security - some important headers missing');
    } else {
      console.log('❌ Poor security - many critical headers missing');
    }
    
    // Check for additional security-related headers
    console.log('\n🔍 Additional Headers:');
    const additionalHeaders = [
      'server',
      'x-powered-by',
      'x-dns-prefetch-control',
      'x-download-options',
      'x-permitted-cross-domain-policies'
    ];
    
    additionalHeaders.forEach(header => {
      const value = response.headers.get(header);
      if (value) {
        console.log(`  ${header}: ${value}`);
      }
    });
    
  } catch (error) {
    console.error(`❌ Error testing ${url}:`, error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log(`  💡 Tip: Make sure the server is running on ${url}`);
    } else if (error.code === 'ENOTFOUND') {
      console.log(`  💡 Tip: Check if the domain exists and is accessible`);
    }
  }
}

function validateHeaderValue(headerName, headerValue) {
  switch (headerName.toLowerCase()) {
    case 'content-security-policy':
      if (!headerValue.includes("default-src 'self'")) {
        console.log(`    ⚠️ CSP Warning: Consider using "default-src 'self'" for better security`);
      }
      if (headerValue.includes("'unsafe-eval'")) {
        console.log(`    ⚠️ CSP Warning: 'unsafe-eval' can be dangerous - only use if necessary`);
      }
      break;
      
    case 'x-frame-options':
      if (!['DENY', 'SAMEORIGIN'].includes(headerValue.toUpperCase())) {
        console.log(`    ⚠️ X-Frame-Options Warning: Use DENY or SAMEORIGIN for better protection`);
      }
      break;
      
    case 'strict-transport-security':
      if (!headerValue.includes('max-age=')) {
        console.log(`    ⚠️ HSTS Warning: max-age directive is required`);
      }
      const maxAge = headerValue.match(/max-age=(\d+)/);
      if (maxAge && parseInt(maxAge[1]) < 31536000) {
        console.log(`    ⚠️ HSTS Warning: Consider using max-age of at least 1 year (31536000 seconds)`);
      }
      break;
      
    case 'x-content-type-options':
      if (headerValue.toLowerCase() !== 'nosniff') {
        console.log(`    ⚠️ X-Content-Type-Options Warning: Should be set to "nosniff"`);
      }
      break;
  }
}

// Instructions for manual testing
console.log(`
🔧 SECURITY HEADERS TESTING INSTRUCTIONS:

1. For Local Testing:
   - Start your dev server: npm run dev
   - Run: node test-security-headers.js
   
2. For Production Testing:
   - Deploy to Vercel
   - Update the production URL in testUrls array above
   - Run: node test-security-headers.js

3. Online Testing Tools:
   - https://securityheaders.com (comprehensive analysis)
   - https://observatory.mozilla.org (Mozilla security observatory)
   - Browser Developer Tools > Network tab

EXPECTED RESULTS:
✅ All critical headers should be present
✅ Content-Security-Policy should restrict sources appropriately
✅ X-Frame-Options should be DENY or SAMEORIGIN
✅ Security score should be 80%+ for production

TROUBLESHOOTING:
- Local development may not show all headers (normal)
- HTTPS-only headers won't work on HTTP (normal for localhost)
- Some headers may be overridden by hosting platform
`);

// Auto-run if called directly (uncomment to run automatically)
// testSecurityHeaders();

module.exports = { testSecurityHeaders };