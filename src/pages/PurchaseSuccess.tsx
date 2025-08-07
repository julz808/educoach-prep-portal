import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, Loader2, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

const PurchaseSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccount, setHasAccount] = useState(false);

  const product = searchParams.get('product');

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        // Check if user is already logged in
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // User is logged in, redirect to dashboard
          setHasAccount(true);
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          // Check if account was created but user isn't logged in
          // This happens in guest checkout flow
          setHasAccount(false);
          
          // Get the purchased course from localStorage if available
          const purchasedCourse = localStorage.getItem('purchasedCourse');
          if (purchasedCourse) {
            localStorage.removeItem('purchasedCourse');
          }
        }
      } catch (error) {
        console.error('Error checking user status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserStatus();
  }, [navigate]);

  const handleSetupPassword = () => {
    // Store the product info and redirect to auth
    if (product) {
      localStorage.setItem('setupProduct', product);
    }
    navigate('/auth?mode=setup');
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  const getProductName = (productSlug: string | null) => {
    const productNames: Record<string, string> = {
      'year-5-naplan': 'Year 5 NAPLAN',
      'year-7-naplan': 'Year 7 NAPLAN', 
      'edutest-scholarship': 'EduTest Scholarship',
      'acer-scholarship': 'ACER Scholarship',
      'nsw-selective': 'NSW Selective Entry',
      'vic-selective': 'VIC Selective Entry'
    };
    
    return productNames[productSlug || ''] || 'Your Test Prep Course';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E6F7F5] to-white">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#4ECDC4]" />
          <p className="text-gray-600">Processing your purchase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E6F7F5] to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-[#2C3E50]">
            Purchase Successful! 🎉
          </CardTitle>
          <CardDescription className="text-[#6B7280]">
            Thank you for purchasing {getProductName(product)}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {hasAccount ? (
            // User already has an account and is logged in
            <>
              <div className="text-center space-y-4">
                <p className="text-[#6B7280]">
                  You're all set! Redirecting you to your dashboard where you can access your course.
                </p>
                <div className="flex items-center justify-center space-x-2 text-[#4ECDC4]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Taking you to your dashboard...</span>
                </div>
              </div>
              
              <Button 
                onClick={handleGoToDashboard}
                className="w-full bg-[#4ECDC4] hover:bg-[#4ECDC4]/90 text-white"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          ) : (
            // New user - account created but needs to set password
            <>
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center space-x-2 text-[#6366F1]">
                  <Mail className="h-5 w-5" />
                  <span className="font-medium">Check Your Email</span>
                </div>
                
                <p className="text-[#6B7280]">
                  We've created your account and you should receive a welcome email shortly with instructions to set up your password.
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Next steps:</strong>
                    <br />1. Check your email for the welcome message
                    <br />2. Click the setup link to create your password  
                    <br />3. Access your course materials immediately
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={handleSetupPassword}
                  className="w-full bg-[#6366F1] hover:bg-[#6366F1]/90 text-white"
                >
                  Set Up Password Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                
                <p className="text-xs text-center text-[#6B7280]">
                  Didn't receive an email? Check your spam folder or set up your password above.
                </p>
              </div>
            </>
          )}

          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-center text-[#9CA3AF]">
              Questions? Contact us at support@educourse.com.au
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseSuccess;