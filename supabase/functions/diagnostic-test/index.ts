// Supabase Edge Function - Diagnostic Test Generation
// Generates personalized diagnostic tests based on user progress

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const { productType } = await req.json();

    if (!productType) {
      throw new Error('Product type is required');
    }

    // Call the generate_diagnostic_test function
    const { data: diagnosticQuestions, error } = await supabase
      .rpc('generate_diagnostic_test', {
        p_user_id: user.id,
        p_product_type: productType
      });

    if (error) {
      throw new Error(`Failed to generate diagnostic test: ${error.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          questions: diagnosticQuestions || [],
          testMode: 'diagnostic',
          productType,
          generatedAt: new Date().toISOString()
        }
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