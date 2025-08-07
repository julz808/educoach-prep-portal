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
    
    // Try to get email from URL parameters (passed from webhook redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    
    if (email) {
      // Store email for the register flow and pass it via URL
      localStorage.setItem('purchaseEmail', email);
      navigate(`/auth?mode=register&email=${encodeURIComponent(email)}`);
    } else {
      navigate('/auth?mode=register');
    }
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
    <div className="min-h-screen bg-gradient-to-br from-[#E6F7F5] via-[#F8F9FA] to-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Card className="shadow-2xl border-0 overflow-hidden">
          {/* Success Header */}
          <div className="bg-gradient-to-r from-[#4ECDC4] to-[#6366F1] p-8 text-center text-white">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
            <p className="text-lg text-white/90">
              Welcome to {getProductName(product)}
            </p>
          </div>

          <CardContent className="p-8 space-y-6">
            {hasAccount ? (
              // Existing user flow
              <>
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-[#4ECDC4]/10 rounded-full flex items-center justify-center mx-auto">
                    <ArrowRight className="h-8 w-8 text-[#4ECDC4]" />
                  </div>
                  <h2 className="text-xl font-semibold text-[#2C3E50]">You're all set!</h2>
                  <p className="text-[#6B7280] leading-relaxed">
                    Taking you to your dashboard where you can access your course materials immediately.
                  </p>
                  <div className="flex items-center justify-center space-x-2 text-[#4ECDC4]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-medium">Redirecting to dashboard...</span>
                  </div>
                </div>
                
                <Button 
                  onClick={handleGoToDashboard}
                  size="lg"
                  className="w-full bg-[#4ECDC4] hover:bg-[#4ECDC4]/90 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </>
            ) : (
              // New user flow
              <>
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 bg-[#6366F1]/10 rounded-full flex items-center justify-center mx-auto">
                    <Mail className="h-8 w-8 text-[#6366F1]" />
                  </div>
                  
                  <div className="space-y-3">
                    <h2 className="text-xl font-semibold text-[#2C3E50]">Account Created Successfully!</h2>
                    <p className="text-[#6B7280] leading-relaxed">
                      Your account has been created automatically. Follow these simple steps to get started:
                    </p>
                  </div>
                  
                  {/* Steps */}
                  <div className="bg-gradient-to-br from-[#6366F1]/5 to-[#4ECDC4]/5 rounded-2xl p-6 space-y-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-[#6366F1] text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</div>
                      <div className="text-left">
                        <p className="font-semibold text-[#2C3E50]">Complete your account setup</p>
                        <p className="text-sm text-[#6B7280]">Fill in your details and create your secure password</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-[#4ECDC4] text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</div>
                      <div className="text-left">
                        <p className="font-semibold text-[#2C3E50]">Access your course</p>
                        <p className="text-sm text-[#6B7280]">Start with the diagnostic test and targeted practice</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-[#FF6B6B] text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</div>
                      <div className="text-left">
                        <p className="font-semibold text-[#2C3E50]">Track your progress</p>
                        <p className="text-sm text-[#6B7280]">Monitor improvements with detailed analytics</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Button 
                    onClick={handleSetupPassword}
                    size="lg"
                    className="w-full bg-gradient-to-r from-[#6366F1] to-[#4ECDC4] hover:from-[#5b5ef1] hover:to-[#45c4bc] text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Complete Account Setup & Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  
                  <div className="text-center">
                    <p className="text-xs text-[#9CA3AF] leading-relaxed">
                      A welcome email has been sent to your inbox with your login details.<br/>
                      Check your spam folder if you don't see it within a few minutes.
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Footer */}
            <div className="pt-6 border-t border-gray-100 text-center">
              <div className="flex items-center justify-center space-x-4 text-xs text-[#9CA3AF]">
                <span>🔒 Secure Payment</span>
                <span>•</span>
                <span>📧 support@educourse.com.au</span>
                <span>•</span>
                <span>💬 Live Chat Support</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PurchaseSuccess;