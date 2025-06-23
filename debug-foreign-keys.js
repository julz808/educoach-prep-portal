// Debug script to check ALL foreign key constraints that reference user_test_sessions
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugForeignKeys() {
  console.log('🔍 Checking ALL foreign key constraints...\n');

  try {
    // Check all foreign key constraints that reference user_test_sessions
    const { data: foreignKeys, error: fkError } = await supabase
      .rpc('execute_sql', {
        sql: `
          SELECT DISTINCT
              tc.table_name as referencing_table,
              kcu.column_name as referencing_column,
              ccu.table_name AS referenced_table,
              ccu.column_name AS referenced_column,
              tc.constraint_name
          FROM 
              information_schema.table_constraints AS tc 
              JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
              JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
                AND ccu.table_schema = tc.table_schema
          WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND ccu.table_name = 'user_test_sessions'
          ORDER BY tc.table_name;
        `
      });

    if (fkError) {
      console.error('Error checking foreign keys:', fkError);
      
      // Fallback: manually check known tables
      console.log('\n📋 Manually checking known referencing tables...\n');
      
      const tables = [
        'writing_assessments',
        'test_section_states', 
        'question_attempt_history',
        'user_progress',
        'user_sub_skill_performance'
      ];
      
      for (const table of tables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);
            
          if (!error) {
            console.log(`✅ Table ${table} exists`);
          } else if (error.code === '42P01') {
            console.log(`❌ Table ${table} does not exist`);
          } else {
            console.log(`⚠️ Table ${table} error:`, error.message);
          }
        } catch (e) {
          console.log(`⚠️ Table ${table} exception:`, e.message);
        }
      }
    } else {
      console.log('Foreign key constraints referencing user_test_sessions:');
      console.table(foreignKeys);
    }

    // Check actual data counts
    console.log('\n📊 Current data counts:\n');
    
    const dataCounts = {};
    const tables = [
      'user_test_sessions',
      'writing_assessments', 
      'test_section_states',
      'question_attempt_history',
      'user_progress',
      'user_sub_skill_performance',
      'drill_sessions'
    ];
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
          
        if (!error) {
          dataCounts[table] = count;
          console.log(`${table}: ${count} rows`);
        } else {
          console.log(`${table}: Error - ${error.message}`);
        }
      } catch (e) {
        console.log(`${table}: Exception - ${e.message}`);
      }
    }

    // Try to identify the specific constraint causing issues
    console.log('\n🔍 Checking for any remaining references to user_test_sessions...\n');
    
    // Check if we can find session IDs that are still referenced
    const { data: sessions } = await supabase
      .from('user_test_sessions')
      .select('id')
      .limit(5);
      
    if (sessions && sessions.length > 0) {
      console.log(`Found ${sessions.length} test sessions`);
      
      for (const session of sessions.slice(0, 2)) {
        console.log(`\nChecking references to session ${session.id}:`);
        
        // Check each potential referencing table
        const referencingTables = [
          { table: 'writing_assessments', column: 'session_id' },
          { table: 'test_section_states', column: 'test_session_id' },
          { table: 'question_attempt_history', column: 'session_id' }
        ];
        
        for (const ref of referencingTables) {
          try {
            const { count } = await supabase
              .from(ref.table)
              .select('*', { count: 'exact', head: true })
              .eq(ref.column, session.id);
              
            if (count > 0) {
              console.log(`  - ${ref.table}.${ref.column}: ${count} references`);
            }
          } catch (e) {
            console.log(`  - ${ref.table}: Check failed - ${e.message}`);
          }
        }
      }
    }

  } catch (error) {
    console.error('Error in debug script:', error);
  }
}

debugForeignKeys().catch(console.error);