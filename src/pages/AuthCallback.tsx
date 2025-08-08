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