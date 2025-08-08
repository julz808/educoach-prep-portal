export interface Course {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  price: number;
  target: string;
  skills: string[];
  image: string;
  slug: string;
}

// Re-export other types that might be needed
export * from '../integrations/supabase/types';