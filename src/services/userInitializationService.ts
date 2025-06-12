import { grantProductAccess, getUserProductAccess } from './userMetadataService';
import { initializeUserProgress } from './userProgressService';

export interface UserInitializationData {
  userId: string;
  email: string;
  fullName?: string;
  yearLevel?: number;
  school?: string;
  selectedProducts: string[];
  stripeSubscriptionId?: string;
}

/**
 * Initialize a new user with their selected products and progress tracking
 */
export async function initializeNewUser(data: UserInitializationData): Promise<void> {
  try {
    // Grant access to selected products
    for (const productType of data.selectedProducts) {
      await grantProductAccess(data.userId, productType, data.stripeSubscriptionId);
      
      // Initialize progress tracking for each product
      await initializeUserProgress(data.userId, productType);
    }
    
    console.log(`Successfully initialized user ${data.userId} with products:`, data.selectedProducts);
  } catch (error) {
    console.error('Error initializing new user:', error);
    throw error;
  }
}

/**
 * Setup user for a new product (e.g., when they purchase additional products)
 */
export async function setupUserForProduct(
  userId: string, 
  productType: string, 
  stripeSubscriptionId?: string
): Promise<void> {
  try {
    // Grant product access
    await grantProductAccess(userId, productType, stripeSubscriptionId);
    
    // Initialize progress tracking
    await initializeUserProgress(userId, productType);
    
    console.log(`Successfully setup user ${userId} for product: ${productType}`);
  } catch (error) {
    console.error(`Error setting up user for product ${productType}:`, error);
    throw error;
  }
}

/**
 * Get user's current setup status
 */
export async function getUserSetupStatus(userId: string) {
  try {
    const productAccess = await getUserProductAccess(userId);
    
    return {
      hasProducts: productAccess.length > 0,
      activeProducts: productAccess.map(p => p.productType),
      needsSetup: productAccess.length === 0
    };
  } catch (error) {
    console.error('Error getting user setup status:', error);
    throw error;
  }
}

/**
 * Check if user needs onboarding for any products
 */
export async function checkOnboardingStatus(userId: string): Promise<{
  needsOnboarding: boolean;
  products: string[];
}> {
  try {
    const productAccess = await getUserProductAccess(userId);
    
    // For now, we'll consider a user needs onboarding if they have no diagnostic completion
    // This will be enhanced once we implement diagnostic tracking
    
    return {
      needsOnboarding: productAccess.length > 0,
      products: productAccess.map(p => p.productType)
    };
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return {
      needsOnboarding: false,
      products: []
    };
  }
} 