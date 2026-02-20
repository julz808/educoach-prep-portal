/**
 * V2 Question Generation Engine - Visual Generator
 * Generates SVG diagrams for math and visual reasoning questions
 *
 * Created: 2026-02-09
 */

import Anthropic from '@anthropic-ai/sdk';

// ============================================================================
// TYPES
// ============================================================================

export type VisualType =
  | 'geometry'
  | 'chart'
  | 'graph'
  | 'number_line'
  | 'grid'
  | 'venn_diagram'
  | 'pattern'
  | 'table'
  | 'html_table'  // New: HTML table for matrices and data tables
  | 'image_generation'  // New: Prompt for external image generation
  | 'none';

export interface VisualSpec {
  type: VisualType;
  description: string;
  parameters?: Record<string, any>;
}

export interface VisualGenerationResult {
  success: boolean;
  svg?: string;  // SVG markup (for SVG visuals)
  html?: string;  // HTML markup (for HTML tables)
  visualPrompt?: string;  // Prompt for image generation (for image_generation type)
  visualType?: VisualType;
  visualData?: any;
  requiresManualImage?: boolean;  // Flag for image_generation type
  error?: string;
  cost?: number;
  timeMs?: number;
}

// ============================================================================
// MAIN VISUAL GENERATOR
// ============================================================================

/**
 * Generate SVG visual from specification using Claude
 *
 * @example
 * const spec = {
 *   type: 'geometry',
 *   description: 'A right triangle ABC with legs 3cm and 4cm',
 *   parameters: { shape: 'triangle', right_angle: true, sides: [3, 4, 5] }
 * };
 *
 * const result = await generateVisual(spec);
 * // Returns SVG markup for the triangle
 */
export async function generateVisual(
  spec: VisualSpec
): Promise<VisualGenerationResult> {

  const startTime = Date.now();

  // Handle no visual needed
  if (spec.type === 'none') {
    return {
      success: true,
      visualType: 'none',
      cost: 0,
      timeMs: 0
    };
  }

  // Handle image generation (just create prompt, no actual image)
  if (spec.type === 'image_generation') {
    console.log(`   🎨 Creating image generation prompt...`);
    const imagePrompt = buildImageGenerationPrompt(spec);

    return {
      success: true,
      visualType: 'image_generation',
      visualPrompt: imagePrompt,
      requiresManualImage: true,
      visualData: spec.parameters,
      cost: 0,
      timeMs: Date.now() - startTime
    };
  }

  try {
    console.log(`   🎨 Generating ${spec.type} visual...`);

    // Build prompt for Claude to generate SVG or HTML
    const prompt = buildVisualPrompt(spec);

    // Call Claude API
    const anthropic = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY
    });

    // Use Opus 4.5 for visual generation — superior spatial reasoning and geometry
    // Question generation still uses Sonnet 4.5 (faster, cheaper)
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5-20251101',  // Opus 4.5 — best for complex visuals, geometry, and spatial reasoning
      max_tokens: 2000,
      temperature: 0.3,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    // Extract content from response
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Extract HTML table or SVG based on type
    let html: string | undefined;
    let svg: string | undefined;

    if (spec.type === 'html_table') {
      html = extractHTML(content.text);
      if (!html) {
        throw new Error('Failed to extract HTML table from Claude response');
      }
    } else {
      svg = extractSVG(content.text);
      if (!svg) {
        throw new Error('Failed to extract SVG from Claude response');
      }
    }

    // Calculate cost (Opus 4.6 pricing)
    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    // Opus 4.6: $15 per million input tokens, $75 per million output tokens
    const cost = (inputTokens * 0.000015) + (outputTokens * 0.000075);

    const timeMs = Date.now() - startTime;

    console.log(`   ✅ Visual generated (${outputTokens} tokens, $${cost.toFixed(4)})`);

    return {
      success: true,
      svg,
      html,
      visualType: spec.type,
      visualData: spec.parameters,
      cost,
      timeMs
    };

  } catch (error) {
    console.error(`   ❌ Visual generation failed: ${error}`);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      cost: 0,
      timeMs: Date.now() - startTime
    };
  }
}

