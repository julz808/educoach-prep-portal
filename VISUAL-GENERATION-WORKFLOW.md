# Visual Generation Workflow

This document outlines the efficient batch workflow for generating visuals for questions using Claude web app.

## Overview

Questions in the database that require visuals have `has_visual = true` but initially have `visual_html = null`. This workflow allows you to:

1. **Extract** visual specifications from the database
2. **Generate** prompts for Claude web app
3. **Process** Claude's HTML/SVG responses
4. **Update** the database with the generated visuals

## Prerequisites

1. Ensure you have questions in Supabase with `has_visual = true`
2. Add `visual_html` column to your `questions` table:
   ```sql
   ALTER TABLE questions ADD COLUMN visual_html TEXT;
   ```

## Workflow Steps

### Step 1: Preview Questions Needing Visuals

```bash
npm run preview-pending-visuals
```

This shows you:
- How many questions need visuals
- Breakdown by test type and sub-skill
- Total count for planning

### Step 2: Generate Claude Prompts

```bash
npm run generate-visual-prompts
```

This will:
- Query all questions with `has_visual = true` and `visual_html IS NULL`
- Generate detailed prompts for Claude web app
- Create files in `visual-generation-batch/` directory:
  - `claude-visual-prompts.md` - Copy these prompts to Claude
  - `question-index.json` - Internal mapping file
  - `visual-responses-template.json` - Template for your responses

### Step 3: Generate Visuals with Claude Web App

1. Open `visual-generation-batch/claude-visual-prompts.md`
2. Copy each prompt individually to Claude web app
3. Save Claude's HTML/SVG response
4. Paste each response into `visual-responses-template.json`

**Example of filling the template:**
```json
{
  "1": {
    "questionId": "uuid-here",
    "html": "<html><head>...</head><body><svg>...</svg></body></html>",
    "notes": "Generated bar chart for statistics question"
  },
  "2": {
    "questionId": "uuid-here", 
    "html": "<html><head>...</head><body><svg>...</svg></body></html>",
    "notes": "Generated geometry diagram"
  }
}
```

### Step 4: Process Visual Responses

```bash
npm run process-visual-responses
```

This will:
- Read your filled `visual-responses-template.json`
- Validate HTML content
- Clean and secure the HTML (remove scripts, fix UK spelling)
- Update database with `visual_html` content
- Create backup files
- Show processing summary

## Tips for Efficient Processing

### Batching Strategy
- **Small batches**: Process 5-10 visuals at a time for easier management
- **By test type**: Generate all NAPLAN visuals together, then VIC Selective, etc.
- **By complexity**: Do simple diagrams first, complex charts later

### Claude Prompt Tips
- Copy each prompt exactly as provided - they're optimized for Claude
- Ask Claude to return ONLY the HTML code (no explanations)
- If Claude's output is too complex, ask for "simpler, more educational version"
- Ensure visuals match the test type's authentic style

### Quality Checks
- Verify UK spelling in all text labels
- Ensure dimensions match the specifications
- Check that visuals are self-contained (no external dependencies)
- Test HTML in browser if unsure about formatting

## File Structure

```
visual-generation-batch/
├── claude-visual-prompts.md           # Copy these to Claude
├── question-index.json                # Internal mapping (don't edit)
├── visual-responses-template.json     # Fill this with Claude's responses
└── visual-responses-backup-*.json     # Automatic backups
```

## Troubleshooting

### "visual_html column doesn't exist"
Add the column to your questions table:
```sql
ALTER TABLE questions ADD COLUMN visual_html TEXT;
```

### "No questions found that need visuals"
Check if:
- Questions exist with `has_visual = true`
- Questions don't already have `visual_html` content
- Database connection is working

### "Invalid HTML content"
Ensure Claude's response:
- Has proper HTML structure (`<html>`, `<head>`, `<body>`)
- OR is a valid SVG with `<svg>` tags
- Is complete and well-formed

### Processing Errors
- Check the error messages for specific issues
- Validate JSON syntax in responses template
- Ensure all required fields are filled

## Advanced Usage

### Reprocessing Specific Questions
1. Delete `visual_html` content from specific questions in database
2. Run `npm run generate-visual-prompts` again
3. Only those questions will appear in new prompts

### Custom Visual Specifications
The prompts include detailed specifications from `visual_data` field:
- Visual type and dimensions
- Educational requirements
- Test-specific authenticity guidelines
- UK spelling requirements

### Backup and Recovery
- All processed responses are automatically backed up
- Backup files include timestamp for version tracking
- Can restore from backup if needed

## Security Notes

The processing script automatically:
- Removes `<script>` tags for security
- Removes external links and imports
- Validates HTML structure
- Applies UK spelling corrections

## Performance Tips

- Process during off-peak hours for better Claude response times
- Use rate limiting (built into scripts) to avoid overwhelming services
- Monitor database connection for large batches
- Keep browser tabs organized when working with multiple prompts

## Integration with Main System

Once visuals are processed:
- Questions will have `visual_html` content
- Your frontend can render these visuals directly
- No additional processing needed in production
- Visuals are self-contained and optimized

This workflow ensures high-quality, authentic test visuals while maintaining efficiency and security. 