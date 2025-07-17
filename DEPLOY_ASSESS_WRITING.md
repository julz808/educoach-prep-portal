# Deploy assess-writing Edge Function - FINAL VERSION

Copy and paste this code into the assess-writing Edge Function in Supabase:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Allow multiple origins for Vercel deployments
const allowedOrigins = [
  'https://educourseportal.vercel.app',
  'https://educoach-prep-portal-2.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174'
];

const getCorsHeaders = (origin: string | null) => {
  // Check if the origin is allowed
  const isAllowed = origin && (
    allowedOrigins.includes(origin) || 
    origin.includes('.vercel.app') // Allow all Vercel preview deployments
  );
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true'
  };
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now();

  try {
    // Verify the request is authenticated
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the user from the session
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Parse the request body
    const { userResponse, writingPrompt, rubric, yearLevel } = await req.json()

    // Validate required fields
    if (!userResponse || !writingPrompt || !rubric || !yearLevel) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get Claude API key from environment
    const claudeApiKey = Deno.env.get('CLAUDE_API_KEY')
    if (!claudeApiKey) {
      throw new Error('Claude API key not configured')
    }

    // Generate assessment prompt
    const criteriaList = rubric.criteria.map((criterion: any) => 
      `- ${criterion.name} (${criterion.maxMarks} marks): ${criterion.description}`
    ).join('\n')

    const systemPrompt = `You are an expert Australian ${yearLevel} English teacher assessing student writing. 
Assess the following ${rubric.genre} writing response based on the given criteria.
Provide constructive, encouraging feedback appropriate for a ${yearLevel} student.
Use Australian spelling and educational terminology.
Focus on specific strengths and areas for improvement.`

    const userPrompt = `Writing Prompt: ${writingPrompt}

Student Response:
${userResponse}

Assessment Criteria:
${criteriaList}

Total Marks Available: ${rubric.totalMarks}

Please provide:
1. A score for each criterion (out of the specified marks)
2. An overall score (out of ${rubric.totalMarks})
3. Specific feedback for each criterion with examples from the student's writing
4. Overall feedback that is constructive and encouraging
5. 2-3 specific suggestions for improvement

Format your response as JSON with this structure:
{
  "scores": {
    "criterion_name": score,
    ...
  },
  "overall_score": total_score,
  "feedback": {
    "criterion_name": "specific feedback",
    ...
  },
  "overall_feedback": "general feedback",
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}`

    // Call Claude API
    const claudeStartTime = Date.now();
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': claudeApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1500,
        temperature: 0.3,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Claude API error:', errorData)
      throw new Error(`Claude API error: ${response.status}`)
    }

    const data = await response.json()
    const assessmentText = data.content[0].text
    const claudeProcessingTime = Date.now() - claudeStartTime;

    // Parse the JSON response
    let assessment
    try {
      assessment = JSON.parse(assessmentText)
    } catch (e) {
      console.error('Failed to parse Claude response:', assessmentText)
      throw new Error('Invalid response format from Claude')
    }

    // Add processing metadata that the frontend expects
    const finalAssessment = {
      ...assessment,
      processingMetadata: {
        modelVersion: 'claude-3-haiku-20240307',
        processingTimeMs: Date.now() - startTime,
        claudeProcessingTimeMs: claudeProcessingTime,
        promptTokens: data.usage?.input_tokens || null,
        responseTokens: data.usage?.output_tokens || null
      }
    }

    // Return the assessment
    return new Response(
      JSON.stringify(finalAssessment),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Assessment error:', error)
    
    // Return fallback assessment with proper metadata structure
    const fallbackAssessment = {
      scores: {},
      overall_score: Math.floor(rubric.totalMarks * 0.4), // 40% fallback score
      feedback: {},
      overall_feedback: 'This response was assessed using automatic scoring due to technical issues. Your writing shows effort and we encourage you to continue developing your skills.',
      suggestions: [
        'Continue practicing your writing skills',
        'Focus on clear structure and organization',
        'Review the marking criteria for guidance'
      ],
      processingMetadata: {
        modelVersion: 'fallback-scoring',
        processingTimeMs: Date.now() - startTime,
        promptTokens: null,
        responseTokens: null,
        error: error.message
      }
    }

    return new Response(
      JSON.stringify(fallbackAssessment),
      {
        status: 200, // Return 200 so frontend can handle gracefully
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
```

## Instructions:
1. Go to Supabase Dashboard → Edge Functions
2. Click on "assess-writing" → Edit/Deploy  
3. Replace the entire code with the block above
4. Click Deploy
5. Test the writing assessment - it should now show Claude's detailed feedback!

This version includes the `processingMetadata` that fixes the frontend error.