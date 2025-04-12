import { createClient } from '@supabase/supabase-js';
import { User, GameState } from '@/shared/types';

// Initialize the Supabase client
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// User management
export async function getUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user as User | null;
}

export async function signOut() {
  return await supabase.auth.signOut();
}

// Game state management
export async function saveGameState(gameState: Omit<GameState, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('game_states')
    .insert([{
      ...gameState,
      updated_at: new Date().toISOString()
    }])
    .select();
  
  if (error) {
    console.error('Error saving game state:', error);
    return null;
  }
  
  return data[0] as GameState;
}

export async function updateGameState(id: string, updates: Partial<GameState>) {
  const { data, error } = await supabase
    .from('game_states')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select();
  
  if (error) {
    console.error('Error updating game state:', error);
    return null;
  }
  
  return data[0] as GameState;
}

export async function getGameState(id: string) {
  const { data, error } = await supabase
    .from('game_states')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching game state:', error);
    return null;
  }
  
  return data as GameState;
}

export async function getUserGameStates(userId: string) {
  const { data, error } = await supabase
    .from('game_states')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching user game states:', error);
    return [];
  }
  
  return data as GameState[];
} 