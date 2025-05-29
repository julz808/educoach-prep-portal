#!/usr/bin/env tsx

// Visual Image Generation Engine (Engine 2)
// Converts educational visual specifications from Engine 1 into actual PNG images
// Uses Claude 4 Sonnet to generate HTML/CSS/JavaScript artifacts, then renders them as images

import { config } from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
import puppeteer, { Browser, Page } from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
// Remove or rename the imported VisualSpecification
// import type { VisualSpecification } from '../../types/visual';

config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🎨 Visual Image Generation Engine (Engine 2)');
console.log('==============================================');
console.log('Converting educational visual specifications to PNG images\n');

// Create images directory if it doesn't exist
const imagesDir = './generated-visual-images';
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// Updated interface to match new educational specification format
interface QuestionWithVisual {
  id: string;
  visual_data: {
    educational_specification: VisualSpecification;
  };
  visual_type: string;
  question_text: string;
  test_type?: string;
  section_name?: string;
}

interface ProcessingStats {
  processed: number;
  successful: number;
  failed: number;
  skipped: number;
}

// Updated VisualSpecification interface to support both old and new formats
interface VisualSpecification {
  dimensions: { width: number; height: number };
  visual_type: string;
  
  // Old format properties
  educational_purpose?: string;
  expected_student_interaction?: string;
  measurement_precision?: string;
  key_elements?: string[];
  style_requirements?: string;
  
  // New format properties
  visual_overview?: string;
  detailed_description?: string;
  specific_elements?: { [key: string]: string };
  constraints?: string[];
}

