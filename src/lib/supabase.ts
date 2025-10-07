import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos para TypeScript
export interface DatabaseUser {
  id: string;
  username: string;
  password_hash: string;
  profile_picture: string;
  description: string;
  is_public: boolean;
  favorite_platform: string;
  schedule: any[];
  created_at: string;
  updated_at: string;
}

export interface GameList {
  id: string;
  user_id: string;
  list_type: 'playing' | 'completed' | 'dropped' | 'wishlist' | 'recommendations';
  game_data: any[];
  created_at: string;
  updated_at: string;
}
