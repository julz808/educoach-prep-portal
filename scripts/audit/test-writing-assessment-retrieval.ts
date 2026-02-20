import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables!');
  process.exit(1);
}

// Service role client bypasses RLS
const adminClient = createClient(supabaseUrl, supabaseServiceKey);

// User client respects RLS
const anonKey = process.env.VITE_SUPABASE_ANON_KEY!;
const userClient = createClient(supabaseUrl, anonKey);

async function testWritingAssessmentRetrieval() {
  const userId = '875b662c-c316-4361-8fee-9cfed3b56f55';
  const sessionId = 'a25d05f1-c741-4c52-8ae8-61551dfb4992';
  const questionId = '97b162b8-84b2-4246-bb52-4e6ad21b5d4b';

  console.log('🔍 Testing writing assessment retrieval...\n');

  // Test 1: Admin query (bypasses RLS)
  console.log('Test 1: Query as service role (bypasses RLS)');
  const { data: adminData, error: adminError } = await adminClient
    .from('writing_assessments')
    .select('id, user_id, session_id, question_id, overall_feedback, total_score')
    .eq('question_id', questionId)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (adminError) {
    console.error('❌ Admin error:', adminError);
  } else {
    console.log('✅ Admin query result:', adminData);
  }

  // Test 2: User-authenticated query (with RLS)
  console.log('\nTest 2: Query as authenticated user (with RLS)');

  // First, sign in as the user
  const { data: authData, error: authError } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email: 'owoicy@gmail.com'
  });

  if (authError) {
    console.error('❌ Auth error:', authError);
    return;
  }

  // Create a client with user session
  const { data: { session }, error: sessionError } = await userClient.auth.setSession({
    access_token: authData.properties.access_token || '',
    refresh_token: authData.properties.refresh_token || ''
  });

  if (sessionError || !session) {
    console.error('❌ Session error:', sessionError);
    // Try direct query without session
    console.log('\nTest 2b: Direct query without auth (will fail with RLS)');
    const { data: anonData, error: anonError } = await userClient
      .from('writing_assessments')
      .select('id, user_id, session_id, question_id, overall_feedback, total_score')
      .eq('question_id', questionId)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (anonError) {
      console.error('❌ Anon query error (expected):', anonError);
    } else {
      console.log('✅ Anon query result:', anonData);
    }
  } else {
    console.log('✅ Session created for user:', session.user.email);

    const { data: userData, error: userError } = await userClient
      .from('writing_assessments')
      .select('id, user_id, session_id, question_id, overall_feedback, total_score')
      .eq('question_id', questionId)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (userError) {
      console.error('❌ User query error:', userError);
    } else {
      console.log('✅ User query result:', userData);
    }
  }

  // Test 3: Check if session record has correct user_id
  console.log('\nTest 3: Verify session ownership');
  const { data: sessionData, error: sessionErr } = await adminClient
    .from('user_test_sessions')
    .select('id, user_id')
    .eq('id', sessionId)
    .single();

  if (sessionErr) {
    console.error('❌ Session lookup error:', sessionErr);
  } else {
    console.log('Session data:', sessionData);
    console.log('Match:', sessionData?.user_id === userId ? '✅ User IDs match' : '❌ User IDs DO NOT match');
  }

  // Test 4: Check the actual assessment record
  console.log('\nTest 4: Full assessment record');
  const { data: fullData, error: fullError } = await adminClient
    .from('writing_assessments')
    .select('*')
    .eq('session_id', sessionId)
    .single();

  if (fullError) {
    console.error('❌ Full record error:', fullError);
  } else {
    console.log('Full assessment record:');
    console.log('- ID:', fullData.id);
    console.log('- User ID:', fullData.user_id);
    console.log('- Session ID:', fullData.session_id);
    console.log('- Question ID:', fullData.question_id);
    console.log('- Product Type:', fullData.product_type);
    console.log('- Overall Feedback:', fullData.overall_feedback ? 'Present ✅' : 'Missing ❌');
    console.log('- Total Score:', fullData.total_score);
    console.log('- User Response Length:', fullData.user_response?.length || 0);
  }
}

testWritingAssessmentRetrieval();
