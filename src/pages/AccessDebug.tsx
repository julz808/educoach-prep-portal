import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useProduct } from '@/context/ProductContext';
import { UserMetadataService } from '@/services/userMetadataService';
import { supabase } from '@/integrations/supabase/client';

const AccessDebug = () => {
  const { user } = useAuth();
  const { allProducts } = useProduct();
  const [debugData, setDebugData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const checkAllAccess = async () => {
    if (!user) return;
    
    setLoading(true);
    const results: any = {
      userId: user.id,
      userEmail: user.email,
      products: {}
    };

    // Check database directly
    const { data: userProducts, error } = await supabase
      .from('user_products')
      .select('*')
      .eq('user_id', user.id);

    results.databaseRecords = userProducts || [];
    results.databaseError = error;

    // Check access for each product
    for (const product of allProducts) {
      try {
        const hasAccess = await UserMetadataService.hasProductAccess(user.id, product.dbProductType);
        results.products[product.id] = {
          name: product.name,
          dbProductType: product.dbProductType,
          hasAccess,
          checkTime: new Date().toISOString()
        };
      } catch (error: any) {
        results.products[product.id] = {
          name: product.name,
          dbProductType: product.dbProductType,
          hasAccess: false,
          error: error.message
        };
      }
    }

    setDebugData(results);
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      checkAllAccess();
    }
  }, [user]);

  if (!user) {
    return <div>Please log in to debug access</div>;
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Access Control Debug</CardTitle>
          <Button onClick={checkAllAccess} disabled={loading}>
            {loading ? 'Checking...' : 'Refresh Access Check'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">User Info</h3>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify({
                userId: debugData.userId,
                userEmail: debugData.userEmail
              }, null, 2)}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Database Records</h3>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(debugData.databaseRecords || [], null, 2)}
            </pre>
            {debugData.databaseError && (
              <div className="text-red-600 mt-2">
                Error: {JSON.stringify(debugData.databaseError)}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-semibold mb-2">Product Access Results</h3>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(debugData.products || {}, null, 2)}
            </pre>
          </div>

          <div className="bg-yellow-50 p-4 rounded">
            <p className="text-sm font-semibold">Expected Access:</p>
            <ul className="text-sm mt-2 space-y-1">
              <li>• EduTest Scholarship (Year 7 Entry) - Should be TRUE</li>
              <li>• ACER Scholarship (Year 7 Entry) - Should be TRUE</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessDebug;