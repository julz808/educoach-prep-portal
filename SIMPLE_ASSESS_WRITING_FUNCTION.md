# Simplified assess-writing Edge Function

Copy this exact code into the dashboard editor for the assess-writing function:

```javascript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

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
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const requestBody = await req.json();
    const { userResponse, writingPrompt, rubric, yearLevel } = requestBody;

    if (!userResponse || !writingPrompt || !rubric || !yearLevel) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const claudeApiKey = Deno.env.get('CLAUDE_API_KEY');
    if (!claudeApiKey) {
      throw new Error('Claude API key not configured');
    }

    const criteriaList = rubric.criteria.map((criterion) => 
      `- ${criterion.name} (${criterion.maxMarks} marks): ${criterion.description}`
    ).join('\n');

    const prompt = `You are an experienced Australian educator assessing ${rubric.genre.toLowerCase()} for ${rubric.testName}.

CONTEXT:
- Year Level: ${yearLevel}
- Time Allocated: ${rubric.timeMinutes} minutes
- Writing Genre: ${rubric.genre}
- Total Possible Score: ${rubric.totalMarks} marks

WRITING PROMPT:
"${writingPrompt}"

STUDENT RESPONSE:
"${userResponse}"

ASSESSMENT CRITERIA (Total: ${rubric.totalMarks} marks):
${criteriaList}

REQUIRED JSON RESPONSE:
{
  "totalScore": <number 0-${rubric.totalMarks}>,
  "criterionScores": {
    ${rubric.criteria.map((c) => `"${c.name}": {"score": <0-${c.maxMarks}>, "feedback": "<specific 1-2 sentence feedback>"}`).join(',\n    ')}
  },
  "overallFeedback": "<2-3 sentences overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"]
}`;

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        temperature: 0.1,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!claudeResponse.ok) {
      const errorData = await claudeResponse.text();
      throw new Error(`Claude API error (${claudeResponse.status}): ${errorData}`);
    }

    const claudeData = await claudeResponse.json();
    const content = claudeData.content && claudeData.content[0] && claudeData.content[0].text;

    if (!content) {
      throw new Error('No content in Claude API response');
    }

    let parsedResponse;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        parsedResponse = JSON.parse(content);
      }
    } catch (parseError) {
      throw new Error('Invalid JSON response from Claude API');
    }

    const totalScore = Math.max(0, Math.min(parsedResponse.totalScore || 0, rubric.totalMarks));
    const criterionScores = {};
    
    for (const criterion of rubric.criteria) {
      const criterionResponse = parsedResponse.criterionScores && parsedResponse.criterionScores[criterion.name];
      const score = Math.max(0, Math.min((criterionResponse && criterionResponse.score) || 0, criterion.maxMarks));
      
      criterionScores[criterion.name] = {
        score: score,
        maxMarks: criterion.maxMarks,
        feedback: (criterionResponse && criterionResponse.feedback) || 'No specific feedback provided.'
      };
    }

    const percentageScore = rubric.totalMarks > 0 ? Math.round((totalScore / rubric.totalMarks) * 100) : 0;

    const assessment = {
      totalScore: totalScore,
      maxPossibleScore: rubric.totalMarks,
      percentageScore: percentageScore,
      criterionScores: criterionScores,
      overallFeedback: parsedResponse.overallFeedback || 'Assessment completed.',
      strengths: Array.isArray(parsedResponse.strengths) ? parsedResponse.strengths.slice(0, 5) : [],
      improvements: Array.isArray(parsedResponse.improvements) ? parsedResponse.improvements.slice(0, 5) : [],
      processingMetadata: {
        modelVersion: 'claude-3-5-sonnet-20241022',
        processingTimeMs: 0,
        promptTokens: claudeData.usage && claudeData.usage.input_tokens,
        responseTokens: claudeData.usage && claudeData.usage.output_tokens
      }
    };

    return new Response(
      JSON.stringify(assessment),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: 'Assessment failed', 
        message: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
```

**Steps:**
1. **Click "Deploy a new function"** in Supabase dashboard
2. **Function name:** `assess-writing`
3. **Copy the above code** into the editor
4. **Click "Deploy Function"**

This simplified version removes all TypeScript syntax and uses plain JavaScript that should deploy without parsing errors.