#!/usr/bin/env ts-node

/**
 * Environment Validation Script
 * 
 * This script validates that all required environment variables and dependencies
 * are properly configured for running the VIC Selective Entry test generator.
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';

// Load environment variables
config();

interface ValidationResult {
  isValid: boolean;
  message: string;
  details?: string;
}

/**
 * Validate Claude API configuration
 */
async function validateClaudeAPI(): Promise<ValidationResult> {
  const claudeApiKey = process.env.VITE_CLAUDE_API_KEY || process.env.CLAUDE_API_KEY;
  
  if (!claudeApiKey) {
    return {
      isValid: false,
      message: 'Claude API key not found',
      details: 'Set VITE_CLAUDE_API_KEY or CLAUDE_API_KEY in your .env file'
    };
  }

  if (!claudeApiKey.startsWith('sk-ant-')) {
    return {
      isValid: false,
      message: 'Claude API key format appears invalid',
      details: 'Claude API keys should start with "sk-ant-"'
    };
  }

  // Test API connectivity
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hello' }]
      })
    });

    if (response.status === 401) {
      return {
        isValid: false,
        message: 'Claude API key is invalid or expired',
        details: 'Check your API key and account status'
      };
    }

    if (response.status === 429) {
      return {
        isValid: true, // Key is valid, just rate limited
        message: 'Claude API key is valid (rate limited)',
        details: 'API key works but is currently rate limited'
      };
    }

    if (!response.ok && response.status !== 400) { // 400 is expected for minimal test
      return {
        isValid: false,
        message: `Claude API returned unexpected status: ${response.status}`,
        details: await response.text()
      };
    }

    return {
      isValid: true,
      message: 'Claude API key is valid and working'
    };

  } catch (error) {
    return {
      isValid: false,
      message: 'Failed to connect to Claude API',
      details: error instanceof Error ? error.message : 'Network error'
    };
  }
}

/**
 * Validate Supabase configuration
 */
async function validateSupabase(): Promise<ValidationResult> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      isValid: false,
      message: 'Supabase configuration missing',
      details: 'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file'
    };
  }

  if (!supabaseUrl.includes('supabase.co')) {
    return {
      isValid: false,
      message: 'Supabase URL format appears invalid',
      details: 'URL should contain "supabase.co"'
    };
  }

  // Test Supabase connectivity
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test connection by checking if tables exist
    const { data: questionsTable, error: questionsError } = await supabase
      .from('questions')
      .select('id')
      .limit(1);

    if (questionsError && questionsError.code === 'PGRST116') {
      return {
        isValid: false,
        message: 'Questions table does not exist',
        details: 'Run database migrations to create required tables'
      };
    }

    const { data: passagesTable, error: passagesError } = await supabase
      .from('passages')
      .select('id')
      .limit(1);

    if (passagesError && passagesError.code === 'PGRST116') {
      return {
        isValid: false,
        message: 'Passages table does not exist',
        details: 'Run database migrations to create required tables'
      };
    }

    if (questionsError || passagesError) {
      return {
        isValid: false,
        message: 'Supabase database access error',
        details: questionsError?.message || passagesError?.message || 'Unknown error'
      };
    }

    return {
      isValid: true,
      message: 'Supabase connection and tables validated'
    };

  } catch (error) {
    return {
      isValid: false,
      message: 'Failed to connect to Supabase',
      details: error instanceof Error ? error.message : 'Network error'
    };
  }
}

/**
 * Validate Node.js dependencies
 */
async function validateDependencies(): Promise<ValidationResult> {
  try {
    // Instead of using require, check if modules are importable
    try {
      await import('dotenv');
      await import('@supabase/supabase-js');
    } catch (e) {
      throw new Error('Failed to import required dependencies');
    }
    
    return {
      isValid: true,
      message: 'All required dependencies are installed'
    };
  } catch (error) {
    return {
      isValid: false,
      message: 'Missing required dependencies',
      details: 'Run "npm install" to install dependencies'
    };
  }
}

/**
 * Main validation function
 */
async function validateEnvironment(): Promise<void> {
  console.log('🔍 Environment Validation for VIC Selective Entry Test Generator');
  console.log('='.repeat(80));
  console.log('');

  const validations = [
    { name: 'Dependencies', test: validateDependencies },
    { name: 'Claude API', test: validateClaudeAPI },
    { name: 'Supabase', test: validateSupabase }
  ];

  let allValid = true;

  for (const validation of validations) {
    process.stdout.write(`📋 Checking ${validation.name}... `);
    
    try {
      const result = await validation.test();
      
      if (result.isValid) {
        console.log(`✅ ${result.message}`);
        if (result.details) {
          console.log(`   ${result.details}`);
        }
      } else {
        console.log(`❌ ${result.message}`);
        if (result.details) {
          console.log(`   ${result.details}`);
        }
        allValid = false;
      }
    } catch (error) {
      console.log(`❌ Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      allValid = false;
    }
    
    console.log('');
  }

  console.log('='.repeat(80));
  
  if (allValid) {
    console.log('🎉 Environment validation successful!');
    console.log('✅ You can now run the VIC test generator:');
    console.log('   npm run generate-vic-test');
  } else {
    console.log('❌ Environment validation failed!');
    console.log('🔧 Please fix the issues above before running the test generator.');
    process.exit(1);
  }
  
  console.log('');
}

// ES module entry point detection
const isMainModule = import.meta.url.endsWith(process.argv[1]);
if (isMainModule) {
  validateEnvironment().catch((error) => {
    console.error('Validation error:', error);
    process.exit(1);
  });
}

export { validateEnvironment }; 