import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Initialize the Supabase client with enhanced session persistence options
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'dnd-app-auth',
  },
});

// Database table types
export type User = {
  id: string;
  email: string;
  created_at: string;
};

export type GameState = {
  id: string;
  user_id: string;
  scenario_id: string;
  character_data: {
    attributes: Record<string, number>;
    skills: Record<string, boolean>;
    customizations: Record<string, string>;
  };
  history: Array<{
    message: string;
    sender: 'user' | 'system';
    timestamp: string;
    roll?: {
      value: number;
      attribute: string;
      modified_value: number;
    };
  }>;
  created_at: string;
  updated_at: string;
}; 