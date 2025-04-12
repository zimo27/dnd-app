import { Scenario } from '@/shared/types/game';
import { supabase } from '@/lib/api/supabase';
import fs from 'fs';
import path from 'path';

// Mock data for listing scenarios (minimal info)
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
 * Get all available scenarios (minimal info for listing)
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
 * Get a specific scenario by ID with full data
 */
export async function getScenarioById(id: string): Promise<Scenario | null> {
  try {
    // Try to load the full scenario data from JSON file
    try {
      const scenarioPath = path.join(process.cwd(), 'public', 'scenarios', `${id}.json`);
      const fileContents = fs.readFileSync(scenarioPath, 'utf8');
      const fullScenario = JSON.parse(fileContents) as Scenario;
      
      // Add the basic info if not present in the JSON
      if (!fullScenario.id) {
        fullScenario.id = id;
      }
      
      if (!fullScenario.title && MOCK_SCENARIOS[id]) {
        fullScenario.title = MOCK_SCENARIOS[id].title;
      }
      
      if (!fullScenario.description && MOCK_SCENARIOS[id]) {
        fullScenario.description = MOCK_SCENARIOS[id].description;
      }
      
      return fullScenario;
    } catch (fsError) {
      console.error(`Error loading scenario file for ${id}:`, fsError);
      // Fall back to mock data if file reading fails
      return MOCK_SCENARIOS[id] || null;
    }
  } catch (error) {
    console.error(`Error fetching scenario with ID ${id}:`, error);
    throw new Error('Failed to fetch scenario');
  }
} 