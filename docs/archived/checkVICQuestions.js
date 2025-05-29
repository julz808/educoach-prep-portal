import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const SUPABASE_URL = "https://mcxxiunseawojmojikvb.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jeHhpdW5zZWF3b2ptb2ppa3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNDEwODUsImV4cCI6MjA2MzcxNzA4NX0.TNpEFgSITMB1ZBIfhQkmkpgudf5bfxH3vVqJPgHPLjY";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkVICQuestions() {
  try {
    console.log('Checking VIC Selective Entry questions...\n');
    
    // Get all VIC questions
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select(`
        *,
        passages (
          id,
          title,
          content
        )
      `)
      .eq('test_type', 'VIC Selective Entry (Year 9 Entry)')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return;
    }
    
    console.log(`Found ${questions?.length || 0} VIC questions total\n`);
    
    if (!questions || questions.length === 0) {
      console.log('No VIC questions found in the database.');
      return;
    }
    
    // Group by section
    const sectionCounts = {};
    const responseTypeCounts = {};
    
    questions.forEach(q => {
      sectionCounts[q.section_name] = (sectionCounts[q.section_name] || 0) + 1;
      const key = `${q.section_name} - ${q.response_type}`;
      responseTypeCounts[key] = (responseTypeCounts[key] || 0) + 1;
    });
    
    console.log('Questions by section:');
    Object.entries(sectionCounts).forEach(([section, count]) => {
      console.log(`${section}: ${count} questions`);
    });
    
    console.log('\nResponse types by section:');
    Object.entries(responseTypeCounts).forEach(([key, count]) => {
      console.log(`${key}: ${count} questions`);
    });
    
    // Show recent questions
    console.log('\nRecent questions:');
    questions.slice(0, 10).forEach((q, i) => {
      console.log(`${i+1}. [${q.section_name}] ${q.sub_skill} (Difficulty: ${q.difficulty}) - ${q.response_type}`);
      if (q.passages) {
        console.log(`   Passage: ${q.passages.title}`);
      }
      console.log(`   Question: ${q.question_text.substring(0, 100)}...`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkVICQuestions(); 