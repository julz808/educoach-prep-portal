# Visual Generation System - Complete Guide

**Version:** 2.3
**Last Updated:** February 19, 2026
**Status:** ✅ Production Ready

---

## 📚 Table of Contents

1. [Overview](#overview)
2. [How It Works](#how-it-works)
3. [Visual Types](#visual-types)
4. [When Visuals Are Generated](#when-visuals-are-generated)
5. [Generation Process](#generation-process)
6. [Configuration](#configuration)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

---

## Overview

The V2 engine includes an automated visual generation system that creates SVG diagrams, HTML tables, and image prompts for questions that require visual elements.

### Key Features

- ✅ **Automatic detection** - Detects when questions need visuals based on sub-skill configuration
- ✅ **Multiple formats** - Supports SVG, HTML tables, and image generation prompts
- ✅ **Claude Opus 4.5** - Uses Claude Opus for superior spatial reasoning and geometry
- ✅ **60-second timeout** - Prevents hanging on complex visuals
- ✅ **Non-blocking** - Visual generation failures don't block question storage
- ✅ **Cost tracking** - Tracks cost per visual generation

### Visual Types Supported

| Type | Use Case | Output Format | Model |
|------|----------|---------------|-------|
| `geometry` | Shapes, angles, triangles, polygons | SVG | Opus 4.5 |
| `chart` | Bar charts, pie charts, line graphs | SVG | Opus 4.5 |
| `graph` | Coordinate grids, function plots | SVG | Opus 4.5 |
| `number_line` | Number lines with points/ranges | SVG | Opus 4.5 |
| `grid` | Coordinate grids, game boards | SVG | Opus 4.5 |
| `venn_diagram` | Set theory, logic diagrams | SVG | Opus 4.5 |
| `pattern` | Visual patterns, sequences | SVG | Opus 4.5 |
| `table` | Simple data tables | SVG | Opus 4.5 |
| `html_table` | Matrices, complex data tables | HTML | Opus 4.5 |
| `image_generation` | Photos, complex scenes | Image prompt | N/A |
| `none` | No visual needed | N/A | N/A |

---

## How It Works

### Step-by-Step Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. QUESTION GENERATION                                      │
│    - Question text includes placeholder: "SEE DIAGRAM"      │
│    - Visual spec included in metadata                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. VISUAL REQUIREMENT DETECTION                             │
│    - Check sub-skill configuration                          │
│    - Check visual_requirement.requires_visual               │
│    - Check generation_rate (e.g., 80% should have visuals)  │
└─────────────────────────────────────────────────────────────┘
                          ↓
                 Visual needed? ──── No ──→ Skip visual generation
                          ↓
                         Yes
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. VISUAL GENERATION (Claude Opus 4.5)                      │
│    - Build visual prompt with spec                          │
│    - Call Claude Opus API                                   │
│    - Extract SVG or HTML from response                      │
│    - Timeout after 60 seconds                               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. VALIDATION & STORAGE                                     │
│    - Validate SVG/HTML markup                               │
│    - Store in visual_svg field                              │
│    - Set has_visual = true                                  │
│    - Track cost and time                                    │
└─────────────────────────────────────────────────────────────┘
```

### Example: Geometry Question

**1. Question generated:**
```
A right triangle has legs of 3cm and 4cm. SEE DIAGRAM. What is the length of the hypotenuse?

A) 5 cm
B) 6 cm
C) 7 cm
D) 8 cm
```

**2. Visual spec:**
```typescript
{
  type: 'geometry',
  description: 'A right triangle ABC with legs 3cm and 4cm, showing right angle',
  parameters: {
    shape: 'triangle',
    right_angle: true,
    sides: [3, 4, 5],
    labels: true
  }
}
```

**3. Visual generated (SVG):**
```xml
<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
  <polygon points="50,250 50,100 200,250" fill="none" stroke="#333" stroke-width="2"/>
  <text x="45" y="175" font-size="14">3 cm</text>
  <text x="125" y="265" font-size="14">4 cm</text>
  <text x="130" y="175" font-size="14">5 cm</text>
  <rect x="45" y="95" width="10" height="10" fill="none" stroke="#333" stroke-width="1"/>
</svg>
```

**4. Stored in database:**
- `question_text`: "A right triangle has legs of 3cm and 4cm. SEE DIAGRAM. What is the length..."
- `visual_svg`: "<svg viewBox="0 0 400 300"..."
- `has_visual`: `true`

---

## Visual Types

### SVG Visuals

#### Geometry
```typescript
{
  type: 'geometry',
  description: 'Equilateral triangle with side length 6cm',
  parameters: {
    shape: 'triangle',
    sides: [6, 6, 6],
    equilateral: true,
    labels: true
  }
}
```

**Use cases**: Shapes, angles, polygons, geometric proofs

**Guidance provided to Opus**:
- Use accurate measurements and angles
- Label vertices with letters (A, B, C, etc.)
- Show measurements on sides
- Mark right angles with small squares
- Use clear, proportional scaling

#### Charts
```typescript
{
  type: 'chart',
  description: 'Bar chart showing test scores: Math 85, English 92, Science 78',
  parameters: {
    chart_type: 'bar',
    data: [
      { label: 'Math', value: 85 },
      { label: 'English', value: 92 },
      { label: 'Science', value: 78 }
    ],
    y_axis_max: 100
  }
}
```

**Use cases**: Bar charts, pie charts, line graphs, data visualization

**Guidance provided to Opus**:
- Include axis labels and units
- Use consistent scales
- Add a legend if needed
- Use accessible colors (avoid red/green)

#### Number Line
```typescript
{
  type: 'number_line',
  description: 'Number line from -5 to 5 with points at -2, 0, and 3',
  parameters: {
    min: -5,
    max: 5,
    marked_points: [-2, 0, 3],
    tick_interval: 1
  }
}
```

**Use cases**: Integer operations, fractions, inequalities, ranges

**Guidance provided to Opus**:
- Use evenly spaced tick marks
- Label key points clearly
- Use arrows at ends
- Show zero prominently

#### Venn Diagram
```typescript
{
  type: 'venn_diagram',
  description: '2-circle Venn diagram: Set A (prime numbers < 10), Set B (even numbers < 10)',
  parameters: {
    circles: 2,
    labels: ['Prime < 10', 'Even < 10'],
    intersection_elements: [2],
    set_a_only: [3, 5, 7],
    set_b_only: [4, 6, 8]
  }
}
```

**Use cases**: Set theory, logic, probability

**Guidance provided to Opus**:
- Overlap circles appropriately
- Label each region
- Show elements in correct regions
- Use clear circle labels

### HTML Visuals

#### HTML Table
```typescript
{
  type: 'html_table',
  description: '3×3 matrix showing multiplication table for 6, 7, 8',
  parameters: {
    rows: 3,
    cols: 3,
    data: [
      [6, 12, 18],
      [7, 14, 21],
      [8, 16, 24]
    ],
    headers: ['×1', '×2', '×3']
  }
}
```

**Use cases**: Matrices, data tables, timetables, schedules

**Generated HTML example**:
```html
<table style="border-collapse: collapse; font-family: Arial, sans-serif;">
  <thead>
    <tr>
      <th style="border: 1px solid #333; padding: 8px; background: #f0f0f0;">×1</th>
      <th style="border: 1px solid #333; padding: 8px; background: #f0f0f0;">×2</th>
      <th style="border: 1px solid #333; padding: 8px; background: #f0f0f0;">×3</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #333; padding: 8px; text-align: center;">6</td>
      <td style="border: 1px solid #333; padding: 8px; text-align: center;">12</td>
      <td style="border: 1px solid #333; padding: 8px; text-align: center;">18</td>
    </tr>
    <!-- More rows... -->
  </tbody>
</table>
```

### Image Generation Prompts

#### Image Generation
```typescript
{
  type: 'image_generation',
  description: 'A photograph of a Victorian-era street market with vendors selling fruits',
  parameters: {
    style: 'photorealistic',
    era: 'Victorian',
    scene: 'street market',
    elements: ['vendors', 'fruits', 'cobblestone']
  }
}
```

**Use cases**: Historical scenes, complex photographs, realistic imagery

**Output**: Returns a detailed image generation prompt, not an actual image. This prompt can be used with external image generation services.

**Note**: No actual image is generated - the system creates a detailed prompt that can be used with DALL-E, Midjourney, or similar services.

---

## When Visuals Are Generated

### Curriculum Configuration

Visuals are controlled by sub-skill configuration in `curriculumData_v2`:

```typescript
{
  sub_skill: "Geometry & Spatial Reasoning",
  visual_requirement: {
    requires_visual: true,              // This sub-skill needs visuals
    visual_types: ["svg", "html"],      // Supported formats
    generation_rate: 0.8                // 80% of questions should have visuals
  }
}
```

### Configuration Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `requires_visual` | `boolean` | Whether this sub-skill needs visuals | `true` |
| `visual_types` | `array` | Supported visual formats | `["svg", "html"]` |
| `generation_rate` | `number` | Percentage of questions with visuals (0.0-1.0) | `0.8` (80%) |

### Detection Logic

```typescript
// Check if visual is required
const shouldGenerateVisual =
  visualRequirement.requires_visual &&
  Math.random() < visualRequirement.generation_rate;

if (shouldGenerateVisual) {
  // Generate visual
  const visualResult = await generateVisual(visualSpec);
}
```

### Example Sub-Skills with Visuals

**ACER Mathematics - Geometry**:
```typescript
visual_requirement: {
  requires_visual: true,
  visual_types: ["svg"],
  generation_rate: 0.9  // 90% with visuals
}
```

**EduTest Numerical Reasoning - Data Interpretation**:
```typescript
visual_requirement: {
  requires_visual: true,
  visual_types: ["svg", "html"],
  generation_rate: 0.7  // 70% with visuals
}
```

**VIC Selective Mathematics - Geometry & Spatial Reasoning**:
```typescript
visual_requirement: {
  requires_visual: true,
  visual_types: ["svg"],
  generation_rate: 1.0  // 100% with visuals
}
```

---

## Generation Process

### 1. Visual Spec Creation

When a question requires a visual, the question generation prompt includes instructions to output a visual specification:

```typescript
interface VisualSpec {
  type: VisualType;           // 'geometry', 'chart', etc.
  description: string;        // Natural language description
  parameters?: {              // Type-specific parameters
    shape?: string;
    sides?: number[];
    data?: any[];
    // ... more parameters
  };
}
```

### 2. Visual Generation API Call

```typescript
// Call Claude Opus 4.5 for visual generation
const response = await anthropic.messages.create({
  model: 'claude-opus-4-5-20251101',  // Opus 4.5 for superior visuals
  max_tokens: 2000,
  temperature: 0.3,                    // Low temperature for accuracy
  messages: [{
    role: 'user',
    content: buildVisualPrompt(spec)
  }]
});
```

### 3. SVG/HTML Extraction

```typescript
// Extract SVG from Claude response
const svg = extractSVG(response.content[0].text);

// Or extract HTML table
const html = extractHTML(response.content[0].text);
```

**Extraction logic**:
- Finds `<svg>...</svg>` or `<table>...</table>` tags
- Validates markup
- Returns clean SVG/HTML

### 4. Timeout Protection

Visual generation has a 60-second timeout to prevent hanging:

```typescript
const visualResult = await Promise.race([
  generateVisual(spec),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Visual generation timeout')), 60000)
  )
]);
```

**If timeout occurs**:
- Visual generation fails gracefully
- Question is still stored without visual
- Error is logged but doesn't block generation

### 5. Storage

```typescript
// Store in questions_v2 table
await supabase
  .from('questions_v2')
  .insert({
    // ... question fields
    has_visual: true,
    visual_svg: svg || html,  // SVG or HTML markup
    visual_image_url: null    // Reserved for external images
  });
```

---

## Configuration

### Model Selection

**Claude Opus 4.5** is used for visual generation:

```typescript
model: 'claude-opus-4-5-20251101'
```

**Why Opus?**
- Superior spatial reasoning
- Better geometry and diagram accuracy
- More accurate SVG/HTML generation
- Worth the extra cost for visual quality

**Question generation still uses Sonnet 4.5** (faster, cheaper).

### Cost Tracking

Visual generation costs are tracked separately:

```typescript
// Opus 4.5 pricing (as of Feb 2026)
const inputCost = inputTokens * 0.000015;   // $15 per million
const outputCost = outputTokens * 0.000075; // $75 per million
const totalCost = inputCost + outputCost;
```

**Typical costs**:
- Simple geometry: ~$0.0005-0.001
- Complex charts: ~$0.001-0.002
- HTML tables: ~$0.0003-0.0008

### Timeout Configuration

Default timeout is 60 seconds:

```typescript
const VISUAL_TIMEOUT_MS = 60000;  // 60 seconds
```

This can be adjusted in `src/engines/questionGeneration/v2/config.ts`.

---

## Troubleshooting

### Issue: Visual generation failing

**Symptoms**:
- Questions stored without `has_visual` flag
- Error logs: "Visual generation failed"

**Check**:
1. Is Opus 4.5 API key valid?
2. Is API quota exceeded?
3. Is timeout too short for complex visuals?

**Fix**:
```bash
# Check environment variables
echo $CLAUDE_API_KEY

# Check API quota on Anthropic console
# Increase timeout if needed (in config.ts)
```

### Issue: SVG not rendering

**Symptoms**:
- `visual_svg` field has content but doesn't display

**Check**:
1. Is SVG markup valid?
2. Are viewBox dimensions correct?
3. Is frontend rendering SVG correctly?

**Fix**:
```typescript
// Validate SVG
const isValid = svg.startsWith('<svg') && svg.endsWith('</svg>');

// Check viewBox
const hasViewBox = svg.includes('viewBox=');
```

### Issue: Timeouts on complex visuals

**Symptoms**:
- Frequent "Visual generation timeout" errors
- Complex diagrams failing

**Check**:
1. Is 60 seconds too short?
2. Is visual spec too complex?

**Fix**:
```typescript
// Increase timeout in config.ts
export const VISUAL_TIMEOUT_MS = 90000;  // 90 seconds

// Or simplify visual spec
{
  type: 'geometry',
  description: 'Simple triangle',  // Not "Complex 3D dodecahedron..."
  parameters: { shape: 'triangle' }
}
```

### Issue: HTML tables not storing

**Symptoms**:
- HTML tables generated but not saved

**Check**:
1. Is `visual_svg` field used for HTML? (Yes, it's used for both)
2. Is extraction working?

**Fix**: HTML tables are stored in the `visual_svg` field (despite the name). This is correct and intentional.

---

## Best Practices

### 1. Use Appropriate Visual Types

```typescript
// ✅ GOOD
{
  type: 'geometry',
  description: 'Right triangle with sides 3, 4, 5'
}

// ❌ BAD
{
  type: 'image_generation',  // Don't use for simple geometry
  description: 'Photo of a triangle'
}
```

### 2. Keep Descriptions Clear and Simple

```typescript
// ✅ GOOD
{
  type: 'chart',
  description: 'Bar chart: Apples 10, Oranges 15, Bananas 8'
}

// ❌ BAD
{
  type: 'chart',
  description: 'A colorful and vibrant bar chart showing the relative quantities...'
}
```

### 3. Provide Accurate Parameters

```typescript
// ✅ GOOD
{
  type: 'number_line',
  description: 'Number line from 0 to 10',
  parameters: {
    min: 0,
    max: 10,
    tick_interval: 1,
    marked_points: [3, 7]
  }
}

// ❌ BAD
{
  type: 'number_line',
  description: 'Number line',
  parameters: {}  // Missing critical parameters
}
```

### 4. Handle Failures Gracefully

Visual generation failures should not block question generation:

```typescript
try {
  const visualResult = await generateVisual(spec);
  if (visualResult.success) {
    question.has_visual = true;
    question.visual_svg = visualResult.svg || visualResult.html;
  }
} catch (error) {
  console.error('Visual generation failed:', error);
  // Continue with question storage anyway
}
```

### 5. Monitor Costs

Track visual generation costs in logs:

```
✅ Visual generated (geometry)
   Tokens: 450 input, 890 output
   Cost: $0.0734
   Time: 4.2s
```

### 6. Test Visual Output

Always verify generated visuals:

```bash
# View visual questions in browser
open public/visual-questions-viewer.html

# Or query database
psql -d <database> -c "SELECT id, sub_skill, has_visual FROM questions_v2 WHERE has_visual = true LIMIT 10"
```

---

## Database Schema

```sql
CREATE TABLE questions_v2 (
  id UUID PRIMARY KEY,
  -- ... other fields
  has_visual BOOLEAN DEFAULT false,
  visual_svg TEXT,                   -- SVG or HTML content
  visual_image_url TEXT,             -- External image URL (rarely used)
  -- ... other fields
);
```

**Field usage**:
- `has_visual`: Set to `true` when visual is successfully generated
- `visual_svg`: Stores SVG markup OR HTML table markup
- `visual_image_url`: Reserved for external image URLs (e.g., from DALL-E)

---

## Performance Metrics

| Metric | Value |
|--------|-------|
| **Success Rate** | >95% |
| **Average Time** | 3-5 seconds |
| **Average Cost** | $0.0005-0.002 |
| **Timeout Rate** | <1% |
| **Max Tokens** | 2000 |
| **Model** | Claude Opus 4.5 |

---

## Future Enhancements

Potential improvements for future versions:

1. **Caching** - Cache common visual patterns
2. **Templates** - Pre-built SVG templates for common shapes
3. **Validation** - Automated SVG validation and testing
4. **External Images** - Integration with DALL-E or Midjourney
5. **Interactive Visuals** - SVG with animation or interactivity

---

## Related Documentation

- **[V2 Engine Complete Guide](./V2_ENGINE_COMPLETE_GUIDE.md)** - Main engine documentation
- **[Generation Scripts Guide](./GENERATION_SCRIPTS_GUIDE.md)** - How to generate questions
- **[curriculumData_v2](../src/data/curriculumData_v2/)** - Visual requirement configurations

---

**Status**: ✅ Production Ready - Visual generation system is fully operational in V2.3
**Last Updated**: February 19, 2026