// ============================================================================
// PROMPT BUILDING
// ============================================================================

function buildVisualPrompt(spec: VisualSpec): string {
  // HTML table generation
  if (spec.type === 'html_table') {
    return `You are an expert at creating clear, accurate HTML tables for educational content.

Generate a clean HTML table based on the following specification:

**Visual Type:** HTML Table (Number Matrix or Data Table)
**Description:** ${spec.description}
${spec.parameters ? `**Parameters:** ${JSON.stringify(spec.parameters, null, 2)}` : ''}

**Requirements:**
1. Generate ONLY the HTML table markup (starting with <table> and ending with </table>)
2. Use proper table structure with <thead>, <tbody>, <tr>, <th>, and <td> tags
3. Add inline CSS styling for clean presentation:
   - border-collapse: collapse
   - borders around cells
   - padding in cells for readability
   - center-aligned text
   - monospace font for numbers if applicable
4. Make the table responsive and accessible
5. Use semantic HTML
6. Ensure all numbers/data are accurate
7. No JavaScript, just pure HTML+CSS

**Example structure:**
<table style="border-collapse: collapse; font-family: Arial, sans-serif;">
  <thead>
    <tr>
      <th style="border: 1px solid #333; padding: 8px; background: #f0f0f0;">Header 1</th>
      <th style="border: 1px solid #333; padding: 8px; background: #f0f0f0;">Header 2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #333; padding: 8px; text-align: center;">Value 1</td>
      <td style="border: 1px solid #333; padding: 8px; text-align: center;">Value 2</td>
    </tr>
  </tbody>
</table>

Output ONLY the HTML table markup, no explanations or markdown.`;
  }

  // SVG generation (existing)
  const basePrompt = `You are an expert at creating clear, accurate SVG diagrams for educational content.

Generate a clean SVG diagram based on the following specification:

**Visual Type:** ${spec.type}
**Description:** ${spec.description}
${spec.parameters ? `**Parameters:** ${JSON.stringify(spec.parameters, null, 2)}` : ''}

**Requirements:**
1. Generate ONLY the SVG markup (starting with <svg> and ending with </svg>)
2. Use a viewBox for responsive sizing (e.g., viewBox="0 0 400 300")
3. Include clear labels where appropriate
4. Use clean, readable styling
5. Ensure the diagram is accurate and educationally appropriate
6. Use appropriate colors (avoid red/green for accessibility)
7. Keep the SVG simple and clean
8. For text, use readable font sizes (12-16pt)

${getTypeSpecificGuidance(spec.type)}

Output ONLY the SVG markup, no explanations or markdown.`;

  return basePrompt;
}

function getTypeSpecificGuidance(type: VisualType): string {
  switch (type) {
    case 'geometry':
      return `**Geometry Guidance:**
- Label all vertices, sides, and angles clearly
- Use precise measurements
- Show right angles with small squares
- Include a scale if relevant
- Use grid lines if helpful`;

    case 'chart':
    case 'graph':
      return `**Chart/Graph Guidance:**
- Include clearly labeled axes
- Add a title if specified
- Show gridlines for readability
- Use distinct colors for different data series
- Include a legend if multiple series
- Label all data points or bars

🚨 CRITICAL - DO NOT REVEAL THE ANSWER:
- If the description mentions a question that asks to "calculate" or "find" a specific value, DO NOT show that calculated value in the chart
- For pie charts: Show PERCENTAGES in the legend, not dollar amounts or calculated values
- For bar/line graphs: Show the data points but not calculated totals/differences if those are what the question asks for
- Example: If question asks "how much on food?", show "Food - 25%" NOT "Food - $30"
- The chart must provide DATA to work with, not THE ANSWER itself`;

    case 'number_line':
      return `**Number Line Guidance:**
- Show clear tick marks and labels
- Include arrows at both ends
- Mark specific numbers as requested
- Use consistent spacing
- Include zero if relevant`;

    case 'grid':
      return `**Grid Guidance:**
- Show clear grid lines
- Label axes if coordinate plane
- Mark specific points as requested
- Use appropriate scale`;

    case 'venn_diagram':
      return `**Venn Diagram Guidance:**
- Show overlapping circles clearly
- Label each set
- Show intersection clearly
- Use subtle colors for fill`;

    case 'pattern':
      return `**Pattern Guidance:**
- Show the pattern clearly and accurately
- Make it easy to identify the repeating elements
- Use consistent spacing and sizing`;

    case 'table':
      return `**Table Guidance:**
- Use clear borders
- Align content appropriately
- Use readable spacing
- Include headers`;

    default:
      return '';
  }
}