// Enhanced Claude API integration with educational context
async function generateVisualFromSpec(
  visualSpec: VisualSpecification, 
  questionId: string
): Promise<string | null> {
  try {
    console.log(`🤖 Generating ${visualSpec.visual_type} artifact using Claude API...`);
    console.log(`📚 Educational Purpose: ${visualSpec.educational_purpose}`);
    
    const prompt = createEducationalVisualPrompt(visualSpec);
    
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      // Extract artifact code from the response
      const artifactCode = extractArtifactCode(content.text);
      if (artifactCode) {
        console.log(`✅ Generated ${visualSpec.visual_type} artifact (${artifactCode.length} chars)`);
        return artifactCode;
      }
    }

    console.error(`❌ No valid artifact found in Claude response for ${questionId}`);
    return null;

  } catch (error) {
    console.error(`❌ Claude API error for ${questionId}:`, error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

// Enhanced prompt creation using educational context
function createEducationalVisualPrompt(visualSpec: VisualSpecification): string {
  const { width, height } = visualSpec.dimensions;
  const usableWidth = width - 20; // Account for padding
  const usableHeight = height - 20; // Account for padding
  
  // Handle both old and new format specifications
  const educationalPurpose = visualSpec.educational_purpose || "Students learn through visual representation";
  const expectedInteraction = visualSpec.expected_student_interaction || "analyze and interpret the visual information";
  const measurementPrecision = visualSpec.measurement_precision || "standard";
  
  // Handle both formats for key elements
  let keyElements;
  if (visualSpec.key_elements) {
    keyElements = visualSpec.key_elements.map(element => `• ${element}`).join('\n');
  } else if (visualSpec.specific_elements) {
    // Convert specific_elements object to array of strings
    keyElements = Object.entries(visualSpec.specific_elements)
      .map(([key, value]) => `• ${key}: ${value}`)
      .join('\n');
  } else {
    keyElements = "• Visual elements for the question";
  }
  
  // Use detailed_description directly if available
  const detailedDescription = visualSpec.detailed_description || "";
  
  // Use style_requirements if available, otherwise default
  const styleRequirements = visualSpec.style_requirements || 
    "Clean, educational style with clear fonts, high contrast colors, minimal decoration, and focus on clarity";
  
  const basePrompt = `You are creating an educational visual for students. Generate clean, professional HTML/CSS/JavaScript code that renders the visual exactly as specified.

**EDUCATIONAL CONTEXT:**
Purpose: ${educationalPurpose}
Expected Student Interaction: ${expectedInteraction}
Visual Type: ${visualSpec.visual_type}
Measurement Precision Required: ${measurementPrecision}

**DETAILED SPECIFICATION:**
${detailedDescription}

**KEY ELEMENTS (Must Include ALL):**
${keyElements}

**CRITICAL SIZING REQUIREMENTS:**
- The content will be placed in a container that is ${usableWidth}px wide by ${usableHeight}px tall
- ALL content must fit within these exact dimensions - no overflow allowed
- Use responsive design principles to ensure proper scaling
- Test that text, charts, and all elements are fully visible within the bounds

**STYLE REQUIREMENTS:**
${styleRequirements}

**TECHNICAL REQUIREMENTS:**
- Generate clean, self-contained HTML/CSS/JavaScript code
- Use the exact usable dimensions: ${usableWidth}x${usableHeight}px (accounting for padding)
- Make it visually appealing and professional for educational use
- Use appropriate colors, fonts, and styling that support learning
- Ensure all text is clearly readable and doesn't overflow
- Include proper spacing and margins within the available space
- Use CSS max-width: 100% and max-height: 100% for responsive elements
- Focus on educational clarity and accuracy

`;

  // Add visual-type specific guidance
  switch (visualSpec.visual_type) {
    case 'bar_chart':
    case 'line_graph':
    case 'pie_chart':
      return basePrompt + `
**CHART-SPECIFIC REQUIREMENTS:**
- Use Chart.js for interactive charts that fit exactly within ${usableWidth}x${usableHeight}px
- Set responsive: true and maintainAspectRatio: false for Chart.js
- Include proper axes, labels, and legends that don't exceed the container
- Use colors that enhance educational understanding
- Make data points clearly visible and readable
- Ensure legend and labels fit within the allocated space
- Chart.js config should include:
  {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', maxHeight: 60 },
      title: { display: true, fontSize: 16 }
    }
  }
- Educational Focus: Help students ${expectedInteraction}
`;

    case 'geometric_grid_diagram':
    case 'coordinate_plane':
      return basePrompt + `
**GEOMETRY-SPECIFIC REQUIREMENTS:**
- Create precise geometric diagrams using SVG with viewBox for scalability
- Show spatial relationships accurately within ${usableWidth}x${usableHeight}px
- Use proper mathematical notation and conventions
- Include clear labels and measurements that support the learning objective
- Make geometric relationships visually obvious
- Use SVG viewBox="0 0 ${usableWidth} ${usableHeight}" preserveAspectRatio="xMidYMid meet"
- Educational Focus: Enable students to ${expectedInteraction}
`;

    case 'pattern_sequence':
      return basePrompt + `
**PATTERN-SPECIFIC REQUIREMENTS:**
- Arrange pattern elements clearly within ${usableWidth}x${usableHeight}px
- Use CSS Grid or Flexbox for layout with proper sizing constraints
- Apply consistent colors, sizes, and spacing that make the pattern obvious
- Show the pattern progression clearly with good visual hierarchy
- Include sequence indicators if specified
- Use CSS: max-width: 100%; overflow: hidden; for containers
- Educational Focus: Guide students to ${expectedInteraction}
`;

    case 'measurement_diagram':
    case 'technical_drawing':
      return basePrompt + `
**TECHNICAL DIAGRAM REQUIREMENTS:**
- Create precise, technical diagrams using SVG
- Show measurements, dimensions, and technical details accurately
- Include proper technical notation and labeling conventions
- Use standard technical drawing practices
- Ensure all measurements are clearly visible and precise
- SVG should have viewBox="0 0 ${usableWidth} ${usableHeight}"
- Educational Focus: Support students in ${expectedInteraction}
`;

    case 'statistical_display':
      return basePrompt + `
**STATISTICS-SPECIFIC REQUIREMENTS:**
- Present statistical data clearly and accurately
- Use appropriate statistical visualization conventions
- Include proper scales, labels, and data representations
- Make statistical relationships and trends visible
- Support data interpretation and analysis
- Educational Focus: Enable students to ${expectedInteraction}
`;

    default:
      return basePrompt + `
**GENERAL VISUAL REQUIREMENTS:**
Create an appropriate educational visual representation based on the specifications provided.
Focus on clarity, accuracy, and educational value.
Ensure everything fits perfectly within the ${usableWidth}x${usableHeight}px container.
Educational Focus: Support students in ${expectedInteraction}
`;
  }
}

function extractArtifactCode(responseText: string): string | null {
  // Extract HTML/code from Claude response
  // Look for code blocks or artifact tags
  const codeBlockRegex = /```(?:html|javascript|css)?\s*\n([\s\S]*?)\n```/gi;
  const matches = responseText.match(codeBlockRegex);
  
  if (matches && matches.length > 0) {
    // Return the largest code block (likely the main artifact)
    const codes = matches.map(match => 
      match.replace(/```(?:html|javascript|css)?\s*\n/gi, '').replace(/\n```$/g, '')
    );
    return codes.reduce((a, b) => a.length > b.length ? a : b);
  }

  // If no code blocks, look for artifact-like content
  if (responseText.includes('<!DOCTYPE html>') || responseText.includes('<html')) {
    return responseText;
  }

  return null;
}

// Image conversion using Puppeteer
let browser: Browser | null = null;

async function initializeBrowser(): Promise<Browser> {
  if (!browser) {
    console.log('🌐 Initializing headless browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });
  }
  return browser;
}

async function convertArtifactToImage(
  artifactCode: string, 
  width: number, 
  height: number, 
  questionId: string
): Promise<{ buffer: Buffer; filepath: string } | null> {
  try {
    const browser = await initializeBrowser();
    const page = await browser.newPage();

    // Add extra padding to viewport to ensure content fits
    const viewportPadding = 40;
    const viewportWidth = width + viewportPadding;
    const viewportHeight = height + viewportPadding;
    
    // Set larger viewport to accommodate content
    await page.setViewport({ width: viewportWidth, height: viewportHeight });

    // Create complete HTML if needed
    let htmlContent = artifactCode;
    if (!htmlContent.includes('<!DOCTYPE html>')) {
      htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Visual</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { 
            margin: 0; 
            padding: 10px; 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: white;
            box-sizing: border-box;
            overflow: visible;
        }
        .visual-container {
            width: ${width - 20}px;
            height: ${height - 20}px;
            box-sizing: border-box;
            overflow: visible;
        }
        * { box-sizing: border-box; }
    </style>
</head>
<body>
    <div class="visual-container">
        ${artifactCode}
    </div>
</body>
</html>`;
    }

    // Apply overflow fixes to prevent cut-off content
    htmlContent = injectOverflowFixes(htmlContent, width, height);

    // Set content and wait for rendering
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Wait longer for complex charts and animations
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check actual content dimensions
    const contentDimensions = await page.evaluate(() => {
      const container = document.querySelector('.visual-container') || document.body;
      const rect = container.getBoundingClientRect();
      const scrollWidth = container.scrollWidth || document.body.scrollWidth;
      const scrollHeight = container.scrollHeight || document.body.scrollHeight;
      
      // Additional debugging info
      const allElements = Array.from(document.querySelectorAll('*')).map(el => {
        const elRect = el.getBoundingClientRect();
        return {
          tag: el.tagName.toLowerCase(),
          width: elRect.width,
          height: elRect.height,
          right: elRect.right,
          bottom: elRect.bottom
        };
      });
      
      const overflowingElements = allElements.filter(el => 
        el.right > rect.width || el.bottom > rect.height
      );
      
      return {
        width: Math.max(rect.width, scrollWidth),
        height: Math.max(rect.height, scrollHeight),
        scrollWidth,
        scrollHeight,
        hasOverflow: scrollWidth > rect.width || scrollHeight > rect.height,
        containerRect: rect,
        overflowingElements: overflowingElements.slice(0, 5), // Limit to first 5
        elementCount: allElements.length
      };
    });

    console.log(`📐 Content dimensions for ${questionId}:`, {
      expected: `${width}x${height}`,
      actual: `${Math.round(contentDimensions.width)}x${Math.round(contentDimensions.height)}`,
      hasOverflow: contentDimensions.hasOverflow,
      elementCount: contentDimensions.elementCount
    });
    
    if (contentDimensions.overflowingElements.length > 0) {
      console.log(`⚠️  Elements causing overflow:`, contentDimensions.overflowingElements);
    }

    // Determine screenshot dimensions
    let screenshotWidth = width;
    let screenshotHeight = height;
    
    // If content overflows, adjust screenshot size but cap at reasonable limits
    if (contentDimensions.hasOverflow) {
      screenshotWidth = Math.min(Math.max(width, contentDimensions.width + 20), width * 1.5);
      screenshotHeight = Math.min(Math.max(height, contentDimensions.height + 20), height * 1.5);
      
      console.log(`⚠️  Content overflow detected, adjusting to: ${Math.round(screenshotWidth)}x${Math.round(screenshotHeight)}`);
    }

    // Take screenshot
    const filename = `question_${questionId}_visual.png`;
    const filepath = path.join(imagesDir, filename);
    
    const screenshotBuffer = await page.screenshot({
      type: 'png',
      clip: { 
        x: 0, 
        y: 0, 
        width: Math.round(screenshotWidth), 
        height: Math.round(screenshotHeight) 
      },
      omitBackground: false
    });

    // Convert Uint8Array to Buffer
    const buffer = Buffer.from(screenshotBuffer);

    // Save to file
    fs.writeFileSync(filepath, buffer);

    await page.close();

    console.log(`📸 Generated image: ${filename} (${Math.round(buffer.length / 1024)}KB)`);
    return { buffer, filepath };

  } catch (error) {
    console.error(`❌ Image conversion failed for ${questionId}:`, error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

// Supabase Storage integration
async function uploadImageToSupabase(
  imageBuffer: Buffer, 
  questionId: string
): Promise<string | null> {
  try {
    const fileName = `question_${questionId}_visual.png`;
    console.log(`☁️ Uploading ${fileName} to Supabase Storage...`);
    
    const { data, error } = await supabase.storage
      .from('question-images')
      .upload(`visuals/${questionId}/${fileName}`, imageBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (error) {
      console.error(`❌ Storage upload failed: ${error.message}`);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('question-images')
      .getPublicUrl(`visuals/${questionId}/${fileName}`);

    console.log(`✅ Image uploaded: ${urlData.publicUrl}`);
    return urlData.publicUrl;

  } catch (error) {
    console.error(`❌ Upload error:`, error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

// Database operations
async function updateQuestionWithImageUrl(questionId: string, imageUrl: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('questions')
      .update({ 
        visual_url: imageUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', questionId);

    if (error) {
      console.error(`❌ Database update failed: ${error.message}`);
      return false;
    }

    console.log(`💾 Updated question record with image URL`);
    return true;

  } catch (error) {
    console.error(`❌ Database error:`, error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

async function fetchQuestionsWithVisualData(batchSize: number): Promise<QuestionWithVisual[]> {
  try {
    console.log('🔍 Fetching questions with visual specifications...');
    
    const { data: questions, error } = await supabase
      .from('questions')
      .select('id, visual_data, visual_type, question_text, test_type, section_name')
      .eq('has_visual', true)
      .is('visual_url', null)
      .limit(batchSize);

    if (error) {
      console.error('❌ Failed to fetch questions:', error.message);
      return [];
    }

    console.log(`📊 Found ${questions?.length || 0} questions needing visuals`);

    // Process questions with valid visual data
    const processableQuestions = (questions || []).map(question => {
      // Parse visual_data if it's a string
      let visualData = question.visual_data;
      if (typeof visualData === 'string') {
        try {
          visualData = JSON.parse(visualData);
        } catch (e) {
          console.warn(`⚠️ Could not parse visual_data for question ${question.id}`);
          return null;
        }
      }
      
      // Make sure we have the required visual properties
      if (!visualData || !visualData.dimensions || !visualData.visual_type) {
        console.warn(`⚠️ Question ${question.id} has incomplete visual_data`);
        return null;
      }

      // Add needed educational purpose if missing
      if (!visualData.educational_purpose) {
        visualData.educational_purpose = "Students learn through visual representation";
      }
      
      // Add expected_student_interaction if missing
      if (!visualData.expected_student_interaction) {
        visualData.expected_student_interaction = "analyze and interpret the visual information";
      }
      
      // Add measurement_precision if missing
      if (!visualData.measurement_precision) {
        visualData.measurement_precision = "standard";
      }
      
      // Add key_elements if missing by using specific_elements
      if (!visualData.key_elements && visualData.specific_elements) {
        visualData.key_elements = Object.values(visualData.specific_elements);
      } else if (!visualData.key_elements) {
        visualData.key_elements = ["Visual elements for the question"];
      }
      
      // Add style_requirements if missing
      if (!visualData.style_requirements) {
        visualData.style_requirements = "Clean, educational style with clear fonts, high contrast colors, minimal decoration, and focus on clarity";
      }

      return {
        ...question,
        visual_data: {
          educational_specification: visualData
        }
      };
    }).filter(q => q !== null) as QuestionWithVisual[];

    console.log(`📊 Successfully prepared ${processableQuestions.length} questions for visual generation`);
    
    return processableQuestions;
  } catch (error) {
    console.error('❌ Database fetch error:', error instanceof Error ? error.message : 'Unknown error');
    return [];
  }
}

// Add CSS fixes for common overflow issues
function injectOverflowFixes(htmlContent: string, width: number, height: number): string {
  const overflowFixesCSS = `
    <style id="overflow-fixes">
      /* Prevent common overflow issues */
      body, html {
        overflow: hidden !important;
        max-width: 100% !important;
        max-height: 100% !important;
      }
      
      .visual-container {
        overflow: hidden !important;
        max-width: 100% !important;
        max-height: 100% !important;
      }
      
      /* Chart.js canvas responsiveness */
      canvas {
        max-width: 100% !important;
        max-height: 100% !important;
        width: auto !important;
        height: auto !important;
      }
      
      /* SVG responsiveness */
      svg {
        max-width: 100% !important;
        max-height: 100% !important;
        width: auto !important;
        height: auto !important;
      }
      
      /* Table overflow handling */
      table {
        max-width: 100% !important;
        table-layout: fixed !important;
        word-wrap: break-word !important;
      }
      
      /* Text overflow handling */
      p, div, span, h1, h2, h3, h4, h5, h6 {
        word-wrap: break-word !important;
        overflow-wrap: break-word !important;
        max-width: 100% !important;
      }
      
      /* Flex and grid containers */
      .flex, .grid, [style*="display: flex"], [style*="display: grid"] {
        max-width: 100% !important;
        max-height: 100% !important;
        overflow: hidden !important;
      }
      
      /* Chart containers */
      .chart-container, .chartjs-container, .chart-wrapper {
        max-width: 100% !important;
        max-height: 100% !important;
        overflow: hidden !important;
      }
    </style>
  `;
  
  // Insert the CSS fixes after the opening <head> tag
  if (htmlContent.includes('<head>')) {
    return htmlContent.replace('<head>', `<head>${overflowFixesCSS}`);
  } else {
    // If no head tag, add it at the beginning of the content
    return overflowFixesCSS + htmlContent;
  }
}

// Processing pipeline
async function processQuestion(question: QuestionWithVisual, stats: ProcessingStats): Promise<void> {
  stats.processed++;
  
  console.log(`\n🎯 Processing question ${stats.processed}: ${question.id}`);
  console.log(`   Type: ${question.visual_type || 'Unknown'}`);
  console.log(`   Test: ${question.test_type || 'Unknown'} - ${question.section_name || 'Unknown'}`);
  console.log(`   Text: ${question.question_text.substring(0, 80)}...`);

  try {
    // Validate visual data structure
    if (!question.visual_data?.educational_specification) {
      console.error(`❌ Missing educational_specification for question ${question.id}`);
      stats.skipped++;
      return;
    }

    const visualSpec = question.visual_data.educational_specification;
    
    // Validate required fields
    if (!visualSpec.visual_type || !visualSpec.dimensions || !visualSpec.educational_purpose) {
      console.error(`❌ Invalid educational specification structure for ${question.id}`);
      stats.skipped++;
      return;
    }

    console.log(`📚 Educational Purpose: ${visualSpec.educational_purpose}`);
    console.log(`🎨 Visual Type: ${visualSpec.visual_type}`);
    console.log(`📐 Dimensions: ${visualSpec.dimensions.width}x${visualSpec.dimensions.height}`);

    const { width, height } = visualSpec.dimensions;

    // Step 1: Generate artifact using Claude API
    const artifactCode = await generateVisualFromSpec(visualSpec, question.id);
    if (!artifactCode) {
      stats.failed++;
      return;
    }

    // Step 2: Convert artifact to image
    const imageResult = await convertArtifactToImage(artifactCode, width, height, question.id);
    if (!imageResult) {
      stats.failed++;
      return;
    }

    // Step 3: Upload to Supabase Storage
    const imageUrl = await uploadImageToSupabase(imageResult.buffer, question.id);
    if (!imageUrl) {
      stats.failed++;
      return;
    }

    // Step 4: Update database
    const updateSuccess = await updateQuestionWithImageUrl(question.id, imageUrl);
    if (!updateSuccess) {
      stats.failed++;
      return;
    }

    stats.successful++;
    console.log(`✅ Successfully processed question ${question.id}`);

  } catch (error) {
    console.error(`❌ Error processing question ${question.id}:`, error instanceof Error ? error.message : 'Unknown error');
    stats.failed++;
  }
}

// Rate limiting
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main processing function
async function processVisualQuestions(batchSize: number = 10): Promise<void> {
  const stats: ProcessingStats = {
    processed: 0,
    successful: 0,
    failed: 0,
    skipped: 0
  };

  try {
    // Fetch questions
    const questions = await fetchQuestionsWithVisualData(batchSize);
    
    if (questions.length === 0) {
      console.log('ℹ️ No questions with visual data needing processing found');
      return;
    }

    console.log(`📊 Found ${questions.length} questions needing visual generation\n`);

    // Initialize browser once
    await initializeBrowser();

    // Process questions with rate limiting
    for (let i = 0; i < questions.length; i++) {
      await processQuestion(questions[i], stats);
      
      // Add delay to respect API rate limits
      if (i < questions.length - 1) {
        console.log('⏳ Waiting 2 seconds before next request...');
        await sleep(2000);
      }
    }

    // Cleanup
    await closeBrowser();

    // Final report
    console.log('\n🎉 Visual generation batch complete!');
    console.log('=' .repeat(50));
    console.log(`📊 Processing Summary:`);
    console.log(`   • Total processed: ${stats.processed}`);
    console.log(`   • Successful: ${stats.successful}`);
    console.log(`   • Failed: ${stats.failed}`);
    console.log(`   • Skipped: ${stats.skipped}`);
    console.log(`   • Success rate: ${stats.processed > 0 ? Math.round((stats.successful / stats.processed) * 100) : 0}%`);
    console.log('\n📁 Generated images saved to:', imagesDir);
    console.log('🗂️ Images uploaded to Supabase Storage bucket: question-images');
    console.log('💡 Check the visual_url field in your questions table');

  } catch (error) {
    console.error('❌ Processing failed:', error instanceof Error ? error.message : 'Unknown error');
    await closeBrowser();
  }
}

// CLI interface
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const batchSize = args[0] ? parseInt(args[0]) : 10;

  if (isNaN(batchSize) || batchSize < 1) {
    console.error('❌ Invalid batch size. Please provide a positive number.');
    process.exit(1);
  }

  // Validate required environment variables
  if (!process.env.CLAUDE_API_KEY) {
    console.error('❌ CLAUDE_API_KEY environment variable is required');
    process.exit(1);
  }

  console.log(`🚀 Starting Claude-powered visual generation with batch size: ${batchSize}\n`);
  
  await processVisualQuestions(batchSize);
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received interrupt signal, cleaning up...');
  await closeBrowser();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received termination signal, cleaning up...');
  await closeBrowser();
  process.exit(0);
});

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(() => {
      console.log('\n✅ Visual image generation completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Visual image generation failed:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    });
}

export { processVisualQuestions, generateVisualFromSpec };