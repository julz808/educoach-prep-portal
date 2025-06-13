import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type UserProducts = Database['public']['Tables']['user_products']['Row'];
type UserProductInsert = Database['public']['Tables']['user_products']['Insert'];

export interface UserMetadata {
  userId: string;
  email: string;
  fullName?: string;
  yearLevel?: number;
  school?: string;
  targetExam?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProductAccess {
  productType: string;
  isActive: boolean;
  purchasedAt: string;
  stripeSubscriptionId?: string;
}

/**
 * Get user metadata from auth.users
 */
export async function getUserMetadata(userId: string): Promise<UserMetadata | null> {
  const { data, error } = await supabase.auth.getUser();
  
  if (error || !data.user) {
    console.error('Error fetching user metadata:', error);
    return null;
  }
  
  return {
    userId: data.user.id,
    email: data.user.email || '',
    fullName: data.user.user_metadata?.full_name,
    yearLevel: data.user.user_metadata?.year_level,
    school: data.user.user_metadata?.school,
    targetExam: data.user.user_metadata?.target_exam,
    createdAt: data.user.created_at,
    updatedAt: data.user.updated_at || data.user.created_at
  };
}

/**
 * Update user metadata
 */
export async function updateUserMetadata(updates: Partial<UserMetadata>): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    data: {
      full_name: updates.fullName,
      year_level: updates.yearLevel,
      school: updates.school,
      target_exam: updates.targetExam
    }
  });
  
  if (error) {
    console.error('Error updating user metadata:', error);
    throw error;
  }
}

/**
 * Get user's product access
 */
export async function getUserProductAccess(userId: string): Promise<UserProductAccess[]> {
  const { data, error } = await supabase
    .from('user_products')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);
  
  if (error) {
    console.error('Error fetching user product access:', error);
    throw error;
  }
  
  return data?.map(item => ({
    productType: item.product_type,
    isActive: item.is_active,
    purchasedAt: item.purchased_at,
    stripeSubscriptionId: item.stripe_subscription_id
  })) || [];
}

/**
 * Grant product access to user
 */
export async function grantProductAccess(
  userId: string, 
  productType: string, 
  stripeSubscriptionId?: string
): Promise<void> {
  const { error } = await supabase
    .from('user_products')
    .insert({
      user_id: userId,
      product_type: productType,
      is_active: true,
      stripe_subscription_id: stripeSubscriptionId,
      purchased_at: new Date().toISOString()
    });
  
  if (error) {
    console.error('Error granting product access:', error);
    throw error;
  }
}

/**
 * Check if user has access to a specific product
 */
export async function hasProductAccess(userId: string, productType: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_products')
    .select('id')
    .eq('user_id', userId)
    .eq('product_type', productType)
    .eq('is_active', true)
    .single();
  
  if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
    console.error('Error checking product access:', error);
    return false;
  }
  
  return !!data;
}

/**
 * Revoke product access
 */
export async function revokeProductAccess(userId: string, productType: string): Promise<void> {
  const { error } = await supabase
    .from('user_products')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('product_type', productType);
  
  if (error) {
    console.error('Error revoking product access:', error);
    throw error;
  }
}

export class UserMetadataService {
  /**
   * Get user's purchased products
   */
  static async getUserProducts(userId: string): Promise<UserProducts[]> {
    try {
      const { data, error } = await supabase
        .from('user_products')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching user products:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserProducts:', error);
      throw error;
    }
  }

  /**
   * Check if user has access to a specific product
   */
  static async hasProductAccess(userId: string, productType: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_products')
        .select('id')
        .eq('user_id', userId)
        .eq('product_type', productType)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking product access:', error);
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Error in hasProductAccess:', error);
      return false;
    }
  }

  /**
   * Add a product to user's purchased products
   */
  static async addUserProduct(productData: UserProductInsert): Promise<UserProducts> {
    try {
      const { data, error } = await supabase
        .from('user_products')
        .insert(productData)
        .select()
        .single();

      if (error) {
        console.error('Error adding user product:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in addUserProduct:', error);
      throw error;
    }
  }

  /**
   * Update user product (e.g., deactivate)
   */
  static async updateUserProduct(
    userId: string,
    productType: string,
    updates: Partial<UserProducts>
  ): Promise<UserProducts> {
    try {
      const { data, error } = await supabase
        .from('user_products')
        .update(updates)
        .eq('user_id', userId)
        .eq('product_type', productType)
        .select()
        .single();

      if (error) {
        console.error('Error updating user product:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateUserProduct:', error);
      throw error;
    }
  }

  /**
   * Get user's active product types
   */
  static async getActiveProductTypes(userId: string): Promise<string[]> {
    try {
      const products = await this.getUserProducts(userId);
      return products.map(product => product.product_type);
    } catch (error) {
      console.error('Error in getActiveProductTypes:', error);
      return [];
    }
  }

  /**
   * Check if user has any active products
   */
  static async hasAnyActiveProducts(userId: string): Promise<boolean> {
    try {
      const products = await this.getUserProducts(userId);
      return products.length > 0;
    } catch (error) {
      console.error('Error in hasAnyActiveProducts:', error);
      return false;
    }
  }

  static async getUserMetadata(userId: string) {
    // Placeholder implementation
    return {};
  }

  static async updateUserMetadata(userId: string, metadata: any) {
    // Placeholder implementation
    return true;
  }
}

export default UserMetadataService; 