// Debug script to find the session lookup mismatch
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugSessionMismatch() {
  console.log('🔍 Debugging session lookup mismatch...\n');

  const testUserId = '1fd521a3-e462-41b6-a31c-5c8a806aad52';

  try {
    // 1. Check ALL sessions for this user (no filters)
    console.log('1. Checking ALL user_test_sessions for this user...');
    const { data: allSessions, error: allError } = await supabase
      .from('user_test_sessions')
      .select('*')
      .eq('user_id', testUserId)
      .order('updated_at', { ascending: false });

    if (allError) {
      console.error('Error fetching all sessions:', allError);
      return;
    }

    console.log(`Found ${allSessions?.length || 0} total sessions:`);
    allSessions?.forEach(session => {
      console.log('  -', {
        id: session.id.substring(0, 8) + '...',
        product_type: session.product_type,
        test_mode: session.test_mode,
        section_name: session.section_name,
        status: session.status,
        questions_answered: session.questions_answered,
        updated_at: session.updated_at?.substring(0, 16)
      });
    });

    if (allSessions && allSessions.length > 0) {
      // 2. Check what getUserProgress is looking for specifically
      console.log('\n2. What getUserProgress is looking for:');
      const searchCriteria = {
        user_id: testUserId,
        product_type: 'VIC Selective Entry (Year 9 Entry)',
        test_mode: 'diagnostic'
      };
      console.log('Search criteria:', searchCriteria);

      // 3. Try the exact query that getUserProgress uses
      console.log('\n3. Testing exact getUserProgress query...');
      const { data: filteredSessions, error: filteredError } = await supabase
        .from('user_test_sessions')
        .select('*')
        .eq('user_id', testUserId)
        .eq('product_type', 'VIC Selective Entry (Year 9 Entry)')
        .eq('test_mode', 'diagnostic')
        .order('updated_at', { ascending: false });

      if (filteredError) {
        console.error('Error with filtered query:', filteredError);
      } else {
        console.log(`Filtered query found ${filteredSessions?.length || 0} sessions:`);
        filteredSessions?.forEach(session => {
          console.log('  -', {
            id: session.id.substring(0, 8) + '...',
            section_name: session.section_name,
            status: session.status,
            questions_answered: session.questions_answered
          });
        });
      }

      // 4. Check for sessions with General Ability - Quantitative specifically
      console.log('\n4. Looking for "General Ability - Quantitative" sessions...');
      const { data: quantSessions, error: quantError } = await supabase
        .from('user_test_sessions')
        .select('*')
        .eq('user_id', testUserId)
        .ilike('section_name', '%General Ability%Quantitative%');

      if (quantError) {
        console.error('Error searching for quant sections:', quantError);
      } else {
        console.log(`Found ${quantSessions?.length || 0} General Ability - Quantitative sessions:`);
        quantSessions?.forEach(session => {
          console.log('  -', {
            id: session.id.substring(0, 8) + '...',
            product_type: session.product_type,
            test_mode: session.test_mode,
            section_name: session.section_name,
            status: session.status
          });
        });
      }

      // 5. Look for any sessions that might match but have different names
      console.log('\n5. Checking for any variations in naming...');
      const uniqueProductTypes = [...new Set(allSessions.map(s => s.product_type))];
      const uniqueTestModes = [...new Set(allSessions.map(s => s.test_mode))];
      const uniqueSectionNames = [...new Set(allSessions.map(s => s.section_name))];

      console.log('Unique product_types found:', uniqueProductTypes);
      console.log('Unique test_modes found:', uniqueTestModes);
      console.log('Unique section_names found:', uniqueSectionNames);
    }

  } catch (error) {
    console.error('Error in debug script:', error);
  }
}

debugSessionMismatch().catch(console.error);