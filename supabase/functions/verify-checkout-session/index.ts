import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@17.0.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: 'Missing Stripe configuration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' })

    const { sessionId } = await req.json()
    if (!sessionId || typeof sessionId !== 'string' || !sessionId.startsWith('cs_')) {
      return new Response(
        JSON.stringify({ verified: false, reason: 'invalid_session_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId)

    const isPaid = session.payment_status === 'paid'
    const productId = session.metadata?.productId || null
    const amountTotal = session.amount_total ?? 0
    const currency = session.currency || 'aud'
    const customerEmail = session.customer_details?.email || session.customer_email || null

    return new Response(
      JSON.stringify({
        verified: isPaid,
        sessionId: session.id,
        paymentStatus: session.payment_status,
        productId,
        amount: amountTotal / 100,
        currency: currency.toUpperCase(),
        customerEmail,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ verified: false, reason: 'lookup_failed', error: error.message }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
