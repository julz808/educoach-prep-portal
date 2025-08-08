import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserMetadataService } from '@/services/userMetadataService';

interface TestProduct {
  id: string;
  name: string;
  shortName: string;
  description: string;
  dbProductType: string; // Database product type for access control
}

interface ProductAccessInfo {
  hasAccess: boolean;
  isLoading: boolean;
  error?: string;
}

const testProducts: TestProduct[] = [
  { 
    id: 'year-5-naplan', 
    name: 'Year 5 NAPLAN', 
    shortName: 'Y5 NAPLAN', 
    description: 'Year 5 National Assessment',
    dbProductType: 'Year 5 NAPLAN'
  },
  { 
    id: 'year-7-naplan', 
    name: 'Year 7 NAPLAN', 
    shortName: 'Y7 NAPLAN', 
    description: 'Year 7 National Assessment',
    dbProductType: 'Year 7 NAPLAN'
  },
  { 
    id: 'acer-scholarship', 
    name: 'ACER Year 7 Entry', 
    shortName: 'ACER Y7', 
    description: 'ACER Year 7 Entry Test',
    dbProductType: 'ACER Scholarship (Year 7 Entry)'
  },
  { 
    id: 'edutest-scholarship', 
    name: 'EduTest Year 7 Entry', 
    shortName: 'EduTest Y7', 
    description: 'EduTest Year 7 Entry',
    dbProductType: 'EduTest Scholarship (Year 7 Entry)'
  },
  { 
    id: 'nsw-selective', 
    name: 'NSW Selective Entry', 
    shortName: 'NSW Selective', 
    description: 'NSW Selective Schools Test',
    dbProductType: 'NSW Selective Entry (Year 7 Entry)'
  },
  { 
    id: 'vic-selective', 
    name: 'VIC Selective Entry', 
    shortName: 'VIC Selective', 
    description: 'VIC Selective Schools Test',
    dbProductType: 'VIC Selective Entry (Year 9 Entry)'
  }
];

interface ProductContextType {
  selectedProduct: string;
  setSelectedProduct: (productId: string) => void;
  currentProduct: TestProduct | undefined;
  allProducts: TestProduct[];
  productAccess: ProductAccessInfo;
  checkProductAccess: (productId: string) => Promise<boolean>;
  hasAccessToCurrentProduct: boolean;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

interface ProductProviderProps {
  children: ReactNode;
}

export const ProductProvider: React.FC<ProductProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [selectedProduct, setSelectedProductState] = useState<string>(() => {
    // Initialize from localStorage or default to year-7-naplan
    const saved = localStorage.getItem('selectedProduct');
    return saved || 'year-7-naplan';
  });

  const [productAccess, setProductAccess] = useState<ProductAccessInfo>({
    hasAccess: false, // Default to false - require purchase
    isLoading: true, // Start with loading state
    error: undefined
  });

  const currentProduct = testProducts.find(product => product.id === selectedProduct);

  // Safe access control check with fallback
  const checkProductAccess = async (productId: string): Promise<boolean> => {
    if (!user) return false;

    const product = testProducts.find(p => p.id === productId);
    if (!product) return false;

    try {
      setProductAccess(prev => ({ ...prev, isLoading: true, error: undefined }));

      // Check if user has access to this product
      const hasAccess = await UserMetadataService.hasProductAccess(user.id, product.dbProductType);

      setProductAccess({
        hasAccess,
        isLoading: false,
        error: undefined
      });

      return hasAccess;
    } catch (error) {

      // SECURITY: If access check fails, deny access and show paywall
      setProductAccess({
        hasAccess: false,
        isLoading: false,
        error: 'Access check failed - please purchase to continue'
      });

      return false;
    }
  };

  // Check access when product changes
  useEffect(() => {
    if (user && currentProduct) {
      checkProductAccess(selectedProduct);
    }
  }, [selectedProduct, user, currentProduct]);

  // Persist to localStorage whenever selection changes
  const setSelectedProduct = (productId: string) => {
    setSelectedProductState(productId);
    localStorage.setItem('selectedProduct', productId);
  };

  const hasAccessToCurrentProduct = productAccess.hasAccess;

  const value: ProductContextType = {
    selectedProduct,
    setSelectedProduct,
    currentProduct,
    allProducts: testProducts,
    productAccess,
    checkProductAccess,
    hasAccessToCurrentProduct
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProduct = (): ProductContextType => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProduct must be used within a ProductProvider');
  }
  return context;
};

export { testProducts };
export type { TestProduct };
