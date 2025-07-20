import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getStripePublishableKey, isStripeConfigured } from '@/config/stripeConfig';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/integrations/supabase/client';

const StripeTest = () => {
  const [testResults, setTestResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = async () => {
    const publishableKey = getStripePublishableKey();
    const results = {
      frontend: {
        hasPublishableKey: !!publishableKey,
        keyPrefix: publishableKey?.substring(0, 8),
        keyLength: publishableKey?.length,
        isLiveMode: publishableKey?.startsWith('pk_live_'),
        isConfigured: isStripeConfigured()
      },
      environment: {
        allEnvVars: Object.keys(import.meta.env).filter(key => key.includes('STRIPE')),
        priceIds: {
          edutest: import.meta.env.VITE_STRIPE_EDUTEST_PRICE_ID,
          year5Naplan: import.meta.env.VITE_STRIPE_YEAR5_NAPLAN_PRICE_ID,
          year7Naplan: import.meta.env.VITE_STRIPE_YEAR7_NAPLAN_PRICE_ID,
          acer: import.meta.env.VITE_STRIPE_ACER_PRICE_ID,
          nswSelective: import.meta.env.VITE_STRIPE_NSW_SELECTIVE_PRICE_ID,
          vicSelective: import.meta.env.VITE_STRIPE_VIC_SELECTIVE_PRICE_ID
        }
      }
    };
    setTestResults(results);
  };

  const testStripeLoad = async () => {
    setLoading(true);
    try {
      const publishableKey = getStripePublishableKey();
      console.log('Loading Stripe with key:', publishableKey?.substring(0, 20) + '...');
      
      const stripe = await loadStripe(publishableKey);
      
      setTestResults(prev => ({
        ...prev,
        stripeLoad: {
          success: !!stripe,
          stripeInstance: !!stripe,
          error: null
        }
      }));
    } catch (error: any) {
      setTestResults(prev => ({
        ...prev,
        stripeLoad: {
          success: false,
          error: error.message
        }
      }));
    }
    setLoading(false);
  };

  const testEdgeFunction = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const response = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId: 'price_test',
          productId: 'test-product',
          userId: user?.id || 'test-user',
          userEmail: user?.email || 'test@example.com',
          successUrl: window.location.origin,
          cancelUrl: window.location.origin
        }
      });

      setTestResults(prev => ({
        ...prev,
        edgeFunction: {
          response: response,
          hasError: !!response.error,
          error: response.error?.message
        }
      }));
    } catch (error: any) {
      setTestResults(prev => ({
        ...prev,
        edgeFunction: {
          error: error.message
        }
      }));
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Stripe Configuration Test</CardTitle>
          <CardDescription>Debug Stripe integration issues - Updated</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Frontend Configuration</h3>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(testResults.frontend, null, 2)}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Environment Variables</h3>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(testResults.environment, null, 2)}
            </pre>
          </div>

          <div className="space-y-2">
            <Button onClick={testStripeLoad} disabled={loading}>
              Test Stripe.js Load
            </Button>
            {testResults.stripeLoad && (
              <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                {JSON.stringify(testResults.stripeLoad, null, 2)}
              </pre>
            )}
          </div>

          <div className="space-y-2">
            <Button onClick={testEdgeFunction} disabled={loading}>
              Test Edge Function
            </Button>
            {testResults.edgeFunction && (
              <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                {JSON.stringify(testResults.edgeFunction, null, 2)}
              </pre>
            )}
          </div>

          <div className="bg-yellow-50 p-4 rounded">
            <p className="text-sm font-semibold">Quick Fixes:</p>
            <ul className="text-sm mt-2 space-y-1">
              <li>1. Ensure VITE_STRIPE_PUBLISHABLE_KEY is set in Vercel</li>
              <li>2. Key should start with pk_live_ for production</li>
              <li>3. All price IDs should be from LIVE mode products</li>
              <li>4. Publishable key and secret key must be from same account</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StripeTest;