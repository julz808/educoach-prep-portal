#!/usr/bin/env ts-node

/**
 * Quick Start VIC Selective Entry Test Generator
 * 
 * This script validates the environment and then generates a VIC Selective Entry
 * practice test in one seamless command.
 */

import { validateEnvironment } from './validate-environment';
import { generateVICSelectivePracticeTest } from './generate-vic-selective-practice-test';

async function quickStartVICTest(): Promise<void> {
  console.log('🚀 Quick Start: VIC Selective Entry Test Generator');
  console.log('='.repeat(80));
  console.log('');

  try {
    // Step 1: Validate environment
    console.log('📋 Step 1: Validating environment...');
    await validateEnvironment();
    
    console.log('✅ Environment validation passed!');
    console.log('');
    
    // Step 2: Generate the test
    console.log('📋 Step 2: Generating VIC Selective Entry practice test...');
    await generateVICSelectivePracticeTest();
    
    console.log('🎉 Quick start completed successfully!');
    
  } catch (error) {
    console.error('❌ Quick start failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// Run if this script is executed directly
const isMainModule = import.meta.url.endsWith(process.argv[1]);
if (isMainModule) {
  quickStartVICTest().catch((error) => {
    console.error('Quick start error:', error);
    process.exit(1);
  });
}

export { quickStartVICTest }; 