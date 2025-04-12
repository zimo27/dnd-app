import { Scenario, GameState } from '@/shared/types/game';

/**
 * Fetch all available scenarios
 */
export async function fetchScenarios(): Promise<Scenario[]> {
  try {
    const response = await fetch('/api/scenarios');
    
    if (!response.ok) {
      throw new Error('Failed to fetch scenarios');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    throw error;
  }
}

/**
 * Fetch a specific scenario by ID
 */
export async function fetchScenarioById(id: string): Promise<Scenario> {
  try {
    console.log('Scenario ID requested:', id);
    const response = await fetch(`/api/scenarios/${id}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch scenario');
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching scenario ${id}:`, error);
    throw error;
  }
}

/**
 * Generate an AI response for the user's message
 */
export async function generateChatResponse(
  gameState: GameState, 
  message: string
): Promise<string> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gameState, message }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate response');
    }
    
    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Error generating chat response:', error);
    throw error;
  }
} 