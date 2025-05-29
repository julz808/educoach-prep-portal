#!/usr/bin/env tsx

// Test script to verify both engines work properly
import { 
  generateEducationalVisualSpec,
  VisualSpecification
} from '../engines/question-generation/questionGenerationEngine';

console.log('🧪 Testing Visual Generation Engines');
console.log('==================================\n');

async function testEngine1() {
  console.log('🎯 Testing Engine 1 (Visual Specification Generation)...');
  
  try {
    const visualSpec = generateEducationalVisualSpec(
      'Geometry',
      'Calculate the area of a rectangle using unit squares',
      2,
      'Year 5 NAPLAN',
      'Year 5'
    );

    if (visualSpec) {
      console.log('✅ Engine 1 Success!');
      console.log(`   Visual Type: ${visualSpec.visual_type}`);
      console.log(`   Purpose: ${visualSpec.educational_purpose}`);
      console.log(`   Dimensions: ${visualSpec.dimensions.width}x${visualSpec.dimensions.height}`);
      console.log(`   Key Elements: ${visualSpec.key_elements.length} items`);
      return visualSpec;
    } else {
      console.log('❌ No visual specification generated - sub-skill may not require visuals');
      return null;
    }
  } catch (error) {
    console.error('❌ Engine 1 Failed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

async function testEngine2(visualSpec: VisualSpecification) {
  console.log('\n🎨 Testing Engine 2 (Visual Image Generation)...');
  
  try {
    // Import Engine 2 dynamically to avoid module loading issues
    const { generateVisualFromSpec } = await import('../engines/visual-image-generation/visualImageGenerationEngine');
    
    const artifactCode = await generateVisualFromSpec(visualSpec, 'test-question-123');
    
    if (artifactCode) {
      console.log('✅ Engine 2 Success!');
      console.log(`   Generated artifact code (${artifactCode.length} characters)`);
      console.log('   Preview:', artifactCode.substring(0, 100) + '...');
      return true;
    } else {
      console.log('❌ Engine 2 failed to generate artifact');
      return false;
    }
  } catch (error) {
    console.error('❌ Engine 2 Failed:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

async function main() {
  // Test Engine 1 (Visual Specification Generation)
  const visualSpec = await testEngine1();
  
  if (visualSpec) {
    // Test Engine 2 (Visual Image Generation)
    const engine2Success = await testEngine2(visualSpec);
    
    if (engine2Success) {
      console.log('\n🎉 Both engines working perfectly!');
      console.log('✅ Engine 1: Visual specification generation ✓');
      console.log('✅ Engine 2: Claude-powered visual image generation ✓');
      console.log('\n📋 System Summary:');
      console.log('   • Engine 1 generates detailed educational visual specifications');
      console.log('   • Engine 2 converts specifications into actual HTML/CSS/JS artifacts');
      console.log('   • Engine 2 then renders artifacts as PNG images via Puppeteer');
      console.log('   • Images are uploaded to Supabase Storage for question display');
      console.log('\n💡 Your visual generation pipeline is ready for content creation!');
    } else {
      console.log('\n⚠️  Engine 1 works, but Engine 2 needs attention');
    }
  } else {
    console.log('\n⚠️  Engine 1 needs attention before testing Engine 2');
  }
}

main().catch(error => {
  console.error('❌ Test script failed:', error instanceof Error ? error.message : 'Unknown error');
  process.exit(1);
}); 