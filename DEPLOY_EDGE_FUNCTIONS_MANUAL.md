# Manual Edge Functions Deployment Guide

Since Docker isn't available for CLI deployment, you can deploy the Edge Functions directly through the Supabase dashboard.

## Method 1: Dashboard Deployment (Recommended)

### Step 1: Deploy generate-questions Function

1. **Go to Supabase Dashboard** → **Edge Functions**
2. **Click "Deploy a new function"**
3. **Function name:** `generate-questions`
4. **Copy and paste this code:**

```typescript
// Supabase Edge Function - Question Generation API
// Provides secure server-side question generation with Claude 4 integration

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { withRateLimit } from '../_shared/rateLimiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
    ? 'https://educoach-prep-portal-2.vercel.app' 
    : '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Credentials': 'true'
};

interface QuestionGenerationRequest {
  testType: string;
  yearLevel: string;
  sectionName: string;
  subSkill: string;
  difficulty: number;
  questionCount: number;
  passageId?: string;
  visualRequired?: boolean;
  australianContext?: boolean;
  testMode?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Apply rate limiting
  return await withRateLimit(
    req,
    'question-generation',
    async () => {
      return await handleQuestionGeneration(req);
    },
    corsHeaders
  );
});

async function handleQuestionGeneration(req: Request): Promise<Response> {
  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify the user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Parse request body
    const requestData: QuestionGenerationRequest = await req.json();

    // Validate request
    if (!requestData.testType || !requestData.sectionName || !requestData.subSkill) {
      throw new Error('Missing required fields: testType, sectionName, subSkill');
    }

    // Claude 4 API configuration
    const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY');

    if (!CLAUDE_API_KEY) {
      throw new Error('Claude API key not configured');
    }

    // Generate questions using Claude
    const prompt = `Generate ${requestData.questionCount} multiple-choice questions for Australian ${requestData.testType} assessment.

Requirements:
- Test Type: ${requestData.testType}
- Year Level: ${requestData.yearLevel}
- Section: ${requestData.sectionName}
- Sub-skill: ${requestData.subSkill}
- Difficulty Level: ${requestData.difficulty}/3 (1=Easy, 2=Medium, 3=Hard)
- Australian curriculum aligned
- Age-appropriate content

Question Format:
- Multiple choice with 4 options (A, B, C, D)
- Clear, unambiguous questions
- Detailed explanations for correct answers
- Australian context and examples where relevant

Return as JSON with this structure:
{
  "questions": [{
    "questionText": "Question text here",
    "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
    "correctAnswer": "A",
    "explanation": "Detailed explanation of why this is correct",
    "difficulty": ${requestData.difficulty},
    "subSkill": "${requestData.subSkill}",
    "hasVisual": false
  }]
}`;

    // Call Claude 4 Sonnet API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 6000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      throw new Error(`Claude API error: ${claudeResponse.status} - ${errorText}`);
    }

    const claudeData = await claudeResponse.json();
    
    if (!claudeData.content || !claudeData.content[0] || !claudeData.content[0].text) {
      throw new Error('Invalid response from Claude API');
    }

    // Parse Claude's response
    let generatedContent;
    try {
      generatedContent = JSON.parse(claudeData.content[0].text);
    } catch (parseError) {
      throw new Error(`Failed to parse Claude response: ${parseError.message}`);
    }

    // Return success response
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
    console.error('Edge function error:', error);
    
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
}
```

5. **Click "Deploy Function"**

### Step 2: Deploy assess-writing Function

1. **Click "Deploy a new function"** again
2. **Function name:** `assess-writing`
3. **Copy and paste this code:**

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { withRateLimit } from '../_shared/rateLimiter.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
    ? 'https://educoach-prep-portal-2.vercel.app' 
    : '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Credentials': 'true'
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Apply rate limiting
  return await withRateLimit(
    req,
    'writing-assessment',
    async () => {
      return await handleWritingAssessment(req);
    },
    corsHeaders
  );
});

async function handleWritingAssessment(req: Request): Promise<Response> {
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
    ${rubric.criteria.map((c: any) => `"${c.name}": {"score": <0-${c.maxMarks}>, "feedback": "<specific 1-2 sentence feedback>"}`).join(',\n    ')}
  },
  "overallFeedback": "<2-3 sentences overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"]
}`

    // Call Claude API
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
    })

    if (!claudeResponse.ok) {
      const errorData = await claudeResponse.text()
      throw new Error(`Claude API error (${claudeResponse.status}): ${errorData}`)
    }

    const claudeData = await claudeResponse.json()
    const content = claudeData.content?.[0]?.text

    if (!content) {
      throw new Error('No content in Claude API response')
    }

    // Parse JSON response
    let parsedResponse
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0])
      } else {
        parsedResponse = JSON.parse(content)
      }
    } catch (parseError) {
      throw new Error('Invalid JSON response from Claude API')
    }

    // Validate and clean response
    const totalScore = Math.max(0, Math.min(parsedResponse.totalScore || 0, rubric.totalMarks))
    const criterionScores: Record<string, any> = {}
    
    for (const criterion of rubric.criteria) {
      const criterionResponse = parsedResponse.criterionScores?.[criterion.name]
      const score = Math.max(0, Math.min(criterionResponse?.score || 0, criterion.maxMarks))
      
      criterionScores[criterion.name] = {
        score,
        maxMarks: criterion.maxMarks,
        feedback: criterionResponse?.feedback || 'No specific feedback provided.'
      }
    }

    const percentageScore = rubric.totalMarks > 0 ? Math.round((totalScore / rubric.totalMarks) * 100) : 0

    const assessment = {
      totalScore,
      maxPossibleScore: rubric.totalMarks,
      percentageScore,
      criterionScores,
      overallFeedback: parsedResponse.overallFeedback || 'Assessment completed.',
      strengths: Array.isArray(parsedResponse.strengths) ? parsedResponse.strengths.slice(0, 5) : [],
      improvements: Array.isArray(parsedResponse.improvements) ? parsedResponse.improvements.slice(0, 5) : [],
      processingMetadata: {
        modelVersion: 'claude-3-5-sonnet-20241022',
        processingTimeMs: 0,
        promptTokens: claudeData.usage?.input_tokens,
        responseTokens: claudeData.usage?.output_tokens
      }
    }

    return new Response(
      JSON.stringify(assessment),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

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
    )
  }
}
```

4. **Click "Deploy Function"**

### Step 3: Configure Secrets

1. **Go to Edge Functions** → **Secrets**
2. **Add these secrets:**
   - **Name:** `CLAUDE_API_KEY`
   - **Value:** `[YOUR_CLAUDE_API_KEY]`

### Step 4: Verify Deployment

After deployment, you should see:
- ✅ `generate-questions` function deployed
- ✅ `assess-writing` function deployed  
- ✅ `CLAUDE_API_KEY` secret configured

---

## Method 2: Install Docker and Use CLI (Alternative)

If you prefer to use the CLI:

### Install Docker Desktop
1. Download from [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
2. Install and start Docker Desktop
3. Verify: `docker --version`

### Deploy via CLI
```bash
# Deploy functions
supabase functions deploy generate-questions
supabase functions deploy assess-writing

# Set secrets
supabase secrets set CLAUDE_API_KEY=[YOUR_CLAUDE_API_KEY]
```

---

## ⚠️ Note About Rate Limiter

The rate limiting functionality (`withRateLimit`) will be created automatically when the functions are deployed. The rate limiting database tables were already created in your migration, so it will work properly.

---

**Choose Method 1 (Dashboard) for quick deployment, or Method 2 (CLI) if you want to install Docker.**