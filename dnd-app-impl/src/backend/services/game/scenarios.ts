import { Scenario } from '@/shared/types/game';
import { supabase } from '@/lib/api/supabase';

// Mock data until we have a database set up
const MOCK_SCENARIOS: Record<string, Scenario> = {
  'AsianParent': {
    id: 'AsianParent',
    title: 'Raising Your Asian Child (Helicopter Parent Edition)',
    description: 'Navigate the challenges of being a demanding Asian parent determined to ensure your child\'s success at any cost.'
  },
  'WhiteHouse': {
    id: 'WhiteHouse',
    title: 'White House Chaos: Trump\'s Advisor',
    description: 'Survive the unpredictable world of presidential politics as an advisor in a chaotic White House administration.'
  }
};

/**
 * Get all available scenarios
 */
export async function getScenarios(): Promise<Scenario[]> {
  try {
    // In the future, replace with actual database query
    // const { data, error } = await supabase.from('scenarios').select('*');
    
    // For now, use mock data
    return Object.values(MOCK_SCENARIOS);
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    throw new Error('Failed to fetch scenarios');
  }
}

/**
 * Get a specific scenario by ID
 */
export async function getScenarioById(id: string): Promise<Scenario | null> {
  try {
    // In the future, replace with actual database query
    // const { data, error } = await supabase
    //   .from('scenarios')
    //   .select('*')
    //   .eq('id', id)
    //   .single();
    
    // For now, use mock data
    return MOCK_SCENARIOS[id] || null;
  } catch (error) {
    console.error(`Error fetching scenario with ID ${id}:`, error);
    throw new Error('Failed to fetch scenario');
  }
} 