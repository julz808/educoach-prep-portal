import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, CreditCard, CheckCircle, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TestProduct } from '@/context/ProductContext';

interface PaywallComponentProps {
  product: TestProduct;
  onPurchase?: (productId: string) => void;
  className?: string;
}

export const PaywallComponent: React.FC<PaywallComponentProps> = ({ 
  product, 
  onPurchase,
  className = "" 
}) => {
  const handlePurchase = () => {
    if (onPurchase) {
      onPurchase(product.id);
    } else {
      // Fallback to showing purchase information
      console.log('Purchase clicked for product:', product.id);
      // TODO: Implement Stripe Checkout integration
    }
  };

  const features = [
    "Comprehensive diagnostic tests",
    "Personalized skill drills",
    "Full-length practice tests", 
    "Detailed performance insights",
    "AI-powered feedback",
    "12 months access"
  ];

  return (
    <div className={`flex items-center justify-center min-h-[400px] p-4 ${className}`}>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-edu-teal/10 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-edu-teal" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-edu-navy">
            Unlock {product.name}
          </CardTitle>
          <p className="text-edu-navy/70 mt-2">
            {product.description}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Price Display */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-3xl font-bold text-edu-navy">$199</span>
              <Badge variant="secondary" className="bg-edu-coral/20 text-edu-coral">
                AUD
              </Badge>
            </div>
            <p className="text-sm text-edu-navy/60">One-time payment • 12 months access</p>
          </div>

          {/* Features List */}
          <div className="space-y-3">
            <h4 className="font-semibold text-edu-navy">What's included:</h4>
            <ul className="space-y-2">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-edu-navy/80">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Purchase Button */}
          <Button 
            onClick={handlePurchase}
            className="w-full bg-edu-teal hover:bg-edu-teal/90 text-white font-semibold py-3"
            size="lg"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Purchase Access
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          {/* Security Note */}
          <div className="text-center">
            <p className="text-xs text-edu-navy/50">
              Secure payment processed by Stripe
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaywallComponent;