import { config } from 'dotenv';
import { supabase } from '../src/integrations/supabase/client';
import * as fs from 'fs';
import * as path from 'path';

config();

interface VisualResponse {
  questionId: string;
  html: string;
  notes?: string;
}

interface VisualResponsesFile {
  [index: number]: VisualResponse;
}

async function processVisualResponses(): Promise<void> {
  try {
    console.log('🔄 Processing visual responses...');
    
    const batchDir = path.join(process.cwd(), 'visual-generation-batch');
    const responsesFile = path.join(batchDir, 'visual-responses-template.json');
    
    // Check if responses file exists
    if (!fs.existsSync(responsesFile)) {
      console.error('❌ Visual responses file not found!');
      console.log(`📁 Expected file: ${responsesFile}`);
      console.log('📋 Please run: npm run generate-visual-prompts first');
      process.exit(1);
    }

    // Load responses file
    let responses: VisualResponsesFile;
    try {
      const responsesContent = fs.readFileSync(responsesFile, 'utf-8');
      responses = JSON.parse(responsesContent);
    } catch (error) {
      console.error('❌ Failed to parse visual responses file:', error);
      process.exit(1);
    }

    // Filter out empty responses
    const validResponses = Object.entries(responses)
      .filter(([_, response]) => response.html && response.html.trim().length > 0)
      .map(([index, response]) => ({ index: parseInt(index), ...response }));

    if (validResponses.length === 0) {
      console.log('⚠️ No valid visual responses found.');
      console.log('📋 Please fill in the HTML content in the responses file:');
      console.log(`   ${responsesFile}`);
      return;
    }

    console.log(`📊 Processing ${validResponses.length} visual responses...`);

    // Process each response
    let successCount = 0;
    let errorCount = 0;

    for (const response of validResponses) {
      try {
        // Validate HTML content
        if (!isValidHTMLContent(response.html)) {
          console.warn(`⚠️ Skipping invalid HTML for question ${response.questionId}`);
          errorCount++;
          continue;
        }

        // Clean and optimize HTML
        const cleanedHTML = cleanHTMLContent(response.html);

        // Update database (note: visual_html column needs to be added to questions table)
        const { error } = await supabase
          .from('questions')
          .update({ 
            visual_html: cleanedHTML,
            updated_at: new Date().toISOString()
          })
          .eq('id', response.questionId);

        if (error) {
          console.error(`❌ Failed to update question ${response.questionId}:`, error.message);
          if (error.message.includes('visual_html')) {
            console.log('💡 Note: You may need to add the visual_html column to the questions table');
          }
          errorCount++;
        } else {
          console.log(`✅ Updated visual for question ${response.questionId}`);
          successCount++;
        }

        // Rate limiting to avoid overwhelming database
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Error processing response for question ${response.questionId}:`, error);
        errorCount++;
      }
    }

    // Summary
    console.log('\n📊 Processing Summary:');
    console.log(`✅ Successfully updated: ${successCount} questions`);
    console.log(`❌ Errors: ${errorCount} questions`);
    console.log(`📊 Total processed: ${validResponses.length} questions`);

    // Create backup of processed responses
    if (successCount > 0) {
      const backupFile = path.join(batchDir, `visual-responses-backup-${Date.now()}.json`);
      fs.writeFileSync(backupFile, JSON.stringify(responses, null, 2));
      console.log(`💾 Backup saved: ${backupFile}`);
    }

    // Check for remaining questions needing visuals
    const { data: remainingQuestions, error: remainingError } = await supabase
      .from('questions')
      .select('id')
      .eq('has_visual', true);

    if (remainingError) {
      console.warn('⚠️ Could not check remaining questions:', remainingError.message);
    } else {
      console.log(`✅ Total questions with has_visual=true: ${remainingQuestions?.length || 0}`);
    }

  } catch (error) {
    console.error('❌ Error processing visual responses:', error);
    process.exit(1);
  }
}

function isValidHTMLContent(html: string): boolean {
  // Basic validation checks
  if (!html || html.trim().length === 0) {
    return false;
  }

  // Check for basic HTML structure
  const hasHtmlTag = /<html[\s>]/i.test(html);
  const hasBodyTag = /<body[\s>]/i.test(html);
  const hasClosingTags = /<\/html>/i.test(html) && /<\/body>/i.test(html);

  // Must have either full HTML structure or be a valid SVG
  const isSVG = /<svg[\s>]/i.test(html) && /<\/svg>/i.test(html);
  
  return (hasHtmlTag && hasBodyTag && hasClosingTags) || isSVG;
}

function cleanHTMLContent(html: string): string {
  // Remove any leading/trailing whitespace
  let cleaned = html.trim();
  
  // Ensure UK spelling in any text content (basic replacements)
  cleaned = cleaned.replace(/\bcolor\b/g, 'colour');
  cleaned = cleaned.replace(/\bcenter\b/g, 'centre');
  cleaned = cleaned.replace(/\bmeter\b/g, 'metre');
  cleaned = cleaned.replace(/\blabel\b/g, 'label'); // already UK spelling
  
  // Remove any potential script tags for security
  cleaned = cleaned.replace(/<script[\s\S]*?<\/script>/gi, '');
  
  // Remove any external links/imports for security
  cleaned = cleaned.replace(/<link[^>]*href[^>]*>/gi, '');
  cleaned = cleaned.replace(/@import[^;]*;/gi, '');
  
  return cleaned;
}

// Utility function to preview pending visuals
async function previewPendingVisuals(): Promise<void> {
  try {
    console.log('🔍 Checking questions that need visuals...');
    
    const { data: questions, error } = await supabase
      .from('questions')
      .select('id, question_text, test_type, sub_skill, difficulty, has_visual')
      .eq('has_visual', true)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    if (!questions || questions.length === 0) {
      console.log('✅ No questions found that need visuals');
      return;
    }

    console.log(`📊 Found ${questions.length} questions with has_visual=true:`);
    console.log('\n📋 Summary:');
    
    // Group by test type and sub-skill
    const summary: { [key: string]: number } = {};
    questions.forEach(q => {
      const key = `${q.test_type} - ${q.sub_skill}`;
      summary[key] = (summary[key] || 0) + 1;
    });

    Object.entries(summary)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([key, count]) => {
        console.log(`  ${key}: ${count} questions`);
      });

    console.log(`\n🔄 Run 'npm run generate-visual-prompts' to generate prompts for these questions`);

  } catch (error) {
    console.error('❌ Error previewing pending visuals:', error);
  }
}

// ES modules entry point check
const isMainModule = import.meta.url.endsWith(process.argv[1]);
if (isMainModule) {
  // Check if --preview flag is used
  if (process.argv.includes('--preview')) {
    previewPendingVisuals().catch((error) => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
  } else {
    processVisualResponses().catch((error) => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
  }
}

export { processVisualResponses, previewPendingVisuals }; 