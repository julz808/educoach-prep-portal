#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import fs from 'fs';

config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Question IDs from our test generation
const targetQuestionIds = [
  '0e946c28-d8ff-4e31-b172-ea20910c1eb8',
  '847325e3-839a-491c-a8e8-8a00683b1b33',
  '2eea59d5-efca-4d5a-ac00-789c90945ca5'
];

async function fetchQuestionDetails() {
  try {
    console.log(`📋 Fetching details for ${targetQuestionIds.length} specific questions...`);
    
    // Get the questions
    const { data: questions, error } = await supabase
      .from('questions')
      .select('*')
      .in('id', targetQuestionIds);
    
    if (error) {
      console.error('❌ Failed to fetch questions:', error.message);
      return;
    }
    
    console.log(`📊 Found ${questions?.length || 0} questions`);
    
    if (questions && questions.length > 0) {
      // Save details to a file for inspection
      const outputPath = './question-details.json';
      fs.writeFileSync(outputPath, JSON.stringify(questions, null, 2));
      console.log(`✅ Question details saved to ${outputPath}`);
      
      // Also examine the structure directly
      questions.forEach(question => {
        console.log(`\n------ Question ID: ${question.id} ------`);
        console.log(`Test Type: ${question.test_type}`);
        console.log(`Section: ${question.section_name}`);
        console.log(`Sub-skill: ${question.sub_skill}`);
        console.log(`Has Visual: ${question.has_visual}`);
        console.log(`Visual Type: ${question.visual_type}`);
        
        // Check the visual_data field structure
        if (question.visual_data) {
          console.log('Visual Data Type:', typeof question.visual_data);
          if (typeof question.visual_data === 'string') {
            try {
              const parsed = JSON.parse(question.visual_data);
              console.log('Visual Data Structure:', Object.keys(parsed));
              
              // Check for specific educational specification format
              if (parsed.dimensions) {
                console.log('Dimensions Found:', parsed.dimensions);
              } else {
                console.log('⚠️ No dimensions found in visual_data');
              }
              
              if (parsed.visual_type) {
                console.log('Visual Type in Data:', parsed.visual_type);
              } else {
                console.log('⚠️ No visual_type in visual_data');
              }
            } catch (e) {
              console.error('❌ Error parsing visual_data JSON:', e.message);
            }
          } else if (typeof question.visual_data === 'object') {
            console.log('Visual Data Structure:', Object.keys(question.visual_data));
          }
        } else {
          console.log('⚠️ No visual_data found');
        }
      });
    }
  } catch (error) {
    console.error('❌ Error fetching question details:', error);
  }
}

fetchQuestionDetails()
  .then(() => console.log('\n✅ Question details inspection complete'))
  .catch(console.error); 