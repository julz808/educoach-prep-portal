#!/usr/bin/env node

import { processVisualQuestions } from './src/engines/visual-image-generation/visualImageGenerationEngine.ts';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import fs from 'fs';

config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Processing specific test questions for visual generation...');

// Question IDs from our test generation
const targetQuestionIds = [
  '0e946c28-d8ff-4e31-b172-ea20910c1eb8',
  '847325e3-839a-491c-a8e8-8a00683b1b33',
  '2eea59d5-efca-4d5a-ac00-789c90945ca5'
];

async function processTargetQuestions() {
  try {
    console.log(`📋 Fetching ${targetQuestionIds.length} specific questions...`);
    
    // Get the specific questions by ID
    const { data: questions, error } = await supabase
      .from('questions')
      .select('id, visual_data, visual_type, question_text, test_type, section_name')
      .in('id', targetQuestionIds);
    
    if (error) {
      console.error('❌ Failed to fetch questions:', error.message);
      return;
    }
    
    console.log(`📊 Found ${questions?.length || 0} questions to process`);
    
    // Save the raw data for debugging
    fs.writeFileSync('./debug-questions.json', JSON.stringify(questions, null, 2));
    
    if (questions && questions.length > 0) {
      // Format the visual data for the engine
      const processableQuestions = questions.map(question => {
        // Parse visual_data from string to object if needed
        let visualData = question.visual_data;
        if (typeof visualData === 'string') {
          try {
            visualData = JSON.parse(visualData);
            console.log(`✅ Successfully parsed visual_data for question ${question.id}`);
          } catch (e) {
            console.error(`❌ Could not parse visual_data for question ${question.id}:`, e.message);
            console.log('Raw visual_data:', visualData);
            return null;
          }
        }
        
        // Make sure we have the required properties
        if (!visualData || !visualData.dimensions || !visualData.visual_type) {
          console.error(`❌ Question ${question.id} has missing visual data properties:`, visualData);
          return null;
        }
        
        return {
          ...question,
          visual_data: {
            educational_specification: visualData
          }
        };
      }).filter(q => q !== null);
      
      console.log(`🔧 Prepared ${processableQuestions.length} questions for visual generation`);
      
      if (processableQuestions.length > 0) {
        console.log('🚀 Starting visual generation process...');
        console.log('📊 First question preview:', JSON.stringify(processableQuestions[0], null, 2));
        await processVisualQuestions(processableQuestions);
      } else {
        console.log('⚠️ No processable questions after data validation');
      }
    } else {
      console.log('⚠️ No matching questions found to process');
    }
  } catch (error) {
    console.error('❌ Error processing questions:', error);
  }
}

processTargetQuestions()
  .then(() => console.log('✅ Targeted question processing complete'))
  .catch(console.error); 