# Deployment Notes

## Edge Functions Deployment

### Stripe Webhook V2
The `stripe-webhook-v2` function must be deployed with the `--no-verify-jwt` flag to allow external webhook calls from Stripe without authentication headers.

**Correct deployment command:**
```bash
npx supabase functions deploy stripe-webhook-v2 --no-verify-jwt
```

**Important:** If the function was previously deployed without this flag, you must delete and redeploy:
```bash
npx supabase functions delete stripe-webhook-v2
npx supabase functions deploy stripe-webhook-v2 --no-verify-jwt
```

This ensures Flow B (authenticated user purchases) works correctly by allowing Stripe to call the webhook endpoint without authorization headers.

## Environment Variables Required

The following secrets must be configured in Supabase:
- `STRIPE_WEBHOOK_SECRET` - The actual webhook secret from Stripe dashboard
- `STRIPE_SECRET_KEY` - Stripe secret key
- `SUPABASE_SERVICE_ROLE_KEY` - For webhook database access
- `SUPABASE_URL` - Supabase project URL