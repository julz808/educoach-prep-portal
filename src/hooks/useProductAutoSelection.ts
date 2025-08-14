import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserMetadataService } from '@/services/userMetadataService';

const PRODUCT_TYPE_TO_ID: Record<string, string> = {
  'Year 5 NAPLAN': 'year-5-naplan',
  'Year 7 NAPLAN': 'year-7-naplan',
  'EduTest Scholarship (Year 7 Entry)': 'edutest-scholarship',
  'ACER Scholarship (Year 7 Entry)': 'acer-scholarship',
  'NSW Selective Entry (Year 7 Entry)': 'nsw-selective',
  'VIC Selective Entry (Year 9 Entry)': 'vic-selective'
};

export const useProductAutoSelection = (
  selectedProduct: string,
  setSelectedProduct: (productId: string) => void
) => {
  const { user } = useAuth();
  const hasRunAutoSelection = useRef(false);

  useEffect(() => {
    const autoSelectUserProduct = async () => {
      if (!user) return;

      // Only run auto-selection once per session, not on every product change
      if (hasRunAutoSelection.current) {
        console.log('🔄 Auto-selection already completed this session, skipping');
        return;
      }

      try {
        // Get user's purchased products
        const userProducts = await UserMetadataService.getUserProducts(user.id);
        
        if (userProducts.length === 0) {
          console.log('🔍 No products found for user, keeping default selection');
          hasRunAutoSelection.current = true;
          return;
        }

        // Check if user has the currently selected product
        const hasCurrentProduct = userProducts.some(
          product => PRODUCT_TYPE_TO_ID[product.product_type] === selectedProduct
        );

        if (hasCurrentProduct) {
          console.log('✅ User has access to currently selected product:', selectedProduct);
          hasRunAutoSelection.current = true;
          return;
        }

        // Auto-select the first product the user has access to (only on initial load)
        const firstUserProduct = userProducts[0];
        const productId = PRODUCT_TYPE_TO_ID[firstUserProduct.product_type];
        
        if (productId && productId !== selectedProduct) {
          console.log(`🔄 Auto-selecting user's purchased product (initial load):`, {
            from: selectedProduct,
            to: productId,
            productType: firstUserProduct.product_type
          });
          
          setSelectedProduct(productId);
        }

        // Mark that we've completed auto-selection
        hasRunAutoSelection.current = true;
        
      } catch (error) {
        console.error('❌ Error in product auto-selection:', error);
        hasRunAutoSelection.current = true;
      }
    };

    // Run auto-selection after a short delay to ensure auth is ready
    const timer = setTimeout(autoSelectUserProduct, 1000);
    return () => clearTimeout(timer);
    
  }, [user]); // Remove selectedProduct and setSelectedProduct from dependencies
};