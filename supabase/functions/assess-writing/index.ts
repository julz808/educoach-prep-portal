import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

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

ASSESSMENT GUIDELINES:
- Apply realistic scoring for ${yearLevel} students under ${rubric.timeMinutes}-minute time pressure
- Consider age-appropriate expectations for vocabulary, complexity, and technical accuracy
- Be fair but maintain Australian educational standards
- Provide constructive, specific feedback for improvement
- Score whole numbers only (no decimals)
- Consider the time constraints when evaluating - don't expect perfection in short timeframes

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
    console.log('🤖 Calling Claude API...')
    
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
      // Extract JSON from response (Claude sometimes adds extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0])
      } else {
        parsedResponse = JSON.parse(content)
      }
    } catch (parseError) {
      console.error('Error parsing Claude response:', content)
      throw new Error('Invalid JSON response from Claude API')
    }

    // Validate and clean response
    const totalScore = Math.max(0, Math.min(parsedResponse.totalScore || 0, rubric.totalMarks))
    const criterionScores: Record<string, any> = {}
    
    // Validate each criterion score
    for (const criterion of rubric.criteria) {
      const criterionResponse = parsedResponse.criterionScores?.[criterion.name]
      const score = Math.max(0, Math.min(criterionResponse?.score || 0, criterion.maxMarks))
      
      criterionScores[criterion.name] = {
        score,
        maxMarks: criterion.maxMarks,
        feedback: criterionResponse?.feedback || 'No specific feedback provided.'
      }
    }

    // Calculate percentage
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

    console.log('✅ Assessment completed successfully')

    return new Response(
      JSON.stringify(assessment),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('❌ Error in writing assessment:', error)
    
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
})