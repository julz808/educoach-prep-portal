export interface ProductConfig {
  dbValue: string;
  displayName: string;
  hasDiagnostic: boolean;
  practiceTestCount: number;
  sections: string[];
  yearLevels?: number[];
  testDuration?: {
    diagnostic: number;
    practice: number;
  };
  colors?: {
    primary: string;
    secondary: string;
  };
}

export const productConfig: Record<string, ProductConfig> = {
  vic_selective: {
    dbValue: 'vic_selective',
    displayName: 'VIC Selective Entry',
    hasDiagnostic: true,
    practiceTestCount: 5,
    sections: [
      'Reading Reasoning',
      'Mathematical Reasoning', 
      'Verbal Reasoning',
      'Quantitative Reasoning',
      'Written Expression'
    ],
    yearLevels: [8, 9],
    testDuration: {
      diagnostic: 120,
      practice: 180
    },
    colors: {
      primary: '#3B82F6',
      secondary: '#1E40AF'
    }
  },
  naplan_yr5: {
    dbValue: 'naplan_yr5',
    displayName: 'NAPLAN Year 5',
    hasDiagnostic: true,
    practiceTestCount: 3,
    sections: [
      'Reading',
      'Writing', 
      'Language Conventions',
      'Numeracy'
    ],
    yearLevels: [5],
    testDuration: {
      diagnostic: 90,
      practice: 120
    },
    colors: {
      primary: '#10B981',
      secondary: '#059669'
    }
  },
  naplan_yr7: {
    dbValue: 'naplan_yr7',
    displayName: 'NAPLAN Year 7',
    hasDiagnostic: true,
    practiceTestCount: 3,
    sections: [
      'Reading',
      'Writing',
      'Language Conventions', 
      'Numeracy'
    ],
    yearLevels: [7],
    testDuration: {
      diagnostic: 100,
      practice: 140
    },
    colors: {
      primary: '#F59E0B',
      secondary: '#D97706'
    }
  },
  naplan_yr9: {
    dbValue: 'naplan_yr9',
    displayName: 'NAPLAN Year 9',
    hasDiagnostic: true,
    practiceTestCount: 3,
    sections: [
      'Reading',
      'Writing',
      'Language Conventions',
      'Numeracy'
    ],
    yearLevels: [9],
    testDuration: {
      diagnostic: 110,
      practice: 150
    },
    colors: {
      primary: '#EF4444',
      secondary: '#DC2626'
    }
  },
  edutest: {
    dbValue: 'edutest',
    displayName: 'EduTest Scholarship',
    hasDiagnostic: true,
    practiceTestCount: 4,
    sections: [
      'Reading Comprehension',
      'Verbal Reasoning',
      'Numerical Reasoning',
      'Mathematics',
      'Written Expression'
    ],
    yearLevels: [6, 7],
    testDuration: {
      diagnostic: 100,
      practice: 150
    },
    colors: {
      primary: '#8B5CF6',
      secondary: '#7C3AED'
    }
  },
  acer: {
    dbValue: 'acer',
    displayName: 'ACER Scholarship',
    hasDiagnostic: true,
    practiceTestCount: 4,
    sections: [
      'Mathematics',
      'Humanities', 
      'Written Expression'
    ],
    yearLevels: [6, 7],
    testDuration: {
      diagnostic: 90,
      practice: 120
    },
    colors: {
      primary: '#F97316',
      secondary: '#EA580C'
    }
  }
};

/**
 * Get configuration for a specific product
 */
export function getProductConfig(productType: string): ProductConfig {
  return productConfig[productType] || productConfig.vic_selective;
}

/**
 * Get all available products
 */
export function getAllProducts(): ProductConfig[] {
  return Object.values(productConfig);
}

/**
 * Get products by year level
 */
export function getProductsByYearLevel(yearLevel: number): ProductConfig[] {
  return Object.values(productConfig).filter(config => 
    config.yearLevels?.includes(yearLevel)
  );
}

/**
 * Get section configuration for a product
 */
export function getProductSections(productType: string): string[] {
  const config = getProductConfig(productType);
  return config.sections;
}

/**
 * Check if product has diagnostic test
 */
export function hasDiagnosticTest(productType: string): boolean {
  const config = getProductConfig(productType);
  return config.hasDiagnostic;
}

/**
 * Get practice test count for product
 */
export function getPracticeTestCount(productType: string): number {
  const config = getProductConfig(productType);
  return config.practiceTestCount;
}

/**
 * Get test duration configuration
 */
export function getTestDuration(productType: string, testType: 'diagnostic' | 'practice'): number {
  const config = getProductConfig(productType);
  return config.testDuration?.[testType] || 120;
}

/**
 * Get product theme colors
 */
export function getProductColors(productType: string): { primary: string; secondary: string } {
  const config = getProductConfig(productType);
  return config.colors || { primary: '#3B82F6', secondary: '#1E40AF' };
}

/**
 * Convert display name back to database value
 */
export function getDbValueFromDisplayName(displayName: string): string | null {
  const product = Object.values(productConfig).find(config => 
    config.displayName === displayName
  );
  return product?.dbValue || null;
}

/**
 * Validate if a product type is supported
 */
export function isValidProductType(productType: string): boolean {
  return productType in productConfig;
}

/**
 * Get product routing path
 */
export function getProductPath(productType: string): string {
  return `/dashboard/${productType}`;
}

/**
 * Get section-specific configuration if needed
 */
export function getSectionConfig(productType: string, sectionName: string) {
  // This can be extended for section-specific configurations
  // For now, we'll return basic info
  return {
    name: sectionName,
    productType,
    isWriting: sectionName.toLowerCase().includes('writing') || sectionName.toLowerCase().includes('expression'),
    isReading: sectionName.toLowerCase().includes('reading'),
    isMath: sectionName.toLowerCase().includes('math') || sectionName.toLowerCase().includes('numeracy') || sectionName.toLowerCase().includes('quantitative'),
    isVerbal: sectionName.toLowerCase().includes('verbal') || sectionName.toLowerCase().includes('language')
  };
} 