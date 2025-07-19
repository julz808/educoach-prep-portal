// Debug script to check access control configuration
import { isPaywallUIEnabled, isAccessControlEnabled } from './config/stripeConfig';

export function debugAccessControl() {
  console.log('🔍 Access Control Debug Info:');
  console.log('================================');
  
  // Check environment variables
  console.log('Environment Variables:');
  console.log('- VITE_ENABLE_ACCESS_CONTROL:', import.meta.env.VITE_ENABLE_ACCESS_CONTROL);
  console.log('- VITE_ENABLE_PAYWALL_UI:', import.meta.env.VITE_ENABLE_PAYWALL_UI);
  console.log('- Type of VITE_ENABLE_ACCESS_CONTROL:', typeof import.meta.env.VITE_ENABLE_ACCESS_CONTROL);
  console.log('- Type of VITE_ENABLE_PAYWALL_UI:', typeof import.meta.env.VITE_ENABLE_PAYWALL_UI);
  
  console.log('\nFunction Results:');
  console.log('- isAccessControlEnabled():', isAccessControlEnabled());
  console.log('- isPaywallUIEnabled():', isPaywallUIEnabled());
  
  console.log('\nAll Vite env vars:', import.meta.env);
  console.log('================================');
}

// Auto-run on import for debugging
debugAccessControl();