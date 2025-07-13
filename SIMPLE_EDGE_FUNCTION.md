# Simplified Edge Function for Dashboard

Copy this exact code into the dashboard editor:

```javascript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Credentials': 'true'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const requestData = await req.json();

    if (!requestData.testType || !requestData.sectionName || !requestData.subSkill) {
      throw new Error('Missing required fields');
    }

    const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY');
    if (!CLAUDE_API_KEY) {
      throw new Error('Claude API key not configured');
    }

    const prompt = `Generate ${requestData.questionCount || 1} multiple-choice questions for Australian ${requestData.testType} assessment.

Requirements:
- Test Type: ${requestData.testType}
- Year Level: ${requestData.yearLevel}
- Section: ${requestData.sectionName}
- Sub-skill: ${requestData.subSkill}
- Difficulty Level: ${requestData.difficulty || 1}/3

Return as JSON:
{
  "questions": [{
    "questionText": "Question text here",
    "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
    "correctAnswer": "A",
    "explanation": "Explanation here",
    "difficulty": ${requestData.difficulty || 1},
    "subSkill": "${requestData.subSkill}",
    "hasVisual": false
  }]
}`;

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      throw new Error(`Claude API error: ${claudeResponse.status}`);
    }

    const claudeData = await claudeResponse.json();
    
    if (!claudeData.content || !claudeData.content[0] || !claudeData.content[0].text) {
      throw new Error('Invalid response from Claude API');
    }

    let generatedContent;
    try {
      generatedContent = JSON.parse(claudeData.content[0].text);
    } catch (parseError) {
      throw new Error('Failed to parse Claude response');
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: generatedContent
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred'
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
```

**Key changes made:**
1. Removed all TypeScript type annotations
2. Simplified to plain JavaScript
3. Removed complex interface definitions
4. Made all variables more straightforward

**Steps:**
1. **Clear the current code** in the dashboard editor
2. **Copy the above code exactly**
3. **Click "Deploy Function"**

This should deploy without parsing errors.