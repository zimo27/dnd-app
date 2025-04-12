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
      console.log(`Attempting to read scenario file from: ${scenarioPath}`);
      
      const fileContents = fs.readFileSync(scenarioPath, 'utf8');
      console.log(`Successfully read file for scenario: ${id}`);
      
      const jsonData = JSON.parse(fileContents);
      console.log(`JSON parsed for scenario ${id}:`, jsonData);
      
      // Map the JSON structure to match the expected Scenario interface
      const fullScenario: Scenario = {
        id: id,
        title: jsonData["Dnd-Scenario"] || (MOCK_SCENARIOS[id]?.title || ''),
        description: MOCK_SCENARIOS[id]?.description || '',
        "Dnd-Scenario": jsonData["Dnd-Scenario"],
        attributes: jsonData.attributes,
        baseSkills: jsonData.baseSkills,
        startingPoint: jsonData.startingPoint,
        playerCustomizations: jsonData.playerCustomizations
      };
      
      console.log(`Mapped scenario data:`, fullScenario);
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