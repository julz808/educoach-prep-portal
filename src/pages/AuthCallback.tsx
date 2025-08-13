import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (session) {
          // Check if this is a password reset
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const type = hashParams.get('type');
          
          if (type === 'recovery') {
            // Redirect to password reset page
            navigate('/auth/reset-password');
          } else {
            // Check for and process any pending purchases for this user
            try {
              console.log('Checking for pending purchases for user:', session.user.email);
              const { data: pendingPurchases, error: pendingError } = await supabase
                .rpc('get_user_pending_purchases');
              
              if (pendingError) {
                console.error('Error fetching pending purchases:', pendingError);
              } else if (pendingPurchases && pendingPurchases.length > 0) {
                console.log('Found pending purchases:', pendingPurchases.length);
                
                // Process each pending purchase
                for (const purchase of pendingPurchases) {
                  console.log('Processing pending purchase:', purchase.stripe_session_id);
                  
                  const { data: processResult, error: processError } = await supabase
                    .rpc('process_pending_purchase', {
                      p_stripe_session_id: purchase.stripe_session_id
                    });
                  
                  if (processError) {
                    console.error('Error processing pending purchase:', processError);
                  } else if (processResult && processResult.success) {
                    console.log('Successfully processed purchase:', processResult);
                    toast.success(`Access granted to ${processResult.product_type}!`);
                  } else {
                    console.error('Failed to process purchase:', processResult);
                  }
                }
              }
            } catch (error) {
              console.error('Error checking pending purchases:', error);
            }
            
            // Regular sign in/up - redirect to dashboard
            toast.success('Successfully authenticated!');
            navigate('/dashboard');
          }
        } else {
          toast.error('Authentication failed. Please try again.');
          navigate('/auth');
        }
      } catch (error: any) {
        console.error('Error in auth callback:', error);
        toast.error(error.message || 'Authentication failed. Please try again.');
        navigate('/auth');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-edu-light-blue p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Processing...</CardTitle>
          <CardDescription className="text-center">
            Please wait while we complete your authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthCallback; 