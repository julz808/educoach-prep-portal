/**
 * Migration: Add campaign_status column to google_ads_campaign_performance table
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🔧 Running migration: Add campaign_status column');
  console.log('');

  // Add campaign_status column
  const { error: alterError } = await supabase.rpc('exec_sql', {
    sql: `
      ALTER TABLE google_ads_campaign_performance
      ADD COLUMN IF NOT EXISTS campaign_status text DEFAULT 'ENABLED';
    `,
  });

  if (alterError) {
    console.error('❌ Error adding column:', alterError);

    // Try alternative approach using direct query
    console.log('Trying alternative approach...');
    const { data, error } = await supabase
      .from('google_ads_campaign_performance')
      .select('campaign_status')
      .limit(1);

    if (error) {
      console.log('✓ Column does not exist yet - this is expected');
      console.log('Please run this SQL in Supabase SQL Editor:');
      console.log('');
      console.log('ALTER TABLE google_ads_campaign_performance');
      console.log("ADD COLUMN campaign_status text DEFAULT 'ENABLED';");
      console.log('');
      console.log('CREATE INDEX IF NOT EXISTS idx_campaign_performance_status');
      console.log('ON google_ads_campaign_performance(campaign_status);');
      console.log('');
      console.log("COMMENT ON COLUMN google_ads_campaign_performance.campaign_status IS 'Campaign status: ENABLED, PAUSED, or REMOVED';");
      process.exit(1);
    } else {
      console.log('✓ Column already exists!');
    }
  } else {
    console.log('✓ Successfully added campaign_status column');
  }

  console.log('');
  console.log('Migration complete!');
}

runMigration().catch(console.error);
