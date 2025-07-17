// Test Edge Function to check if Claude API key is working within Supabase environment

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Check if Claude API key is available
    const claudeApiKey = Deno.env.get('CLAUDE_API_KEY')
    console.log('🔍 Claude API Key available:', !!claudeApiKey)
    console.log('🔍 Claude API Key prefix:', claudeApiKey?.substring(0, 20) + '...')

    if (!claudeApiKey) {
      return new Response(
        JSON.stringify({ 
          error: 'Claude API key not found in environment',
          available_vars: Object.keys(Deno.env.toObject())
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Test Claude API call
    console.log('🤖 Testing Claude API call...')
    
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 50,
        temperature: 0.1,
        messages: [{
          role: 'user',
          content: 'Respond with "Edge Function Claude API test successful"'
        }]
      })
    })

    console.log('📡 Claude API Response Status:', claudeResponse.status)

    if (!claudeResponse.ok) {
      const errorData = await claudeResponse.text()
      console.error('❌ Claude API Error:', errorData)
      
      return new Response(
        JSON.stringify({ 
          error: `Claude API error (${claudeResponse.status})`,
          details: errorData
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const claudeData = await claudeResponse.json()
    console.log('✅ Claude API Success')

    return new Response(
      JSON.stringify({
        success: true,
        claudeResponse: claudeData,
        message: 'Claude API working correctly in Edge Function'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('❌ Error in test function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Test function failed', 
        message: error.message,
        stack: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})