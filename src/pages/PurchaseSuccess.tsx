import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useProduct } from '@/context/ProductContext';
import { Badge } from '@/components/ui/badge';

const PurchaseSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { allProducts } = useProduct();
  const [isLoading, setIsLoading] = useState(true);
  
  const productId = searchParams.get('product');
  const sessionId = searchParams.get('session_id');
  
  const product = allProducts.find(p => p.id === productId);

  useEffect(() => {
    // Simulate checking payment status
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    if (productId) {
      // Navigate to the purchased product
      navigate(`/dashboard?product=${productId}`);
    } else {
      // Navigate to dashboard
      navigate('/dashboard');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-edu-light-blue flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-edu-teal" />
            <h2 className="text-xl font-semibold text-edu-navy mb-2">
              Processing your purchase...
            </h2>
            <p className="text-edu-navy/70">
              Please wait while we confirm your payment.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-edu-light-blue flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-edu-navy">
            Purchase Successful!
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div>
            <p className="text-edu-navy/70 mb-4">
              Thank you for your purchase! You now have full access to:
            </p>
            
            {product && (
              <div className="bg-edu-light-blue/50 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-edu-navy mb-2">
                  {product.name}
                </h3>
                <p className="text-sm text-edu-navy/70 mb-3">
                  {product.description}
                </p>
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  Full Access Granted
                </Badge>
              </div>
            )}
          </div>

          <div className="text-left space-y-2">
            <h4 className="font-semibold text-edu-navy">What's included:</h4>
            <ul className="text-sm text-edu-navy/80 space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                Comprehensive diagnostic tests
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                Personalized skill drills
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                Full-length practice tests
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                Detailed performance insights
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                12 months access
              </li>
            </ul>
          </div>

          <div className="border-t border-edu-navy/20 pt-4">
            <p className="text-xs text-edu-navy/50 mb-4">
              A receipt has been sent to your email address.
            </p>
            
            <Button 
              onClick={handleContinue}
              className="w-full bg-edu-teal hover:bg-edu-teal/90 text-white font-semibold"
              size="lg"
            >
              Start Learning
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseSuccess;