import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, CreditCard, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TestProduct } from '@/context/ProductContext';
import { redirectToCheckout } from '@/services/stripeService';
import { isStripeConfigured } from '@/config/stripeConfig';
import { toast } from '@/components/ui/sonner';

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
  const [isLoading, setIsLoading] = useState(false);

  const handlePurchase = async () => {
    // Debug logging
    console.log('🔍 Purchase Debug:', {
      isStripeConfigured: isStripeConfigured(),
      publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
      productId: product.id
    });

    // Check if Stripe is configured
    if (!isStripeConfigured()) {
      console.error('❌ Stripe not configured:', {
        publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
        hasKey: !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
        isPlaceholder: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY === 'pk_test_your_publishable_key_here'
      });
      toast.error('Payment system is being set up. Please try again later.');
      return;
    }

    // Use custom purchase handler if provided
    if (onPurchase) {
      onPurchase(product.id);
      return;
    }

    // Start checkout process
    setIsLoading(true);
    try {
      await redirectToCheckout(product.id);
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Failed to start checkout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    "Comprehensive diagnostic test",
    "Personalised skill drills for targeted practice",
    "5 full-length practice tests", 
    "Detailed performance insights and analytics",
    "Unlimited access"
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
            <p className="text-sm text-edu-navy/60">One-time payment • Unlimited access</p>
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
            disabled={isLoading}
            className="w-full bg-edu-teal hover:bg-edu-teal/90 text-white font-semibold py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                Purchase Access
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
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