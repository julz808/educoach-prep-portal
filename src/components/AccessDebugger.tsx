import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { useProduct } from '@/context/ProductContext';
import { UserMetadataService } from '@/services/userMetadataService';
import { supabase } from '@/integrations/supabase/client';

interface DebugInfo {
  user: any;
  selectedProduct: string;
  currentProduct: any;
  productAccess: any;
  hasAccessToCurrentProduct: boolean;
  directAccessCheck?: boolean;
  userProducts?: any[];
  error?: string;
}

export const AccessDebugger: React.FC = () => {
  const { user } = useAuth();
  const { selectedProduct, currentProduct, productAccess, hasAccessToCurrentProduct } = useProduct();
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const runDebugCheck = async () => {
    if (!user) {
      setDebugInfo({ error: 'No user found', user: null, selectedProduct: '', currentProduct: null, productAccess: null, hasAccessToCurrentProduct: false });
      return;
    }

    setIsChecking(true);
    
    try {
      // Get current auth state
      const { data: { session } } = await supabase.auth.getSession();
      
      // Direct access check
      let directAccessCheck = false;
      let userProducts = [];
      
      if (currentProduct?.dbProductType) {
        directAccessCheck = await UserMetadataService.hasProductAccess(user.id, currentProduct.dbProductType);
        userProducts = await UserMetadataService.getUserProducts(user.id);
      }

      setDebugInfo({
        user: {
          id: user.id,
          email: user.email,
          hasSession: !!session,
          sessionExpiry: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'No expiry'
        },
        selectedProduct,
        currentProduct: currentProduct ? {
          id: currentProduct.id,
          name: currentProduct.name,
          dbProductType: currentProduct.dbProductType
        } : null,
        productAccess,
        hasAccessToCurrentProduct,
        directAccessCheck,
        userProducts
      });
      
    } catch (error: any) {
      setDebugInfo({
        error: error.message,
        user,
        selectedProduct,
        currentProduct,
        productAccess,
        hasAccessToCurrentProduct
      });
    } finally {
      setIsChecking(false);
    }
  };

  const refreshContext = async () => {
    // Force ProductContext to re-check access
    window.location.reload();
  };

  const switchToVicSelective = () => {
    console.log('🔄 Manually switching to VIC Selective');
    // This should trigger the ProductContext to switch products
    localStorage.setItem('selectedProduct', 'vic-selective');
    window.location.reload();
  };

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-orange-800 flex items-center gap-2">
          🐛 Access Debugger
          <Badge variant="secondary">Development Tool</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={runDebugCheck} 
            disabled={isChecking}
            variant="outline"
          >
            {isChecking ? 'Checking...' : 'Run Debug Check'}
          </Button>
          <Button 
            onClick={refreshContext}
            variant="outline"
          >
            Refresh Context
          </Button>
          <Button 
            onClick={switchToVicSelective}
            variant="default"
            className="bg-green-600 hover:bg-green-700"
          >
            Switch to VIC Selective
          </Button>
        </div>

        {debugInfo && (
          <div className="space-y-4 text-sm">
            {debugInfo.error && (
              <div className="p-4 bg-red-100 border border-red-200 rounded text-red-800">
                <strong>Error:</strong> {debugInfo.error}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white border rounded">
                <h3 className="font-semibold text-gray-800 mb-2">User Info</h3>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(debugInfo.user, null, 2)}
                </pre>
              </div>
              
              <div className="p-4 bg-white border rounded">
                <h3 className="font-semibold text-gray-800 mb-2">Product Context</h3>
                <div className="space-y-2 text-xs">
                  <div><strong>Selected Product:</strong> {debugInfo.selectedProduct}</div>
                  <div><strong>Current Product:</strong></div>
                  <pre className="overflow-auto">{JSON.stringify(debugInfo.currentProduct, null, 2)}</pre>
                </div>
              </div>
              
              <div className="p-4 bg-white border rounded">
                <h3 className="font-semibold text-gray-800 mb-2">Access Status</h3>
                <div className="space-y-2 text-xs">
                  <div>
                    <strong>Context hasAccess:</strong>{' '}
                    <Badge variant={debugInfo.hasAccessToCurrentProduct ? 'default' : 'destructive'}>
                      {debugInfo.hasAccessToCurrentProduct ? 'TRUE' : 'FALSE'}
                    </Badge>
                  </div>
                  <div>
                    <strong>Direct Check:</strong>{' '}
                    <Badge variant={debugInfo.directAccessCheck ? 'default' : 'destructive'}>
                      {debugInfo.directAccessCheck ? 'TRUE' : 'FALSE'}
                    </Badge>
                  </div>
                  <div><strong>Product Access State:</strong></div>
                  <pre className="overflow-auto">{JSON.stringify(debugInfo.productAccess, null, 2)}</pre>
                </div>
              </div>
              
              <div className="p-4 bg-white border rounded">
                <h3 className="font-semibold text-gray-800 mb-2">User Products</h3>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(debugInfo.userProducts, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AccessDebugger;