// ============================================================================
// CONTENT EXTRACTION
// ============================================================================

function extractSVG(text: string): string | null {
  // Try to find SVG tags
  const svgMatch = text.match(/<svg[\s\S]*?<\/svg>/i);

  if (svgMatch) {
    return svgMatch[0];
  }

  // Try to find SVG in code blocks
  const codeBlockMatch = text.match(/```(?:svg)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    const codeContent = codeBlockMatch[1];
    const svgInBlock = codeContent.match(/<svg[\s\S]*?<\/svg>/i);
    if (svgInBlock) {
      return svgInBlock[0];
    }
  }

  return null;
}

function extractHTML(text: string): string | null {
  // Try to find HTML table tags
  const tableMatch = text.match(/<table[\s\S]*?<\/table>/i);

  if (tableMatch) {
    return tableMatch[0];
  }

  // Try to find HTML in code blocks
  const codeBlockMatch = text.match(/```(?:html)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    const codeContent = codeBlockMatch[1];
    const tableInBlock = codeContent.match(/<table[\s\S]*?<\/table>/i);
    if (tableInBlock) {
      return tableInBlock[0];
    }
  }

  return null;
}

function buildImageGenerationPrompt(spec: VisualSpec): string {
  // Build a detailed prompt for DALL-E/Imagen/ChatGPT image generation
  return `Create a high-quality educational image for the following:

**Description:** ${spec.description}
${spec.parameters ? `**Additional Details:** ${JSON.stringify(spec.parameters, null, 2)}` : ''}

**Image Requirements:**
- High resolution, clear and professional
- Suitable for educational use (Year 7-9 students)
- Clean, simple composition
- Good contrast and readability
- No text unless specifically mentioned
- Photorealistic or illustrative style as appropriate
- Appropriate for Australian educational context

**Use this prompt in DALL-E, Midjourney, or similar image generation tool.**`;
}

// ============================================================================
// VISUAL VALIDATION
// ============================================================================

/**
 * Validate that generated SVG is valid and safe
 */
export function validateSVG(svg: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check if it starts and ends with svg tags
  if (!svg.trim().startsWith('<svg')) {
    errors.push('SVG must start with <svg> tag');
  }

  if (!svg.trim().endsWith('</svg>')) {
    errors.push('SVG must end with </svg> tag');
  }

  // Check for dangerous content
  const dangerous = [
    '<script',
    'javascript:',
    'onerror=',
    'onclick=',
    'onload='
  ];

  for (const pattern of dangerous) {
    if (svg.toLowerCase().includes(pattern)) {
      errors.push(`SVG contains potentially dangerous content: ${pattern}`);
    }
  }

  // Check for viewBox (recommended)
  if (!svg.includes('viewBox')) {
    errors.push('SVG should include viewBox for responsive sizing (warning)');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// HELPER: GENERATE FALLBACK TEXT DESCRIPTION
// ============================================================================

/**
 * Generate a text description as fallback if visual generation fails
 */
export function generateFallbackDescription(spec: VisualSpec): string {
  return `[Visual: ${spec.type}] ${spec.description}`;
}
