import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface TestProduct {
  id: string;
  name: string;
  shortName: string;
  description: string;
}

const testProducts: TestProduct[] = [
  { id: 'year-5-naplan', name: 'Year 5 NAPLAN', shortName: 'Y5 NAPLAN', description: 'Year 5 National Assessment' },
  { id: 'year-7-naplan', name: 'Year 7 NAPLAN', shortName: 'Y7 NAPLAN', description: 'Year 7 National Assessment' },
  { id: 'acer-year-7', name: 'ACER Year 7 Entry', shortName: 'ACER Y7', description: 'ACER Year 7 Entry Test' },
  { id: 'edutest-year-7', name: 'EduTest Year 7 Entry', shortName: 'EduTest Y7', description: 'EduTest Year 7 Entry' },
  { id: 'nsw-selective', name: 'NSW Selective Entry', shortName: 'NSW Selective', description: 'NSW Selective Schools Test' },
  { id: 'vic-selective', name: 'VIC Selective Entry', shortName: 'VIC Selective', description: 'VIC Selective Schools Test' }
];

interface ProductContextType {
  selectedProduct: string;
  setSelectedProduct: (productId: string) => void;
  currentProduct: TestProduct | undefined;
  allProducts: TestProduct[];
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

interface ProductProviderProps {
  children: ReactNode;
}

export const ProductProvider: React.FC<ProductProviderProps> = ({ children }) => {
  const [selectedProduct, setSelectedProductState] = useState<string>(() => {
    // Initialize from localStorage or default to year-7-naplan
    const saved = localStorage.getItem('selectedProduct');
    return saved || 'year-7-naplan';
  });

  // Persist to localStorage whenever selection changes
  const setSelectedProduct = (productId: string) => {
    setSelectedProductState(productId);
    localStorage.setItem('selectedProduct', productId);
  };

  const currentProduct = testProducts.find(product => product.id === selectedProduct);

  const value: ProductContextType = {
    selectedProduct,
    setSelectedProduct,
    currentProduct,
    allProducts: testProducts
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