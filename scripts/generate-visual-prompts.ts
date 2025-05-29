import { config } from 'dotenv';
import { supabase } from '../src/integrations/supabase/client';
import * as fs from 'fs';
import * as path from 'path';

config();

interface QuestionWithVisual {
  id: string;
  question_text: string;
  test_type: string;
  section_name: string;
  sub_skill: string;
  difficulty: number;
  year_level: number;
  visual_data: any;
}

interface QuestionIndex {
  index: number;
  questionId: string;
  testType: string;
  subSkill: string;
  difficulty: number;
}

async function generateVisualPrompts(): Promise<void> {
  try {
    console.log('🔍 Querying questions that need visuals...');
    
    // Query questions that have visuals but no HTML yet
    const { data: questions, error } = await supabase
      .from('questions')
      .select('id, question_text, test_type, section_name, sub_skill, difficulty, year_level, visual_data')
      .eq('has_visual', true)
      .is('visual_html', null)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    if (!questions || questions.length === 0) {
      console.log('✅ No questions found that need visuals generated');
      return;
    }

    console.log(`📊 Found ${questions.length} questions needing visuals`);

    // Create output directory
    const outputDir = path.join(process.cwd(), 'visual-generation-batch');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate prompts for each question
    const prompts: string[] = [];
    const questionIndex: QuestionIndex[] = [];

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i] as QuestionWithVisual;
      
      let visualSpec;
      try {
        visualSpec = typeof question.visual_data === 'string' 
          ? JSON.parse(question.visual_data) 
          : question.visual_data;
      } catch (e) {
        console.warn(`⚠️ Skipping question ${question.id} - invalid visual_data`);
        continue;
      }

      const promptForClaude = generateClaudeVisualPrompt(question, visualSpec, i + 1);
      prompts.push(promptForClaude);
      
      questionIndex.push({
        index: i + 1,
        questionId: question.id,
        testType: question.test_type,
        subSkill: question.sub_skill,
        difficulty: question.difficulty
      });
    }

    // Save prompts to file
    const promptsFile = path.join(outputDir, 'claude-visual-prompts.md');
    const promptsContent = `# Claude Visual Generation Prompts
    
Generated: ${new Date().toISOString()}
Total Questions: ${prompts.length}

${prompts.join('\n\n---\n\n')}

## Important Notes:
- Copy each prompt individually to Claude web app
- Save the HTML/SVG output for each visual
- Use the question index numbers to match responses
- Run \`npm run process-visual-responses\` after collecting all responses
`;

    fs.writeFileSync(promptsFile, promptsContent);

    // Save question index for response processing
    const indexFile = path.join(outputDir, 'question-index.json');
    fs.writeFileSync(indexFile, JSON.stringify(questionIndex, null, 2));

    // Create response template file
    const responseTemplate = path.join(outputDir, 'visual-responses-template.json');
    const template: { [key: number]: { questionId: string; html: string; notes: string } } = {};
    
    questionIndex.forEach(item => {
      template[item.index] = {
        questionId: item.questionId,
        html: "", // Paste Claude's HTML/SVG output here
        notes: "" // Optional notes about the visual
      };
    });

    fs.writeFileSync(responseTemplate, JSON.stringify(template, null, 2));

    console.log(`✅ Generated ${prompts.length} visual prompts`);
    console.log(`📁 Files saved to: ${outputDir}`);
    console.log(`📋 Next steps:`);
    console.log(`   1. Open: ${promptsFile}`);
    console.log(`   2. Copy each prompt to Claude web app`);
    console.log(`   3. Save HTML/SVG responses in: ${responseTemplate}`);
    console.log(`   4. Run: npm run process-visual-responses`);

  } catch (error) {
    console.error('❌ Error generating visual prompts:', error);
    process.exit(1);
  }
}

function generateClaudeVisualPrompt(
  question: QuestionWithVisual, 
  visualSpec: any, 
  index: number
): string {
  return `## Visual ${index}: ${question.test_type} - ${question.sub_skill}

**Question ID:** ${question.id}
**Test Type:** ${question.test_type}
**Section:** ${question.section_name}
**Sub-skill:** ${question.sub_skill}
**Difficulty:** ${question.difficulty}/3
**Year Level:** ${question.year_level}

**Question Text:**
${question.question_text}

**Visual Specification:**
- **Type:** ${visualSpec.visual_type || 'Not specified'}
- **Dimensions:** ${visualSpec.dimensions?.width || 500}×${visualSpec.dimensions?.height || 350}px
- **Overview:** ${visualSpec.visual_overview || 'No overview provided'}

**Detailed Requirements:**
${visualSpec.detailed_description || 'No detailed description provided'}

**Specific Elements Required:**
${Object.entries(visualSpec.specific_elements || {}).map(([key, value]) => `- **${key}:** ${value}`).join('\n')}

**Constraints (What NOT to include):**
${(visualSpec.constraints || []).map((constraint: string) => `- ${constraint}`).join('\n')}

**CLAUDE PROMPT:**
Create an HTML/SVG visual for this ${question.test_type} question that matches the specifications above. The visual should:

1. Be contained in a complete HTML structure with embedded CSS
2. Use SVG for precise geometric elements and measurements
3. Be exactly ${visualSpec.dimensions?.width || 500}×${visualSpec.dimensions?.height || 350}px
4. Match the authentic style of real ${question.test_type} test materials
5. Use UK spelling for all text labels (e.g., "colour", "centre", "metre")
6. Be simple and educational - avoid unnecessary decorative elements
7. Have high contrast and clear readability for students
8. Include only elements that would appear in an official test

Return ONLY the complete HTML code (including <html>, <head>, <body> tags) that displays this visual. The HTML should be self-contained and ready to use.`;
}

// ES modules entry point check
const isMainModule = import.meta.url.endsWith(process.argv[1]);
if (isMainModule) {
  generateVisualPrompts().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { generateVisualPrompts }; 